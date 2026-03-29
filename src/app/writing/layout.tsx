import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Writing Practice | IELTS Diaries',
  description:
    'Practice your IELTS Writing test with AI-generated prompts. Get instant feedback on all 4 official IELTS Writing criteria after every answer.',
}

export default function WritingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
