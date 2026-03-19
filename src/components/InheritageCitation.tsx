/**
 * InheritageCitation React Component
 *
 * Renders CC BY 4.0 attribution for Inheritage data.
 * Automatically extracts citation from API responses or accepts custom citation data.
 * 
 * @version 0.3.0
 * @author Ayush Mishra <hello@inheritage.foundation> (https://ayush.studio)
 * @license Apache-2.0
 * @copyright Team Inheritage
 */

import React from "react"
import type { CitationEntry } from "../types"

export interface InheritageCitationProps {
  /** Citation data from API response */
  citation?: CitationEntry
  /** Inline (default) or block display mode */
  display?: "inline" | "block"
  /** Custom CSS class */
  className?: string
  /** Custom styles */
  style?: React.CSSProperties
  /** Show license badge */
  showBadge?: boolean
  /** Show full legal text */
  showLegal?: boolean
}

/**
 * InheritageCitation component for CC BY 4.0 attribution
 * 
 * @example
 * ```tsx
 * <InheritageCitation citation={response.citations} />
 * ```
 * 
 * @example
 * ```tsx
 * <InheritageCitation 
 *   citation={response.citations} 
 *   display="block" 
 *   showBadge 
 *   showLegal 
 * />
 * ```
 */
export const InheritageCitation: React.FC<InheritageCitationProps> = ({
  citation,
  display = "inline",
  className = "",
  style = {},
  showBadge = false,
  showLegal = false,
}) => {
  if (!citation) {
    return null
  }

  const { name, url, license, required_display } = citation

  const isBlock = display === "block"

  const containerClass = isBlock
    ? `inheritage-citation-block ${className}`
    : `inheritage-citation-inline ${className}`

  const containerStyle: React.CSSProperties = isBlock
    ? {
        padding: "1rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.375rem",
        backgroundColor: "#f9fafb",
        marginTop: "1rem",
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
        ...style,
      }
    : {
        fontSize: "0.875rem",
        color: "#6b7280",
        ...style,
      }

  return (
    <div className={containerClass} style={containerStyle}>
      <span>
        {required_display || `Data © ${name}`}
        {" | "}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#2563eb", textDecoration: "underline" }}
        >
          {name}
        </a>
        {" | "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#2563eb", textDecoration: "underline" }}
        >
          {license}
        </a>
      </span>
      {showBadge && (
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "0.5rem", display: "inline-block" }}
        >
          <img
            src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by.svg"
            alt="CC BY 4.0"
            style={{ height: "1.25rem", width: "auto", verticalAlign: "middle" }}
          />
        </a>
      )}
      {showLegal && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
          This work is licensed under a{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            Creative Commons Attribution 4.0 International License
          </a>
          . You are free to share and adapt this material for any purpose, even commercially, as long as
          you give appropriate credit to {name}.
        </p>
      )}
    </div>
  )
}

/**
 * Hook to extract citation from API response
 */
export function useCitationFromResponse(response: { citations?: CitationEntry } | null): CitationEntry | undefined {
  return response?.citations
}

