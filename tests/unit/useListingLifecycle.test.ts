import { describe, it, expect } from 'vitest'

/**
 * Tests for useListingLifecycle composable — vehicle status state machine.
 * Inline copies of pure functions for cross-branch compatibility.
 */

type VehicleStatus =
  | 'draft'
  | 'published'
  | 'sold'
  | 'archived'
  | 'rented'
  | 'maintenance'
  | 'paused'
  | 'expired'

const STATUS_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  draft: ['published'],
  published: ['draft', 'sold', 'archived', 'rented', 'paused', 'maintenance'],
  sold: ['archived'],
  archived: ['draft'],
  rented: ['published', 'sold', 'archived', 'maintenance'],
  maintenance: ['published', 'draft', 'archived'],
  paused: ['published', 'draft', 'archived'],
  expired: ['draft', 'archived'],
}

function isValidTransition(from: VehicleStatus, to: VehicleStatus): boolean {
  if (from === to) return false
  return (STATUS_TRANSITIONS[from] ?? []).includes(to)
}

function getValidTargets(current: VehicleStatus): VehicleStatus[] {
  return STATUS_TRANSITIONS[current] ?? []
}

interface StatusMeta {
  label: { es: string; en: string }
  color: string
  icon: string
  isFinal: boolean
}

const STATUS_META: Record<VehicleStatus, StatusMeta> = {
  draft: { label: { es: 'Borrador', en: 'Draft' }, color: '#6b7280', icon: 'mdi:file-edit-outline', isFinal: false },
  published: { label: { es: 'Publicado', en: 'Published' }, color: '#22c55e', icon: 'mdi:check-circle', isFinal: false },
  sold: { label: { es: 'Vendido', en: 'Sold' }, color: '#3b82f6', icon: 'mdi:cash-check', isFinal: true },
  archived: { label: { es: 'Archivado', en: 'Archived' }, color: '#9ca3af', icon: 'mdi:archive', isFinal: true },
  rented: { label: { es: 'Alquilado', en: 'Rented' }, color: '#8b5cf6', icon: 'mdi:key-variant', isFinal: false },
  maintenance: { label: { es: 'En mantenimiento', en: 'Maintenance' }, color: '#f59e0b', icon: 'mdi:wrench', isFinal: false },
  paused: { label: { es: 'Pausado', en: 'Paused' }, color: '#ef4444', icon: 'mdi:pause-circle', isFinal: false },
  expired: { label: { es: 'Expirado', en: 'Expired' }, color: '#dc2626', icon: 'mdi:clock-alert', isFinal: false },
}

function getStatusLabel(status: VehicleStatus, locale: string = 'es'): string {
  const meta = STATUS_META[status]
  if (!meta) return status
  return locale === 'en' ? meta.label.en : meta.label.es
}

// ─── isValidTransition ──────────────────────────────────────

describe('isValidTransition', () => {
  it('draft → published is valid', () => {
    expect(isValidTransition('draft', 'published')).toBe(true)
  })

  it('draft → sold is invalid', () => {
    expect(isValidTransition('draft', 'sold')).toBe(false)
  })

  it('draft → archived is invalid', () => {
    expect(isValidTransition('draft', 'archived')).toBe(false)
  })

  it('published → draft is valid (unpublish)', () => {
    expect(isValidTransition('published', 'draft')).toBe(true)
  })

  it('published → sold is valid', () => {
    expect(isValidTransition('published', 'sold')).toBe(true)
  })

  it('published → archived is valid', () => {
    expect(isValidTransition('published', 'archived')).toBe(true)
  })

  it('published → rented is valid', () => {
    expect(isValidTransition('published', 'rented')).toBe(true)
  })

  it('published → paused is valid', () => {
    expect(isValidTransition('published', 'paused')).toBe(true)
  })

  it('published → maintenance is valid', () => {
    expect(isValidTransition('published', 'maintenance')).toBe(true)
  })

  it('sold → archived is valid', () => {
    expect(isValidTransition('sold', 'archived')).toBe(true)
  })

  it('sold → published is invalid (can\'t unpublish sold)', () => {
    expect(isValidTransition('sold', 'published')).toBe(false)
  })

  it('sold → draft is invalid', () => {
    expect(isValidTransition('sold', 'draft')).toBe(false)
  })

  it('archived → draft is valid (re-list)', () => {
    expect(isValidTransition('archived', 'draft')).toBe(true)
  })

  it('archived → published is invalid (must go through draft)', () => {
    expect(isValidTransition('archived', 'published')).toBe(false)
  })

  it('rented → published is valid (return from rental)', () => {
    expect(isValidTransition('rented', 'published')).toBe(true)
  })

  it('rented → sold is valid (sell while rented)', () => {
    expect(isValidTransition('rented', 'sold')).toBe(true)
  })

  it('rented → maintenance is valid', () => {
    expect(isValidTransition('rented', 'maintenance')).toBe(true)
  })

  it('maintenance → published is valid (repair done)', () => {
    expect(isValidTransition('maintenance', 'published')).toBe(true)
  })

  it('maintenance → draft is valid', () => {
    expect(isValidTransition('maintenance', 'draft')).toBe(true)
  })

  it('paused → published is valid (resume)', () => {
    expect(isValidTransition('paused', 'published')).toBe(true)
  })

  it('paused → draft is valid', () => {
    expect(isValidTransition('paused', 'draft')).toBe(true)
  })

  it('expired → draft is valid (re-create)', () => {
    expect(isValidTransition('expired', 'draft')).toBe(true)
  })

  it('expired → archived is valid', () => {
    expect(isValidTransition('expired', 'archived')).toBe(true)
  })

  it('expired → published is invalid (must go through draft)', () => {
    expect(isValidTransition('expired', 'published')).toBe(false)
  })

  it('same status → same status is invalid', () => {
    expect(isValidTransition('published', 'published')).toBe(false)
    expect(isValidTransition('draft', 'draft')).toBe(false)
  })
})

// ─── getValidTargets ────────────────────────────────────────

describe('getValidTargets', () => {
  it('draft can only go to published', () => {
    expect(getValidTargets('draft')).toEqual(['published'])
  })

  it('published has 6 targets', () => {
    const targets = getValidTargets('published')
    expect(targets).toHaveLength(6)
    expect(targets).toContain('draft')
    expect(targets).toContain('sold')
    expect(targets).toContain('archived')
    expect(targets).toContain('rented')
    expect(targets).toContain('paused')
    expect(targets).toContain('maintenance')
  })

  it('sold can only go to archived', () => {
    expect(getValidTargets('sold')).toEqual(['archived'])
  })

  it('archived can only go to draft', () => {
    expect(getValidTargets('archived')).toEqual(['draft'])
  })

  it('expired can go to draft or archived', () => {
    expect(getValidTargets('expired')).toEqual(['draft', 'archived'])
  })

  it('unknown status returns empty array', () => {
    expect(getValidTargets('nonexistent' as VehicleStatus)).toEqual([])
  })
})

// ─── STATUS_META ────────────────────────────────────────────

describe('STATUS_META', () => {
  it('all 8 statuses have metadata', () => {
    const statuses: VehicleStatus[] = [
      'draft', 'published', 'sold', 'archived',
      'rented', 'maintenance', 'paused', 'expired',
    ]
    for (const s of statuses) {
      expect(STATUS_META[s]).toBeDefined()
      expect(STATUS_META[s].label.es).toBeTruthy()
      expect(STATUS_META[s].label.en).toBeTruthy()
      expect(STATUS_META[s].color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(STATUS_META[s].icon).toMatch(/^mdi:/)
    }
  })

  it('sold and archived are final statuses', () => {
    expect(STATUS_META.sold.isFinal).toBe(true)
    expect(STATUS_META.archived.isFinal).toBe(true)
  })

  it('draft, published, rented, maintenance, paused, expired are not final', () => {
    expect(STATUS_META.draft.isFinal).toBe(false)
    expect(STATUS_META.published.isFinal).toBe(false)
    expect(STATUS_META.rented.isFinal).toBe(false)
    expect(STATUS_META.maintenance.isFinal).toBe(false)
    expect(STATUS_META.paused.isFinal).toBe(false)
    expect(STATUS_META.expired.isFinal).toBe(false)
  })
})

// ─── getStatusLabel ─────────────────────────────────────────

describe('getStatusLabel', () => {
  it('returns Spanish label by default', () => {
    expect(getStatusLabel('published')).toBe('Publicado')
    expect(getStatusLabel('draft')).toBe('Borrador')
    expect(getStatusLabel('sold')).toBe('Vendido')
  })

  it('returns English label when locale is en', () => {
    expect(getStatusLabel('published', 'en')).toBe('Published')
    expect(getStatusLabel('draft', 'en')).toBe('Draft')
    expect(getStatusLabel('sold', 'en')).toBe('Sold')
  })

  it('returns status string for unknown status', () => {
    expect(getStatusLabel('unknown' as VehicleStatus)).toBe('unknown')
  })

  it('maintenance has localized labels', () => {
    expect(getStatusLabel('maintenance', 'es')).toBe('En mantenimiento')
    expect(getStatusLabel('maintenance', 'en')).toBe('Maintenance')
  })
})

// ─── State machine consistency ──────────────────────────────

describe('state machine consistency', () => {
  it('every status has a transitions entry', () => {
    const allStatuses: VehicleStatus[] = [
      'draft', 'published', 'sold', 'archived',
      'rented', 'maintenance', 'paused', 'expired',
    ]
    for (const s of allStatuses) {
      expect(STATUS_TRANSITIONS[s]).toBeDefined()
      expect(Array.isArray(STATUS_TRANSITIONS[s])).toBe(true)
    }
  })

  it('no status transitions to itself', () => {
    for (const [from, targets] of Object.entries(STATUS_TRANSITIONS)) {
      expect(targets).not.toContain(from)
    }
  })

  it('all target statuses exist in the transition map', () => {
    const allStatuses = new Set(Object.keys(STATUS_TRANSITIONS))
    for (const targets of Object.values(STATUS_TRANSITIONS)) {
      for (const target of targets) {
        expect(allStatuses.has(target)).toBe(true)
      }
    }
  })

  it('draft is reachable from archived (re-listing path)', () => {
    // archived → draft → published
    expect(isValidTransition('archived', 'draft')).toBe(true)
    expect(isValidTransition('draft', 'published')).toBe(true)
  })

  it('full lifecycle path: draft → published → sold → archived', () => {
    expect(isValidTransition('draft', 'published')).toBe(true)
    expect(isValidTransition('published', 'sold')).toBe(true)
    expect(isValidTransition('sold', 'archived')).toBe(true)
  })

  it('pause/resume cycle: published → paused → published', () => {
    expect(isValidTransition('published', 'paused')).toBe(true)
    expect(isValidTransition('paused', 'published')).toBe(true)
  })

  it('maintenance cycle: published → maintenance → published', () => {
    expect(isValidTransition('published', 'maintenance')).toBe(true)
    expect(isValidTransition('maintenance', 'published')).toBe(true)
  })

  it('rental cycle: published → rented → published', () => {
    expect(isValidTransition('published', 'rented')).toBe(true)
    expect(isValidTransition('rented', 'published')).toBe(true)
  })
})
