import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chartly',
  description: 'From data to information, in a single prompt',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
