/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid URL').optional(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  
  // API Keys
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required').optional(),
  
  // Storage
  STORAGE_URL: z.string().url('STORAGE_URL must be a valid URL').optional(),
  STORAGE_KEY: z.string().min(1, 'STORAGE_KEY is required').optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

// Parse and validate environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n')
      throw new Error(`❌ Environment validation failed:\n${missing}`)
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Utility functions
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test'
}

// Database connection check
export function hasDatabase(): boolean {
  return !!env.DATABASE_URL
}

// Feature flags based on environment
export const features = {
  enableAnalytics: isProduction(),
  enableDebugMode: isDevelopment(),
  enableExperimentalFeatures: isDevelopment(),
} as const