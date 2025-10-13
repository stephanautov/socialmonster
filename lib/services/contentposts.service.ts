import { BaseService, ServiceOptions, PaginationOptions, ServiceResult } from './base.service'
import { ContentPost, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { CreateContentPostInput, UpdateContentPostInput } from '@/types/entities'

export class ContentPostService extends BaseService {
  private readonly cachePrefix = 'contentposts:'

  /**
   * Create a new ContentPost
   */
  async create(
    data: CreateContentPostInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<ContentPost>> {
    try {
      // Validate input
      const validated = data
      
      // Check for duplicates if needed
      
      
      // Create the entity
      const result = await this.prisma.contentposts.create({
        data: {
          ...validated,
          
        }
      })
      
      // Invalidate relevant caches
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'ContentPostService.create')
    }
  }

  /**
   * Update an existing ContentPost
   */
  async update(
    id: string,
    data: UpdateContentPostInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<ContentPost>> {
    try {
      // Validate input
      const validated = data
      
      // Check ownership if needed
      
      
      // Update the entity
      const result = await this.prisma.contentposts.update({
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
      return this.handleError(error, 'ContentPostService.update')
    }
  }

  /**
   * Delete a ContentPost
   */
  async delete(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check ownership if needed
      
      
      // Soft delete if enabled
      
      await this.prisma.contentposts.delete({
        where: { id }
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: true }
    } catch (error) {
      return this.handleError(error, 'ContentPostService.delete')
    }
  }

  /**
   * Get a single ContentPost by ID
   */
  async findById(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<ContentPost | null>> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`
      
      const result = await this.withCache(
        cacheKey,
        () => this.prisma.contentposts.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        })
      )
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'ContentPostService.findById')
    }
  }

  /**
   * List ContentPost with pagination and filters
   */
  async list(
    filters: Prisma.ContentPostWhereInput = {},
    pagination?: PaginationOptions,
    options?: ServiceOptions
  ): Promise<ServiceResult<{ items: ContentPost[], total: number }>> {
    try {
      const where = {
        ...filters,
        
      }
      
      const [items, total] = await Promise.all([
        this.prisma.contentposts.findMany({
          where,
          ...this.paginate(pagination || {}),
          include: this.getDefaultIncludes()
        }),
        this.prisma.contentposts.count({ where })
      ])
      
      return { success: true, data: { items, total } }
    } catch (error) {
      return this.handleError(error, 'ContentPostService.list')
    }
  }

  /**
   * Search ContentPost by text
   */
  async search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<{ items: ContentPost[], total: number }>> {
    const filters = {
      OR: [
        { userId: { contains: query, mode: 'insensitive' } },
        { brandProjectId: { contains: query, mode: 'insensitive' } },
        { contentText: { contains: query, mode: 'insensitive' } },
        { contentTopic: { contains: query, mode: 'insensitive' } },
        { toneStyle: { contains: query, mode: 'insensitive' } },
        { generationPrompt: { contains: query, mode: 'insensitive' } },
        { status: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    return this.list(filters as any, pagination)
  }

  /**
   * Bulk create ContentPost
   */
  async bulkCreate(
    items: z.infer<typeof CreateContentPostSchema>[],
    options?: ServiceOptions
  ): Promise<ServiceResult<number>> {
    return this.transaction(async (tx) => {
      const result = await tx.contentposts.createMany({
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
    
    const entity = await this.prisma.contentposts.findUnique({
      where: { id },
      select: { userId: true }
    })
    
    if (!entity) throw new Error('ContentPost not found')
    if (entity.userId !== userId) throw new Error('Unauthorized')
  }

  /**
   * Check for duplicate values
   */
  private async checkDuplicates(data: any): Promise<void> {
    
  }
}

// Export singleton instance
export const contentPostService = new ContentPostService()