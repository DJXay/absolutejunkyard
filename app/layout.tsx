import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Absolute Junkyard',
  description: 'Post and Browse Items',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
