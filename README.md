# @inheritage-foundation/sdk

[![npm version](https://img.shields.io/npm/v/@inheritage-foundation/sdk.svg)](https://www.npmjs.com/package/@inheritage-foundation/sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/actions/workflows/ci.yml/badge.svg)](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/actions)

Official TypeScript SDK for the [Inheritage Foundation](https://inheritage.foundation) public API. Access India's documented heritage programmatically—temples, monuments, cultural sites—with zero gatekeeping, full attribution, and production-grade ergonomics.

**License:** Apache 2.0 (SDK code) | Data under CC BY 4.0  
**Data Attribution:** Required per CC BY 4.0 — see [AI Usage Policy](https://inheritage.foundation/license/ai)

---

## Features

- 🏛️ **5000+ Heritage Sites**: Temples, forts, monuments across India
- 🗺️ **GeoJSON Support**: EPSG:4326, bbox queries, native geospatial APIs
- 🏛️ **CIDOC-CRM & Institutional**: JSON-LD, LIDO XML, OAI-PMH harvesting for museums & aggregators
- 🤖 **AI-Ready**: 1536-d embeddings, semantic search, LangChain/LangGraph adapters
- ⚛️ **React Hooks**: `useHeritage`, `useAIContext`, `useSimilarSites` with auto-caching
- 🎨 **Attribution Component**: `<InheritageCitation />` for CC BY 4.0 compliance
- 📦 **Tree-shakeable**: ESM/CJS dual build, zero runtime dependencies (except React for hooks)
- 🔒 **Type-Safe**: Full TypeScript definitions generated from OpenAPI spec
- ⚡ **Smart Caching**: ETag, If-None-Match, stale-while-revalidate support
- 🚦 **Rate Limit Aware**: Automatic retry headers, exponential backoff utilities
- 🌐 **Multi-Format**: JSON, GeoJSON, NDJSON vector feeds

---

## Installation

```bash
npm install @inheritage-foundation/sdk
# or
yarn add @inheritage-foundation/sdk
# or
pnpm add @inheritage-foundation/sdk
```

---

## Quick Start

### Basic Usage

```typescript
import { InheritageClient } from '@inheritage-foundation/sdk'

const client = new InheritageClient({
  baseUrl: 'https://inheritage.foundation/api/v1', // optional, this is default
  attribution: 'visible', // required for CC BY 4.0 compliance
})

// Fetch a heritage site
const site = await client.getHeritage('hoysaleswara-temple')
console.log(site.data.name) // "Hoysaleswara Temple"
console.log(site.data.state) // "Karnataka"

// List heritage sites with filters
const sites = await client.listHeritage({
  state: 'Karnataka',
  category: 'Temple',
  limit: 10,
  offset: 0,
})
console.log(sites.data.data.length) // 10
console.log(sites.data.meta.total) // 450

// Nearby search (GeoJSON)
const nearby = await client.getGeoNearby({
  lat: 28.6139,
  lon: 77.2090,
  radius: 10, // km
  limit: 5,
})
console.log(nearby.data.type) // "FeatureCollection"
console.log(nearby.data.features[0].properties.name) // "Qutb Minar"
```

### React Hooks

```tsx
import { useHeritage, useAIContext, InheritageCitation } from '@inheritage-foundation/sdk'

function HeritagePage({ slug }: { slug: string }) {
  const { data, loading, error } = useHeritage(slug)
  const { data: aiContext } = useAIContext(slug)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return <div>Not found</div>

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      
      {aiContext && (
        <div>
          <h2>AI Context</h2>
          <p>{aiContext.context}</p>
          <small>Embedding dimensions: {aiContext.embedding_dimensions}</small>
        </div>
      )}
      
      <InheritageCitation citation={data.citations} display="block" showBadge />
    </div>
  )
}
```

### AI & Semantic Search

```typescript
// Get AI context and embeddings
const context = await client.getAIContext('taj-mahal')
console.log(context.data.context) // "The Taj Mahal is a 17th-century mausoleum..."
console.log(context.data.embedding.length) // 1536
console.log(context.data.embedding_checksum) // "a1b2c3d4..."

// Find similar sites
const similar = await client.findSimilar({
  slug: 'taj-mahal',
  limit: 5,
})
similar.data.data.forEach(entry => {
  console.log(`${entry.score.toFixed(3)} - ${entry.site.name}`)
})
// Output:
// 0.987 - Humayun's Tomb
// 0.954 - Red Fort
// 0.932 - Agra Fort

// Get AI metadata bundle
const metadata = await client.getAIMetadata('taj-mahal')
console.log(metadata.data.model) // "inheritage-d1"
console.log(metadata.data.model_version) // "2025-01-15"
console.log(metadata.data.license_url) // "https://inheritage.foundation/license/ai"

// Stream vector index for database sync
const vectors = await client.getAIVectorIndex({ limit: 100, offset: 0 })
vectors.data.forEach(record => {
  console.log(record.slug, record.vector.length, record.embedding_checksum)
})
```

### LangChain Integration

```typescript
import { InheritageClient, createHeritageContextRunnable, createInheritageToolkit } from '@inheritage-foundation/sdk/langchain'
import { ChatOpenAI } from '@langchain/openai'

const client = new InheritageClient({ attribution: 'visible' })

// Create a runnable for AI context retrieval
const heritageContextChain = createHeritageContextRunnable({ 
  client,
  includeHeaders: false, // set true to include API metadata
})

const result = await heritageContextChain.invoke({ slug: 'khajuraho' })
console.log(result.context)
console.log(result.embedding_dimensions) // 1536

// Create tools for LangChain agents
const tools = createInheritageToolkit(client)
const llm = new ChatOpenAI({ modelName: 'gpt-4-turbo' })

// Agent can now use:
// - get_heritage_ai_context
// - find_similar_heritage_sites
// - get_heritage_ai_metadata
// - get_heritage_ai_license
```

---

## API Coverage

### Heritage API

**Endpoints**: `GET /heritage/:slug`, `GET /heritage`, `GET /heritage/featured`, `GET /heritage/top`

Fetch detailed information about cultural heritage sites including:
- Name, description, historical context
- Location (state, coordinates, geolocation)
- Architecture (style, materials, construction)
- Visitor information (hours, fees, facilities)
- Media (images, videos, 360° panoramas, floor plans)
- Timeline events, references, analytics

**Example**:

```typescript
const site = await client.getHeritage('ram-mandir-ayodhya')
console.log(site.data.architecture.style) // "Nagara Style"
console.log(site.data.visitor_info.entry_fee) // "Free"
console.log(site.data.media.primary_image) // "https://cdn.inheritage.foundation/..."
```

### Geospatial API

**Endpoints**: `GET /geo/nearby`, `GET /geo/region`, `GET /geo/:slug`

GeoJSON-first geospatial queries:
- Nearby search by lat/lon with radius
- Region/bounding box queries
- Single-site GeoJSON feature
- EPSG:4326 coordinates, `Accept: application/geo+json` header support

**Example**:

```typescript
const nearby = await client.getGeoNearby({
  lat: 19.0760,
  lon: 72.8777,
  radius: 5, // km
  limit: 10,
})
nearby.data.features.forEach(feature => {
  console.log(feature.properties.name, feature.geometry.coordinates)
})
```

### Media API

**Endpoints**: `GET /media/:slug`

Fetch media bundles including:
- Primary images, galleries, panoramas
- 360° virtual tours, floor plans, site plans
- Point clouds, mesh data, CAD files
- Videos, documents

**Example**:

```typescript
const media = await client.getMedia('hoysaleswara-temple')
console.log(media.data.primary_image) // "https://cdn.inheritage.foundation/..."
console.log(media.data.gallery.length) // 24
console.log(media.data.panoramas[0].url) // "https://cdn.inheritage.foundation/..."
```

### Citation API

**Endpoints**: `GET /citation/:entityId`

Retrieve attribution metadata for any entity:

```typescript
const citation = await client.getCitation('taj-mahal')
console.log(citation.data.required_display) // "Data © Inheritage Foundation"
console.log(citation.data.license) // "CC BY 4.0"
```

### CIDOC-CRM & Institutional APIs

**Endpoints**: `GET /cidoc/:slug`, `GET /lido/:slug`, `GET /lido/export`, `GET /oai-pmh`

Access heritage data in international museum standards:

**CIDOC-CRM JSON-LD** (ISO 21127:2023):
```typescript
const cidoc = await client.getHeritageCIDOC('hoysaleswara-temple')
console.log(cidoc.data['@type']) // "E22_Human-Made_Object"
console.log(cidoc.data.sameAs) // ["https://www.wikidata.org/entity/Q570336", ...]
```

**LIDO XML** (for museums, Europeana):
```typescript
// Single site
const lido = await client.getHeritageLIDO('red-fort', false)
console.log(lido.data) // "<lido:lido>...</lido:lido>"

// Bulk export (ZIP)
const lidoZip = await client.exportHeritageLIDO({
  state: 'Karnataka',
  category: 'Temple',
  limit: 100,
})
// Returns ZIP blob with multiple LIDO XML files
```

**OAI-PMH 2.0** (for automated harvesting):
```typescript
// Repository identification
const identify = await client.oaipmhIdentify()

// List all records in LIDO format
const records = await client.oaipmhListRecords('lido', {
  from: '2025-01-01T00:00:00Z',
  set: 'state:Karnataka',
})

// Get specific record
const record = await client.oaipmhGetRecord(
  'oai:inheritage.foundation:heritage:taj-mahal',
  'lido'
)
```

### AI Context, Metadata & Federation

**Endpoints**: `GET /ai/context/:slug`, `/ai/embedding/:slug`, `POST /ai/similar`, `GET /ai/meta/:slug`, `POST /ai/vision/context`, `GET /ai/vector-index.ndjson`, `GET /license/ai`

**Features**:
- Deterministic narratives + 1536-d embeddings with checksum + model version headers
- Similarity endpoint accepts either `slug` or a custom `embedding` array, returning cosine-ranked matches with reference metadata
- Metadata endpoint mirrors the production schema (`embedding_checksum`, `sources`, `same_as`) for LangChain/LangGraph ingestion
- Vision ingress classifies an image (URL/Base64) into probable heritage sites with captions + style predictions
- Vector feed emits NDJSON slices for Pinecone/Weaviate/Chroma syncing; use `getAIVectorIndex` with `limit/offset` pagination
- AI license endpoint provides the JSON addendum required for policy auditors and automated agents

**Example**:

```typescript
// AI Context
const context = await client.getAIContext('ajanta-caves-maharashtra')
console.log(context.data.context) // "The Ajanta Caves are a UNESCO World Heritage Site..."
console.log(context.data.embedding_checksum) // SHA-256 checksum for reproducibility

// Similar Sites
const similar = await client.findSimilar({ slug: 'ajanta-caves-maharashtra', limit: 5 })
console.table(similar.data.data.map(entry => ({
  score: entry.score.toFixed(3),
  slug: entry.site.slug,
  state: entry.site.state
})))

// AI Metadata
const metadata = await client.getAIMetadata('ajanta-caves-maharashtra')
console.log(metadata.data.embedding_checksum) // Stable SHA-256 checksum
console.log(metadata.data.license_url) // "https://inheritage.foundation/license/ai"

// Vector Index Feed
const vectorFeed = await client.getAIVectorIndex({ limit: 100 })
vectorFeed.data.forEach(record => {
  console.log(record.slug, record.embedding_checksum)
})

// Vision Context
const vision = await client.getAIVisionContext({ 
  image_url: 'https://cdn.inheritage.foundation/hoysaleswara/front.jpg' 
})
console.log(vision.data.caption) // "A detailed view of the Hoysaleswara Temple facade."
console.log(vision.data.architectural_style_prediction) // "Hoysala"

// AI License
const license = await client.getAILicense()
console.log(license.data.requirements.ai_headers['AI-Use-Allowed']) // "true"
```

---

## React Hooks Reference

### `useHeritage(slug, options?)`

Fetch a single heritage site with automatic loading/error states.

```tsx
const { data, loading, error, refetch } = useHeritage('taj-mahal', {
  client: customClient, // optional
  enabled: true, // optional, default true
})
```

### `useHeritageList(params?, options?)`

Fetch paginated heritage sites with filters.

```tsx
const { data, loading, error, refetch } = useHeritageList({
  state: 'Karnataka',
  category: 'Temple',
  limit: 20,
}, { enabled: true })
```

### `useGeoNearby(params, options?)`

Fetch nearby heritage sites as GeoJSON.

```tsx
const { data, loading, error, refetch } = useGeoNearby({
  lat: 28.6139,
  lon: 77.2090,
  radius: 10,
})
```

### `useAIContext(slug, options?)`

Fetch AI context and embeddings.

```tsx
const { data, loading, error, refetch } = useAIContext('khajuraho')
```

### `useSimilarSites(params, options?)`

Find semantically similar sites.

```tsx
const { data, loading, error, refetch } = useSimilarSites({
  slug: 'taj-mahal',
  limit: 5,
})
```

### `useAIVectorIndex(params?, options?)`

Paginate through the vector index with infinite scroll support.

```tsx
const { data, loading, error, hasMore, loadMore } = useAIVectorIndex({
  limit: 100,
})

// Call loadMore() to fetch next page
```

---

## Components Reference

### `<InheritageCitation />`

Renders CC BY 4.0 attribution for Inheritage data.

**Props**:
- `citation` (CitationEntry): Citation data from API response
- `display` ('inline' | 'block'): Display mode (default: 'inline')
- `className` (string): Custom CSS class
- `style` (CSSProperties): Custom inline styles
- `showBadge` (boolean): Show CC BY 4.0 badge (default: false)
- `showLegal` (boolean): Show full legal text (default: false)

**Examples**:

```tsx
// Inline (compact)
<InheritageCitation citation={response.citations} />

// Block with badge
<InheritageCitation 
  citation={response.citations} 
  display="block" 
  showBadge 
/>

// Full legal notice
<InheritageCitation 
  citation={response.citations} 
  display="block" 
  showBadge 
  showLegal 
/>
```

---

## Advanced Features

### Caching & Conditional Requests

```typescript
// Use ETag for conditional requests
const response1 = await client.getHeritage('taj-mahal')
const etag = response1.headers?.get('ETag')

const response2 = await client.getHeritage('taj-mahal', { ifNoneMatch: etag })
if (response2.notModified) {
  console.log('Use cached data')
} else {
  console.log('Fresh data:', response2.data)
}

// If-Modified-Since
const lastModified = response1.headers?.get('Last-Modified')
const response3 = await client.getHeritage('taj-mahal', { ifModifiedSince: lastModified })
```

### Rate Limit Handling

```typescript
const response = await client.getHeritage('taj-mahal')
if (response.rateLimit) {
  console.log(`${response.rateLimit.remaining}/${response.rateLimit.limit} requests remaining`)
  console.log(`Resets at: ${new Date(response.rateLimit.reset * 1000)}`)
}

// Handle 429 errors
try {
  await client.listHeritage({ limit: 1000 })
} catch (error) {
  if (error.statusCode === 429) {
    const retryAfter = error.retryAfter // seconds
    console.log(`Retry after ${retryAfter} seconds`)
  }
}
```

### Abort Requests

```typescript
const controller = new AbortController()
const promise = client.getHeritage('taj-mahal', { signal: controller.signal })

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000)

try {
  await promise
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request cancelled')
  }
}
```

---

## Testing

The SDK includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Unit tests only
npm test -- --grep "unit"

# Integration tests only
npm test -- --grep "integration"

# E2E tests only
npm test -- --grep "e2e"
```

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License & Attribution

- **SDK Code**: Apache 2.0
- **API Data**: CC BY 4.0 (requires attribution: "Data © Inheritage Foundation")
- **AI Usage**: See [AI Usage Policy](https://inheritage.foundation/license/ai)

When using this SDK, you **must** provide visible attribution per CC BY 4.0. The SDK automatically includes required headers. For web applications, use the `<InheritageCitation />` component.

---

## Resources

- **Documentation**: [https://inheritage.foundation/docs](https://inheritage.foundation/docs)
- **API Playground**: [https://inheritage.foundation/docs/playground](https://inheritage.foundation/docs/playground)
- **OpenAPI Spec**: [https://inheritage.foundation/openapi/v1.yaml](https://inheritage.foundation/openapi/v1.yaml)
- **LangChain Guide**: [https://inheritage.foundation/docs/langchain](https://inheritage.foundation/docs/langchain)
- **GitHub**: [https://github.com/Inheritage-Foundation/Inheritage-SDK-v1](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1)
- **Issues**: [https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/issues](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/issues)

---

## Support

- **Email**: [hello@inheritage.foundation](mailto:hello@inheritage.foundation)
- **Discord**: [Join our community](https://discord.gg/inheritage)
- **Funding**: [Support our mission](https://inheritage.foundation/donate)

---

**Built with ❤️ by [Inheritage Foundation](https://inheritage.foundation)** | Preserving India's cultural heritage through open data
