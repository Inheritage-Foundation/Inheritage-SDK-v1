/**
 * LangChain Integration for Inheritage SDK
 * 
 * Runnable adapters and tools for LangChain/LangGraph agents
 * Enables AI assistants to access heritage data with proper attribution
 * 
 * @version 0.3.0
 * @author Ayush Mishra <hello@inheritage.foundation> (https://ayush.studio)
 * @license Apache-2.0
 * @copyright Team Inheritage
 */

import type {
  AIContextResponse,
  AIEmbeddingResponse,
  AIMetadataResponse,
  AISimilarResponse,
  AIVectorIndexParams,
  AIVectorRecord,
  AIVisionRequest,
  AIVisionResponse,
  AILicenseResponse,
} from "./types"
import type { ApiResponse } from "./types"
import type { InheritageClient } from "./client"

export interface RunnableConfig {
  signal?: AbortSignal
}

export interface Runnable<Input, Output> {
  invoke(input: Input, config?: RunnableConfig): Promise<Output>
}

export interface HeritageContextInput {
  slug: string
}

export interface HeritageEmbeddingInput {
  slug: string
}

export interface HeritageSimilarInput {
  slug?: string
  embedding?: number[]
  limit?: number
}

export interface HeritageMetadataInput {
  slug: string
}

export interface HeritageVectorFeedInput extends AIVectorIndexParams {}

export interface HeritageVisionInput extends AIVisionRequest {}

export interface HeritageLicenseInput {
  verb?: "GET"
}

export interface RunnableResponse<T> {
  data: T
  traceId?: string
  headers: Headers
  rateLimit?: ApiResponse<T>["rateLimit"]
}

export interface HeritageContextRunnableOptions {
  client: Pick<InheritageClient, "getAIContext">
  includeHeaders?: boolean
}

export interface HeritageEmbeddingRunnableOptions {
  client: Pick<InheritageClient, "getAIEmbedding">
  includeHeaders?: boolean
}

export interface HeritageSimilarRunnableOptions {
  client: Pick<InheritageClient, "findSimilar">
  includeHeaders?: boolean
}

export interface HeritageMetadataRunnableOptions {
  client: Pick<InheritageClient, "getAIMetadata">
  includeHeaders?: boolean
}

export interface HeritageVectorRunnableOptions {
  client: Pick<InheritageClient, "getAIVectorIndex">
  includeHeaders?: boolean
}

export interface HeritageVisionRunnableOptions {
  client: Pick<InheritageClient, "getAIVisionContext">
  includeHeaders?: boolean
}

export interface HeritageLicenseRunnableOptions {
  client: Pick<InheritageClient, "getAILicense">
  includeHeaders?: boolean
}

function shapeResponse<T>(response: ApiResponse<T>, includeHeaders: boolean): RunnableResponse<T> | T {
  if (!includeHeaders) {
    return response.data
  }
  return {
    data: response.data,
    traceId: response.traceId,
    headers: response.headers,
    rateLimit: response.rateLimit,
  }
}

export function createHeritageContextRunnable(
  options: HeritageContextRunnableOptions
): Runnable<HeritageContextInput, RunnableResponse<AIContextResponse> | AIContextResponse> {
  return {
    async invoke(input: HeritageContextInput, config?: RunnableConfig) {
      if (!input?.slug) {
        throw new Error("slug is required")
      }
      const response = await options.client.getAIContext(input.slug, { signal: config?.signal })
      return shapeResponse(response, options.includeHeaders ?? false)
    },
  }
}

export function createHeritageEmbeddingRunnable(
  options: HeritageEmbeddingRunnableOptions
): Runnable<HeritageEmbeddingInput, RunnableResponse<AIEmbeddingResponse> | AIEmbeddingResponse> {
  return {
    async invoke(input: HeritageEmbeddingInput, config?: RunnableConfig) {
      if (!input?.slug) {
        throw new Error("slug is required")
      }
      const response = await options.client.getAIEmbedding(input.slug, { signal: config?.signal })
      return shapeResponse(response, options.includeHeaders ?? false)
    },
  }
}

export function createHeritageSimilarRunnable(
  options: HeritageSimilarRunnableOptions
): Runnable<HeritageSimilarInput, RunnableResponse<AISimilarResponse> | AISimilarResponse> {
  return {
    async invoke(input: HeritageSimilarInput, config?: RunnableConfig) {
      if (!input?.slug && !input?.embedding) {
        throw new Error("Provide either a slug or an embedding array")
      }
      const response = await options.client.findSimilar(
        {
          slug: input.slug,
          embedding: input.embedding,
          limit: input.limit,
        },
        { signal: config?.signal }
      )
      return shapeResponse(response, options.includeHeaders ?? false)
    },
  }
}

export function createHeritageMetadataRunnable(
  options: HeritageMetadataRunnableOptions
): Runnable<HeritageMetadataInput, RunnableResponse<AIMetadataResponse> | AIMetadataResponse> {
  return {
    async invoke(input: HeritageMetadataInput, config?: RunnableConfig) {
      if (!input?.slug) {
        throw new Error("slug is required")
      }
      const response = await options.client.getAIMetadata(input.slug, { signal: config?.signal })
      return shapeResponse(response, options.includeHeaders ?? false)
    },
  }
}

export function createHeritageVectorRunnable(
  options: HeritageVectorRunnableOptions
): Runnable<HeritageVectorFeedInput, RunnableResponse<AIVectorRecord[]> | AIVectorRecord[]> {
  return {
    async invoke(input: HeritageVectorFeedInput = {}, config?: RunnableConfig) {
      const response = await options.client.getAIVectorIndex(
        {
          limit: input.limit,
          offset: input.offset,
        },
        { signal: config?.signal }
      )
      return shapeResponse(response, options.includeHeaders ?? false)
    },
  }
}

export function createHeritageVisionRunnable(
  options: HeritageVisionRunnableOptions
): Runnable<HeritageVisionInput, RunnableResponse<AIVisionResponse> | AIVisionResponse> {
  return {
    async invoke(input: HeritageVisionInput, config?: RunnableConfig) {
      const response = await options.client.getAIVisionContext(input, { signal: config?.signal })
      return shapeResponse(response, options.includeHeaders ?? false)
    },
  }
}

export function createHeritageLicenseRunnable(
  options: HeritageLicenseRunnableOptions
): Runnable<HeritageLicenseInput, RunnableResponse<AILicenseResponse> | AILicenseResponse> {
  return {
    async invoke(_input: HeritageLicenseInput = {}, config?: RunnableConfig) {
      const response = await options.client.getAILicense({ signal: config?.signal })
      return shapeResponse(response, options.includeHeaders ?? false)
    },
  }
}

export interface InheritageTool {
  name: string
  description: string
  runnable: Runnable<any, any>
}

export interface CreateInheritageToolkitOptions {
  client: InheritageClient
  includeHeaders?: boolean
}

export function createInheritageToolkit(options: CreateInheritageToolkitOptions): InheritageTool[] {
  const includeHeaders = options.includeHeaders ?? false

  return [
    {
      name: "inheritage_context",
      description: "Fetch deterministic heritage context, embeddings, and metadata for a given slug.",
      runnable: createHeritageContextRunnable({ client: options.client, includeHeaders }),
    },
    {
      name: "inheritage_embedding",
      description: "Retrieve only the embedding vector for a heritage slug.",
      runnable: createHeritageEmbeddingRunnable({ client: options.client, includeHeaders }),
    },
    {
      name: "inheritage_similarity",
      description: "Run similarity search by slug or embedding array.",
      runnable: createHeritageSimilarRunnable({ client: options.client, includeHeaders }),
    },
    {
      name: "inheritage_metadata",
      description: "Fetch machine-readable AI metadata bundle for a heritage slug.",
      runnable: createHeritageMetadataRunnable({ client: options.client, includeHeaders }),
    },
    {
      name: "inheritage_vector_feed",
      description: "Return NDJSON vector slices for syncing into external vector databases.",
      runnable: createHeritageVectorRunnable({ client: options.client, includeHeaders }),
    },
    {
      name: "inheritage_vision",
      description: "Classify an image URL/Base64 payload into heritage matches and captions.",
      runnable: createHeritageVisionRunnable({ client: options.client, includeHeaders }),
    },
    {
      name: "inheritage_license",
      description: "Return the AI license addendum metadata (obligations, allowances, reporting).",
      runnable: createHeritageLicenseRunnable({ client: options.client, includeHeaders }),
    },
  ]
}


