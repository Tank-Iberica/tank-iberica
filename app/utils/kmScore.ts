/**
 * Km/Usage reliability score algorithm.
 * Analyzes odometer/hour progression between official inspections (ITV).
 * Adaptable to all verticals via unit parameter.
 */

export interface InspectionRecord {
  date: string // ISO date of inspection
  value: number // Km, hours, or cycles reading at inspection
  result?: string // 'pass' | 'fail' | 'conditional' (optional)
}

export interface UsageAnalysis {
  score: number // 0-100
  label: string // Translated label key
  labelKey: string // i18n key for label
  explanation: string // Human-readable explanation
  explanationKey: string // i18n key for explanation
  dataPoints: InspectionDataPoint[] // For chart visualization
  anomalies: Anomaly[] // Detected issues
  avgPerYear: number // Average usage per year
  totalInspections: number
}

export interface InspectionDataPoint {
  date: string
  value: number
  deltaFromPrevious: number | null
  yearsBetween: number | null
  ratePerYear: number | null
}

export interface Anomaly {
  type: 'decrease' | 'spike' | 'gap'
  fromDate: string
  toDate: string
  fromValue: number
  toValue: number
  description: string
}

type UsageUnit = 'km' | 'hours' | 'cycles'

const UNIT_CONFIG: Record<
  UsageUnit,
  {
    maxReasonablePerYear: number
    unitLabel: string
  }
> = {
  km: { maxReasonablePerYear: 150000, unitLabel: 'km' },
  hours: { maxReasonablePerYear: 5000, unitLabel: 'h' },
  cycles: { maxReasonablePerYear: 10000, unitLabel: 'cycles' },
}

/**
 * Analyze usage reliability from inspection history.
 * Returns a score from 0 (fraud) to 100 (very reliable).
 */
export function analyzeUsageReliability(
  history: InspectionRecord[],
  unit: UsageUnit = 'km',
): UsageAnalysis {
  const config = UNIT_CONFIG[unit]

  if (history.length < 2) {
    return {
      score: 50,
      label: 'Datos insuficientes',
      labelKey: 'verification.kmScore.insufficientData',
      explanation: `Solo ${history.length} inspeccion(es) registrada(s). Se necesitan al menos 2 para analizar la progresion.`,
      explanationKey: 'verification.kmScore.insufficientDataExplanation',
      dataPoints: history.map((h) => ({
        date: h.date,
        value: h.value,
        deltaFromPrevious: null,
        yearsBetween: null,
        ratePerYear: null,
      })),
      anomalies: [],
      avgPerYear: 0,
      totalInspections: history.length,
    }
  }

  // Sort by date ascending
  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  // Build data points with deltas
  const dataPoints: InspectionDataPoint[] = []
  const anomalies: Anomaly[] = []
  const rates: number[] = []

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!
    const prev = i > 0 ? sorted[i - 1]! : null

    let delta: number | null = null
    let yearsBetween: number | null = null
    let ratePerYear: number | null = null

    if (prev) {
      delta = current.value - prev.value
      const msGap = new Date(current.date).getTime() - new Date(prev.date).getTime()
      yearsBetween = msGap / (365.25 * 24 * 60 * 60 * 1000)

      if (yearsBetween > 0.1) {
        ratePerYear = delta / yearsBetween
        rates.push(ratePerYear)
      }

      // Detect anomalies
      if (delta < 0) {
        anomalies.push({
          type: 'decrease',
          fromDate: prev.date,
          toDate: current.date,
          fromValue: prev.value,
          toValue: current.value,
          description: `${config.unitLabel} disminuyeron de ${prev.value.toLocaleString()} a ${current.value.toLocaleString()}`,
        })
      } else if (ratePerYear !== null && ratePerYear > config.maxReasonablePerYear) {
        anomalies.push({
          type: 'spike',
          fromDate: prev.date,
          toDate: current.date,
          fromValue: prev.value,
          toValue: current.value,
          description: `Incremento excesivo: ${Math.round(ratePerYear).toLocaleString()} ${config.unitLabel}/año`,
        })
      }
    }

    dataPoints.push({
      date: current.date,
      value: current.value,
      deltaFromPrevious: delta,
      yearsBetween,
      ratePerYear,
    })
  }

  // Calculate average rate per year
  const avgPerYear = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0

  // Calculate score
  const score = calculateScore(anomalies, rates, config.maxReasonablePerYear)

  // Determine label and explanation
  const { label, labelKey, explanation, explanationKey } = getScoreLabels(
    score,
    sorted.length,
    sorted[0]!.date,
    sorted[sorted.length - 1]!.date,
    avgPerYear,
    config.unitLabel,
    anomalies,
  )

  return {
    score,
    label,
    labelKey,
    explanation,
    explanationKey,
    dataPoints,
    anomalies,
    avgPerYear: Math.round(avgPerYear),
    totalInspections: sorted.length,
  }
}

/**
 * Convenience function for km analysis (Tracciona default).
 */
export function analyzeKmReliability(itvHistory: InspectionRecord[]): UsageAnalysis {
  return analyzeUsageReliability(itvHistory, 'km')
}

function calculateScore(anomalies: Anomaly[], rates: number[], maxReasonable: number): number {
  let score = 100

  // Major penalty for decreases (fraud indicator)
  const decreases = anomalies.filter((a) => a.type === 'decrease')
  score -= decreases.length * 40

  // Moderate penalty for spikes
  const spikes = anomalies.filter((a) => a.type === 'spike')
  score -= spikes.length * 20

  // Consistency bonus/penalty
  if (rates.length >= 2) {
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0

    // High coefficient of variation = inconsistent
    if (cv > 1.0) score -= 15
    else if (cv > 0.5) score -= 5
  }

  // Very high average is suspicious even without spikes
  if (rates.length > 0) {
    const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length
    if (avgRate > maxReasonable * 0.8) score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

function getScoreLabels(
  score: number,
  inspections: number,
  firstDate: string,
  lastDate: string,
  avgPerYear: number,
  unitLabel: string,
  anomalies: Anomaly[],
): { label: string; labelKey: string; explanation: string; explanationKey: string } {
  const firstYear = new Date(firstDate).getFullYear()
  const lastYear = new Date(lastDate).getFullYear()
  const avgFormatted = Math.round(avgPerYear).toLocaleString()

  let label: string
  let labelKey: string

  if (score >= 80) {
    label = 'Muy fiable'
    labelKey = 'verification.kmScore.veryReliable'
  } else if (score >= 60) {
    label = 'Fiable'
    labelKey = 'verification.kmScore.reliable'
  } else if (score >= 40) {
    label = 'Con reservas'
    labelKey = 'verification.kmScore.withReservations'
  } else if (score >= 20) {
    label = 'Sospechoso'
    labelKey = 'verification.kmScore.suspicious'
  } else {
    label = 'Manipulado'
    labelKey = 'verification.kmScore.tampered'
  }

  let explanation: string
  let explanationKey: string

  if (anomalies.length === 0 && score >= 80) {
    explanation = `${inspections} inspecciones ITV verificadas (${firstYear}-${lastYear}). Progresion consistente: ~${avgFormatted} ${unitLabel}/año. Sin anomalias detectadas.`
    explanationKey = 'verification.kmScore.explanationConsistent'
  } else if (anomalies.some((a) => a.type === 'decrease')) {
    explanation = `Se detectaron ${unitLabel} que disminuyen entre inspecciones, lo cual indica posible manipulacion del odometro.`
    explanationKey = 'verification.kmScore.explanationDecrease'
  } else if (anomalies.some((a) => a.type === 'spike')) {
    explanation = `Se detectaron incrementos inusualmente altos de ${unitLabel} entre inspecciones.`
    explanationKey = 'verification.kmScore.explanationSpike'
  } else {
    explanation = `${inspections} inspecciones analizadas (${firstYear}-${lastYear}). Media: ~${avgFormatted} ${unitLabel}/año.`
    explanationKey = 'verification.kmScore.explanationGeneral'
  }

  return { label, labelKey, explanation, explanationKey }
}
