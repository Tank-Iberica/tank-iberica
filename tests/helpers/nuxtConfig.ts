/**
 * Loads nuxt.config.ts as a parsed object for behavioral config tests.
 *
 * Mocks `defineNuxtConfig` as identity function so the config object
 * is returned directly. Process.env values use test defaults.
 *
 * Usage:
 *   import { loadNuxtConfig } from '../helpers/nuxtConfig'
 *   const config = await loadNuxtConfig()
 *   expect(config.routeRules['/vehiculo/**'].swr).toBe(300)
 */

let _cached: Record<string, any> | null = null

export async function loadNuxtConfig(): Promise<Record<string, any>> {
  if (_cached) return _cached

  // Mock defineNuxtConfig as identity — it's auto-imported by Nuxt
  const prev = (globalThis as any).defineNuxtConfig
  ;(globalThis as any).defineNuxtConfig = (c: any) => c

  // Static import path so Vite can resolve it
  const mod = await import('../../nuxt.config.ts')
  _cached = mod.default

  // Restore
  if (prev !== undefined) {
    ;(globalThis as any).defineNuxtConfig = prev
  } else {
    delete (globalThis as any).defineNuxtConfig
  }

  return _cached!
}
