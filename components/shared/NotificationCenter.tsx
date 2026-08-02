'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ShieldAlert, 
  ExternalLink 
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Notification } from '@/types'

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    user_id: 'current-user',
    title: 'Payout Approved',
    message: 'Your GCash payout request of ₱400.00 has been processed and credited.',
    type: 'payout_approved',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    link_url: '/dashboard/tester#earnings'
  },
  {
    id: 'n2',
    user_id: 'current-user',
    title: 'Submission Approved',
    message: 'Poster accepted your submission for "E-Commerce App GCash Checkout Test". ₱200.00 credited!',
    type: 'submission_update',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    link_url: '/dashboard/tester#submissions'
  },
  {
    id: 'n3',
    user_id: 'current-user',
    title: 'New Listing Alert',
    message: 'A new target-matched job "Sari-Sari Store Inventory App Initial Run" is now open.',
    type: 'new_listing',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    link_url: '/dashboard/tester#available'
  },
  {
    id: 'n4',
    user_id: 'current-user',
    title: 'Dispute Update',
    message: 'Support team initiated re-review for your disputed submission.',
    type: 'dispute_update',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 1 day ago
    link_url: '/dashboard/tester#submissions'
  }
]

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS)
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setNotifications(DEFAULT_NOTIFICATIONS)
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data) && data.length > 0) {
        setNotifications(data as Notification[])
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS)
      }
    } catch (e) {
      console.warn('Error fetching notifications:', e)
      setNotifications(DEFAULT_NOTIFICATIONS)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
    } catch (e) {
      console.warn('Failed to sync notification mark read:', e)
    }
  }

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
      }
    } catch (e) {
      console.warn('Failed to sync mark all read:', e)
    }
  }

  const handleClearAll = async () => {
    setNotifications([])
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)
      }
    } catch (e) {
      console.warn('Failed to clear notifications:', e)
    }
  }

  const handleClearOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
    } catch (err) {
      console.warn('Failed to delete notification:', err)
    }
  }

  const renderIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payout_approved':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        )
      case 'submission_update':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )
      case 'new_listing':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
        )
      case 'dispute_update':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 border border-gray-200 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        )
    }
  }

  return (
    <div className="relative inline-block">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative p-2.5 rounded-full text-slate hover:text-ink hover:bg-slate/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-brand"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Drawer Popover Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 bg-white border border-gray-200 rounded-[12px] shadow-xl overflow-hidden animate-fadeIn">
            {/* Drawer Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-semibold text-gray-500 hover:text-rose-600 flex items-center gap-1 ml-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-400 font-mono">
                  Loading updates...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xs font-semibold text-gray-600">No notifications yet</p>
                  <p className="text-[11px] text-gray-400">Updates regarding payouts, submissions, and alerts will appear here.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-4 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                      notif.is_read ? 'bg-white hover:bg-gray-50/80' : 'bg-blue-50/40 hover:bg-blue-50/70'
                    }`}
                  >
                    {renderIcon(notif.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-extrabold text-gray-900 truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 leading-relaxed break-words">
                        {notif.message}
                      </p>

                      {notif.link_url && (
                        <a
                          href={notif.link_url}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-1.5"
                        >
                          View Details <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleClearOne(notif.id, e)}
                      title="Dismiss"
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
              <span className="text-[10px] font-semibold text-gray-400">
                subukAn Real-Time Event Alerts
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
