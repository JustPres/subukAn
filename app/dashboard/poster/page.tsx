'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Plus, 
  Wallet, 
  Users, 
  ArrowLeft, 
  Trash2, 
  AlertCircle,
  FileText,
  HelpCircle,
  Check,
  Copy,
  Download,
  Briefcase,
  AlertTriangle
} from 'lucide-react'
import { createListingSchema, CUSTOM_RATE_TIERS } from '@/lib/validation/schemas'
import { createBrowserClient } from '@/lib/supabase/client'
import { sanitizeDatabaseError } from '@/lib/utils/error'

interface Listing {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  site_url: string;
  rate_per_tester: number;
  slots_count: number;
  slots_filled: number;
  total_budget: number;
  status: string;
  review_window_minutes: 30 | 60;
  created_at: string;
  updated_at: string;
}

function PosterDashboardContent() {
  const supabase = createBrowserClient()

  // General state
  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  const [profile, setProfile] = useState<any>(null)

  // Tab & Custom Payment Settings states
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') || 'overview'
  const activeTab = (tabParam === 'settings') ? 'settings' : 'overview'

  const [paymentSettings, setPaymentSettings] = useState({
    sandbox_mode: true,
    paymongo_public_key: '',
    paymongo_secret_key: '',
    gcash_payout_number: ''
  })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  // Form states for creating a new listing
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSiteUrl, setFormSiteUrl] = useState('')
  const [formRate, setFormRate] = useState<number>(200)
  const [formSlots, setFormSlots] = useState<number>(5)
  const [formReviewWindow, setFormReviewWindow] = useState<30 | 60>(30)
  const [formQuestions, setFormQuestions] = useState<Array<{ question_text: string; requires_recording: boolean; requires_image: boolean }>>([
    { question_text: 'Did the checkout screen display the correct GCash prompt?', requires_recording: true, requires_image: false }
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Demographic targeting states
  const [targetAgeGroup, setTargetAgeGroup] = useState('')
  const [targetGender, setTargetGender] = useState('')
  const [targetEmploymentStatus, setTargetEmploymentStatus] = useState('')
  const [targetTechLiteracy, setTargetTechLiteracy] = useState('')
  const [targetAccessibilityTags, setTargetAccessibilityTags] = useState<string[]>([])

  // A/B Testing & Iterations
  const [isABTesting, setIsABTesting] = useState(false)
  const [formVariants, setFormVariants] = useState<Array<{ id: string; title: string; url: string; weight: number }>>([
    { id: 'A', title: 'Variant A', url: '', weight: 50 },
    { id: 'B', title: 'Variant B', url: '', weight: 50 }
  ])
  const [parentListingId, setParentListingId] = useState('')

  // Quick impression state
  const [isQuickImpression, setIsQuickImpression] = useState(false)
  const [impressionDurationSeconds, setImpressionDurationSeconds] = useState<number>(5)

  // Fetch listings and user info
  const fetchUserAndListings = useCallback(async () => {
    setLoading(true)
    setLoadingError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setLoadingError('You must be authenticated to view this page.')
        setLoading(false)
        return
      }

      setUser(user)

      // Fetch user profile settings
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }

      // Fetch payment settings from secure poster_payment_settings table
      const { data: paymentData } = await supabase
        .from('poster_payment_settings')
        .select('payment_settings')
        .eq('id', user.id)
        .single()
      
      if (paymentData && paymentData.payment_settings) {
        setPaymentSettings(prev => ({ ...prev, ...paymentData.payment_settings }))
      }

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          submissions (
            id,
            status
          )
        `)
        .eq('poster_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setLoadingError(sanitizeDatabaseError(error, 'Failed to retrieve listings.'))
      } else {
        const mappedListings = (data || []).map((listing: any) => ({
          ...listing,
          slots_filled: listing.submissions 
            ? listing.submissions.filter((s: any) => s.status !== 'expired' && s.status !== 'rejected').length 
            : 0
        }))
        setListings(mappedListings)
      }
    } catch (err) {
      setLoadingError(sanitizeDatabaseError(err, 'Failed to retrieve listings.'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUserAndListings()
  }, [fetchUserAndListings])

  useEffect(() => {
    if (tabParam === 'listings') {
      const target = document.getElementById('listings-container')
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [tabParam])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setSettingsSaving(true)
    setSettingsSuccess(null)
    setSettingsError(null)
    
    try {
      const { error } = await supabase
        .from('poster_payment_settings')
        .upsert({ id: user.id, payment_settings: paymentSettings })
        
      if (error) throw error
      setSettingsSuccess('Payment settings updated successfully!')
    } catch (err: any) {
      console.error(err)
      setSettingsError(err.message || 'Failed to update payment settings.')
    } finally {
      setSettingsSaving(false)
    }
  }

  // Escrow Calculations: Total locked funds across active (non-released, non-expired) listings
  const calculateEscrowFunds = () => {
    return listings
      .filter(l => l.status !== 'released' && l.status !== 'expired')
      .reduce((sum, l) => sum + l.total_budget, 0)
  }

  const handleAddQuestion = () => {
    setFormQuestions([...formQuestions, { question_text: '', requires_recording: false, requires_image: false }])
  }

  const handleRemoveQuestion = (index: number) => {
    if (formQuestions.length === 1) return
    const updated = [...formQuestions]
    updated.splice(index, 1)
    setFormQuestions(updated)
  }

  const handleQuestionTextChange = (index: number, text: string) => {
    const updated = [...formQuestions]
    updated[index].question_text = text
    setFormQuestions(updated)
  }

  const handleCheckboxChange = (index: number, field: 'requires_recording' | 'requires_image') => {
    const updated = [...formQuestions]
    updated[index][field] = !updated[index][field]
    setFormQuestions(updated)
  }

  const handleCreateListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitError(null)

    if (!user) {
      setSubmitError('User session not found. Please log in again.')
      return
    }

    const inputData = {
      title: formTitle,
      description: formDescription,
      site_url: formSiteUrl || undefined,
      rate_per_tester: formRate,
      slots_count: formSlots,
      total_budget: formRate * formSlots,
      review_window_minutes: formReviewWindow,
      questions: formQuestions,
      target_age_group: targetAgeGroup || undefined,
      target_gender: targetGender || undefined,
      target_employment_status: targetEmploymentStatus || undefined,
      target_tech_literacy: targetTechLiteracy || undefined,
      target_accessibility_tags: targetAccessibilityTags.length > 0 ? targetAccessibilityTags : undefined,
      is_quick_impression: isQuickImpression,
      impression_duration_seconds: isQuickImpression ? impressionDurationSeconds : undefined,
      parent_listing_id: parentListingId || undefined,
      variants: isABTesting ? formVariants : undefined,
    }

    const validation = createListingSchema.safeParse(inputData)

    if (!validation.success) {
      const formattedErrors: Record<string, string> = {}
      validation.error.issues.forEach(issue => {
        const path = issue.path.join('.')
        formattedErrors[path] = issue.message
      })
      setErrors(formattedErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Insert listing row
      const { data: newListing, error: listingError } = await supabase
        .from('listings')
        .insert({
          poster_id: user.id,
          title: formTitle,
          description: formDescription,
          site_url: formSiteUrl || null,
          rate_per_tester: formRate,
          slots_count: formSlots,
          total_budget: formRate * formSlots,
          review_window_minutes: formReviewWindow,
          status: 'open',
          target_age_group: targetAgeGroup || null,
          target_gender: targetGender || null,
          target_employment_status: targetEmploymentStatus || null,
          target_tech_literacy: targetTechLiteracy || null,
          target_accessibility_tags: targetAccessibilityTags,
          is_quick_impression: isQuickImpression,
          impression_duration_seconds: isQuickImpression ? impressionDurationSeconds : null,
          parent_listing_id: parentListingId || null,
          variants: isABTesting ? formVariants : [],
        })
        .select()
        .single()

      if (listingError) {
        throw listingError
      }

      if (!newListing) {
        throw new Error('Listing creation returned no data.')
      }

      // 2. Insert rows into the tasks table matching the defined questions under the listing ID
      const tasksData = formQuestions.map((q, index) => ({
        listing_id: newListing.id,
        order_index: index,
        question_text: q.question_text,
        requires_recording: q.requires_recording,
        requires_image: q.requires_image
      }))

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksData)

      if (tasksError) {
        throw tasksError
      }

      // 3. Reset form
      setFormTitle('')
      setFormDescription('')
      setFormSiteUrl('')
      setFormRate(200)
      setFormSlots(5)
      setFormReviewWindow(30)
      setFormQuestions([
        { question_text: 'Did the checkout screen display the correct GCash prompt?', requires_recording: true, requires_image: false }
      ])
      setTargetAgeGroup('')
      setTargetGender('')
      setTargetEmploymentStatus('')
      setTargetTechLiteracy('')
      setTargetAccessibilityTags([])
      setIsABTesting(false)
      setFormVariants([
        { id: 'A', title: 'Variant A', url: '', weight: 50 },
        { id: 'B', title: 'Variant B', url: '', weight: 50 }
      ])
      setParentListingId('')
      setIsQuickImpression(false)
      setImpressionDurationSeconds(5)

      const mockLinkId = `link_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
      const mockUrl = `https://checkout.paymongo.com/mock/${mockLinkId}?ref=${newListing.id}&amt=${newListing.total_budget * 100}`;
      setCheckoutUrl(mockUrl);

      // 4. Refresh listings
      await fetchUserAndListings()
    } catch (err) {
      setSubmitError(sanitizeDatabaseError(err, 'An error occurred during submission.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get color badges for database statuses ('open', 'filling', 'review', 'released', 'rejected', 'expired')
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span className="status-dot bg-sky-500" /> Open / Funding
          </span>
        )
      case 'filling':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span className="status-dot bg-amber-500" /> Active (Slots Filling)
          </span>
        )
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span className="status-dot bg-purple-500" /> Under Review
          </span>
        )
      case 'released':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span className="status-dot bg-emerald-500" /> Payment Released
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span className="status-dot bg-rose-500" /> Rejected
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span className="status-dot bg-gray-500" /> Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span className="status-dot bg-gray-400" /> {status || 'Unknown'}
          </span>
        )
    }
  }

  // Duplicate listing: pre-fill the creation modal with an existing listing's data
  const handleDuplicateListing = (listing: Listing) => {
    setFormTitle(`${listing.title} (Copy)`)
    setFormDescription(listing.description)
    setFormSiteUrl(listing.site_url || '')
    setFormRate(listing.rate_per_tester)
    setFormSlots(listing.slots_count)
    setFormReviewWindow(listing.review_window_minutes)
    setCheckoutUrl(null)
    setErrors({})
    setSubmitError(null)
    setIsModalOpen(true)
  }

  // Generate and download a spend receipt for a listing
  const handleDownloadReceipt = (listing: Listing) => {
    const receiptDate = new Date().toISOString().split('T')[0]
    const createdDate = formatDate(listing.created_at)
    const statusLabel = listing.status.charAt(0).toUpperCase() + listing.status.slice(1)
    const amountPaid = listing.status === 'released' ? listing.total_budget : 0

    const receiptContent = [
      '═══════════════════════════════════════════',
      '           subukAn — Spend Receipt         ',
      '═══════════════════════════════════════════',
      '',
      `Receipt Date:      ${receiptDate}`,
      `Listing ID:        ${listing.id}`,
      `Listing Title:     ${listing.title}`,
      `Created:           ${createdDate}`,
      '',
      '───────────────────────────────────────────',
      '  Financial Summary',
      '───────────────────────────────────────────',
      '',
      `Rate per Tester:   ₱${listing.rate_per_tester}`,
      `Total Slots:       ${listing.slots_count}`,
      `Slots Filled:      ${listing.slots_filled}`,
      `Escrow Budget:     ₱${listing.total_budget.toLocaleString()}`,
      `Amount Paid Out:   ₱${amountPaid.toLocaleString()}`,
      `Listing Status:    ${statusLabel}`,
      '',
      '───────────────────────────────────────────',
      '',
      'This receipt is generated for record-keeping purposes.',
      'For disputes or questions, contact support@subukan.ph',
      '',
      '═══════════════════════════════════════════',
    ].join('\n')

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subukan-receipt-${listing.id.slice(0, 8)}-${receiptDate}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split('T')[0]
    } catch (e) {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 font-medium text-sm animate-pulse">Loading Poster Workspace...</p>
        </div>
      </div>
    )
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] flex items-center justify-center p-8">
        <div className="bg-white border border-rose-200 rounded-[12px] p-6 max-w-md w-full shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Failed to Load Workspace</h3>
            <p className="text-sm text-gray-500 mt-1">{loadingError}</p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => fetchUserAndListings()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-[8px] transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'settings') {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 select-none">Poster Settings</h1>
            <p className="text-sm text-gray-500 font-medium">Manage sandbox credentials and GCash mock payout options.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[12px] p-6 max-w-2xl shadow-sm">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {settingsSuccess && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-2 rounded-[8px]">
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{settingsSuccess}</span>
              </div>
            )}
            {settingsError && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-[8px]">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

            {/* Sandbox Mode Switch */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <label className="text-sm font-bold text-gray-900 block">Sandbox Mode</label>
                <span className="text-xs text-gray-500">Enable GCash/PayMongo mock simulations without processing real API operations.</span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentSettings(prev => ({ ...prev, sandbox_mode: !prev.sandbox_mode }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  paymentSettings.sandbox_mode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    paymentSettings.sandbox_mode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* PayMongo API credentials */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900">PayMongo Sandbox Keys</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Public Key</label>
                  <input
                    type="text"
                    value={paymentSettings.paymongo_public_key}
                    onChange={e => setPaymentSettings(prev => ({ ...prev, paymongo_public_key: e.target.value }))}
                    placeholder="pk_test_..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:border-blue-500 bg-white text-gray-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Secret Key</label>
                  <input
                    type="password"
                    value={paymentSettings.paymongo_secret_key}
                    onChange={e => setPaymentSettings(prev => ({ ...prev, paymongo_secret_key: e.target.value }))}
                    placeholder="sk_test_..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:border-blue-500 bg-white text-gray-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payout configuration */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Payout Configuration</h3>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">GCash Payout Number</label>
                <input
                  type="text"
                  value={paymentSettings.gcash_payout_number}
                  onChange={e => setPaymentSettings(prev => ({ ...prev, gcash_payout_number: e.target.value }))}
                  placeholder="e.g. 09171234567"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:border-blue-500 bg-white text-gray-800 font-mono"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={settingsSaving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[8px] text-sm transition-all disabled:opacity-50"
              >
                {settingsSaving ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Back button */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-slate-500 hover:text-[#0F172A] text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard selection
      </Link>

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-poppins flex items-center gap-2">
            Poster Workspace
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Welcome back, {profile?.full_name || 'Poster'} 👋 Ready to review some tests today?
          </p>
        </div>
      </div>

      {/* Escrow Ledger Card (The One Loud Element) */}
      <div className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 hover-lift">
        <div className="space-y-2 relative z-10">
          <span className="text-xs text-indigo-100/80 font-bold tracking-wider uppercase block">Total Escrow Funds Locked</span>
          <div className="space-y-1">
            <span className="text-4xl font-black font-mono-numbers block tracking-tight">
              ₱{calculateEscrowFunds().toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-indigo-100/80 pt-1">
            <span className="bg-white/20 text-white rounded-full px-2 py-0.5 font-bold uppercase text-[9px]">
              PayMongo Account Verified
            </span>
            <span className="text-white/20">|</span>
            <span className="font-semibold font-mono-numbers text-indigo-100/90">
              {listings.filter(l => l.status !== 'released' && l.status !== 'expired').length} Active Listings
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setSubmitError(null)
            setErrors({})
            setIsModalOpen(true)
          }}
          className="relative z-10 px-6 py-3 bg-white hover:bg-slate-50 text-[#6366F1] rounded-xl text-sm font-black shadow-md transition-all whitespace-nowrap self-start md:self-center flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" /> Create New Listing
        </button>
      </div>

      {/* Listings Section */}
      <div id="listings-container">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" /> My Testing Listings
        </h2>
        
        <div className="bg-white border border-gray-200 rounded-[12px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {listings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                You have not created any listings yet. Click &quot;Create New Listing&quot; to get started!
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Title</th>
                    <th className="p-3">Slots</th>
                    <th className="p-3">Rate per Tester</th>
                    <th className="p-3">Escrow Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {listings.map(listing => (
                    <tr key={listing.id} className="hover:bg-indigo-50/10 transition-colors border-b border-slate-200 last:border-0">
                      <td className="p-3 font-bold text-[#0F172A] max-w-xs truncate">
                        <Link href={`/dashboard/poster/listings/${listing.id}`} className="hover:text-[#6366F1] hover:underline">
                          {listing.title}
                        </Link>
                      </td>
                      <td className="p-3 text-slate-600 font-mono-numbers">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{listing.slots_filled} / {listing.slots_count}</span>
                        </div>
                      </td>
                      <td className="p-3 font-black text-[#0F172A] font-mono-numbers">₱{listing.rate_per_tester}</td>
                      <td className="p-3 text-slate-500 font-extrabold font-mono-numbers">₱{listing.total_budget}</td>
                      <td className="p-3">{getStatusBadge(listing.status)}</td>
                      <td className="p-3 text-slate-550 font-mono-numbers">{formatDate(listing.created_at)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateListing(listing)}
                            title="Duplicate listing"
                            className="p-1.5 text-slate-400 hover:text-[#6366F1] hover:bg-indigo-50 rounded-[6px] transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(listing)}
                            title="Download receipt"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-[6px] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Listing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-extrabold text-xl">Create New Testing Round</h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            {checkoutUrl ? (
              <div className="p-6 space-y-6 text-center overflow-y-auto flex-1">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Listing Created & Pending Escrow</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Your testing round has been created. Complete the mock payment to activate your listing.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 font-mono text-xs break-all text-blue-600 select-all">
                  <a href={checkoutUrl} target="_blank" rel="noreferrer" id="mock-checkout-link" className="hover:underline">
                    {checkoutUrl}
                  </a>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutUrl(null);
                      setIsModalOpen(false);
                    }}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] text-sm font-semibold shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateListingSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Errors Block */}
                {(Object.keys(errors).length > 0 || submitError) && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-[8px] flex gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Please correct the errors in the form:</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                        {submitError && <li>{submitError}</li>}
                        {Object.entries(errors).map(([key, msg]) => (
                          <li key={key}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Listing Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g., Rider App Map Pin Accuracy Review"
                    className="w-full p-2.5 border border-gray-200 rounded-[8px] focus:outline-none focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                {/* Site URL */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Site URL</label>
                  <input
                    type="url"
                    value={formSiteUrl}
                    onChange={e => setFormSiteUrl(e.target.value)}
                    placeholder="https://example.com — the site testers will visit"
                    className="w-full p-2.5 border border-gray-200 rounded-[8px] focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Describe step-by-step what the tester needs to do and check..."
                    rows={4}
                    className="w-full p-2.5 border border-gray-200 rounded-[8px] focus:outline-none focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rate per Tester */}
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700">Rate per Tester</label>
                    <select
                      value={formRate}
                      onChange={e => setFormRate(Number(e.target.value))}
                      className="w-full p-2.5 border border-gray-200 rounded-[8px] bg-white text-sm focus:outline-none"
                    >
                      {CUSTOM_RATE_TIERS.map(tier => (
                        <option key={tier} value={tier}>
                          ₱{tier} per tester
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slots Count */}
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700 flex items-center gap-1">
                      Slots Count 
                      <span className="group relative">
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded p-2 w-48 hidden group-hover:block z-10 font-normal">
                          Must be 1 (for preview round) or between 3 and 100.
                        </span>
                      </span>
                    </label>
                    <input
                      type="number"
                      value={formSlots}
                      onChange={e => setFormSlots(Number(e.target.value))}
                      className="w-full p-2.5 border border-gray-200 rounded-[8px] focus:outline-none focus:border-blue-500 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Escrow Preview summary */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-[8px] flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500 block">Total Escrow Budget to deposit</span>
                    <span className="text-xs text-gray-400">Escrow verification: Rate x Slots</span>
                  </div>
                  <span className="text-xl font-black text-blue-800">₱{formRate * formSlots}</span>
                </div>

                {/* Review Window */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Poster Review Window</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="review_window"
                        checked={formReviewWindow === 30}
                        onChange={() => setFormReviewWindow(30)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      30 minutes (Fast validation)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="review_window"
                        checked={formReviewWindow === 60}
                        onChange={() => setFormReviewWindow(60)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      60 minutes (Standard listing)
                    </label>
                  </div>
                </div>

                {/* Demographic Targeting */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <h4 className="text-sm font-bold text-gray-800">Demographic Targeting (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Target Age Group</label>
                      <select
                        value={targetAgeGroup}
                        onChange={e => setTargetAgeGroup(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-[8px] bg-white text-xs focus:outline-none"
                      >
                        <option value="">All Age Groups</option>
                        <option value="18-24">18 - 24 years old</option>
                        <option value="25-34">25 - 34 years old</option>
                        <option value="35-44">35 - 44 years old</option>
                        <option value="45+">45+ years old</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Target Gender</label>
                      <select
                        value={targetGender}
                        onChange={e => setTargetGender(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-[8px] bg-white text-xs focus:outline-none"
                      >
                        <option value="">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Target Employment Status</label>
                      <select
                        value={targetEmploymentStatus}
                        onChange={e => setTargetEmploymentStatus(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-[8px] bg-white text-xs focus:outline-none"
                      >
                        <option value="">All Employment Statuses</option>
                        <option value="employed">Employed</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="student">Student</option>
                        <option value="self-employed">Self-Employed / Freelancer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Target Tech Literacy</label>
                      <select
                        value={targetTechLiteracy}
                        onChange={e => setTargetTechLiteracy(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-[8px] bg-white text-xs focus:outline-none"
                      >
                        <option value="">All Literacy Levels</option>
                        <option value="non_technical">Non-Technical</option>
                        <option value="casual_user">Casual User</option>
                        <option value="student_dev">Developer / Technical</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quick Impression Test Switch */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-bold text-gray-800 block">5-Second Quick Impression Test</label>
                      <span className="text-xs text-gray-400">Limit tester view time to capture pure visual recall.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isQuickImpression}
                      onChange={e => setIsQuickImpression(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
                    />
                  </div>

                  {isQuickImpression && (
                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-[8px] space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700">Impression Duration (Seconds):</label>
                        <input
                          type="number"
                          min={5}
                          max={30}
                          value={impressionDurationSeconds}
                          onChange={e => setImpressionDurationSeconds(Number(e.target.value))}
                          className="w-20 p-1 border border-gray-200 rounded-[6px] text-xs focus:outline-none text-center bg-white"
                        />
                      </div>
                      <p className="text-[11px] text-yellow-800 leading-normal flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>
                          Testers will only have {impressionDurationSeconds} seconds to look at your site/image before it blurs. They cannot right-click or take manual screenshots.
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* A/B Testing Section */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-bold text-gray-800 block">Enable A/B Comparative Testing</label>
                      <span className="text-xs text-gray-400">Route testers randomly between two variants of your web app.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isABTesting}
                      onChange={e => setIsABTesting(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
                    />
                  </div>

                  {isABTesting && (
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-[8px] space-y-4">
                      {formVariants.map((v, idx) => (
                        <div key={v.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-0.5">Variant Label</label>
                            <input
                              type="text"
                              value={v.title}
                              onChange={e => {
                                const updated = [...formVariants];
                                updated[idx].title = e.target.value;
                                setFormVariants(updated);
                              }}
                              className="w-full p-2 border border-gray-200 rounded-[8px] text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-gray-600 mb-0.5">App URL</label>
                            <input
                              type="url"
                              value={v.url}
                              onChange={e => {
                                const updated = [...formVariants];
                                updated[idx].url = e.target.value;
                                setFormVariants(updated);
                              }}
                              placeholder="https://..."
                              className="w-full p-2 border border-gray-200 rounded-[8px] text-xs bg-white focus:outline-none"
                              required={isABTesting}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Accessibility Requirements */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <label className="text-sm font-bold text-gray-800 block">Accessibility Requirements (Optional)</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetAccessibilityTags.includes('screen_reader')}
                        onChange={e => {
                          if (e.target.checked) {
                            setTargetAccessibilityTags([...targetAccessibilityTags, 'screen_reader']);
                          } else {
                            setTargetAccessibilityTags(targetAccessibilityTags.filter(t => t !== 'screen_reader'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Requires Screen Reader
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetAccessibilityTags.includes('keyboard_only')}
                        onChange={e => {
                          if (e.target.checked) {
                            setTargetAccessibilityTags([...targetAccessibilityTags, 'keyboard_only']);
                          } else {
                            setTargetAccessibilityTags(targetAccessibilityTags.filter(t => t !== 'keyboard_only'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Requires Keyboard-Only Nav
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetAccessibilityTags.includes('color_blind')}
                        onChange={e => {
                          if (e.target.checked) {
                            setTargetAccessibilityTags([...targetAccessibilityTags, 'color_blind']);
                          } else {
                            setTargetAccessibilityTags(targetAccessibilityTags.filter(t => t !== 'color_blind'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Requires Color Blindness Profile
                    </label>
                  </div>
                </div>

                {/* Iteration Linkage (Benchmarking) */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="text-sm font-bold text-gray-800 block">Link to Previous Round (Benchmarking)</label>
                    <span className="text-xs text-gray-400">Track usability score and task completion trends over multiple versions of your app.</span>
                  </div>
                  <select
                    value={parentListingId}
                    onChange={e => setParentListingId(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[8px] bg-white text-xs focus:outline-none"
                  >
                    <option value="">No parent / First round</option>
                    {listings.map(l => (
                      <option key={l.id} value={l.id}>{l.title} ({formatDate(l.created_at)})</option>
                    ))}
                  </select>
                </div>

                {/* Testing Questions Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-800">Testing Steps / Questions ({formQuestions.length})</label>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      + Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 border border-gray-100 bg-gray-50/55 rounded-[8px] relative space-y-3">
                        {formQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Question {idx + 1}</label>
                          <input
                            type="text"
                            value={q.question_text}
                            onChange={e => handleQuestionTextChange(idx, e.target.value)}
                            placeholder="e.g. Can you complete checkout and confirm GCash reference code matches?"
                            className="w-full p-2 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:border-blue-500 bg-white"
                            required
                          />
                        </div>

                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.requires_recording}
                              onChange={() => handleCheckboxChange(idx, 'requires_recording')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Requires Screen Recording
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.requires_image}
                              onChange={() => handleCheckboxChange(idx, 'requires_image')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Requires Image Screenshot
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-[8px] hover:bg-gray-100 text-sm font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Funding...
                      </>
                    ) : (
                      'Confirm and Fund'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PosterDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate">Loading workspace...</div>}>
      <PosterDashboardContent />
    </Suspense>
  )
}
