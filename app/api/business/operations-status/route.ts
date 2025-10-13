import { NextRequest, NextResponse } from 'next/server'
import { businessContinuityService } from '@/lib/business/continuity-service'
import { distributedBusinessOperations } from '@/lib/business/distributed-operations'

export async function GET(_request: NextRequest) {
  try {
    const continuityStatus = businessContinuityService.getContinuityStatus()
    const operationStatus = distributedBusinessOperations.getOperationStatus()
    const failoverHistory = businessContinuityService.getFailoverHistory(24)

    const response = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        businessContinuity: continuityStatus,
        distributedOperations: operationStatus,
        failoverHistory: failoverHistory.slice(0, 10), // Last 10 failovers
        summary: {
          overallHealthStatus: continuityStatus.overallHealth,
          activeFailovers: continuityStatus.activeFailovers,
          activeOperations: operationStatus.activeOperations,
          estimatedHourlyLoss: continuityStatus.riskAssessment.estimatedHourlyLoss,
          businessImpactLevel: continuityStatus.overallHealth === 'critical' ? 'HIGH' :
                              continuityStatus.overallHealth === 'degraded' ? 'MEDIUM' : 'LOW',
          recommendations: generateRecommendations(continuityStatus, operationStatus)
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }

    // Set appropriate HTTP status based on health
    let httpStatus = 200
    if (continuityStatus.overallHealth === 'critical') {
      httpStatus = 503 // Service Unavailable
    } else if (continuityStatus.overallHealth === 'degraded') {
      httpStatus = 206 // Partial Content
    }

    return NextResponse.json(response, { status: httpStatus })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'OPERATIONS_STATUS_ERROR',
        message: 'Failed to fetch business operations status',
        details: [],
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

function generateRecommendations(continuityStatus: any, operationStatus: any): string[] {
  const recommendations: string[] = []

  if (continuityStatus.overallHealth === 'critical') {
    recommendations.push('URGENT: Critical business operations are affected. Immediate intervention required.')
    recommendations.push('Activate emergency response procedures for failed systems.')
  }

  if (continuityStatus.riskAssessment.estimatedHourlyLoss > 5000) {
    recommendations.push(`High financial risk detected: $${continuityStatus.riskAssessment.estimatedHourlyLoss}/hour potential loss.`)
  }

  if (continuityStatus.activeFailovers > 0) {
    recommendations.push('Active failovers in progress. Monitor recovery status closely.')
  }

  if (operationStatus.activeOperations > 100) {
    recommendations.push('High operation volume detected. Consider scaling resources.')
  }

  // Circuit breaker recommendations
  Object.entries(operationStatus.circuitBreakers).forEach(([name, breaker]: [string, any]) => {
    if (breaker.state === 'OPEN') {
      recommendations.push(`Circuit breaker '${name}' is OPEN. Service degraded until recovery.`)
    } else if (breaker.state === 'HALF_OPEN') {
      recommendations.push(`Circuit breaker '${name}' is testing recovery. Monitor closely.`)
    }
  })

  if (recommendations.length === 0) {
    recommendations.push('All business operations are healthy. Continue monitoring.')
  }

  return recommendations
}