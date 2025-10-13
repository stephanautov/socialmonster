/**
 * API type definitions
 * Auto-generated from API specifications
 */

import { ApiResponse, PaginatedResponse } from './index'
import * as Entities from './entities'

// ============= REQUEST TYPES =============

export interface ApiRequest<T = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  params?: Record<string, string>
  query?: Record<string, string | number | boolean>
  body?: T
  headers?: Record<string, string>
}

export interface AuthenticatedRequest extends ApiRequest {
  userId: string
  token: string
}

// ============= ENDPOINT TYPES =============

export interface AuthGetSessionResponse<T = unknown> {
  // Add response fields based on tRPC procedure: auth.getSession
  success: boolean
  data?: T
}

export interface AuthSignInRequest<T = unknown> {
  // Add request fields based on tRPC procedure: auth.signIn
  data: T
}

export interface AuthSignInResponse<T = unknown> {
  // Add response fields based on tRPC procedure: auth.signIn
  success: boolean
  data?: T
}

export interface AuthSignUpRequest<T = unknown> {
  // Add request fields based on tRPC procedure: auth.signUp
  data: T
}

export interface AuthSignUpResponse<T = unknown> {
  // Add response fields based on tRPC procedure: auth.signUp
  success: boolean
  data?: T
}

export interface AuthSignOutRequest<T = unknown> {
  // Add request fields based on tRPC procedure: auth.signOut
  data: T
}

export interface AuthSignOutResponse<T = unknown> {
  // Add response fields based on tRPC procedure: auth.signOut
  success: boolean
  data?: T
}

export interface UserListResponse<T = unknown> {
  // Add response fields based on tRPC procedure: user.list
  success: boolean
  data?: T
}

export interface UserGetByIdResponse<T = unknown> {
  // Add response fields based on tRPC procedure: user.getById
  success: boolean
  data?: T
}

export interface UserCreateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: user.create
  data: T
}

export interface UserCreateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: user.create
  success: boolean
  data?: T
}

export interface UserUpdateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: user.update
  data: T
}

export interface UserUpdateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: user.update
  success: boolean
  data?: T
}

export interface UserDeleteRequest<T = unknown> {
  // Add request fields based on tRPC procedure: user.delete
  data: T
}

export interface UserDeleteResponse<T = unknown> {
  // Add response fields based on tRPC procedure: user.delete
  success: boolean
  data?: T
}

export interface SocialmediaconnectionListResponse<T = unknown> {
  // Add response fields based on tRPC procedure: socialmediaconnection.list
  success: boolean
  data?: T
}

export interface SocialmediaconnectionGetByIdResponse<T = unknown> {
  // Add response fields based on tRPC procedure: socialmediaconnection.getById
  success: boolean
  data?: T
}

export interface SocialmediaconnectionCreateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: socialmediaconnection.create
  data: T
}

export interface SocialmediaconnectionCreateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: socialmediaconnection.create
  success: boolean
  data?: T
}

export interface SocialmediaconnectionUpdateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: socialmediaconnection.update
  data: T
}

export interface SocialmediaconnectionUpdateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: socialmediaconnection.update
  success: boolean
  data?: T
}

export interface SocialmediaconnectionDeleteRequest<T = unknown> {
  // Add request fields based on tRPC procedure: socialmediaconnection.delete
  data: T
}

export interface SocialmediaconnectionDeleteResponse<T = unknown> {
  // Add response fields based on tRPC procedure: socialmediaconnection.delete
  success: boolean
  data?: T
}

export interface BrandprojectListResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandproject.list
  success: boolean
  data?: T
}

export interface BrandprojectGetByIdResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandproject.getById
  success: boolean
  data?: T
}

export interface BrandprojectCreateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: brandproject.create
  data: T
}

export interface BrandprojectCreateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandproject.create
  success: boolean
  data?: T
}

export interface BrandprojectUpdateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: brandproject.update
  data: T
}

export interface BrandprojectUpdateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandproject.update
  success: boolean
  data?: T
}

export interface BrandprojectDeleteRequest<T = unknown> {
  // Add request fields based on tRPC procedure: brandproject.delete
  data: T
}

export interface BrandprojectDeleteResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandproject.delete
  success: boolean
  data?: T
}

export interface BrandassetListResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandasset.list
  success: boolean
  data?: T
}

export interface BrandassetGetByIdResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandasset.getById
  success: boolean
  data?: T
}

export interface BrandassetCreateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: brandasset.create
  data: T
}

export interface BrandassetCreateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandasset.create
  success: boolean
  data?: T
}

export interface BrandassetUpdateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: brandasset.update
  data: T
}

export interface BrandassetUpdateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandasset.update
  success: boolean
  data?: T
}

export interface BrandassetDeleteRequest<T = unknown> {
  // Add request fields based on tRPC procedure: brandasset.delete
  data: T
}

export interface BrandassetDeleteResponse<T = unknown> {
  // Add response fields based on tRPC procedure: brandasset.delete
  success: boolean
  data?: T
}

export interface ContentpostListResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentpost.list
  success: boolean
  data?: T
}

export interface ContentpostGetByIdResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentpost.getById
  success: boolean
  data?: T
}

export interface ContentpostCreateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: contentpost.create
  data: T
}

export interface ContentpostCreateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentpost.create
  success: boolean
  data?: T
}

export interface ContentpostUpdateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: contentpost.update
  data: T
}

export interface ContentpostUpdateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentpost.update
  success: boolean
  data?: T
}

export interface ContentpostDeleteRequest<T = unknown> {
  // Add request fields based on tRPC procedure: contentpost.delete
  data: T
}

export interface ContentpostDeleteResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentpost.delete
  success: boolean
  data?: T
}

export interface ScheduledpostListResponse<T = unknown> {
  // Add response fields based on tRPC procedure: scheduledpost.list
  success: boolean
  data?: T
}

export interface ScheduledpostGetByIdResponse<T = unknown> {
  // Add response fields based on tRPC procedure: scheduledpost.getById
  success: boolean
  data?: T
}

export interface ScheduledpostCreateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: scheduledpost.create
  data: T
}

export interface ScheduledpostCreateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: scheduledpost.create
  success: boolean
  data?: T
}

export interface ScheduledpostUpdateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: scheduledpost.update
  data: T
}

export interface ScheduledpostUpdateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: scheduledpost.update
  success: boolean
  data?: T
}

export interface ScheduledpostDeleteRequest<T = unknown> {
  // Add request fields based on tRPC procedure: scheduledpost.delete
  data: T
}

export interface ScheduledpostDeleteResponse<T = unknown> {
  // Add response fields based on tRPC procedure: scheduledpost.delete
  success: boolean
  data?: T
}

export interface ContentoptimizationListResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentoptimization.list
  success: boolean
  data?: T
}

export interface ContentoptimizationGetByIdResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentoptimization.getById
  success: boolean
  data?: T
}

export interface ContentoptimizationCreateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: contentoptimization.create
  data: T
}

export interface ContentoptimizationCreateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentoptimization.create
  success: boolean
  data?: T
}

export interface ContentoptimizationUpdateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: contentoptimization.update
  data: T
}

export interface ContentoptimizationUpdateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentoptimization.update
  success: boolean
  data?: T
}

export interface ContentoptimizationDeleteRequest<T = unknown> {
  // Add request fields based on tRPC procedure: contentoptimization.delete
  data: T
}

export interface ContentoptimizationDeleteResponse<T = unknown> {
  // Add response fields based on tRPC procedure: contentoptimization.delete
  success: boolean
  data?: T
}

export interface ApiusageListResponse<T = unknown> {
  // Add response fields based on tRPC procedure: apiusage.list
  success: boolean
  data?: T
}

export interface ApiusageGetByIdResponse<T = unknown> {
  // Add response fields based on tRPC procedure: apiusage.getById
  success: boolean
  data?: T
}

export interface ApiusageCreateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: apiusage.create
  data: T
}

export interface ApiusageCreateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: apiusage.create
  success: boolean
  data?: T
}

export interface ApiusageUpdateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: apiusage.update
  data: T
}

export interface ApiusageUpdateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: apiusage.update
  success: boolean
  data?: T
}

export interface ApiusageDeleteRequest<T = unknown> {
  // Add request fields based on tRPC procedure: apiusage.delete
  data: T
}

export interface ApiusageDeleteResponse<T = unknown> {
  // Add response fields based on tRPC procedure: apiusage.delete
  success: boolean
  data?: T
}

export interface AssetdownloadListResponse<T = unknown> {
  // Add response fields based on tRPC procedure: assetdownload.list
  success: boolean
  data?: T
}

export interface AssetdownloadGetByIdResponse<T = unknown> {
  // Add response fields based on tRPC procedure: assetdownload.getById
  success: boolean
  data?: T
}

export interface AssetdownloadCreateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: assetdownload.create
  data: T
}

export interface AssetdownloadCreateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: assetdownload.create
  success: boolean
  data?: T
}

export interface AssetdownloadUpdateRequest<T = unknown> {
  // Add request fields based on tRPC procedure: assetdownload.update
  data: T
}

export interface AssetdownloadUpdateResponse<T = unknown> {
  // Add response fields based on tRPC procedure: assetdownload.update
  success: boolean
  data?: T
}

export interface AssetdownloadDeleteRequest<T = unknown> {
  // Add request fields based on tRPC procedure: assetdownload.delete
  data: T
}

export interface AssetdownloadDeleteResponse<T = unknown> {
  // Add response fields based on tRPC procedure: assetdownload.delete
  success: boolean
  data?: T
}

export interface FilesUploadFileRequest<T = unknown> {
  // Add request fields based on tRPC procedure: files.uploadFile
  data: T
}

export interface FilesUploadFileResponse<T = unknown> {
  // Add response fields based on tRPC procedure: files.uploadFile
  success: boolean
  data?: T
}

// ============= ERROR TYPES =============

export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ApiValidationError {
  message: string
  errors: ValidationError[]
}