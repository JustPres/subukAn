'use client'

import React, { useState } from 'react'
import { ShieldAlert, X, AlertCircle, CheckCircle2, Scale } from 'lucide-react'
import { DISPUTE_REASON_LABELS } from '@/lib/utils/workspace-status'

interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  submissionId: string
  listingTitle?: string
  onSubmitDispute: (reason: string, explanation: string) => Promise<void> | void
}

export function DisputeModal({
  isOpen,
  onClose,
  submissionId,
  listingTitle,
  onSubmitDispute
}: DisputeModalProps) {
  const [disputeReason, setDisputeReason] = useState('followed_instructions')
  const [disputeExplanation, setDisputeExplanation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const isFormValid = disputeExplanation.trim().length >= 10

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      setError('Dispute explanation must be at least 10 characters long.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmitDispute(disputeReason, disputeExplanation.trim())
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setDisputeExplanation('')
        onClose()
      }, 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispute.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-rose-100 bg-rose-50/60 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">Submit Rejection Dispute</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {listingTitle ? `For "${listingTitle}"` : 'Request independent support re-evaluation.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">Dispute Submitted!</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Your dispute has been logged. Escrow funds will remain locked until support resolves the claim.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-[8px] p-3 text-xs text-amber-900 leading-relaxed">
                <span className="font-bold flex items-center gap-1 mb-1">
                  <Scale className="w-3.5 h-3.5 text-amber-700 inline" /> Fair Dispute Policy
                </span>
                Disputes are reviewed by subukAn support. Provide clear details explaining why your completed work satisfied the task requirements.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Primary Dispute Reason
                </label>
                <select
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-[8px] bg-white text-xs font-medium focus:outline-none focus:border-rose-500"
                >
                  {Object.entries(DISPUTE_REASON_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Dispute Explanation & Rationale
                </label>
                <textarea
                  required
                  value={disputeExplanation}
                  onChange={e => setDisputeExplanation(e.target.value)}
                  placeholder="Explain why the rejection was unfair, referencing your uploaded screen recording or screenshot evidence..."
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-[8px] text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Character count: {disputeExplanation.length} / 10 required</span>
                  {disputeExplanation.length > 0 && disputeExplanation.length < 10 && (
                    <span className="text-rose-600 font-semibold">Under 10 characters</span>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-[8px] hover:bg-gray-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className={`px-5 py-2 text-white rounded-[8px] text-xs font-extrabold shadow-sm transition-all ${
                    isFormValid && !submitting
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Submitting Dispute...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
