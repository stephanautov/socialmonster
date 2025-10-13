import { BaseService, ServiceOptions, PaginationOptions, ServiceResult } from './base.service'
import { SocialMediaConnection, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { CreateSocialMediaConnectionInput, UpdateSocialMediaConnectionInput } from '@/types/entities'

export class SocialMediaConnectionService extends BaseService {
  private readonly cachePrefix = 'socialmediaconnections:'

  /**
   * Create a new SocialMediaConnection
   */
  async create(
    data: CreateSocialMediaConnectionInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<SocialMediaConnection>> {
    try {
      // Validate input
      const validated = data
      
      // Check for duplicates if needed
      
      
      // Create the entity
      const result = await this.prisma.socialmediaconnections.create({
        data: {
          ...validated,
          
        }
      })
      
      // Invalidate relevant caches
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'SocialMediaConnectionService.create')
    }
  }

  /**
   * Update an existing SocialMediaConnection
   */
  async update(
    id: string,
    data: UpdateSocialMediaConnectionInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<SocialMediaConnection>> {
    try {
      // Validate input
      const validated = data
      
      // Check ownership if needed
      
      
      // Update the entity
      const result = await this.prisma.socialmediaconnections.update({
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
      return this.handleError(error, 'SocialMediaConnectionService.update')
    }
  }

  /**
   * Delete a SocialMediaConnection
   */
  async delete(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check ownership if needed
      
      
      // Soft delete if enabled
      
      await this.prisma.socialmediaconnections.delete({
        where: { id }
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: true }
    } catch (error) {
      return this.handleError(error, 'SocialMediaConnectionService.delete')
    }
  }

  /**
   * Get a single SocialMediaConnection by ID
   */
  async findById(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<SocialMediaConnection | null>> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`
      
      const result = await this.withCache(
        cacheKey,
        () => this.prisma.socialmediaconnections.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        })
      )
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'SocialMediaConnectionService.findById')
    }
  }

  /**
   * List SocialMediaConnection with pagination and filters
   */
  async list(
    filters: Prisma.SocialMediaConnectionWhereInput = {},
    pagination?: PaginationOptions,
    options?: ServiceOptions
  ): Promise<ServiceResult<{ items: SocialMediaConnection[], total: number }>> {
    try {
      const where = {
        ...filters,
        
      }
      
      const [items, total] = await Promise.all([
        this.prisma.socialmediaconnections.findMany({
          where,
          ...this.paginate(pagination || {}),
          include: this.getDefaultIncludes()
        }),
        this.prisma.socialmediaconnections.count({ where })
      ])
      
      return { success: true, data: { items, total } }
    } catch (error) {
      return this.handleError(error, 'SocialMediaConnectionService.list')
    }
  }

  /**
   * Search SocialMediaConnection by text
   */
  async search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<{ items: SocialMediaConnection[], total: number }>> {
    const filters = {
      OR: [
        { userId: { contains: query, mode: 'insensitive' } },
        { platform: { contains: query, mode: 'insensitive' } },
        { platformAccountId: { contains: query, mode: 'insensitive' } },
        { platformUsername: { contains: query, mode: 'insensitive' } },
        { accessToken: { contains: query, mode: 'insensitive' } },
        { refreshToken: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    return this.list(filters as any, pagination)
  }

  /**
   * Bulk create SocialMediaConnection
   */
  async bulkCreate(
    items: z.infer<typeof CreateSocialMediaConnectionSchema>[],
    options?: ServiceOptions
  ): Promise<ServiceResult<number>> {
    return this.transaction(async (tx) => {
      const result = await tx.socialmediaconnections.createMany({
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
    
    const entity = await this.prisma.socialmediaconnections.findUnique({
      where: { id },
      select: { userId: true }
    })
    
    if (!entity) throw new Error('SocialMediaConnection not found')
    if (entity.userId !== userId) throw new Error('Unauthorized')
  }

  /**
   * Check for duplicate values
   */
  private async checkDuplicates(data: any): Promise<void> {
    
  }
}

// Export singleton instance
export const socialMediaConnectionService = new SocialMediaConnectionService()