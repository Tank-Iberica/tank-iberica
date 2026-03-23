/**
 * DGT/InfoCar Report Integration
 *
 * Pattern: pluggable provider
 * Accepts: { vehicleId, matricula, provider?: 'infocar' | 'carvertical' | 'manual' }
 * Returns: { success, reportUrl?, kmScore?, error? }
 *
 * This is a placeholder that defines the structure.
 * The actual API integration will be configured when API keys are available.
 *
 * POST /api/dgt-report
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { safeError } from '../utils/safeError'
import { validateBody } from '../utils/validateBody'
import { logger } from '../utils/logger'
import { createReportAdapter } from '../utils/vehicleReportProvider'
import { analyzeKmReliability } from '../../app/utils/kmScore'

/**
 * Spanish matricula formats:
 * - Modern (post-2000): 4 digits + 3 letters (e.g. 1234 BCD)
 * - Old provincial: 1-2 letters + 4-6 digits + 0-2 letters (e.g. M 1234 AB)
 * We accept a relaxed pattern: alphanumeric with optional spaces/hyphens.
 */
const MATRICULA_REGEX = /^[A-Z0-9]{1,4}[\s-]?[A-Z0-9]{2,6}[\s-]?[A-Z0-9]{0,3}$/i

const dgtReportSchema = z.object({
  vehicleId: z.string().uuid(),
  matricula: z
    .string()
    .min(1)
    .max(20)
    .refine((v) => MATRICULA_REGEX.test(v.trim()), { message: 'matricula format is invalid' }),
  provider: z.enum(['infocar', 'carvertical', 'manual']).optional(),
})

type ReportProvider = 'infocar' | 'carvertical' | 'manual'

interface DgtReportResponse {
  success: boolean
  reportUrl?: string
  kmScore?: number
  documentId?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<DgtReportResponse> => {
  // 1. Authenticate user
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  // 2. Get Supabase service role client for DB operations
  const supabase = serverSupabaseServiceRole(event)

  // 3. Verify the user is an admin
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !userProfile) {
    throw safeError(500, 'Failed to verify user permissions')
  }

  if (userProfile.role !== 'admin') {
    throw safeError(403, 'Admin access required')
  }

  // 4. Read and validate body
  const body = await validateBody(event, dgtReportSchema)

  const vehicleId = body.vehicleId
  const matricula = body.matricula.trim().toUpperCase()
  const provider: ReportProvider = body.provider ?? 'infocar'

  // 5. Verify the vehicle exists
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, brand, model, year, verification_level')
    .eq('id', vehicleId)
    .single()

  if (vehicleError || !vehicle) {
    throw safeError(404, 'Vehicle not found')
  }

  // 6. Call report provider (InfoCar → CarVertical → mock fallback)
  const adapterType = provider === 'manual' ? undefined : provider
  const adapter = await createReportAdapter(adapterType)
  let report
  try {
    report = await adapter.fetchReport(matricula)
  } catch (err) {
    logger.error('[dgt-report] Provider fetch failed', {
      error: String(err),
      provider: adapter.name,
    })
    throw safeError(502, 'Report provider unavailable')
  }

  const now = new Date().toISOString()

  // Calculate KmScore from real ITV progression (#57)
  const itvRecords = report.itvHistory
    .filter((itv) => itv.km !== null)
    .map((itv) => ({ date: itv.date, value: itv.km as number, result: itv.result }))
  const kmAnalysis = analyzeKmReliability(itvRecords)

  const reportData = {
    provider: adapter.name,
    matricula,
    requestedAt: now,
    status: 'completed' as const,
    kmHistory: report.kmHistory,
    itvHistory: report.itvHistory,
    kmScore: kmAnalysis.score,
    kmScoreLabel: kmAnalysis.label,
    kmScoreExplanation: kmAnalysis.explanation,
    kmScoreAnomalies: kmAnalysis.anomalies,
    reportUrl: `${getSiteUrl()}/reports/${vehicleId}/${adapter.name}`,
    previousOwners: report.totalOwners,
    technicalInspectionValid: report.lastITV?.result === 'favorable',
    lastItvDate: report.lastITV?.date ?? null,
  }

  // 7. Save report to verification_documents
  const { data: document, error: insertError } = await (
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('verification_documents') as any
  )
    .insert({
      vehicle_id: vehicleId,
      doc_type: 'dgt_report',
      status: 'verified',
      level: 3,
      file_url: reportData.reportUrl,
      generated_at: now,
      verified_by: user.id,
      data: reportData,
    })
    .select('id')
    .single()

  if (insertError) {
    logger.error('[dgt-report] Failed to save report', { error: insertError.message })
    throw safeError(500, 'Failed to save report')
  }

  // 8. Update vehicle verification_level to audited (level 3) if currently lower
  const currentLevel = Number(vehicle.verification_level ?? 0)
  if (currentLevel < 3) {
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        verification_level: '3',
        updated_at: now,
      })
      .eq('id', vehicleId)

    if (updateError) {
      logger.error('[dgt-report] Failed to update vehicle verification level', {
        error: updateError.message,
      })
      throw safeError(500, 'Failed to update vehicle verification level')
    }
  }

  return {
    success: true,
    reportUrl: reportData.reportUrl,
    kmScore: reportData.kmScore,
    documentId: document.id,
  }
})
