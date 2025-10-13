/**
 * Authentication Domain Service
 * Isolated domain logic for authentication operations
 * Reduces business-critical code concentration
 */

import { AuthService } from '@/lib/services/auth.service'
import { logger } from '@/lib/logger'
import { ApiResponse } from '@/types/api-responses'

export interface AuthDomainContext {
  userAgent?: string
  ipAddress?: string
  sessionId?: string
}

export interface SecurityPolicy {
  maxLoginAttempts: number
  lockoutDurationMinutes: number
  requireEmailVerification: boolean
  passwordMinLength: number
  sessionTimeoutHours: number
}

export class AuthDomainService {
  private authService: AuthService
  private securityPolicy: SecurityPolicy

  constructor() {
    this.authService = new AuthService()
    this.securityPolicy = {
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      requireEmailVerification: true,
      passwordMinLength: 8,
      sessionTimeoutHours: 24
    }
  }

  async authenticateUser(
    email: string,
    password: string,
    context: AuthDomainContext
  ): Promise<ApiResponse> {
    try {
      // Domain-specific validation
      const validationResult = this.validateAuthAttempt(email, context)
      if (!validationResult.valid) {
        return validationResult.response
      }

      // Delegate to service layer
      const result = await this.authService.signIn({ email, password })
      
      // Domain-specific post-processing
      if (result.success) {
        await this.recordSuccessfulLogin(email, context)
        await this.clearFailedAttempts(email)
      } else {
        await this.recordFailedAttempt(email, context)
      }

      return result
    } catch (error) {
      logger.error('AuthDomainService.authenticateUser failed', { error, email, context })
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication service unavailable',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async registerUser(
    userData: {
      email: string
      password: string
      confirmPassword: string
    },
    context: AuthDomainContext
  ): Promise<ApiResponse> {
    try {
      // Domain-specific business rules
      const businessRuleCheck = await this.validateRegistrationBusinessRules(userData.email)
      if (!businessRuleCheck.valid) {
        return businessRuleCheck.response
      }

      // Delegate to service layer
      const result = await this.authService.signUp(userData)
      
      // Domain-specific post-processing
      if (result.success) {
        await this.initiateOnboardingFlow(userData.email)
        await this.sendWelcomeNotification(userData.email)
      }

      return result
    } catch (error) {
      logger.error('AuthDomainService.registerUser failed', { error, userData, context })
      return {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: 'Registration service unavailable',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  private validateAuthAttempt(email: string, context: AuthDomainContext): {
    valid: boolean
    response?: ApiResponse
  } {
    // Check for account lockout
    const failedAttempts = this.getFailedAttempts(email)
    if (failedAttempts >= this.securityPolicy.maxLoginAttempts) {
      return {
        valid: false,
        response: {
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `Account locked due to too many failed attempts. Try again in ${this.securityPolicy.lockoutDurationMinutes} minutes.`,
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }
    }

    // Rate limiting by IP
    if (context.ipAddress && this.isIpRateLimited(context.ipAddress)) {
      return {
        valid: false,
        response: {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests from this IP address',
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }
    }

    return { valid: true }
  }

  private async validateRegistrationBusinessRules(email: string): Promise<{
    valid: boolean
    response?: ApiResponse
  }> {
    // Business rule: No disposable email addresses
    const isDisposable = await this.isDisposableEmail(email)
    if (isDisposable) {
      return {
        valid: false,
        response: {
          success: false,
          error: {
            code: 'BUSINESS_RULE_VIOLATION',
            message: 'Disposable email addresses are not allowed',
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }
    }

    // Business rule: Domain whitelist/blacklist
    const domainCheck = this.validateEmailDomain(email)
    if (!domainCheck.valid) {
      return {
        valid: false,
        response: domainCheck.response
      }
    }

    return { valid: true }
  }

  private validateEmailDomain(email: string): {
    valid: boolean
    response?: ApiResponse
  } {
    const domain = email.split('@')[1]?.toLowerCase()
    
    // Example business rules
    const blockedDomains = ['tempmail.org', 'guerrillamail.com', '10minutemail.com']
    
    if (blockedDomains.includes(domain)) {
      return {
        valid: false,
        response: {
          success: false,
          error: {
            code: 'DOMAIN_NOT_ALLOWED',
            message: 'Email domain is not allowed',
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }
    }

    return { valid: true }
  }

  private async isDisposableEmail(email: string): Promise<boolean> {
    // In production, this would call an external service
    const disposableDomains = ['tempmail.org', 'guerrillamail.com', '10minutemail.com']
    const domain = email.split('@')[1]?.toLowerCase()
    return disposableDomains.includes(domain)
  }

  private getFailedAttempts(email: string): number {
    // In production, this would query a cache or database
    // For now, return 0 (no lockout)
    return 0
  }

  private isIpRateLimited(ipAddress: string): boolean {
    // In production, implement proper rate limiting
    return false
  }

  private async recordSuccessfulLogin(email: string, context: AuthDomainContext): Promise<void> {
    logger.info('Successful login recorded', { email, context })
    // Record in audit log, update metrics, etc.
  }

  private async recordFailedAttempt(email: string, context: AuthDomainContext): Promise<void> {
    logger.warn('Failed login attempt recorded', { email, context })
    // Increment failed attempt counter, security monitoring, etc.
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    // Clear failed attempt counter for this email
  }

  private async initiateOnboardingFlow(email: string): Promise<void> {
    logger.info('Onboarding flow initiated', { email })
    // Trigger welcome email, setup guides, etc.
  }

  private async sendWelcomeNotification(email: string): Promise<void> {
    logger.info('Welcome notification sent', { email })
    // Send welcome email, push notification, etc.
  }

  // Security policy management
  updateSecurityPolicy(policy: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...policy }
    logger.info('Security policy updated', { policy: this.securityPolicy })
  }

  getSecurityPolicy(): SecurityPolicy {
    return { ...this.securityPolicy }
  }
}

export const authDomainService = new AuthDomainService()