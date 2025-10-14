/**
 * API Gateway Pattern
 * Provides unified API access with routing, middleware, and error handling
 */

import { logger } from '@/lib/logger'
import { ApiResponse } from '@/types/api-responses'

export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  handler: (request: ApiRequest) => Promise<ApiResponse>
  middleware?: ApiMiddleware[]
  rateLimit?: {
    requests: number
    window: number // ms
  }
  auth?: 'required' | 'optional' | 'none'
}

export interface ApiRequest {
  path: string
  method: string
  params: { [key: string]: string }
  query: { [key: string]: string }
  body: any
  headers: { [key: string]: string }
  user?: any
}

export interface ApiMiddleware {
  name: string
  execute: (request: ApiRequest, next: () => Promise<ApiResponse>) => Promise<ApiResponse>
}

export interface RateLimitEntry {
  requests: number
  firstRequest: number
}

/**
 * API Gateway for centralized API management
 */
export class ApiGateway {
  private endpoints = new Map<string, ApiEndpoint>()
  private middleware: ApiMiddleware[] = []
  private rateLimitStore = new Map<string, RateLimitEntry>()

  constructor() {
    this.registerDefaultMiddleware()
  }

  /**
   * Register an API endpoint
   */
  register(endpoint: ApiEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}`
    
    if (this.endpoints.has(key)) {
      throw new Error(`Endpoint ${key} is already registered`)
    }

    this.endpoints.set(key, endpoint)
    
    logger.info('API endpoint registered', {
      path: endpoint.path,
      method: endpoint.method,
      auth: endpoint.auth || 'none',
      rateLimit: endpoint.rateLimit ? `${endpoint.rateLimit.requests}/${endpoint.rateLimit.window}ms` : 'none'
    })
  }

  /**
   * Add global middleware
   */
  use(middleware: ApiMiddleware): void {
    this.middleware.push(middleware)
    logger.info('Global middleware added', { name: middleware.name })
  }

  /**
   * Process an API request
   */
  async process(request: ApiRequest): Promise<ApiResponse> {
    const startTime = performance.now()
    const endpointKey = `${request.method}:${request.path}`
    
    try {
      // Find matching endpoint
      const endpoint = this.findEndpoint(request)
      if (!endpoint) {
        return {
          success: false,
          error: {
            code: 'ENDPOINT_NOT_FOUND',
            message: `Endpoint ${endpointKey} not found`,
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }

      // Apply rate limiting
      const rateLimitResult = this.checkRateLimit(request, endpoint)
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded',
            details: [{
              field: 'rate_limit',
              message: `Try again in ${rateLimitResult.resetTime}ms`
            }],
            timestamp: new Date().toISOString()
          }
        }
      }

      // Build middleware chain
      const middlewareChain = [
        ...this.middleware,
        ...(endpoint.middleware || [])
      ]

      // Execute middleware chain and endpoint handler
      const result = await this.executeMiddlewareChain(
        request,
        middlewareChain,
        endpoint.handler
      )

      // Add performance metrics
      const duration = performance.now() - startTime
      if (result.metadata) {
        result.metadata.performanceMetrics = {
          duration: `${duration.toFixed(2)}ms`,
          endpoint: endpointKey
        }
      }

      logger.info('API request processed', {
        path: request.path,
        method: request.method,
        success: result.success,
        duration: `${duration.toFixed(2)}ms`
      })

      return result

    } catch (error) {
      const duration = performance.now() - startTime
      
      logger.error('API request failed', {
        path: request.path,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      })

      return {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Get API statistics
   */
  getStats(): {
    totalEndpoints: number
    endpointsByMethod: { [method: string]: number }
    rateLimitEntries: number
    middleware: string[]
  } {
    const endpointsByMethod: { [method: string]: number } = {}
    
    for (const endpoint of this.endpoints.values()) {
      endpointsByMethod[endpoint.method] = (endpointsByMethod[endpoint.method] || 0) + 1
    }

    return {
      totalEndpoints: this.endpoints.size,
      endpointsByMethod,
      rateLimitEntries: this.rateLimitStore.size,
      middleware: this.middleware.map(m => m.name)
    }
  }

  private findEndpoint(request: ApiRequest): ApiEndpoint | null {
    // First try exact match
    const exactKey = `${request.method}:${request.path}`
    if (this.endpoints.has(exactKey)) {
      return this.endpoints.get(exactKey)!
    }

    // Try pattern matching for dynamic routes
    for (const [key, endpoint] of this.endpoints) {
      const [method, path] = key.split(':')
      if (method === request.method && this.matchPath(path, request.path)) {
        return endpoint
      }
    }

    return null
  }

  private matchPath(pattern: string, path: string): boolean {
    // Convert pattern like "/api/users/:id" to regex
    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\//g, '\\/')
    
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(path)
  }

  private checkRateLimit(request: ApiRequest, endpoint: ApiEndpoint): {
    allowed: boolean
    resetTime?: number
  } {
    if (!endpoint.rateLimit) {
      return { allowed: true }
    }

    const key = `${request.path}:${request.headers['x-forwarded-for'] || 'unknown'}`
    const now = Date.now()
    const entry = this.rateLimitStore.get(key)

    if (!entry) {
      this.rateLimitStore.set(key, {
        requests: 1,
        firstRequest: now
      })
      return { allowed: true }
    }

    // Check if window has expired
    if (now - entry.firstRequest > endpoint.rateLimit.window) {
      this.rateLimitStore.set(key, {
        requests: 1,
        firstRequest: now
      })
      return { allowed: true }
    }

    // Check if rate limit exceeded
    if (entry.requests >= endpoint.rateLimit.requests) {
      const resetTime = endpoint.rateLimit.window - (now - entry.firstRequest)
      return { allowed: false, resetTime }
    }

    // Increment request count
    entry.requests++
    return { allowed: true }
  }

  private async executeMiddlewareChain(
    request: ApiRequest,
    middleware: ApiMiddleware[],
    handler: (request: ApiRequest) => Promise<ApiResponse>
  ): Promise<ApiResponse> {
    let index = 0

    const next = async (): Promise<ApiResponse> => {
      if (index < middleware.length) {
        const currentMiddleware = middleware[index++]
        return currentMiddleware.execute(request, next)
      } else {
        return handler(request)
      }
    }

    return next()
  }

  private registerDefaultMiddleware(): void {
    // Request logging middleware
    this.use({
      name: 'request-logger',
      execute: async (request, next) => {
        const startTime = performance.now()
        const result = await next()
        const duration = performance.now() - startTime

        logger.info('API middleware: request logged', {
          path: request.path,
          method: request.method,
          duration: `${duration.toFixed(2)}ms`,
          success: result.success
        })

        return result
      }
    })

    // Error handling middleware
    this.use({
      name: 'error-handler',
      execute: async (request, next) => {
        try {
          return await next()
        } catch (error) {
          logger.error('API middleware: error caught', {
            path: request.path,
            method: request.method,
            error: error instanceof Error ? error.message : 'Unknown error'
          })

          return {
            success: false,
            error: {
              code: 'MIDDLEWARE_ERROR',
              message: 'Request processing failed',
              details: [],
              timestamp: new Date().toISOString()
            }
          }
        }
      }
    })

    // CORS middleware
    this.use({
      name: 'cors-handler',
      execute: async (request, next) => {
        const result = await next()
        
        // Add CORS headers to metadata
        if (result.metadata) {
          result.metadata.corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }

        return result
      }
    })
  }
}

// Global API gateway instance
export const apiGateway = new ApiGateway()

// Convenience functions
export function registerEndpoint(endpoint: ApiEndpoint) {
  apiGateway.register(endpoint)
}

export function addMiddleware(middleware: ApiMiddleware) {
  apiGateway.use(middleware)
}

export async function processApiRequest(request: ApiRequest): Promise<ApiResponse> {
  return apiGateway.process(request)
}