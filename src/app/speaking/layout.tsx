import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speaking Practice | IELTS Diaries',
  description:
    'Practice your IELTS Speaking test with an AI examiner. Get instant feedback on all 4 band criteria after every answer.',
}

export default function SpeakingLayout({ children }: { children: React.ReactNode }) {
  return (
    // Full-screen immersive layout — no footer, subdued background for focus
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
