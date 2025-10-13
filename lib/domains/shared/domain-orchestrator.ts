/**
 * Domain Orchestrator
 * Coordinates interactions between domain services
 * Reduces coupling and manages cross-domain operations
 */

import { authDomainService } from '@/lib/domains/auth/auth-domain.service'
import { contentDomainService } from '@/lib/domains/content/content-domain.service'
import { logger } from '@/lib/logger'
import { ApiResponse } from '@/types/api-responses'

export interface DomainEvent {
  eventType: string
  sourceService: string
  targetService?: string
  payload: any
  timestamp: Date
  correlationId: string
}

export interface CrossDomainOperation {
  operationType: string
  requiredServices: string[]
  compensationActions?: Array<{
    service: string
    action: string
    params: any
  }>
}

export class DomainOrchestrator {
  private eventQueue: DomainEvent[] = []
  private activeOperations: Map<string, CrossDomainOperation> = new Map()

  /**
   * User Registration Flow - Coordinates auth and content domain setup
   */
  async registerUserWithOnboarding(userData: {
    email: string
    password: string
    confirmPassword: string
    preferredTopics?: string[]
  }, context: any): Promise<ApiResponse> {
    const correlationId = crypto.randomUUID()
    logger.info('Starting user registration with onboarding', { correlationId, email: userData.email })

    try {
      // 1. Register user in auth domain
      const authResult = await authDomainService.registerUser(userData, context)
      
      if (!authResult.success) {
        return authResult
      }

      this.publishEvent({
        eventType: 'USER_REGISTERED',
        sourceService: 'auth',
        payload: { userId: authResult.data?.user?.id, email: userData.email },
        timestamp: new Date(),
        correlationId
      })

      // 2. Set up user content preferences (if provided)
      if (userData.preferredTopics && authResult.data?.user?.id) {
        await this.setupUserContentPreferences(
          authResult.data.user.id,
          userData.preferredTopics,
          correlationId
        )
      }

      // 3. Create welcome content
      if (authResult.data?.user?.id) {
        await this.createWelcomeContent(authResult.data.user.id, correlationId)
      }

      logger.info('User registration with onboarding completed', { correlationId })
      return authResult
    } catch (error) {
      logger.error('User registration with onboarding failed', { error, correlationId })
      
      // Compensation: If auth succeeded but onboarding failed, we might want to clean up
      await this.handleRegistrationFailure(userData.email, correlationId)
      
      return {
        success: false,
        error: {
          code: 'REGISTRATION_ORCHESTRATION_ERROR',
          message: 'Registration process failed',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Content Publishing Flow - Coordinates content creation and social media posting
   */
  async publishContentFlow(publishData: {
    userId: string
    contentText: string
    contentTopic: string
    toneStyle: string
    platforms: string[]
    scheduleDateTime?: Date
    brandProjectId?: string
  }): Promise<ApiResponse> {
    const correlationId = crypto.randomUUID()
    logger.info('Starting content publishing flow', { correlationId, userId: publishData.userId })

    try {
      // 1. Create content in content domain
      const contentResult = await contentDomainService.createContent({
        userId: publishData.userId,
        contentText: publishData.contentText,
        contentTopic: publishData.contentTopic,
        toneStyle: publishData.toneStyle,
        brandProjectId: publishData.brandProjectId
      })

      if (!contentResult.success) {
        return contentResult
      }

      this.publishEvent({
        eventType: 'CONTENT_CREATED',
        sourceService: 'content',
        payload: { contentId: contentResult.data?.id, userId: publishData.userId },
        timestamp: new Date(),
        correlationId
      })

      // 2. Schedule or publish immediately
      const contentId = contentResult.data?.id
      if (contentId) {
        const scheduleTime = publishData.scheduleDateTime || new Date(Date.now() + 60000) // 1 minute from now if immediate
        
        const scheduleResult = await contentDomainService.scheduleContent(
          contentId,
          scheduleTime,
          publishData.platforms
        )

        if (!scheduleResult.success) {
          // Compensation: Mark content as failed
          await this.handleContentSchedulingFailure(contentId, correlationId)
          return scheduleResult
        }

        this.publishEvent({
          eventType: 'CONTENT_SCHEDULED',
          sourceService: 'content',
          payload: { 
            contentId, 
            userId: publishData.userId, 
            platforms: publishData.platforms,
            scheduledFor: scheduleTime
          },
          timestamp: new Date(),
          correlationId
        })
      }

      logger.info('Content publishing flow completed', { correlationId })
      return {
        success: true,
        data: {
          contentId: contentResult.data?.id,
          scheduled: !!publishData.scheduleDateTime,
          platforms: publishData.platforms
        }
      }
    } catch (error) {
      logger.error('Content publishing flow failed', { error, correlationId })
      return {
        success: false,
        error: {
          code: 'PUBLISHING_ORCHESTRATION_ERROR',
          message: 'Content publishing process failed',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * User Analytics Dashboard - Coordinates data from multiple domains
   */
  async getUserDashboardData(userId: string, timeRange?: { start: Date; end: Date }): Promise<ApiResponse> {
    const correlationId = crypto.randomUUID()
    logger.info('Fetching user dashboard data', { correlationId, userId })

    try {
      // Fetch data from multiple domains in parallel
      const [contentMetrics] = await Promise.all([
        contentDomainService.getContentMetrics(userId, timeRange),
        // Add other domain metrics here as they're implemented
      ])

      // Aggregate the data
      const dashboardData = {
        content: contentMetrics.success ? contentMetrics.data : null,
        // Add other domain data here
        summary: {
          totalActivity: contentMetrics.data?.totalPosts || 0,
          upcomingScheduled: contentMetrics.data?.scheduledPosts || 0,
        }
      }

      this.publishEvent({
        eventType: 'DASHBOARD_ACCESSED',
        sourceService: 'orchestrator',
        payload: { userId, timeRange },
        timestamp: new Date(),
        correlationId
      })

      return {
        success: true,
        data: dashboardData
      }
    } catch (error) {
      logger.error('Dashboard data fetch failed', { error, correlationId, userId })
      return {
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: 'Failed to fetch dashboard data',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  private async setupUserContentPreferences(userId: string, topics: string[], correlationId: string): Promise<void> {
    try {
      // Create default content based on user preferences
      logger.info('Setting up user content preferences', { userId, topics, correlationId })
      // TODO: Implement content preference setup
    } catch (error) {
      logger.error('Failed to setup user content preferences', { error, userId, correlationId })
    }
  }

  private async createWelcomeContent(userId: string, correlationId: string): Promise<void> {
    try {
      const welcomeContent = {
        userId,
        contentText: "Welcome to SocialMonster! 🎉 Ready to create amazing content?",
        contentTopic: "welcome",
        toneStyle: "friendly"
      }

      await contentDomainService.createContent(welcomeContent)
      logger.info('Welcome content created', { userId, correlationId })
    } catch (error) {
      logger.error('Failed to create welcome content', { error, userId, correlationId })
    }
  }

  private async handleRegistrationFailure(email: string, correlationId: string): Promise<void> {
    logger.warn('Handling registration failure', { email, correlationId })
    // TODO: Implement cleanup logic (remove partial user data, send failure notifications, etc.)
  }

  private async handleContentSchedulingFailure(contentId: string, correlationId: string): Promise<void> {
    logger.warn('Handling content scheduling failure', { contentId, correlationId })
    // TODO: Mark content as failed, notify user, etc.
  }

  private publishEvent(event: DomainEvent): void {
    this.eventQueue.push(event)
    logger.debug('Domain event published', { event })
    
    // In production, this would publish to a message queue or event bus
    this.processEvent(event)
  }

  private async processEvent(event: DomainEvent): Promise<void> {
    // Handle cross-domain event processing
    switch (event.eventType) {
      case 'USER_REGISTERED':
        await this.handleUserRegisteredEvent(event)
        break
      case 'CONTENT_CREATED':
        await this.handleContentCreatedEvent(event)
        break
      case 'CONTENT_SCHEDULED':
        await this.handleContentScheduledEvent(event)
        break
      default:
        logger.debug('Unhandled domain event', { event })
    }
  }

  private async handleUserRegisteredEvent(event: DomainEvent): Promise<void> {
    // Could trigger welcome emails, analytics tracking, etc.
    logger.info('Processing user registered event', { event })
  }

  private async handleContentCreatedEvent(event: DomainEvent): Promise<void> {
    // Could trigger content analysis, suggestion engines, etc.
    logger.info('Processing content created event', { event })
  }

  private async handleContentScheduledEvent(event: DomainEvent): Promise<void> {
    // Could trigger platform-specific optimizations, analytics updates, etc.
    logger.info('Processing content scheduled event', { event })
  }

  // Health check for domain services
  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy'
    services: Record<string, 'healthy' | 'unhealthy'>
  }> {
    const services: Record<string, 'healthy' | 'unhealthy'> = {
      auth: 'healthy', // TODO: Implement actual health checks
      content: 'healthy',
      // Add other services
    }

    const unhealthyCount = Object.values(services).filter(status => status === 'unhealthy').length
    const overall = unhealthyCount === 0 ? 'healthy' : unhealthyCount < Object.keys(services).length ? 'degraded' : 'unhealthy'

    return { overall, services }
  }
}

export const domainOrchestrator = new DomainOrchestrator()