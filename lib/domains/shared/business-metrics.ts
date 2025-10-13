/**
 * Business Metrics Tracker
 * Tracks business-critical operations and their impact
 * Provides real-time business health monitoring
 */

import { logger } from '@/lib/logger'

export interface BusinessOperation {
  id: string
  domain: string
  operation: string
  userId?: string
  businessValue: number // Estimated business value in cents
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  startTime: Date
  endTime?: Date
  success: boolean
  metadata: Record<string, any>
}

export interface DomainHealthMetrics {
  domain: string
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  totalBusinessValue: number
  lostBusinessValue: number
  averageResponseTime: number
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  lastUpdate: Date
}

export interface BusinessAlert {
  id: string
  alertType: 'revenue_risk' | 'service_degradation' | 'user_impact' | 'compliance_risk'
  severity: 'warning' | 'error' | 'critical'
  domain: string
  message: string
  estimatedImpact: {
    revenueAtRisk: number
    usersAffected: number
    operationsImpacted: number
  }
  recommendedActions: string[]
  timestamp: Date
}

export class BusinessMetricsTracker {
  private operations: BusinessOperation[] = []
  private domainMetrics: Map<string, DomainHealthMetrics> = new Map()
  private alerts: BusinessAlert[] = []
  private alertHandlers: Array<(alert: BusinessAlert) => void> = []

  /**
   * Track a business operation start
   */
  startOperation(params: {
    domain: string
    operation: string
    userId?: string
    businessValue: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    metadata?: Record<string, any>
  }): string {
    const operation: BusinessOperation = {
      id: crypto.randomUUID(),
      domain: params.domain,
      operation: params.operation,
      userId: params.userId,
      businessValue: params.businessValue,
      riskLevel: params.riskLevel,
      startTime: new Date(),
      success: false,
      metadata: params.metadata || {}
    }

    this.operations.push(operation)
    
    logger.info('Business operation started', {
      id: operation.id,
      domain: operation.domain,
      operation: operation.operation,
      businessValue: operation.businessValue,
      riskLevel: operation.riskLevel
    })

    return operation.id
  }

  /**
   * Complete a business operation
   */
  completeOperation(operationId: string, success: boolean, additionalMetadata?: Record<string, any>): void {
    const operation = this.operations.find(op => op.id === operationId)
    if (!operation) {
      logger.warn('Operation not found for completion', { operationId })
      return
    }

    operation.endTime = new Date()
    operation.success = success
    operation.metadata = { ...operation.metadata, ...additionalMetadata }

    this.updateDomainMetrics(operation)
    this.checkBusinessAlerts(operation)

    logger.info('Business operation completed', {
      id: operation.id,
      domain: operation.domain,
      operation: operation.operation,
      success: operation.success,
      duration: operation.endTime.getTime() - operation.startTime.getTime(),
      businessValue: operation.businessValue
    })
  }

  /**
   * Get business health metrics for a domain
   */
  getDomainHealth(domain: string): DomainHealthMetrics | null {
    return this.domainMetrics.get(domain) || null
  }

  /**
   * Get overall business health summary
   */
  getBusinessHealthSummary(): {
    totalRevenue: number
    revenueAtRisk: number
    totalOperations: number
    successRate: number
    criticalFailures: number
    domainHealth: DomainHealthMetrics[]
    activeAlerts: BusinessAlert[]
  } {
    const domains = Array.from(this.domainMetrics.values())
    
    const totalRevenue = domains.reduce((sum, domain) => sum + domain.totalBusinessValue, 0)
    const revenueAtRisk = domains.reduce((sum, domain) => sum + domain.lostBusinessValue, 0)
    const totalOperations = domains.reduce((sum, domain) => sum + domain.totalOperations, 0)
    const successfulOperations = domains.reduce((sum, domain) => sum + domain.successfulOperations, 0)
    const criticalFailures = domains.reduce((sum, domain) => sum + domain.riskDistribution.critical, 0)

    const successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 100

    return {
      totalRevenue,
      revenueAtRisk,
      totalOperations,
      successRate,
      criticalFailures,
      domainHealth: domains,
      activeAlerts: this.getActiveAlerts()
    }
  }

  /**
   * Track authentication business value
   */
  trackAuthOperation(operation: string, userId: string, success: boolean): string {
    const operationId = this.startOperation({
      domain: 'auth',
      operation,
      userId,
      businessValue: 500, // $5.00 estimated value per successful auth
      riskLevel: 'high', // Auth failures have high business impact
      metadata: { userRetention: true }
    })

    this.completeOperation(operationId, success, {
      userExperience: success ? 'positive' : 'negative'
    })

    return operationId
  }

  /**
   * Track payment business value
   */
  trackPaymentOperation(operation: string, userId: string, amount: number, success: boolean): string {
    const operationId = this.startOperation({
      domain: 'payment',
      operation,
      userId,
      businessValue: amount, // Direct revenue impact
      riskLevel: 'critical', // Payment failures are critical
      metadata: { directRevenue: true, amount }
    })

    this.completeOperation(operationId, success, {
      revenueImpact: success ? 'positive' : 'negative',
      amount
    })

    return operationId
  }

  /**
   * Track content operation business value
   */
  trackContentOperation(operation: string, userId: string, success: boolean): string {
    const operationId = this.startOperation({
      domain: 'content',
      operation,
      userId,
      businessValue: 100, // $1.00 estimated value per content operation
      riskLevel: 'medium',
      metadata: { userEngagement: true }
    })

    this.completeOperation(operationId, success, {
      engagementImpact: success ? 'positive' : 'negative'
    })

    return operationId
  }

  /**
   * Add alert handler
   */
  addAlertHandler(handler: (alert: BusinessAlert) => void): void {
    this.alertHandlers.push(handler)
  }

  /**
   * Get recent high-impact failures
   */
  getHighImpactFailures(hours: number = 24): BusinessOperation[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return this.operations.filter(op => 
      op.startTime >= cutoff && 
      !op.success && 
      (op.riskLevel === 'high' || op.riskLevel === 'critical')
    )
  }

  private updateDomainMetrics(operation: BusinessOperation): void {
    const existing = this.domainMetrics.get(operation.domain) || {
      domain: operation.domain,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalBusinessValue: 0,
      lostBusinessValue: 0,
      averageResponseTime: 0,
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      lastUpdate: new Date()
    }

    existing.totalOperations++
    existing.lastUpdate = new Date()

    if (operation.success) {
      existing.successfulOperations++
      existing.totalBusinessValue += operation.businessValue
    } else {
      existing.failedOperations++
      existing.lostBusinessValue += operation.businessValue
    }

    // Update risk distribution
    existing.riskDistribution[operation.riskLevel]++

    // Update response time
    if (operation.endTime) {
      const responseTime = operation.endTime.getTime() - operation.startTime.getTime()
      existing.averageResponseTime = this.calculateNewAverage(
        existing.averageResponseTime,
        existing.totalOperations,
        responseTime
      )
    }

    this.domainMetrics.set(operation.domain, existing)
  }

  private checkBusinessAlerts(operation: BusinessOperation): void {
    const metrics = this.domainMetrics.get(operation.domain)
    if (!metrics) return

    // Check for revenue risk
    if (metrics.lostBusinessValue > 5000) { // $50.00 threshold
      this.createAlert({
        alertType: 'revenue_risk',
        severity: 'critical',
        domain: operation.domain,
        message: `High revenue loss detected in ${operation.domain}`,
        estimatedImpact: {
          revenueAtRisk: metrics.lostBusinessValue,
          usersAffected: metrics.failedOperations,
          operationsImpacted: metrics.failedOperations
        },
        recommendedActions: [
          'Investigate service failures immediately',
          'Implement circuit breaker if needed',
          'Contact affected users',
          'Review error logs and metrics'
        ]
      })
    }

    // Check for service degradation
    const failureRate = metrics.totalOperations > 0 ? (metrics.failedOperations / metrics.totalOperations) * 100 : 0
    if (failureRate > 10) { // 10% failure rate threshold
      this.createAlert({
        alertType: 'service_degradation',
        severity: failureRate > 25 ? 'critical' : 'error',
        domain: operation.domain,
        message: `High failure rate detected in ${operation.domain} (${failureRate.toFixed(1)}%)`,
        estimatedImpact: {
          revenueAtRisk: metrics.lostBusinessValue,
          usersAffected: metrics.failedOperations,
          operationsImpacted: metrics.failedOperations
        },
        recommendedActions: [
          'Scale up service capacity',
          'Review recent deployments',
          'Check downstream dependencies',
          'Implement graceful degradation'
        ]
      })
    }

    // Check for user impact
    if (operation.riskLevel === 'critical' && !operation.success) {
      this.createAlert({
        alertType: 'user_impact',
        severity: 'error',
        domain: operation.domain,
        message: `Critical operation failed: ${operation.operation}`,
        estimatedImpact: {
          revenueAtRisk: operation.businessValue,
          usersAffected: 1,
          operationsImpacted: 1
        },
        recommendedActions: [
          'Investigate root cause immediately',
          'Contact user if applicable',
          'Implement retry mechanism',
          'Review error handling'
        ]
      })
    }
  }

  private createAlert(params: Omit<BusinessAlert, 'id' | 'timestamp'>): void {
    const alert: BusinessAlert = {
      ...params,
      id: crypto.randomUUID(),
      timestamp: new Date()
    }

    this.alerts.push(alert)

    logger.warn('Business alert created', {
      alertType: alert.alertType,
      severity: alert.severity,
      domain: alert.domain,
      message: alert.message,
      estimatedImpact: alert.estimatedImpact
    })

    // Notify alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert)
      } catch (error) {
        logger.error('Business alert handler failed', { error })
      }
    })
  }

  private getActiveAlerts(hours: number = 24): BusinessAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.alerts.filter(alert => alert.timestamp >= cutoff)
  }

  private calculateNewAverage(currentAvg: number, totalOps: number, newValue: number): number {
    return ((currentAvg * (totalOps - 1)) + newValue) / totalOps
  }
}

export const businessMetrics = new BusinessMetricsTracker()

// Set up default alert handlers
businessMetrics.addAlertHandler((alert) => {
  if (alert.severity === 'critical') {
    logger.error('CRITICAL BUSINESS ALERT', {
      alertType: alert.alertType,
      domain: alert.domain,
      message: alert.message,
      revenueAtRisk: alert.estimatedImpact.revenueAtRisk,
      usersAffected: alert.estimatedImpact.usersAffected,
      recommendedActions: alert.recommendedActions
    })
  }
})