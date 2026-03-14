/**
 * Tests for app/components/modals/AuthModal.vue
 *
 * Covers: rendering, props (modelValue), mode toggling (login/register),
 * form submission (login, register, password mismatch), Google OAuth,
 * forgot password, close behavior, error display, admin redirect logic,
 * emits, input binding, and accessibility attributes.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref, computed, watch, reactive, watchEffect } from 'vue'
import AuthModal from '../../../app/components/modals/AuthModal.vue'

// Restore real Vue reactivity primitives so SFC <script setup> works correctly.
// The setup.ts stubs these with plain objects which breaks SFC template unwrapping.
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('watchEffect', watchEffect)

// ---------------------------------------------------------------------------
// Supabase mock helpers
// ---------------------------------------------------------------------------
let signInWithPasswordMock: Mock
let signUpMock: Mock
let signInWithOAuthMock: Mock
let resetPasswordForEmailMock: Mock
let fromSelectSingleMock: Mock

function createSupabaseMock() {
  signInWithPasswordMock = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  })
  signUpMock = vi.fn().mockResolvedValue({ error: null })
  signInWithOAuthMock = vi.fn().mockResolvedValue({ error: null })
  resetPasswordForEmailMock = vi.fn().mockResolvedValue({ error: null })
  fromSelectSingleMock = vi.fn().mockResolvedValue({ data: { role: 'user' }, error: null })

  return {
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
      signInWithOAuth: signInWithOAuthMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: fromSelectSingleMock,
        }),
      }),
    }),
  }
}

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------
let supabaseMock: ReturnType<typeof createSupabaseMock>
const navigateToMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  supabaseMock = createSupabaseMock()
  vi.stubGlobal('useSupabaseClient', () => supabaseMock)
  vi.stubGlobal('useRoute', () => ({ params: {}, query: {} }))
  vi.stubGlobal('navigateTo', navigateToMock)
  vi.stubGlobal('useI18n', () => ({
    locale: { value: 'es' },
    t: (key: string) => key,
  }))
  // globalThis.location used by loginWithGoogle / forgotPassword
  vi.stubGlobal('location', { origin: 'https://tracciona.com' })
  // Focus trap composable
  vi.stubGlobal('useFocusTrap', () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }))
  // Stub $fetch for lockout checks used by useAuth inside component
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ locked: false, attemptsRemaining: 5 }))
  document.body.style.overflow = ''
})

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
const factory = (props: Record<string, unknown> = {}) =>
  shallowMount(AuthModal, {
    props: {
      modelValue: true,
      ...props,
    },
    global: {
      stubs: {
        Teleport: true,
        Transition: true,
      },
    },
  })

// ===========================================================================
// RENDERING
// ===========================================================================
describe('AuthModal — rendering', () => {
  it('renders when modelValue is true', () => {
    const w = factory()
    expect(w.find('.auth-backdrop').exists()).toBe(true)
    expect(w.find('.auth-panel').exists()).toBe(true)
  })

  it('does NOT render backdrop when modelValue is false', () => {
    const w = factory({ modelValue: false })
    expect(w.find('.auth-backdrop').exists()).toBe(false)
  })

  it('renders the close button', () => {
    expect(factory().find('.close-btn').exists()).toBe(true)
  })

  it('renders login title by default', () => {
    // $t in template returns the key for unknown keys, 'auth.login' is not in setup.ts map
    expect(factory().find('.auth-title').text()).toBe('auth.login')
  })

  it('renders Google button', () => {
    expect(factory().find('.btn-google').exists()).toBe(true)
  })

  it('renders divider', () => {
    expect(factory().find('.divider').exists()).toBe(true)
  })

  it('renders email and password fields', () => {
    const w = factory()
    expect(w.find('#auth-email').exists()).toBe(true)
    expect(w.find('#auth-password').exists()).toBe(true)
  })

  it('does NOT render confirm password in login mode', () => {
    expect(factory().find('#auth-confirm').exists()).toBe(false)
  })

  it('renders submit button with login text', () => {
    expect(factory().find('.btn-primary').text()).toBe('auth.login')
  })

  it('renders toggle mode text', () => {
    const w = factory()
    expect(w.find('.toggle-mode').exists()).toBe(true)
  })

  it('renders forgot password button in login mode', () => {
    expect(factory().find('.forgot').exists()).toBe(true)
  })
})

// ===========================================================================
// MODE TOGGLING
// ===========================================================================
describe('AuthModal — mode toggling', () => {
  it('switches to register mode on toggle click', async () => {
    const w = factory()
    // The link-btn inside toggle-mode triggers toggleMode
    const toggleBtns = w.findAll('.link-btn')
    // First link-btn is in toggle-mode, last may be .forgot
    const toggleBtn = w.find('.toggle-mode .link-btn')
    await toggleBtn.trigger('click')

    expect(w.find('.auth-title').text()).toBe('auth.register')
    expect(w.find('#auth-confirm').exists()).toBe(true)
  })

  it('switches back to login mode on second toggle', async () => {
    const w = factory()
    const toggleBtn = w.find('.toggle-mode .link-btn')
    await toggleBtn.trigger('click')
    await toggleBtn.trigger('click')

    expect(w.find('.auth-title').text()).toBe('auth.login')
    expect(w.find('#auth-confirm').exists()).toBe(false)
  })

  it('hides forgot password in register mode', async () => {
    const w = factory()
    await w.find('.toggle-mode .link-btn').trigger('click')
    expect(w.find('.forgot').exists()).toBe(false)
  })

  it('shows confirm password in register mode', async () => {
    const w = factory()
    await w.find('.toggle-mode .link-btn').trigger('click')
    expect(w.find('#auth-confirm').exists()).toBe(true)
  })

  it('clears error when toggling mode', async () => {
    const w = factory()
    // Switch to register
    await w.find('.toggle-mode .link-btn').trigger('click')
    // Fill form with mismatched passwords
    await w.find('#auth-email').setValue('test@test.com')
    await w.find('#auth-password').setValue('pass123')
    await w.find('#auth-confirm').setValue('mismatch')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(w.find('.error-msg').exists()).toBe(true)

    // Toggle back clears error
    await w.find('.toggle-mode .link-btn').trigger('click')
    expect(w.find('.error-msg').exists()).toBe(false)
  })
})

// ===========================================================================
// CLOSE BEHAVIOR
// ===========================================================================
describe('AuthModal — close', () => {
  it('emits update:modelValue false on close button click', async () => {
    const w = factory()
    await w.find('.close-btn').trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('emits update:modelValue false on backdrop click', async () => {
    const w = factory()
    await w.find('.auth-backdrop').trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('does NOT close on panel click (stop propagation)', async () => {
    const w = factory()
    await w.find('.auth-panel').trigger('click')
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })
})

// ===========================================================================
// FORM — LOGIN
// ===========================================================================
describe('AuthModal — login submit', () => {
  it('calls signInWithPassword on login submit', async () => {
    const w = factory()
    await w.find('#auth-email').setValue('user@example.com')
    await w.find('#auth-password').setValue('secret123')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    })
  })

  it('shows error on login failure', async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid credentials'),
    })

    const w = factory()
    await w.find('#auth-email').setValue('bad@example.com')
    await w.find('#auth-password').setValue('wrong')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(w.find('.error-msg').text()).toBe('Invalid credentials')
  })

  it('shows generic error for non-Error throw', async () => {
    signInWithPasswordMock.mockRejectedValueOnce('string error')

    const w = factory()
    await w.find('#auth-email').setValue('test@test.com')
    await w.find('#auth-password').setValue('pass')
    await w.find('form').trigger('submit')
    await flushPromises()

    // t('common.error') in script returns key; but the error is set via ref,
    // and displayed in template via {{ errorMsg }} — no $t wrapping in template
    expect(w.find('.error-msg').text()).toBe('common.error')
  })

  it('disables submit button while loading', async () => {
    signInWithPasswordMock.mockReturnValueOnce(new Promise(() => {}))

    const w = factory()
    await w.find('#auth-email').setValue('test@test.com')
    await w.find('#auth-password').setValue('pass')
    await w.find('form').trigger('submit')

    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
    // Template uses $t('common.loading') which maps to 'Cargando' in setup.ts
    expect(w.find('.btn-primary').text()).toBe('Cargando')
  })

  it('re-enables submit button after login completes', async () => {
    const w = factory()
    await w.find('#auth-email').setValue('test@test.com')
    await w.find('#auth-password').setValue('pass123')
    await w.find('form').trigger('submit')
    await flushPromises()
    await new Promise((r) => setTimeout(r, 150))
    await flushPromises()

    // After completion, loading is false, disabled should not be set
    const btn = w.find('.btn-primary')
    expect(btn.text()).toBe('auth.login')
  })

  it('closes modal after successful non-admin login', async () => {
    fromSelectSingleMock.mockResolvedValueOnce({ data: { role: 'user' }, error: null })

    const w = factory()
    await w.find('#auth-email').setValue('test@test.com')
    await w.find('#auth-password').setValue('pass')
    await w.find('form').trigger('submit')
    await flushPromises()
    await new Promise((r) => setTimeout(r, 150))
    await flushPromises()

    expect(w.emitted('update:modelValue')).toBeTruthy()
  })
})

// ===========================================================================
// FORM — REGISTER
// ===========================================================================
describe('AuthModal — register submit', () => {
  async function switchToRegister(w: ReturnType<typeof factory>) {
    await w.find('.toggle-mode .link-btn').trigger('click')
  }

  it('calls signUp on register submit', async () => {
    const w = factory()
    await switchToRegister(w)
    await w.find('#auth-email').setValue('new@example.com')
    await w.find('#auth-password').setValue('secret123')
    await w.find('#auth-confirm').setValue('secret123')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'secret123',
    })
  })

  it('shows password mismatch error', async () => {
    const w = factory()
    await switchToRegister(w)
    await w.find('#auth-email').setValue('new@example.com')
    await w.find('#auth-password').setValue('pass123')
    await w.find('#auth-confirm').setValue('different')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(w.find('.error-msg').text()).toBe('auth.passwordMismatch')
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('shows error on signUp failure', async () => {
    signUpMock.mockResolvedValueOnce({
      error: new Error('User already registered'),
    })

    const w = factory()
    await switchToRegister(w)
    await w.find('#auth-email').setValue('existing@example.com')
    await w.find('#auth-password').setValue('pass123')
    await w.find('#auth-confirm').setValue('pass123')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(w.find('.error-msg').text()).toBe('User already registered')
  })

  it('closes modal after successful register', async () => {
    const w = factory()
    await switchToRegister(w)
    await w.find('#auth-email').setValue('new@example.com')
    await w.find('#auth-password').setValue('pass123')
    await w.find('#auth-confirm').setValue('pass123')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('submit button text shows auth.register in register mode', async () => {
    const w = factory()
    await switchToRegister(w)
    expect(w.find('.btn-primary').text()).toBe('auth.register')
  })
})

// ===========================================================================
// ADMIN REDIRECT
// ===========================================================================
describe('AuthModal — admin redirect', () => {
  it('navigates to /admin for admin users', async () => {
    fromSelectSingleMock.mockResolvedValueOnce({ data: { role: 'admin' }, error: null })

    const w = factory()
    await w.find('#auth-email').setValue('admin@test.com')
    await w.find('#auth-password').setValue('pass')
    await w.find('form').trigger('submit')
    await flushPromises()
    await new Promise((r) => setTimeout(r, 150))
    await flushPromises()

    expect(navigateToMock).toHaveBeenCalledWith('/admin')
  })

  it('navigates to redirect URL from query param', async () => {
    vi.stubGlobal('useRoute', () => ({
      params: {},
      query: { redirect: '/dashboard/vehiculos' },
    }))
    fromSelectSingleMock.mockResolvedValueOnce({ data: { role: 'user' }, error: null })

    const w = factory()
    await w.find('#auth-email').setValue('user@test.com')
    await w.find('#auth-password').setValue('pass')
    await w.find('form').trigger('submit')
    await flushPromises()
    await new Promise((r) => setTimeout(r, 150))
    await flushPromises()

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard/vehiculos')
  })

  it('blocks non-admin from admin redirect URL', async () => {
    vi.stubGlobal('useRoute', () => ({
      params: {},
      query: { redirect: '/admin/config' },
    }))
    fromSelectSingleMock.mockResolvedValueOnce({ data: { role: 'user' }, error: null })

    const w = factory()
    await w.find('#auth-email').setValue('user@test.com')
    await w.find('#auth-password').setValue('pass')
    await w.find('form').trigger('submit')
    await flushPromises()
    await new Promise((r) => setTimeout(r, 150))
    await flushPromises()

    expect(navigateToMock).not.toHaveBeenCalledWith('/admin/config')
  })
})

// ===========================================================================
// GOOGLE OAUTH
// ===========================================================================
describe('AuthModal — Google OAuth', () => {
  it('calls signInWithOAuth on Google button click', async () => {
    const w = factory()
    await w.find('.btn-google').trigger('click')
    await flushPromises()

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://tracciona.com/confirm',
      },
    })
  })

  it('includes redirect in OAuth callback when redirect query exists', async () => {
    vi.stubGlobal('useRoute', () => ({
      params: {},
      query: { redirect: '/dashboard' },
    }))

    const w = factory()
    await w.find('.btn-google').trigger('click')
    await flushPromises()

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://tracciona.com/confirm?redirect=%2Fdashboard',
      },
    })
  })

  it('shows error on OAuth failure', async () => {
    signInWithOAuthMock.mockResolvedValueOnce({
      error: { message: 'OAuth provider error' },
    })

    const w = factory()
    await w.find('.btn-google').trigger('click')
    await flushPromises()

    expect(w.find('.error-msg').text()).toBe('OAuth provider error')
  })
})

// ===========================================================================
// FORGOT PASSWORD
// ===========================================================================
describe('AuthModal — forgot password', () => {
  it('shows error when email is empty', async () => {
    const w = factory()
    await w.find('.forgot').trigger('click')
    await flushPromises()

    expect(w.find('.error-msg').text()).toBe('auth.enterEmail')
    expect(resetPasswordForEmailMock).not.toHaveBeenCalled()
  })

  it('calls resetPasswordForEmail with email', async () => {
    const w = factory()
    await w.find('#auth-email').setValue('user@test.com')
    await w.find('.forgot').trigger('click')
    await flushPromises()

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith('user@test.com', {
      redirectTo: 'https://tracciona.com/reset-password',
    })
  })

  it('closes modal after successful reset', async () => {
    const w = factory()
    await w.find('#auth-email').setValue('user@test.com')
    await w.find('.forgot').trigger('click')
    await flushPromises()

    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('shows error on reset failure', async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({
      error: new Error('Too many requests'),
    })

    const w = factory()
    await w.find('#auth-email').setValue('user@test.com')
    await w.find('.forgot').trigger('click')
    await flushPromises()

    expect(w.find('.error-msg').text()).toBe('Too many requests')
  })

  it('shows generic error on non-Error throw', async () => {
    resetPasswordForEmailMock.mockRejectedValueOnce('unexpected')

    const w = factory()
    await w.find('#auth-email').setValue('user@test.com')
    await w.find('.forgot').trigger('click')
    await flushPromises()

    expect(w.find('.error-msg').text()).toBe('common.error')
  })
})

// ===========================================================================
// ERROR MESSAGE DISPLAY
// ===========================================================================
describe('AuthModal — error display', () => {
  it('does not show error paragraph by default', () => {
    expect(factory().find('.error-msg').exists()).toBe(false)
  })

  it('clears error on close', async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Bad creds'),
    })

    const w = factory()
    await w.find('#auth-email').setValue('t@t.com')
    await w.find('#auth-password').setValue('p')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(w.find('.error-msg').exists()).toBe(true)

    await w.find('.close-btn').trigger('click')
    expect(w.find('.error-msg').exists()).toBe(false)
  })
})

// ===========================================================================
// FORM INPUT BINDING
// ===========================================================================
describe('AuthModal — input binding', () => {
  it('email input binds v-model', async () => {
    const w = factory()
    const input = w.find('#auth-email')
    await input.setValue('hello@world.com')
    expect((input.element as HTMLInputElement).value).toBe('hello@world.com')
  })

  it('password input has correct attributes', () => {
    const w = factory()
    const input = w.find('#auth-password')
    expect(input.attributes('type')).toBe('password')
    expect(input.attributes('autocomplete')).toBe('current-password')
    expect(input.attributes('minlength')).toBe('6')
  })

  it('email input has correct attributes', () => {
    const w = factory()
    const input = w.find('#auth-email')
    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('autocomplete')).toBe('email')
  })

  it('confirm password has correct autocomplete', async () => {
    const w = factory()
    await w.find('.toggle-mode .link-btn').trigger('click')
    const input = w.find('#auth-confirm')
    expect(input.exists()).toBe(true)
    expect(input.attributes('autocomplete')).toBe('new-password')
  })
})

// ===========================================================================
// ARIA / ACCESSIBILITY
// ===========================================================================
describe('AuthModal — accessibility', () => {
  it('auth panel has role="dialog"', () => {
    expect(factory().find('.auth-panel').attributes('role')).toBe('dialog')
  })

  it('auth panel has aria-label', () => {
    // $t('auth.login') returns 'auth.login' (not in setup.ts translations)
    expect(factory().find('.auth-panel').attributes('aria-label')).toBe('auth.login')
  })

  it('close button has aria-label', () => {
    // $t('common.close') maps to 'Cerrar' in setup.ts translations
    expect(factory().find('.close-btn').attributes('aria-label')).toBe('Cerrar')
  })
})
