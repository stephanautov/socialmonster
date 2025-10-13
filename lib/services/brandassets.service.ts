import { BaseService, ServiceOptions, PaginationOptions, ServiceResult } from './base.service'
import { BrandAsset, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { CreateBrandAssetInput, UpdateBrandAssetInput } from '@/types/entities'

export class BrandAssetService extends BaseService {
  private readonly cachePrefix = 'brandassets:'

  /**
   * Create a new BrandAsset
   */
  async create(
    data: CreateBrandAssetInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<BrandAsset>> {
    try {
      // Validate input
      const validated = data
      
      // Check for duplicates if needed
      
      
      // Create the entity
      const result = await this.prisma.brandassets.create({
        data: {
          ...validated,
          
        }
      })
      
      // Invalidate relevant caches
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'BrandAssetService.create')
    }
  }

  /**
   * Update an existing BrandAsset
   */
  async update(
    id: string,
    data: UpdateBrandAssetInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<BrandAsset>> {
    try {
      // Validate input
      const validated = data
      
      // Check ownership if needed
      
      
      // Update the entity
      const result = await this.prisma.brandassets.update({
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
      return this.handleError(error, 'BrandAssetService.update')
    }
  }

  /**
   * Delete a BrandAsset
   */
  async delete(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check ownership if needed
      
      
      // Soft delete if enabled
      
      await this.prisma.brandassets.delete({
        where: { id }
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: true }
    } catch (error) {
      return this.handleError(error, 'BrandAssetService.delete')
    }
  }

  /**
   * Get a single BrandAsset by ID
   */
  async findById(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<BrandAsset | null>> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`
      
      const result = await this.withCache(
        cacheKey,
        () => this.prisma.brandassets.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        })
      )
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'BrandAssetService.findById')
    }
  }

  /**
   * List BrandAsset with pagination and filters
   */
  async list(
    filters: Prisma.BrandAssetWhereInput = {},
    pagination?: PaginationOptions,
    options?: ServiceOptions
  ): Promise<ServiceResult<{ items: BrandAsset[], total: number }>> {
    try {
      const where = {
        ...filters,
        
      }
      
      const [items, total] = await Promise.all([
        this.prisma.brandassets.findMany({
          where,
          ...this.paginate(pagination || {}),
          include: this.getDefaultIncludes()
        }),
        this.prisma.brandassets.count({ where })
      ])
      
      return { success: true, data: { items, total } }
    } catch (error) {
      return this.handleError(error, 'BrandAssetService.list')
    }
  }

  /**
   * Search BrandAsset by text
   */
  async search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<{ items: BrandAsset[], total: number }>> {
    const filters = {
      OR: [
        { brandProjectId: { contains: query, mode: 'insensitive' } },
        { assetType: { contains: query, mode: 'insensitive' } },
        { assetName: { contains: query, mode: 'insensitive' } },
        { fileFormat: { contains: query, mode: 'insensitive' } },
        { generationPrompt: { contains: query, mode: 'insensitive' } },
        { parentAssetId: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    return this.list(filters as any, pagination)
  }

  /**
   * Bulk create BrandAsset
   */
  async bulkCreate(
    items: z.infer<typeof CreateBrandAssetSchema>[],
    options?: ServiceOptions
  ): Promise<ServiceResult<number>> {
    return this.transaction(async (tx) => {
      const result = await tx.brandassets.createMany({
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
    
    const entity = await this.prisma.brandassets.findUnique({
      where: { id },
      select: { userId: true }
    })
    
    if (!entity) throw new Error('BrandAsset not found')
    if (entity.userId !== userId) throw new Error('Unauthorized')
  }

  /**
   * Check for duplicate values
   */
  private async checkDuplicates(data: any): Promise<void> {
    
  }
}

// Export singleton instance
export const brandAssetService = new BrandAssetService()