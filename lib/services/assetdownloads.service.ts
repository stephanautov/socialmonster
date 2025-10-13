import { BaseService, ServiceOptions, PaginationOptions, ServiceResult } from './base.service'
import { AssetDownload, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { CreateAssetDownloadInput, UpdateAssetDownloadInput } from '@/types/entities'

export class AssetDownloadService extends BaseService {
  private readonly cachePrefix = 'assetdownloads:'

  /**
   * Create a new AssetDownload
   */
  async create(
    data: CreateAssetDownloadInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<AssetDownload>> {
    try {
      // Validate input
      const validated = data
      
      // Check for duplicates if needed
      
      
      // Create the entity
      const result = await this.prisma.assetdownloads.create({
        data: {
          ...validated,
          
        }
      })
      
      // Invalidate relevant caches
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'AssetDownloadService.create')
    }
  }

  /**
   * Update an existing AssetDownload
   */
  async update(
    id: string,
    data: UpdateAssetDownloadInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<AssetDownload>> {
    try {
      // Validate input
      const validated = data
      
      // Check ownership if needed
      
      
      // Update the entity
      const result = await this.prisma.assetdownloads.update({
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
      return this.handleError(error, 'AssetDownloadService.update')
    }
  }

  /**
   * Delete a AssetDownload
   */
  async delete(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check ownership if needed
      
      
      // Soft delete if enabled
      
      await this.prisma.assetdownloads.delete({
        where: { id }
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: true }
    } catch (error) {
      return this.handleError(error, 'AssetDownloadService.delete')
    }
  }

  /**
   * Get a single AssetDownload by ID
   */
  async findById(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<AssetDownload | null>> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`
      
      const result = await this.withCache(
        cacheKey,
        () => this.prisma.assetdownloads.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        })
      )
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'AssetDownloadService.findById')
    }
  }

  /**
   * List AssetDownload with pagination and filters
   */
  async list(
    filters: Prisma.AssetDownloadWhereInput = {},
    pagination?: PaginationOptions,
    options?: ServiceOptions
  ): Promise<ServiceResult<{ items: AssetDownload[], total: number }>> {
    try {
      const where = {
        ...filters,
        
      }
      
      const [items, total] = await Promise.all([
        this.prisma.assetdownloads.findMany({
          where,
          ...this.paginate(pagination || {}),
          include: this.getDefaultIncludes()
        }),
        this.prisma.assetdownloads.count({ where })
      ])
      
      return { success: true, data: { items, total } }
    } catch (error) {
      return this.handleError(error, 'AssetDownloadService.list')
    }
  }

  /**
   * Search AssetDownload by text
   */
  async search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<{ items: AssetDownload[], total: number }>> {
    const filters = {
      OR: [
        { userId: { contains: query, mode: 'insensitive' } },
        { brandAssetId: { contains: query, mode: 'insensitive' } },
        { downloadFormat: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    return this.list(filters as any, pagination)
  }

  /**
   * Bulk create AssetDownload
   */
  async bulkCreate(
    items: z.infer<typeof CreateAssetDownloadSchema>[],
    options?: ServiceOptions
  ): Promise<ServiceResult<number>> {
    return this.transaction(async (tx) => {
      const result = await tx.assetdownloads.createMany({
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
    
    const entity = await this.prisma.assetdownloads.findUnique({
      where: { id },
      select: { userId: true }
    })
    
    if (!entity) throw new Error('AssetDownload not found')
    if (entity.userId !== userId) throw new Error('Unauthorized')
  }

  /**
   * Check for duplicate values
   */
  private async checkDuplicates(data: any): Promise<void> {
    
  }
}

// Export singleton instance
export const assetDownloadService = new AssetDownloadService()