// Stub for #supabase/server — replaced by vi.mock() in individual tests
// Provides no-op defaults so importing files don't crash

export const serverSupabaseServiceRole = (_event: unknown) => ({
  from: (_table: string) => ({
    select: (_cols: string) => ({
      eq: () => Promise.resolve({ data: null, error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      throwOnError: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    upsert: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    admin: {
      listUsers: async () => ({ data: { users: [] }, error: null }),
      getUserById: async () => ({ data: { user: null }, error: null }),
    },
  },
})

export const serverSupabaseUser = async (_event: unknown) => null

export const serverSupabaseClient = (_event: unknown) => ({
  from: (_table: string) => ({
    select: (_cols: string) => ({
      eq: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
})
