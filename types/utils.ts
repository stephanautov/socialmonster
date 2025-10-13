/**
 * Utility type definitions
 * Common TypeScript utility types and helpers
 */

// ============= UTILITY TYPES =============

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Make all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * Extract the type of array elements
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Exclude null and undefined from type
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Extract keys of type T that have value type V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never
}[keyof T]

/**
 * Merge two types, with second type overriding first
 */
export type Merge<T, U> = Omit<T, keyof U> & U

/**
 * Make properties readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Extract promise type
 */
export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T

// ============= BRANDED TYPES =============

/**
 * Create a branded type for type-safe IDs
 */
export type Brand<T, B> = T & { __brand: B }

export type UUID = Brand<string, 'UUID'>
export type Email = Brand<string, 'Email'>
export type URL = Brand<string, 'URL'>
export type DateString = Brand<string, 'DateString'>

// ============= FUNCTION TYPES =============

export type AsyncFunction<T = any, R = void> = (args: T) => Promise<R>
export type SyncFunction<T = any, R = void> = (args: T) => R
export type VoidFunction = () => void
export type AsyncVoidFunction = () => Promise<void>