import { router, publicProcedure, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/db'
import type { AssetDownload, AssetDownloadWithRelations, CreateAssetDownloadInput, UpdateAssetDownloadInput } from '@/types/entities'
import { createServerClient } from '@supabase/ssr'

// ============= SCHEMAS =============
const AssetDownloadFilterSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

// ============= ROUTER =============
export const assetDownloadRouter = router({
  list: publicProcedure
    .input(AssetDownloadFilterSchema)
    .query(async ({ input }) => {
      const { search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = input
      
      const skip = (page - 1) * limit
      
      const [items, total] = await Promise.all([
        prisma.assetdownloads.findMany({
          where: search ? {
            OR: [
              // Add searchable fields here
            ]
          } : {},
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.assetdownloads.count({
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
      const item = await prisma.assetdownloads.findUnique({
        where: { id: input.id }
      })
      
      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'AssetDownload not found'
        })
      }
      
      return item
    }),

  create: publicProcedure
    .input(CreateAssetDownloadSchema)
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.assetdownloads.create({
        data: {
          ...input,
          
        }
      })
      
      return item
    }),

  update: protectedProcedure
    .input(UpdateAssetDownloadSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input
      
      const item = await prisma.assetdownloads.update({
        where: { id },
        data
      })
      
      return item
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.assetdownloads.delete({
        where: { id: input.id }
      })
      
      return { success: true }
    }),
})

export type AssetDownloadRouter = typeof assetDownloadRouter