import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/context/AuthContext'
import { BotProvider } from '@/context/BotContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { Toaster } from 'sonner';
import RuntimeSilencer from '@/components/RuntimeSilencer';
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Untangle | Your AI Wellness Companion',
  description: 'Untangle your thoughts and find peace with your personal AI wellness guide.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <RuntimeSilencer />
        <AuthProvider>
          <BotProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </BotProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
