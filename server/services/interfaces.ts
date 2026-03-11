/**
 * Service layer interfaces for dependency injection.
 *
 * These define contracts between the application layer and external services.
 * Each interface can have multiple implementations (e.g., real + mock for testing).
 *
 * Pattern:
 *   - Define interface here
 *   - Implement in server/services/{name}.ts
 *   - Register in server/services/container.ts
 *   - Consume via getService('name') in endpoints
 */

// --- Notification Service ---

export interface NotificationPayload {
  to: string // email, phone, or user ID
  subject?: string
  body: string
  channel: 'email' | 'push' | 'sms' | 'whatsapp'
  metadata?: Record<string, unknown>
}

export interface INotificationService {
  send(
    payload: NotificationPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: string }>
  sendBatch(payloads: NotificationPayload[]): Promise<{ sent: number; failed: number }>
}

// --- Storage Service ---

export interface StorageUploadOptions {
  bucket: string
  path: string
  contentType?: string
  upsert?: boolean
}

export interface StorageFile {
  url: string
  path: string
  size: number
  contentType: string
}

export interface IStorageService {
  upload(data: Buffer | Blob, options: StorageUploadOptions): Promise<StorageFile>
  delete(bucket: string, paths: string[]): Promise<{ deleted: number }>
  getPublicUrl(bucket: string, path: string): string
  list(bucket: string, prefix?: string): Promise<StorageFile[]>
}

// --- Image Processing Service ---

export interface ImageTransformOptions {
  width?: number
  height?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  quality?: number
  fit?: 'cover' | 'contain' | 'fill'
}

export interface IImageService {
  upload(file: Buffer, filename: string): Promise<{ url: string; publicId: string }>
  transform(publicId: string, options: ImageTransformOptions): string
  delete(publicId: string): Promise<void>
}

// --- AI Service ---

export interface AICompletionOptions {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  model?: string
}

export interface IAIService {
  complete(
    options: AICompletionOptions,
  ): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number } }>
  isAvailable(): boolean
}

// --- Payment Service ---

export interface PaymentCheckoutOptions {
  priceId: string
  customerId?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface PaymentSubscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd: Date
  planId: string
}

export interface IPaymentService {
  createCheckout(options: PaymentCheckoutOptions): Promise<{ url: string; sessionId: string }>
  getSubscription(subscriptionId: string): Promise<PaymentSubscription | null>
  cancelSubscription(subscriptionId: string): Promise<void>
  createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }>
}

// --- Email Service ---

export interface EmailOptions {
  to: string | string[]
  from?: string
  subject: string
  html: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}

export interface IEmailService {
  send(options: EmailOptions): Promise<{ id: string }>
  sendBatch(emails: EmailOptions[]): Promise<{ sent: number; failed: number }>
}

// --- Cache Service ---

export interface ICacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  delete(key: string): Promise<void>
  flush(): Promise<void>
}

// --- Service Container ---

export interface ServiceContainer {
  notification: INotificationService
  storage: IStorageService
  image: IImageService
  ai: IAIService
  payment: IPaymentService
  email: IEmailService
  cache: ICacheService
}

export type ServiceName = keyof ServiceContainer
