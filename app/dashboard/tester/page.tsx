'use client'

import React, { useState } from 'react'
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
  Check
} from 'lucide-react'
import { AgreementModal } from '@/components/shared/AgreementModal'
import { EscrowStatusBar } from '@/components/shared/EscrowStatusBar'
import { TimerDisplay } from '@/components/shared/TimerDisplay'

interface JobListing {
  id: string;
  title: string;
  description: string;
  rate_per_tester: number;
  slots_count: number;
  slots_filled: number;
  requires_recording: boolean;
  requires_image: boolean;
  question_text: string;
}

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
    question_text: 'Did the checkout screen display the correct GCash prompt? Describe any delays.'
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
    question_text: 'Did the GPS pin lock onto your location accurately within 5 seconds?'
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
    question_text: 'Did the camera scanner detect barcodes automatically without manual focus?'
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
    question_text: 'Describe any responsiveness glitches or slow rendering times on button clicks.'
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
  // Profiles states
  const [totalEarnings, setTotalEarnings] = useState(400)
  const [gcashNumber, setGcashNumber] = useState('0917-***-5678')
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                  disabled={totalEarnings === 0}
                  className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request GCash Payout &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Available Jobs Grid */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Available Testing Slots</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {AVAILABLE_JOBS.map((job) => {
                const isFull = job.slots_filled >= job.slots_count
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
                          isFull 
                            ? 'bg-gray-100 text-gray-500 border-gray-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {isFull ? 'Slots Filled' : `${job.slots_count - job.slots_filled} slots left`}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{job.title}</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{job.description}</p>

                      {/* Deliverables details */}
                      <div className="flex flex-wrap gap-3 mb-6">
                        {job.requires_recording && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-[8px]">
                            <Video className="w-3.5 h-3.5" /> Screen Recording
                          </span>
                        )}
                        {job.requires_image && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-[8px]">
                            <ImageIcon className="w-3.5 h-3.5" /> Screenshot
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      disabled={isFull}
                      onClick={() => handleClaimSlot(job)}
                      className={`w-full py-2.5 font-bold text-sm rounded-[8px] text-center transition-all ${
                        isFull 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      {isFull ? 'Unclickable (Full)' : 'Claim Slot'}
                    </button>
                  </div>
                )
              })}
            </div>
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
    </div>
  )
}
