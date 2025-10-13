/**
 * Type-Safe API Client
 * Provides strongly typed methods for all API interactions
 */

import { ApiResponse, PaginatedResponse, AuthResponse, ValidationErrorResponse } from '@/types/api-responses'
import { 
  User, CreateUserInput, UpdateUserInput,
  BrandProject, CreateBrandProjectInput, UpdateBrandProjectInput,
  ContentPost, CreateContentPostInput, UpdateContentPostInput
} from '@/types/entities'

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = '/api', authToken?: string) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'API_ERROR',
            message: data.error?.message || 'An error occurred',
            details: data.error?.details || [],
            timestamp: new Date().toISOString()
          }
        }
      }

      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // ============= AUTH METHODS =============

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse['data']>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async signUp(email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
    return this.request<AuthResponse['data']>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmPassword })
    })
  }

  async signOut(): Promise<ApiResponse> {
    return this.request('/auth/signout', { method: 'POST' })
  }

  async getSession(): Promise<AuthResponse> {
    return this.request<AuthResponse['data']>('/auth/session')
  }

  // ============= USER METHODS =============

  async getUsers(params?: {
    search?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    return this.request<User[]>(`/users?${searchParams}`)
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`)
  }

  async createUser(data: CreateUserInput): Promise<ApiResponse<User>> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateUser(id: string, data: Partial<UpdateUserInput>): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request(`/users/${id}`, { method: 'DELETE' })
  }

  // ============= BRAND PROJECT METHODS =============

  async getBrandProjects(userId?: string): Promise<PaginatedResponse<BrandProject>> {
    const params = userId ? `?userId=${userId}` : ''
    return this.request(`/brand-projects${params}`)
  }

  async createBrandProject(data: CreateBrandProjectInput): Promise<ApiResponse<BrandProject>> {
    return this.request('/brand-projects', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // ============= CONTENT METHODS =============

  async getContentPosts(params?: {
    userId?: string
    brandProjectId?: string
    status?: string
  }): Promise<PaginatedResponse<ContentPost>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    return this.request(`/content-posts?${searchParams}`)
  }

  async createContentPost(data: CreateContentPostInput): Promise<ApiResponse<ContentPost>> {
    return this.request('/content-posts', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // ============= FILE UPLOAD METHODS =============

  async uploadFile(file: File, category: string): Promise<ApiResponse<{
    fileId: string
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
  }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - let browser set it
        'Authorization': this.defaultHeaders['Authorization']
      } as any
    })
  }

  // ============= ANALYTICS METHODS =============

  async getAnalytics(params: {
    startDate: string
    endDate: string
    metrics: string[]
    granularity?: 'hour' | 'day' | 'week' | 'month'
  }): Promise<ApiResponse<{[key: string]: any}>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v))
      } else if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request(`/analytics?${searchParams}`)
  }

  // ============= UTILITY METHODS =============

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  removeAuthToken() {
    delete this.defaultHeaders['Authorization']
  }

  updateBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Type-safe error checking utilities
export function isValidationError(response: ApiResponse): response is ValidationErrorResponse {
  return !response.success && response.error?.code === 'VALIDATION_ERROR'
}

export function isAuthError(response: ApiResponse): boolean {
  return !response.success && ['UNAUTHORIZED', 'TOKEN_EXPIRED', 'INVALID_CREDENTIALS'].includes(response.error?.code || '')
}

export function isNetworkError(response: ApiResponse): boolean {
  return !response.success && response.error?.code === 'NETWORK_ERROR'
}