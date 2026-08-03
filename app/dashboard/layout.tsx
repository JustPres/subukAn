'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/shared/DashboardSidebar'
import { DashboardBreadcrumbs } from '@/components/shared/DashboardBreadcrumbs'
import { NotificationCenter } from '@/components/shared/NotificationCenter'

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
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      <DashboardSidebar 
        role={role} 
        isOpen={isSidebarOpen} 
        onToggle={setIsSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200 shadow-xs shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate hover:text-ink transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-extrabold text-lg text-gray-900 tracking-tight">subukAn</span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-0">
          <div className="max-w-7xl mx-auto">
            <DashboardBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
