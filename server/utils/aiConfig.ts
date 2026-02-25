// server/utils/aiConfig.ts
export const AI_MODELS = {
  fast: process.env.AI_MODEL_FAST || 'claude-3-5-haiku-20241022',
  vision: process.env.AI_MODEL_VISION || 'claude-sonnet-4-5-20250929',
  content: process.env.AI_MODEL_CONTENT || 'claude-sonnet-4-5-20250929',
} as const

export type AIModelRole = keyof typeof AI_MODELS
