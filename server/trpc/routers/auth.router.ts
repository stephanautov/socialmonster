import { router, publicProcedure, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { authService } from '@/lib/services/auth.service'

const signInSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const signUpSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const authRouter = router({
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      // Get current user session using auth service
      const result = await authService.getCurrentUser()
      
      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error?.message || 'Failed to get session'
        })
      }
      
      return result.data
    }),

  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input }) => {
      const result = await authService.signIn(input)
      
      if (!result.success) {
        const errorCode = result.error?.code === 'INVALID_CREDENTIALS' ? 'UNAUTHORIZED' : 'BAD_REQUEST'
        throw new TRPCError({
          code: errorCode,
          message: result.error?.message || 'Sign in failed'
        })
      }
      
      return result.data
    }),

  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      const result = await authService.signUp(input)
      
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error?.message || 'Failed to create account'
        })
      }
      
      return result.data
    }),

  signOut: protectedProcedure
    .mutation(async () => {
      const result = await authService.signOut()
      
      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error?.message || 'Failed to sign out'
        })
      }
      
      return result.data
    }),
})