/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { FileText, Key, Clock, Landmark, AlertTriangle, Scale, ArrowLeft, Info, HelpCircle } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans leading-body antialiased">
      {/* Navigation */}
      <header className="border-b border-steel/30 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <img src="/subukanlogoweb.png" alt="subukAn Logo" className="h-10 w-auto object-contain" />
            </Link>
          </div>
          <nav className="text-xs font-semibold text-slate flex items-center space-x-4">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/tester/dashboard" className="px-3 py-1.5 border border-steel rounded-button text-slate hover:text-ink hover:bg-canvas transition-all">
              Tester Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Notion-Style Document Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        
        {/* Document Header & Emoji Icon */}
        <div className="mb-8">
          <div className="text-4xl mb-4 select-none">📄</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-steel font-medium mb-6">
            Last updated: July 27, 2026 • 10 min read • Platform Mechanics & Legal Terms
          </p>
          
          {/* Notion Callout Box */}
          <div className="p-4 rounded-card bg-white border border-steel/30 flex items-start space-x-3 shadow-sm mb-8">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-slate">
              <span className="font-bold text-ink">Key Agreements for Testers & Posters:</span> By using subukAn, testers agree to a binding click-through NDA, strict slot expiration timers, and objective rejection rules. Posters agree to commit funds to escrow upfront and adhere to automated GCash payout releases.
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="space-y-8 text-sm md:text-base text-slate">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              1. Introduction & Binding Escrow Agreement
            </h2>
            <p>
              Welcome to <strong>subukAn</strong>. By accessing our platform as a Tester or Listing Poster (builder/developer), you agree to be bound by these Terms of Service.
            </p>
            <p>
              Our platform operates on a <strong>Guaranteed Escrow Model</strong>. When a poster creates a listing, they commit the total budget (calculated as <code>Rate per Tester × Slots Count</code>) to a platform-held escrow account managed via our payment processors (PayMongo/Xendit) before the test is published. Tester payouts do not depend on the poster&apos;s manual account status, nor can they be cancelled once a slot is active. Unfilled slots at listing completion are forfeited.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              2. Click-Through NDA & Tester Confidentiality
            </h2>
            <p>
              All application tests on subukAn involve pre-release software, proprietary business models, and private staging links. Testers must accept a binding click-through NDA prior to beginning any task:
            </p>
            
            <div className="bg-canvas border border-steel/20 rounded-card p-5 space-y-4">
              <div className="flex gap-3">
                <Key className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-ink text-sm md:text-base">Confidentiality Rules:</h4>
                  <ul className="list-disc pl-5 mt-2 space-y-2 text-xs md:text-sm">
                    <li><strong>No External Sharing:</strong> You agree not to disclose, share, publish, or duplicate any information, staging URLs, or flow structures of the app tested.</li>
                    <li><strong>No Visual Leakage:</strong> You are strictly forbidden from taking personal screenshots or screen recordings outside of the official subukAn evidence capture tool. Sharing recordings or client screenshots on social media, blogs, or forums constitutes a material breach of contract.</li>
                    <li><strong>Protected Questions:</strong> Platform-side JS prevents casual copying or text selection of task questions. Circumnavigating these blocks to scrape questions is prohibited.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              3. Tester Reservation & Slot Expiration Rules
            </h2>
            <p>
              To ensure that posters receive layout and usability feedback quickly, testing slots are gated by timers:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Immediate Checkout:</strong> Testers check out a slot from an open listing and can start immediately. They do not need to wait for the listing to fill.
              </li>
              <li>
                <strong>Active Time Window:</strong> Each listing specifies a review window (typically 30 minutes or 1 hour). A persistent timer will be visible in the tester interface.
              </li>
              <li>
                <strong>Forfeiture of Incomplete Slots:</strong> If a tester does not submit all required question responses, metrics, and recordings before the countdown timer reaches zero, the test session automatically stops, the slot expires, and the tester forfeits their claim to payment. The slot is released back to the general pool for other testers.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              4. GCash Payout Processing & Rates
            </h2>
            <p>
              We provide fast payouts directly to your local GCash-verified account in Philippine Pesos (PHP) subject to the following rules:
            </p>
            <div className="bg-canvas border border-steel/20 rounded-card p-5 space-y-4">
              <div className="flex gap-3">
                <Landmark className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-ink text-sm md:text-base">Payout Standards:</h4>
                  <ul className="list-disc pl-5 mt-2 space-y-2 text-xs md:text-sm">
                    <li><strong>Discrete Pricing Tiers:</strong> Rates range from <strong>₱50 to ₱1,100+</strong> per test completion depending on the task type (Micro, Functional, or Deep Audit).</li>
                    <li><strong>Phone Verification:</strong> To prevent fraud, testers must verify their GCash mobile number. Payments are processed via API endpoints (PayMongo/Xendit) only to accounts matching this verified mobile number.</li>
                    <li><strong>Automated Release Rule:</strong> Payout is triggered immediately upon the Poster’s manual approval of the submission. If a poster fails to review a pending submission within the original review window, the platform triggers an <strong>Auto-Release Payout</strong> directly from escrow to the tester.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              5. Submission Rejection & Thresholds
            </h2>
            <p>
              Posters have the right to inspect submissions to protect against spam and low-effort entries. Rejections must adhere to strict platform constraints:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Dropdown Selection:</strong> Rejections must correspond to one of our defined categories: <code>instructions_not_followed</code>, <code>recording_mismatch</code>, <code>incomplete</code>, or <code>low_effort</code>.
              </li>
              <li>
                <strong>Mandatory Explanation:</strong> The poster must provide a detailed explanation of 10 to 500 characters outlining exactly what instruction was violated or what mismatch was detected.
              </li>
              <li>
                <strong>Rejection Limit:</strong> Low-effort or spam rejections must be justified. A poster who abuses the rejection tool to get free data will receive warnings, and repeated violations will result in account suspension and escrow forfeiture.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              6. Dispute Resolution & Manual Review
            </h2>
            <p>
              In the event that a tester disagrees with a poster&apos;s rejection, the platform provides a clear resolution mechanism:
            </p>
            <div className="p-4 rounded-card bg-tint-rejected text-tint-rejected-text text-sm border border-tint-rejected-text/10 flex items-start space-x-3">
              <Scale className="w-5 h-5 shrink-0 mt-0.5 text-tint-rejected-text" />
              <div>
                <span className="font-bold">Early-Stage Disputes:</span> All disputed submissions escalate directly to manual review. During the early stages of subukAn, all reviews are audited manually by the platform founder to prevent automated bias. Decisions rendered by the platform are final and binding on both testers and posters. Escrow funds will either be disbursed to the tester or returned to the poster depending on the outcome.
              </div>
            </div>
          </section>

        </div>

        {/* Back navigation footer */}
        <div className="border-t border-steel/20 mt-12 pt-6 flex items-center justify-between">
          <Link href="/" className="text-xs font-bold text-slate hover:text-ink transition-colors flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[11px] text-steel">
            subukAn Terms of Service • PHP Local Standards 02-MECHANICS.md
          </span>
        </div>
      </main>
    </div>
  )
}
