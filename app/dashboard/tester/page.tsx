'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Wallet, 
  Phone, 
  CheckCircle, 
  Video, 
  Image as ImageIcon, 
  ChevronRight, 
  Star,
  Play,
  Square,
  UploadCloud,
  Check,
  AlertCircle,
  Clock,
  ShieldAlert,
  FileText,
  DollarSign,
  LayoutDashboard,
  CheckSquare,
  Scale
} from 'lucide-react'
import { AgreementModal } from '@/components/shared/AgreementModal'
import { EscrowStatusBar } from '@/components/shared/EscrowStatusBar'
import { TimerDisplay } from '@/components/shared/TimerDisplay'
import { ProfileModal } from '@/components/shared/ProfileModal'
import { DisputeModal } from '@/components/shared/DisputeModal'
import { createBrowserClient } from '@/lib/supabase/client'
import { sanitizeDatabaseError } from '@/lib/utils/error'
import { JobListing, ButtonConfig, getButtonConfig } from '@/lib/utils/claim-button'
import { formatRejectionReason, formatDisputeReason } from '@/lib/utils/workspace-status'
import { UserProfile } from '@/types'

export interface SubmissionRecord {
  id: string
  listing_id: string
  listing_title: string
  rate_per_tester: number
  status: 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'disputed' | 'expired'
  rejection_reason?: string | null
  rejection_explanation?: string | null
  dispute_reason?: string | null
  dispute_explanation?: string | null
  submitted_at?: string | null
  created_at: string
}

export interface PayoutRecord {
  id: string
  reference_id: string
  amount: number
  gcash_number: string
  status: 'completed' | 'processing' | 'pending'
  created_at: string
}

const DEFAULT_SUBMISSIONS: SubmissionRecord[] = [
  {
    id: 'sub_1',
    listing_id: 'j1',
    listing_title: 'E-Commerce App GCash Checkout Test',
    rate_per_tester: 200,
    status: 'approved',
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString()
  },
  {
    id: 'sub_2',
    listing_id: 'j2',
    listing_title: 'Rider Delivery App Pin Accuracy Verification',
    rate_per_tester: 500,
    status: 'rejected',
    rejection_reason: 'instructions_not_followed',
    rejection_explanation: 'The GPS pin locator screenshot was blurry and did not show exact coordinates.',
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString()
  },
  {
    id: 'sub_3',
    listing_id: 'j3',
    listing_title: 'Sari-Sari Store Inventory App Initial Run',
    rate_per_tester: 50,
    status: 'pending_review',
    submitted_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  }
]

const DEFAULT_PAYOUTS: PayoutRecord[] = [
  {
    id: 'p_1',
    reference_id: 'PAY-GCASH-9821',
    amount: 200,
    gcash_number: '0917-***-5678',
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  },
  {
    id: 'p_2',
    reference_id: 'PAY-GCASH-4412',
    amount: 200,
    gcash_number: '0917-***-5678',
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString()
  }
]

const NDA_CONTENT = `subukAn Tester Agreement & NDA

By participating in this test, you agree to the following binding conditions:

1. HONEST & HIGH-EFFORT COMPLETION: You must execute all tasks exactly as described. Payment is strictly subject to the poster's review. Submission of spam, low-effort summaries, or fake proofs will result in immediate disqualification and account flag.

2. CONFIDENTIALITY: The application under test, its features, screenshots, and internal workings are strictly confidential. You may not distribute, discuss, or share any media, screenshots, recordings, or code outside the subukAn portal.

3. SCREEN RECORDING AND EVIDENCE: You agree to keep the screen recorder running for the entire duration of the test. The recording must clearly show the steps you perform.

4. ESCROW RELEASES: Funds are held safely in escrow. Upon submission, the poster has up to 30 or 60 minutes to review. If they do not take action, payment is automatically released.

Scroll down and review all terms to accept.`

export default function TesterDashboard() {
  const supabase = createBrowserClient()

  // Navigation tab state: 'available' | 'submissions' | 'earnings'
  const [activeTab, setActiveTab] = useState<'available' | 'submissions' | 'earnings'>('available')

  // Profile and earnings states
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [withdrawableBalance, setWithdrawableBalance] = useState(0)
  const [gcashNumber, setGcashNumber] = useState('0917-***-5678')
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null)
  const [listings, setListings] = useState<JobListing[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(DEFAULT_SUBMISSIONS)
  const [payouts, setPayouts] = useState<PayoutRecord[]>(DEFAULT_PAYOUTS)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  
  // Interactive UI state machine for standard workspace inline task demo
  const [currentStep, setCurrentStep] = useState<'idle' | 'agreement' | 'active_task' | 'submitted'>('idle')
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)
  
  // Task responses / inputs
  const [answerText, setAnswerText] = useState('')
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingUploaded, setRecordingUploaded] = useState(false)
  const [imageUploaded, setImageUploaded] = useState(false)

  // Payout states
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [payoutSuccess, setPayoutSuccess] = useState(false)
  const [payoutGcashNumber, setPayoutGcashNumber] = useState('')

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [disputeModalState, setDisputeModalState] = useState<{
    isOpen: boolean
    submissionId: string
    listingTitle: string
  }>({
    isOpen: false,
    submissionId: '',
    listingTitle: ''
  })

  // URL Hash Sync for Tab navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'submissions') {
        setActiveTab('submissions')
      } else if (hash === 'earnings') {
        setActiveTab('earnings')
      } else if (hash === 'available') {
        setActiveTab('available')
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const switchTab = (tab: 'available' | 'submissions' | 'earnings') => {
    setActiveTab(tab)
    window.location.hash = tab
  }

  const fetchProfileAndListings = useCallback(async () => {
    setLoading(true)
    setLoadingError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setLoadingError('Authentication required.')
        setLoading(false)
        return
      }

      // 1. Fetch profile demographics
      let profileData: Partial<UserProfile> | null = null
      let profileError = null

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        profileData = data
        profileError = error
      } catch (err: unknown) {
        console.warn('Profile fetch threw exception:', err)
      }

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          try {
            const newProfile = {
              id: user.id,
              role: 'tester',
              updated_at: new Date().toISOString()
            }
            const { error: insertError, data: insertedData } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select()
              .single()

            if (!insertError && insertedData) {
              profileData = insertedData
              profileError = null
            } else {
              profileData = { id: user.id, role: 'tester', age_group: '', gender: '', employment_status: '', tech_literacy: '', accessibility_tags: [] }
              profileError = null
            }
          } catch (insertErr) {
            profileData = { id: user.id, role: 'tester', age_group: '', gender: '', employment_status: '', tech_literacy: '', accessibility_tags: [] }
            profileError = null
          }
        } else if (profileError.message?.includes('profiles') || profileError.message?.includes('schema cache')) {
          profileData = { id: user.id, role: 'tester', age_group: '', gender: '', employment_status: '', tech_literacy: '', accessibility_tags: [] }
          profileError = null
        }
      }

      if (profileError || !profileData) {
        setLoadingError(sanitizeDatabaseError(profileError, 'Failed to retrieve user profile.'))
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Fetch tester earnings & payouts
      try {
        const { data: payoutsData } = await supabase
          .from('payouts')
          .select('*')
          .eq('tester_id', user.id)
          .order('created_at', { ascending: false })

        if (payoutsData && payoutsData.length > 0) {
          setPayouts(payoutsData.map((p: any) => ({
            id: p.id,
            reference_id: p.reference_id || `PAY-GCASH-${p.id.slice(0, 4)}`,
            amount: p.amount,
            gcash_number: p.gcash_number || '0917-***-5678',
            status: p.status || 'completed',
            created_at: p.created_at
          })))
          const totalPaid = payoutsData
            .filter((p: any) => p.status === 'completed')
            .reduce((sum: number, p: any) => sum + p.amount, 0)
          setTotalEarnings(totalPaid)
          setWithdrawableBalance(Math.max(0, totalPaid))
        }
      } catch (err) {
        console.warn('Payouts query fallback:', err)
      }

      // 2. Fetch submissions for user
      try {
        const { data: userSubsData } = await supabase
          .from('submissions')
          .select(`
            id,
            listing_id,
            status,
            rejection_reason,
            rejection_explanation,
            dispute_reason,
            dispute_explanation,
            submitted_at,
            created_at,
            listings (
              title,
              rate_per_tester
            )
          `)
          .eq('tester_id', user.id)
          .order('created_at', { ascending: false })

        if (userSubsData && userSubsData.length > 0) {
          const mappedSubs: SubmissionRecord[] = userSubsData.map((s: any) => ({
            id: s.id,
            listing_id: s.listing_id,
            listing_title: s.listings?.title || 'Testing Listing Task',
            rate_per_tester: s.listings?.rate_per_tester || 150,
            status: s.status,
            rejection_reason: s.rejection_reason,
            rejection_explanation: s.rejection_explanation,
            dispute_reason: s.dispute_reason,
            dispute_explanation: s.dispute_explanation,
            submitted_at: s.submitted_at,
            created_at: s.created_at
          }))
          setSubmissions(mappedSubs)
        }
      } catch (err) {
        console.warn('User submissions fetch fallback:', err)
      }

      // 3. Fetch open listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          *,
          tasks (
            id,
            question_text,
            requires_recording,
            requires_image
          ),
          submissions (
            id,
            status
          )
        `)
        .eq('status', 'open')

      if (listingsError) {
        setLoadingError(sanitizeDatabaseError(listingsError, 'Failed to load listings.'))
      } else {
        let userSubmissions: { id: string; listing_id: string; status: string }[] = []
        try {
          const { data: userSubsData } = await supabase
            .from('submissions')
            .select('id, listing_id, status')
            .eq('tester_id', user.id)

          if (userSubsData) {
            userSubmissions = userSubsData
          }
        } catch (err) {
          console.warn('Could not fetch user submissions:', err)
        }

        const mapped = (listingsData || []).map((listing: any) => {
          const firstTask = listing.tasks?.[0]
          const userSub = userSubmissions.find((s) => s.listing_id === listing.id && s.status !== 'expired')
          const userSubmissionStatus = (userSub ? userSub.status : null) as any

          return {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            rate_per_tester: listing.rate_per_tester,
            slots_count: listing.slots_count,
            slots_filled: listing.submissions 
              ? listing.submissions.filter((s: any) => s.status !== 'expired' && s.status !== 'rejected').length 
              : 0,
            requires_recording: listing.tasks?.some((t: any) => t.requires_recording) || false,
            requires_image: listing.tasks?.some((t: any) => t.requires_image) || false,
            question_text: firstTask?.question_text || 'Provide feedback on this design.',
            is_quick_impression: listing.is_quick_impression,
            target_age_group: listing.target_age_group,
            target_gender: listing.target_gender,
            target_employment_status: listing.target_employment_status,
            target_tech_literacy: listing.target_tech_literacy,
            target_accessibility_tags: listing.target_accessibility_tags,
            user_submission_status: userSubmissionStatus,
          }
        })

        // Filter based on demographic match
        const filtered = mapped.filter((listing: any) => {
          if (listing.target_age_group && listing.target_age_group !== profileData?.age_group) return false
          if (listing.target_gender && listing.target_gender !== profileData?.gender) return false
          if (listing.target_employment_status && listing.target_employment_status !== profileData?.employment_status) return false
          if (listing.target_tech_literacy && listing.target_tech_literacy !== profileData?.tech_literacy) return false
          
          if (listing.target_accessibility_tags && listing.target_accessibility_tags.length > 0) {
            const testerTags = profileData?.accessibility_tags || []
            const matchesAll = listing.target_accessibility_tags.every((tag: string) => testerTags.includes(tag))
            if (!matchesAll) return false
          }
          return true
        })

        setListings(filtered)
      }
    } catch (err) {
      setLoadingError(sanitizeDatabaseError(err, 'An error occurred.'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProfileAndListings()
  }, [fetchProfileAndListings])

  const handleUpdateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!profile?.id) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', profile.id)

      if (error && !error.message?.includes('profiles') && !error.message?.includes('schema cache')) {
        throw error
      }

      setProfile(prev => ({ ...prev, ...updatedData }))
      await fetchProfileAndListings()
    } catch (err: unknown) {
      console.error('Profile update failed:', err)
      throw err
    }
  }

  const handleOpenDispute = (subId: string, title: string) => {
    setDisputeModalState({
      isOpen: true,
      submissionId: subId,
      listingTitle: title
    })
  }

  const handleDisputeSubmit = async (reason: string, explanation: string) => {
    const subId = disputeModalState.submissionId
    if (!subId) return

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'disputed',
          dispute_reason: reason,
          dispute_explanation: explanation
        })
        .eq('id', subId)

      if (error && !error.message?.includes('schema cache')) {
        console.warn('Dispute DB update error:', error)
      }

      // Update local submissions list state
      setSubmissions(prev => prev.map(s => {
        if (s.id === subId) {
          return {
            ...s,
            status: 'disputed',
            dispute_reason: reason,
            dispute_explanation: explanation
          }
        }
        return s
      }))
    } catch (err) {
      console.error('Failed to submit dispute:', err)
      throw err
    }
  }

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutError(null)
    setPayoutSuccess(false)
    
    const gcashRegex = /^09\d{9}$/
    if (!gcashRegex.test(payoutGcashNumber)) {
      setPayoutError('Invalid GCash number. Must be 11 digits starting with 09 (e.g. 09171234567).')
      return
    }

    setPayoutLoading(true)
    try {
      const response = await fetch('/api/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdrawableBalance, gcash_number: payoutGcashNumber })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to request payout')
      }

      setPayoutSuccess(true)
      const newRecord: PayoutRecord = {
        id: `p_${Date.now()}`,
        reference_id: `PAY-GCASH-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: withdrawableBalance,
        gcash_number: payoutGcashNumber,
        status: 'completed',
        created_at: new Date().toISOString()
      }
      setPayouts(prev => [newRecord, ...prev])
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPayoutError(err.message)
      } else {
        setPayoutError('An unexpected error occurred.')
      }
    } finally {
      setPayoutLoading(false)
    }
  }

  // Task submit demo handler
  const handleClaimSlot = (job: JobListing) => {
    setSelectedJob(job)
    setCurrentStep('agreement')
  }

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob) return
    setCurrentStep('submitted')
    const reward = selectedJob.rate_per_tester
    setTotalEarnings(prev => prev + reward)
    setWithdrawableBalance(prev => prev + reward)
  }

  const handleCloseSuccess = () => {
    setCurrentStep('idle')
    setSelectedJob(null)
    setAnswerText('')
    setDifficultyRating(null)
    setRecordingUploaded(false)
    setImageUploaded(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-500 font-mono">Loading Tester Workspace...</span>
        </div>
      </div>
    )
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-[12px] p-8 max-w-md text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard Error</h2>
          <p className="text-sm text-gray-500">{loadingError}</p>
          <button onClick={() => fetchProfileAndListings()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-[8px]">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {currentStep === 'idle' && (
        <>
          {/* Header Banner */}
          <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-4xl mb-2 block">📱</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Tester Workspace</h1>
              <p className="text-gray-500 text-sm mt-1">
                Browse funded listings, claim testing slots, track your submissions, and withdraw earnings.
              </p>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-[10px] font-extrabold text-xs flex items-center gap-2 self-start md:self-auto transition-all shadow-xs"
            >
              <span>👤 Profile & Notifications</span>
            </button>
          </div>

          {/* Metric Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-[12px] p-5 shadow-xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block">Verified GCash Receiver</span>
                <span className="text-sm font-mono text-gray-800 font-bold">{gcashNumber}</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-[12px] p-5 shadow-xs flex items-center justify-center gap-4">
              <div className="w-11 h-11 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-500 font-semibold block">Available Balance</span>
                <span className="text-xl font-black text-emerald-600 block">₱{withdrawableBalance.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={withdrawableBalance === 0}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] text-xs font-bold disabled:opacity-50"
              >
                Withdraw
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-[12px] p-5 shadow-xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-[8px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block">Submissions Recorded</span>
                <span className="text-xl font-black text-gray-900 block">{submissions.length} Tasks</span>
              </div>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => switchTab('available')}
                className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-extrabold text-sm transition-all ${
                  activeTab === 'available'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Available Tests ({listings.length})</span>
              </button>

              <button
                onClick={() => switchTab('submissions')}
                className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-extrabold text-sm transition-all ${
                  activeTab === 'submissions'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>My Submissions ({submissions.length})</span>
              </button>

              <button
                onClick={() => switchTab('earnings')}
                className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-extrabold text-sm transition-all ${
                  activeTab === 'earnings'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Earnings & Payout History</span>
              </button>
            </nav>
          </div>

          {/* Tab 1: Available Tests */}
          {activeTab === 'available' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Open Testing Opportunities</h2>
                <span className="text-xs text-gray-500">Updated in real-time</span>
              </div>

              {listings.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-[12px] p-12 text-center text-gray-500 shadow-xs space-y-3">
                  <p className="text-lg font-semibold text-gray-700">No matching tasks found</p>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    Try configuring your profile demographics to unlock more target-matched jobs.
                  </p>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-[8px] hover:bg-purple-700"
                  >
                    Update Demographics Profile
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listings.map((job) => {
                    const btnConfig = getButtonConfig(job)
                    const isFull = job.slots_filled >= job.slots_count && !job.user_submission_status
                    return (
                      <div 
                        key={job.id} 
                        className={`bg-white border rounded-[12px] p-6 flex flex-col justify-between shadow-xs transition-all duration-200 ${
                          isFull ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-emerald-500 hover:shadow-md'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-2xl font-black text-emerald-700">₱{job.rate_per_tester}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-[8px] border font-bold ${
                              job.slots_filled >= job.slots_count
                                ? 'bg-gray-100 text-gray-500 border-gray-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {job.slots_filled >= job.slots_count ? 'Slots Filled' : `${job.slots_count - job.slots_filled} slots left`}
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-1.5 flex-wrap">
                            {job.title}
                            {job.is_quick_impression && (
                              <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                                ⚡ 5s Impression
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{job.description}</p>
    
                          <div className="flex flex-wrap gap-2 mb-6">
                            {job.requires_recording && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-[8px]">
                                <Video className="w-3 h-3" /> Screen Recording
                              </span>
                            )}
                            {job.requires_image && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-[8px]">
                                <ImageIcon className="w-3 h-3" /> Screenshot
                              </span>
                            )}
                            {(job.target_age_group || job.target_gender || job.target_employment_status || job.target_tech_literacy) && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-[8px] font-medium">
                                🎯 Target Match
                              </span>
                            )}
                          </div>
                        </div>
    
                        <Link
                          href={btnConfig.href}
                          className={`w-full py-2.5 font-bold text-sm rounded-[8px] text-center transition-all flex items-center justify-center ${btnConfig.className}`}
                          onClick={(e) => {
                            if (btnConfig.disabled) {
                              e.preventDefault()
                            }
                          }}
                        >
                          {btnConfig.text}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: My Submissions */}
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Your Submission History</h2>
                <span className="text-xs text-gray-500">{submissions.length} total entries</span>
              </div>

              {submissions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-[12px] p-12 text-center text-gray-500 shadow-xs space-y-3">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-base font-semibold text-gray-700">No submissions found</p>
                  <p className="text-sm text-gray-400">Claim an available task to start earning rewards.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => {
                    return (
                      <div 
                        key={sub.id} 
                        className="bg-white border border-gray-200 rounded-[12px] p-6 shadow-xs space-y-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                          <div>
                            <h3 className="font-extrabold text-base text-gray-900">{sub.listing_title}</h3>
                            <span className="text-xs text-gray-400 font-medium">
                              Submitted on {new Date(sub.submitted_at || sub.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-emerald-600">₱{sub.rate_per_tester}</span>
                            
                            {/* Status badge */}
                            {sub.status === 'approved' && (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Approved
                              </span>
                            )}
                            {sub.status === 'pending_review' && (
                              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-full flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Under Review
                              </span>
                            )}
                            {sub.status === 'disputed' && (
                              <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold rounded-full flex items-center gap-1">
                                <Scale className="w-3.5 h-3.5" /> Disputed
                              </span>
                            )}
                            {sub.status === 'rejected' && (
                              <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Rejected
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rejection Details & Dispute Action */}
                        {sub.status === 'rejected' && (
                          <div className="bg-rose-50 border border-rose-200 rounded-[10px] p-4 text-xs space-y-2">
                            <div className="font-bold text-rose-900">
                              Rejection Category: {formatRejectionReason(sub.rejection_reason)}
                            </div>
                            {sub.rejection_explanation && (
                              <p className="text-rose-950 italic">
                                &quot;{sub.rejection_explanation}&quot;
                              </p>
                            )}
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleOpenDispute(sub.id, sub.listing_title)}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-[6px] text-xs flex items-center gap-1.5 shadow-xs"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" /> Submit Rejection Dispute
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Dispute Details */}
                        {sub.status === 'disputed' && (
                          <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4 text-xs space-y-1">
                            <div className="font-bold text-amber-900 flex items-center gap-1.5">
                              <Scale className="w-4 h-4 text-amber-700" /> Dispute Reason: {formatDisputeReason(sub.dispute_reason)}
                            </div>
                            {sub.dispute_explanation && (
                              <p className="text-amber-950 italic">
                                &quot;{sub.dispute_explanation}&quot;
                              </p>
                            )}
                            <span className="text-[10px] text-amber-700 block pt-1">
                              Support team is reviewing this dispute. Escrow remains held.
                            </span>
                          </div>
                        )}

                        {/* Link to workspace */}
                        <div className="flex justify-end pt-1">
                          <Link
                            href={`/dashboard/tester/tasks/${sub.listing_id}`}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            View Workspace & Debrief Thread &rarr;
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Earnings & Payout History */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-[12px] p-6 shadow-xs">
                  <span className="text-xs text-gray-500 font-bold block uppercase tracking-wider mb-1">Total Earnings</span>
                  <span className="text-3xl font-black text-gray-900">₱{totalEarnings.toFixed(2)}</span>
                </div>

                <div className="bg-white border border-emerald-200 rounded-[12px] p-6 shadow-xs bg-emerald-50/30">
                  <span className="text-xs text-emerald-800 font-bold block uppercase tracking-wider mb-1">Withdrawable Balance</span>
                  <span className="text-3xl font-black text-emerald-700">₱{withdrawableBalance.toFixed(2)}</span>
                </div>

                <div className="bg-white border border-gray-200 rounded-[12px] p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-gray-500 font-bold block uppercase tracking-wider mb-1">Completed Payouts</span>
                    <span className="text-3xl font-black text-gray-900">{payouts.length} Transactions</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(true)}
                    disabled={withdrawableBalance === 0}
                    className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-[8px] text-xs shadow-xs disabled:opacity-50"
                  >
                    Request GCash Payout
                  </button>
                </div>
              </div>

              {/* Payout History Table */}
              <div className="bg-white border border-gray-200 rounded-[12px] overflow-hidden shadow-xs">
                <div className="p-5 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-extrabold text-base text-gray-900">GCash Payout History</h3>
                </div>

                {payouts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs font-mono">
                    No payout transactions requested yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-200">
                        <tr>
                          <th className="p-4">Reference ID</th>
                          <th className="p-4">Date & Time</th>
                          <th className="p-4">GCash Number</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {payouts.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="p-4 font-mono font-bold text-gray-900">{p.reference_id}</td>
                            <td className="p-4 text-gray-600">{new Date(p.created_at).toLocaleString()}</td>
                            <td className="p-4 text-gray-700 font-mono">{p.gcash_number}</td>
                            <td className="p-4 font-extrabold text-emerald-700">₱{p.amount.toFixed(2)}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase text-[10px]">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={handleUpdateProfile}
      />

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={disputeModalState.isOpen}
        onClose={() => setDisputeModalState(prev => ({ ...prev, isOpen: false }))}
        submissionId={disputeModalState.submissionId}
        listingTitle={disputeModalState.listingTitle}
        onSubmitDispute={handleDisputeSubmit}
      />

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" /> GCash Payout
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setShowPayoutModal(false)
                  setPayoutSuccess(false)
                  setPayoutError(null)
                  setPayoutGcashNumber('')
                }}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {payoutSuccess ? (
                <div className="text-center space-y-3 py-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900">Payout Requested!</h4>
                  <p className="text-sm text-gray-500">Your earnings have been successfully requested via GCash.</p>
                </div>
              ) : (
                <form onSubmit={handleRequestPayout} className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-[8px] flex justify-between items-center border border-gray-100">
                    <span className="text-sm font-semibold text-gray-600">Available Balance</span>
                    <span className="text-lg font-black text-emerald-600">₱{withdrawableBalance.toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">GCash Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={payoutGcashNumber}
                      onChange={e => setPayoutGcashNumber(e.target.value)}
                      placeholder="09XXXXXXXXX"
                      className="w-full p-2.5 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">Enter 11-digit Philippine mobile number.</p>
                  </div>

                  {payoutError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-[8px] flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{payoutError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPayoutModal(false)
                        setPayoutError(null)
                        setPayoutGcashNumber('')
                      }}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-[8px] hover:bg-gray-100 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={payoutLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-[8px] text-sm font-semibold shadow-sm flex items-center gap-2"
                    >
                      {payoutLoading ? 'Processing...' : 'Confirm Payout'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
