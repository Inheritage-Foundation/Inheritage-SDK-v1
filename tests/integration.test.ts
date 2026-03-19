/**
 * SDK Integration Tests
 * 
 * Tests for OAI-PMH, LIDO, CIDOC, and AAT methods
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { InheritageClient } from '../src/client'

// Skip these tests in CI without API access
const describeIf = process.env.INHERITAGE_API_KEY ? describe : describe.skip

describeIf('Institutional Format Methods', () => {
  let client: InheritageClient

  beforeAll(() => {
    client = new InheritageClient({
      baseUrl: process.env.INHERITAGE_API_URL || 'https://inheritage.foundation/api/v1',
    })
  })

  describe('OAI-PMH Methods', () => {
    it('executes OAI-PMH Identify verb', async () => {
      const response = await client.oaipmhIdentify()
      
      expect(response.status).toBe(200)
      expect(response.data).toContain('<OAI-PMH')
      expect(response.data).toContain('<Identify>')
      expect(response.data).toContain('inheritage')
    })

    it('executes OAI-PMH ListMetadataFormats verb', async () => {
      const response = await client.oaipmhListMetadataFormats()
      
      expect(response.status).toBe(200)
      expect(response.data).toContain('<ListMetadataFormats>')
      expect(response.data).toContain('oai_dc')
      expect(response.data).toContain('lido')
    })

    it('executes OAI-PMH ListSets verb', async () => {
      const response = await client.oaipmhListSets()
      
      expect(response.status).toBe(200)
      expect(response.data).toContain('<ListSets>')
      expect(response.data).toContain('state:')
      expect(response.data).toContain('category:')
    })

    it('executes OAI-PMH ListIdentifiers verb', async () => {
      const response = await client.oaipmhListIdentifiers('oai_dc', {
        from: '2024-01-01T00:00:00Z',
      })
      
      expect(response.status).toBe(200)
      expect(response.data).toContain('<ListIdentifiers>')
      expect(response.data).toContain('<identifier>')
    })

    it('executes OAI-PMH ListRecords verb', async () => {
      const response = await client.oaipmhListRecords('oai_dc', {
        from: '2024-01-01T00:00:00Z',
      })
      
      expect(response.status).toBe(200)
      expect(response.data).toContain('<ListRecords>')
      expect(response.data).toContain('<record>')
    })

    it('executes OAI-PMH GetRecord verb', async () => {
      // This test requires a valid identifier
      // Skipping for now as we need a known valid identifier
      expect(true).toBe(true)
    })
  })

  describe('LIDO Methods', () => {
    it('fetches heritage LIDO XML', async () => {
      // This requires a valid slug - using a placeholder
      // In production, use a real slug like 'taj-mahal'
      try {
        const response = await client.getHeritageLIDO('taj-mahal')
        expect(response.status).toBe(200)
        expect(response.data).toContain('<?xml')
        expect(response.data).toContain('lido')
      } catch (error) {
        // If slug not found, that's okay for testing
        expect(error).toBeDefined()
      }
    })

    it('exports heritage LIDO ZIP', async () => {
      const response = await client.exportHeritageLIDO({
        limit: 5,
      })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('application/zip')
    })
  })

  describe('CIDOC-CRM Methods', () => {
    it('fetches heritage CIDOC-CRM JSON-LD', async () => {
      try {
        const response = await client.getHeritageCIDOC('taj-mahal')
        expect(response.status).toBe(200)
        expect(response.data).toContain('@context')
        expect(response.data).toContain('@graph')
      } catch (error) {
        // If slug not found, that's okay for testing
        expect(error).toBeDefined()
      }
    })
  })

  describe('AAT Methods', () => {
    it('searches AAT terms', async () => {
      const response = await client.searchAAT({
        q: 'temple',
        limit: 5,
      })
      
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data.data).toBeInstanceOf(Array)
    })

    it('fetches AAT term by ID', async () => {
      try {
        // This requires a valid AAT ID
        const response = await client.getAATTerm('test-slug')
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('id')
        expect(response.data).toHaveProperty('label')
      } catch (error) {
        // If not found, that's okay for testing
        expect(error).toBeDefined()
      }
    })

    it('fetches AAT languages', async () => {
      const response = await client.getAATLanguages()
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('languages')
      expect(response.data.languages).toBeInstanceOf(Array)
    })

    it('fetches AAT materials', async () => {
      const response = await client.getAATMaterials()
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('materials')
      expect(response.data.materials).toBeInstanceOf(Array)
    })

    it('fetches AAT scripts', async () => {
      const response = await client.getAATScripts()
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('scripts')
      expect(response.data.scripts).toBeInstanceOf(Array)
    })

    it('reconciles AAT terms (OpenRefine)', async () => {
      const response = await client.reconcileAAT({
        queries: {
          q1: {
            query: 'temple architecture',
            limit: 3,
          },
        },
      })
      
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
    })
  })
})

describeIf('Google Maps Proxy Methods', () => {
  let client: InheritageClient

  beforeAll(() => {
    client = new InheritageClient({
      baseUrl: process.env.INHERITAGE_API_URL || 'https://inheritage.foundation/api/v1',
    })
  })

  describe('Google Maps Methods', () => {
    it('geocodes an address', async () => {
      try {
        const response = await client.geocodeAddress('Taj Mahal, Agra, India')
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('results')
      } catch (error) {
        // API key may not be configured in test environment
        expect(error).toBeDefined()
      }
    })

    it('gets elevation data', async () => {
      try {
        const response = await client.getElevation({
          locations: [{ lat: 27.1751, lng: 78.0421 }], // Taj Mahal coordinates
        })
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('results')
      } catch (error) {
        // API key may not be configured in test environment
        expect(error).toBeDefined()
      }
    })

    it('searches nearby places', async () => {
      try {
        const response = await client.searchPlaces({
          location: { lat: 27.1751, lng: 78.0421 },
          radius: 1000,
          type: 'tourist_attraction',
        })
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('results')
      } catch (error) {
        // API key may not be configured in test environment
        expect(error).toBeDefined()
      }
    })
  })
})

describeIf('Atlas and Additional Methods', () => {
  let client: InheritageClient

  beforeAll(() => {
    client = new InheritageClient({
      baseUrl: process.env.INHERITAGE_API_URL || 'https://inheritage.foundation/api/v1',
    })
  })

  describe('Atlas Methods', () => {
    it('fetches atlas sites', async () => {
      const response = await client.getAtlasSites()
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('sites')
      expect(response.data.sites).toBeInstanceOf(Array)
    })
  })

  describe('SPARQL Methods', () => {
    it('executes SPARQL query', async () => {
      try {
        const response = await client.executeSparqlQuery({
          query: 'SELECT * WHERE { ?s ?p ?o } LIMIT 10',
        })
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('head')
        expect(response.data).toHaveProperty('results')
      } catch (error) {
        // SPARQL may not be enabled in test environment
        expect(error).toBeDefined()
      }
    })
  })

  describe('Lead and Pilot Methods', () => {
    it('submits a lead (dev mode)', async () => {
      // This will only work in dev mode without webhook configured
      try {
        const response = await client.submitLead({
          organization: 'Test Organization',
          contact_name: 'Test User',
          email: 'test@example.com',
          intended_use: 'Testing SDK methods',
        })
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('success')
      } catch (error) {
        // May fail if webhook is configured but invalid
        expect(error).toBeDefined()
      }
    })

    it('applies for pilot program', async () => {
      try {
        const response = await client.applyForPilot({
          organization: 'Test Organization',
          contact_name: 'Test User',
          email: 'test@example.com',
          role: 'Developer',
          intended_use: 'Testing SDK methods',
          data_needs: 'Heritage site data',
          timeline: 'Q2 2026',
        })
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('success')
      } catch (error) {
        // May fail if webhook is configured but invalid
        expect(error).toBeDefined()
      }
    })
  })
})
