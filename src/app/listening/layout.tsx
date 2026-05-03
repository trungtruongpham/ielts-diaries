import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Listening Practice | IELTS Diaries',
  description:
    'Practice IELTS Listening with Cambridge CAM 17–20 tests. Real exam UI with auto-scoring and full answer review.',
}

export default function ListeningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
