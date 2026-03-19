/**
 * Error Classes for Inheritage SDK
 * 
 * Custom error types with rich context for debugging
 * Includes rate limit info, trace IDs, and documentation links
 * 
 * @version 0.3.0
 * @author Ayush Mishra <hello@inheritage.foundation> (https://ayush.studio)
 * @license Apache-2.0
 * @copyright Team Inheritage
 */

import type { RateLimitInfo } from "./types"

export interface InheritageApiErrorOptions<TError = unknown> {
  status: number
  code: string
  message: string
  hint?: string | null
  doc?: string | null
  traceId?: string
  retryAfter?: number | null
  rateLimit?: RateLimitInfo
  payload?: TError
}

export class InheritageApiError<TError = unknown> extends Error {
  public readonly status: number
  public readonly code: string
  public readonly hint?: string | null
  public readonly doc?: string | null
  public readonly traceId?: string
  public readonly retryAfter?: number | null
  public readonly rateLimit?: RateLimitInfo
  public readonly payload?: TError

  constructor(options: InheritageApiErrorOptions<TError>) {
    super(options.message)
    this.name = "InheritageApiError"
    this.status = options.status
    this.code = options.code
    this.hint = options.hint ?? null
    this.doc = options.doc ?? null
    this.traceId = options.traceId
    this.retryAfter = options.retryAfter ?? null
    this.rateLimit = options.rateLimit
    this.payload = options.payload

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

