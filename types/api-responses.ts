/**
 * Standardized API Response Types
 * Improves type safety across the application
 */

// ============= GENERIC API RESPONSE TYPES =============

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  metadata?: ResponseMetadata
}

export interface ApiError {
  code: string
  message: string
  details?: string[]
  timestamp: string
}

export interface ResponseMetadata {
  timestamp: string
  version: string
  requestId?: string
}

// ============= PAGINATED RESPONSE TYPES =============

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo
}

export interface PaginationInfo {
  total: number
  page: number
  pages: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// ============= AUTH RESPONSE TYPES =============

export interface AuthResponse extends ApiResponse {
  data?: {
    user: UserProfile
    session: SessionData
    tokens: AuthTokens
  }
}

export interface UserProfile {
  id: string
  email: string
  emailVerified: boolean
  subscriptionTier: 'free' | 'premium' | 'enterprise'
  accountCreatedDate: string
  lastLoginDate: string
}

export interface SessionData {
  sessionId: string
  expiresAt: string
  isActive: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

// ============= UPLOAD RESPONSE TYPES =============

export interface FileUploadResponse extends ApiResponse {
  data?: {
    fileId: string
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
    uploadedAt: string
  }
}

// ============= VALIDATION ERROR TYPES =============

export interface ValidationError {
  field: string
  message: string
  code: 'required' | 'invalid_type' | 'invalid_format' | 'too_small' | 'too_big' | 'custom'
}

export interface ValidationErrorResponse extends ApiResponse {
  error: ApiError & {
    validation: ValidationError[]
  }
}

// ============= TRPC ENHANCED TYPES =============

export interface TRPCResponse<T> {
  result: {
    data?: T
    error?: {
      code: number
      message: string
      data: {
        code: string
        httpStatus: number
        stack?: string
        zodError?: {
          fieldErrors: Record<string, string[]>
          formErrors: string[]
        }
      }
    }
  }
  id: number
}

// ============= BUSINESS DOMAIN TYPES =============

export interface BrandProjectResponse extends ApiResponse {
  data?: {
    project: {
      id: string
      projectName: string
      companyName: string
      status: 'active' | 'archived' | 'draft'
      createdDate: string
      lastModifiedDate: string
      assetCount: number
      completionPercentage: number
    }
  }
}

export interface ContentPostResponse extends ApiResponse {
  data?: {
    post: {
      id: string
      contentText: string
      contentTopic: string
      status: 'draft' | 'published' | 'scheduled' | 'archived'
      createdDate: string
      scheduledFor?: string
      platforms: string[]
      engagement?: EngagementMetrics
    }
  }
}

export interface EngagementMetrics {
  views: number
  likes: number
  shares: number
  comments: number
  engagementRate: number
  lastUpdated: string
}

// ============= ANALYTICS TYPES =============

export interface AnalyticsResponse extends ApiResponse {
  data?: {
    metrics: MetricData[]
    timeRange: {
      start: string
      end: string
      granularity: 'hour' | 'day' | 'week' | 'month'
    }
    summary: AnalyticsSummary
  }
}

export interface MetricData {
  timestamp: string
  value: number
  metric: string
  dimensions?: Record<string, string>
}

export interface AnalyticsSummary {
  total: number
  average: number
  growth: number
  trend: 'up' | 'down' | 'stable'
  topPerformers: {
    id: string
    name: string
    value: number
  }[]
}

// ============= TYPE GUARDS =============

export function isApiError(response: any): response is ApiResponse & { success: false; error: ApiError } {
  return response && response.success === false && response.error
}

export function isValidationError(response: any): response is ValidationErrorResponse {
  return isApiError(response) && response.error?.code === 'VALIDATION_ERROR'
}

export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return response && response.pagination && Array.isArray(response.data)
}