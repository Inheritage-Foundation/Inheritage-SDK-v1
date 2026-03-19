# React Components Guide

The `@inheritage-foundation/sdk` provides React components for common use cases, starting with the essential `<InheritageCitation />` component for CC BY 4.0 compliance.

---

## Installation

```bash
npm install @inheritage-foundation/sdk
```

**Peer Dependencies**: React 18+

---

## `<InheritageCitation />`

The `<InheritageCitation />` component renders proper CC BY 4.0 attribution for Inheritage data. It automatically formats citation information from API responses and ensures compliance with the Creative Commons license.

### Basic Usage

```tsx
import { InheritageCitation } from '@inheritage-foundation/sdk'

function HeritagePage({ data }) {
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      
      <InheritageCitation citation={data.citations} />
    </div>
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `citation` | `CitationEntry` | - | Citation data from API response (required) |
| `display` | `'inline' \| 'block'` | `'inline'` | Display mode |
| `className` | `string` | `''` | Custom CSS class |
| `style` | `CSSProperties` | `{}` | Custom inline styles |
| `showBadge` | `boolean` | `false` | Show CC BY 4.0 badge image |
| `showLegal` | `boolean` | `false` | Show full legal text |

### Display Modes

#### Inline (Default)

Compact format for embedding within text:

```tsx
<InheritageCitation citation={data.citations} />
```

Output:

```
Data © Inheritage Foundation | Inheritage Foundation | CC BY 4.0
```

#### Block

Formatted block with padding and border:

```tsx
<InheritageCitation citation={data.citations} display="block" />
```

### With Badge

Show the official CC BY 4.0 badge:

```tsx
<InheritageCitation 
  citation={data.citations} 
  display="block" 
  showBadge 
/>
```

### With Full Legal Text

Display complete license information:

```tsx
<InheritageCitation 
  citation={data.citations} 
  display="block" 
  showBadge 
  showLegal 
/>
```

### Custom Styling

#### Using className

```tsx
<InheritageCitation 
  citation={data.citations} 
  className="my-citation text-sm text-gray-600"
/>
```

#### Using inline styles

```tsx
<InheritageCitation 
  citation={data.citations} 
  style={{
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '2rem',
  }}
/>
```

### Integration with Hooks

The component works seamlessly with SDK hooks:

```tsx
import { useHeritage, InheritageCitation } from '@inheritage-foundation/sdk'

function HeritagePage({ slug }: { slug: string }) {
  const { data, loading, error } = useHeritage(slug)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <NotFound />

  return (
    <article>
      <header>
        <h1>{data.name}</h1>
        <p className="subtitle">{data.state}, {data.country}</p>
      </header>

      <section>
        <p>{data.description}</p>
      </section>

      <footer>
        <InheritageCitation 
          citation={data.citations} 
          display="block" 
          showBadge 
          showLegal 
        />
      </footer>
    </article>
  )
}
```

---

## `useCitationFromResponse` Hook

Extract citation from any API response:

```tsx
import { useCitationFromResponse, InheritageCitation } from '@inheritage-foundation/sdk'

function MyComponent({ response }) {
  const citation = useCitationFromResponse(response)

  return citation ? <InheritageCitation citation={citation} /> : null
}
```

---

## TypeScript Types

### `CitationEntry`

```typescript
interface CitationEntry {
  name: string                // "Inheritage Foundation"
  url: string                 // "https://www.inheritage.foundation"
  license: string             // "CC BY 4.0"
  required_display: string    // "Data © Inheritage Foundation"
}
```

### `InheritageCitationProps`

```typescript
interface InheritageCitationProps {
  citation?: CitationEntry
  display?: 'inline' | 'block'
  className?: string
  style?: React.CSSProperties
  showBadge?: boolean
  showLegal?: boolean
}
```

---

## Examples

### Minimal Footer

```tsx
<footer className="page-footer">
  <InheritageCitation citation={data.citations} />
</footer>
```

### Card Component

```tsx
function HeritageCard({ site }: { site: Heritage }) {
  return (
    <div className="card">
      <img src={site.media.primary_image} alt={site.name} />
      <div className="card-body">
        <h3>{site.name}</h3>
        <p>{site.summary}</p>
      </div>
      <div className="card-footer">
        <InheritageCitation citation={site.citations} display="block" />
      </div>
    </div>
  )
}
```

### Blog Post Attribution

```tsx
function BlogPost({ post }: { post: BlogPost }) {
  return (
    <article className="prose">
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      
      {post.heritageSources?.length > 0 && (
        <aside className="mt-8 p-4 bg-gray-50 rounded">
          <h3 className="text-sm font-semibold">Data Sources</h3>
          {post.heritageSources.map(source => (
            <InheritageCitation 
              key={source.slug}
              citation={source.citations} 
              display="block"
              className="mt-2"
            />
          ))}
        </aside>
      )}
    </article>
  )
}
```

### Map Popup

```tsx
function MapPopup({ feature }: { feature: GeoFeature }) {
  return (
    <div className="popup">
      <h4>{feature.properties.name}</h4>
      <p>{feature.properties.state}</p>
      <InheritageCitation 
        citation={feature.properties.citations} 
        className="text-xs mt-2"
      />
    </div>
  )
}
```

---

## Styling Recommendations

### Tailwind CSS

```tsx
<InheritageCitation 
  citation={data.citations} 
  display="block"
  className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400"
  showBadge
/>
```

### CSS Modules

```tsx
import styles from './Heritage.module.css'

<InheritageCitation 
  citation={data.citations} 
  className={styles.citation}
  display="block"
/>
```

```css
/* Heritage.module.css */
.citation {
  padding: 1rem;
  background: var(--bg-muted);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}
```

---

## Best Practices

1. **Always include attribution** when displaying Inheritage data
2. **Use `display="block"` in footers** for better visibility
3. **Show badges on primary pages** (home, detail pages)
4. **Show legal text on data download/export pages**
5. **Use inline mode for cards/lists** to save space
6. **Respect dark mode** with proper styling

---

## Accessibility

The component follows accessibility best practices:

- All links have `rel="noopener noreferrer"` for security
- Links open in new tabs (`target="_blank"`)
- Badge images have proper `alt` text
- Semantic HTML structure

---

## Future Components

Planned components for future releases:

- `<HeritageCard />`: Pre-styled card component
- `<HeritageMap />`: Interactive map with markers
- `<MediaGallery />`: Image/video gallery with lightbox
- `<TimelineViewer />`: Historical timeline visualization
- `<VirtualTour />`: 360° panorama viewer

---

## Next Steps

- [Hooks Guide](./hooks.md)
- [LangChain Integration](./langchain.md)
- [API Documentation](https://www.inheritage.foundation/docs/api)
- [Examples](../examples/)
