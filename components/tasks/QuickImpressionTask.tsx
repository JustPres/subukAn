'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Clock, Eye, Lock, CheckCircle, AlertCircle, Play, Send, Loader2 } from 'lucide-react'
import { QuickImpressionTask as QuickImpressionTaskType } from '@/types'

export interface QuickImpressionTaskProps {
  task?: QuickImpressionTaskType;
  title?: string;
  description?: string;
  imageUrl?: string;
  websiteUrl?: string;
  durationSeconds?: number;
  recallQuestion?: string;
  onSubmit?: (answer: string) => void | Promise<void>;
  onComplete?: (answer: string) => void;
  disabled?: boolean;
}

export function QuickImpressionTask({
  task,
  title: propTitle,
  description: propDescription,
  imageUrl: propImageUrl,
  websiteUrl: propWebsiteUrl,
  durationSeconds: propDurationSeconds,
  recallQuestion: propRecallQuestion,
  onSubmit,
  onComplete,
  disabled = false,
}: QuickImpressionTaskProps) {
  // Resolve properties from task object or direct props
  const title = propTitle || task?.title || '5-Second Quick Impression Test'
  const description =
    propDescription ||
    task?.description ||
    'You will be shown a preview for a limited time. Pay close attention to key visuals, branding, and messaging before the preview locks.'
  
  const imageUrl = propImageUrl || task?.imageUrl || task?.image_url || task?.previewUrl
  const websiteUrl = propWebsiteUrl || task?.websiteUrl || task?.website_url
  const durationSeconds = propDurationSeconds || task?.durationSeconds || task?.impression_duration_seconds || 5
  const recallQuestion =
    propRecallQuestion ||
    task?.recallQuestion ||
    task?.question_text ||
    'What key elements, main title, or purpose of the page do you remember from your 5-second view?'

  // Component states: 'idle' | 'viewing' | 'expired' | 'submitted'
  const [testState, setTestState] = useState<'idle' | 'viewing' | 'expired' | 'submitted'>('idle')
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds)
  const [answer, setAnswer] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Countdown timer logic
  useEffect(() => {
    if (testState !== 'viewing') return

    if (timeLeft <= 0) {
      setTestState('expired')
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [testState, timeLeft])

  // Focus textarea when expired (preview locks)
  useEffect(() => {
    if (testState === 'expired' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [testState])

  const handleStartTest = () => {
    if (disabled) return
    setTimeLeft(durationSeconds)
    setError(null)
    setTestState('viewing')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (answer.trim().length < 10) {
      setError('Please provide a response of at least 10 characters.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit(answer.trim())
      }
      if (onComplete) {
        onComplete(answer.trim())
      }
      setTestState('submitted')
    } catch (err: any) {
      setError(err?.message || 'Failed to submit response. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercent = ((durationSeconds - timeLeft) / durationSeconds) * 100

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-card shadow-sm overflow-hidden text-ink">
      {/* Header section */}
      <div className="p-6 border-b border-gray-100 bg-canvas flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider badge-open mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>5-Second Impression Test</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
          <p className="text-sm text-slate mt-1">{description}</p>
        </div>

        {/* Dynamic Timer Badge */}
        <div className="shrink-0 flex items-center">
          {testState === 'idle' && (
            <div className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-button text-xs font-mono font-bold text-slate flex items-center gap-2">
              <Clock className="w-4 h-4 text-steel" />
              <span>Duration: {durationSeconds}s</span>
            </div>
          )}

          {testState === 'viewing' && (
            <div className="px-4 py-2 bg-blue-600 text-white rounded-button text-sm font-mono font-extrabold shadow-md animate-pulse flex items-center gap-2">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Viewing: {timeLeft}s</span>
            </div>
          )}

          {(testState === 'expired' || testState === 'submitted') && (
            <div className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-button text-xs font-mono font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Time Expired (Preview Locked)</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar (Visible during viewing) */}
      {testState === 'viewing' && (
        <div className="w-full bg-gray-100 h-1.5 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${100 - progressPercent}%` }}
          />
        </div>
      )}

      {/* Preview Section */}
      <div className="relative w-full min-h-[320px] max-h-[500px] bg-gray-900 flex items-center justify-center overflow-hidden border-b border-gray-200 select-none">
        {/* State: IDLE - Covered by Start overlay */}
        {testState === 'idle' && (
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Eye className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-bold">Ready for the 5-Second Test?</h3>
              <p className="text-xs text-gray-300">
                When you click Start, you will have exactly <strong>{durationSeconds} seconds</strong> to inspect the design. Once time is up, the preview will automatically blur.
              </p>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={handleStartTest}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-button transition-all flex items-center gap-2 shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" />
              Start {durationSeconds}-Second Impression Test
            </button>
          </div>
        )}

        {/* State: EXPIRED or SUBMITTED - Blur overlay active */}
        {(testState === 'expired' || testState === 'submitted') && (
          <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-xl z-10 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Preview Locked</h3>
            <p className="text-xs text-gray-300 max-w-sm">
              The 5-second preview period has expired. Please fill in your immediate recall answers below.
            </p>
          </div>
        )}

        {/* Media content (Image or Website iframe) */}
        <div
          className={`w-full h-full flex items-center justify-center p-4 transition-all duration-700 ${
            testState === 'expired' || testState === 'submitted' ? 'filter blur-2xl opacity-10 pointer-events-none scale-105' : ''
          }`}
        >
          {websiteUrl ? (
            <iframe
              src={websiteUrl}
              title="Quick Impression Target Website"
              className="w-full h-[400px] border-0 rounded-md bg-white pointer-events-none"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Quick Impression Preview"
              className="max-w-full max-h-[450px] object-contain rounded-md shadow-lg pointer-events-none"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            /* Fallback visual mockup if no image/website provided */
            <div className="w-full max-w-2xl h-[340px] bg-gradient-to-br from-slate-800 to-gray-900 border border-gray-700 rounded-lg p-6 flex flex-col justify-between text-white">
              <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs text-gray-400 font-mono">subukAn Preview Mockup</span>
              </div>
              <div className="space-y-3 py-6">
                <div className="h-6 bg-blue-500/30 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
                <div className="h-4 bg-gray-700 rounded w-5/6" />
                <div className="pt-4 flex gap-3">
                  <div className="h-9 w-28 bg-blue-600 rounded-md" />
                  <div className="h-9 w-24 bg-gray-700 rounded-md" />
                </div>
              </div>
              <div className="text-[10px] text-gray-500 text-right">
                Sample Web Interface Mockup
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Immediate Recall Question Input Form */}
      <div className="p-6 bg-white space-y-5">
        {testState === 'submitted' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-card p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900">Impression Feedback Saved!</h3>
            <p className="text-sm text-emerald-700 max-w-md mx-auto">
              Thank you for completing the 5-second quick impression recall question. Your initial visual feedback has been captured.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="recall-answer" className="block text-sm font-bold text-gray-900 mb-1">
                Immediate Recall Question:
              </label>
              <p className="text-xs text-slate mb-3">{recallQuestion}</p>
              
              <textarea
                id="recall-answer"
                ref={textareaRef}
                rows={4}
                disabled={testState === 'idle' || isSubmitting || disabled}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={
                  testState === 'idle'
                    ? 'Complete the 5-second test above to unlock the answer field...'
                    : 'Type what you remember seeing (main header, offer, images, colors, impression)...'
                }
                className="w-full p-3 border border-gray-300 rounded-button text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
              />
              
              <div className="flex items-center justify-between text-xs text-slate mt-1.5">
                <span>Min 10 characters requirement</span>
                <span className={answer.length >= 10 ? 'text-emerald-600 font-semibold' : 'text-slate'}>
                  {answer.length} characters
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-button">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={testState === 'idle' || answer.trim().length < 10 || isSubmitting || disabled}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-button transition-all flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Answer...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Recall Answer
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default QuickImpressionTask
