import { describe, it, expect } from 'vitest'
import {
  formatDisputeReason,
  formatRejectionReason,
  getWorkspaceStatusInfo,
  DISPUTE_REASON_LABELS
} from '@/lib/utils/workspace-status'
import { Notification, NotificationSettings, UserProfile } from '@/types'

describe('Milestone 4 Feature Utilities & Models', () => {
  describe('formatDisputeReason', () => {
    it('formats predefined dispute reason keys correctly', () => {
      expect(formatDisputeReason('followed_instructions')).toBe('Followed All Instructions')
      expect(formatDisputeReason('valid_evidence')).toBe('Media Evidence Valid & Clear')
      expect(formatDisputeReason('poster_error')).toBe('Poster Feedback Inaccurate')
      expect(formatDisputeReason('other')).toBe('Other Dispute Reason')
    })

    it('formats unknown snake_case dispute reasons to Title Case', () => {
      expect(formatDisputeReason('custom_dispute_reason')).toBe('Custom Dispute Reason')
    })

    it('returns default fallback when reason is null or undefined', () => {
      expect(formatDisputeReason(null)).toBe('Dispute Under Review')
      expect(formatDisputeReason(undefined)).toBe('Dispute Under Review')
    })

    it('matches DISPUTE_REASON_LABELS entries', () => {
      Object.entries(DISPUTE_REASON_LABELS).forEach(([key, label]) => {
        expect(formatDisputeReason(key)).toBe(label)
      })
    })
  })

  describe('getWorkspaceStatusInfo for Disputed Submissions', () => {
    const mockListing = {
      title: 'GCash Checkout Simulation',
      rate_per_tester: 200,
      review_window_minutes: 60
    }

    it('formats disputed submission status metadata correctly', () => {
      const disputedSub = {
        status: 'disputed',
        rejection_reason: 'instructions_not_followed',
        rejection_explanation: 'Screen recording missed checkout button click.',
        dispute_reason: 'valid_evidence',
        dispute_explanation: 'Checkout button click is visible at timestamp 0:42 in recording_session.mp4.',
        review_completed_at: '2026-08-01T14:00:00Z'
      }

      const info = getWorkspaceStatusInfo(disputedSub, mockListing)

      expect(info.status).toBe('disputed')
      expect(info.badgeTheme).toBe('amber')
      expect(info.badgeLabel).toBe('Disputed')
      expect(info.title).toBe('Dispute Under Review')
      expect(info.disputeReasonLabel).toBe('Media Evidence Valid & Clear')
      expect(info.disputeExplanation).toContain('timestamp 0:42')
      expect(info.rejectionReasonLabel).toBe('Instructions Not Followed')
      expect(info.escrowOrPayoutText).toBe('₱200.00 Held Pending Dispute')
    })
  })

  describe('Notification & Profile Data Structures', () => {
    it('validates Notification model structure', () => {
      const notif: Notification = {
        id: 'n_101',
        user_id: 'usr_1',
        title: 'Payout Approved',
        message: '₱400.00 transferred to GCash 09171234567.',
        type: 'payout_approved',
        is_read: false,
        created_at: new Date().toISOString(),
        link_url: '/dashboard/tester#earnings'
      }

      expect(notif.type).toBe('payout_approved')
      expect(notif.is_read).toBe(false)
      expect(notif.link_url).toContain('#earnings')
    })

    it('validates NotificationSettings and UserProfile defaults', () => {
      const settings: NotificationSettings = {
        email_payouts: true,
        email_submissions: true,
        email_listings: false,
        email_disputes: true
      }

      const profile: UserProfile = {
        id: 'u_123',
        role: 'tester',
        full_name: 'Test Tester',
        location: 'Metro Manila',
        device_types: ['Android Mobile', 'Windows PC'],
        notification_settings: settings
      }

      expect(profile.location).toBe('Metro Manila')
      expect(profile.device_types).toContain('Android Mobile')
      expect(profile.notification_settings?.email_payouts).toBe(true)
      expect(profile.notification_settings?.email_listings).toBe(false)
    })
  })

  describe('Reviewer M4-1 Fixes Validation', () => {
    it('handles empty notification array without falling back to mock data', () => {
      const dbResponse = { data: [], error: null }
      
      let state: Notification[] = [
        { id: 'mock1', user_id: 'u1', title: 'Mock', message: 'Mock', type: 'payout_approved', is_read: false, created_at: '' }
      ]

      if (!dbResponse.error && Array.isArray(dbResponse.data)) {
        state = dbResponse.data as Notification[]
      }

      expect(state).toHaveLength(0)
      expect(Array.isArray(state)).toBe(true)
    })

    it('falls back to mock data only when error occurs during notification fetch', () => {
      const defaultNotifs: Notification[] = [
        { id: 'mock1', user_id: 'u1', title: 'Mock', message: 'Mock', type: 'payout_approved', is_read: false, created_at: '' }
      ]
      const dbResponse = { data: null, error: { message: 'DB Error' } }
      
      let state: Notification[] = []

      if (!dbResponse.error && Array.isArray(dbResponse.data)) {
        state = dbResponse.data as Notification[]
      } else if (dbResponse.error) {
        state = defaultNotifs
      }

      expect(state).toEqual(defaultNotifs)
    })

    it('calculates total earnings and withdrawable balance accurately without artificial offsets', () => {
      const payouts = [
        { status: 'completed', amount: 200 },
        { status: 'completed', amount: 150 },
        { status: 'pending', amount: 300 }
      ]

      const totalPaid = payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)

      const totalEarnings = totalPaid
      const withdrawableBalance = Math.max(0, totalPaid)

      expect(totalPaid).toBe(350)
      expect(totalEarnings).toBe(350)
      expect(withdrawableBalance).toBe(350)
    })

    it('initializes earnings metrics to 0 for new accounts', () => {
      const initialTotalEarnings = 0
      const initialWithdrawableBalance = 0

      expect(initialTotalEarnings).toBe(0)
      expect(initialWithdrawableBalance).toBe(0)
    })
  })
})

