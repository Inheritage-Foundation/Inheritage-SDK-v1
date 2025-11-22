/**
 * React Hooks Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { InheritageClient } from '../src/client'
import {
  useHeritage,
  useHeritageList,
  useGeoNearby,
  useMedia,
  useCitation,
  useAIContext,
  useSimilarSites,
  useAIMetadata,
  useAIVectorIndex,
} from '../src/hooks'
import type { Heritage, HeritageListResponse, GeoFeatureCollection, MediaResponse, CitationResponse, AIContextResponse, AISimilarResponse, AIMetadataResponse, AIVectorRecord } from '../src/types'

// Mock InheritageClient
vi.mock('../src/client')

describe('React Hooks', () => {
  let mockClient: InheritageClient

  beforeEach(() => {
    mockClient = new InheritageClient({ attribution: 'visible' })
    vi.clearAllMocks()
  })

  describe('useHeritage', () => {
    it('fetches heritage site successfully', async () => {
      const mockData: Heritage = {
        id: '1',
        slug: 'taj-mahal',
        name: 'Taj Mahal',
        state: 'Uttar Pradesh',
        // ... other required fields
      } as Heritage

      vi.spyOn(mockClient, 'getHeritage').mockResolvedValue({
        status: 200,
        data: mockData,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useHeritage('taj-mahal', { client: mockClient })
      )

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeNull()

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
      expect(mockClient.getHeritage).toHaveBeenCalledWith('taj-mahal', expect.any(Object))
    })

    it('handles errors gracefully', async () => {
      const mockError = new Error('Network error')
      vi.spyOn(mockClient, 'getHeritage').mockRejectedValue(mockError)

      const { result } = renderHook(() =>
        useHeritage('taj-mahal', { client: mockClient })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).toEqual(mockError)
    })

    it('respects enabled option', async () => {
      const { result } = renderHook(() =>
        useHeritage('taj-mahal', { client: mockClient, enabled: false })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockClient.getHeritage).not.toHaveBeenCalled()
      expect(result.current.data).toBeNull()
    })

    it('refetch function works', async () => {
      const mockData: Heritage = { id: '1', slug: 'taj-mahal', name: 'Taj Mahal' } as Heritage
      vi.spyOn(mockClient, 'getHeritage').mockResolvedValue({
        status: 200,
        data: mockData,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useHeritage('taj-mahal', { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(mockClient.getHeritage).toHaveBeenCalledTimes(1)

      await result.current.refetch()

      expect(mockClient.getHeritage).toHaveBeenCalledTimes(2)
    })
  })

  describe('useHeritageList', () => {
    it('fetches paginated heritage list', async () => {
      const mockResponse: HeritageListResponse = {
        data: [
          { id: '1', slug: 'site1', name: 'Site 1' } as Heritage,
          { id: '2', slug: 'site2', name: 'Site 2' } as Heritage,
        ],
        meta: {
          page: 1,
          limit: 20,
          offset: 0,
          total: 2,
        },
      }

      vi.spyOn(mockClient, 'listHeritage').mockResolvedValue({
        status: 200,
        data: mockResponse,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useHeritageList({ state: 'Karnataka', limit: 20 }, { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.data).toEqual(mockResponse)
      expect(mockClient.listHeritage).toHaveBeenCalledWith({ state: 'Karnataka', limit: 20 }, expect.any(Object))
    })
  })

  describe('useGeoNearby', () => {
    it('fetches nearby heritage sites', async () => {
      const mockGeoJSON: GeoFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [77.2090, 28.6139] },
            properties: { slug: 'qutb-minar', name: 'Qutb Minar' } as any,
          },
        ],
      }

      vi.spyOn(mockClient, 'getGeoNearby').mockResolvedValue({
        status: 200,
        data: mockGeoJSON,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useGeoNearby({ lat: 28.6139, lon: 77.2090, radius_km: 10 }, { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.data).toEqual(mockGeoJSON)
      expect(mockClient.getGeoNearby).toHaveBeenCalled()
    })

    it('does not fetch if coordinates are invalid', async () => {
      const { result } = renderHook(() =>
        useGeoNearby({ lat: NaN, lon: 77.2090, radius_km: 10 }, { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(mockClient.getGeoNearby).not.toHaveBeenCalled()
    })
  })

  describe('useMedia', () => {
    it('fetches media bundle', async () => {
      const mockMedia: MediaResponse = {
        heritage_id: 'test-id',
        items: [],
        citations: [],
      }

      vi.spyOn(mockClient, 'getMedia').mockResolvedValue({
        status: 200,
        data: mockMedia,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useMedia('taj-mahal', { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.data).toEqual(mockMedia)
    })
  })

  describe('useCitation', () => {
    it('fetches citation metadata', async () => {
      const mockCitation: CitationResponse = {
        entity: 'Inheritage Foundation',
        citation_html: '<p>Data © Inheritage Foundation</p>',
        citation_markdown: 'Data © Inheritage Foundation',
        citation_text: 'Data © Inheritage Foundation',
        license: 'CC BY 4.0',
        source_url: 'https://inheritage.foundation',
      }

      vi.spyOn(mockClient, 'getCitation').mockResolvedValue({
        status: 200,
        data: mockCitation,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useCitation('taj-mahal', { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.data).toEqual(mockCitation)
    })
  })

  describe('useAIContext', () => {
    it('fetches AI context and embedding', async () => {
      const mockContext: AIContextResponse = {
        slug: 'taj-mahal',
        context: 'The Taj Mahal is a 17th-century mausoleum...',
        embedding: [0.1, 0.2, 0.3],
        embedding_dimensions: 3,
        embedding_checksum: 'abc123',
        model: 'inheritage-d1',
        model_version: '2025-01-15',
        prompt_template_version: 'v1.1.0',
        retrieval_policy: 'full:v1',
        sources: [],
        citation: 'Data © Inheritage Foundation',
      }

      vi.spyOn(mockClient, 'getAIContext').mockResolvedValue({
        status: 200,
        data: mockContext,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useAIContext('taj-mahal', { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.data).toEqual(mockContext)
    })
  })

  describe('useSimilarSites', () => {
    it('finds similar heritage sites', async () => {
      const mockSimilar: AISimilarResponse = {
        data: [
          {
            score: 0.95,
            site: { id: '2', slug: 'agra-fort', name: 'Agra Fort' } as Heritage,
          },
        ],
        meta: {
          reference: 'taj-mahal',
          limit: 5,
          embedding_model: 'inheritage-d1',
          model_version: '2025-01-15',
          prompt_template_version: 'v1.1.0',
        },
      }

      vi.spyOn(mockClient, 'findSimilar').mockResolvedValue({
        status: 200,
        data: mockSimilar,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useSimilarSites({ slug: 'taj-mahal', limit: 5 }, { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.data).toEqual(mockSimilar)
    })

    it('does not fetch without slug or embedding', async () => {
      const { result } = renderHook(() =>
        useSimilarSites({}, { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(mockClient.findSimilar).not.toHaveBeenCalled()
    })
  })

  describe('useAIMetadata', () => {
    it('fetches AI metadata', async () => {
      const mockMetadata: AIMetadataResponse = {
        slug: 'taj-mahal',
        name: 'Taj Mahal',
        context: 'The Taj Mahal...',
        embedding_checksum: 'abc123',
        embedding_dimensions: 1536,
        model: 'inheritage-d1',
        model_version: '2025-01-15',
        prompt_template_version: 'v1.1.0',
        retrieval_policy: 'full:v1',
        license: {
          name: 'CC BY 4.0',
          citation_required: true,
          ai_use_allowed: true,
          ai_license_terms: 'https://creativecommons.org/licenses/by/4.0/',
        },
        locale: null,
        citations: {} as any,
        official_url: 'https://inheritage.foundation/heritage/taj-mahal',
        same_as: [],
        sources: [],
        updated_at: '2025-01-15T00:00:00Z',
      }

      vi.spyOn(mockClient, 'getAIMetadata').mockResolvedValue({
        status: 200,
        data: mockMetadata,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useAIMetadata('taj-mahal', { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.data).toEqual(mockMetadata)
    })
  })

  describe('useAIVectorIndex', () => {
    it('fetches vector index with pagination', async () => {
      const mockVectors: AIVectorRecord[] = [
        {
          slug: 'site1',
          id: '1',
          name: 'Site 1',
          text: 'Context 1',
          vector: [0.1],
          embedding_checksum: 'chk1',
          embedding_dimensions: 1,
          model: 'm1',
          model_version: 'v1',
          prompt_template_version: 'p1',
          retrieval_policy: 'r1',
          license: 'L1',
          license_url: 'U1',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ]

      vi.spyOn(mockClient, 'getAIVectorIndex').mockResolvedValue({
        status: 200,
        data: mockVectors,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useAIVectorIndex({ limit: 1 }, { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.data).toEqual(mockVectors)
      expect(result.current.hasMore).toBe(true) // Because data.length === limit
    })

    it('loadMore function appends data', async () => {
      const mockVectors1: AIVectorRecord[] = [
        { slug: 'site1', id: '1', name: 'Site 1' } as AIVectorRecord,
      ]
      const mockVectors2: AIVectorRecord[] = [
        { slug: 'site2', id: '2', name: 'Site 2' } as AIVectorRecord,
      ]

      vi.spyOn(mockClient, 'getAIVectorIndex')
        .mockResolvedValueOnce({ status: 200, data: mockVectors1, headers: new Headers(), traceId: 'trace1', notModified: false })
        .mockResolvedValueOnce({ status: 200, data: mockVectors2, headers: new Headers(), traceId: 'trace2', notModified: false })

      const { result } = renderHook(() =>
        useAIVectorIndex({ limit: 1 }, { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.data).toHaveLength(1)

      await result.current.loadMore()

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data).toEqual([...mockVectors1, ...mockVectors2])
    })

    it('hasMore is false when fewer records than limit', async () => {
      const mockVectors: AIVectorRecord[] = [
        { slug: 'site1', id: '1', name: 'Site 1' } as AIVectorRecord,
      ]

      vi.spyOn(mockClient, 'getAIVectorIndex').mockResolvedValue({
        status: 200,
        data: mockVectors,
        headers: new Headers(),
        traceId: 'test-trace',
        notModified: false,
      })

      const { result } = renderHook(() =>
        useAIVectorIndex({ limit: 10 }, { client: mockClient })
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.hasMore).toBe(false) // Because data.length < limit
    })
  })
})

