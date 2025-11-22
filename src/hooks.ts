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

