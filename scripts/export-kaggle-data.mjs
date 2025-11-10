import { writeFile } from "node:fs/promises"
import { mkdir } from "node:fs/promises"
import { readFile } from "node:fs/promises"
import path from "node:path"

const OUTPUT_DIR = path.resolve("kaggle-dataset")
const BASE_URL = "https://inheritage.foundation/api/v1"
const HEADERS = {
  "X-Inheritage-Attribution": "visible",
  "Accept": "application/json",
}

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true })
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: HEADERS,
    ...options,
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Request failed (${response.status}) ${url} -> ${body}`)
  }
  return response.json()
}

function toCsv(rows, columns) {
  const header = columns.join(",")
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const value = row[column] ?? ""
          const cell = typeof value === "string" ? value : JSON.stringify(value)
          const safe = cell.replace(/"/g, '""')
          return `"${safe}"`
        })
        .join(","),
    )
    .join("\n")
  return `${header}\n${body}\n`
}

async function exportHeritageCsv() {
  const rows = []
  let usedFallback = false

  async function loadFromApi() {
    const all = []
    let offset = 0
    const limit = 100
    let total = Infinity

    while (offset < total) {
      const url = new URL(`${BASE_URL}/heritage`)
      url.searchParams.set("limit", String(limit))
      url.searchParams.set("offset", String(offset))
      const json = await fetchJson(url.toString())
      const data = json?.data ?? []
      const meta = json?.meta ?? {}
      total = meta.total ?? total
      all.push(...data)
      offset += limit
      if (!Array.isArray(data) || data.length < limit) break
    }
    return all
  }

  async function loadFromLocalFile() {
    const filePath = path.resolve("..", "heritage_sites_rows.json")
    const content = await readFile(filePath, "utf8")
    return JSON.parse(content)
  }

  let heritageEntries
  try {
    heritageEntries = await loadFromApi()
  } catch (error) {
    console.warn("Falling back to local heritage dataset:", error.message)
    heritageEntries = await loadFromLocalFile()
    usedFallback = true
  }

  heritageEntries.forEach((item) => {
    const geo =
      typeof item.geolocation === "object"
        ? item.geolocation
        : parseMaybeJson(item.geolocation)
    const architecture =
      typeof item.architecture === "object"
        ? item.architecture
        : parseMaybeJson(item.architecture)
    const status =
      typeof item.status === "object" ? item.status : parseMaybeJson(item.status)
    const media =
      typeof item.media === "object" ? item.media : parseMaybeJson(item.media)
    const visitorInfo =
      typeof item.visitor_info === "object"
        ? item.visitor_info
        : parseMaybeJson(item.visitor_info)
    const citations = Array.isArray(item.citations)
      ? item.citations
      : parseMaybeJson(item.citations)

    rows.push({
      id: item.id ?? "",
      slug: item.slug ?? "",
      name: item.name ?? "",
      state: item.state ?? "",
      country: item.country ?? "",
      category: item.category ?? "",
      dynasty: item.dynasty ?? "",
      period: item.period ?? "",
      architectural_style: architecture?.style ?? item.architectural_style ?? "",
      structural_system:
        architecture?.structural_system ?? item.structural_system ?? "",
      visiting_hours: visitorInfo?.visiting_hours ?? item.visiting_hours ?? "",
      entry_fee: visitorInfo?.entry_fee ?? item.entry_fee ?? "",
      completion_score:
        status?.completion_score ?? item.completion_score ?? "",
      is_featured: status?.is_featured ?? item.is_featured ?? "",
      is_published: status?.is_published ?? item.is_published ?? "",
      latitude: geo?.lat ?? geo?.latitude ?? "",
      longitude: geo?.lon ?? geo?.lng ?? geo?.longitude ?? "",
      primary_image: media?.primary_image ?? item.main_image ?? "",
      official_url: item.official_url ?? item.website ?? "",
      citation_required_display:
        citations?.[0]?.required_display ?? item.citation_required_display ?? "",
    })
  })

  const columns = [
    "id",
    "slug",
    "name",
    "state",
    "country",
    "category",
    "dynasty",
    "period",
    "architectural_style",
    "structural_system",
    "visiting_hours",
    "entry_fee",
    "completion_score",
    "is_featured",
    "is_published",
    "latitude",
    "longitude",
    "primary_image",
    "official_url",
    "citation_required_display",
  ]

  const csv = toCsv(rows, columns)
  await writeFile(path.join(OUTPUT_DIR, "heritage-sites.csv"), csv, "utf8")
  if (usedFallback) {
    console.log("Heritage CSV generated using local dataset snapshot.")
  }
}

async function exportGeoJson() {
  let geojson
  try {
    const url = new URL(`${BASE_URL}/geo/heritage`)
    url.searchParams.set("limit", "500")
    geojson = await fetchJson(url.toString(), {
      headers: { ...HEADERS, Accept: "application/geo+json" },
    })
  } catch (error) {
    console.warn("Falling back to local dataset for GeoJSON:", error.message)
    const filePath = path.resolve("..", "heritage_sites_rows.json")
    const content = await readFile(filePath, "utf8")
    const heritageEntries = JSON.parse(content)
    geojson = {
      type: "FeatureCollection",
      features: heritageEntries
        .map((item) => {
          const coordinates =
            typeof item.coordinates === "string"
              ? parseMaybeJson(item.coordinates)
              : item.coordinates
          const lat = coordinates?.lat ?? coordinates?.latitude
          const lon = coordinates?.lng ?? coordinates?.lon ?? coordinates?.longitude
          if (lat == null || lon == null) return null
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [Number(lon), Number(lat)],
            },
            properties: {
              slug: item.slug ?? "",
              name: item.name ?? "",
              state: item.state ?? "",
              country: item.country ?? "",
              citation: item.citations?.[0] ?? null,
            },
          }
        })
        .filter(Boolean),
    }
  }

  await writeFile(
    path.join(OUTPUT_DIR, "heritage-geodata.geojson"),
    JSON.stringify(geojson, null, 2),
    "utf8",
  )
}

async function exportMediaJson() {
  let media
  try {
    const url = new URL(`${BASE_URL}/media/search`)
    url.searchParams.set("limit", "200")
    url.searchParams.set("offset", "0")
    media = await fetchJson(url.toString())
  } catch (error) {
    console.warn("Falling back to local dataset for media:", error.message)
    const filePath = path.resolve("..", "heritage_sites_rows.json")
    const content = await readFile(filePath, "utf8")
    const heritageEntries = JSON.parse(content)
    media = {
      generated_from: "local_snapshot",
      data: heritageEntries.slice(0, 100).map((item) => ({
        slug: item.slug ?? "",
        primary_image: item.main_image ?? "",
        media: parseMaybeJson(item.photos) ?? [],
        citations: item.citations ?? [],
      })),
    }
  }

  await writeFile(
    path.join(OUTPUT_DIR, "heritage-media.json"),
    JSON.stringify(media, null, 2),
    "utf8",
  )
}

async function exportAISimilar() {
  let results
  try {
    const sampleSlugs = [
      "taj-mahal-agra",
      "ajanta-caves-maharashtra",
      "konark-sun-temple",
      "brihadisvara-temple-thanjavur",
    ]
    results = []
    for (const slug of sampleSlugs) {
      const response = await fetch(`${BASE_URL}/ai/similar`, {
        method: "POST",
        headers: {
          ...HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug, limit: 5 }),
      })
      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(
          `AI similar request failed (${response.status}) for ${slug}: ${errorBody}`,
        )
      }
      const json = await response.json()
      results.push({ slug, response: json })
    }
  } catch (error) {
    console.warn("Falling back to heuristic AI samples:", error.message)
    const filePath = path.resolve("..", "heritage_sites_rows.json")
    const content = await readFile(filePath, "utf8")
    const heritageEntries = JSON.parse(content)
    const byState = heritageEntries.reduce((acc, item) => {
      const state = item.state ?? "Unknown"
      acc[state] = acc[state] || []
      acc[state].push(item)
      return acc
    }, {})
    results = Object.entries(byState)
      .filter(([_, items]) => items.length >= 3)
      .slice(0, 4)
      .map(([state, items]) => ({
        slug: items[0].slug ?? "",
        heuristic: "similar-state",
        state,
        matches: items.slice(0, 6).map((item, index) => ({
          score: Number((1 - index * 0.1).toFixed(2)),
          site: {
            slug: item.slug ?? "",
            name: item.name ?? "",
            state: item.state ?? "",
            country: item.country ?? "",
          },
        })),
      }))
  }

  await writeFile(
    path.join(OUTPUT_DIR, "heritage-ai-similar.json"),
    JSON.stringify(results, null, 2),
    "utf8",
  )
}

function parseMaybeJson(value) {
  if (value == null) return null
  if (typeof value === "object") return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

async function main() {
  await ensureOutputDir()
  console.log("Exporting heritage CSV…")
  await exportHeritageCsv()
  console.log("Exporting GeoJSON…")
  await exportGeoJson()
  console.log("Exporting media JSON…")
  await exportMediaJson()
  console.log("Exporting AI similarity samples…")
  await exportAISimilar()
  console.log("Kaggle dataset files generated in:", OUTPUT_DIR)
}

main().catch((error) => {
  console.error("Failed to export Kaggle dataset:", error)
  process.exitCode = 1
})

