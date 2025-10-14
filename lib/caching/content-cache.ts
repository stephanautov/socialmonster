/**
 * Content Caching System
 * Provides intelligent caching for AI-generated content and API responses
 */

import { logger } from '@/lib/logger'

export interface CacheEntry<T = any> {
  key: string
  value: T
  expiresAt: number
  createdAt: number
  accessCount: number
  lastAccessed: number
}

export interface CacheStats {
  totalEntries: number
  hitRate: number
  missRate: number
  totalHits: number
  totalMisses: number
  memoryUsage: number // bytes
  oldestEntry: number // timestamp
  newestEntry: number // timestamp
}

/**
 * Intelligent Content Cache with TTL and LRU eviction
 */
export class ContentCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private defaultTTL: number
  private hits = 0
  private misses = 0

  constructor(options: {
    maxSize?: number
    defaultTTL?: number // milliseconds
  } = {}) {
    this.maxSize = options.maxSize || 1000
    this.defaultTTL = options.defaultTTL || 60 * 60 * 1000 // 1 hour
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.misses++
      logger.debug('Cache miss', { key })
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.misses++
      logger.debug('Cache expired', { key, expiresAt: new Date(entry.expiresAt) })
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.hits++

    logger.debug('Cache hit', { 
      key, 
      accessCount: entry.accessCount,
      age: Date.now() - entry.createdAt 
    })

    return entry.value
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now()
    const expirationTime = ttl || this.defaultTTL

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt: now + expirationTime,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now
    }

    this.cache.set(key, entry)

    logger.debug('Cache set', { 
      key, 
      ttl: expirationTime,
      expiresAt: new Date(entry.expiresAt),
      cacheSize: this.cache.size 
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      logger.debug('Cache delete', { key })
    }
    return deleted
  }

  /**
   * Clear all entries
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.hits = 0
    this.misses = 0
    logger.info('Cache cleared', { entriesRemoved: size })
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values())
    const totalRequests = this.hits + this.misses
    
    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
      totalHits: this.hits,
      totalMisses: this.misses,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.createdAt)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.createdAt)) : 0
    }
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let removedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        removedCount++
      }
    }

    if (removedCount > 0) {
      logger.info('Cache cleanup completed', { removedCount })
    }

    return removedCount
  }

  /**
   * Get cache key for content generation
   */
  static getContentKey(prompt: string, options: any): string {
    const optionsHash = this.hashObject(options)
    return `content:${this.hashString(prompt)}:${optionsHash}`
  }

  /**
   * Get cache key for brand assets
   */
  static getBrandAssetKey(companyInfo: any, assetTypes: string[]): string {
    const companyHash = this.hashObject(companyInfo)
    const assetsHash = this.hashString(assetTypes.sort().join(','))
    return `brand:${companyHash}:${assetsHash}`
  }

  /**
   * Get cache key for API responses
   */
  static getApiKey(endpoint: string, params: any): string {
    const paramsHash = this.hashObject(params)
    return `api:${endpoint}:${paramsHash}`
  }

  private evictLRU(): void {
    let lruKey: string | null = null
    let lruTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
      logger.debug('Cache LRU eviction', { 
        evictedKey: lruKey,
        lastAccessed: new Date(lruTime) 
      })
    }
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0
    
    for (const entry of this.cache.values()) {
      // Rough estimation of memory usage
      totalSize += JSON.stringify(entry.value).length * 2 // UTF-16 characters
      totalSize += entry.key.length * 2
      totalSize += 64 // Overhead for entry metadata
    }

    return totalSize
  }

  private static hashString(str: string): string {
    let hash = 0
    if (str.length === 0) return hash.toString()
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36)
  }

  private static hashObject(obj: any): string {
    return this.hashString(JSON.stringify(obj, Object.keys(obj).sort()))
  }
}

// Global cache instances
export const contentCache = new ContentCache({
  maxSize: 500,
  defaultTTL: 30 * 60 * 1000 // 30 minutes for content
})

export const brandAssetCache = new ContentCache({
  maxSize: 100,
  defaultTTL: 60 * 60 * 1000 // 1 hour for brand assets
})

export const apiCache = new ContentCache({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000 // 5 minutes for API responses
})

// Start cleanup interval
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    contentCache.cleanup()
    brandAssetCache.cleanup()
    apiCache.cleanup()
  }, 10 * 60 * 1000) // Cleanup every 10 minutes
}