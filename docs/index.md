# Inheritage SDK Docs

Welcome to the Inheritage Developer Hub. This documentation mirrors the key tasks covered by the SDK README, expands the reference links, and is designed for GitHub Pages.

## Getting Started

```bash
npm install @inheritage-foundation/sdk
```

```ts
import { InheritageClient } from "@inheritage-foundation/sdk"

const inheritage = new InheritageClient()
const { data } = await inheritage.listHeritage({ state: "Tamil Nadu", limit: 10 })

console.log(data.map((site) => site.name))
```

## Useful Links

- API Reference — <https://www.inheritage.foundation/docs/api>
- Dataset Manifest — <https://www.inheritage.foundation/api/v1>
- OpenAPI 3.1 Spec — <https://www.inheritage.foundation/openapi/v1.yaml>
- Playground — <https://www.inheritage.foundation/docs/api#playground>
- AI Roadmap — [`ai-api-enhancement.md`](./ai-api-enhancement.md)

## LangChain & LangGraph Helpers

```ts
import { InheritageClient } from "@inheritage-foundation/sdk"
import { createInheritageToolkit } from "@inheritage-foundation/sdk/langchain"

const client = new InheritageClient()
const tools = createInheritageToolkit({ client })

const context = await tools[0].runnable.invoke({ slug: "hoysaleswara-temple" })
console.log(context.data.context)
```

The LangChain helpers expose runnables for:

- Deterministic context + embeddings (`inheritage_context`)
- Embedding-only lookups (`inheritage_embedding`)
- Similarity search (`inheritage_similarity`)
- AI metadata bundles (`inheritage_metadata`)
- NDJSON vector feeds for external stores (`inheritage_vector_feed`)
- Vision ingress (image → heritage context) (`inheritage_vision`)
- AI license metadata (`inheritage_license`)

## About

Inheritage Foundation curates and publishes open cultural datasets across India and the global diaspora. The SDK is open-source (Apache 2.0) and the API responses are licensed under CC BY 4.0.

## Contributing

- Report issues: <https://github.com/0xMilord/Inheritage-SDK-v1/issues>
- Start a discussion: <https://github.com/0xMilord/Inheritage-SDK-v1/discussions>
- Share project ideas: open a new discussion or comment on pinned topics.
