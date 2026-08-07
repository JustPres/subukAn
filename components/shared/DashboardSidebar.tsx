'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  DollarSign, 
  ArrowLeftRight, 
  LogOut, 
  X,
  Settings
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'

interface SidebarProps {
  role: 'poster' | 'tester' | null
  isOpen: boolean
  onToggle: (open: boolean) => void
}

export function DashboardSidebar({ role, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || ''
  const supabase = createBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isPoster = role === 'poster'
  const isTester = role === 'tester'

  const links = []

  if (isPoster) {
    links.push({ name: 'Dashboard Overview', href: '/dashboard/poster?tab=overview', icon: LayoutDashboard })
    links.push({ name: 'My Listings', href: '/dashboard/poster?tab=listings', icon: FileText })
    links.push({ name: 'Settings', href: '/dashboard/poster?tab=settings', icon: Settings })
  } else if (isTester) {
    links.push({ name: 'Available Tasks', href: '/dashboard/tester?tab=available', icon: LayoutDashboard })
    links.push({ name: 'My Submissions', href: '/dashboard/tester?tab=submissions', icon: CheckSquare })
    links.push({ name: 'Earnings', href: '/dashboard/tester?tab=earnings', icon: DollarSign })
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => onToggle(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0F172A] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:flex lg:flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <span className="text-xl font-extrabold tracking-tight text-white font-poppins">subukAn</span>
          <button 
            onClick={() => onToggle(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon
            const baseHref = link.href.split('?')[0]
            const isPathMatching = pathname === baseHref
            
            const linkParams = new URLSearchParams(link.href.split('?')[1] || '')
            const linkTab = linkParams.get('tab')
            
            const isActive = isPathMatching && (
              (!linkTab && (!currentTab || currentTab === 'overview' || currentTab === 'available')) ||
              (linkTab === 'overview' && (!currentTab || currentTab === 'overview')) ||
              (linkTab === 'available' && (!currentTab || currentTab === 'available')) ||
              (linkTab === currentTab)
            )
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={() => onToggle(false)}
                className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-500/25 font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{link.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-4 space-y-2">
          <Link 
            href="/dashboard?select=true"
            onClick={() => onToggle(false)}
            className="flex items-center space-x-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all duration-200"
          >
            <ArrowLeftRight className="h-5 w-5" />
            <span className="font-medium">Switch Role</span>
          </Link>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 rounded-lg px-4 py-3 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
