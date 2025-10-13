/**
 * Main application type definitions
 * Auto-generated from requirements specification
 */

// ============= APPLICATION TYPES =============

export interface AppConfig {
  name: string
  version: string
  environment: 'development' | 'staging' | 'production'
  features: AppFeatures
}

export interface AppFeatures {
  authentication: boolean
  fileUpload: boolean
  realtime: boolean
  ai: boolean
  search: boolean
  notifications: boolean
}

export interface AppUser {
  id: string
  email: string
  name?: string
  role: UserRole
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

// ============= COMMON TYPES =============

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// ============= FILTER TYPES =============

export interface FilterOperator<T = unknown> {
  equals?: T
  not?: T
  in?: T[]
  notIn?: T[]
  contains?: string
  startsWith?: string
  endsWith?: string
  gt?: T
  gte?: T
  lt?: T
  lte?: T
}

export interface DateFilter {
  after?: Date | string
  before?: Date | string
  between?: [Date | string, Date | string]
}

export interface SearchParams {
  query: string
  fields?: string[]
  fuzzy?: boolean
  highlight?: boolean
}