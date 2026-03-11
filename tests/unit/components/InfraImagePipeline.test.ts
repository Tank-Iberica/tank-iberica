/**
 * Tests for app/components/admin/infra/InfraImagePipeline.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import InfraImagePipeline from '../../../app/components/admin/infra/InfraImagePipeline.vue'

describe('InfraImagePipeline', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(InfraImagePipeline, {
      props: {
        pipelineMode: 'hybrid',
        cloudinaryOnlyCount: 42,
        cfImagesCount: 158,
        migratingImages: false,
        configuringVariants: false,
        pipelineMessage: '',
        pipelineMessageType: 'success' as const,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string, fallback?: string) => fallback || k },
      },
    })

  it('renders section block', () => {
    expect(factory().find('.section-block').exists()).toBe(true)
  })

  it('shows heading', () => {
    expect(factory().find('.section-heading').text()).toContain('Pipeline')
  })

  it('shows 3 pipeline cards', () => {
    expect(factory().findAll('.pipeline-card')).toHaveLength(3)
  })

  it('shows pipeline mode', () => {
    expect(factory().findAll('.pipeline-value')[0].text()).toBe('hybrid')
  })

  it('shows cloudinary count', () => {
    expect(factory().findAll('.pipeline-value')[1].text()).toBe('42')
  })

  it('shows cf images count', () => {
    expect(factory().findAll('.pipeline-value')[2].text()).toBe('158')
  })

  it('shows migrate button', () => {
    expect(factory().find('.btn-primary').text()).toContain('Migrar')
  })

  it('shows setup variants button', () => {
    expect(factory().find('.btn-secondary').text()).toContain('Configurar')
  })

  it('disables migrate when migrating', () => {
    const w = factory({ migratingImages: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows migrating text', () => {
    const w = factory({ migratingImages: true })
    expect(w.find('.btn-primary').text()).toContain('Migrando')
  })

  it('disables setup when configuring', () => {
    const w = factory({ configuringVariants: true })
    expect(w.find('.btn-secondary').attributes('disabled')).toBeDefined()
  })

  it('shows configuring text', () => {
    const w = factory({ configuringVariants: true })
    expect(w.find('.btn-secondary').text()).toContain('Configurando')
  })

  it('emits migrate-images on button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('migrate-images')).toBeTruthy()
  })

  it('emits setup-cf-variants on button click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('setup-cf-variants')).toBeTruthy()
  })

  it('shows pipeline message when set', () => {
    const w = factory({ pipelineMessage: 'Migration complete' })
    expect(w.find('.pipeline-message').text()).toBe('Migration complete')
  })

  it('hides pipeline message when empty', () => {
    expect(factory().find('.pipeline-message').exists()).toBe(false)
  })

  it('applies message type class', () => {
    const w = factory({ pipelineMessage: 'Error', pipelineMessageType: 'error' })
    expect(w.find('.pipeline-message').classes()).toContain('error')
  })
})
