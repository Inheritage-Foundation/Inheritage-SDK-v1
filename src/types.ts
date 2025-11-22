export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

export interface ApiResponse<T> {
  status: number
  data: T
  headers: Headers
  traceId?: string
  rateLimit?: RateLimitInfo
  notModified: boolean
}

export interface ApiRequestOptions {
  query?: Record<string, string | number | boolean | null | undefined>
  headers?: HeadersInit
  signal?: AbortSignal
  cache?: RequestCache
  revalidate?: number
  ifNoneMatch?: string
  ifModifiedSince?: string
}

export interface HeritageReference {
  title?: string
  url?: string
  publisher?: string
  author?: string
  year?: string | number
  citation_text?: string
  [key: string]: unknown
}

export interface CitationEntry {
  name: string
  url: string
  license: string
  required_display: string
  [key: string]: unknown
}

export type CitationBlock = CitationEntry[]

export interface HeritageVirtualTourAnalytics {
  enabled: boolean
  thumbnail: string | null
  chapters_count: number | null
  data_points_count: number | null
  completion_rate: number | null
  avg_session_duration: number | null
  total_sessions: number | null
}

export interface HeritageAnalytics {
  virtual_tour: HeritageVirtualTourAnalytics
  [key: string]: unknown
}

export interface HeritageMedia {
  primary_image: string | null
  gallery: string[]
  panoramas: string[]
  orthos: string[]
  floor_plans: string[]
  sections: string[]
  site_plan: string | null
  point_cloud: string | null
  mesh_data: string | null
  cad_files: string[]
  videos: string[]
  documents: string[]
}

export interface HeritageArchitecture {
  style: string | null
  structural_system: string | null
  construction_technique: string | null
  conservation_efforts: string | null
  sustainability_features: string | null
}

export interface HeritageDimensions {
  height: number | null
  width: number | null
  length: number | null
  area: number | null
  volume: number | null
}

export interface HeritageVisitorInfo {
  visiting_hours: string | null
  entry_fee: string | null
  website: string | null
  best_visit_times: string | null
  facilities: string[]
  restrictions: string | null
  accessibility: Record<string, unknown> | null
}

export interface HeritageCulturalContext {
  history: string | null
  cultural_significance: string | null
  cultural_continuity: string | null
  traditional_knowledge: string | null
  seasonal_events: string[]
}

export interface HeritageTags {
  category: string | null
  dynasty: string | null
  period: string | null
  states: string[]
  [key: string]: unknown
}

export interface HeritageStatus {
  completion_score: number | null
  completion_status: string | null
  is_featured: boolean | null
  is_published: boolean | null
  view_count: number | null
}

export interface Heritage {
  id: string
  slug: string
  uuid: string
  name: string
  summary: string | null
  description: string | null
  category: string | null
  location: string | null
  state: string | null
  country: string | null
  dynasty: string | null
  period: string | null
  year_built: string | null
  built_by: string | null
  heritage_status: string | null
  preservation_status: string | null
  coordinates: [number, number] | null
  geolocation: { lat: number; lon: number } | null
  materials: string[]
  architecture: HeritageArchitecture
  dimensions: HeritageDimensions
  visitor_info: HeritageVisitorInfo
  cultural_context: HeritageCulturalContext
  tags: HeritageTags
  media: HeritageMedia
  status: HeritageStatus
  timeline: Record<string, unknown>[]
  references: HeritageReference[]
  analytics: HeritageAnalytics
  citations: CitationBlock
  official_url: string
  same_as: string[]
}

export interface HeritageListResponse {
  data: Heritage[]
  meta: {
    total: number
    limit: number
    offset: number
    page?: number
  }
}

export interface HeritageFacetOptions {
  states: string[]
  countries: string[]
  dynasties: string[]
  styles: string[]
  materials: string[]
  periods: string[]
  categories: string[]
}

export interface HeritageFiltersResponse {
  filters: HeritageFacetOptions
  generated_at: string
}

export interface GeoFeatureProperties {
  slug: string | null
  name: string | null
  state: string | null
  country: string | null
  category: string | null
  view_count: number | null
  completion_score: number | null
  citation: {
    name: string
    url: string
    license: string
    required_display: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface GeoFeature {
  type: "Feature"
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
  properties: GeoFeatureProperties
}

export interface GeoFeatureCollection {
  type: "FeatureCollection"
  features: GeoFeature[]
  [key: string]: unknown
}

export type MediaItemType = "image" | "model" | "tour" | "diagram" | "video"

export interface MediaItem {
  type: MediaItemType
  url: string
  caption?: string | null
  license?: string | null
  citation: string
  metadata?: Record<string, unknown>
}

export interface MediaResponse {
  heritage_id: string
  items: MediaItem[]
  citations: CitationBlock
  metadata?: Record<string, unknown>
}

export interface MediaSearchResponse {
  data: MediaResponse[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

export interface CitationResponse {
  entity: string
  citation_html: string
  citation_markdown: string
  citation_text: string
  license: string
  source_url: string
}

export interface CitationReportRequest {
  entity: string
  app_name: string
  domain: string
  api_key?: string
  display_count?: number
}

export interface CitationReportResponse {
  status: string
  message: string
}

export interface AISource {
  type: string
  slug: string
  confidence: number
  retrieval_method: string
}

export interface AIContextResponse {
  slug: string
  context: string
  embedding: number[]
  embedding_dimensions: number
  embedding_checksum: string
  model: string
  model_version: string
  prompt_template_version: string
  retrieval_policy: string
  sources: AISource[]
  citation: string
}

export interface AIEmbeddingResponse {
  slug: string
  dimensions: number
  embedding: number[]
  embedding_checksum: string
  model: string
  model_version: string
  prompt_template_version: string
  retrieval_policy: string
  sources: AISource[]
}

export interface AISimilarResult {
  score: number
  site: Heritage
}

export interface AISimilarResponse {
  data: AISimilarResult[]
  meta: {
    reference: string | null
    limit: number
    embedding_model: string
    model_version: string
    prompt_template_version: string
  }
}

export interface AIMetadataLicense {
  name: string
  citation_required: boolean
  ai_use_allowed: boolean
  ai_license_terms: string
}

export interface AIMetadataResponse {
  slug: string
  name: string
  locale: string | null
  license: AIMetadataLicense
  model: string
  model_version: string
  prompt_template_version: string
  retrieval_policy: string
  embedding_dimensions: number
  embedding_checksum: string
  embeddings_last_updated: string | null
  context: string
  citations: CitationBlock
  same_as: string[]
  sources: AISource[]
  safety_annotations: string[]
}

export interface AIVisionRequest {
  image_url?: string
  image_base64?: string
  hint?: string
  limit?: number
}

export interface AIVisionMatch {
  score: number
  slug: string
  name: string
  state: string | null
  country: string | null
  architecture_style: string | null
  site: Heritage
}

export interface AIVisionResponse {
  matches: AIVisionMatch[]
  caption: string | null
  architecture_style_prediction: string | null
  embedding_model: string
  embedding_model_version: string
  prompt_template_version: string
  retrieval_policy: string
  embedding_dimensions: number
  embedding_checksum: string
  license: string
  sources: AISource[]
  safety_annotations: string[]
  trace_id: string
}

export interface AIVectorRecord {
  slug: string
  id: string
  name: string
  text: string | null
  vector: number[]
  embedding_checksum: string
  embedding_dimensions: number
  model: string
  model_version: string
  prompt_template_version: string
  retrieval_policy: string
  license: string
  license_url: string
  updated_at: string | null
}

export interface AIVectorIndexParams {
  limit?: number
  offset?: number
}

export interface AILicenseResponse {
  name: string
  version: string
  license: string
  human_summary: string
  url: string
  requirements: {
    attribution_header: string
    license_header: string
    ai_headers: Record<string, string>
    citation_snippets_endpoint: string
  }
  obligations: string[]
  allowances: string[]
  prohibitions: string[]
  enforcement: {
    violation_reporting: string
    revocation_policy: string
    contact: string
  }
  citation_examples: CitationBlock
  trace_id: string
}

export interface DatasetManifestLink {
  rel: string
  href: string
}

export interface DatasetManifest {
  dataset: JsonValue
  links: DatasetManifestLink[]
}

export interface TimelineLink {
  name: string
  href: string
}

export interface TimelineFeaturedResponse {
  timelines: TimelineLink[]
}

export interface StatsResponse {
  counts: {
    total: number
    published: number
    featured: number
    total_views: number
    avg_completion_score: number
  }
  breakdown: {
    by_status: Record<string, number>
    by_category: Record<string, number>
    by_state: Record<string, number>
    by_country: Record<string, number>
  }
  generated_at: string
}

export interface HeritageListParams {
  state?: string
  dynasty?: string
  style?: string
  material?: string
  period?: string
  country?: string
  sort?: "name" | "-name" | "period" | "-period" | "state" | "-state" | "completion_score" | "-completion_score" | "view_count" | "-view_count" | "country" | "-country"
  limit?: number
  offset?: number
  fields?: string[]
}

export interface HeritageSearchParams {
  q: string
  state?: string
  style?: string
  country?: string
  limit?: number
  fields?: string[]
}

export interface GeoHeritageParams {
  state?: string
  country?: string
  category?: string
  featured?: boolean
  limit?: number
  bbox?: string
}

export interface GeoNearbyParams {
  lat: number
  lon: number
  radius_km?: number
  radius?: number
  limit?: number
}

export interface MediaSearchParams {
  type?: MediaItemType
  state?: string
  style?: string
  country?: string
  limit?: number
  offset?: number
}

export interface AISimilarParams {
  slug?: string
  embedding?: number[]
  limit?: number
}

export interface SystemHeaders {
  traceId?: string
  rateLimit?: RateLimitInfo
  etag?: string | null
  lastModified?: string | null
}

export interface ChangefeedParams {
  since?: string | Date
  limit?: number
}

export interface ChangefeedEntry {
  slug: string | null
  updated_at: string | null
  created_at: string | null
  published: boolean
  operation: "upsert" | "unpublished"
  checksum: string
  url: string | null
}

export interface ChangefeedMeta {
  count: number
  limit: number
  since: string
  next_since: string | null
  has_more: boolean
  dataset_hash: string
  last_updated: string | null
}

export interface ChangefeedResponse {
  data: ChangefeedEntry[]
  meta: ChangefeedMeta
}

export interface HeritageDumpParams {
  batch?: number
}

export interface AIContextDumpParams {
  batch?: number
  includeEmbedding?: boolean
}

export interface HeritageLIDOParams {
  download?: boolean
}

export interface HeritageLidoExportParams {
  state?: string
  country?: string
  category?: string
  limit?: number
  offset?: number
}

// AAT (Art & Architecture Thesaurus) Types
export interface AATStyleMetadata {
  regions?: string[]
  timePeriods?: string[]
  dynasties?: string[]
  sacredContexts?: string[]
  associatedDeities?: string[]
  primaryMaterials?: string[]
  architecturalFeatures?: string[]
  keywords?: string[]
  recommendedSources?: Array<{
    title: string
    type: string | null
    url: string | null
    notes: string | null
  }>
}

export interface AATStyle {
  id: string
  style_id: string
  slug: string
  label: string
  uri: string
  description?: string | null
  fragments?: string[] | null
  evidence?: JsonValue
  metadata?: AATStyleMetadata | null
  created_at?: string
  updated_at?: string
  siteCount?: number
  primarySiteCount?: number
  relatedSites?: Array<{
    id: string
    name: string
    slug: string
    isPrimary: boolean
    confidenceScore?: number
  }>
}

export interface AATStyleListResponse {
  total: number
  data: AATStyle[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface AATSearchParams {
  q?: string
  limit?: number
  offset?: number
  regions?: string[]
  timePeriods?: string[]
  dynasties?: string[]
}

