/**
 * Authentication Service
 * Handles all authentication-related business logic
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { User } from '@/types/entities'
import { AuthResponse, ApiResponse } from '@/types/api-responses'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  confirmPassword: string
}

export class AuthService {
  private async getSupabaseClient() {
    const cookieStore = cookies()
    
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      logger.info('AuthService.signIn', { email: credentials.email })
      
      // Validate credentials
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }

      const supabase = await this.getSupabaseClient()
      
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        logger.error('AuthService.signIn failed', { error: error.message })
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: error.message,
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }

      // Update user's last login date
      if (data.user) {
        await this.updateLastLogin(data.user.id)
      }

      logger.info('AuthService.signIn success', { userId: data.user?.id })

      return {
        success: true,
        data: {
          user: this.mapSupabaseUser(data.user!),
          session: {
            sessionId: data.session?.access_token || '',
            expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : '',
            isActive: true
          },
          tokens: {
            accessToken: data.session?.access_token || '',
            refreshToken: data.session?.refresh_token || '',
            tokenType: 'Bearer' as const,
            expiresIn: data.session?.expires_in || 3600
          }
        }
      }
    } catch (error) {
      logger.error('AuthService.signIn exception', { error })
      return {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication failed',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      logger.info('AuthService.signUp', { email: data.email })
      
      // Validate input
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Passwords do not match',
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }

      if (data.password.length < 8) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 8 characters long',
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }

      const supabase = await this.getSupabaseClient()
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      })

      if (authError) {
        logger.error('AuthService.signUp failed', { error: authError.message })
        return {
          success: false,
          error: {
            code: 'SIGNUP_FAILED',
            message: authError.message,
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }

      // Create user record in database
      if (authData.user) {
        await this.createUserRecord(authData.user)
      }

      logger.info('AuthService.signUp success', { userId: authData.user?.id })

      return {
        success: true,
        data: {
          user: this.mapSupabaseUser(authData.user!),
          session: {
            sessionId: authData.session?.access_token || '',
            expiresAt: authData.session?.expires_at ? new Date(authData.session.expires_at * 1000).toISOString() : '',
            isActive: true
          },
          tokens: {
            accessToken: authData.session?.access_token || '',
            refreshToken: authData.session?.refresh_token || '',
            tokenType: 'Bearer' as const,
            expiresIn: authData.session?.expires_in || 3600
          }
        }
      }
    } catch (error) {
      logger.error('AuthService.signUp exception', { error })
      return {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Account creation failed',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async signOut(): Promise<ApiResponse> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logger.error('AuthService.signOut failed', { error: error.message })
        return {
          success: false,
          error: {
            code: 'SIGNOUT_FAILED',
            message: error.message,
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }

      logger.info('AuthService.signOut success')
      
      return {
        success: true,
        data: { message: 'Signed out successfully' }
      }
    } catch (error) {
      logger.error('AuthService.signOut exception', { error })
      return {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Sign out failed',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: any; isAuthenticated: boolean }>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        return {
          success: true, // Not an error - just not authenticated
          data: {
            user: null,
            isAuthenticated: false
          }
        }
      }

      return {
        success: true,
        data: {
          user: user ? this.mapSupabaseUser(user) : null,
          isAuthenticated: !!user
        }
      }
    } catch (error) {
      logger.error('AuthService.getCurrentUser exception', { error })
      return {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get current user',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  private async createUserRecord(supabaseUser: any): Promise<void> {
    try {
      await prisma.users.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          password: '', // Password is managed by Supabase
          emailVerified: !!supabaseUser.email_confirmed_at,
          accountCreatedDate: new Date(),
          subscriptionTier: 'free',
          lastLoginDate: new Date()
        }
      })
    } catch (error) {
      // User might already exist - that's okay
      logger.warn('AuthService.createUserRecord failed', { error })
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await prisma.users.update({
        where: { id: userId },
        data: { lastLoginDate: new Date() }
      })
    } catch (error) {
      logger.warn('AuthService.updateLastLogin failed', { error })
    }
  }

  private mapSupabaseUser(supabaseUser: any): any {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      emailVerified: !!supabaseUser.email_confirmed_at,
      subscriptionTier: supabaseUser.user_metadata?.subscription_tier || 'free',
      accountCreatedDate: supabaseUser.created_at,
      lastLoginDate: new Date().toISOString()
    }
  }
}

export const authService = new AuthService()

/**
 * Get server-side authentication session for tRPC context
 */
export async function getServerAuthSession(opts: { req: any; res: any }) {
  try {
    const result = await authService.getCurrentUser()
    
    if (result.success && result.data?.isAuthenticated) {
      return {
        user: result.data.user,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    }
    
    return null
  } catch (error) {
    logger.error('getServerAuthSession failed', { error })
    return null
  }
}