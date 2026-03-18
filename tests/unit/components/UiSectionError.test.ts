/**
 * Tests for UiSectionError component.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'

// Stub NuxtErrorBoundary with controllable error state
function createStub(hasError = false) {
  return defineComponent({
    name: 'NuxtErrorBoundary',
    emits: ['error'],
    setup(_, { slots }) {
      const error = ref(hasError ? new Error('Test error') : null)
      return () => {
        if (error.value) {
          return slots.error?.({
            error: error.value,
            clearError: () => { error.value = null },
          })
        }
        return slots.default?.()
      }
    },
  })
}

// Stub i18n
vi.stubGlobal('useI18n', () => ({ t: (_k: string, fb: string) => fb }))

import UiSectionError from '../../../app/components/ui/UiSectionError.vue'

const globalMocks = {
  $t: (_key: string, fallback: string) => fallback,
}

describe('UiSectionError', () => {
  it('renders slot content when no error', () => {
    const wrapper = mount(UiSectionError, {
      global: { stubs: { NuxtErrorBoundary: createStub(false) }, mocks: globalMocks },
      slots: { default: '<div class="content">OK</div>' },
    })
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.find('.section-error').exists()).toBe(false)
  })

  it('shows error fallback when error occurs', () => {
    const wrapper = mount(UiSectionError, {
      global: { stubs: { NuxtErrorBoundary: createStub(true) }, mocks: globalMocks },
    })
    expect(wrapper.find('.section-error').exists()).toBe(true)
  })

  it('shows default error message', () => {
    const wrapper = mount(UiSectionError, {
      global: { stubs: { NuxtErrorBoundary: createStub(true) }, mocks: globalMocks },
    })
    expect(wrapper.text()).toContain('No se pudo cargar esta sección')
  })

  it('shows custom error message', () => {
    const wrapper = mount(UiSectionError, {
      global: { stubs: { NuxtErrorBoundary: createStub(true) }, mocks: globalMocks },
      props: { message: 'Error personalizado' },
    })
    expect(wrapper.text()).toContain('Error personalizado')
  })

  it('shows retry button', () => {
    const wrapper = mount(UiSectionError, {
      global: { stubs: { NuxtErrorBoundary: createStub(true) }, mocks: globalMocks },
    })
    const btn = wrapper.find('.section-error-retry')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Reintentar')
  })

  it('has role="alert" on error container', () => {
    const wrapper = mount(UiSectionError, {
      global: { stubs: { NuxtErrorBoundary: createStub(true) }, mocks: globalMocks },
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('renders warning icon in error state', () => {
    const wrapper = mount(UiSectionError, {
      global: { stubs: { NuxtErrorBoundary: createStub(true) }, mocks: globalMocks },
    })
    expect(wrapper.find('.section-error svg').exists()).toBe(true)
  })
})
