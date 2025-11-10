// @ts-nocheck

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
    <div className="heritage-gallery">
      {data.items.map((item) => (
        <figure key={item.url} className="heritage-gallery__item">
          <img src={item.url} alt={item.caption ?? item.type} loading="lazy" />
          <figcaption>
            {item.caption || item.type} · <small>{item.license ?? "CC BY 4.0"}</small>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

