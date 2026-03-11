/**
 * Tests for useVoiceSearch composable
 *
 * The global setup stubs ref/computed/onUnmounted so the composable
 * runs as plain JS logic. We verify the API contract and behavior.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Must import AFTER global stubs are in place (setup.ts runs first)
import { useVoiceSearch } from '../../../app/composables/useVoiceSearch'

function makeMockRecognition() {
  return {
    lang: '',
    continuous: false,
    interimResults: false,
    maxAlternatives: 1,
    onstart: null as (() => void) | null,
    onresult: null as ((e: unknown) => void) | null,
    onend: null as (() => void) | null,
    onerror: null as ((e: unknown) => void) | null,
    start: vi.fn(),
    abort: vi.fn(),
  }
}

describe('useVoiceSearch', () => {
  let mockRecognition: ReturnType<typeof makeMockRecognition>

  beforeEach(() => {
    mockRecognition = makeMockRecognition()
    // Use regular function (not arrow) so it works as a constructor with `new`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).SpeechRecognition = function MockSR() { return mockRecognition }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition
  })

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition
    vi.clearAllMocks()
  })

  it('returns required interface shape', () => {
    const vs = useVoiceSearch()
    expect(vs).toHaveProperty('isListening')
    expect(vs).toHaveProperty('transcript')
    expect(vs).toHaveProperty('error')
    expect(vs).toHaveProperty('isSupported')
    expect(vs).toHaveProperty('startListening')
    expect(vs).toHaveProperty('stopListening')
    expect(vs).toHaveProperty('reset')
  })

  it('initializes with isListening=false, transcript=""', () => {
    const { isListening, transcript, error } = useVoiceSearch()
    expect(isListening.value).toBe(false)
    expect(transcript.value).toBe('')
    expect(error.value).toBeNull()
  })

  it('isSupported=true when SpeechRecognition is present', () => {
    const { isSupported } = useVoiceSearch()
    expect(isSupported.value).toBe(true)
  })

  it('isSupported=true when webkitSpeechRecognition is present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).webkitSpeechRecognition = function MockSR() { return mockRecognition }
    const { isSupported } = useVoiceSearch()
    expect(isSupported.value).toBe(true)
  })

  it('isSupported=false when neither API exists', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition
    const { isSupported } = useVoiceSearch()
    expect(isSupported.value).toBe(false)
  })

  it('startListening sets error when not supported', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition
    const { startListening, error } = useVoiceSearch()
    startListening()
    expect(error.value).toBe('voice_not_supported')
  })

  it('startListening creates recognition with correct locale', () => {
    const { startListening } = useVoiceSearch()
    startListening('en-US')
    expect(mockRecognition.lang).toBe('en-US')
    expect(mockRecognition.start).toHaveBeenCalledTimes(1)
  })

  it('startListening uses es-ES as default locale', () => {
    const { startListening } = useVoiceSearch()
    startListening()
    expect(mockRecognition.lang).toBe('es-ES')
  })

  it('onstart callback sets isListening=true and clears error', () => {
    const { startListening, isListening, error } = useVoiceSearch()
    error.value = 'previous_error'
    startListening()
    mockRecognition.onstart?.()
    expect(isListening.value).toBe(true)
    expect(error.value).toBeNull()
  })

  it('onresult callback sets transcript', () => {
    const { startListening, transcript } = useVoiceSearch()
    startListening()
    mockRecognition.onresult?.({ results: [[{ transcript: 'camion mercedes' }]] })
    expect(transcript.value).toBe('camion mercedes')
  })

  it('onend callback sets isListening=false', () => {
    const { startListening, isListening } = useVoiceSearch()
    startListening()
    mockRecognition.onstart?.()
    mockRecognition.onend?.()
    expect(isListening.value).toBe(false)
  })

  it('onerror sets error and isListening=false', () => {
    const { startListening, isListening, error } = useVoiceSearch()
    startListening()
    mockRecognition.onstart?.()
    mockRecognition.onerror?.({ error: 'not-allowed' })
    expect(error.value).toBe('not-allowed')
    expect(isListening.value).toBe(false)
  })

  it('stopListening calls abort and sets isListening=false', () => {
    const { startListening, stopListening, isListening } = useVoiceSearch()
    startListening()
    mockRecognition.onstart?.()
    stopListening()
    expect(mockRecognition.abort).toHaveBeenCalledTimes(1)
    expect(isListening.value).toBe(false)
  })

  it('reset clears transcript and error', () => {
    const { startListening, reset, transcript, error } = useVoiceSearch()
    startListening()
    mockRecognition.onresult?.({ results: [[{ transcript: 'hello' }]] })
    mockRecognition.onerror?.({ error: 'aborted' })
    reset()
    expect(transcript.value).toBe('')
    expect(error.value).toBeNull()
  })
})
