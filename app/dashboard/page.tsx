'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, UserCheck, Briefcase, Award, Loader2, AlertCircle } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'

function DashboardGateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  const [updating, setUpdating] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (roleParam === 'poster') {
      router.push('/dashboard/poster')
    } else if (roleParam === 'tester') {
      router.push('/dashboard/tester')
    }
  }, [roleParam, router])

  const handleSelectRole = async (role: 'poster' | 'tester') => {
    setUpdating(role)
    setRoleError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            role: role,
            updated_at: new Date().toISOString()
          })
        
        if (upsertError) {
          throw new Error(upsertError.message)
        }
      }
      router.push(`/dashboard/${role}`)
    } catch (err: unknown) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : 'Failed to update role. Please try again.'
      setRoleError(errMsg)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="max-w-3xl w-full">
      {/* Notion-style header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">subukAn</h1>
        <p className="text-gray-500 text-lg">
          Choose your path to begin. Secure escrow QA crowdsourcing for local apps.
        </p>
      </div>

      {roleError && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{roleError}</p>
        </div>
      )}

      {/* Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Poster Option */}
        <button
          type="button"
          onClick={() => handleSelectRole('poster')}
          disabled={updating !== null}
          className="flex flex-col h-full p-8 bg-white border border-gray-200 rounded-[12px] hover:border-blue-500 hover:shadow-md transition-all duration-200 group text-left disabled:opacity-50 cursor-pointer"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[8px] flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
            {updating === 'poster' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Briefcase className="w-6 h-6" />}
          </div>
          
          <h2 className="text-2xl font-bold mb-3 text-[#1a1a1a] group-hover:text-blue-600 transition-colors">
            I want to hire testers
          </h2>
          <p className="text-gray-600 mb-6 flex-grow leading-relaxed">
            Post your website or app listing, secure your testing budget in escrow, and get verified feedback with screen recordings and task checklists.
          </p>

          <div className="border-t border-gray-100 pt-4 mt-auto w-full">
            <span className="text-sm font-semibold text-blue-600 group-hover:underline">
              {updating === 'poster' ? 'Setting up...' : 'Go to Poster Dashboard →'}
            </span>
          </div>
        </button>

        {/* Tester Option */}
        <button
          type="button"
          onClick={() => handleSelectRole('tester')}
          disabled={updating !== null}
          className="flex flex-col h-full p-8 bg-white border border-gray-200 rounded-[12px] hover:border-blue-500 hover:shadow-md transition-all duration-200 group text-left disabled:opacity-50 cursor-pointer"
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-[8px] flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
            {updating === 'tester' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Award className="w-6 h-6" />}
          </div>

          <h2 className="text-2xl font-bold mb-3 text-[#1a1a1a] group-hover:text-emerald-600 transition-colors">
            I want to test apps
          </h2>
          <p className="text-gray-600 mb-6 flex-grow leading-relaxed">
            Earn GCash rewards for testing new apps. Review tasks, complete test checklists with recording evidence, and withdraw your verified earnings.
          </p>

          <div className="border-t border-gray-100 pt-4 mt-auto w-full">
            <span className="text-sm font-semibold text-emerald-600 group-hover:underline">
              {updating === 'tester' ? 'Setting up...' : 'Go to Tester Dashboard →'}
            </span>
          </div>
        </button>
      </div>

      {/* Security / Quality Check Footer info */}
      <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <span>PayMongo Escrow Guarantee</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-gray-400" />
          <span>Verified GCash Profiles</span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardGate() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] flex flex-col items-center justify-center p-6">
      <Suspense fallback={<div className="text-gray-400 font-medium">Loading routing gate...</div>}>
        <DashboardGateContent />
      </Suspense>
    </main>
  )
}
