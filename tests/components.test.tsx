/**
 * InheritageCitation Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { InheritageCitation } from '../src/components/InheritageCitation'

// Mock fetch
global.fetch = vi.fn()

describe('InheritageCitation Component', () => {
  const mockCitationData = {
    entity_id: 'taj-mahal',
    required_display: 'Data © Inheritage Foundation',
    license: 'CC BY 4.0',
    source_url: 'https://www.inheritage.foundation/heritage/taj-mahal',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders citation component', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCitationData,
    } as Response)

    render(<InheritageCitation entityId="taj-mahal" />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Inheritage Foundation/i)).toBeInTheDocument()
    })
  })

  it('displays error state on failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

    render(<InheritageCitation entityId="invalid-id" />)

    await waitFor(() => {
      expect(screen.getByText(/citation not available/i)).toBeInTheDocument()
    })
  })

  it('accepts custom className', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCitationData,
    } as Response)

    render(<InheritageCitation entityId="taj-mahal" className="custom-class" />)

    await waitFor(() => {
      expect(screen.getByText(/Inheritage Foundation/i)).toHaveClass('custom-class')
    })
  })

  it('uses suppressHydration_warning prop correctly', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCitationData,
    } as Response)

    render(<InheritageCitation entityId="taj-mahal" suppressHydrationWarning />)

    await waitFor(() => {
      expect(screen.getByText(/Inheritage Foundation/i)).toBeInTheDocument()
    })
  })

  it('handles different entity types', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockCitationData,
        entity_id: 'media-123',
      }),
    } as Response)

    render(<InheritageCitation entityId="media-123" />)

    await waitFor(() => {
      expect(screen.getByText(/Inheritage Foundation/i)).toBeInTheDocument()
    })
  })
})

describe('InheritageCitation Component - Edge Cases', () => {
  it('handles empty entity ID', async () => {
    render(<InheritageCitation entityId="" />)

    await waitFor(() => {
      expect(screen.getByText(/citation not available/i)).toBeInTheDocument()
    })
  })

  it('handles malformed response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'data' }),
    } as Response)

    render(<InheritageCitation entityId="test" />)

    // Should handle gracefully
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('handles 404 response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    render(<InheritageCitation entityId="non-existent" />)

    await waitFor(() => {
      expect(screen.getByText(/citation not available/i)).toBeInTheDocument()
    })
  })
})
