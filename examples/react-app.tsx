/**
 * Complete React App Example using Inheritage SDK
 * 
 * Demonstrates:
 * - React hooks for data fetching
 * - Citation component for attribution
 * - AI context and similarity
 * - Geospatial nearby search
 * - Error handling and loading states
 */

import React, { useState } from 'react'
import {
  useHeritage,
  useAIContext,
  useSimilarSites,
  useGeoNearby,
  useMedia,
  InheritageCitation,
  InheritageClient,
} from '@inheritage-foundation/sdk'
import type { Heritage, MediaResponse, AIContextResponse, AISimilarResponse, GeoFeatureCollection } from '../src/types'

// Create a shared client instance (optional, hooks create their own if not provided)
const client = new InheritageClient({
  baseUrl: 'https://inheritage.foundation/api/v1',
  attribution: 'visible',
})

/**
 * Heritage Site Detail Page
 */
export function HeritageSitePage({ slug }: { slug: string }) {
  const { data: site, loading, error, refetch } = useHeritage(slug, { client })
  const { data: aiContext } = useAIContext(slug, { client })
  const { data: similar } = useSimilarSites({ slug, limit: 3 }, { client })
  const { data: media } = useMedia(slug, { client })
  
  if (loading) {
    return <LoadingSpinner message="Loading heritage site..." />
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />
  }

  if (!site) {
    return <NotFound />
  }

  // Type assertion: site is guaranteed to be non-null at this point
  const siteData: Heritage = site
  const mediaData: MediaResponse | null = media
  const aiContextData: AIContextResponse | null = aiContext
  const similarData: AISimilarResponse | null = similar

  return (
    <div className="heritage-site-page">
      {/* Hero Section */}
      <section className="hero">
        {(siteData.media?.primary_image || (mediaData && (mediaData as MediaResponse).items && (mediaData as MediaResponse).items[0]?.url)) && (
          <img 
            src={siteData.media?.primary_image || (mediaData && (mediaData as MediaResponse).items && (mediaData as MediaResponse).items[0]?.url) || ''} 
            alt={siteData.name} 
            className="hero-image" 
          />
        )}
        <div className="hero-content">
          <h1>{siteData.name}</h1>
          <p className="subtitle">
            {siteData.state}, {siteData.country} • {siteData.category}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="content">
        <section className="description">
          <h2>About</h2>
          <p>{siteData.description || siteData.summary}</p>

          {siteData.architecture.style && (
            <div className="architecture-info">
              <h3>Architecture</h3>
              <ul>
                <li>
                  <strong>Style:</strong> {siteData.architecture.style}
                </li>
                {siteData.year_built && (
                  <li>
                    <strong>Year Built:</strong> {siteData.year_built}
                  </li>
                )}
                {siteData.built_by && (
                  <li>
                    <strong>Built By:</strong> {String(siteData.built_by)}
                  </li>
                )}
              </ul>
            </div>
          )}
        </section>

        {/* AI Context Section */}
        {aiContextData && (
          <section className="ai-context">
            <h2>AI-Generated Context</h2>
            <p>{(aiContextData as AIContextResponse).context}</p>
            <details>
              <summary>Technical Details</summary>
              <ul>
                <li>
                  <strong>Embedding Model:</strong> {(aiContextData as AIContextResponse).model} v{(aiContextData as AIContextResponse).model_version}
                </li>
                <li>
                  <strong>Dimensions:</strong> {(aiContextData as AIContextResponse).embedding_dimensions}
                </li>
                <li>
                  <strong>Checksum:</strong> {(aiContextData as AIContextResponse).embedding_checksum?.slice(0, 16)}...
                </li>
              </ul>
            </details>
          </section>
        )}

        {/* Similar Sites */}
        {similarData && (similarData as AISimilarResponse).data && (similarData as AISimilarResponse).data.length > 0 && (
          <section className="similar-sites">
            <h2>Similar Heritage Sites</h2>
            <div className="site-grid">
              {(similarData as AISimilarResponse).data.map((entry: { site: Heritage; score: number }) => (
                <SiteCard
                  key={entry.site.slug}
                  site={entry.site}
                  similarity={entry.score}
                />
              ))}
            </div>
          </section>
        )}

        {/* Visitor Information */}
        {siteData.visitor_info && (
          <section className="visitor-info">
            <h2>Visitor Information</h2>
            <ul>
              {siteData.visitor_info.visiting_hours && (
                <li>
                  <strong>Hours:</strong> {siteData.visitor_info.visiting_hours}
                </li>
              )}
              {siteData.visitor_info.entry_fee && (
                <li>
                  <strong>Entry Fee:</strong> {siteData.visitor_info.entry_fee}
                </li>
              )}
              {siteData.visitor_info.website && (
                <li>
                  <strong>Website:</strong>{' '}
                  <a href={siteData.visitor_info.website} target="_blank" rel="noopener noreferrer">
                    Visit Official Site
                  </a>
                </li>
              )}
            </ul>
          </section>
        )}
      </main>

      {/* Attribution Footer */}
      <footer className="attribution-footer">
        {siteData.citations && siteData.citations.length > 0 && (
          <InheritageCitation citation={siteData.citations} display="block" showBadge showLegal />
        )}
      </footer>
    </div>
  )
}

/**
 * Interactive Map with Nearby Sites
 */
export function NearbyHeritageSitesMap() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [radius, setRadius] = useState(10) // km

  // Get user's location on mount
  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
      },
      (error) => {
        console.error('Failed to get location:', error)
        // Fallback to Delhi
        setUserLocation({ lat: 28.6139, lon: 77.209 })
      }
    )
  }, [])

  const { data: nearby, loading } = useGeoNearby(
    userLocation
      ? {
          lat: userLocation.lat,
          lon: userLocation.lon,
          limit: 20,
        }
      : ({} as any),
    { enabled: Boolean(userLocation), client }
  )

  if (loading || !userLocation) {
    return <LoadingSpinner message="Finding nearby sites..." />
  }

  // Type assertion for nearby data
  const nearbyData: GeoFeatureCollection | null = nearby

  return (
    <div className="nearby-map-container">
      <div className="controls">
        <label>
          Radius: {radius} km
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </label>
      </div>

      {/* Map component (using Leaflet, Mapbox, etc.) */}
      <div className="map">
        {/* Render markers from nearby.features */}
        {nearbyData && (nearbyData as GeoFeatureCollection).features && (nearbyData as GeoFeatureCollection).features.map((feature) => (
          <Marker
            key={feature.properties.slug || ''}
            position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]}
            title={feature.properties.name || ''}
          />
        ))}
      </div>

      {/* Site List */}
      <div className="site-list">
        <h3>Nearby Sites ({nearbyData ? (nearbyData as GeoFeatureCollection).features?.length || 0 : 0})</h3>
        {nearbyData && (nearbyData as GeoFeatureCollection).features && (nearbyData as GeoFeatureCollection).features.map((feature) => (
          <div key={feature.properties.slug || ''} className="site-list-item">
            <a href={`/heritage/${feature.properties.slug || ''}`}>
              <strong>{feature.properties.name || ''}</strong>
            </a>
            <span className="state">{feature.properties.state}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Heritage Site Card Component
 */
function SiteCard({ site, similarity }: { site: any; similarity?: number }) {
  return (
    <div className="site-card">
      {site.media?.primary_image && (
        <img src={site.media.primary_image} alt={site.name} className="card-image" />
      )}
      <div className="card-content">
        <h3>
          <a href={`/heritage/${site.slug}`}>{site.name}</a>
        </h3>
        <p className="card-meta">
          {site.state} • {site.category}
        </p>
        {similarity && (
          <div className="similarity-badge">
            {(similarity * 100).toFixed(1)}% match
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      {message && <p>{message}</p>}
    </div>
  )
}

/**
 * Error Message Component
 */
function ErrorMessage({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="error-message">
      <h2>Error</h2>
      <p>{error.message}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  )
}

/**
 * Not Found Component
 */
function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Heritage site not found.</p>
      <a href="/explore">Explore all sites</a>
    </div>
  )
}

/**
 * Placeholder Marker Component (replace with actual map library)
 */
function Marker({ position, title }: { position: [number, number]; title: string }) {
  return (
    <div
      className="marker"
      style={{
        position: 'absolute',
        left: position[1],
        top: position[0],
      }}
      title={title}
    >
      📍
    </div>
  )
}

