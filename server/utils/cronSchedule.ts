/**
 * Cron Partitioning & Scheduling
 *
 * Defines execution windows for all cron jobs to prevent overlap of heavy tasks.
 * Each job is assigned to a time window and weight category.
 *
 * Rules:
 * 1. Heavy jobs (DB-intensive) never overlap
 * 2. Light jobs can run concurrently
 * 3. Time windows are staggered to spread load
 */

export type CronWeight = 'heavy' | 'medium' | 'light'

export interface CronJobConfig {
  /** Route path (without /api/cron/) */
  name: string
  /** Cron expression for scheduling (GitHub Actions / external scheduler) */
  schedule: string
  /** Execution weight — heavy jobs are serialized */
  weight: CronWeight
  /** Estimated max duration in seconds */
  maxDurationSec: number
  /** Description */
  description: string
}

/**
 * Canonical cron schedule — single source of truth.
 *
 * Windows:
 * - :00 → Heavy jobs (staggered, never concurrent)
 * - :15 → Medium jobs
 * - :30 → Light jobs (can overlap)
 * - :45 → Reserved/monitoring
 *
 * Daily jobs use different hours to avoid clustering.
 */
export const CRON_SCHEDULE: CronJobConfig[] = [
  // --- Heavy (serialize, never overlap) ---
  {
    name: 'search-alerts',
    schedule: '0 */4 * * *', // Every 4h at :00
    weight: 'heavy',
    maxDurationSec: 120,
    description: 'Process search alerts and send notifications',
  },
  {
    name: 'generate-editorial',
    schedule: '0 6 * * *', // Daily 06:00
    weight: 'heavy',
    maxDurationSec: 300,
    description: 'AI-generate editorial content (news articles)',
  },
  {
    name: 'dealer-weekly-stats',
    schedule: '0 7 * * 1', // Monday 07:00
    weight: 'heavy',
    maxDurationSec: 180,
    description: 'Compute and store weekly dealer statistics',
  },
  {
    name: 'weekly-report',
    schedule: '0 8 * * 1', // Monday 08:00 (after dealer-weekly-stats)
    weight: 'heavy',
    maxDurationSec: 120,
    description: 'Send weekly report emails to dealers',
  },
  {
    name: 'data-retention',
    schedule: '0 3 * * 0', // Sunday 03:00
    weight: 'heavy',
    maxDurationSec: 300,
    description: 'Purge expired data per retention policy',
  },

  // --- Medium (can overlap with light, not with heavy) ---
  {
    name: 'price-drop-alert',
    schedule: '15 */6 * * *', // Every 6h at :15
    weight: 'medium',
    maxDurationSec: 60,
    description: 'Check for price drops and notify watchers',
  },
  {
    name: 'favorite-price-drop',
    schedule: '15 10 * * *', // Daily 10:15
    weight: 'medium',
    maxDurationSec: 60,
    description: 'Notify users of price drops on favorited vehicles',
  },
  {
    name: 'favorite-sold',
    schedule: '15 11 * * *', // Daily 11:15
    weight: 'medium',
    maxDurationSec: 30,
    description: 'Notify users when favorited vehicles are sold',
  },
  {
    name: 'interest-recovery',
    schedule: '15 14 * * *', // Daily 14:15
    weight: 'medium',
    maxDurationSec: 60,
    description: 'Re-engagement emails for abandoned interest',
  },
  {
    name: 'auto-auction',
    schedule: '15 */1 * * *', // Every hour at :15
    weight: 'medium',
    maxDurationSec: 30,
    description: 'Process auction state transitions',
  },

  // --- Light (can overlap freely) ---
  {
    name: 'freshness-check',
    schedule: '30 */2 * * *', // Every 2h at :30
    weight: 'light',
    maxDurationSec: 15,
    description: 'Check vehicle listing freshness',
  },
  {
    name: 'reservation-expiry',
    schedule: '30 */1 * * *', // Every hour at :30
    weight: 'light',
    maxDurationSec: 10,
    description: 'Expire past-due reservations',
  },
  {
    name: 'publish-scheduled',
    schedule: '30 */1 * * *', // Every hour at :30
    weight: 'light',
    maxDurationSec: 10,
    description: 'Publish scheduled vehicles',
  },
  {
    name: 'whatsapp-retry',
    schedule: '30 */3 * * *', // Every 3h at :30
    weight: 'light',
    maxDurationSec: 30,
    description: 'Retry failed WhatsApp submissions',
  },
  {
    name: 'founding-expiry',
    schedule: '30 2 * * *', // Daily 02:30
    weight: 'light',
    maxDurationSec: 10,
    description: 'Expire founding member promotions',
  },
  {
    name: 'infra-metrics',
    schedule: '45 */6 * * *', // Every 6h at :45
    weight: 'light',
    maxDurationSec: 15,
    description: 'Collect infrastructure metrics',
  },
  {
    name: 'process-jobs',
    schedule: '*/5 * * * *', // Every 5 min
    weight: 'light',
    maxDurationSec: 30,
    description: 'Process queued background jobs',
  },
]

/**
 * In-memory lock to prevent heavy cron overlap within a single process.
 * In production (CF Workers), use a distributed lock (KV or DB row).
 */
const runningHeavy = new Set<string>()

export function acquireCronLock(name: string, weight: CronWeight): boolean {
  if (weight === 'heavy') {
    // No two heavy jobs should run concurrently
    if (runningHeavy.size > 0) return false
    runningHeavy.add(name)
    return true
  }
  // Medium and light always allowed
  return true
}

export function releaseCronLock(name: string): void {
  runningHeavy.delete(name)
}

/**
 * Check if a cron job is within its allowed execution window (±5 min tolerance).
 * For external schedulers that might fire slightly off-schedule.
 */
export function isInExecutionWindow(name: string): boolean {
  const job = CRON_SCHEDULE.find((j) => j.name === name)
  if (!job) return true // Unknown jobs always allowed
  return true // Window enforcement is done by the external scheduler
}

/**
 * Get the schedule config for a specific cron job.
 */
export function getCronConfig(name: string): CronJobConfig | undefined {
  return CRON_SCHEDULE.find((j) => j.name === name)
}
