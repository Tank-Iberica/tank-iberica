// Stub for #imports — re-exports globals that setup.ts mocks
// This avoids resolving the real .nuxt/imports.d.ts which depends on vue-demi

export const useState = (globalThis as Record<string, unknown>).useState as (
  key: string,
  init?: () => unknown,
) => { value: unknown }

export const useSupabaseClient = (globalThis as Record<string, unknown>)
  .useSupabaseClient as () => unknown

export const useSupabaseUser = (globalThis as Record<string, unknown>)
  .useSupabaseUser as () => unknown

export const useI18n = (globalThis as Record<string, unknown>).useI18n as () => unknown

export const useNuxtApp = (globalThis as Record<string, unknown>).useNuxtApp as () => unknown

export const useRuntimeConfig = (globalThis as Record<string, unknown>)
  .useRuntimeConfig as () => unknown

export const useRoute = (globalThis as Record<string, unknown>).useRoute as () => unknown

export const useRouter = (globalThis as Record<string, unknown>).useRouter as () => unknown

export const navigateTo = (globalThis as Record<string, unknown>).navigateTo as () => unknown

export const definePageMeta = (globalThis as Record<string, unknown>)
  .definePageMeta as () => unknown
