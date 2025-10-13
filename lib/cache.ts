class MemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { value, expiry })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }
}

export const cache = new MemoryCache()