# 🏛️ Inheritage SDK (TypeScript)

[![CI](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/actions/workflows/ci.yml/badge.svg)](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40inheritage-foundation%2Fsdk?label=npm&color=blue)](https://www.npmjs.com/package/@inheritage-foundation/sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](./LICENSE)
[![API Docs](https://img.shields.io/badge/docs-API%20Suite-1f6feb.svg)](https://inheritage.foundation/docs/api)
[![Discussions](https://img.shields.io/badge/chat-Discussions-8a2be2.svg)](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/discussions)
[![Open Data](https://img.shields.io/badge/data-CC%20BY%204.0-f97316.svg)](https://inheritage.foundation/api/v1)

![Inheritage SDK social preview](./inheritage-sdk.jpg)

Welcome to the TypeScript SDK for the **Inheritage API Suite v1.0**, the open cultural dataset. This package exposes typed clients for every public endpoint—heritage catalogue, geospatial features, media bundles, citation tooling, AI-ready context, and the dataset manifest—while respecting the production contract: headers, rate limits, caching, and the unified error envelope.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication & Headers](#authentication--headers)
3. [API Coverage](#api-coverage)
   - [Heritage API](#heritage-api)
   - [Geospatial API](#geospatial-api)
   - [Media API](#media-api)
   - [Citation & Attribution API](#citation--attribution-api)
   - [AI Context & Embedding API](#ai-context--embedding-api)
   - [Dataset Manifest & Stats](#dataset-manifest--stats)
4. [Examples & Widgets](#examples--widgets)
5. [Errors, Rate Limits & Caching](#errors-rate-limits--caching)
6. [Support & Community](#support--community)
7. [License](#license)

---

## Getting Started

```bash
npm install @inheritage-foundation/sdk
# or
pnpm add @inheritage-foundation/sdk
```

```ts
import { InheritageClient } from "@inheritage-foundation/sdk"

const client = new InheritageClient()
const { data } = await client.getHeritage("hoysaleswara-temple")

console.log(data.name)                     // "Hoysaleswara Temple"
console.log(data.media.primary_image)      // Primary photo URL
```

The client targets `https://inheritage.foundation/api/v1` by default. Override it when self-hosting mirrors:

```ts
const client = new InheritageClient({ baseUrl: "https://staging.inheritage.foundation/api/v1" })
```

Each request automatically injects the required attribution headers; you can pass `signal`, `headers`, `ifNoneMatch`, and `ifModifiedSince` through the options argument on every method.

---

## Authentication & Headers

- **No API key required** for the public tier. Every call must include `X-Inheritage-Attribution: visible`. The SDK sets this header by default.
- **Commercial tier** users add `X-Inheritage-Plan: commercial`. You can configure this via:

  ```ts
  const client = new InheritageClient({ defaultHeaders: { "X-Inheritage-Plan": "commercial" } })
  ```

- **Attribution enforcement**: suppressing credit without the commercial plan yields `403 FORBIDDEN` with hint “Send X-Inheritage-Attribution: visible or upgrade to a commercial plan.”
- **CORS**: the public API allows browser calls; the SDK works in Node, edge runtimes, and the browser (with `fetch` polyfills if necessary).

---

## API Coverage

The SDK exposes typed methods mapped 1:1 to the public routes documented in [`public-api-suite.md`](../docs/public-api-suite.md). Every response preserves the structure defined there—fields, nested objects, citations, and metadata.

### Heritage API

- **Endpoints**: `GET /heritage`, `/heritage/:slug`, `/heritage/search`, `/heritage/random`
- **Filters & parameters**:
  - `state`, `dynasty`, `style`, `material`, `period`, `country`
  - `limit` (1–100), `offset`
  - `sort` whitelist (`name`, `period`, `state`, `completion_score`, `view_count`, `country`) with optional `-` prefix for descending
  - `fields=id,name,state` style projections
- **Example**:

  ```ts
  const { data } = await client.listHeritage({
    state: "Karnataka",
    sort: "-completion_score",
    limit: 5,
    fields: ["id", "name", "status", "media"]
  })

  data.data.forEach(site => {
    console.log(site.name, site.status?.completion_score, site.media?.primary_image)
  })
  ```

- **Search**: `client.searchHeritage({ q: "temple", state: "Tamil Nadu", limit: 15 })`
- **Random**: `client.getRandomHeritage()` returns a CC BY 4.0 compliant record ready for attribution.

### Geospatial API

- **Endpoints**: `GET /geo/heritage`, `/geo/heritage/:slug`, `/geo/nearby`
- **Features**:
  - Returns GeoJSON FeatureCollections with `properties.citation`
  - Optional `Accept: application/geo+json` to receive GeoJSON MIME type
  - `GET /geo/nearby` accepts `lat`, `lon`, `radius_km ≤ 250`
- **Example**:

  ```ts
  const { data } = await client.getGeoNearby({ lat: 12.97, lon: 77.59, radius_km: 50 })
  console.log(data.features.map(feature => feature.properties?.name))
  ```

### Media API

- **Endpoints**: `GET /media/:slug`, `/media/search`, `/media/random`
- **Highlights**:
  - Bundles imagery, tours, CAD, point clouds, videos
  - Responses emit `X-Inheritage-Watermark` (`required` or `not-required`)
  - `Content-Disposition` header suggests export-friendly filenames
- **Example**:

  ```ts
  const response = await client.getMedia("taj-mahal-agra")
  console.log(response.headers.get("X-Inheritage-Watermark")) // required | not-required
  console.log(response.data.items.map(item => `${item.type}: ${item.url}`))
  ```

### Citation & Attribution API

- **Endpoints**: `GET /citation/:entityId`, `POST /citation/report`
- **Use cases**:
  - Fetch canonical credit snippets (HTML, Markdown, plain text) alongside `source_url`
  - Report display counts for dashboards (`entity`, `app_name`, `domain`, `display_count`)
- **Example**:

  ```ts
  const { data } = await client.getCitation("hoysaleswara-temple")
  console.log(data.citation_html)
  ```

### AI Context & Embedding API

- **Endpoints**: `GET /ai/context/:slug`, `/ai/embedding/:slug`, `POST /ai/similar`
- **Features**:
  - Deterministic narratives plus 1536-d embeddings (`X-Embedding-Model: inheritage-d1`)
  - Similarity endpoint accepts either `slug` or a custom `embedding` array, returns cosine-ranked matches filtered to published sites
- **Example**:

  ```ts
  const { data } = await client.findSimilar({ slug: "ajanta-caves-maharashtra", limit: 5 })
  console.table(data.data.map(entry => ({
    score: entry.score.toFixed(3),
    slug: entry.site.slug,
    state: entry.site.state
  })))
  ```

### Dataset Manifest & Stats

- **Endpoints**: `GET /api/v1`, `GET /api/v1/stats`
- **Manifest**: JSON-LD dataset entry point containing `distribution`, `keywords`, `variableMeasured`, `spatialCoverage`, etc. Used by Google Dataset Search, Bing, Perplexity, and other portals.
- **Stats**: Aggregated counts (total, published, featured, views, average completion) plus breakdowns by status, category, state, and country.
- **Example**:

  ```ts
  const { data } = await client.getStats()
  console.log(data.counts.published, data.breakdown.by_state.Karnataka)
  ```

For endpoint-by-endpoint response structures, refer to [`docs/public-api-suite.md`](../docs/public-api-suite.md) or the live OpenAPI schema: `https://inheritage.foundation/openapi/v1.yaml`.

---

## Examples & Widgets

| Folder | What it showcases |
| --- | --- |
| [`examples/react-gallery`](./examples/react-gallery/) | React media carousel using `getMedia` plus watermark handling. |
| [`examples/nextjs-map`](./examples/nextjs-map/) | MapLibre map plotting 200 heritage features with `listGeoHeritage`. |
| [`examples/ai-similarity-demo`](./examples/ai-similarity-demo/) | CLI similarity tool calling `POST /ai/similar`. |
| [`examples/api-fetch-script`](./examples/api-fetch-script/) | Node script exporting the full catalogue using pagination helpers. |

Additional resources:

- **Interactive Playground**: [`/docs/api#playground`](https://inheritage.foundation/docs/api#playground) for live requests (cURL snippets and headers included).
- **Dataset Manifest**: [`GET /api/v1`](https://inheritage.foundation/api/v1) for discovery metadata.
- **Stats Endpoint**: [`GET /api/v1/stats`](https://inheritage.foundation/api/v1/stats) for dashboards and reporting.

---

## Errors, Rate Limits & Caching

- **Error handling**: the SDK throws `InheritageApiError` with `status`, `code`, `message`, `hint`, `doc`, `traceId`, optional `retryAfter`, and `rateLimit` info.
- **Rate limits**: 120 req/min/IP (default), 60 req/min/IP for Geospatial routes. Headers advertise quotas and reset timestamps; implement exponential backoff when receiving `429 RATE_LIMITED`.
- **Caching**: every response emits `Cache-Control`, `ETag`, `Last-Modified`, and `stale-while-revalidate`. You can pass `ifNoneMatch` and `ifModifiedSince` when reusing responses to leverage 304 Not Modified.

---

## Support & Community

- Documentation: [https://inheritage.foundation/docs/api](https://inheritage.foundation/docs/api)
- Issues & feature requests: [GitHub tracker](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/issues)
- Discussions, project ideas, showcases: [GitHub Discussions](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/discussions)
- Email: [api@inheritage.foundation](mailto:api@inheritage.foundation)

We welcome PRs for bug fixes, new helpers, and additional examples. Please include tests where appropriate and ensure endpoints remain faithful to the production contract.

---

## License

- SDK source: [Apache 2.0](./LICENSE)
- API responses: CC BY 4.0 — visible attribution required via `X-Inheritage-Attribution: visible`

Every integration, map, article, or AI assistant built with this SDK helps document and protect India’s cultural heritage. We’d love to see what you create—share your work in Discussions once it’s live.

© 2025 Inheritage Foundation. All rights reserved.
