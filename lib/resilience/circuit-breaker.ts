/**
 * Circuit Breaker Pattern Implementation
 * Protects business-critical operations from cascading failures
 */

import { logger } from '@/lib/logger'

export interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening
  timeoutWindow: number // Time window in ms for failure counting
  recoveryTimeout: number // Time in ms before attempting to recover
  monitorWindow: number // Time in ms to monitor for success before closing
}

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing - reject all requests
  HALF_OPEN = 'HALF_OPEN' // Testing - allow limited requests
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private lastFailureTime: number = 0
  private nextAttemptTime: number = 0
  private successCount: number = 0

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {
    logger.info(`Circuit breaker initialized: ${name}`, { config })
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        const error = new Error(`Circuit breaker ${this.name} is OPEN`)
        logger.warn('Circuit breaker preventing execution', {
          name: this.name,
          state: this.state,
          nextAttempt: new Date(this.nextAttemptTime)
        })
        throw error
      } else {
        // Time to try recovery
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
        logger.info('Circuit breaker attempting recovery', { name: this.name })
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= 5) { // Require 5 consecutive successes
        this.reset()
        logger.info('Circuit breaker recovered', { name: this.name })
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      if (Date.now() - this.lastFailureTime > this.config.timeoutWindow) {
        this.failureCount = 0
      }
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery attempt
      this.open()
    } else if (this.failureCount >= this.config.failureThreshold) {
      // Too many failures, open the circuit
      this.open()
    }

    logger.warn('Circuit breaker failure recorded', {
      name: this.name,
      failureCount: this.failureCount,
      state: this.state
    })
  }

  private open(): void {
    this.state = CircuitState.OPEN
    this.nextAttemptTime = Date.now() + this.config.recoveryTimeout
    logger.error('Circuit breaker OPENED', {
      name: this.name,
      failureCount: this.failureCount,
      nextAttempt: new Date(this.nextAttemptTime)
    })
  }

  private reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
    this.nextAttemptTime = 0
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime > 0 ? new Date(this.nextAttemptTime) : null,
      isAvailable: this.state === CircuitState.CLOSED || 
                  (this.state === CircuitState.HALF_OPEN && Date.now() >= this.nextAttemptTime)
    }
  }
}

// Pre-configured circuit breakers for business-critical operations
export const authCircuitBreaker = new CircuitBreaker('authentication', {
  failureThreshold: 5,
  timeoutWindow: 60000, // 1 minute
  recoveryTimeout: 30000, // 30 seconds
  monitorWindow: 120000 // 2 minutes
})

export const paymentCircuitBreaker = new CircuitBreaker('payment', {
  failureThreshold: 3, // More sensitive for payments
  timeoutWindow: 30000, // 30 seconds
  recoveryTimeout: 60000, // 1 minute
  monitorWindow: 300000 // 5 minutes
})

export const socialMediaCircuitBreaker = new CircuitBreaker('social-media', {
  failureThreshold: 10,
  timeoutWindow: 120000, // 2 minutes
  recoveryTimeout: 30000, // 30 seconds
  monitorWindow: 180000 // 3 minutes
})

export const aiContentCircuitBreaker = new CircuitBreaker('ai-content', {
  failureThreshold: 8,
  timeoutWindow: 90000, // 1.5 minutes
  recoveryTimeout: 45000, // 45 seconds
  monitorWindow: 240000 // 4 minutes
})