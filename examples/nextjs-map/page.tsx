"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { InheritageClient } from "@inheritage-foundation/sdk"

const inheritage = new InheritageClient()

export default function HeritageMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [78.9629, 20.5937],
      zoom: 4.3,
    })

    inheritage
      .listGeoHeritage({ limit: 200 })
      .then(({ data }: { data: { features: Array<{ geometry: { coordinates: [number, number] }; properties: { name?: string; state?: string } }> } }) => {
        data.features.forEach((feature: { geometry: { coordinates: [number, number] }; properties: { name?: string; state?: string } }) => {
          const [lon, lat] = feature.geometry.coordinates
          new maplibregl.Marker()
            .setLngLat([lon, lat])
            .setPopup(
              new maplibregl.Popup().setHTML(
                `<strong>${feature.properties.name || ''}</strong><br/>${feature.properties.state ?? ""}`
              )
            )
            .addTo(map)
        })
      })
      .catch((error: unknown) => {
        console.error("Failed to load heritage map", error)
      })

    return () => map.remove()
  }, [])

  return <div ref={containerRef} style={{ width: "100%", height: "600px" }} />
}

