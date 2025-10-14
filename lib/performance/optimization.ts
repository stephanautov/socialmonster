/**
 * Performance Optimization Utilities
 * Provides lazy loading, memoization, and performance monitoring
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'
import { logger } from '@/lib/logger'

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>()
  const renderCount = useRef(0)

  useEffect(() => {
    startTime.current = performance.now()
    renderCount.current++

    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current
        if (renderTime > 50) { // Log slow renders
          logger.warn('Slow component render detected', {
            component: componentName,
            renderTime: `${renderTime.toFixed(2)}ms`,
            renderCount: renderCount.current
          })
        }
      }
    }
  })

  return {
    renderCount: renderCount.current,
    markRenderStart: () => {
      startTime.current = performance.now()
    },
    measureRender: () => {
      if (startTime.current) {
        return performance.now() - startTime.current
      }
      return 0
    }
  }
}

/**
 * Debounced callback hook for performance optimization
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay, ...deps]
  ) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Memoized expensive calculation hook
 */
export function useExpensiveCalculation<T>(
  calculation: () => T,
  deps: React.DependencyList,
  warningThreshold = 10 // ms
): T {
  return useMemo(() => {
    const start = performance.now()
    const result = calculation()
    const duration = performance.now() - start

    if (duration > warningThreshold) {
      logger.warn('Expensive calculation detected', {
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${warningThreshold}ms`
      })
    }

    return result
  }, deps)
}

/**
 * Lazy import utility for code splitting
 */
export function createLazyComponent<T = any>(
  importFunction: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunction)

  return (props: T) => (
    <React.Suspense fallback={fallback ? <fallback /> : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

/**
 * Image optimization utility
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  width?: number,
  height?: number
) {
  const isExternalImage = src.startsWith('http')
  
  return {
    src,
    alt,
    width,
    height,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    ...(isExternalImage && {
      unoptimized: true // External images can't be optimized by Next.js
    }),
    style: {
      maxWidth: '100%',
      height: 'auto',
    }
  }
}

/**
 * Bundle analyzer utility for development
 */
export function analyzeBundleSize() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  // Performance observer for measuring bundle load times
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource' && entry.name.includes('.js')) {
        const resource = entry as PerformanceResourceTiming
        logger.info('Bundle resource loaded', {
          name: entry.name,
          size: resource.transferSize || 'unknown',
          loadTime: `${resource.duration.toFixed(2)}ms`,
          type: 'javascript'
        })
      }
    }
  })

  observer.observe({ entryTypes: ['resource'] })

  // Measure initial page load performance
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    logger.info('Page performance metrics', {
      domContentLoaded: `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
      loadComplete: `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
      totalLoadTime: `${navigation.loadEventEnd - navigation.fetchStart}ms`
    })
  })
}

/**
 * Memory usage monitoring
 */
export function useMemoryMonitor(componentName: string) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return
    }

    const checkMemory = () => {
      const memory = (performance as any).memory
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        logger.warn('High memory usage detected', {
          component: componentName,
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
          usage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%`
        })
      }
    }

    const interval = setInterval(checkMemory, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [componentName])
}

// Initialize performance monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  analyzeBundleSize()
}