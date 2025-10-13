import { BaseService, ServiceOptions, PaginationOptions, ServiceResult } from './base.service'
import { ContentOptimization, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { CreateContentOptimizationInput, UpdateContentOptimizationInput } from '@/types/entities'

export class ContentOptimizationService extends BaseService {
  private readonly cachePrefix = 'contentoptimizations:'

  /**
   * Create a new ContentOptimization
   */
  async create(
    data: CreateContentOptimizationInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<ContentOptimization>> {
    try {
      // Validate input
      const validated = data
      
      // Check for duplicates if needed
      
      
      // Create the entity
      const result = await this.prisma.contentoptimizations.create({
        data: {
          ...validated,
          
        }
      })
      
      // Invalidate relevant caches
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'ContentOptimizationService.create')
    }
  }

  /**
   * Update an existing ContentOptimization
   */
  async update(
    id: string,
    data: UpdateContentOptimizationInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<ContentOptimization>> {
    try {
      // Validate input
      const validated = data
      
      // Check ownership if needed
      
      
      // Update the entity
      const result = await this.prisma.contentoptimizations.update({
        where: { id },
        data: validated
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'ContentOptimizationService.update')
    }
  }

  /**
   * Delete a ContentOptimization
   */
  async delete(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check ownership if needed
      
      
      // Soft delete if enabled
      
      await this.prisma.contentoptimizations.delete({
        where: { id }
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: true }
    } catch (error) {
      return this.handleError(error, 'ContentOptimizationService.delete')
    }
  }

  /**
   * Get a single ContentOptimization by ID
   */
  async findById(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<ContentOptimization | null>> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`
      
      const result = await this.withCache(
        cacheKey,
        () => this.prisma.contentoptimizations.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        })
      )
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'ContentOptimizationService.findById')
    }
  }

  /**
   * List ContentOptimization with pagination and filters
   */
  async list(
    filters: Prisma.ContentOptimizationWhereInput = {},
    pagination?: PaginationOptions,
    options?: ServiceOptions
  ): Promise<ServiceResult<{ items: ContentOptimization[], total: number }>> {
    try {
      const where = {
        ...filters,
        
      }
      
      const [items, total] = await Promise.all([
        this.prisma.contentoptimizations.findMany({
          where,
          ...this.paginate(pagination || {}),
          include: this.getDefaultIncludes()
        }),
        this.prisma.contentoptimizations.count({ where })
      ])
      
      return { success: true, data: { items, total } }
    } catch (error) {
      return this.handleError(error, 'ContentOptimizationService.list')
    }
  }

  /**
   * Search ContentOptimization by text
   */
  async search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<{ items: ContentOptimization[], total: number }>> {
    const filters = {
      OR: [
        { userId: { contains: query, mode: 'insensitive' } },
        { originalContent: { contains: query, mode: 'insensitive' } },
        { optimizedContent: { contains: query, mode: 'insensitive' } },
        { optimizationType: { contains: query, mode: 'insensitive' } },
        { targetPlatform: { contains: query, mode: 'insensitive' } },
        { optimizationPrompt: { contains: query, mode: 'insensitive' } },
        { resultingContentPostId: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    return this.list(filters as any, pagination)
  }

  /**
   * Bulk create ContentOptimization
   */
  async bulkCreate(
    items: z.infer<typeof CreateContentOptimizationSchema>[],
    options?: ServiceOptions
  ): Promise<ServiceResult<number>> {
    return this.transaction(async (tx) => {
      const result = await tx.contentoptimizations.createMany({
        data: items.map(item => ({
          ...item,
          
        }))
      })
      
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      return result.count
    })
  }





  /**
   * Get default relations to include
   */
  private getDefaultIncludes() {
    return {
      
    }
  }

  /**
   * Check ownership of entity
   */
  private async checkOwnership(id: string, userId?: string): Promise<void> {
    if (!userId) throw new Error('User ID required for ownership check')
    
    const entity = await this.prisma.contentoptimizations.findUnique({
      where: { id },
      select: { userId: true }
    })
    
    if (!entity) throw new Error('ContentOptimization not found')
    if (entity.userId !== userId) throw new Error('Unauthorized')
  }

  /**
   * Check for duplicate values
   */
  private async checkDuplicates(data: any): Promise<void> {
    
  }
}

// Export singleton instance
export const contentOptimizationService = new ContentOptimizationService()