/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { Shield, Lock, Eye, FileText, CheckCircle2, User, Database, ArrowLeft, Info, HelpCircle } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans leading-body antialiased">
      {/* Navigation */}
      <header className="border-b border-steel/30 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
              <img src="/subukanlogoweb.png" alt="subukAn Logo" className="h-7 w-auto object-contain" />
              <span className="text-lg font-bold tracking-tight text-ink">subukAn</span>
            </Link>
          </div>
          <nav className="text-xs font-semibold text-slate flex items-center space-x-4">
            <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
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
          <div className="text-4xl mb-4 select-none">🛡️</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-steel font-medium mb-6">
            Last updated: July 27, 2026 • 8 min read • DPA (RA 10173) Compliant
          </p>
          
          {/* Notion Callout Box */}
          <div className="p-4 rounded-card bg-white border border-steel/30 flex items-start space-x-3 shadow-sm mb-8">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-slate">
              <span className="font-bold text-ink">Summary of our stance:</span> We collect your profile details, device footprint, screen recordings, and microphone audio only to verify UX and bug submissions. This data is shared <span className="font-semibold text-ink">exclusively</span> with the developer (Listing Poster) of the app you test. We never sell your data.
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="space-y-8 text-sm md:text-base text-slate">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              1. Compliance with the Philippine Data Privacy Act (RA 10173)
            </h2>
            <p>
              This Privacy Policy details how <strong>subukAn</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) processes personal data in strict compliance with the <strong>Republic Act No. 10173</strong>, otherwise known as the <strong>Data Privacy Act of 2012 (DPA)</strong>, and its Implementing Rules and Regulations (IRR).
            </p>
            <p>
              As a platform facilitating crowd-sourced usability and functional testing within the Philippines, we act as both a <strong>Personal Information Controller (PIC)</strong> for your tester profile registration data and a <strong>Personal Information Processor (PIP)</strong> when we transmit screen and audio recordings to Listing Posters (the third-party developers/builders) who commission testing tasks.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              2. Data We Capture and Process
            </h2>
            <p>
              To ensure test fidelity and protect escrowed payments, we process several categories of information during your registration and testing activities:
            </p>
            
            <div className="bg-canvas border border-steel/20 rounded-card p-5 space-y-4">
              <div className="flex gap-3">
                <User className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-ink text-sm md:text-base">A. Tester Profile Data</h4>
                  <p className="text-xs md:text-sm mt-1">
                    Captured at signup and stored to build your tester identity:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-xs md:text-sm">
                    <li><strong>Full Name:</strong> Collected for identification and security.</li>
                    <li><strong>Email Address:</strong> Used for account lifecycle, system alerts, and notification of slot expirations.</li>
                    <li><strong>GCash-Registered Mobile Number:</strong> Required to disburse payouts. Under our payment integration rules, this number undergoes GCash verification.</li>
                    <li><strong>Tech Comfort Level:</strong> Self-identified tier (Student Developer/Software Engineer, Casual Tech User, or Non-Technical User).</li>
                    <li><strong>Device Configuration Type:</strong> Declared primary testing hardware (Mobile/Tablet or Desktop/Laptop).</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 border-t border-steel/20 pt-4">
                <Database className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-ink text-sm md:text-base">B. Device Footprints and Metadata</h4>
                  <p className="text-xs md:text-sm mt-1">
                    Captured automatically when a test session starts:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-xs md:text-sm">
                    <li><strong>IP Address and Carrier Network:</strong> Used to confirm the tester is accessing the client app from a genuine local network within the Philippines.</li>
                    <li><strong>Browser and OS Info:</strong> Browser type, window resolution, operating system, and hardware model to help builders replicate reported layout bugs.</li>
                    <li><strong>Time-on-Task Duration:</strong> Automatically calculated duration of active test sessions.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 border-t border-steel/20 pt-4">
                <Lock className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-ink text-sm md:text-base">C. Screen and Audio Recordings</h4>
                  <p className="text-xs md:text-sm mt-1">
                    Captured during active tasks where posters require proof of verification:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-xs md:text-sm">
                    <li><strong>Screen Recordings:</strong> Video captures of the user interacting with the target client app (e.g. checkout, login inputs).</li>
                    <li><strong>Microphone Voice Recordings:</strong> Audio captures of your spoken thoughts, verbal explanations of UX pain points, and usability feedback.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              3. Purpose of Processing and Data Sharing
            </h2>
            <p>
              We process your data strictly under the principles of <strong>transparency, legitimate purpose, and proportionality</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Evaluating User Experience (UX):</strong> Your verbal thoughts and click behaviors are analyzed to identify layout issues, broken navigation pathways, and technical friction.
              </li>
              <li>
                <strong>Fidelity & Bug Verification:</strong> Screen recordings serve as the primary source of truth to verify that the task was completed genuinely in accordance with instructions.
              </li>
              <li>
                <strong>Escrow Audit Trails:</strong> Financial details and verification events are retained to track disbursements through our payment gateways (PayMongo/Xendit) and settle disputes.
              </li>
            </ul>

            <div className="p-4 rounded-card bg-tint-open text-tint-open-text text-sm border border-tint-open-text/10 mt-4">
              <span className="font-bold">Strict Sharing Constraint:</span> Your screen and audio recordings, tech comfort tier, and name are shared <strong>only</strong> with the specific Listing Poster who created the listing you tested. Your full phone number and personal contact credentials are kept private and are never shared with posters or external marketing companies.
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              4. Data Retention and Deletion Schedule
            </h2>
            <p>
              We do not store media files indefinitely. Data is kept only as long as necessary for the verification and escrow release cycle:
            </p>
            <div className="border border-steel/30 rounded-card overflow-hidden mt-4">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-white border-b border-steel/30 text-ink font-bold">
                    <th className="px-4 py-3">Data Type</th>
                    <th className="px-4 py-3">Retention Period</th>
                    <th className="px-4 py-3">Action Post-Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel/20 bg-canvas/40">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-ink">Screen & Audio Recordings</td>
                    <td className="px-4 py-3">30 Days after payout release</td>
                    <td className="px-4 py-3 text-slate">Automatically archived; deleted permanently after 90 days.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-ink">Device logs & IP address</td>
                    <td className="px-4 py-3">90 Days</td>
                    <td className="px-4 py-3 text-slate">Anonymized and aggregated for system metrics.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-ink">Payout Ledger Logs</td>
                    <td className="px-4 py-3">180 Days (Legal Requirement)</td>
                    <td className="px-4 py-3 text-slate">Retained to fulfill financial and ledger audit requirements under GCash/PayMongo transaction processing laws.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              5. Security and Data Protection
            </h2>
            <p>
              We employ strict organizational, physical, and technical security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Temporary Signed Access:</strong> Recordings are stored in secure bucket storage. Listing posters are only given temporary signed URLs to inspect the files. These URLs expire automatically within 24 hours of generation.</li>
              <li><strong>Frontend Selection Restriction:</strong> We block text selection, copy actions, and right-clicks on task questions in order to prevent content scraping and secure client app details.</li>
              <li><strong>Encryption:</strong> Personal identifiers are encrypted at rest using industry-standard AES-256 protocols and transit-level TLS/SSL channels.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-ink border-b border-steel/20 pb-1 mt-6">
              6. Your Rights as a Data Subject
            </h2>
            <p>
              Under the Data Privacy Act of 2012, you hold specific rights that we respect and enforce:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>Right to be Informed:</strong> You have the right to know how your recordings and demographics are being used.</li>
              <li><strong>Right to Access:</strong> You can review the recordings and responses you submitted in your Tester Dashboard.</li>
              <li><strong>Right to Rectification:</strong> You may correct inaccurate profile data at any time.</li>
              <li><strong>Right to Erasure / Blocking:</strong> You may request the deletion of your account and files. However, financial payout ledger entries cannot be immediately erased as they must be retained for active audit trails under transaction laws.</li>
            </ol>
            <p className="mt-4">
              To exercise any of these rights, or to submit a complaint regarding our processing activities, you may email our designated Data Protection Officer at <span className="text-primary font-semibold underline">privacy@subukan.ph</span>.
            </p>
          </section>

        </div>

        {/* Back navigation footer */}
        <div className="border-t border-steel/20 mt-12 pt-6 flex items-center justify-between">
          <Link href="/" className="text-xs font-bold text-slate hover:text-ink transition-colors flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[11px] text-steel">
            subukAn Privacy Policy • Philippines Legal Standard 04-SECURITY.md
          </span>
        </div>
      </main>
    </div>
  )
}
