import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { useConfirmModal } from '../../app/composables/useConfirmModal'

describe('useConfirmModal', () => {
  it('isOpen starts false', () => {
    const { isOpen } = useConfirmModal()
    expect(isOpen.value).toBe(false)
  })

  it('confirm opens modal and returns promise', () => {
    const { confirm, isOpen } = useConfirmModal()
    const promise = confirm({ title: 'Test' })
    expect(isOpen.value).toBe(true)
    expect(promise).toBeInstanceOf(Promise)
  })

  it('onConfirm resolves with true', async () => {
    const { confirm, onConfirm, isOpen } = useConfirmModal()
    const promise = confirm({ title: 'Test' })
    onConfirm()
    expect(await promise).toBe(true)
    expect(isOpen.value).toBe(false)
  })

  it('onClose resolves with false', async () => {
    const { confirm, onClose, isOpen } = useConfirmModal()
    const promise = confirm({ title: 'Test' })
    onClose()
    expect(await promise).toBe(false)
    expect(isOpen.value).toBe(false)
  })

  it('modalProps has expected shape', () => {
    const { modalProps } = useConfirmModal()
    const props = modalProps.value
    expect(props).toHaveProperty('show')
    expect(props).toHaveProperty('title')
    expect(props).toHaveProperty('message')
    expect(props).toHaveProperty('variant')
    expect(props).toHaveProperty('confirmLabel')
    expect(props).toHaveProperty('cancelLabel')
    expect(props).toHaveProperty('requireType')
  })

  it('handles sequential confirm calls', async () => {
    const { confirm, onConfirm, onClose } = useConfirmModal()
    const p1 = confirm({ title: 'First' })
    onConfirm()
    expect(await p1).toBe(true)

    const p2 = confirm({ title: 'Second' })
    onClose()
    expect(await p2).toBe(false)
  })
})
