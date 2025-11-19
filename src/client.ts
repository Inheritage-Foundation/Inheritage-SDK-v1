import { InheritageApiError } from "./errors"
import {
  type AIContextDumpParams,
  type AIContextResponse,
  type AIEmbeddingResponse,
  type AILicenseResponse,
  type AIMetadataResponse,
  type AISimilarParams,
  type AISimilarResponse,
  type AIVectorIndexParams,
  type AIVectorRecord,
  type AIVisionRequest,
  type AIVisionResponse,
  type ApiRequestOptions,
  type ApiResponse,
  type ChangefeedParams,
  type ChangefeedResponse,
  type CitationReportRequest,
  type CitationReportResponse,
  type CitationResponse,
  type DatasetManifest,
  type GeoFeature,
  type GeoFeatureCollection,
  type GeoHeritageParams,
  type GeoNearbyParams,
  type Heritage,
  type HeritageDumpParams,
  type HeritageFiltersResponse,
  type HeritageLIDOParams,
  type HeritageLidoExportParams,
  type HeritageListParams,
  type HeritageListResponse,
  type HeritageSearchParams,
  type JsonValue,
  type MediaResponse,
  type MediaSearchParams,
  type MediaSearchResponse,
  type RateLimitInfo,
  type StatsResponse,
  type TimelineFeaturedResponse,
  type AATStyle,
  type AATStyleListResponse,
  type AATSearchParams,
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
  responseType?: "json" | "text" | "arrayBuffer"
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

function inferResponseType(contentType: string): "json" | "text" | "arrayBuffer" {
  const normalized = contentType.toLowerCase()
  if (!normalized) {
    return "text"
  }

  if (normalized.includes("application/zip") || normalized.includes("application/octet-stream")) {
    return "arrayBuffer"
  }

  if (normalized.includes("application/x-ndjson") || normalized.includes("application/jsonl")) {
    return "text"
  }

  if (normalized.includes("application/json") || normalized.includes("+json")) {
    return "json"
  }

  if (normalized.startsWith("text/") || normalized.includes("application/xml")) {
    return "text"
  }

  return "text"
}

function parseNdjsonRecords(input: string | null | undefined): AIVectorRecord[] {
  if (!input) return []
  const lines = input.split(/\r?\n/).map((line) => line.trim())
  const records: AIVectorRecord[] = []
  for (const line of lines) {
    if (!line) continue
    try {
      const parsed = JSON.parse(line) as AIVectorRecord
      records.push(parsed)
    } catch (error) {
      throw new Error(`Failed to parse NDJSON vector record: ${(error as Error).message}`)
    }
  }
  return records
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
   * Fetch available heritage filter facets.
   */
  async getHeritageFilters(options: ApiRequestOptions = {}): Promise<ApiResponse<HeritageFiltersResponse>> {
    return this.send<HeritageFiltersResponse>({
      method: "GET",
      path: "/heritage/filters",
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
   * Retrieve featured timeline links.
   */
  async getTimelineFeatured(options: ApiRequestOptions = {}): Promise<ApiResponse<TimelineFeaturedResponse>> {
    return this.send<TimelineFeaturedResponse>({
      method: "GET",
      path: "/timeline/featured",
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
   * Stream heritage NDJSON dump.
   */
  async getHeritageDump(params: HeritageDumpParams = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<string>> {
    const query: Record<string, number> = {}
    if (params.batch !== undefined) {
      query.batch = params.batch
    }

    const headers = new Headers(options.headers)
    headers.set("Accept", "application/x-ndjson")

    return this.send<string>({
      method: "GET",
      path: "/dump/heritage.ndjson",
      query,
      headers,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Download GeoJSON dump for all heritage sites.
   */
  async getGeoDump(options: ApiRequestOptions = {}): Promise<ApiResponse<GeoFeatureCollection>> {
    const headers = new Headers(options.headers)
    headers.set("Accept", "application/geo+json")

    return this.send<GeoFeatureCollection>({
      method: "GET",
      path: "/dump/geo.geojson",
      headers,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Stream AI context JSONL dump.
   */
  async getAIContextDump(params: AIContextDumpParams = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<string>> {
    const query: Record<string, string | number> = {}
    if (params.batch !== undefined) {
      query.batch = params.batch
    }
    if (params.includeEmbedding) {
      query.include = "embedding"
    }

    const headers = new Headers(options.headers)
    headers.set("Accept", "application/jsonl")

    return this.send<string>({
      method: "GET",
      path: "/dump/ai-context.jsonl",
      query,
      headers,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Retrieve dataset changefeed entries.
   */
  async getChangefeed(params: ChangefeedParams = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<ChangefeedResponse>> {
    const query: Record<string, string | number> = {}
    if (params.since) {
      query.since = typeof params.since === "string" ? params.since : params.since.toISOString()
    }
    if (params.limit !== undefined) {
      query.limit = params.limit
    }

    return this.send<ChangefeedResponse>({
      method: "GET",
      path: "/changes",
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
   * Machine-readable AI metadata bundle for a heritage site.
   */
  async getAIMetadata(slug: string, options: ApiRequestOptions = {}): Promise<ApiResponse<AIMetadataResponse>> {
    if (!slug || typeof slug !== "string") {
      throw new Error("slug is required")
    }

    return this.send<AIMetadataResponse>({
      method: "GET",
      path: `/ai/meta/${encodeURIComponent(slug)}`,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      headers: options.headers,
      signal: options.signal,
    })
  }

  /**
   * Vision ingress endpoint: classify an image to heritage metadata.
   */
  async getAIVisionContext(body: AIVisionRequest, options: ApiRequestOptions = {}): Promise<ApiResponse<AIVisionResponse>> {
    if (!body || (typeof body.image_url !== "string" && typeof body.image_base64 !== "string")) {
      throw new Error("Provide either image_url or image_base64 in the request body")
    }

    return this.send<AIVisionResponse>({
      method: "POST",
      path: "/ai/vision/context",
      body,
      headers: options.headers,
      signal: options.signal,
    })
  }

  /**
   * NDJSON vector feed for downstream vector databases.
   */
  async getAIVectorIndex(
    params: AIVectorIndexParams = {},
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<AIVectorRecord[]>> {
    const query: Record<string, number> = {}
    if (params.limit !== undefined) {
      if (!Number.isFinite(params.limit)) {
        throw new Error("limit must be a finite number")
      }
      query.limit = Number(params.limit)
    }
    if (params.offset !== undefined) {
      if (!Number.isFinite(params.offset)) {
        throw new Error("offset must be a finite number")
      }
      query.offset = Number(params.offset)
    }

    const headers = new Headers(options.headers)
    headers.set("Accept", "application/x-ndjson")

    const response = await this.send<string>({
      method: "GET",
      path: "/ai/vector-index.ndjson",
      query,
      headers,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })

    return {
      ...response,
      data: parseNdjsonRecords(typeof response.data === "string" ? response.data : ""),
    }
  }

  /**
   * AI license addendum metadata.
   */
  async getAILicense(options: ApiRequestOptions = {}): Promise<ApiResponse<AILicenseResponse>> {
    return this.send<AILicenseResponse>({
      method: "GET",
      path: "/license/ai",
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      headers: options.headers,
      signal: options.signal,
    })
  }

  /**
   * CIDOC-CRM JSON-LD payload for a heritage site.
   */
  async getHeritageCIDOC(slug: string, options: ApiRequestOptions = {}): Promise<ApiResponse<JsonValue>> {
    if (!slug || typeof slug !== "string") {
      throw new Error("slug is required")
    }

    const headers = new Headers(options.headers)
    headers.set("Accept", "application/ld+json")

    return this.send<JsonValue>({
      method: "GET",
      path: `/cidoc/${encodeURIComponent(slug)}`,
      headers,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * LIDO 1.1 XML export for a heritage site.
   */
  async getHeritageLIDO(slug: string, params: HeritageLIDOParams = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<string>> {
    if (!slug || typeof slug !== "string") {
      throw new Error("slug is required")
    }

    const query: Record<string, string> = {}
    if (params.download) {
      query.download = "true"
    }

    const headers = new Headers(options.headers)
    headers.set("Accept", "application/xml")

    return this.send<string>({
      method: "GET",
      path: `/lido/${encodeURIComponent(slug)}`,
      query,
      headers,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
      signal: options.signal,
    })
  }

  /**
   * Bulk LIDO export (ZIP archive).
   */
  async exportHeritageLIDO(params: HeritageLidoExportParams = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<ArrayBuffer>> {
    const query: Record<string, string | number> = {}
    if (params.state) {
      query.state = params.state
    }
    if (params.country) {
      query.country = params.country
    }
    if (params.category) {
      query.category = params.category
    }
    if (params.limit !== undefined) {
      query.limit = params.limit
    }
    if (params.offset !== undefined) {
      query.offset = params.offset
    }

    const headers = new Headers(options.headers)
    headers.set("Accept", "application/zip")

    return this.send<ArrayBuffer>({
      method: "GET",
      path: "/lido/export",
      query,
      headers,
      signal: options.signal,
    })
  }

  /**
   * Search AAT (Art & Architecture Thesaurus) terms.
   */
  async searchAAT(params: AATSearchParams = {}, options: ApiRequestOptions = {}): Promise<ApiResponse<AATStyleListResponse>> {
    const query: Record<string, string | number> = {}
    if (params.q) {
      query.q = params.q
    }
    if (params.limit !== undefined) {
      query.limit = params.limit
    }
    if (params.offset !== undefined) {
      query.offset = params.offset
    }
    if (params.regions && params.regions.length > 0) {
      query.regions = params.regions.join(",")
    }
    if (params.timePeriods && params.timePeriods.length > 0) {
      query.timePeriods = params.timePeriods.join(",")
    }
    if (params.dynasties && params.dynasties.length > 0) {
      query.dynasties = params.dynasties.join(",")
    }

    return this.send<AATStyleListResponse>({
      method: "GET",
      path: "/aat",
      query,
      headers: options.headers,
      signal: options.signal,
    })
  }

  /**
   * Get a single AAT term by ID, slug, or style_id.
   */
  async getAATTerm(idOrSlug: string, options: ApiRequestOptions = {}): Promise<ApiResponse<AATStyle>> {
    if (!idOrSlug || typeof idOrSlug !== "string") {
      throw new Error("idOrSlug is required")
    }

    return this.send<AATStyle>({
      method: "GET",
      path: `/aat/${encodeURIComponent(idOrSlug)}`,
      headers: options.headers,
      ifNoneMatch: options.ifNoneMatch,
      ifModifiedSince: options.ifModifiedSince,
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

    const contentType = response.headers.get("Content-Type") || ""
    const inferredType = inferResponseType(contentType)
    let finalType: "json" | "text" | "arrayBuffer" = inferredType === "json" ? "json" : options.responseType ?? inferredType
    if (inferredType === "json") {
      finalType = "json"
    }

    let parsedBody: unknown = null

    if (response.status !== 204) {
      try {
        if (finalType === "arrayBuffer") {
          parsedBody = await response.arrayBuffer()
        } else if (finalType === "text") {
          parsedBody = await response.text()
        } else {
          parsedBody = await response.json()
        }
      } catch {
        if (finalType === "arrayBuffer") {
          parsedBody = new ArrayBuffer(0)
        } else if (finalType === "text") {
          parsedBody = ""
        } else {
          parsedBody = null
        }
      }
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

  // ========================
  // CIDOC-CRM API
  // ========================

  /**
   * Get heritage site in CIDOC-CRM JSON-LD format
   * @param slug - Heritage site slug
   * @param options - Request options
   * @returns CIDOC-CRM JSON-LD representation
   * @endpoint GET /cidoc/:slug
   * @standard ISO 21127:2023 (CIDOC-CRM 7.1.3)
   */
  public async getHeritageCIDOC(slug: string, options?: ApiRequestOptions): Promise<ApiResponse<any>> {
    return this.send({
      method: "GET",
      path: `/cidoc/${slug}`,
      ...options,
      headers: {
        ...options?.headers,
        Accept: "application/ld+json",
      },
    })
  }

  // ========================
  // LIDO API
  // ========================

  /**
   * Get heritage site in LIDO 1.1 XML format
   * @param slug - Heritage site slug
   * @param download - Whether to download as file (default: false)
   * @param options - Request options
   * @returns LIDO XML string
   * @endpoint GET /lido/:slug
   * @standard LIDO 1.1
   */
  public async getHeritageLIDO(
    slug: string,
    download: boolean = false,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<string>> {
    return this.send<string>({
      method: "GET",
      path: `/lido/${slug}`,
      query: download ? { download: "true" } : undefined,
      ...options,
      headers: {
        ...options?.headers,
        Accept: "application/xml",
      },
    })
  }

  /**
   * Export multiple heritage sites as LIDO XML (ZIP archive)
   * @param params - Filter parameters (state, country, category, limit, offset)
   * @param options - Request options
   * @returns ZIP archive blob
   * @endpoint GET /lido/export
   * @standard LIDO 1.1
   */
  public async exportHeritageLIDO(
    params?: {
      state?: string
      country?: string
      category?: string
      limit?: number
      offset?: number
    },
    options?: ApiRequestOptions
  ): Promise<ApiResponse<Blob>> {
    return this.send<Blob>({
      method: "GET",
      path: "/lido/export",
      query: params as Record<string, string | number>,
      ...options,
      headers: {
        ...options?.headers,
        Accept: "application/zip",
      },
    })
  }

  // ========================
  // OAI-PMH API
  // ========================

  /**
   * OAI-PMH Identify verb
   * @param options - Request options
   * @returns OAI-PMH XML response
   * @endpoint GET /oai-pmh?verb=Identify
   * @standard OAI-PMH 2.0
   */
  public async oaipmhIdentify(options?: ApiRequestOptions): Promise<ApiResponse<string>> {
    return this.send<string>({
      method: "GET",
      path: "/oai-pmh",
      query: { verb: "Identify" },
      ...options,
      headers: {
        ...options?.headers,
        Accept: "text/xml",
      },
    })
  }

  /**
   * OAI-PMH ListMetadataFormats verb
   * @param options - Request options
   * @returns OAI-PMH XML response
   * @endpoint GET /oai-pmh?verb=ListMetadataFormats
   * @standard OAI-PMH 2.0
   */
  public async oaipmhListMetadataFormats(options?: ApiRequestOptions): Promise<ApiResponse<string>> {
    return this.send<string>({
      method: "GET",
      path: "/oai-pmh",
      query: { verb: "ListMetadataFormats" },
      ...options,
      headers: {
        ...options?.headers,
        Accept: "text/xml",
      },
    })
  }

  /**
   * OAI-PMH ListSets verb
   * @param options - Request options
   * @returns OAI-PMH XML response
   * @endpoint GET /oai-pmh?verb=ListSets
   * @standard OAI-PMH 2.0
   */
  public async oaipmhListSets(options?: ApiRequestOptions): Promise<ApiResponse<string>> {
    return this.send<string>({
      method: "GET",
      path: "/oai-pmh",
      query: { verb: "ListSets" },
      ...options,
      headers: {
        ...options?.headers,
        Accept: "text/xml",
      },
    })
  }

  /**
   * OAI-PMH ListIdentifiers verb
   * @param metadataPrefix - Metadata format (oai_dc or lido)
   * @param params - Optional filters (from, until, set, resumptionToken)
   * @param options - Request options
   * @returns OAI-PMH XML response
   * @endpoint GET /oai-pmh?verb=ListIdentifiers
   * @standard OAI-PMH 2.0
   */
  public async oaipmhListIdentifiers(
    metadataPrefix: "oai_dc" | "lido",
    params?: {
      from?: string
      until?: string
      set?: string
      resumptionToken?: string
    },
    options?: ApiRequestOptions
  ): Promise<ApiResponse<string>> {
    return this.send<string>({
      method: "GET",
      path: "/oai-pmh",
      query: {
        verb: "ListIdentifiers",
        metadataPrefix,
        ...params,
      } as Record<string, string>,
      ...options,
      headers: {
        ...options?.headers,
        Accept: "text/xml",
      },
    })
  }

  /**
   * OAI-PMH ListRecords verb
   * @param metadataPrefix - Metadata format (oai_dc or lido)
   * @param params - Optional filters (from, until, set, resumptionToken)
   * @param options - Request options
   * @returns OAI-PMH XML response
   * @endpoint GET /oai-pmh?verb=ListRecords
   * @standard OAI-PMH 2.0
   */
  public async oaipmhListRecords(
    metadataPrefix: "oai_dc" | "lido",
    params?: {
      from?: string
      until?: string
      set?: string
      resumptionToken?: string
    },
    options?: ApiRequestOptions
  ): Promise<ApiResponse<string>> {
    return this.send<string>({
      method: "GET",
      path: "/oai-pmh",
      query: {
        verb: "ListRecords",
        metadataPrefix,
        ...params,
      } as Record<string, string>,
      ...options,
      headers: {
        ...options?.headers,
        Accept: "text/xml",
      },
    })
  }

  /**
   * OAI-PMH GetRecord verb
   * @param identifier - OAI identifier (e.g., oai:inheritage.foundation:heritage:taj-mahal)
   * @param metadataPrefix - Metadata format (oai_dc or lido)
   * @param options - Request options
   * @returns OAI-PMH XML response
   * @endpoint GET /oai-pmh?verb=GetRecord
   * @standard OAI-PMH 2.0
   */
  public async oaipmhGetRecord(
    identifier: string,
    metadataPrefix: "oai_dc" | "lido",
    options?: ApiRequestOptions
  ): Promise<ApiResponse<string>> {
    return this.send<string>({
      method: "GET",
      path: "/oai-pmh",
      query: {
        verb: "GetRecord",
        identifier,
        metadataPrefix,
      },
      ...options,
      headers: {
        ...options?.headers,
        Accept: "text/xml",
      },
    })
  }
}

