/**
 * Dependency Injection utility for composables.
 *
 * Provides a pattern to extract implicit dependencies (useSupabaseClient, useRoute, etc.)
 * as optional parameters with defaults. Enables testing without deep mocks.
 *
 * F56 — DI real en client composables
 *
 * @example
 * // Before (hard to test):
 * function useSomething() {
 *   const supabase = useSupabaseClient()
 *   const route = useRoute()
 *   // ...
 * }
 *
 * // After (testable):
 * function useSomething(deps?: { supabase?: SupabaseClient; route?: RouteLocationNormalized }) {
 *   const supabase = deps?.supabase ?? useInjectSupabase()
 *   const route = deps?.route ?? useInjectRoute()
 *   // ...
 * }
 *
 * // In tests:
 * const result = useSomething({ supabase: mockSupabase, route: mockRoute })
 */

/**
 * Inject Supabase client with fallback to useSupabaseClient().
 */
export function useInjectSupabase(override?: ReturnType<typeof useSupabaseClient>) {
  if (override) return override
  return useSupabaseClient()
}

/**
 * Inject current route with fallback to useRoute().
 */
export function useInjectRoute(override?: ReturnType<typeof useRoute>) {
  if (override) return override
  return useRoute()
}

/**
 * Inject router with fallback to useRouter().
 */
export function useInjectRouter(override?: ReturnType<typeof useRouter>) {
  if (override) return override
  return useRouter()
}

/**
 * Inject current user with fallback to useSupabaseUser().
 */
export function useInjectUser(override?: ReturnType<typeof useSupabaseUser>) {
  if (override) return override
  return useSupabaseUser()
}

/**
 * Inject runtime config with fallback to useRuntimeConfig().
 */
export function useInjectConfig(override?: ReturnType<typeof useRuntimeConfig>) {
  if (override) return override
  return useRuntimeConfig()
}

/**
 * Generic dependency injection: use override if provided, else call factory.
 */
export function useInjectOrDefault<T>(override: T | undefined, factory: () => T): T {
  return override ?? factory()
}
