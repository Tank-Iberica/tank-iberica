import { describe, it, expect, vi } from 'vitest'
import {
  createChaosSupabase,
  createChaosStripe,
  createChaosResend,
  withTimeout,
  createNetworkPartition,
} from '../../helpers/chaos'

describe('chaos testing helpers', () => {
  describe('createChaosSupabase', () => {
    it('returns error when failRate=1', async () => {
      const supabase = createChaosSupabase({ failRate: 1.0 })
      const result = await supabase.from('vehicles').select('*').eq('id', '123')
      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('Chaos')
      expect(result.data).toBeNull()
    })

    it('returns data when failRate=0', async () => {
      const supabase = createChaosSupabase({ failRate: 0 })
      const result = await supabase.from('vehicles').select('*').eq('status', 'active')
      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('chains methods correctly', async () => {
      const supabase = createChaosSupabase({ failRate: 0 })
      const result = await supabase
        .from('vehicles')
        .select('id, brand')
        .eq('vertical', 'tracciona')
        .order('created_at')
        .limit(10)
      expect(result.error).toBeNull()
    })

    it('auth.getUser fails when configured', async () => {
      const supabase = createChaosSupabase({ failRate: 1.0 })
      const { data, error } = await supabase.auth.getUser()
      expect(error).toBeTruthy()
      expect(data.user).toBeNull()
    })

    it('auth.getUser succeeds when failRate=0', async () => {
      const supabase = createChaosSupabase({ failRate: 0 })
      const { data, error } = await supabase.auth.getUser()
      expect(error).toBeNull()
      expect(data.user).toBeTruthy()
      expect(data.user.id).toBe('test-user')
    })

    it('storage upload fails when configured', async () => {
      const supabase = createChaosSupabase({ failRate: 1.0 })
      const { error } = await supabase.storage.from('images').upload()
      expect(error).toBeTruthy()
    })
  })

  describe('createChaosStripe', () => {
    it('throws on checkout create when failRate=1', async () => {
      const stripe = createChaosStripe({ failRate: 1.0 })
      await expect(stripe.checkout.sessions.create({})).rejects.toThrow('Chaos')
    })

    it('succeeds on checkout create when failRate=0', async () => {
      const stripe = createChaosStripe({ failRate: 0 })
      const session = await stripe.checkout.sessions.create({ mode: 'subscription' })
      expect(session.id).toBe('cs_test_chaos')
    })

    it('throws on subscription retrieve when failRate=1', async () => {
      const stripe = createChaosStripe({ failRate: 1.0 })
      await expect(stripe.subscriptions.retrieve('sub_123')).rejects.toThrow('Chaos')
    })

    it('returns subscription when failRate=0', async () => {
      const stripe = createChaosStripe({ failRate: 0 })
      const sub = await stripe.subscriptions.retrieve('sub_123')
      expect(sub.status).toBe('active')
    })
  })

  describe('createChaosResend', () => {
    it('throws on email send when failRate=1', async () => {
      const resend = createChaosResend({ failRate: 1.0 })
      await expect(resend.emails.send({ to: 'test@test.com' })).rejects.toThrow('Chaos')
    })

    it('succeeds on email send when failRate=0', async () => {
      const resend = createChaosResend({ failRate: 0 })
      const result = await resend.emails.send({ to: 'test@test.com' })
      expect(result.id).toBe('email_chaos_test')
    })
  })

  describe('withTimeout', () => {
    it('resolves if within timeout', async () => {
      const fn = withTimeout(() => Promise.resolve('ok'), 1000)
      const result = await fn()
      expect(result).toBe('ok')
    })

    it('rejects if exceeds timeout', async () => {
      const fn = withTimeout(
        () => new Promise((resolve) => setTimeout(() => resolve('late'), 500)),
        10,
        'Too slow',
      )
      await expect(fn()).rejects.toThrow('Too slow')
    })
  })

  describe('createNetworkPartition', () => {
    it('starts partitioned and recovers', () => {
      const partition = createNetworkPartition(100)
      expect(partition.isPartitioned()).toBe(false)

      partition.start()
      expect(partition.isPartitioned()).toBe(true)

      partition.stop()
      expect(partition.isPartitioned()).toBe(false)
    })

    it('toChaosConfig returns failRate=1 when partitioned', () => {
      const partition = createNetworkPartition(5000)
      partition.start()
      const config = partition.toChaosConfig()
      expect(config.failRate).toBe(1.0)
      partition.stop()
    })

    it('toChaosConfig returns failRate=0 when not partitioned', () => {
      const partition = createNetworkPartition(5000)
      const config = partition.toChaosConfig()
      expect(config.failRate).toBe(0)
    })
  })
})
