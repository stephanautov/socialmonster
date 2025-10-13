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
              // Add searchable fields here
            ]
          } : {},
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.users.count({
          where: search ? {
            OR: [
              // Add searchable fields here
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
      const item = await prisma.users.create({
        data: {
          ...input,
          
        }
      })
      
      return item
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