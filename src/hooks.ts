/**
 * React hooks for the Inheritage SDK
 * 
 * Provides convenient hooks for fetching heritage data, AI context, and geospatial features
 * with automatic error handling, loading states, and caching.
 */

import { useCallback, useEffect, useState } from "react"
import type {
  Heritage,
  HeritageListParams,
  HeritageListResponse,
  GeoFeatureCollection,
  GeoNearbyParams,
  MediaResponse,
  CitationResponse,
  AIContextResponse,
  AISimilarParams,
  AISimilarResponse,
  AIMetadataResponse,
  AIVectorIndexParams,
  AIVectorRecord,
  // New types for missing hooks
  StatsResponse,
  TimelineFeaturedResponse,
  HeritageSearchParams,
  HeritageFiltersResponse,
  ChangefeedResponse,
  ChangefeedParams,
  AIVisionResponse,
  AIVisionRequest,
  AILicenseResponse,
  AATStyleListResponse,
  AATSearchParams,
} from "./types"
import { InheritageClient, type InheritageClientOptions } from "./client"

export interface UseHeritageOptions {
  client?: InheritageClient
  clientOptions?: InheritageClientOptions
  enabled?: boolean
}

export interface UseHeritageResult {
  data: Heritage | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseHeritageListResult {
  data: HeritageListResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseGeoNearbyResult {
  data: GeoFeatureCollection | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseMediaResult {
  data: MediaResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseCitationResult {
  data: CitationResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseAIContextResult {
  data: AIContextResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseSimilarSitesResult {
  data: AISimilarResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseAIMetadataResult {
  data: AIMetadataResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseAIVectorIndexResult {
  data: AIVectorRecord[] | null
  loading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<void>
}

/**
 * Fetch a single heritage site by slug
 */
export function useHeritage(
  slug: string,
  options: UseHeritageOptions = {}
): UseHeritageResult {
  const [data, setData] = useState<Heritage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!slug || !enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getHeritage(slug)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [slug, enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch a paginated list of heritage sites
 */
export function useHeritageList(
  params: HeritageListParams = {},
  options: UseHeritageOptions = {}
): UseHeritageListResult {
  const [data, setData] = useState<HeritageListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.listHeritage(params)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [params, enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch nearby heritage sites
 */
export function useGeoNearby(
  params: GeoNearbyParams,
  options: UseHeritageOptions = {}
): UseGeoNearbyResult {
  const [data, setData] = useState<GeoFeatureCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled || !Number.isFinite(params.lat) || !Number.isFinite(params.lon)) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getGeoNearby(params)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [params, enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch media bundle for a heritage site
 */
export function useMedia(
  slug: string,
  options: UseHeritageOptions = {}
): UseMediaResult {
  const [data, setData] = useState<MediaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!slug || !enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getMedia(slug)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [slug, enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch citation for an entity
 */
export function useCitation(
  entityId: string,
  options: UseHeritageOptions = {}
): UseCitationResult {
  const [data, setData] = useState<CitationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!entityId || !enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getCitation(entityId)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [entityId, enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch AI context and embedding for a heritage site
 */
export function useAIContext(
  slug: string,
  options: UseHeritageOptions = {}
): UseAIContextResult {
  const [data, setData] = useState<AIContextResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!slug || !enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getAIContext(slug)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [slug, enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Find similar heritage sites
 */
export function useSimilarSites(
  params: AISimilarParams,
  options: UseHeritageOptions = {}
): UseSimilarSitesResult {
  const [data, setData] = useState<AISimilarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled || (!params.slug && !params.embedding)) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.findSimilar(params)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [params, enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch AI metadata for a heritage site
 */
export function useAIMetadata(
  slug: string,
  options: UseHeritageOptions = {}
): UseAIMetadataResult {
  const [data, setData] = useState<AIMetadataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!slug || !enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getAIMetadata(slug)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [slug, enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Paginate through the AI vector index
 */
export function useAIVectorIndex(
  initialParams: AIVectorIndexParams = {},
  options: UseHeritageOptions = {}
): UseAIVectorIndexResult {
  const [data, setData] = useState<AIVectorRecord[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [offset, setOffset] = useState(initialParams.offset ?? 0)
  const [hasMore, setHasMore] = useState(true)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false
  const limit = initialParams.limit ?? 100

  const fetchData = useCallback(
    async (currentOffset: number, append = false) => {
      if (!enabled) return

      try {
        setLoading(true)
        setError(null)
        const response = await client.getAIVectorIndex({ limit, offset: currentOffset })
        if (append && data) {
          setData([...data, ...response.data])
        } else {
          setData(response.data)
        }
        setHasMore(response.data.length === limit)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    },
    [limit, enabled, client, data]
  )

  useEffect(() => {
    fetchData(offset)
  }, [offset])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    const nextOffset = offset + limit
    setOffset(nextOffset)
    await fetchData(nextOffset, true)
  }, [hasMore, loading, offset, limit, fetchData])

  return { data, loading, error, hasMore, loadMore }
}

// ========================
// Missing Hooks
// ========================

export interface UseStatsResult {
  data: StatsResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseTimelineFeaturedResult {
  data: TimelineFeaturedResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseHeritageSearchResult {
  data: HeritageListResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseRandomHeritageResult {
  data: Heritage | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseRandomMediaResult {
  data: MediaResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseHeritageFiltersResult {
  data: HeritageFiltersResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseChangefeedResult {
  data: ChangefeedResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseAIVisionResult {
  data: AIVisionResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseAILicenseResult {
  data: AILicenseResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseHeritageCIDOCResult {
  data: string | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseAATResult {
  data: AATStyleListResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Fetch dataset statistics
 */
export function useStats(options: UseHeritageOptions = {}): UseStatsResult {
  const [data, setData] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getStats()
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch featured timeline links
 */
export function useTimelineFeatured(options: UseHeritageOptions = {}): UseTimelineFeaturedResult {
  const [data, setData] = useState<TimelineFeaturedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getTimelineFeatured()
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Search heritage sites
 */
export function useHeritageSearch(
  params: HeritageSearchParams = {},
  options: UseHeritageOptions = {}
): UseHeritageSearchResult {
  const [data, setData] = useState<HeritageListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.searchHeritage(params)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params), enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch random heritage site
 */
export function useRandomHeritage(options: UseHeritageOptions = {}): UseRandomHeritageResult {
  const [data, setData] = useState<Heritage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getRandomHeritage()
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch random media
 */
export function useRandomMedia(options: UseHeritageOptions = {}): UseRandomMediaResult {
  const [data, setData] = useState<MediaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getRandomMedia()
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch heritage filter facets
 */
export function useHeritageFilters(options: UseHeritageOptions = {}): UseHeritageFiltersResult {
  const [data, setData] = useState<HeritageFiltersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getHeritageFilters()
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch dataset changefeed
 */
export function useChangefeed(
  params: ChangefeedParams = {},
  options: UseHeritageOptions = {}
): UseChangefeedResult {
  const [data, setData] = useState<ChangefeedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getChangefeed(params)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params), enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch AI vision context
 */
export function useAIVision(
  request: AIVisionRequest,
  options: UseHeritageOptions = {}
): UseAIVisionResult {
  const [data, setData] = useState<AIVisionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled || !request.image) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getAIVisionContext(request)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(request), enabled, client])

  useEffect(() => {
    if (enabled && request.image) {
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch AI license terms
 */
export function useAILicense(options: UseHeritageOptions = {}): UseAILicenseResult {
  const [data, setData] = useState<AILicenseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getAILicense()
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Fetch heritage CIDOC-CRM JSON-LD
 */
export function useHeritageCIDOC(
  slug: string,
  options: UseHeritageOptions = {}
): UseHeritageCIDOCResult {
  const [data, setData] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!slug || !enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.getHeritageCIDOC(slug)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [slug, enabled, client])

  useEffect(() => {
    if (slug && enabled) {
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Search AAT terms
 */
export function useAAT(
  params: AATSearchParams = {},
  options: UseHeritageOptions = {}
): UseAATResult {
  const [data, setData] = useState<AATStyleListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = options.client ?? new InheritageClient(options.clientOptions)
  const enabled = options.enabled !== false

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await client.searchAAT(params)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params), enabled, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

