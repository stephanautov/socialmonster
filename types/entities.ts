/**
 * Entity type definitions
 * Auto-generated from database schema
 */

import { BaseEntity } from './index'
import * as Enums from './enums'

// ============= ENTITY INTERFACES =============

export interface User extends BaseEntity {
  id: string
  email: string
  password: string
  emailVerified: boolean
  accountCreatedDate: Date
  subscriptionTier: string
  lastLoginDate: Date
}

export interface UserWithRelations extends User {

}

export interface CreateUserInput {
  email: string
  password: string
  emailVerified: boolean
  accountCreatedDate: Date
  subscriptionTier: string
  lastLoginDate: Date
}

export interface UpdateUserInput extends Partial<CreateUserInput> {
  id: string
}

export interface SocialMediaConnection extends BaseEntity {
  id: string
  userId: string
  platform: string
  platformAccountId: string
  platformUsername: string
  accessToken: string
  refreshToken: string
  tokenExpiryDate: Date
  connectedDate: Date
  isActive: boolean
  lastSyncDate: Date
}

export interface SocialMediaConnectionWithRelations extends SocialMediaConnection {

}

export interface CreateSocialMediaConnectionInput {
  userId: string
  platform: string
  platformAccountId: string
  platformUsername: string
  accessToken: string
  refreshToken: string
  tokenExpiryDate: Date
  connectedDate: Date
  isActive: boolean
  lastSyncDate: Date
}

export interface UpdateSocialMediaConnectionInput extends Partial<CreateSocialMediaConnectionInput> {
  id: string
}

export interface BrandProject extends BaseEntity {
  id: string
  userId: string
  projectName: string
  companyName: string
  companyDescription: string
  nameSignificance: string
  designPersonality: string
  targetAudience: string
  colorDirection: string
  typographyPreferences: string
  competitiveExamples: string
  desiredAssetTypes: string
  createdDate: Date
  lastModifiedDate: Date
  isActive: boolean
}

export interface BrandProjectWithRelations extends BrandProject {

}

export interface CreateBrandProjectInput {
  userId: string
  projectName: string
  companyName: string
  companyDescription: string
  nameSignificance: string
  designPersonality: string
  targetAudience: string
  colorDirection: string
  typographyPreferences: string
  competitiveExamples: string
  desiredAssetTypes: string
  createdDate: Date
  lastModifiedDate: Date
  isActive: boolean
}

export interface UpdateBrandProjectInput extends Partial<CreateBrandProjectInput> {
  id: string
}

export interface BrandAsset extends BaseEntity {
  id: string
  brandProjectId: string
  assetType: string
  assetName: string
  fileUrl: File | string
  fileFormat: string
  generationPrompt: string
  generatedDate: Date
  version: number
  isApproved: boolean
  parentAssetId: string
}

export interface BrandAssetWithRelations extends BrandAsset {

}

export interface CreateBrandAssetInput {
  brandProjectId: string
  assetType: string
  assetName: string
  fileUrl: File | string
  fileFormat: string
  generationPrompt: string
  generatedDate: Date
  version: number
  isApproved: boolean
  parentAssetId: string
}

export interface UpdateBrandAssetInput extends Partial<CreateBrandAssetInput> {
  id: string
}

export interface ContentPost extends BaseEntity {
  id: string
  userId: string
  brandProjectId?: string | null
  contentText: string
  contentTopic: string
  toneStyle: string
  generationPrompt: string
  mediaAttachments: File | string
  createdDate: Date
  lastEditedDate: Date
  status: string
  wasAiGenerated: boolean
}

export interface ContentPostWithRelations extends ContentPost {

}

export interface CreateContentPostInput {
  userId: string
  brandProjectId?: string | null
  contentText: string
  contentTopic: string
  toneStyle: string
  generationPrompt: string
  mediaAttachments: File | string
  createdDate: Date
  lastEditedDate: Date
  status: string
  wasAiGenerated: boolean
}

export interface UpdateContentPostInput extends Partial<CreateContentPostInput> {
  id: string
}

export interface ScheduledPost extends BaseEntity {
  id: string
  contentPostId: string
  socialMediaConnectionId: string
  platform: string
  scheduledDateTime: Date
  platformSpecificContent: string
  publishStatus: string
  publishedDateTime: Date
  platformPostId: string
  errorMessage: string
  retryCount: number
}

export interface ScheduledPostWithRelations extends ScheduledPost {

}

export interface CreateScheduledPostInput {
  contentPostId: string
  socialMediaConnectionId: string
  platform: string
  scheduledDateTime: Date
  platformSpecificContent: string
  publishStatus: string
  publishedDateTime: Date
  platformPostId: string
  errorMessage: string
  retryCount: number
}

export interface UpdateScheduledPostInput extends Partial<CreateScheduledPostInput> {
  id: string
}

export interface ContentOptimization extends BaseEntity {
  id: string
  userId: string
  originalContent: string
  optimizedContent: string
  optimizationType: string
  targetPlatform: string
  optimizationPrompt: string
  optimizedDate: Date
  wasAccepted: boolean
  resultingContentPostId: string
}

export interface ContentOptimizationWithRelations extends ContentOptimization {

}

export interface CreateContentOptimizationInput {
  userId: string
  originalContent: string
  optimizedContent: string
  optimizationType: string
  targetPlatform: string
  optimizationPrompt: string
  optimizedDate: Date
  wasAccepted: boolean
  resultingContentPostId: string
}

export interface UpdateContentOptimizationInput extends Partial<CreateContentOptimizationInput> {
  id: string
}

export interface ApiUsage extends BaseEntity {
  id: string
  userId: string
  apiProvider: string
  apiEndpoint: string
  requestType: string
  tokensUsed: number
  requestTimestamp: Date
  responseStatus: string
  costAmount: number
  relatedEntityId: string
}

export interface ApiUsageWithRelations extends ApiUsage {

}

export interface CreateApiUsageInput {
  userId: string
  apiProvider: string
  apiEndpoint: string
  requestType: string
  tokensUsed: number
  requestTimestamp: Date
  responseStatus: string
  costAmount: number
  relatedEntityId: string
}

export interface UpdateApiUsageInput extends Partial<CreateApiUsageInput> {
  id: string
}

export interface AssetDownload extends BaseEntity {
  id: string
  userId: string
  brandAssetId: string
  downloadFormat: string
  downloadDate: Date
  fileSize: number
}

export interface AssetDownloadWithRelations extends AssetDownload {

}

export interface CreateAssetDownloadInput {
  userId: string
  brandAssetId: string
  downloadFormat: string
  downloadDate: Date
  fileSize: number
}

export interface UpdateAssetDownloadInput extends Partial<CreateAssetDownloadInput> {
  id: string
}

// ============= RELATION TYPES =============



// ============= FILTER TYPES =============

export interface UserFilter {
  id?: any
  email?: string | { contains?: string; startsWith?: string; endsWith?: string }
  password?: string | { contains?: string; startsWith?: string; endsWith?: string }
  emailVerified?: boolean
  accountCreatedDate?: Date | DateFilter
  subscriptionTier?: string | { contains?: string; startsWith?: string; endsWith?: string }
  lastLoginDate?: Date | DateFilter
  AND?: UserFilter[]
  OR?: UserFilter[]
  NOT?: UserFilter
}

export interface SocialMediaConnectionFilter {
  id?: any
  userId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  platform?: string | { contains?: string; startsWith?: string; endsWith?: string }
  platformAccountId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  platformUsername?: string | { contains?: string; startsWith?: string; endsWith?: string }
  accessToken?: string | { contains?: string; startsWith?: string; endsWith?: string }
  refreshToken?: string | { contains?: string; startsWith?: string; endsWith?: string }
  tokenExpiryDate?: Date | DateFilter
  connectedDate?: Date | DateFilter
  isActive?: boolean
  lastSyncDate?: Date | DateFilter
  AND?: SocialMediaConnectionFilter[]
  OR?: SocialMediaConnectionFilter[]
  NOT?: SocialMediaConnectionFilter
}

export interface BrandProjectFilter {
  id?: any
  userId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  projectName?: string | { contains?: string; startsWith?: string; endsWith?: string }
  companyName?: string | { contains?: string; startsWith?: string; endsWith?: string }
  companyDescription?: string | { contains?: string; startsWith?: string; endsWith?: string }
  nameSignificance?: string | { contains?: string; startsWith?: string; endsWith?: string }
  designPersonality?: string | { contains?: string; startsWith?: string; endsWith?: string }
  targetAudience?: string | { contains?: string; startsWith?: string; endsWith?: string }
  colorDirection?: string | { contains?: string; startsWith?: string; endsWith?: string }
  typographyPreferences?: string | { contains?: string; startsWith?: string; endsWith?: string }
  competitiveExamples?: string | { contains?: string; startsWith?: string; endsWith?: string }
  desiredAssetTypes?: string | { contains?: string; startsWith?: string; endsWith?: string }
  createdDate?: Date | DateFilter
  lastModifiedDate?: Date | DateFilter
  isActive?: boolean
  AND?: BrandProjectFilter[]
  OR?: BrandProjectFilter[]
  NOT?: BrandProjectFilter
}

export interface BrandAssetFilter {
  id?: any
  brandProjectId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  assetType?: string | { contains?: string; startsWith?: string; endsWith?: string }
  assetName?: string | { contains?: string; startsWith?: string; endsWith?: string }
  fileUrl?: any
  fileFormat?: string | { contains?: string; startsWith?: string; endsWith?: string }
  generationPrompt?: string | { contains?: string; startsWith?: string; endsWith?: string }
  generatedDate?: Date | DateFilter
  version?: number | { gt?: number; gte?: number; lt?: number; lte?: number }
  isApproved?: boolean
  parentAssetId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  AND?: BrandAssetFilter[]
  OR?: BrandAssetFilter[]
  NOT?: BrandAssetFilter
}

export interface ContentPostFilter {
  id?: any
  userId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  brandProjectId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  contentText?: string | { contains?: string; startsWith?: string; endsWith?: string }
  contentTopic?: string | { contains?: string; startsWith?: string; endsWith?: string }
  toneStyle?: string | { contains?: string; startsWith?: string; endsWith?: string }
  generationPrompt?: string | { contains?: string; startsWith?: string; endsWith?: string }
  mediaAttachments?: any
  createdDate?: Date | DateFilter
  lastEditedDate?: Date | DateFilter
  status?: string | { contains?: string; startsWith?: string; endsWith?: string }
  wasAiGenerated?: boolean
  AND?: ContentPostFilter[]
  OR?: ContentPostFilter[]
  NOT?: ContentPostFilter
}

export interface ScheduledPostFilter {
  id?: any
  contentPostId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  socialMediaConnectionId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  platform?: string | { contains?: string; startsWith?: string; endsWith?: string }
  scheduledDateTime?: Date | DateFilter
  platformSpecificContent?: string | { contains?: string; startsWith?: string; endsWith?: string }
  publishStatus?: string | { contains?: string; startsWith?: string; endsWith?: string }
  publishedDateTime?: Date | DateFilter
  platformPostId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  errorMessage?: string | { contains?: string; startsWith?: string; endsWith?: string }
  retryCount?: number | { gt?: number; gte?: number; lt?: number; lte?: number }
  AND?: ScheduledPostFilter[]
  OR?: ScheduledPostFilter[]
  NOT?: ScheduledPostFilter
}

export interface ContentOptimizationFilter {
  id?: any
  userId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  originalContent?: string | { contains?: string; startsWith?: string; endsWith?: string }
  optimizedContent?: string | { contains?: string; startsWith?: string; endsWith?: string }
  optimizationType?: string | { contains?: string; startsWith?: string; endsWith?: string }
  targetPlatform?: string | { contains?: string; startsWith?: string; endsWith?: string }
  optimizationPrompt?: string | { contains?: string; startsWith?: string; endsWith?: string }
  optimizedDate?: Date | DateFilter
  wasAccepted?: boolean
  resultingContentPostId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  AND?: ContentOptimizationFilter[]
  OR?: ContentOptimizationFilter[]
  NOT?: ContentOptimizationFilter
}

export interface ApiUsageFilter {
  id?: any
  userId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  apiProvider?: string | { contains?: string; startsWith?: string; endsWith?: string }
  apiEndpoint?: string | { contains?: string; startsWith?: string; endsWith?: string }
  requestType?: string | { contains?: string; startsWith?: string; endsWith?: string }
  tokensUsed?: number | { gt?: number; gte?: number; lt?: number; lte?: number }
  requestTimestamp?: Date | DateFilter
  responseStatus?: string | { contains?: string; startsWith?: string; endsWith?: string }
  costAmount?: number | { gt?: number; gte?: number; lt?: number; lte?: number }
  relatedEntityId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  AND?: ApiUsageFilter[]
  OR?: ApiUsageFilter[]
  NOT?: ApiUsageFilter
}

export interface AssetDownloadFilter {
  id?: any
  userId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  brandAssetId?: string | { contains?: string; startsWith?: string; endsWith?: string }
  downloadFormat?: string | { contains?: string; startsWith?: string; endsWith?: string }
  downloadDate?: Date | DateFilter
  fileSize?: number | { gt?: number; gte?: number; lt?: number; lte?: number }
  AND?: AssetDownloadFilter[]
  OR?: AssetDownloadFilter[]
  NOT?: AssetDownloadFilter
}