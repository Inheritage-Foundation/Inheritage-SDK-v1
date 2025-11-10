# 🏛️ Inheritage SDK (TypeScript)

[![CI](https://github.com/0xMilord/Inheritage-SDK-v1/actions/workflows/ci.yml/badge.svg)](https://github.com/0xMilord/Inheritage-SDK-v1/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40inheritage-foundation%2Fsdk?label=npm&color=blue)](https://www.npmjs.com/package/@inheritage-foundation/sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-ff69b4.svg)](https://inheritage.foundation/docs/api)
[![Discussions](https://img.shields.io/badge/chat-Discussions-blueviolet.svg)](https://github.com/0xMilord/Inheritage-SDK-v1/discussions)
[![Open Data](https://img.shields.io/badge/data-CC%20BY%204.0-orange.svg)](https://inheritage.foundation/api/v1)

<p align="center">
  <img src="./inheritage-sdk.jpg" alt="Inheritage SDK social preview" width="720" />
</p>

**Access India's cultural heritage programmatically.**  
Query thousands of monuments, temples, and cultural sites—open data, CC BY 4.0, ready for maps, AI, and education.

---

## 🚀 Quickstart

```bash
npm install @inheritage-foundation/sdk
# or
pnpm add @inheritage-foundation/sdk
```

```ts
import { InheritageClient } from "@inheritage-foundation/sdk"

const inheritage = new InheritageClient()
const { data } = await inheritage.getHeritage("hoysaleswara-temple")

console.log(data.name) // "Hoysaleswara Temple"
```

---

## 🧠 What You Can Build

- Visualize heritage sites on maps with `geo/heritage` and `geo/nearby`
- Compare dynasties, architectural styles, or visitor metadata over time
- Power AI assistants using deterministic `/ai/context` narratives and embeddings
- Curate media galleries with watermark guidance from `/media`
- Track attribution usage via `/citation/report` for community dashboards

---

## 🧩 Widgets & Embeds

The `examples/` directory ships ready-to-run widgets that you can drop into your projects:

- **React gallery (`examples/react-gallery`)**
  ```tsx
  import { useQuery } from "@tanstack/react-query"
  import { InheritageClient } from "@inheritage-foundation/sdk"

  const inheritage = new InheritageClient()

  export function HeritageGallery({ slug }: { slug: string }) {
    const { data, isLoading } = useQuery({
      queryKey: ["inheritage", "media", slug],
      queryFn: () => inheritage.getMedia(slug).then((res) => res.data),
    })

    if (isLoading || !data) return <p>Loading media…</p>

    return (
      <div className="heritage-gallery">
        {data.items.map((item) => (
          <figure key={item.url}>
            <img src={item.url} alt={item.caption ?? item.type} />
            <figcaption>{item.caption || item.type}</figcaption>
          </figure>
        ))}
      </div>
    )
  }
  ```

- **Next.js map (`examples/nextjs-map`)** renders 200 heritage sites with MapLibre in under 40 lines.
- **CLI similarity demo (`examples/ai-similarity-demo`)** ranks kindred monuments using `/ai/similar`.

Every widget is powered exclusively by the documented `/api/v1` endpoints. The SDK never touches private infrastructure and carries no internal keys.

---

## 🔗 Useful Links

- [API Reference](https://inheritage.foundation/docs/api)
- [Dataset Manifest (JSON-LD)](https://inheritage.foundation/api/v1)
- [OpenAPI 3.1 Specification](https://inheritage.foundation/openapi/v1.yaml)
- [Playground](https://inheritage.foundation/docs/api#playground)
- [Issue Tracker](https://github.com/0xMilord/Inheritage-SDK-v1/issues)

---

## 🤝 Contribute

Issues, ideas, and pull requests are welcome!  
Start with the [`Ideas for Developers`](https://github.com/0xMilord/Inheritage-SDK-v1/issues) thread, showcase what you build, or join the [Discussions](https://github.com/0xMilord/Inheritage-SDK-v1/discussions) board.  
Check the [`examples/`](./examples) directory for drop-in starters and consider contributing your own demo.

> ℹ️ This repository contains only the open-source SDK and examples. All proprietary services remain in private infrastructure; no closed-source code, secrets, or datasets are mirrored here.

Every integration helps preserve and popularise India’s heritage.

---

## ⚖️ License

- SDK code: [Apache 2.0](./LICENSE)
- Data responses: CC BY 4.0 — attribution required via `X-Inheritage-Attribution: visible`

---

## 🚀 Releases

1. Bump the version in `package.json`.
2. From the `sdk/` directory run:
   ```bash
   npm install
   npm test
   npm publish --access public
   ```
3. Tag the release: `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. Draft release notes summarising API coverage changes.

> You need an npm account with publish rights for `@inheritage-foundation`. Create an automation token for CI if you plan to run this from GitHub Actions.

© 2025 Inheritage Foundation. All rights reserved.
