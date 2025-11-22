/**
 * End-to-End Tests
 * 
 * These tests run against the live API (or staging) to ensure the SDK works correctly
 * with real backend responses.
 * 
 * Run with: npm run test:e2e
 * Set INHERITAGE_API_URL environment variable to test against staging.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { InheritageClient } from '../src/client'
import {
  createHeritageContextRunnable,
  createInheritageToolkit,
} from '../src/langchain'

const API_URL = process.env['INHERITAGE_API_URL'] || 'https://inheritage.foundation/api/v1'

describe('E2E Tests', () => {
  let client: InheritageClient

  beforeAll(() => {
    client = new InheritageClient({
      baseUrl: API_URL,
      attribution: 'visible',
    })
  })

  describe('Heritage API', () => {
    it('fetches a known heritage site (Taj Mahal)', async () => {
      const response = await client.getHeritage('taj-mahal')

      expect(response.data).toBeDefined()
      expect(response.data.slug).toBe('taj-mahal')
      expect(response.data.name).toContain('Taj Mahal')
      expect(response.data.state).toBeDefined()
      expect(response.data.coordinates).toBeDefined()
    })

    it('returns 404 for non-existent site', async () => {
      await expect(client.getHeritage('nonexistent-site-xyz')).rejects.toThrow()
    })

    it('lists heritage sites with pagination', async () => {
      const response = await client.listHeritage({ limit: 10, offset: 0 })

      expect(response.data).toBeDefined()
      expect(response.data.data).toBeInstanceOf(Array)
      expect(response.data.data.length).toBeGreaterThan(0)
      expect(response.data.data.length).toBeLessThanOrEqual(10)
      expect(response.data.meta.total).toBeGreaterThan(0)
    })

    it('filters heritage sites by state', async () => {
      const response = await client.listHeritage({ state: 'Karnataka', limit: 5 })

      expect(response.data.data).toBeInstanceOf(Array)
      response.data.data.forEach(site => {
        expect(site.state).toBe('Karnataka')
      })
    })
  })

  describe('Geospatial API', () => {
    it('finds nearby heritage sites (Delhi)', async () => {
      const response = await client.getGeoNearby({
        lat: 28.6139,
        lon: 77.2090,
        radius: 10, // 10km
        limit: 5,
      })

      expect(response.data.type).toBe('FeatureCollection')
      expect(response.data.features).toBeInstanceOf(Array)
      expect(response.data.features.length).toBeGreaterThan(0)
      expect(response.data.features.length).toBeLessThanOrEqual(5)

      const feature = response.data.features[0]
      expect(feature.type).toBe('Feature')
      expect(feature.geometry.type).toBe('Point')
      expect(feature.geometry.coordinates).toHaveLength(2)
      expect(feature.properties.slug).toBeDefined()
      expect(feature.properties.name).toBeDefined()
    })

    it('returns single site as GeoJSON', async () => {
      const response = await client.getGeoFeature('taj-mahal')

      expect(response.data.type).toBe('Feature')
      expect(response.data.geometry.type).toBe('Point')
      expect(response.data.properties.slug).toBe('taj-mahal')
    })
  })

  describe('Media API', () => {
    it('fetches media bundle for a site', async () => {
      const response = await client.getMedia('taj-mahal')

      expect(response.data).toBeDefined()
      expect(response.data.heritage_id).toBeDefined()
      expect(response.data.items).toBeInstanceOf(Array)
    })
  })

  describe('Citation API', () => {
    it('fetches citation metadata', async () => {
      const response = await client.getCitation('taj-mahal')

      expect(response.data).toBeDefined()
      expect(response.data.entity).toBeDefined()
      expect(response.data.license).toBeDefined()
      expect(response.data.citation_text).toBeDefined()
    })
  })

  describe('AI API', () => {
    it('fetches AI context and embedding', async () => {
      const response = await client.getAIContext('taj-mahal')

      expect(response.data).toBeDefined()
      expect(response.data.slug).toBe('taj-mahal')
      expect(response.data.context).toBeDefined()
      expect(typeof response.data.context).toBe('string')
      expect(response.data.context.length).toBeGreaterThan(50)
      expect(response.data.embedding).toBeInstanceOf(Array)
      expect(response.data.embedding_dimensions).toBe(1536)
      expect(response.data.embedding_checksum).toBeDefined()
      expect(response.data.model).toBe('inheritage-d1')
    })

    it('fetches embedding only', async () => {
      const response = await client.getAIEmbedding('taj-mahal')

      expect(response.data).toBeDefined()
      expect(response.data.slug).toBe('taj-mahal')
      expect(response.data.embedding).toBeInstanceOf(Array)
      expect(response.data.dimensions).toBe(1536)
      expect(response.data.embedding_checksum).toBeDefined()
    })

    it('finds similar sites by slug', async () => {
      const response = await client.findSimilar({ slug: 'taj-mahal', limit: 5 })

      expect(response.data).toBeDefined()
      expect(response.data.data).toBeInstanceOf(Array)
      expect(response.data.data.length).toBeGreaterThan(0)
      expect(response.data.data.length).toBeLessThanOrEqual(5)

      const firstResult = response.data.data[0]
      expect(firstResult.score).toBeGreaterThan(0)
      expect(firstResult.score).toBeLessThanOrEqual(1)
      expect(firstResult.site.slug).toBeDefined()
      expect(firstResult.site.name).toBeDefined()

      // Results should be sorted by score (descending)
      if (response.data.data && response.data.data.length > 1) {
        for (let i = 1; i < response.data.data.length; i++) {
          const prevScore = response.data.data[i - 1]?.score
          const currScore = response.data.data[i]?.score
          if (prevScore !== undefined && currScore !== undefined) {
            expect(prevScore).toBeGreaterThanOrEqual(currScore)
          }
        }
      }
    })

    it('fetches AI metadata', async () => {
      const response = await client.getAIMetadata('taj-mahal')

      expect(response.data).toBeDefined()
      expect(response.data.slug).toBe('taj-mahal')
      expect(response.data.embedding_checksum).toBeDefined()
      expect(response.data.license).toBeDefined()
      expect(typeof response.data.license).toBe('object')
      expect(response.data.sources).toBeInstanceOf(Array)
    })

    it('fetches AI vector index (NDJSON)', async () => {
      const response = await client.getAIVectorIndex({ limit: 10, offset: 0 })

      expect(response.data).toBeInstanceOf(Array)
      expect(response.data.length).toBeGreaterThan(0)
      expect(response.data.length).toBeLessThanOrEqual(10)

      const record = response.data[0]
      expect(record.slug).toBeDefined()
      expect(record.vector).toBeInstanceOf(Array)
      expect(record.embedding_checksum).toBeDefined()
      expect(record.embedding_dimensions).toBe(1536)
    })

    it('fetches AI license', async () => {
      const response = await client.getAILicense()

      expect(response.data).toBeDefined()
      expect(response.data.name).toBeDefined()
      expect(response.data.license).toBeDefined()
      expect(response.data.requirements.ai_headers['AI-Use-Allowed']).toBe('true')
    })
  })

  describe('LangChain Integration', () => {
    it('creates and invokes heritage context runnable', async () => {
      const runnable = createHeritageContextRunnable({ client })

      const result = await runnable.invoke({ slug: 'taj-mahal' })

      expect(result).toBeDefined()
      if (result && typeof result === 'object' && 'slug' in result) {
        expect(result.slug).toBe('taj-mahal')
        if ('context' in result) {
          expect(result.context).toBeDefined()
        }
        if ('embedding' in result) {
          expect(Array.isArray(result.embedding)).toBe(true)
        }
      }
    })

    it('creates toolkit with working tools', async () => {
      const tools = createInheritageToolkit({ client })

      expect(tools).toBeInstanceOf(Array)
      expect(tools.length).toBeGreaterThan(0)

      const contextTool = tools.find(tool => tool.name === 'get_heritage_ai_context')
      expect(contextTool).toBeDefined()

      if (contextTool) {
        const result = await contextTool.runnable.invoke({ slug: 'taj-mahal' })
        expect(result).toBeDefined()
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result)
        expect(typeof resultStr).toBe('string')

        const parsed = JSON.parse(resultStr)
        expect(parsed.slug).toBe('taj-mahal')
        expect(parsed.context).toBeDefined()
      }
    })
  })

  describe('HTTP Headers', () => {
    it('includes attribution headers in responses', async () => {
      const response = await client.getHeritage('taj-mahal')

      expect(response.headers).toBeDefined()
      // Check for common headers
      const licenseHeader = response.headers?.get('X-Inheritage-License')
      expect(licenseHeader).toBeDefined()
    })

    it('includes trace ID for debugging', async () => {
      const response = await client.getHeritage('taj-mahal')

      expect(response.traceId).toBeDefined()
      expect(typeof response.traceId).toBe('string')
      expect(response.traceId.length).toBeGreaterThan(0)
    })

    it('includes rate limit info', async () => {
      const response = await client.getHeritage('taj-mahal')

      expect(response.rateLimit).toBeDefined()
      expect(response.rateLimit?.limit).toBeGreaterThan(0)
      expect(response.rateLimit?.remaining).toBeGreaterThanOrEqual(0)
      expect(response.rateLimit?.reset).toBeGreaterThan(0)
    })
  })

  describe('Caching', () => {
    it('supports ETag conditional requests', async () => {
      const response1 = await client.getHeritage('taj-mahal')
      const etag = response1.headers?.get('ETag')

      if (etag) {
        const response2 = await client.getHeritage('taj-mahal', { ifNoneMatch: etag })

        if (response2.notModified) {
          expect(response2.data).toBeNull()
        } else {
          expect(response2.data).toBeDefined()
        }
      }
    })
  })

  describe('Error Handling', () => {
    it('handles 404 errors correctly', async () => {
      try {
        await client.getHeritage('this-site-does-not-exist-xyz')
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.statusCode).toBe(404)
        expect(error.message).toBeDefined()
      }
    })

    it('handles rate limiting (if triggered)', async () => {
      // This test may not trigger rate limits in CI, but demonstrates handling
      try {
        // Make many requests quickly
        const promises = Array.from({ length: 150 }, () =>
          client.getHeritage('taj-mahal')
        )
        await Promise.all(promises)
      } catch (error: any) {
        if (error.statusCode === 429) {
          expect(error.retryAfter).toBeGreaterThan(0)
          expect(error.message).toContain('rate')
        }
      }
    }, 30000) // Longer timeout for this test
  })
})

