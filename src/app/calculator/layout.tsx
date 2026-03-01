import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IELTS Band Score Calculator | IELTS Diaries',
  description:
    'Free IELTS band score calculator. Instantly convert correct answers to band scores for Listening and Reading (Academic & General Training). Calculate your overall IELTS band score.',
  keywords: ['IELTS calculator', 'band score', 'IELTS listening score', 'IELTS reading score', 'overall band score'],
}

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
