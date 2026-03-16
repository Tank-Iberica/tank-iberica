/**
 * useVoiceSearch — Web Speech API composable
 *
 * Provides voice-to-text input for search fields.
 * Works in Chrome/Edge/Safari (webkitSpeechRecognition or SpeechRecognition).
 * Firefox does not support Speech Recognition — isSupported will be false.
 *
 * Usage:
 *   const { isListening, transcript, isSupported, startListening, stopListening, reset } = useVoiceSearch()
 */

/** Web Speech API types — not in standard lib.dom.d.ts */
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: ((ev: Event) => void) | null
  onresult:
    | ((ev: {
        results: {
          [index: number]: { [index: number]: { transcript: string } | undefined } | undefined
        }
      }) => void)
    | null
  onend: ((ev: Event) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance
type WindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionCtor
  webkitSpeechRecognition?: SpeechRecognitionCtor
}

export interface UseVoiceSearch {
  isListening: Ref<boolean>
  transcript: Ref<string>
  error: Ref<string | null>
  isSupported: ComputedRef<boolean>
  startListening: (locale?: string) => void
  stopListening: () => void
  reset: () => void
}

export function useVoiceSearch(): UseVoiceSearch {
  const isListening = ref(false)
  const transcript = ref('')
  const error = ref<string | null>(null)

  const isSupported = computed<boolean>(() => {
    if (import.meta.server) return false
    return (
      globalThis.window !== undefined &&
      ('SpeechRecognition' in globalThis || 'webkitSpeechRecognition' in globalThis)
    )
  })

  let recognition: SpeechRecognitionInstance | null = null

  const startListening = (locale = 'es-ES'): void => {
    if (!isSupported.value) {
      error.value = 'voice_not_supported'
      return
    }

    const w = globalThis.window as unknown as WindowWithSpeech
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) return
    recognition = new SpeechRecognitionAPI()
    recognition.lang = locale
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = (): void => {
      isListening.value = true
      error.value = null
    }

    recognition.onresult = (e): void => {
      transcript.value = e.results[0]?.[0]?.transcript ?? ''
    }

    recognition.onend = (): void => {
      isListening.value = false
    }

    recognition.onerror = (e): void => {
      isListening.value = false
      error.value = e.error ?? 'voice_error'
    }

    recognition.start()
  }

  const stopListening = (): void => {
    recognition?.abort()
    isListening.value = false
  }

  const reset = (): void => {
    transcript.value = ''
    error.value = null
  }

  onUnmounted(() => {
    recognition?.abort()
  })

  return { isListening, transcript, error, isSupported, startListening, stopListening, reset }
}
