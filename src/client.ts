import { InheritageApiError } from "./errors"
import {
  type AIContextResponse,
  type AIEmbeddingResponse,
  type AISimilarParams,
  type AISimilarResponse,
  type ApiRequestOptions,
  type ApiResponse,
  type CitationReportRequest,
  type CitationReportResponse,
  type CitationResponse,
  type DatasetManifest,
  type GeoFeature,
  type GeoFeatureCollection,
  type GeoHeritageParams,
  type GeoNearbyParams,
  type Heritage,
  type HeritageListParams,
  type HeritageListResponse,
  type HeritageSearchParams,
  type MediaResponse,
  type MediaSearchParams,
  type MediaSearchResponse,
  type RateLimitInfo,
  type StatsResponse,
} from "./types"

const DEFAULT_BASE_URL = "https://inheritage.foundation/api/v1"
const ATTRIBUTION_VISIBLE = "visible"
const ATTRIBUTION_SUPPRESSED = "suppressed"
const PLAN_PUBLIC = "public"
const PLAN_COMMERCIAL = "commercial"

export type AttributionMode = typeof ATTRIBUTION_VISIBLE | typeof ATTRIBUTION_SUPPRESSED
export type PlanMode = typeof PLAN_PUBLIC | typeof PLAN_COMMERCIAL

export interface InheritageClientOptions {
  baseUrl?: string
  attribution?: AttributionMode
  plan?: PlanMode
  fetch?: typeof globalThis.fetch
  userAgent?: string
  defaultHeaders?: HeadersInit
}

interface RequestOptions<TBody = unknown> extends ApiRequestOptions {
  method: string
  path: string
  body?: TBody
}

function ensureFetch(fetchImpl: typeof globalThis.fetch | undefined): typeof globalThis.fetch {
  if (typeof fetchImpl === "function") {
    return fetchImpl
  }
  if (typeof globalThis.fetch === "function") {
    return globalThis.fetch
  }
  throw new Error("Fetch API is not available. Provide a fetch implementation via options.fetch.")
}

function toRateLimit(headers: Headers): RateLimitInfo | undefined {
  const limit = headers.get("X-RateLimit-Limit")
  const remaining = headers.get("X-RateLimit-Remaining")
  const reset = headers.get("X-RateLimit-Reset")
  if (!limit || !remaining || !reset) return undefined
  const parsed = {
    limit: Number(limit),
    remaining: Number(remaining),
    reset: Number(reset),
  }
  if ([parsed.limit, parsed.remaining, parsed.reset].some((value) => Number.isNaN(value))) {
    return undefined
  }
  return parsed
}

function parseRetryAfter(headers: Headers): number | null {
  const retry = headers.get("Retry-After")
  if (!retry) return null
  const numeric = Number(retry)
  if (!Number.isNaN(numeric)) {
    return numeric
  }
  const date = new Date(retry)
  if (!Number.isNaN(date.getTime())) {
    return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000))
  }
  return null
}

function serializeQuery(params?: Record<string, string | number | boolean | null | undefined>): URLSearchParams {
  const search = new URLSearchParams()
  if (!params) return search
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    if (Array.isArray(value)) {
      ;(value as unknown[]).forEach((entry) => {
        if (entry === null || entry === undefined) return
        search.append(key, String(entry))
      })
      return
    }
    search.set(key, String(value))
  })
  return search
}

export class InheritageClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof globalThis.fetch
  private readonly attribution: AttributionMode
  private readonly plan: PlanMode
  private readonly baseHeaders: Headers

  constructor(options: InheritageClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "")
    this.attribution = options.attribution ?? ATTRIBUTION_VISIBLE
    this.plan = options.plan ?? PLAN_PUBLIC

    if (this.attribution === ATTRIBUTION_SUPPRESSED && this.plan !== PLAN_COMMERCIAL) {
      throw new Error(
        "Attribution mode `suppressed` requires `plan: \"commercial\"`. Falling back to the public tier will break the session contract."
      )
    }

    this.fetchImpl = ensureFetch(options.fetch)

    this.baseHeaders = new Headers()
    this.baseHeaders.set("Accept", "application/json")
    this.baseHeaders.set("X-Inheritage-Attribution", this.attribution)
    if (this.plan === PLAN_COMMERCIAL) {
      this.baseHeaders.set("X-Inheritage-Plan", PLAN_COMMERCIAL)
    }
    this.baseHeaders.set(
      "User-Agent",
      options.userAgent ?? "inheritage-sdk/0.1 (+https://inheritage.foundation/docs/api)"
    )

    if (options.defaultHeaders) {
      const defaults = new Headers(options.defaultHeaders)
      defaults.forEach((value, key) => {
        this.baseHeaders.set(key, value)
      })
    }
  }

  /**
   * Fetch API dataset manifest (JSON-LD Dataset + discovery links).
   */
  async getDatasetManifest(options: ApiRequestOptions = {}): Promise<ApiResponse<DatasetManifest>> {
    return this.send<DatasetManifest>({
      method: "GET",
      path: "/",
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Fetch aggregated dataset statistics.
   */
  async getStats(options: ApiRequestOptions = {}): Promise<ApiResponse<StatsResponse>> {
    return this.send<StatsResponse>({
      method: "GET",
      path: "/stats",
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Paginated heritage catalogue listing.
   */
  async listHeritage(params: HeritageListParams = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<HeritageListResponse>> {
    const query: Record<string, string | number | boolean | undefined> = {
      state: params.state,
      dynasty: params.dynasty,
      style: params.style,
      material: params.material,
      period: params.period,
      country: params.country,
      sort: params.sort,
      limit: params.limit,
      offset: params.offset,
    }
    if (params.fields?.length) {
      query.fields = params.fields.join(",")
    }

    return this.send<HeritageListResponse>({
      method: "GET",
      path: "/heritage",
      query,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Fetch heritage detail by slug.
   */
  async getHeritage(slug: string, params: { fields?: string[] } = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<Heritage>> {
    if (!slug || typeof slug !== "string") {
      throw new Error("slug is required")
    }

    const query: Record<string, string | undefined> = {}
    if (params.fields?.length) {
      query.fields = params.fields.join(",")
    }

    return this.send<Heritage>({
      method: "GET",
      path: `/heritage/${encodeURIComponent(slug)}`,
      query,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Search heritage catalogue.
   */
  async searchHeritage(params: HeritageSearchParams, options: ApiRequestOptions = {}): Promise<ApiResponse<{ data: Heritage[]; meta: { total: number; limit: number } }>> {
    if (!params?.q?.trim()) {
      throw new Error("search query `q` is required")
    }

    const query: Record<string, string | number | undefined> = {
      q: params.q,
      state: params.state,
      style: params.style,
      country: params.country,
      limit: params.limit,
    }
    if (params.fields?.length) {
      query.fields = params.fields.join(",")
    }

    return this.send({
      method: "GET",
      path: "/heritage/search",
      query,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Retrieve a random published heritage site.
   */
  async getRandomHeritage(options: ApiRequestOptions = {}): Promise<ApiResponse<Heritage>> {
    return this.send<Heritage>({
      method: "GET",
      path: "/heritage/random",
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * GeoJSON FeatureCollection of heritage sites.
   */
  async listGeoHeritage(params: GeoHeritageParams = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<GeoFeatureCollection>> {
    const query: Record<string, string | number | boolean | undefined> = {
      state: params.state,
      country: params.country,
      category: params.category,
      featured: params.featured ? "true" : undefined,
      limit: params.limit,
      bbox: params.bbox,
    }

    return this.send<GeoFeatureCollection>({
      method: "GET",
      path: "/geo/heritage",
      query,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * GeoJSON Feature for a heritage site.
   */
  async getGeoFeature(slug: string, options: ApiRequestOptions = {}): Promise<ApiResponse<GeoFeature>> {
    if (!slug || typeof slug !== "string") {
      throw new Error("slug is required")
    }

    return this.send<GeoFeature>({
      method: "GET",
      path: `/geo/heritage/${encodeURIComponent(slug)}`,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Nearby heritage sites (GeoJSON FeatureCollection).
   */
  async getGeoNearby(params: GeoNearbyParams, options: ApiRequestOptions = {}): Promise<ApiResponse<GeoFeatureCollection>> {
    if (!Number.isFinite(params?.lat) || !Number.isFinite(params?.lon)) {
      throw new Error("lat and lon parameters are required numeric values")
    }

    const query: Record<string, string | number> = {
      lat: params.lat,
      lon: params.lon,
    }
    if (params.radius_km !== undefined) {
      query.radius_km = params.radius_km
    }

    return this.send<GeoFeatureCollection>({
      method: "GET",
      path: "/geo/nearby",
      query,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Media bundle for a heritage site.
   */
  async getMedia(slug: string, options: ApiRequestOptions = {}): Promise<ApiResponse<MediaResponse>> {
    if (!slug || typeof slug !== "string") {
      throw new Error("slug is required")
    }
    return this.send<MediaResponse>({
      method: "GET",
      path: `/media/${encodeURIComponent(slug)}`,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Media search across heritage sites.
   */
  async searchMedia(params: MediaSearchParams = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<MediaSearchResponse>> {
    const query: Record<string, string | number | undefined> = {
      type: params.type,
      state: params.state,
      style: params.style,
      country: params.country,
      limit: params.limit,
      offset: params.offset,
    }

    return this.send<MediaSearchResponse>({
      method: "GET",
      path: "/media/search",
      query,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Random media bundle (up to five attempts server-side).
   */
  async getRandomMedia(options: ApiRequestOptions = {}): Promise<ApiResponse<MediaResponse>> {
    return this.send<MediaResponse>({
      method: "GET",
      path: "/media/random",
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Canonical citation snippet.
   */
  async getCitation(entityId: string, options: ApiRequestOptions = {}): Promise<ApiResponse<CitationResponse>> {
    if (!entityId || typeof entityId !== "string") {
      throw new Error("entityId is required")
    }

    return this.send<CitationResponse>({
      method: "GET",
      path: `/citation/${encodeURIComponent(entityId)}`,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Record citation display telemetry (optional).
   */
  async reportCitation(body: CitationReportRequest, options: ApiRequestOptions = {}): Promise<ApiResponse<CitationReportResponse>> {
    if (!body?.entity || !body.app_name || !body.domain) {
      throw new Error("entity, app_name, and domain are required fields")
    }

    return this.send<CitationReportResponse>({
      method: "POST",
      path: "/citation/report",
      body,
      signal: options.signal,
    })
  }

  /**
   * Deterministic AI context narrative + embedding.
   */
  async getAIContext(slug: string, options: ApiRequestOptions = {}): Promise<ApiResponse<AIContextResponse>> {
    if (!slug || typeof slug !== "string") {
      throw new Error("slug is required")
    }

    return this.send<AIContextResponse>({
      method: "GET",
      path: `/ai/context/${encodeURIComponent(slug)}`,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Deterministic embedding vector for a heritage site.
   */
  async getAIEmbedding(slug: string, options: ApiRequestOptions = {}): Promise<ApiResponse<AIEmbeddingResponse>> {
    if (!slug || typeof slug !== "string") {
      throw new Error("slug is required")
    }

    return this.send<AIEmbeddingResponse>({
      method: "GET",
      path: `/ai/embedding/${encodeURIComponent(slug)}`,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Embedding similarity search.
   */
  async findSimilar(params: AISimilarParams, options: ApiRequestOptions = {}): Promise<ApiResponse<AISimilarResponse>> {
    if (!params?.slug && !params?.embedding) {
      throw new Error("Provide either a slug or an embedding array")
    }
    if (params.embedding && !Array.isArray(params.embedding)) {
      throw new Error("embedding must be an array of numbers")
    }

    const body: Record<string, unknown> = {}
    if (params.slug) {
      body.slug = params.slug
    }
    if (params.embedding) {
      body.embedding = params.embedding
    }
    if (params.limit !== undefined) {
      body.limit = params.limit
    }

    return this.send<AISimilarResponse>({
      method: "POST",
      path: "/ai/similar",
      body,
      signal: options.signal,
    })
  }

  /**
   * Low-level request helper.
   */
  private async send<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const base = this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`
    const relativePath = (options.path ?? "").replace(/^\/+/, "")
    const url = new URL(relativePath, base)

    if (options.query) {
      const query = serializeQuery(options.query)
      if ([...query.keys()].length > 0) {
        const existing = url.searchParams
        query.forEach((value, key) => {
          existing.set(key, value)
        })
      }
    }

    const headers = this.prepareHeaders(options.headers, options.body)

    if (options.ifNoneMatch) {
      headers.set("If-None-Match", options.ifNoneMatch)
    }
    if (options.ifModifiedSince) {
      headers.set("If-Modified-Since", options.ifModifiedSince)
    }

    let payload: BodyInit | undefined
    if (options.body !== undefined && options.body !== null) {
      if (typeof options.body === "string" || options.body instanceof URLSearchParams || options.body instanceof FormData || options.body instanceof Blob || options.body instanceof ArrayBuffer) {
        payload = options.body as BodyInit
      } else {
        payload = JSON.stringify(options.body)
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json; charset=utf-8")
        }
      }
    }

    const response = await this.fetchImpl(url.toString(), {
      method: options.method,
      headers,
      body: payload,
      signal: options.signal,
    })

    const traceId = response.headers.get("X-Trace-Id") ?? undefined
    const rateLimit = toRateLimit(response.headers)

    if (response.status === 304) {
      return {
        status: response.status,
        data: null as T,
        headers: response.headers,
        traceId,
        rateLimit,
        notModified: true,
      }
    }

    let parsedBody: unknown = null
    const contentType = response.headers.get("Content-Type") || ""

    if (response.status !== 204 && contentType.includes("application/json")) {
      try {
        parsedBody = await response.json()
      } catch {
        parsedBody = null
      }
    } else if (response.status !== 204) {
      parsedBody = await response.text()
    }

    if (!response.ok) {
      const errorEnvelope = typeof parsedBody === "object" && parsedBody !== null ? (parsedBody as Record<string, any>).error : undefined
      const error = new InheritageApiError({
        status: response.status,
        code: errorEnvelope?.code ?? "INTERNAL_SERVER_ERROR",
        message: errorEnvelope?.message ?? response.statusText,
        hint: errorEnvelope?.hint ?? null,
        doc: errorEnvelope?.doc ?? null,
        traceId: errorEnvelope?.trace_id ?? traceId,
        retryAfter: parseRetryAfter(response.headers),
        rateLimit,
        payload: parsedBody,
      })
      throw error
    }

    return {
      status: response.status,
      data: parsedBody as T,
      headers: response.headers,
      traceId,
      rateLimit,
      notModified: false,
    }
  }

  private prepareHeaders(overrides?: HeadersInit, body?: unknown): Headers {
    const headers = new Headers(this.baseHeaders)
    if (overrides) {
      const extra = new Headers(overrides)
      extra.forEach((value, key) => {
        headers.set(key, value)
      })
    }

    if (body !== undefined && body !== null && !headers.has("Content-Type")) {
      if (!(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer) && typeof body !== "string") {
        headers.set("Content-Type", "application/json; charset=utf-8")
      }
    }

    return headers
  }
}

