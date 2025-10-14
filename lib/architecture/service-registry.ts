/**
 * Service Registry Pattern
 * Decouples services and provides centralized service management
 */

import { logger } from '@/lib/logger'

export interface ServiceDefinition<T = any> {
  name: string
  implementation: T
  dependencies?: string[]
  lifecycle: 'singleton' | 'transient' | 'scoped'
  initialized: boolean
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: Date
  dependencies: string[]
  dependenciesHealth: { [key: string]: 'healthy' | 'unhealthy' }
}

/**
 * Service Registry for managing application services
 */
export class ServiceRegistry {
  private services = new Map<string, ServiceDefinition>()
  private instances = new Map<string, any>()
  private initializationOrder: string[] = []

  /**
   * Register a service in the registry
   */
  register<T>(
    name: string,
    implementation: T,
    options: {
      dependencies?: string[]
      lifecycle?: 'singleton' | 'transient' | 'scoped'
    } = {}
  ): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`)
    }

    const service: ServiceDefinition<T> = {
      name,
      implementation,
      dependencies: options.dependencies || [],
      lifecycle: options.lifecycle || 'singleton',
      initialized: false
    }

    this.services.set(name, service)
    this.calculateInitializationOrder()

    logger.info('Service registered', {
      name,
      dependencies: service.dependencies,
      lifecycle: service.lifecycle
    })
  }

  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    const service = this.services.get(name)
    if (!service) {
      throw new Error(`Service ${name} not found`)
    }

    // Handle different lifecycle types
    switch (service.lifecycle) {
      case 'singleton':
        return this.getSingleton<T>(name, service)
      case 'transient':
        return this.createInstance<T>(service)
      case 'scoped':
        return this.getScoped<T>(name, service)
      default:
        throw new Error(`Unknown lifecycle: ${service.lifecycle}`)
    }
  }

  /**
   * Initialize all services in dependency order
   */
  async initializeAll(): Promise<void> {
    logger.info('Initializing services in dependency order', {
      order: this.initializationOrder
    })

    for (const serviceName of this.initializationOrder) {
      const service = this.services.get(serviceName)
      if (!service || service.initialized) continue

      try {
        await this.initializeService(service)
        service.initialized = true
        logger.info('Service initialized successfully', { name: serviceName })
      } catch (error) {
        logger.error('Service initialization failed', {
          name: serviceName,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    }
  }

  /**
   * Get health status of all services
   */
  async getHealthStatus(): Promise<ServiceHealth[]> {
    const healthStatuses: ServiceHealth[] = []

    for (const [name, service] of this.services) {
      const dependenciesHealth: { [key: string]: 'healthy' | 'unhealthy' } = {}

      // Check dependency health
      for (const depName of service.dependencies || []) {
        dependenciesHealth[depName] = await this.checkServiceHealth(depName)
      }

      const serviceHealth = await this.checkServiceHealth(name)
      
      healthStatuses.push({
        name,
        status: serviceHealth,
        lastCheck: new Date(),
        dependencies: service.dependencies || [],
        dependenciesHealth
      })
    }

    return healthStatuses
  }

  /**
   * Gracefully shutdown all services
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down services')

    // Shutdown in reverse initialization order
    const shutdownOrder = [...this.initializationOrder].reverse()

    for (const serviceName of shutdownOrder) {
      try {
        const instance = this.instances.get(serviceName)
        if (instance && typeof instance.shutdown === 'function') {
          await instance.shutdown()
        }
        this.instances.delete(serviceName)
        
        const service = this.services.get(serviceName)
        if (service) {
          service.initialized = false
        }

        logger.info('Service shutdown completed', { name: serviceName })
      } catch (error) {
        logger.error('Service shutdown error', {
          name: serviceName,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  private getSingleton<T>(name: string, service: ServiceDefinition): T {
    if (!this.instances.has(name)) {
      const instance = this.createInstance<T>(service)
      this.instances.set(name, instance)
    }
    return this.instances.get(name)
  }

  private getScoped<T>(name: string, service: ServiceDefinition): T {
    // For now, treat scoped the same as singleton
    // In a real implementation, this would be per-request or per-context
    return this.getSingleton<T>(name, service)
  }

  private createInstance<T>(service: ServiceDefinition): T {
    // Inject dependencies
    const dependencies: any = {}
    for (const depName of service.dependencies || []) {
      dependencies[depName] = this.get(depName)
    }

    // Create instance with dependencies
    if (typeof service.implementation === 'function') {
      return new (service.implementation as any)(dependencies)
    }

    return service.implementation
  }

  private async initializeService(service: ServiceDefinition): Promise<void> {
    const instance = this.createInstance(service)
    
    if (typeof instance.initialize === 'function') {
      await instance.initialize()
    }

    if (service.lifecycle === 'singleton') {
      this.instances.set(service.name, instance)
    }
  }

  private async checkServiceHealth(serviceName: string): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const instance = this.instances.get(serviceName)
      
      if (!instance) {
        return 'unhealthy'
      }

      if (typeof instance.healthCheck === 'function') {
        const isHealthy = await instance.healthCheck()
        return isHealthy ? 'healthy' : 'degraded'
      }

      return 'healthy'
    } catch (error) {
      return 'unhealthy'
    }
  }

  private calculateInitializationOrder(): void {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (serviceName: string) => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected involving ${serviceName}`)
      }

      if (visited.has(serviceName)) {
        return
      }

      visiting.add(serviceName)

      const service = this.services.get(serviceName)
      if (service) {
        for (const dep of service.dependencies || []) {
          if (!this.services.has(dep)) {
            throw new Error(`Dependency ${dep} not found for service ${serviceName}`)
          }
          visit(dep)
        }
      }

      visiting.delete(serviceName)
      visited.add(serviceName)
      order.push(serviceName)
    }

    for (const serviceName of this.services.keys()) {
      visit(serviceName)
    }

    this.initializationOrder = order
  }
}

// Global service registry instance
export const serviceRegistry = new ServiceRegistry()

// Register core services with their dependencies
serviceRegistry.register('logger', logger, {
  lifecycle: 'singleton'
})

// Export convenience functions
export function registerService<T>(
  name: string,
  implementation: T,
  options?: {
    dependencies?: string[]
    lifecycle?: 'singleton' | 'transient' | 'scoped'
  }
) {
  serviceRegistry.register(name, implementation, options)
}

export function getService<T>(name: string): T {
  return serviceRegistry.get<T>(name)
}

export async function initializeServices() {
  await serviceRegistry.initializeAll()
}

export async function shutdownServices() {
  await serviceRegistry.shutdown()
}