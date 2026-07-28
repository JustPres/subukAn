import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export interface CookieStore {
  get(name: string): { name: string; value: string } | undefined
  set(name: string, value: string, options?: any): void
  delete(name: string, options?: any): void
}

export function createServerClient(cookieStore: CookieStore) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing on the server.'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false, // Prevents server-side refresh loops
      detectSessionInUrl: false,
      flowType: 'pkce',
      storage: {
        getItem: (key) => {
          const cookie = cookieStore.get(key)
          return cookie ? cookie.value : null
        },
        setItem: (key, value) => {
          try {
            cookieStore.set(key, value, {
              path: '/',
              sameSite: 'lax',
              secure: true,
              maxAge: 60 * 60 * 24 * 365, // 1 year
            })
          } catch (error) {
            // Expected and safe to ignore in Server Components (read-only cookie store)
          }
        },
        removeItem: (key) => {
          try {
            cookieStore.delete(key, { path: '/' })
          } catch (error) {
            // Expected and safe to ignore in Server Components
          }
        },
      },
    },
  })
}

export function createServerComponentClient() {
  const cookieStore = cookies()
  return createServerClient({
    get: (key) => {
      const cookie = cookieStore.get(key)
      return cookie ? { name: key, value: cookie.value } : undefined
    },
    set: (key, value, options) => {
      cookieStore.set(key, value, options)
    },
    delete: (key, options) => {
      cookieStore.delete(key)
    },
  })
}

export function createRouteHandlerClient() {
  const cookieStore = cookies()
  return createServerClient({
    get: (key) => {
      const cookie = cookieStore.get(key)
      return cookie ? { name: key, value: cookie.value } : undefined
    },
    set: (key, value, options) => {
      cookieStore.set(key, value, options)
    },
    delete: (key, options) => {
      cookieStore.delete(key)
    },
  })
}

export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient({
    get: (key) => {
      const cookie = request.cookies.get(key)
      return cookie ? { name: key, value: cookie.value } : undefined
    },
    set: (key, value, options) => {
      // Sync cookies on both the incoming request and the outgoing response
      request.cookies.set({ name: key, value, ...options })
      response.cookies.set({ name: key, value, ...options })
    },
    delete: (key, options) => {
      request.cookies.delete(key)
      response.cookies.delete(key)
    },
  })
}
