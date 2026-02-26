import { describe, it, expect, afterEach } from 'vitest'

describe('aiConfig', () => {
  const origFast = process.env.AI_MODEL_FAST
  const origVision = process.env.AI_MODEL_VISION
  const origContent = process.env.AI_MODEL_CONTENT

  afterEach(() => {
    if (origFast !== undefined) process.env.AI_MODEL_FAST = origFast
    else delete process.env.AI_MODEL_FAST
    if (origVision !== undefined) process.env.AI_MODEL_VISION = origVision
    else delete process.env.AI_MODEL_VISION
    if (origContent !== undefined) process.env.AI_MODEL_CONTENT = origContent
    else delete process.env.AI_MODEL_CONTENT
  })

  it('has default models when env vars not set', async () => {
    delete process.env.AI_MODEL_FAST
    delete process.env.AI_MODEL_VISION
    delete process.env.AI_MODEL_CONTENT
    const { AI_MODELS } = await import('../../../server/utils/aiConfig')

    expect(AI_MODELS.fast).toContain('claude')
    expect(AI_MODELS.vision).toContain('claude')
    expect(AI_MODELS.content).toContain('claude')
  })

  it('exports AIModelRole type with 3 keys', async () => {
    const { AI_MODELS } = await import('../../../server/utils/aiConfig')
    const keys = Object.keys(AI_MODELS)
    expect(keys).toContain('fast')
    expect(keys).toContain('vision')
    expect(keys).toContain('content')
    expect(keys).toHaveLength(3)
  })
})
