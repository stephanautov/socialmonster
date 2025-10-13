import { BaseService, ServiceOptions, PaginationOptions, ServiceResult } from './base.service'
import { ApiUsage, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { CreateApiUsageInput, UpdateApiUsageInput } from '@/types/entities'

export class ApiUsageService extends BaseService {
  private readonly cachePrefix = 'apiusages:'

  /**
   * Create a new ApiUsage
   */
  async create(
    data: CreateApiUsageInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<ApiUsage>> {
    try {
      // Validate input
      const validated = data
      
      // Check for duplicates if needed
      
      
      // Create the entity
      const result = await this.prisma.apiusages.create({
        data: {
          ...validated,
          
        }
      })
      
      // Invalidate relevant caches
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'ApiUsageService.create')
    }
  }

  /**
   * Update an existing ApiUsage
   */
  async update(
    id: string,
    data: UpdateApiUsageInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<ApiUsage>> {
    try {
      // Validate input
      const validated = data
      
      // Check ownership if needed
      
      
      // Update the entity
      const result = await this.prisma.apiusages.update({
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
      return this.handleError(error, 'ApiUsageService.update')
    }
  }

  /**
   * Delete a ApiUsage
   */
  async delete(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check ownership if needed
      
      
      // Soft delete if enabled
      
      await this.prisma.apiusages.delete({
        where: { id }
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: true }
    } catch (error) {
      return this.handleError(error, 'ApiUsageService.delete')
    }
  }

  /**
   * Get a single ApiUsage by ID
   */
  async findById(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<ApiUsage | null>> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`
      
      const result = await this.withCache(
        cacheKey,
        () => this.prisma.apiusages.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        })
      )
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'ApiUsageService.findById')
    }
  }

  /**
   * List ApiUsage with pagination and filters
   */
  async list(
    filters: Prisma.ApiUsageWhereInput = {},
    pagination?: PaginationOptions,
    options?: ServiceOptions
  ): Promise<ServiceResult<{ items: ApiUsage[], total: number }>> {
    try {
      const where = {
        ...filters,
        
      }
      
      const [items, total] = await Promise.all([
        this.prisma.apiusages.findMany({
          where,
          ...this.paginate(pagination || {}),
          include: this.getDefaultIncludes()
        }),
        this.prisma.apiusages.count({ where })
      ])
      
      return { success: true, data: { items, total } }
    } catch (error) {
      return this.handleError(error, 'ApiUsageService.list')
    }
  }

  /**
   * Search ApiUsage by text
   */
  async search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<{ items: ApiUsage[], total: number }>> {
    const filters = {
      OR: [
        { userId: { contains: query, mode: 'insensitive' } },
        { apiProvider: { contains: query, mode: 'insensitive' } },
        { apiEndpoint: { contains: query, mode: 'insensitive' } },
        { requestType: { contains: query, mode: 'insensitive' } },
        { responseStatus: { contains: query, mode: 'insensitive' } },
        { relatedEntityId: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    return this.list(filters as any, pagination)
  }

  /**
   * Bulk create ApiUsage
   */
  async bulkCreate(
    items: z.infer<typeof CreateApiUsageSchema>[],
    options?: ServiceOptions
  ): Promise<ServiceResult<number>> {
    return this.transaction(async (tx) => {
      const result = await tx.apiusages.createMany({
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
    
    const entity = await this.prisma.apiusages.findUnique({
      where: { id },
      select: { userId: true }
    })
    
    if (!entity) throw new Error('ApiUsage not found')
    if (entity.userId !== userId) throw new Error('Unauthorized')
  }

  /**
   * Check for duplicate values
   */
  private async checkDuplicates(data: any): Promise<void> {
    
  }
}

// Export singleton instance
export const apiUsageService = new ApiUsageService()