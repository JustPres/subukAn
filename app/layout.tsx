import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'subukAn - Premium QA Crowdsourcing Platform',
  description: 'Connecting builders with expert testers for reliable, high-fidelity crowdsourced testing in the Philippines.',
  icons: {
    icon: '/subukantabico.ico',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-canvas text-ink antialiased flex flex-col`}>
        {children}
      </body>
    </html>
  )
}
