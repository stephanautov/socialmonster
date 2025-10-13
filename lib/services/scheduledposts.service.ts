import { BaseService, ServiceOptions, PaginationOptions, ServiceResult } from './base.service'
import { ScheduledPost, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { CreateScheduledPostInput, UpdateScheduledPostInput } from '@/types/entities'

export class ScheduledPostService extends BaseService {
  private readonly cachePrefix = 'scheduledposts:'

  /**
   * Create a new ScheduledPost
   */
  async create(
    data: CreateScheduledPostInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<ScheduledPost>> {
    try {
      // Validate input
      const validated = data
      
      // Check for duplicates if needed
      
      
      // Create the entity
      const result = await this.prisma.scheduledposts.create({
        data: {
          ...validated,
          
        }
      })
      
      // Invalidate relevant caches
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'ScheduledPostService.create')
    }
  }

  /**
   * Update an existing ScheduledPost
   */
  async update(
    id: string,
    data: UpdateScheduledPostInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<ScheduledPost>> {
    try {
      // Validate input
      const validated = data
      
      // Check ownership if needed
      
      
      // Update the entity
      const result = await this.prisma.scheduledposts.update({
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
      return this.handleError(error, 'ScheduledPostService.update')
    }
  }

  /**
   * Delete a ScheduledPost
   */
  async delete(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check ownership if needed
      
      
      // Soft delete if enabled
      
      await this.prisma.scheduledposts.delete({
        where: { id }
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: true }
    } catch (error) {
      return this.handleError(error, 'ScheduledPostService.delete')
    }
  }

  /**
   * Get a single ScheduledPost by ID
   */
  async findById(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<ScheduledPost | null>> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`
      
      const result = await this.withCache(
        cacheKey,
        () => this.prisma.scheduledposts.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        })
      )
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'ScheduledPostService.findById')
    }
  }

  /**
   * List ScheduledPost with pagination and filters
   */
  async list(
    filters: Prisma.ScheduledPostWhereInput = {},
    pagination?: PaginationOptions,
    options?: ServiceOptions
  ): Promise<ServiceResult<{ items: ScheduledPost[], total: number }>> {
    try {
      const where = {
        ...filters,
        
      }
      
      const [items, total] = await Promise.all([
        this.prisma.scheduledposts.findMany({
          where,
          ...this.paginate(pagination || {}),
          include: this.getDefaultIncludes()
        }),
        this.prisma.scheduledposts.count({ where })
      ])
      
      return { success: true, data: { items, total } }
    } catch (error) {
      return this.handleError(error, 'ScheduledPostService.list')
    }
  }

  /**
   * Search ScheduledPost by text
   */
  async search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<{ items: ScheduledPost[], total: number }>> {
    const filters = {
      OR: [
        { contentPostId: { contains: query, mode: 'insensitive' } },
        { socialMediaConnectionId: { contains: query, mode: 'insensitive' } },
        { platform: { contains: query, mode: 'insensitive' } },
        { platformSpecificContent: { contains: query, mode: 'insensitive' } },
        { publishStatus: { contains: query, mode: 'insensitive' } },
        { platformPostId: { contains: query, mode: 'insensitive' } },
        { errorMessage: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    return this.list(filters as any, pagination)
  }

  /**
   * Bulk create ScheduledPost
   */
  async bulkCreate(
    items: z.infer<typeof CreateScheduledPostSchema>[],
    options?: ServiceOptions
  ): Promise<ServiceResult<number>> {
    return this.transaction(async (tx) => {
      const result = await tx.scheduledposts.createMany({
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
    
    const entity = await this.prisma.scheduledposts.findUnique({
      where: { id },
      select: { userId: true }
    })
    
    if (!entity) throw new Error('ScheduledPost not found')
    if (entity.userId !== userId) throw new Error('Unauthorized')
  }

  /**
   * Check for duplicate values
   */
  private async checkDuplicates(data: any): Promise<void> {
    
  }
}

// Export singleton instance
export const scheduledPostService = new ScheduledPostService()