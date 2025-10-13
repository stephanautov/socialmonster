/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

import { NextRequest, NextResponse } from 'next/server'
import { TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'
import { ApiError, ValidationError } from '@/types/api-responses'

export interface ErrorContext {
  request: NextRequest
  userId?: string
  endpoint: string
  method: string
}

export class ErrorHandler {
  static handle(error: unknown, context: ErrorContext): NextResponse {
    const timestamp = new Date().toISOString()
    
    // Log error with context
    logger.error('ErrorHandler.handle', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        endpoint: context.endpoint,
        method: context.method,
        userId: context.userId,
        userAgent: context.request.headers.get('user-agent'),
        ip: context.request.headers.get('x-forwarded-for') || context.request.headers.get('x-real-ip')
      }
    })

    // Handle different error types
    if (error instanceof TRPCError) {
      return this.handleTRPCError(error, timestamp)
    }

    if (error instanceof ZodError) {
      return this.handleValidationError(error, timestamp)
    }

    if (error instanceof Error) {
      return this.handleGenericError(error, timestamp)
    }

    // Unknown error type
    return this.handleUnknownError(error, timestamp)
  }

  private static handleTRPCError(error: TRPCError, timestamp: string): NextResponse {
    const statusMap: Record<string, number> = {
      'BAD_REQUEST': 400,
      'UNAUTHORIZED': 401,
      'FORBIDDEN': 403,
      'NOT_FOUND': 404,
      'CONFLICT': 409,
      'PRECONDITION_FAILED': 412,
      'PAYLOAD_TOO_LARGE': 413,
      'UNPROCESSABLE_CONTENT': 422,
      'TOO_MANY_REQUESTS': 429,
      'CLIENT_CLOSED_REQUEST': 499,
      'INTERNAL_SERVER_ERROR': 500,
      'NOT_IMPLEMENTED': 501,
      'BAD_GATEWAY': 502,
      'SERVICE_UNAVAILABLE': 503,
      'GATEWAY_TIMEOUT': 504,
    }

    const status = statusMap[error.code] || 500

    const apiError: ApiError = {
      code: error.code,
      message: error.message,
      details: error.cause ? [String(error.cause)] : [],
      timestamp
    }

    return NextResponse.json(
      { success: false, error: apiError },
      { status }
    )
  }

  private static handleValidationError(error: ZodError, timestamp: string): NextResponse {
    const validationErrors: ValidationError[] = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: this.mapZodErrorCode(err.code)
    }))

    const apiError: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: validationErrors.map(e => `${e.field}: ${e.message}`),
      timestamp
    }

    return NextResponse.json(
      { 
        success: false, 
        error: apiError,
        validation: validationErrors
      },
      { status: 400 }
    )
  }

  private static handleGenericError(error: Error, timestamp: string): NextResponse {
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    const apiError: ApiError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? error.message : 'An internal server error occurred',
      details: isDevelopment && error.stack ? [error.stack] : [],
      timestamp
    }

    return NextResponse.json(
      { success: false, error: apiError },
      { status: 500 }
    )
  }

  private static handleUnknownError(error: unknown, timestamp: string): NextResponse {
    const apiError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: [String(error)],
      timestamp
    }

    return NextResponse.json(
      { success: false, error: apiError },
      { status: 500 }
    )
  }

  private static mapZodErrorCode(zodCode: string): ValidationError['code'] {
    const codeMap: Record<string, ValidationError['code']> = {
      'invalid_type': 'invalid_type',
      'invalid_literal': 'invalid_format',
      'unrecognized_keys': 'invalid_format',
      'invalid_union': 'invalid_format',
      'invalid_union_discriminator': 'invalid_format',
      'invalid_enum_value': 'invalid_format',
      'invalid_arguments': 'invalid_format',
      'invalid_return_type': 'invalid_format',
      'invalid_date': 'invalid_format',
      'invalid_string': 'invalid_format',
      'too_small': 'too_small',
      'too_big': 'too_big',
      'invalid_intersection_types': 'invalid_format',
      'not_multiple_of': 'invalid_format',
      'not_finite': 'invalid_format',
      'custom': 'custom'
    }

    return codeMap[zodCode] || 'custom'
  }

  // Rate limiting helper
  static async checkRateLimit(
    identifier: string,
    limit: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // This is a simple in-memory rate limiter
    // In production, use Redis or similar
    const now = Date.now()
    const windowStart = now - windowMs
    
    // For simplicity, using a Map (in production, use Redis)
    if (!global.rateLimitStore) {
      global.rateLimitStore = new Map()
    }

    const store = global.rateLimitStore
    const key = `rate_limit:${identifier}`
    const requests = store.get(key) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter((timestamp: number) => timestamp > windowStart)
    
    if (validRequests.length >= limit) {
      const oldestRequest = validRequests[0]
      const resetTime = oldestRequest + windowMs
      
      return {
        allowed: false,
        remaining: 0,
        resetTime
      }
    }

    // Add current request
    validRequests.push(now)
    store.set(key, validRequests)
    
    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetTime: now + windowMs
    }
  }
}

// Middleware wrapper for API routes
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      const request = args[0] as NextRequest
      const context: ErrorContext = {
        request,
        endpoint: request.nextUrl.pathname,
        method: request.method
      }
      
      return ErrorHandler.handle(error, context)
    }
  }
}

// Declare global type for rate limit store
declare global {
  var rateLimitStore: Map<string, number[]> | undefined
}