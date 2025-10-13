/**
 * Authentication Middleware
 * Handles authentication and authorization for API routes
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/logger'

export interface AuthenticatedUser {
  id: string
  email: string
  emailVerified: boolean
  subscriptionTier: 'free' | 'premium' | 'enterprise'
  roles: string[]
}

export interface AuthContext {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  session: {
    sessionId: string
    expiresAt: Date
  } | null
}

export class AuthMiddleware {
  private static async getSupabaseClient(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {
          // No-op for server-side
        },
        remove() {
          // No-op for server-side
        },
      },
    })
  }

  static async getAuthContext(request: NextRequest): Promise<AuthContext> {
    try {
      const supabase = await this.getSupabaseClient(request)
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return {
          user: null,
          isAuthenticated: false,
          session: null
        }
      }

      // Get session info
      const { data: { session } } = await supabase.auth.getSession()

      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email!,
        emailVerified: !!user.email_confirmed_at,
        subscriptionTier: user.user_metadata?.subscription_tier || 'free',
        roles: user.user_metadata?.roles || ['user']
      }

      return {
        user: authenticatedUser,
        isAuthenticated: true,
        session: session ? {
          sessionId: session.access_token,
          expiresAt: new Date(session.expires_at! * 1000)
        } : null
      }
    } catch (error) {
      logger.error('AuthMiddleware.getAuthContext failed', { error })
      return {
        user: null,
        isAuthenticated: false,
        session: null
      }
    }
  }

  static async requireAuth(request: NextRequest): Promise<AuthContext> {
    const authContext = await this.getAuthContext(request)
    
    if (!authContext.isAuthenticated) {
      throw new Error('Authentication required')
    }

    // Check if session is still valid
    if (authContext.session && authContext.session.expiresAt < new Date()) {
      throw new Error('Session expired')
    }

    return authContext
  }

  static async requireRole(
    request: NextRequest,
    requiredRoles: string[]
  ): Promise<AuthContext> {
    const authContext = await this.requireAuth(request)
    
    const hasRole = requiredRoles.some(role => 
      authContext.user!.roles.includes(role)
    )
    
    if (!hasRole) {
      throw new Error(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`)
    }

    return authContext
  }

  static async requireSubscription(
    request: NextRequest,
    requiredTiers: Array<'free' | 'premium' | 'enterprise'>
  ): Promise<AuthContext> {
    const authContext = await this.requireAuth(request)
    
    if (!requiredTiers.includes(authContext.user!.subscriptionTier)) {
      throw new Error(`Insufficient subscription tier. Required: ${requiredTiers.join(' or ')}`)
    }

    return authContext
  }

  // Extract bearer token from Authorization header
  static extractBearerToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) return null
    
    const match = authHeader.match(/^Bearer\s+(.+)$/)
    return match ? match[1] : null
  }

  // Validate API key (for service-to-service communication)
  static async validateApiKey(request: NextRequest): Promise<boolean> {
    const apiKey = request.headers.get('x-api-key')
    const validApiKey = process.env.API_SECRET_KEY
    
    if (!apiKey || !validApiKey) {
      return false
    }
    
    return apiKey === validApiKey
  }
}

// Helper function to add authentication context to request
export async function withAuth<T>(
  request: NextRequest,
  handler: (request: NextRequest, authContext: AuthContext) => Promise<T>
): Promise<T> {
  const authContext = await AuthMiddleware.getAuthContext(request)
  return handler(request, authContext)
}

// Helper function that requires authentication
export async function withRequiredAuth<T>(
  request: NextRequest,
  handler: (request: NextRequest, authContext: AuthContext) => Promise<T>
): Promise<T> {
  const authContext = await AuthMiddleware.requireAuth(request)
  return handler(request, authContext)
}

// Helper function that requires specific roles
export async function withRoles<T>(
  request: NextRequest,
  requiredRoles: string[],
  handler: (request: NextRequest, authContext: AuthContext) => Promise<T>
): Promise<T> {
  const authContext = await AuthMiddleware.requireRole(request, requiredRoles)
  return handler(request, authContext)
}