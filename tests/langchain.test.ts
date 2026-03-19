// <reference types="vitest" />
import { describe, it, expect, vi } from "vitest"
import {
  createHeritageContextRunnable,
  createHeritageSimilarRunnable,
  createHeritageVectorRunnable,
  createInheritageToolkit,
} from "../src/langchain"
import type { ApiResponse, AIContextResponse, AISimilarResponse, AIVectorRecord } from "../src/types"

function buildResponse<T>(data: T): ApiResponse<T> {
  return {
    status: 200,
    data,
    headers: new Headers({ "X-Trace-Id": "trace-123" }),
    traceId: "trace-123",
    rateLimit: { limit: 120, remaining: 118, reset: Math.floor(Date.now() / 1000) + 60 },
    notModified: false,
  }
}

describe("LangChain helpers", () => {
  it("context runnable returns structured payload with metadata when includeHeaders=true", async () => {
    const data: AIContextResponse = {
      slug: "ram-mandir-ayodhya",
      context: " Ram Mandir Ayodhya is a historic Temple located in Uttar Pradesh, India. This Nagara Style, Hindu Temple, Curvilinear towers, elaborate carvings architectural masterpiece was built during the Contemporary Period period and represents significant cultural and historical heritage of India.",
      embedding: [0.1, 0.2],
      embedding_dimensions: 2,
      embedding_checksum: "checksum",
      model: "inheritage-d1",
      model_version: "2025-01-15",
      prompt_template_version: "v1.1.0",
      retrieval_policy: "full:v1",
      sources: [
        { type: "heritage_site", slug: "ram-mandir-ayodhya", confidence: 1, retrieval_method: "deterministic_context" },
      ],
      citation: "Data © Inheritage Foundation",
    }
    const mockClient = {
      getAIContext: vi.fn().mockResolvedValue(buildResponse(data)),
    }
    const runnable = createHeritageContextRunnable({ client: mockClient, includeHeaders: true })
    const response = await runnable.invoke({ slug: "ram-mandir-ayodhya" })
    if (!("data" in response)) {
      throw new Error("Expected response envelope with metadata")
    }
    expect(response.data.slug).toBe("ram-mandir-ayodhya")
    expect(response.traceId).toBe("trace-123")
    expect(mockClient.getAIContext).toHaveBeenCalledWith("ram-mandir-ayodhya", { signal: undefined })
  })

  it("similar runnable forwards slug or embedding to client", async () => {
    const data: AISimilarResponse = {
      data: [
        {
          score: 0.98,
          site: {
            id: "1",
            slug: "ram-mandir-ayodhya",
            uuid: "uuid-1",
            name: "Ram Mandir Ayodhya",
            summary: null,
            description: null,
            category: null,
            location: null,
            state: "Uttar Pradesh",
            country: "India",
            dynasty: null,
            period: null,
            year_built: null,
            built_by: null,
            heritage_status: null,
            preservation_status: null,
            coordinates: null,
            geolocation: null,
            materials: [],
            architecture: {
              style: null,
              structural_system: null,
              construction_technique: null,
              conservation_efforts: null,
              sustainability_features: null,
            },
            dimensions: {
              height: null,
              width: null,
              length: null,
              area: null,
              volume: null,
            },
            visitor_info: {
              visiting_hours: null,
              entry_fee: null,
              website: null,
              best_visit_times: null,
              facilities: [],
              restrictions: null,
              accessibility: null,
            },
            cultural_context: {
              history: null,
              cultural_significance: null,
              cultural_continuity: null,
              traditional_knowledge: null,
              seasonal_events: [],
            },
            tags: {
              category: null,
              dynasty: null,
              period: null,
              states: [],
            },
            media: {
              primary_image: null,
              gallery: [],
              panoramas: [],
              orthos: [],
              floor_plans: [],
              sections: [],
              site_plan: null,
              point_cloud: null,
              mesh_data: null,
              cad_files: [],
              videos: [],
              documents: [],
            },
            status: {
              completion_score: null,
              completion_status: null,
              is_featured: null,
              is_published: null,
              view_count: null,
            },
            timeline: [],
            references: [],
            analytics: {
              virtual_tour: {
                enabled: false,
                thumbnail: null,
                chapters_count: null,
                data_points_count: null,
                completion_rate: null,
                avg_session_duration: null,
                total_sessions: null,
              },
            },
            citations: [],
            official_url: "https://www.inheritage.foundation/heritage/ram-mandir-ayodhya",
            same_as: [],
          },
        },
      ],
      meta: {
        reference: "ram-mandir-ayodhya",
        limit: 5,
        embedding_model: "inheritage-d1",
        model_version: "2025-01-15",
        prompt_template_version: "v1.1.0",
      },
    }
    const mockClient = {
      findSimilar: vi.fn().mockResolvedValue(buildResponse(data)),
    }
    const runnable = createHeritageSimilarRunnable({ client: mockClient })
    const result = (await runnable.invoke({ slug: "ram-mandir-ayodhya" })) as AISimilarResponse
    expect(result.meta.reference).toBe("ram-mandir-ayodhya")
    expect(mockClient.findSimilar).toHaveBeenCalledWith(
      { slug: "ram-mandir-ayodhya", embedding: undefined, limit: undefined },
      { signal: undefined }
    )
  })

  it("vector runnable returns NDJSON array payload", async () => {
    const data: AIVectorRecord[] = [
      {
        slug: "hampi",
        id: "1",
        name: "Group of Monuments at Hampi",
        text: "UNESCO site in Karnataka.",
        vector: [0.1, 0.2],
        embedding_checksum: "checksum",
        embedding_dimensions: 2,
        model: "inheritage-d1",
        model_version: "2025-01-15",
        prompt_template_version: "v1.1.0",
        retrieval_policy: "full:v1",
        license: "CC BY 4.0",
        license_url: "https://www.inheritage.foundation/license/ai",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ]
    const mockClient = {
      getAIVectorIndex: vi.fn().mockResolvedValue(buildResponse(data)),
    }
    const runnable = createHeritageVectorRunnable({ client: mockClient, includeHeaders: true })
    const result = await runnable.invoke({ limit: 1 })
    if (!("data" in result)) {
      throw new Error("Expected result envelope with metadata")
    }
    expect(result.data).toHaveLength(1)
    expect(result.traceId).toBe("trace-123")
    expect(mockClient.getAIVectorIndex).toHaveBeenCalledWith({ limit: 1, offset: undefined }, { signal: undefined })
  })

  it("toolkit returns LangChain-friendly tool list", () => {
    const client = {} as unknown as any
    const toolkit = createInheritageToolkit(client as any)
    const names = toolkit.map((tool) => tool.name)
    expect(names).toEqual([
      "inheritage_context",
      "inheritage_embedding",
      "inheritage_similarity",
      "inheritage_metadata",
      "inheritage_vector_feed",
      "inheritage_vision",
      "inheritage_license",
    ])
  })
})


