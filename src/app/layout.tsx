import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'IELTS Diaries — Track Your IELTS Journey',
  description:
    'Free IELTS band score calculator. Track your test results over time, set goals, and monitor your progress toward your target band score.',
  keywords: ['IELTS', 'band score', 'calculator', 'IELTS tracker', 'IELTS preparation'],
  openGraph: {
    title: 'IELTS Diaries — Track Your IELTS Journey',
    description: 'Free IELTS band score calculator and progress tracker.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
