/**
 * Risk Monitor
 * Monitors business-critical operations across domains
 * Provides real-time risk assessment and mitigation
 */

import { logger } from '@/lib/logger'

export interface RiskEvent {
  id: string
  domain: string
  operation: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  eventType: 'failure' | 'degradation' | 'success' | 'warning'
  userId?: string
  metadata: Record<string, any>
  timestamp: Date
  correlationId?: string
}

export interface RiskMetrics {
  domain: string
  successRate: number
  errorRate: number
  averageResponseTime: number
  totalOperations: number
  criticalFailures: number
  lastUpdate: Date
}

export interface RiskThreshold {
  domain: string
  operation?: string
  maxErrorRate: number
  maxResponseTime: number
  maxCriticalFailures: number
  alertOnExceed: boolean
}

export interface BusinessImpactAssessment {
  estimatedLoss: number
  affectedUsers: number
  downstreamServices: string[]
  mitigationActions: string[]
  escalationRequired: boolean
}

export class RiskMonitor {
  private riskEvents: RiskEvent[] = []
  private domainMetrics: Map<string, RiskMetrics> = new Map()
  private riskThresholds: RiskThreshold[] = []
  private alertHandlers: Array<(event: RiskEvent, assessment: BusinessImpactAssessment) => void> = []

  constructor() {
    this.initializeDefaultThresholds()
    this.startMetricsAggregation()
  }

  /**
   * Record a risk event from any domain
   */
  recordEvent(event: Omit<RiskEvent, 'id' | 'timestamp'>): void {
    const riskEvent: RiskEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    }

    this.riskEvents.push(riskEvent)
    this.updateDomainMetrics(riskEvent)
    
    // Check if this event triggers any thresholds
    const assessment = this.assessBusinessImpact(riskEvent)
    this.checkThresholds(riskEvent, assessment)

    logger.info('Risk event recorded', { 
      domain: riskEvent.domain,
      operation: riskEvent.operation,
      riskLevel: riskEvent.riskLevel,
      eventType: riskEvent.eventType
    })
  }

  /**
   * Get current risk metrics for a domain
   */
  getDomainMetrics(domain: string): RiskMetrics | null {
    return this.domainMetrics.get(domain) || null
  }

  /**
   * Get overall system risk assessment
   */
  getSystemRiskAssessment(): {
    overallRisk: 'low' | 'medium' | 'high' | 'critical'
    domainRisks: Array<{ domain: string; risk: string; metrics: RiskMetrics }>
    recommendations: string[]
  } {
    const domainRisks = Array.from(this.domainMetrics.entries()).map(([domain, metrics]) => ({
      domain,
      risk: this.calculateDomainRisk(metrics),
      metrics
    }))

    const overallRisk = this.calculateOverallRisk(domainRisks)
    const recommendations = this.generateRiskRecommendations(domainRisks)

    return {
      overallRisk,
      domainRisks,
      recommendations
    }
  }

  /**
   * Monitor authentication domain specifically (high business impact)
   */
  monitorAuthOperation(
    operation: string,
    success: boolean,
    responseTime: number,
    userId?: string,
    error?: string
  ): void {
    this.recordEvent({
      domain: 'auth',
      operation,
      riskLevel: success ? 'low' : 'high',
      eventType: success ? 'success' : 'failure',
      userId,
      metadata: {
        responseTime,
        error: error || null,
        businessCritical: true
      }
    })
  }

  /**
   * Monitor payment operations (highest business impact)
   */
  monitorPaymentOperation(
    operation: string,
    success: boolean,
    amount: number,
    currency: string,
    userId?: string,
    error?: string
  ): void {
    this.recordEvent({
      domain: 'payment',
      operation,
      riskLevel: success ? 'low' : 'critical',
      eventType: success ? 'success' : 'failure',
      userId,
      metadata: {
        amount,
        currency,
        error: error || null,
        businessCritical: true,
        financialImpact: true
      }
    })
  }

  /**
   * Monitor content operations
   */
  monitorContentOperation(
    operation: string,
    success: boolean,
    userId?: string,
    contentType?: string,
    error?: string
  ): void {
    this.recordEvent({
      domain: 'content',
      operation,
      riskLevel: success ? 'low' : 'medium',
      eventType: success ? 'success' : 'failure',
      userId,
      metadata: {
        contentType: contentType || 'unknown',
        error: error || null,
        userImpact: true
      }
    })
  }

  /**
   * Add custom alert handler
   */
  addAlertHandler(handler: (event: RiskEvent, assessment: BusinessImpactAssessment) => void): void {
    this.alertHandlers.push(handler)
  }

  /**
   * Get recent high-risk events
   */
  getHighRiskEvents(hours: number = 24): RiskEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return this.riskEvents.filter(event => 
      event.timestamp >= cutoff && 
      (event.riskLevel === 'high' || event.riskLevel === 'critical')
    )
  }

  private initializeDefaultThresholds(): void {
    this.riskThresholds = [
      {
        domain: 'auth',
        maxErrorRate: 5, // 5% error rate
        maxResponseTime: 2000, // 2 seconds
        maxCriticalFailures: 10,
        alertOnExceed: true
      },
      {
        domain: 'payment',
        maxErrorRate: 1, // 1% error rate for payments
        maxResponseTime: 5000, // 5 seconds
        maxCriticalFailures: 1,
        alertOnExceed: true
      },
      {
        domain: 'content',
        maxErrorRate: 10, // 10% error rate
        maxResponseTime: 10000, // 10 seconds
        maxCriticalFailures: 50,
        alertOnExceed: true
      }
    ]
  }

  private updateDomainMetrics(event: RiskEvent): void {
    const existing = this.domainMetrics.get(event.domain) || {
      domain: event.domain,
      successRate: 0,
      errorRate: 0,
      averageResponseTime: 0,
      totalOperations: 0,
      criticalFailures: 0,
      lastUpdate: new Date()
    }

    // Update metrics based on the event
    existing.totalOperations++
    existing.lastUpdate = new Date()

    if (event.eventType === 'failure') {
      existing.errorRate = this.calculateNewRate(existing.errorRate, existing.totalOperations, false)
      existing.successRate = this.calculateNewRate(existing.successRate, existing.totalOperations, true)
      
      if (event.riskLevel === 'critical') {
        existing.criticalFailures++
      }
    } else if (event.eventType === 'success') {
      existing.successRate = this.calculateNewRate(existing.successRate, existing.totalOperations, true)
      existing.errorRate = this.calculateNewRate(existing.errorRate, existing.totalOperations, false)
    }

    // Update response time if available
    if (event.metadata.responseTime) {
      existing.averageResponseTime = this.calculateNewAverage(
        existing.averageResponseTime,
        existing.totalOperations,
        event.metadata.responseTime
      )
    }

    this.domainMetrics.set(event.domain, existing)
  }

  private assessBusinessImpact(event: RiskEvent): BusinessImpactAssessment {
    let estimatedLoss = 0
    let affectedUsers = 1
    const downstreamServices: string[] = []
    const mitigationActions: string[] = []

    // Domain-specific impact assessment
    switch (event.domain) {
      case 'payment':
        estimatedLoss = event.metadata.amount || 0
        affectedUsers = event.metadata.businessCritical ? 10 : 1
        downstreamServices.push('subscription', 'billing', 'analytics')
        mitigationActions.push('Retry payment', 'Contact payment provider', 'Manual intervention')
        break

      case 'auth':
        estimatedLoss = event.riskLevel === 'critical' ? 1000 : 100 // Estimated user churn cost
        affectedUsers = event.eventType === 'failure' ? 100 : 1
        downstreamServices.push('content', 'payment', 'user_management')
        mitigationActions.push('Check auth provider', 'Verify credentials', 'Reset session')
        break

      case 'content':
        estimatedLoss = 50 // Lower impact per user
        affectedUsers = 1
        downstreamServices.push('social_media', 'analytics')
        mitigationActions.push('Retry operation', 'Check AI service', 'Manual content review')
        break
    }

    const escalationRequired = event.riskLevel === 'critical' || estimatedLoss > 1000

    return {
      estimatedLoss,
      affectedUsers,
      downstreamServices,
      mitigationActions,
      escalationRequired
    }
  }

  private checkThresholds(event: RiskEvent, assessment: BusinessImpactAssessment): void {
    const threshold = this.riskThresholds.find(t => t.domain === event.domain)
    if (!threshold || !threshold.alertOnExceed) return

    const metrics = this.domainMetrics.get(event.domain)
    if (!metrics) return

    const violations: string[] = []

    if (metrics.errorRate > threshold.maxErrorRate) {
      violations.push(`Error rate (${metrics.errorRate.toFixed(2)}%) exceeds threshold (${threshold.maxErrorRate}%)`)
    }

    if (metrics.averageResponseTime > threshold.maxResponseTime) {
      violations.push(`Response time (${metrics.averageResponseTime}ms) exceeds threshold (${threshold.maxResponseTime}ms)`)
    }

    if (metrics.criticalFailures > threshold.maxCriticalFailures) {
      violations.push(`Critical failures (${metrics.criticalFailures}) exceed threshold (${threshold.maxCriticalFailures})`)
    }

    if (violations.length > 0) {
      this.triggerAlert(event, assessment, violations)
    }
  }

  private triggerAlert(event: RiskEvent, assessment: BusinessImpactAssessment, violations: string[]): void {
    logger.warn('Risk threshold exceeded', {
      domain: event.domain,
      operation: event.operation,
      violations,
      estimatedLoss: assessment.estimatedLoss,
      escalationRequired: assessment.escalationRequired
    })

    // Notify all alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(event, assessment)
      } catch (error) {
        logger.error('Alert handler failed', { error })
      }
    })
  }

  private calculateDomainRisk(metrics: RiskMetrics): string {
    let score = 0

    // Error rate contributes to risk score
    if (metrics.errorRate > 10) score += 3
    else if (metrics.errorRate > 5) score += 2
    else if (metrics.errorRate > 1) score += 1

    // Critical failures contribute heavily
    if (metrics.criticalFailures > 0) score += 2

    // Response time contributes
    if (metrics.averageResponseTime > 5000) score += 2
    else if (metrics.averageResponseTime > 2000) score += 1

    if (score >= 5) return 'critical'
    if (score >= 3) return 'high'
    if (score >= 1) return 'medium'
    return 'low'
  }

  private calculateOverallRisk(domainRisks: Array<{ domain: string; risk: string }>): 'low' | 'medium' | 'high' | 'critical' {
    const criticalDomains = domainRisks.filter(d => d.risk === 'critical').length
    const highDomains = domainRisks.filter(d => d.risk === 'high').length

    if (criticalDomains > 0) return 'critical'
    if (highDomains > 1) return 'high'
    if (highDomains > 0) return 'medium'
    return 'low'
  }

  private generateRiskRecommendations(domainRisks: Array<{ domain: string; risk: string; metrics: RiskMetrics }>): string[] {
    const recommendations: string[] = []

    domainRisks.forEach(({ domain, risk, metrics }) => {
      if (risk === 'critical' || risk === 'high') {
        recommendations.push(`Immediate attention required for ${domain} domain`)
        
        if (metrics.errorRate > 5) {
          recommendations.push(`Investigate high error rate in ${domain} (${metrics.errorRate.toFixed(2)}%)`)
        }
        
        if (metrics.criticalFailures > 0) {
          recommendations.push(`Address ${metrics.criticalFailures} critical failures in ${domain}`)
        }
        
        if (metrics.averageResponseTime > 5000) {
          recommendations.push(`Optimize response time in ${domain} (${metrics.averageResponseTime}ms)`)
        }
      }
    })

    if (recommendations.length === 0) {
      recommendations.push('All domains operating within acceptable risk levels')
    }

    return recommendations
  }

  private calculateNewRate(currentRate: number, totalOps: number, isSuccess: boolean): number {
    const currentCount = (currentRate / 100) * (totalOps - 1)
    const newCount = isSuccess ? currentCount + 1 : currentCount
    return (newCount / totalOps) * 100
  }

  private calculateNewAverage(currentAvg: number, totalOps: number, newValue: number): number {
    return ((currentAvg * (totalOps - 1)) + newValue) / totalOps
  }

  private startMetricsAggregation(): void {
    // Clean up old events every hour
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
      this.riskEvents = this.riskEvents.filter(event => event.timestamp >= cutoff)
    }, 60 * 60 * 1000) // Every hour
  }
}

export const riskMonitor = new RiskMonitor()

// Set up default alert handler
riskMonitor.addAlertHandler((event, assessment) => {
  if (assessment.escalationRequired) {
    logger.error('CRITICAL: Escalation required', {
      domain: event.domain,
      operation: event.operation,
      estimatedLoss: assessment.estimatedLoss,
      affectedUsers: assessment.affectedUsers,
      mitigationActions: assessment.mitigationActions
    })
  }
})