/// <reference types="vitest" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { InheritageClient } from "../src/client"

const rateLimitHeaders = {
  "X-RateLimit-Limit": "120",
  "X-RateLimit-Remaining": "118",
  "X-RateLimit-Reset": `${Math.floor(Date.now() / 1000) + 60}`,
}

describe("InheritageClient", () => {
  const originalFetch = globalThis.fetch
  let fetchMock: ReturnType<typeof vi.fn>
  let client: InheritageClient

  beforeEach(() => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    client = new InheritageClient()
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

  it("fetches heritage filter facets", async () => {
    const body = {
      filters: {
        states: ["Karnataka"],
        countries: ["India"],
        dynasties: ["Vijayanagara"],
        styles: ["Dravidian"],
        materials: ["Granite"],
        periods: ["12th Century"],
        categories: ["Temple"],
      },
      generated_at: "2025-11-12T00:00:00Z",
    }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getHeritageFilters()
    expect(fetchMock).toHaveBeenCalledWith("https://inheritage.foundation/api/v1/heritage/filters", {
      method: "GET",
      headers: expect.any(Headers),
      body: undefined,
      signal: undefined,
    })
    expect(result.data.filters.states).toContain("Karnataka")
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

  it("fetches AI metadata bundle with checksum and license details", async () => {
    const body = {
      slug: "taj-mahal",
      name: "Taj Mahal",
      locale: "Uttar Pradesh",
      license: {
        name: "CC BY 4.0",
        citation_required: true,
        ai_use_allowed: true,
        ai_license_terms: "https://inheritage.foundation/license/ai",
      },
      model: "inheritage-d1",
      model_version: "2025-01-15",
      prompt_template_version: "v1.1.0",
      retrieval_policy: "full:v1",
      embedding_dimensions: 1536,
      embedding_checksum: "abc123",
      embeddings_last_updated: "2025-01-01T00:00:00Z",
      context: "Context string.",
      citations: [
        {
          name: "Inheritage Foundation",
          license: "CC BY 4.0",
          required_display: "Data © Inheritage Foundation",
        },
      ],
      same_as: ["https://www.wikidata.org/wiki/Q913"],
      sources: [
        {
          type: "heritage_site",
          slug: "taj-mahal",
          confidence: 1,
          retrieval_method: "deterministic_context",
        },
      ],
      safety_annotations: [],
    }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Trace-Id": "trace-meta",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getAIMetadata("taj-mahal")
    expect(fetchMock).toHaveBeenCalledWith("https://inheritage.foundation/api/v1/ai/meta/taj-mahal", {
      method: "GET",
      headers: expect.any(Headers),
      body: undefined,
      signal: undefined,
    })
    expect(result.data.embedding_checksum).toBe("abc123")
    expect(result.data.license.ai_license_terms).toContain("/license/ai")
    expect(result.data.sources).toHaveLength(1)
    expect(result.traceId).toBe("trace-meta")
  })

  it("retrieves featured timeline links", async () => {
    const body = {
      timelines: [
        { name: "Timeline of Temple Architecture in India", href: "/timeline/temples-in-india" },
      ],
    }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getTimelineFeatured()
    expect(fetchMock).toHaveBeenCalledWith("https://inheritage.foundation/api/v1/timeline/featured", {
      method: "GET",
      headers: expect.any(Headers),
      body: undefined,
      signal: undefined,
    })
    expect(result.data.timelines?.[0]?.href).toBe("/timeline/temples-in-india")
  })

  it("retrieves dataset changefeed entries", async () => {
    const body = {
      data: [
        {
          slug: "taj-mahal",
          updated_at: "2025-11-12T00:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
          published: true,
          operation: "upsert",
          checksum: "abc123",
          url: "https://inheritage.foundation/heritage/taj-mahal",
        },
      ],
      meta: {
        count: 1,
        limit: 10,
        since: "2025-11-01T00:00:00Z",
        next_since: null,
        has_more: false,
        dataset_hash: "sha256:xyz",
        last_updated: "2025-11-12T00:00:00Z",
      },
    }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitHeaders,
        },
      })
    )

    const since = new Date("2025-11-01T00:00:00Z")
    const result = await client.getChangefeed({ since, limit: 10 })
    const mockCall = fetchMock.mock.calls[0]
    if (mockCall && Array.isArray(mockCall)) {
      const [url] = mockCall
      expect(url).toBe("https://inheritage.foundation/api/v1/changes?since=2025-11-01T00%3A00%3A00.000Z&limit=10")
    }
    expect(result.data?.data?.[0]?.slug).toBe("taj-mahal")
    expect(result.data?.data?.[0]?.operation).toBe("upsert")
  })

  it("parses AI vector index NDJSON feed", async () => {
    const ndjson = [
      JSON.stringify({
        slug: "hampi",
        id: "1",
        name: "Group of Monuments at Hampi",
        text: "UNESCO World Heritage Site",
        vector: [0.1, 0.2],
        embedding_checksum: "checksum-1",
        embedding_dimensions: 2,
        model: "inheritage-d1",
        model_version: "2025-01-15",
        prompt_template_version: "v1.1.0",
        retrieval_policy: "full:v1",
        license: "CC BY 4.0",
        license_url: "https://inheritage.foundation/license/ai",
        updated_at: "2025-01-01T00:00:00Z",
      }),
      "",
    ].join("\n")

    fetchMock.mockResolvedValue(
      new Response(ndjson, {
        status: 200,
        headers: {
          "Content-Type": "application/x-ndjson",
          "X-Trace-Id": "trace-ndjson",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getAIVectorIndex({ limit: 1 })
    const mockCall = fetchMock.mock.calls[0]
    if (mockCall && Array.isArray(mockCall) && mockCall.length > 1) {
      const [, init] = mockCall
      const headers = new Headers(init?.headers as Record<string, string> | undefined)
      expect(headers.get("Accept")).toBe("application/x-ndjson")
    }
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0]?.slug).toBe("hampi")
    expect(result.data?.[0]?.embedding_checksum).toBe("checksum-1")
    expect(result.traceId).toBe("trace-ndjson")
  })

  it("retrieves AI license metadata", async () => {
    const body = {
      name: "Inheritage Foundation AI License Addendum",
      version: "2025.01",
      license: "CC BY 4.0",
      human_summary: "CC BY 4.0 with AI allowances.",
      url: "https://inheritage.foundation/license/ai",
      requirements: {
        attribution_header: "X-Inheritage-Attribution: visible",
        license_header: "X-Inheritage-License: CC-BY-4.0",
        ai_headers: {
          "AI-Use-Allowed": "true",
        },
        citation_snippets_endpoint: "https://inheritage.foundation/api/v1/citation/{slug}",
      },
      obligations: ["Display citation."],
      allowances: ["Train models."],
      prohibitions: ["Resell raw dataset."],
      enforcement: {
        violation_reporting: "https://inheritage.foundation/api/v1/citation/report",
        revocation_policy: "Keys can be revoked.",
        contact: "hello@inheritage.foundation",
      },
      citation_examples: [
        {
          name: "Inheritage Foundation",
          license: "CC BY 4.0",
          required_display: "Data © Inheritage Foundation",
        },
      ],
      trace_id: "trace-license",
    }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Trace-Id": "trace-license",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getAILicense()
    expect(fetchMock).toHaveBeenCalledWith("https://inheritage.foundation/api/v1/license/ai", {
      method: "GET",
      headers: expect.any(Headers),
      body: undefined,
      signal: undefined,
    })
    expect(result.data.requirements.ai_headers["AI-Use-Allowed"]).toBe("true")
    expect(result.traceId).toBe("trace-license")
  })

  it("streams heritage NDJSON dump as text", async () => {
    const ndjson = `{"slug": "site-1"}\n`
    fetchMock.mockResolvedValue(
      new Response(ndjson, {
        status: 200,
        headers: {
          "Content-Type": "application/x-ndjson",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getHeritageDump({ batch: 250 })
    const [url, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers as HeadersInit)
    expect(url).toBe("https://inheritage.foundation/api/v1/dump/heritage.ndjson?batch=250")
    expect(headers.get("Accept")).toBe("application/x-ndjson")
    expect(result.data).toBe(ndjson)
  })

  it("streams AI context dump with embedding flag", async () => {
    const jsonl = `{"slug":"site-1"}\n`
    fetchMock.mockResolvedValue(
      new Response(jsonl, {
        status: 200,
        headers: {
          "Content-Type": "application/jsonl",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getAIContextDump({ batch: 100, includeEmbedding: true })
    const [url, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers as HeadersInit)
    expect(url).toBe("https://inheritage.foundation/api/v1/dump/ai-context.jsonl?batch=100&include=embedding")
    expect(headers.get("Accept")).toBe("application/jsonl")
    expect(result.data).toBe(jsonl)
  })

  it("retrieves GeoJSON dump", async () => {
    const body = {
      type: "FeatureCollection",
      features: [],
      metadata: {
        total: 1,
        published: 1,
        last_updated: "2025-11-12T00:00:00Z",
        dataset_hash: "sha256:xyz",
      },
    }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/geo+json",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getGeoDump()
    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers as HeadersInit)
    expect(headers.get("Accept")).toBe("application/geo+json")
    expect((result.data as { metadata?: { total?: number } }).metadata?.total).toBe(1)
  })

  it("fetches CIDOC JSON-LD payload", async () => {
    const body = {
      "@context": "https://inheritage.foundation/context/cidoc-crm.jsonld",
      "@type": "E22_Human-Made_Object",
      name: "Taj Mahal",
    }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/ld+json",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getHeritageCIDOC("taj-mahal")
    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers as HeadersInit)
    expect(headers.get("Accept")).toBe("application/ld+json")
    expect((result.data as Record<string, unknown>)["@type"]).toBe("E22_Human-Made_Object")
  })

  it("fetches LIDO XML payload", async () => {
    const xml = `<lido:lido xmlns:lido="http://www.lido-schema.org">...</lido:lido>`

    fetchMock.mockResolvedValue(
      new Response(xml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getHeritageLIDO("red-fort", { download: true })
    const [url, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers as HeadersInit)
    expect(url).toBe("https://inheritage.foundation/api/v1/lido/red-fort?download=true")
    expect(headers.get("Accept")).toBe("application/xml")
    expect(result.data).toContain("<lido:lido")
  })

  it("exports LIDO ZIP archive", async () => {
    const buffer = new TextEncoder().encode("zip").buffer

    fetchMock.mockResolvedValue(
      new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.exportHeritageLIDO({ state: "Karnataka", limit: 10 })
    const [url, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers as HeadersInit)
    expect(url).toBe("https://inheritage.foundation/api/v1/lido/export?state=Karnataka&limit=10")
    expect(headers.get("Accept")).toBe("application/zip")
    expect(result.data).toBeInstanceOf(ArrayBuffer)
  })

  it("throws when calling vision context without image payload", async () => {
    await expect(client.getAIVisionContext({})).rejects.toThrow("Provide either image_url or image_base64")
  })

  it("calls vision context endpoint with image URL payload", async () => {
    const body = {
      matches: [],
      caption: null,
      architecture_style_prediction: null,
      embedding_model: "inheritage-d1",
      embedding_model_version: "2025-01-15",
      prompt_template_version: "v1.1.0",
      retrieval_policy: "full:v1",
      embedding_dimensions: 1536,
      embedding_checksum: "checksum-img",
      license: "CC BY 4.0",
      sources: [],
      safety_annotations: [],
      trace_id: "trace-vision",
    }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Trace-Id": "trace-vision",
          ...rateLimitHeaders,
        },
      })
    )

    const result = await client.getAIVisionContext({ image_url: "https://example.org/image.jpg" })
    expect(fetchMock).toHaveBeenCalledWith("https://inheritage.foundation/api/v1/ai/vision/context", {
      method: "POST",
      headers: expect.any(Headers),
      body: JSON.stringify({ image_url: "https://example.org/image.jpg" }),
      signal: undefined,
    })
    expect(result.data.embedding_checksum).toBe("checksum-img")
    expect(result.traceId).toBe("trace-vision")
  })
})

