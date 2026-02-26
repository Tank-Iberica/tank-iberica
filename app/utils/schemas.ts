/**
 * Zod validation schemas — shared between client and server.
 *
 * Naming convention: <entity>Schema  (e.g. loginSchema, registerSchema)
 * Types derived via z.infer<typeof schema>
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reusable email field */
const email = () => z.string().min(1, 'validation.required').email('validation.emailInvalid')

/** Reusable password field (min 6 chars — matches current auth rules) */
const password = (min = 6) => z.string().min(min, { message: 'validation.passwordMin' })

/** Reusable phone field (optional, 6-20 digits/spaces/dashes) */
const phone = () =>
  z
    .string()
    .regex(/^[\d\s+()-]{6,20}$/, 'validation.phoneInvalid')
    .or(z.literal(''))
    .optional()

/** Reusable required phone */
const phoneRequired = () =>
  z
    .string()
    .min(1, 'validation.required')
    .regex(/^[\d\s+()-]{6,20}$/, 'validation.phoneInvalid')

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: email(),
  password: z.string().min(1, 'validation.required'),
})

export type LoginForm = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'validation.required'),
    email: email(),
    password: password(6),
    confirmPassword: z.string().min(1, 'validation.required'),
    // Dealer-only fields (optional)
    companyName: z.string().optional(),
    taxId: z.string().optional(),
    phone: phone(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword'],
  })

export type RegisterForm = z.infer<typeof registerSchema>

export const passwordResetSchema = z.object({
  email: email(),
})

export type PasswordResetForm = z.infer<typeof passwordResetSchema>

export const newPasswordSchema = z
  .object({
    password: password(6),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword'],
  })

export type NewPasswordForm = z.infer<typeof newPasswordSchema>

// ---------------------------------------------------------------------------
// Contact / Lead schemas
// ---------------------------------------------------------------------------

export const inspectionRequestSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  email: email(),
  phone: phoneRequired(),
  preferredDate: z.string().optional(),
  notes: z.string().optional(),
})

export type InspectionRequestForm = z.infer<typeof inspectionRequestSchema>

// ---------------------------------------------------------------------------
// Vehicle advertisement schema
// ---------------------------------------------------------------------------

export const advertisementContactSchema = z.object({
  contactName: z.string().min(1, 'validation.required'),
  contactEmail: email(),
  contactPhone: phoneRequired(),
  contactPreference: z.enum(['email', 'phone', 'whatsapp']).default('email'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'validation.termsRequired' }),
  }),
})

export type AdvertisementContactForm = z.infer<typeof advertisementContactSchema>

// ---------------------------------------------------------------------------
// Valuation schema
// ---------------------------------------------------------------------------

export const valuationSchema = z.object({
  brand: z.string().min(1, 'validation.required'),
  model: z.string().min(1, 'validation.required'),
  year: z
    .number({ invalid_type_error: 'validation.required' })
    .int()
    .min(1970, 'validation.yearMin')
    .max(new Date().getFullYear() + 1, 'validation.yearMax'),
  kilometres: z.number().int().min(0).optional(),
  province: z.string().optional(),
  subcategoryId: z.string().optional(),
  email: z.string().email('validation.emailInvalid').or(z.literal('')).optional(),
})

export type ValuationForm = z.infer<typeof valuationSchema>

// ---------------------------------------------------------------------------
// Profile schemas
// ---------------------------------------------------------------------------

export const changePasswordSchema = z
  .object({
    newPassword: password(8),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword'],
  })

export type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export const deleteAccountSchema = z.object({
  confirmation: z.literal('ELIMINAR', {
    errorMap: () => ({ message: 'validation.deleteConfirmation' }),
  }),
})

export type DeleteAccountForm = z.infer<typeof deleteAccountSchema>
