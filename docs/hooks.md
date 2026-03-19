# React Hooks Guide

The `@inheritage-foundation/sdk` provides a comprehensive set of React hooks for seamless integration with the Inheritage API. All hooks handle loading states, errors, caching, and automatic refetching.

## Installation

```bash
npm install @inheritage-foundation/sdk
```

**Note**: React 18+ is required as a peer dependency.

---

## Core Concepts

### Auto-Caching

All hooks automatically cache responses using React's built-in state management. They respect HTTP caching headers (`ETag`, `Cache-Control`) for optimal performance.

### Error Handling

Every hook returns an `error` state containing the error object if the request fails:

```tsx
const { data, loading, error } = useHeritage('taj-mahal')

if (error) {
  return <div>Error: {error.message}</div>
}
```

### Conditional Fetching

Use the `enabled` option to conditionally fetch data:

```tsx
const [slug, setSlug] = useState<string | null>(null)

const { data } = useHeritage(slug || '', {
  enabled: Boolean(slug), // Only fetch when slug is set
})
```

### Custom Client

Pass a custom `InheritageClient` instance to any hook:

```tsx
const customClient = new InheritageClient({
  baseUrl: 'https://staging.inheritage.foundation/api/v1',
  attribution: 'visible',
})

const { data } = useHeritage('taj-mahal', { client: customClient })
```

---

## Heritage Hooks

### `useHeritage(slug, options?)`

Fetch a single heritage site by slug.

**Parameters**:

- `slug` (string): The heritage site slug
- `options` (UseHeritageOptions): Optional configuration

**Returns**: `UseHeritageResult`

- `data` (Heritage | null): The heritage site data
- `loading` (boolean): Loading state
- `error` (Error | null): Error if request failed
- `refetch` (() => Promise<void>): Function to manually refetch

**Example**:

```tsx
function HeritagePage({ slug }: { slug: string }) {
  const { data, loading, error, refetch } = useHeritage(slug)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <NotFound />

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  )
}
```

### `useHeritageList(params?, options?)`

Fetch a paginated list of heritage sites with optional filters.

**Parameters**:

- `params` (HeritageListParams): Query parameters (state, category, limit, offset, etc.)
- `options` (UseHeritageOptions): Optional configuration

**Returns**: `UseHeritageListResult`

**Example**:

```tsx
function HeritageList() {
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, loading, error } = useHeritageList({
    state: 'Karnataka',
    category: 'Temple',
    limit,
    offset: page * limit,
  })

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <div className="grid">
        {data?.data.map(site => (
          <HeritageCard key={site.id} site={site} />
        ))}
      </div>
      <Pagination
        current={page}
        total={Math.ceil((data?.meta.total ?? 0) / limit)}
        onChange={setPage}
      />
    </div>
  )
}
```

---

## Geospatial Hooks

### `useGeoNearby(params, options?)`

Fetch nearby heritage sites as GeoJSON.

**Parameters**:

- `params` (GeoNearbyParams): lat, lon, radius, limit
- `options` (UseHeritageOptions): Optional configuration

**Returns**: `UseGeoNearbyResult`

**Example**:

```tsx
function NearbyMap() {
  const [location, setLocation] = useState({ lat: 28.6139, lon: 77.2090 })

  const { data, loading } = useGeoNearby({
    lat: location.lat,
    lon: location.lon,
    radius: 10, // km
    limit: 50,
  })

  return (
    <MapContainer>
      {data?.features.map(feature => (
        <Marker
          key={feature.properties.slug}
          position={[
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0],
          ]}
        >
          <Popup>{feature.properties.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

---

## Media Hooks

### `useMedia(slug, options?)`

Fetch media bundle for a heritage site.

**Parameters**:

- `slug` (string): The heritage site slug
- `options` (UseHeritageOptions): Optional configuration

**Returns**: `UseMediaResult`

**Example**:

```tsx
function MediaGallery({ slug }: { slug: string }) {
  const { data, loading } = useMedia(slug)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <img src={data?.primary_image} alt="Primary" />
      <div className="gallery">
        {data?.gallery.map((img, idx) => (
          <img key={idx} src={img.url} alt={img.caption || ''} />
        ))}
      </div>
    </div>
  )
}
```

---

## Citation Hooks

### `useCitation(entityId, options?)`

Fetch citation/attribution metadata.

**Parameters**:

- `entityId` (string): Entity ID or slug
- `options` (UseHeritageOptions): Optional configuration

**Returns**: `UseCitationResult`

**Example**:

```tsx
function CitationDisplay({ entityId }: { entityId: string }) {
  const { data } = useCitation(entityId)

  return data ? <InheritageCitation citation={data} showBadge /> : null
}
```

---

## AI Hooks

### `useAIContext(slug, options?)`

Fetch AI context and embedding for a heritage site.

**Parameters**:

- `slug` (string): The heritage site slug
- `options` (UseHeritageOptions): Optional configuration

**Returns**: `UseAIContextResult`

**Example**:

```tsx
function AIContextPanel({ slug }: { slug: string }) {
  const { data, loading } = useAIContext(slug)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h3>AI-Generated Context</h3>
      <p>{data?.context}</p>
      <details>
        <summary>Technical Details</summary>
        <ul>
          <li>Model: {data?.model}</li>
          <li>Dimensions: {data?.embedding_dimensions}</li>
          <li>Checksum: {data?.embedding_checksum}</li>
        </ul>
      </details>
    </div>
  )
}
```

### `useSimilarSites(params, options?)`

Find semantically similar heritage sites.

**Parameters**:

- `params` (AISimilarParams): { slug?, embedding?, limit? }
- `options` (UseHeritageOptions): Optional configuration

**Returns**: `UseSimilarSitesResult`

**Example**:

```tsx
function SimilarSites({ slug }: { slug: string }) {
  const { data, loading } = useSimilarSites({ slug, limit: 5 })

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h3>Similar Sites</h3>
      <ul>
        {data?.data.map(entry => (
          <li key={entry.site.slug}>
            <Link to={`/heritage/${entry.site.slug}`}>
              {entry.site.name}
            </Link>
            <span> (similarity: {(entry.score * 100).toFixed(1)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### `useAIMetadata(slug, options?)`

Fetch comprehensive AI metadata for a heritage site.

**Parameters**:

- `slug` (string): The heritage site slug
- `options` (UseHeritageOptions): Optional configuration

**Returns**: `UseAIMetadataResult`

**Example**:

```tsx
function MetadataInspector({ slug }: { slug: string }) {
  const { data } = useAIMetadata(slug)

  return (
    <pre>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
```

### `useAIVectorIndex(params?, options?)`

Paginate through the AI vector index with infinite scroll support.

**Parameters**:

- `params` (AIVectorIndexParams): { limit?, offset? }
- `options` (UseHeritageOptions): Optional configuration

**Returns**: `UseAIVectorIndexResult`

- `data` (AIVectorRecord[] | null)
- `loading` (boolean)
- `error` (Error | null)
- `hasMore` (boolean): Whether more records are available
- `loadMore` (() => Promise<void>): Function to load next page

**Example**:

```tsx
function VectorIndexViewer() {
  const { data, loading, hasMore, loadMore } = useAIVectorIndex({ limit: 50 })

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Slug</th>
            <th>Checksum</th>
            <th>Dimensions</th>
          </tr>
        </thead>
        <tbody>
          {data?.map(record => (
            <tr key={record.slug}>
              <td>{record.slug}</td>
              <td>{record.embedding_checksum.slice(0, 8)}...</td>
              <td>{record.embedding_dimensions}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

---

## Advanced Patterns

### Combining Multiple Hooks

```tsx
function HeritageDashboard({ slug }: { slug: string }) {
  const heritage = useHeritage(slug)
  const aiContext = useAIContext(slug)
  const similar = useSimilarSites({ slug, limit: 3 })
  const media = useMedia(slug)

  const loading = heritage.loading || aiContext.loading || similar.loading || media.loading
  const error = heritage.error || aiContext.error || similar.error || media.error

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <HeroSection data={heritage.data} media={media.data} />
      <AIContextSection data={aiContext.data} />
      <SimilarSitesSection data={similar.data} />
      <InheritageCitation citation={heritage.data?.citations} display="block" showBadge />
    </div>
  )
}
```

### Infinite Scroll with `useHeritageList`

```tsx
function InfiniteHeritageList() {
  const [items, setItems] = useState<Heritage[]>([])
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, loading } = useHeritageList({
    limit,
    offset: page * limit,
  })

  useEffect(() => {
    if (data?.data) {
      setItems(prev => [...prev, ...data.data])
    }
  }, [data])

  const loadMore = () => setPage(prev => prev + 1)

  return (
    <InfiniteScroll onReachBottom={loadMore} loading={loading}>
      {items.map(site => (
        <HeritageCard key={site.id} site={site} />
      ))}
    </InfiniteScroll>
  )
}
```

### Real-time Updates with `refetch`

```tsx
function LiveHeritagePage({ slug }: { slug: string }) {
  const { data, refetch } = useHeritage(slug)

  useEffect(() => {
    const interval = setInterval(() => {
      refetch() // Poll for updates every 30 seconds
    }, 30000)

    return () => clearInterval(interval)
  }, [refetch])

  return <div>{/* render data */}</div>
}
```

---

## TypeScript Support

All hooks are fully typed with TypeScript:

```tsx
import type { Heritage, AIContextResponse, UseHeritageOptions } from '@inheritage-foundation/sdk'

const { data }: { data: Heritage | null } = useHeritage('taj-mahal')
const { data: aiData }: { data: AIContextResponse | null } = useAIContext('taj-mahal')
```

---

## Best Practices

1. **Use `enabled` for conditional fetching** to avoid unnecessary requests
2. **Memoize params** to prevent infinite re-renders:

   ```tsx
   const params = useMemo(() => ({ state: 'Karnataka', limit: 20 }), [])
   const { data } = useHeritageList(params)
   ```

3. **Show loading and error states** for better UX
4. **Use `<InheritageCitation />`** component to comply with CC BY 4.0
5. **Respect rate limits** by caching aggressively and using `refetch` sparingly

---

## Next Steps

- [Component Reference](./components.md)
- [LangChain Integration](./langchain.md)
- [API Documentation](https://www.inheritage.foundation/docs/api)
- [Examples](../examples/)
