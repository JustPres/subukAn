'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react'
import { getWorkspaceStatusInfo } from '@/lib/utils/workspace-status'

interface WorkspaceStatusCardProps {
  submission: {
    status: string;
    rejection_reason?: string | null;
    rejection_category?: string | null;
    rejection_explanation?: string | null;
    review_completed_at?: string | null;
    auto_release_at?: string | null;
    poster_feedback?: string | null;
  } | null;
  listing?: {
    rate_per_tester?: number;
    review_window_minutes?: number;
  } | null;
}

export function WorkspaceStatusCard({ submission, listing }: WorkspaceStatusCardProps) {
  const statusInfo = getWorkspaceStatusInfo(submission, listing);

  if (statusInfo.status === 'approved') {
    return (
      <div className="bg-white border border-emerald-200 rounded-[12px] p-6 shadow-sm text-center space-y-5 animate-fadeIn">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider inline-block mb-2">
            ✅ Task Approved! Payout Credited
          </span>
          <h2 className="text-xl font-black text-gray-900">{statusInfo.title}</h2>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-medium">
            {statusInfo.subtitle}
          </p>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-[8px]">
            <span className="text-xs text-emerald-600 block font-semibold">Payout Credited</span>
            <span className="text-xl font-black text-emerald-700">{statusInfo.escrowOrPayoutText}</span>
            {statusInfo.reviewCompletedAt && (
              <span className="text-[10px] text-emerald-600/80 block mt-1">
                Completed on {new Date(statusInfo.reviewCompletedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {statusInfo.posterFeedback && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-[8px] p-3 text-left">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Poster Praise & Feedback:
            </span>
            <p className="text-xs text-emerald-950 italic whitespace-pre-wrap">
              &quot;{statusInfo.posterFeedback}&quot;
            </p>
          </div>
        )}

        <Link
          href="/dashboard/tester"
          className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[8px] text-xs shadow-sm transition-all text-center"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (statusInfo.status === 'rejected') {
    return (
      <div className="bg-white border border-rose-200 rounded-[12px] p-6 shadow-sm space-y-5 animate-fadeIn">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
          <XCircle className="w-7 h-7 text-rose-600" />
        </div>
        <div className="text-center">
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-rose-100 text-rose-800 uppercase tracking-wider inline-block mb-2">
            ❌ Submission Rejected
          </span>
          <h2 className="text-xl font-black text-gray-900">{statusInfo.title}</h2>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {statusInfo.subtitle}
          </p>
        </div>

        {/* Rejection Category Pill */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-[8px] p-3 text-xs text-left">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-0.5">
            Rejection Category
          </span>
          <span className="font-extrabold text-rose-900 text-sm">
            {statusInfo.rejectionReasonLabel}
          </span>
        </div>

        {/* Poster Rejection Explanation */}
        {statusInfo.rejectionExplanation ? (
          <div className="bg-rose-50/90 border-l-4 border-rose-500 p-3.5 rounded-r-[8px] text-left break-words">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
              Poster&apos;s Explanation:
            </span>
            <p className="text-xs text-rose-950 font-medium italic leading-relaxed whitespace-pre-wrap">
              &quot;{statusInfo.rejectionExplanation}&quot;
            </p>
          </div>
        ) : (
          <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-[8px] text-left">
            <p className="text-xs text-rose-800 italic">No detailed explanation was provided by the poster.</p>
          </div>
        )}

        {statusInfo.reviewCompletedAt && (
          <div className="text-[10px] text-gray-400 font-semibold text-center">
            Reviewed at: {new Date(statusInfo.reviewCompletedAt).toLocaleString()}
          </div>
        )}

        {/* Support & Dispute Guidance */}
        <div className="bg-gray-50 border border-gray-200 rounded-[8px] p-3 text-[11px] text-gray-600 leading-relaxed text-left space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Support & Dispute Guidance</span>
          </div>
          <p>
            If you believe this rejection was unjustified, you can post a message in the debrief thread on the right to resolve misunderstandings or request re-evaluation with the poster.
          </p>
        </div>

        <Link
          href="/dashboard/tester"
          className="block w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-[8px] text-xs shadow-sm transition-all text-center"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Pending Review (or fallback submitted state)
  return (
    <div className="bg-white border border-amber-200 rounded-[12px] p-6 shadow-sm text-center space-y-5 animate-fadeIn">
      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
        <Clock className="w-7 h-7 text-amber-600" />
      </div>
      <div>
        <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider inline-block mb-2">
          ⏳ Submission Under Review
        </span>
        <h2 className="text-xl font-black text-gray-900">{statusInfo.title}</h2>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-medium">
          {statusInfo.subtitle}
        </p>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-[8px]">
          <span className="text-xs text-amber-700 block font-semibold">Escrow Hold Details</span>
          <span className="text-lg font-black text-amber-800">{statusInfo.escrowOrPayoutText}</span>
          {statusInfo.autoReleaseAt ? (
            <span className="text-[10px] text-amber-700/80 block mt-1 font-mono">
              Auto-release deadline: {new Date(statusInfo.autoReleaseAt).toLocaleString()}
            </span>
          ) : (
            <span className="text-[10px] text-amber-700/80 block mt-1">
              Auto-releases after poster review window ({listing?.review_window_minutes ?? 0} mins)
            </span>
          )}
        </div>
      </div>
      <Link
        href="/dashboard/tester"
        className="block w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-[8px] text-xs shadow-sm transition-all text-center"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
