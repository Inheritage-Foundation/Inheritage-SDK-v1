import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { InheritageClient } from "../src/client"

const rateLimitHeaders = {
  "X-RateLimit-Limit": "120",
  "X-RateLimit-Remaining": "118",
  "X-RateLimit-Reset": `${Math.floor(Date.now() / 1000) + 60}`,
}

describe("InheritageClient", () => {
  const client = new InheritageClient()
  const originalFetch = globalThis.fetch
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it("fetches dataset manifest and returns metadata", async () => {
    const body = {
      dataset: { name: "Inheritage Cultural Heritage Dataset" },
      links: [{ rel: "openapi", href: "https://inheritage.foundation/openapi/v1.yaml" }],
    }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Trace-Id": "trace-123",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getDatasetManifest()

    expect(fetchMock).toHaveBeenCalledWith("https://inheritage.foundation/api/v1/", {
      method: "GET",
      headers: expect.any(Headers),
      body: undefined,
      signal: undefined,
    })
    expect(result.data).not.toBeNull()
    const manifest = result.data!
    const dataset = manifest.dataset as { name: string }
    expect(dataset.name).toBe("Inheritage Cultural Heritage Dataset")
    expect(result.traceId).toBe("trace-123")
    expect(result.rateLimit).toEqual({
      limit: 120,
      remaining: 118,
      reset: Number(rateLimitHeaders["X-RateLimit-Reset"]),
    })
    expect(result.notModified).toBe(false)
  })

  it("marks responses with 304 status as not modified", async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 304,
        headers: {
          "X-Trace-Id": "trace-304",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.listHeritage()

    expect(result.notModified).toBe(true)
    expect(result.data).toBeNull()
  })

  it("throws InheritageApiError with envelope metadata on API errors", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMITED",
            message: "Rate limit exceeded.",
            hint: "Respect Retry-After.",
            doc: "https://inheritage.foundation/docs/api/errors#RATE_LIMITED",
            trace_id: "trace-429",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "30",
            ...rateLimitHeaders,
          },
        }
      )
    )

    await expect(client.getRandomHeritage()).rejects.toMatchObject({
      name: "InheritageApiError",
      status: 429,
      code: "RATE_LIMITED",
      hint: "Respect Retry-After.",
      traceId: "trace-429",
      retryAfter: 30,
      rateLimit: {
        limit: 120,
        remaining: 118,
        reset: Number(rateLimitHeaders["X-RateLimit-Reset"]),
      },
    })
  })
})

