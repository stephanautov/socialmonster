import { BaseService, ServiceOptions, PaginationOptions, ServiceResult } from './base.service'
import { BrandProject, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { CreateBrandProjectInput, UpdateBrandProjectInput } from '@/types/entities'

export class BrandProjectService extends BaseService {
  private readonly cachePrefix = 'brandprojects:'

  /**
   * Create a new BrandProject
   */
  async create(
    data: CreateBrandProjectInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<BrandProject>> {
    try {
      // Validate input
      const validated = data
      
      // Check for duplicates if needed
      
      
      // Create the entity
      const result = await this.prisma.brandprojects.create({
        data: {
          ...validated,
          
        }
      })
      
      // Invalidate relevant caches
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'BrandProjectService.create')
    }
  }

  /**
   * Update an existing BrandProject
   */
  async update(
    id: string,
    data: UpdateBrandProjectInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<BrandProject>> {
    try {
      // Validate input
      const validated = data
      
      // Check ownership if needed
      
      
      // Update the entity
      const result = await this.prisma.brandprojects.update({
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
      return this.handleError(error, 'BrandProjectService.update')
    }
  }

  /**
   * Delete a BrandProject
   */
  async delete(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check ownership if needed
      
      
      // Soft delete if enabled
      
      await this.prisma.brandprojects.delete({
        where: { id }
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: true }
    } catch (error) {
      return this.handleError(error, 'BrandProjectService.delete')
    }
  }

  /**
   * Get a single BrandProject by ID
   */
  async findById(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<BrandProject | null>> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`
      
      const result = await this.withCache(
        cacheKey,
        () => this.prisma.brandprojects.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        })
      )
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'BrandProjectService.findById')
    }
  }

  /**
   * List BrandProject with pagination and filters
   */
  async list(
    filters: Prisma.BrandProjectWhereInput = {},
    pagination?: PaginationOptions,
    options?: ServiceOptions
  ): Promise<ServiceResult<{ items: BrandProject[], total: number }>> {
    try {
      const where = {
        ...filters,
        
      }
      
      const [items, total] = await Promise.all([
        this.prisma.brandprojects.findMany({
          where,
          ...this.paginate(pagination || {}),
          include: this.getDefaultIncludes()
        }),
        this.prisma.brandprojects.count({ where })
      ])
      
      return { success: true, data: { items, total } }
    } catch (error) {
      return this.handleError(error, 'BrandProjectService.list')
    }
  }

  /**
   * Search BrandProject by text
   */
  async search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<{ items: BrandProject[], total: number }>> {
    const filters = {
      OR: [
        { userId: { contains: query, mode: 'insensitive' } },
        { projectName: { contains: query, mode: 'insensitive' } },
        { companyName: { contains: query, mode: 'insensitive' } },
        { companyDescription: { contains: query, mode: 'insensitive' } },
        { nameSignificance: { contains: query, mode: 'insensitive' } },
        { designPersonality: { contains: query, mode: 'insensitive' } },
        { targetAudience: { contains: query, mode: 'insensitive' } },
        { colorDirection: { contains: query, mode: 'insensitive' } },
        { typographyPreferences: { contains: query, mode: 'insensitive' } },
        { competitiveExamples: { contains: query, mode: 'insensitive' } },
        { desiredAssetTypes: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    return this.list(filters as any, pagination)
  }

  /**
   * Bulk create BrandProject
   */
  async bulkCreate(
    items: z.infer<typeof CreateBrandProjectSchema>[],
    options?: ServiceOptions
  ): Promise<ServiceResult<number>> {
    return this.transaction(async (tx) => {
      const result = await tx.brandprojects.createMany({
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
    
    const entity = await this.prisma.brandprojects.findUnique({
      where: { id },
      select: { userId: true }
    })
    
    if (!entity) throw new Error('BrandProject not found')
    if (entity.userId !== userId) throw new Error('Unauthorized')
  }

  /**
   * Check for duplicate values
   */
  private async checkDuplicates(data: any): Promise<void> {
    
  }
}

// Export singleton instance
export const brandProjectService = new BrandProjectService()