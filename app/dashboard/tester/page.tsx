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
  AlertCircle
} from 'lucide-react'
import { AgreementModal } from '@/components/shared/AgreementModal'
import { EscrowStatusBar } from '@/components/shared/EscrowStatusBar'
import { TimerDisplay } from '@/components/shared/TimerDisplay'
import { createBrowserClient } from '@/lib/supabase/client'
import { sanitizeDatabaseError } from '@/lib/utils/error'
import { JobListing, ButtonConfig, getButtonConfig } from '@/lib/utils/claim-button'

const AVAILABLE_JOBS: JobListing[] = [
  {
    id: 'j1',
    title: 'E-Commerce App GCash Checkout Test',
    description: 'Perform a checkout test using a staging payment link. Record the transition screen and verify the payment status updates.',
    rate_per_tester: 200,
    slots_count: 5,
    slots_filled: 3, // 2 slots left
    requires_recording: true,
    requires_image: true,
    question_text: 'Did the checkout screen display the correct GCash prompt? Describe any delays.',
    is_quick_impression: false
  },
  {
    id: 'j2',
    title: 'Rider Delivery App Pin Accuracy Verification',
    description: 'Verify pin locator and map loading efficiency on Android devices in urban zones.',
    rate_per_tester: 500,
    slots_count: 10,
    slots_filled: 10, // 0 slots left (should be unclickable)
    requires_recording: true,
    requires_image: false,
    question_text: 'Did the GPS pin lock onto your location accurately within 5 seconds?',
    is_quick_impression: false
  },
  {
    id: 'j3',
    title: 'Sari-Sari Store Inventory App Initial Run',
    description: 'Perform basic barcode scanning and item adding scenarios. Record any app crashes.',
    rate_per_tester: 50,
    slots_count: 3,
    slots_filled: 0, // 3 slots left
    requires_recording: false,
    requires_image: true,
    question_text: 'Did the camera scanner detect barcodes automatically without manual focus?',
    is_quick_impression: false
  },
  {
    id: 'j4',
    title: 'LRT Ticket Booking Mobile Flow Review',
    description: 'Check navigation lag and ticketing screen responsiveness on multiple Android models.',
    rate_per_tester: 100,
    slots_count: 1,
    slots_filled: 1, // 0 slots left (should be unclickable)
    requires_recording: true,
    requires_image: true,
    question_text: 'Describe any responsiveness glitches or slow rendering times on button clicks.',
    is_quick_impression: false
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

  // Profiles states
  const [totalEarnings, setTotalEarnings] = useState(400)
  const [gcashNumber, setGcashNumber] = useState('0917-***-5678')
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  
  // Interactive UI state machine
  // 'idle' -> 'agreement' -> 'active_task' -> 'submitted'
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

  // Demo panel toggle state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileAge, setProfileAge] = useState('')
  const [profileGender, setProfileGender] = useState('')
  const [profileEmployment, setProfileEmployment] = useState('')
  const [profileTech, setProfileTech] = useState('')
  const [accessibilityTags, setAccessibilityTags] = useState<string[]>([])

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
      let profileData = null
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
        // If the row was not found (PGRST116), try to insert a blank one
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
              // If insert fails (e.g. schema cache error / table missing), fallback to mock data
              profileData = { id: user.id, role: 'tester', age_group: '', gender: '', employment_status: '', tech_literacy: '', accessibility_tags: [] }
              profileError = null
            }
          } catch (insertErr) {
            profileData = { id: user.id, role: 'tester', age_group: '', gender: '', employment_status: '', tech_literacy: '', accessibility_tags: [] }
            profileError = null
          }
        } else if (profileError.message?.includes('profiles') || profileError.message?.includes('schema cache')) {
          // If the table doesn't exist, use mock local fallback
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
      setProfileAge(profileData.age_group || '')
      setProfileGender(profileData.gender || '')
      setProfileEmployment(profileData.employment_status || '')
      setProfileTech(profileData.tech_literacy || '')
      setAccessibilityTags(profileData.accessibility_tags || [])

      // Fetch tester earnings dynamically (from completed payouts)
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('amount')
        .eq('tester_id', user.id)
        .eq('status', 'completed')

      if (payoutsData) {
        const total = payoutsData.reduce((sum, p) => sum + p.amount, 0)
        setTotalEarnings(total)
      }

      // 2. Fetch all open listings
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
        // Fetch tester's active/past submissions from Supabase to track status per listing
        let userSubmissions: { id: string; listing_id: string; status: string }[] = []
        try {
          const { data: userSubsData } = await supabase
            .from('submissions')
            .select('id, listing_id, status')
            .eq('tester_id', user.id)
            .order('created_at', { ascending: false })

          if (userSubsData) {
            userSubmissions = userSubsData
          }
        } catch (err) {
          console.warn('Could not fetch user submissions:', err)
        }

        const mapped = (listingsData || []).map((listing: any) => {
          const firstTask = listing.tasks?.[0]
          
          // Match active or completed non-expired user submission
          const userSub = userSubmissions.find((s) => s.listing_id === listing.id && s.status !== 'expired')
          const userSubmissionStatus = (userSub ? userSub.status : null) as 'in_progress' | 'pending_review' | 'approved' | 'rejected' | null

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

        // 3. Filter listings based on demographic match and accessibility match
        const filtered = mapped.filter((listing: any) => {
          if (listing.target_age_group && listing.target_age_group !== profileData.age_group) return false
          if (listing.target_gender && listing.target_gender !== profileData.gender) return false
          if (listing.target_employment_status && listing.target_employment_status !== profileData.employment_status) return false
          if (listing.target_tech_literacy && listing.target_tech_literacy !== profileData.tech_literacy) return false
          
          if (listing.target_accessibility_tags && listing.target_accessibility_tags.length > 0) {
            const testerTags = profileData.accessibility_tags || []
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

  const handleUpdateProfileDemographics = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          age_group: profileAge || null,
          gender: profileGender || null,
          employment_status: profileEmployment || null,
          tech_literacy: profileTech || null,
          accessibility_tags: accessibilityTags
        })
        .eq('id', profile.id)

      if (error) {
        if (error.message?.includes('profiles') || error.message?.includes('schema cache')) {
          setProfile((prev: any) => prev ? {
            ...prev,
            age_group: profileAge,
            gender: profileGender,
            employment_status: profileEmployment,
            tech_literacy: profileTech,
            accessibility_tags: accessibilityTags
          } : null)
          setIsProfileModalOpen(false)
          return
        }
        throw error
      }
      setIsProfileModalOpen(false)
      await fetchProfileAndListings()
    } catch (err: unknown) {
      alert('Failed to update profile: ' + sanitizeDatabaseError(err))
    }
  }

  const handleClaimSlot = (job: JobListing) => {
    setSelectedJob(job)
    setCurrentStep('agreement')
  }

  const handleAcceptAgreement = () => {
    setCurrentStep('active_task')
  }

  const handleDeclineAgreement = () => {
    setSelectedJob(null)
    setCurrentStep('idle')
  }

  const startMockRecording = () => {
    setIsRecording(true)
    setTimeout(() => {
      setIsRecording(false)
      setRecordingUploaded(true)
    }, 3000) // Mock 3-second recording duration
  }

  const uploadMockImage = () => {
    setImageUploaded(true)
  }

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutError(null)
    setPayoutSuccess(false)
    
    // Validate GCash format (11 digits, starts with 09)
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
        body: JSON.stringify({ amount: totalEarnings, gcash_number: payoutGcashNumber })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to request payout')
      }

      setPayoutSuccess(true)
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

  // Submit validation: is answer long enough? is recording ready if required? is image uploaded if required? is rating set?
  const isFormValid = () => {
    if (!selectedJob) return false
    const textValid = answerText.trim().length >= 10
    const ratingValid = difficultyRating !== null && difficultyRating >= 1 && difficultyRating <= 5
    const recordingValid = !selectedJob.requires_recording || recordingUploaded
    const imageValid = !selectedJob.requires_image || imageUploaded
    
    return textValid && ratingValid && recordingValid && imageValid
  }

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid() || !selectedJob) return

    // Go to submission completion page
    setCurrentStep('submitted')
    
    // Simulate updating earnings
    const reward = selectedJob.rate_per_tester
    setTotalEarnings(prev => prev + reward)
  }

  const handleCloseSuccess = () => {
    // Reset workspace state
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
          <span className="text-sm font-semibold text-gray-500 font-mono">Loading Tester Dashboard...</span>
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
    <div className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] p-8 max-w-5xl mx-auto">
      {currentStep === 'idle' && (
        <>
          {/* Back button */}
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard selection
          </Link>

          {/* Notion-style Header */}
          <div className="border-b border-gray-200 pb-6 mb-8">
            <span className="text-4xl mb-2 block">📱</span>
            <h1 className="text-4xl font-extrabold tracking-tight">Tester Workspace</h1>
            <p className="text-gray-500 mt-2">
              Browse funded listings, claim slots, record testing sessions, and verify GCash cashouts.
            </p>
          </div>

          {/* Profile Summary & Verified GCash Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* GCash Verification */}
            <div className="bg-white border border-gray-200 rounded-[12px] p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Verified GCash Receiver</h3>
                <p className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border inline-block">
                  {gcashNumber}
                </p>
                <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> GCash Account Verified
                </div>
              </div>
            </div>

            {/* Total Earnings */}
            <div className="bg-white border border-gray-200 rounded-[12px] p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Total Verified Earnings</h3>
                <span className="text-2xl font-black text-gray-900 block">₱{totalEarnings.toFixed(2)}</span>
                <button 
                  onClick={() => setShowPayoutModal(true)}
                  disabled={totalEarnings === 0}
                  className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request GCash Payout &rarr;
                </button>
              </div>
            </div>

            {/* Demographic Profile summary */}
            <div className="bg-white border border-gray-200 rounded-[12px] p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-[8px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold text-lg">
                👤
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Demographics Profile</h3>
                <div className="text-xs text-gray-600 space-y-0.5 mt-2">
                  <div>Age: <span className="font-semibold text-gray-800">{profile?.age_group || 'Not set'}</span></div>
                  <div>Gender: <span className="font-semibold text-gray-800">{profile?.gender || 'Not set'}</span></div>
                  <div>Job: <span className="font-semibold text-gray-800">{profile?.employment_status || 'Not set'}</span></div>
                  <div>Tech: <span className="font-semibold text-gray-800">{profile?.tech_literacy || 'Not set'}</span></div>
                </div>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="mt-3 text-xs font-semibold text-purple-600 hover:text-purple-800"
                >
                  Configure Demographics &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Available Jobs Grid */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Available Testing Slots</h2>
            
            {listings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-[12px] p-12 text-center text-gray-500 shadow-sm space-y-3">
                <p className="text-lg font-semibold text-gray-700">No matching tasks found</p>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Try updating your demographics profile above to unlock more target-matched jobs, or check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((job) => {
                  const btnConfig = getButtonConfig(job)
                  const isFull = job.slots_filled >= job.slots_count && !job.user_submission_status
                  return (
                    <div 
                      key={job.id} 
                      className={`bg-white border rounded-[12px] p-6 flex flex-col justify-between shadow-sm transition-all duration-200 ${
                        isFull ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-emerald-500 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xl font-black text-emerald-700">₱{job.rate_per_tester}</span>
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
  
                        {/* Deliverables & Targets details */}
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
                            e.preventDefault();
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
        </>
      )}

      {/* Active Agreement Modal step */}
      {currentStep === 'agreement' && selectedJob && (
        <AgreementModal 
          title={`Acknowledge Testing Guidelines: ${selectedJob.title}`}
          content={NDA_CONTENT}
          onAccept={handleAcceptAgreement}
          onDecline={handleDeclineAgreement}
        />
      )}

      {/* Active task section demonstration */}
      {currentStep === 'active_task' && selectedJob && (
        <div className="bg-white border border-gray-200 rounded-[12px] overflow-hidden shadow-md flex flex-col relative">
          
          {/* 1. Timer Display Mockup */}
          <TimerDisplay 
            initialSeconds={1800} 
            onExpire={() => alert('Demo Timer Expired!')} 
          />

          {/* 2. Escrow Status Bar Mockup */}
          <EscrowStatusBar 
            budget={selectedJob.rate_per_tester} 
            slots={selectedJob.slots_count - selectedJob.slots_filled} 
            status="active" 
          />

          {/* Main workspace area */}
          <div className="p-8 space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-extrabold mb-1">Testing Workspace: {selectedJob.title}</h2>
              <p className="text-sm text-gray-500">Submit verified evidence below. Be accurate to secure the escrow payout.</p>
            </div>

            {/* Instruction cards */}
            <div className="bg-gray-50 rounded-[8px] p-5 border border-gray-100">
              <h3 className="font-bold text-sm text-gray-700 mb-2">Detailed Task Steps:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {selectedJob.description}
              </p>
            </div>

            <form onSubmit={handleTaskSubmit} className="space-y-6">
              
              {/* Question text response */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{selectedJob.question_text}</label>
                <textarea
                  required
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Explain clearly in at least 10 characters..."
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-[8px] focus:outline-none focus:border-emerald-600 text-sm focus:ring-1 focus:ring-emerald-600"
                />
                <span className="text-xs text-gray-400 mt-1 block">
                  Character count: {answerText.length} / 10 required
                </span>
              </div>

              {/* Media Evidence Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Recording Upload/Mock */}
                {selectedJob.requires_recording && (
                  <div className="p-5 border border-gray-200 rounded-[12px] flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5 mb-1">
                        <Video className="w-4 h-4 text-emerald-600" /> Screen Recording
                      </h4>
                      <p className="text-xs text-gray-400 mb-4">Record your flow simulation on this device.</p>
                    </div>

                    {recordingUploaded ? (
                      <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[8px] flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> recording_session.mp4 uploaded
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setRecordingUploaded(false)}
                          className="underline hover:text-emerald-900"
                        >
                          Redo
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startMockRecording}
                        disabled={isRecording}
                        className={`w-full py-2.5 border text-xs font-semibold rounded-[8px] flex items-center justify-center gap-2 transition-all ${
                          isRecording 
                            ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <Square className="w-4 h-4 fill-rose-600" /> Recording (3s Mock)...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" /> Start Screen Recording
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {selectedJob.requires_image && (
                  <div className="p-5 border border-gray-200 rounded-[12px] flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5 mb-1">
                        <ImageIcon className="w-4 h-4 text-emerald-600" /> Screenshot Evidence
                      </h4>
                      <p className="text-xs text-gray-400 mb-4">Upload checkout success page or validation screen.</p>
                    </div>

                    {imageUploaded ? (
                      <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[8px] flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> checkout_screenshot.png uploaded
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setImageUploaded(false)}
                          className="underline hover:text-emerald-900"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={uploadMockImage}
                        className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-[8px] flex items-center justify-center gap-2 transition-all"
                      >
                        <UploadCloud className="w-4 h-4" /> Mock Image Upload
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Difficulty Rating (1-5 constraint) */}
              <div className="p-5 border border-gray-200 rounded-[12px]">
                <label className="block text-sm font-bold text-gray-700 mb-3">Rate the task difficulty:</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDifficultyRating(val)}
                      className={`w-10 h-10 rounded-[8px] border font-bold text-sm flex items-center justify-center transition-all ${
                        difficultyRating === val
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                  <span>Very Easy (1)</span>
                  <span>Very Hard (5)</span>
                </div>
              </div>

              {/* Submit trigger button (stays disabled until required questions are completed) */}
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDeclineAgreement}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-sm font-semibold rounded-[8px] text-gray-700"
                >
                  Forfeit Slot
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`px-6 py-3 font-extrabold text-sm rounded-[8px] text-white shadow-sm transition-all ${
                    isFormValid() 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Submit Test Submission
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Submitted and completed success state */}
      {currentStep === 'submitted' && selectedJob && (
        <div className="bg-white border border-gray-200 rounded-[12px] p-8 max-w-lg mx-auto text-center shadow-md space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Task Submitted Successfully!</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Your responses and media evidence are now stored. The poster has a review window of {selectedJob.requires_recording ? '60' : '30'} minutes.
            </p>
            <p className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded px-3 py-1.5 inline-block mt-4">
              ₱{selectedJob.rate_per_tester} has been reserved for you in Escrow.
            </p>
          </div>
          <button
            onClick={handleCloseSuccess}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-[8px] text-sm shadow-sm transition-all"
          >
            Acknowledge & Return to Dashboard
          </button>
        </div>
      )}

      {/* Profile Demographics Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-extrabold text-lg">Configure Profile Demographics</h3>
              <button 
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateProfileDemographics} className="p-6 space-y-4">
              <p className="text-xs text-gray-500 mb-4">
                Posters target specific demographics to test their applications. Provide accurate info to unlock target-matched tasks.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Age Group</label>
                <select
                  value={profileAge}
                  onChange={e => setProfileAge(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-[8px] bg-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Not Specified</option>
                  <option value="18-24">18 - 24 years old</option>
                  <option value="25-34">25 - 34 years old</option>
                  <option value="35-44">35 - 44 years old</option>
                  <option value="45+">45+ years old</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Gender</label>
                <select
                  value={profileGender}
                  onChange={e => setProfileGender(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-[8px] bg-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Not Specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Employment Status</label>
                <select
                  value={profileEmployment}
                  onChange={e => setProfileEmployment(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-[8px] bg-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Not Specified</option>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="student">Student</option>
                  <option value="self-employed">Self-Employed / Freelancer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Tech Literacy Level</label>
                <select
                  value={profileTech}
                  onChange={e => setProfileTech(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-[8px] bg-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Not Specified</option>
                  <option value="non_technical">Non-Technical</option>
                  <option value="casual_user">Casual User</option>
                  <option value="student_dev">Developer / Technical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Accessibility Accommodations</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accessibilityTags.includes('screen_reader')}
                      onChange={e => {
                        if (e.target.checked) {
                          setAccessibilityTags([...accessibilityTags, 'screen_reader']);
                        } else {
                          setAccessibilityTags(accessibilityTags.filter(t => t !== 'screen_reader'));
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    I use a Screen Reader
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accessibilityTags.includes('keyboard_only')}
                      onChange={e => {
                        if (e.target.checked) {
                          setAccessibilityTags([...accessibilityTags, 'keyboard_only']);
                        } else {
                          setAccessibilityTags(accessibilityTags.filter(t => t !== 'keyboard_only'));
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    I navigate using Keyboard-Only
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accessibilityTags.includes('color_blind')}
                      onChange={e => {
                        if (e.target.checked) {
                          setAccessibilityTags([...accessibilityTags, 'color_blind']);
                        } else {
                          setAccessibilityTags(accessibilityTags.filter(t => t !== 'color_blind'));
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    I have a Color Blindness profile
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-[8px] hover:bg-gray-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-[8px] text-xs font-semibold shadow-sm transition-all"
                >
                  Save Demographics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <span className="text-lg font-black text-emerald-600">₱{totalEarnings.toFixed(2)}</span>
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
