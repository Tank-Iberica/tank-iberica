import { describe, it, expect, vi } from 'vitest'
import {
  vehiclesQuery,
  dealersQuery,
  articlesQuery,
  categoriesQuery,
} from '../../../server/utils/supabaseQuery'
import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeClient() {
  const eq = vi.fn().mockReturnThis()
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  return { from, select, eq, client: { from } as unknown as SupabaseClient }
}

// ─── vehiclesQuery ────────────────────────────────────────────────────────────

describe('vehiclesQuery', () => {
  it('queries the vehicles table', () => {
    const { client, from } = makeClient()
    vehiclesQuery(client, 'tracciona')
    expect(from).toHaveBeenCalledWith('vehicles')
  })

  it('selects all columns', () => {
    const { client, select } = makeClient()
    vehiclesQuery(client, 'tracciona')
    expect(select).toHaveBeenCalledWith('*')
  })

  it('filters by the provided vertical', () => {
    const { client, eq } = makeClient()
    vehiclesQuery(client, 'maquinaria')
    expect(eq).toHaveBeenCalledWith('vertical', 'maquinaria')
  })

  it('uses vertical from runtime config when not provided', () => {
    // setup.ts stubs useRuntimeConfig to return vertical: 'tracciona'
    const { client, eq } = makeClient()
    vehiclesQuery(client)
    expect(eq).toHaveBeenCalledWith('vertical', 'tracciona')
  })
})

// ─── dealersQuery ─────────────────────────────────────────────────────────────

describe('dealersQuery', () => {
  it('queries the dealers table', () => {
    const { client, from } = makeClient()
    dealersQuery(client, 'tracciona')
    expect(from).toHaveBeenCalledWith('dealers')
  })

  it('filters by vertical', () => {
    const { client, eq } = makeClient()
    dealersQuery(client, 'tracciona')
    expect(eq).toHaveBeenCalledWith('vertical', 'tracciona')
  })
})

// ─── articlesQuery ────────────────────────────────────────────────────────────

describe('articlesQuery', () => {
  it('queries the articles table', () => {
    const { client, from } = makeClient()
    articlesQuery(client, 'tracciona')
    expect(from).toHaveBeenCalledWith('articles')
  })

  it('filters by vertical', () => {
    const { client, eq } = makeClient()
    articlesQuery(client, 'another')
    expect(eq).toHaveBeenCalledWith('vertical', 'another')
  })
})

// ─── categoriesQuery ──────────────────────────────────────────────────────────

describe('categoriesQuery', () => {
  it('queries the categories table', () => {
    const { client, from } = makeClient()
    categoriesQuery(client, 'tracciona')
    expect(from).toHaveBeenCalledWith('categories')
  })

  it('filters by provided vertical', () => {
    const { client, eq } = makeClient()
    categoriesQuery(client, 'camiones')
    expect(eq).toHaveBeenCalledWith('vertical', 'camiones')
  })

  it('uses runtime config vertical when not provided', () => {
    const { client, eq } = makeClient()
    categoriesQuery(client)
    expect(eq).toHaveBeenCalledWith('vertical', 'tracciona')
  })
})
