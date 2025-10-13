import { router, publicProcedure, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/db'
import type { ScheduledPost, ScheduledPostWithRelations, CreateScheduledPostInput, UpdateScheduledPostInput } from '@/types/entities'
import { createServerClient } from '@supabase/ssr'

// ============= SCHEMAS =============
const ScheduledPostFilterSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

// ============= ROUTER =============
export const scheduledPostRouter = router({
  list: publicProcedure
    .input(ScheduledPostFilterSchema)
    .query(async ({ input }) => {
      const { search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = input
      
      const skip = (page - 1) * limit
      
      const [items, total] = await Promise.all([
        prisma.scheduledposts.findMany({
          where: search ? {
            OR: [
              // Add searchable fields here
            ]
          } : {},
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.scheduledposts.count({
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
      const item = await prisma.scheduledposts.findUnique({
        where: { id: input.id }
      })
      
      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ScheduledPost not found'
        })
      }
      
      return item
    }),

  create: publicProcedure
    .input(CreateScheduledPostSchema)
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.scheduledposts.create({
        data: {
          ...input,
          
        }
      })
      
      return item
    }),

  update: protectedProcedure
    .input(UpdateScheduledPostSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input
      
      const item = await prisma.scheduledposts.update({
        where: { id },
        data
      })
      
      return item
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.scheduledposts.delete({
        where: { id: input.id }
      })
      
      return { success: true }
    }),
})

export type ScheduledPostRouter = typeof scheduledPostRouter