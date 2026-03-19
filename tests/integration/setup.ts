/**
 * Setup for integration tests.
 * Provides database connection for migration verification tests.
 */
import pg from 'pg'

const DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres'

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 })
  }
  return pool
}

export async function query(sql: string, params?: unknown[]): Promise<pg.QueryResult> {
  const p = getPool()
  return p.query(sql, params)
}

export async function tableExists(tableName: string): Promise<boolean> {
  const result = await query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
    [tableName],
  )
  return result.rows[0].exists
}

export async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2)`,
    [tableName, columnName],
  )
  return result.rows[0].exists
}

export async function indexExists(indexName: string): Promise<boolean> {
  const result = await query(`SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = $1)`, [
    indexName,
  ])
  return result.rows[0].exists
}

export async function rlsEnabled(tableName: string): Promise<boolean> {
  const result = await query(
    `SELECT rowsecurity FROM pg_tables WHERE tablename = $1 AND schemaname = 'public'`,
    [tableName],
  )
  return result.rows.length > 0 && result.rows[0].rowsecurity === true
}

export async function functionExists(functionName: string): Promise<boolean> {
  const result = await query(`SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = $1)`, [
    functionName,
  ])
  return result.rows[0].exists
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
