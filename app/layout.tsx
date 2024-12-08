import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sanaharava',
  description: 'Sanaharava on suomalainen sanapeli, jossa tavoitteena on yhdistää vierekkäiset kirjaimet sanoiksi ja käyttää kaikki kirjaimet.',
  keywords: ['sanaharava', 'sanalouhos', 'sanapeli', 'suomalainen sanapeli', 'sanaristikko'],
  robots: 'index,follow',
  openGraph: {
    title: 'Sanaharava',
    description: 'Sanaharava on suomalainen sanapeli, jossa tavoitteena on yhdistää vierekkäiset kirjaimet sanoiksi ja käyttää kaikki kirjaimet.',
    url: 'https://sanaharava.fi',
    siteName: 'Sanaharava',
    locale: 'fi_FI'
  }
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