import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { cache } from '@/lib/cache'
import { logger } from '@/lib/logger'

export interface ServiceOptions {
  includeDeleted?: boolean
  userId?: string
  organizationId?: string
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ServiceResult<T> {
  data?: T
  error?: Error
  success: boolean
}

export abstract class BaseService {
  protected prisma = prisma
  protected cache = cache
  protected logger = logger

  /**
   * Execute a database transaction
   */
  protected async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<ServiceResult<T>> {
    try {
      const data = await this.prisma.$transaction(fn)
      return { success: true, data }
    } catch (error) {
      this.logger.error('Transaction failed', error)
      return { success: false, error: error as Error }
    }
  }

  /**
   * Cache a query result
   */
  protected async withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl = 300 // 5 minutes default
  ): Promise<T> {
    const cached = await this.cache.get<T>(key)
    if (cached) return cached

    const result = await fn()
    await this.cache.set(key, result, ttl)
    return result
  }

  /**
   * Invalidate cache entries
   */
  protected async invalidateCache(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      await this.cache.delete(pattern)
    }
  }

  /**
   * Apply pagination to a query
   */
  protected paginate(options: PaginationOptions) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options
    
    return {
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }
  }

  /**
   * Handle service errors consistently
   */
  protected handleError(error: unknown, context: string): ServiceResult<null> {
    const err = error instanceof Error ? error : new Error('Unknown error')
    this.logger.error(`Service error in ${context}`, err)
    return { success: false, error: err }
  }
}