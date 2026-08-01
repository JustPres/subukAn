'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/shared/DashboardSidebar'
import { DashboardBreadcrumbs } from '@/components/shared/DashboardBreadcrumbs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [role, setRole] = useState<'poster' | 'tester' | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const client = createBrowserClient()
        const { data: { session } } = await client.auth.getSession()
        if (session?.user?.id) {
          const { data } = await client
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (data && (data.role === 'poster' || data.role === 'tester')) {
            setRole(data.role as 'poster' | 'tester')
          }
        }
      } catch (error: unknown) {
        console.error('Error fetching profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const isGatePage = pathname === '/dashboard'

  if (isGatePage) {
    return <div className="min-h-screen bg-canvas">{children}</div>
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="animate-pulse text-slate">Loading dashboard…</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <DashboardSidebar 
        role={role} 
        isOpen={isSidebarOpen} 
        onToggle={setIsSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center h-16 px-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate hover:text-ink transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-4 font-semibold text-lg">Dashboard</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <DashboardBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
