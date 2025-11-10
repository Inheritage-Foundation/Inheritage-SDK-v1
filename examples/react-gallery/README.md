# React Gallery Example

Render heritage media bundles in a simple React gallery using the Inheritage SDK.

## Setup

```bash
npm install @inheritage/sdk @tanstack/react-query
```

## Usage

```tsx
import { useQuery } from "@tanstack/react-query"
import { InheritageClient } from "@inheritage/sdk"

const inheritage = new InheritageClient()

export function HeritageGallery({ slug }: { slug: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["inheritage", "media", slug],
    queryFn: () => inheritage.getMedia(slug).then((res) => res.data),
  })

  if (isLoading) return <p>Loading media…</p>
  if (error || !data) return <p>Unable to load media.</p>

  return (
    <div className="gallery">
      {data.items.map((item) => (
        <figure key={item.url}>
          <img src={item.url} alt={item.caption ?? item.type} />
          <figcaption>
            {item.caption || item.type} · <small>{item.license ?? "CC BY 4.0"}</small>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
```

Pair this with your favourite UI kit to create curated experiences for classrooms, museums, or travel apps.
