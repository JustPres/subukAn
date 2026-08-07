import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

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
      <body className={`${inter.variable} ${poppins.variable} font-sans min-h-screen bg-canvas text-ink antialiased flex flex-col`}>
        {children}
      </body>
    </html>
  )
}
