import { BaseService, ServiceOptions, PaginationOptions, ServiceResult } from './base.service'
import { User, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { CreateUserInput, UpdateUserInput } from '@/types/entities'

export class UserService extends BaseService {
  private readonly cachePrefix = 'users:'

  /**
   * Create a new User
   */
  async create(
    data: CreateUserInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<User>> {
    try {
      // Validate input
      const validated = data
      
      // Check for duplicates if needed
      
      
      // Create the entity
      const result = await this.prisma.users.create({
        data: {
          ...validated,
          
        }
      })
      
      // Invalidate relevant caches
      await this.invalidateCache([`${this.cachePrefix}list:*`])
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'UserService.create')
    }
  }

  /**
   * Update an existing User
   */
  async update(
    id: string,
    data: UpdateUserInput,
    options?: ServiceOptions
  ): Promise<ServiceResult<User>> {
    try {
      // Validate input
      const validated = data
      
      // Check ownership if needed
      
      
      // Update the entity
      const result = await this.prisma.users.update({
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
      return this.handleError(error, 'UserService.update')
    }
  }

  /**
   * Delete a User
   */
  async delete(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check ownership if needed
      
      
      // Soft delete if enabled
      
      await this.prisma.users.delete({
        where: { id }
      })
      
      // Invalidate caches
      await this.invalidateCache([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ])
      
      return { success: true, data: true }
    } catch (error) {
      return this.handleError(error, 'UserService.delete')
    }
  }

  /**
   * Get a single User by ID
   */
  async findById(
    id: string,
    options?: ServiceOptions
  ): Promise<ServiceResult<User | null>> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`
      
      const result = await this.withCache(
        cacheKey,
        () => this.prisma.users.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        })
      )
      
      return { success: true, data: result }
    } catch (error) {
      return this.handleError(error, 'UserService.findById')
    }
  }

  /**
   * List User with pagination and filters
   */
  async list(
    filters: Prisma.UserWhereInput = {},
    pagination?: PaginationOptions,
    options?: ServiceOptions
  ): Promise<ServiceResult<{ items: User[], total: number }>> {
    try {
      const where = {
        ...filters,
        
      }
      
      const [items, total] = await Promise.all([
        this.prisma.users.findMany({
          where,
          ...this.paginate(pagination || {}),
          include: this.getDefaultIncludes()
        }),
        this.prisma.users.count({ where })
      ])
      
      return { success: true, data: { items, total } }
    } catch (error) {
      return this.handleError(error, 'UserService.list')
    }
  }

  /**
   * Search User by text
   */
  async search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<{ items: User[], total: number }>> {
    const filters = {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { password: { contains: query, mode: 'insensitive' } },
        { subscriptionTier: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    return this.list(filters as any, pagination)
  }

  /**
   * Bulk create User
   */
  async bulkCreate(
    items: z.infer<typeof CreateUserSchema>[],
    options?: ServiceOptions
  ): Promise<ServiceResult<number>> {
    return this.transaction(async (tx) => {
      const result = await tx.users.createMany({
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
    
    const entity = await this.prisma.users.findUnique({
      where: { id },
      select: { userId: true }
    })
    
    if (!entity) throw new Error('User not found')
    if (entity.userId !== userId) throw new Error('Unauthorized')
  }

  /**
   * Check for duplicate values
   */
  private async checkDuplicates(data: any): Promise<void> {
    
  }
}

// Export singleton instance
export const userService = new UserService()