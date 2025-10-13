/**
 * Form type definitions and validation schemas
 * Auto-generated from entity specifications
 */

import { z } from 'zod'

// ============= FORM SCHEMAS =============

export const UserFormSchema = z.object({
  email: z.string(),
  password: z.string(),
  emailVerified: z.boolean(),
  accountCreatedDate: z.date(),
  subscriptionTier: z.string(),
  lastLoginDate: z.date()
})

export type UserFormData = z.infer<typeof UserFormSchema>

export const SocialMediaConnectionFormSchema = z.object({
  userId: z.string(),
  platform: z.string(),
  platformAccountId: z.string(),
  platformUsername: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenExpiryDate: z.date(),
  connectedDate: z.date(),
  isActive: z.boolean(),
  lastSyncDate: z.date()
})

export type SocialMediaConnectionFormData = z.infer<typeof SocialMediaConnectionFormSchema>

export const BrandProjectFormSchema = z.object({
  userId: z.string(),
  projectName: z.string(),
  companyName: z.string(),
  companyDescription: z.string(),
  nameSignificance: z.string(),
  designPersonality: z.string(),
  targetAudience: z.string(),
  colorDirection: z.string(),
  typographyPreferences: z.string(),
  competitiveExamples: z.string(),
  desiredAssetTypes: z.string(),
  createdDate: z.date(),
  lastModifiedDate: z.date(),
  isActive: z.boolean()
})

export type BrandProjectFormData = z.infer<typeof BrandProjectFormSchema>

export const BrandAssetFormSchema = z.object({
  brandProjectId: z.string(),
  assetType: z.string(),
  assetName: z.string(),
  fileUrl: z.instanceof(File).or(z.string()),
  fileFormat: z.string(),
  generationPrompt: z.string(),
  generatedDate: z.date(),
  version: z.number(),
  isApproved: z.boolean(),
  parentAssetId: z.string()
})

export type BrandAssetFormData = z.infer<typeof BrandAssetFormSchema>

export const ContentPostFormSchema = z.object({
  userId: z.string(),
  brandProjectId: z.string().optional(),
  contentText: z.string(),
  contentTopic: z.string(),
  toneStyle: z.string(),
  generationPrompt: z.string(),
  mediaAttachments: z.instanceof(File).or(z.string()),
  createdDate: z.date(),
  lastEditedDate: z.date(),
  status: z.string(),
  wasAiGenerated: z.boolean()
})

export type ContentPostFormData = z.infer<typeof ContentPostFormSchema>

export const ScheduledPostFormSchema = z.object({
  contentPostId: z.string(),
  socialMediaConnectionId: z.string(),
  platform: z.string(),
  scheduledDateTime: z.date(),
  platformSpecificContent: z.string(),
  publishStatus: z.string(),
  publishedDateTime: z.date(),
  platformPostId: z.string(),
  errorMessage: z.string(),
  retryCount: z.number()
})

export type ScheduledPostFormData = z.infer<typeof ScheduledPostFormSchema>

export const ContentOptimizationFormSchema = z.object({
  userId: z.string(),
  originalContent: z.string(),
  optimizedContent: z.string(),
  optimizationType: z.string(),
  targetPlatform: z.string(),
  optimizationPrompt: z.string(),
  optimizedDate: z.date(),
  wasAccepted: z.boolean(),
  resultingContentPostId: z.string()
})

export type ContentOptimizationFormData = z.infer<typeof ContentOptimizationFormSchema>

export const ApiUsageFormSchema = z.object({
  userId: z.string(),
  apiProvider: z.string(),
  apiEndpoint: z.string(),
  requestType: z.string(),
  tokensUsed: z.number(),
  requestTimestamp: z.date(),
  responseStatus: z.string(),
  costAmount: z.number(),
  relatedEntityId: z.string()
})

export type ApiUsageFormData = z.infer<typeof ApiUsageFormSchema>

export const AssetDownloadFormSchema = z.object({
  userId: z.string(),
  brandAssetId: z.string(),
  downloadFormat: z.string(),
  downloadDate: z.date(),
  fileSize: z.number()
})

export type AssetDownloadFormData = z.infer<typeof AssetDownloadFormSchema>

// ============= FORM TYPES =============

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  validation?: z.ZodSchema
}

export interface FormSection {
  title: string
  description?: string
  fields: FormField[]
}

export interface FormConfig {
  sections: FormSection[]
  submitLabel?: string
  cancelLabel?: string
  resetOnSubmit?: boolean
}

export interface FormState<T = any> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}