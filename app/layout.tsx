import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sanaharava',
  description: 'Yhdistä vierekkäiset kirjaimet sanoiksi ja käytä kaikki kirjaimet.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="91931195-2c4a-4e8e-bb3f-fb60e4524d98"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}