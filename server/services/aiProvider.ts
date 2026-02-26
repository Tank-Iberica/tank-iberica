/**
 * Multi-provider AI wrapper with failover.
 *
 * Supports Anthropic (primary) and OpenAI (fallback).
 * Automatically retries and falls back between providers
 * based on the selected preset (realtime, background, deferred).
 */
import { fetchWithRetry } from '~~/server/utils/fetchWithRetry'
import { AI_MODELS, type AIModelRole } from '~~/server/utils/aiConfig'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AIProviderConfig {
  timeoutMs: number
  maxRetries: number
}

export interface AIProvider {
  name: 'anthropic' | 'openai'
  model: string
  apiKey: string
  endpoint: string
}

export interface AIImageBlock {
  type: 'image'
  source: { type: 'base64'; media_type: string; data: string }
}

export interface AITextBlock {
  type: 'text'
  text: string
}

export type AIContentBlock = AIImageBlock | AITextBlock

export interface AIRequest {
  messages: Array<{ role: string; content: string | AIContentBlock[] }>
  maxTokens: number
  system?: string
}

export interface AIResponse {
  text: string
  provider: string
  model: string
  latencyMs: number
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const AI_PRESETS: Record<string, AIProviderConfig> = {
  realtime: { timeoutMs: 8_000, maxRetries: 1 },
  background: { timeoutMs: 30_000, maxRetries: 2 },
  deferred: { timeoutMs: 60_000, maxRetries: 3 },
}

// ---------------------------------------------------------------------------
// OpenAI fallback model mapping
// ---------------------------------------------------------------------------

const openaiModels: Record<string, string> = {
  fast: process.env.AI_FALLBACK_MODEL_FAST || 'gpt-4o-mini',
  vision: process.env.AI_FALLBACK_MODEL_VISION || 'gpt-4o',
  content: process.env.AI_FALLBACK_MODEL_CONTENT || 'gpt-4o',
}

// ---------------------------------------------------------------------------
// Provider-specific callers
// ---------------------------------------------------------------------------

async function callAnthropic(
  provider: AIProvider,
  request: AIRequest,
  opts: AIProviderConfig,
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs)

  try {
    const body: Record<string, unknown> = {
      model: provider.model,
      max_tokens: request.maxTokens,
      messages: request.messages,
    }

    if (request.system) {
      body.system = request.system
    }

    const response = await fetchWithRetry(
      provider.endpoint,
      {
        method: 'POST',
        headers: {
          'x-api-key': provider.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
      { maxRetries: opts.maxRetries },
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${errorBody}`)
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>
    }

    const text = data?.content?.[0]?.text
    if (!text) {
      throw new Error('Empty response from Anthropic')
    }

    return text
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI(
  provider: AIProvider,
  request: AIRequest,
  opts: AIProviderConfig,
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs)

  try {
    // Convert Anthropic format to OpenAI format
    const messages: Array<{ role: string; content: string | unknown[] }> = []

    if (request.system) {
      messages.push({ role: 'system', content: request.system })
    }

    for (const msg of request.messages) {
      if (typeof msg.content === 'string') {
        messages.push({ role: msg.role, content: msg.content })
      } else {
        // Convert multimodal blocks to OpenAI format
        const parts: unknown[] = msg.content.map((block) => {
          if (block.type === 'text') {
            return { type: 'text', text: block.text }
          }
          // image block → OpenAI image_url format
          return {
            type: 'image_url',
            image_url: {
              url: `data:${block.source.media_type};base64,${block.source.data}`,
            },
          }
        })
        messages.push({ role: msg.role, content: parts })
      }
    }

    const response = await fetchWithRetry(
      provider.endpoint,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: request.maxTokens,
          messages,
        }),
        signal: controller.signal,
      },
      { maxRetries: opts.maxRetries },
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`)
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>
    }

    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      throw new Error('Empty response from OpenAI')
    }

    return text
  } finally {
    clearTimeout(timeout)
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function callAI(
  request: AIRequest,
  preset: keyof typeof AI_PRESETS,
  modelRole: AIModelRole,
): Promise<AIResponse> {
  const config = useRuntimeConfig()
  const opts = AI_PRESETS[preset]

  if (!opts) {
    throw new Error(`Unknown AI preset: ${String(preset)}`)
  }

  // Build provider list — Anthropic first, OpenAI as fallback
  const providers: AIProvider[] = []

  const anthropicKey = config.anthropicApiKey as string | undefined
  if (anthropicKey) {
    providers.push({
      name: 'anthropic',
      model: AI_MODELS[modelRole],
      apiKey: anthropicKey,
      endpoint: 'https://api.anthropic.com/v1/messages',
    })
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    providers.push({
      name: 'openai',
      model: openaiModels[modelRole] || 'gpt-4o-mini',
      apiKey: openaiKey,
      endpoint: 'https://api.openai.com/v1/chat/completions',
    })
  }

  if (providers.length === 0) {
    throw new Error('No AI provider API keys configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)')
  }

  // Try each provider in order
  const errors: string[] = []

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]!
    const start = Date.now()

    try {
      let text: string

      if (provider.name === 'anthropic') {
        text = await callAnthropic(provider, request, opts)
      } else {
        text = await callOpenAI(provider, request, opts)
      }

      const latencyMs = Date.now() - start

      // Log warning if fallback was used
      if (i > 0) {
        console.warn(
          `[aiProvider] Fallback used: ${provider.name}/${provider.model} ` +
            `(primary failed: ${errors.join('; ')})`,
        )
      }

      return {
        text,
        provider: provider.name,
        model: provider.model,
        latencyMs,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`${provider.name}: ${message}`)
    }
  }

  throw new Error(`All AI providers failed: ${errors.join('; ')}`)
}
