import { router, publicProcedure, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/db'
import type { User, UserWithRelations, CreateUserInput, UpdateUserInput } from '@/types/entities'
import { createServerClient } from '@supabase/ssr'

// ============= SCHEMAS =============
const UserFilterSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

const CreateUserSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  emailVerified: z.boolean().default(false),
  subscriptionTier: z.string().default('free'),
  accountCreatedDate: z.date().default(() => new Date()),
  lastLoginDate: z.date().default(() => new Date()),
})

const UpdateUserSchema = z.object({
  id: z.string().uuid('Valid user ID is required'),
  email: z.string().email('Valid email address is required').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  emailVerified: z.boolean().optional(),
  subscriptionTier: z.string().optional(),
  lastLoginDate: z.date().optional(),
})

// ============= ROUTER =============
export const userRouter = router({
  list: publicProcedure
    .input(UserFilterSchema)
    .query(async ({ input }) => {
      const { search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = input
      
      const skip = (page - 1) * limit
      
      const [items, total] = await Promise.all([
        prisma.users.findMany({
          where: search ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { subscriptionTier: { contains: search, mode: 'insensitive' } },
            ]
          } : {},
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.users.count({
          where: search ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { subscriptionTier: { contains: search, mode: 'insensitive' } },
            ]
          } : {},
        })
      ])
      
      return {
        items,
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await prisma.users.findUnique({
        where: { id: input.id }
      })
      
      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }
      
      return item
    }),

  create: publicProcedure
    .input(CreateUserSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
          where: { email: input.email }
        })
        
        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email already exists'
          })
        }

        // Hash password before storing (you should use bcrypt in production)
        const item = await prisma.users.create({
          data: {
            ...input,
            id: crypto.randomUUID(),
          }
        })
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = item
        return userWithoutPassword
      } catch (error) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user'
        })
      }
    }),

  update: protectedProcedure
    .input(UpdateUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input
      
      const item = await prisma.users.update({
        where: { id },
        data
      })
      
      return item
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.users.delete({
        where: { id: input.id }
      })
      
      return { success: true }
    }),
})

export type UserRouter = typeof userRouter