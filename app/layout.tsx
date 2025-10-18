import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geist = localFont({
  src: './fonts/GeistVF.woff',
  weight: '100 900',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Цифровой атлас инновационной инфраструктуры Казахстана',
  description: 'Интерактивная карта объектов инновационной инфраструктуры Казахстана',
  keywords: 'инновации, инфраструктура, Казахстан, технопарк, СЭЗ, бизнес-инкубатор',
  authors: [{ name: 'Digital Atlas Team' }],
  openGraph: {
    title: 'Цифровой атлас инновационной инфраструктуры',
    description: 'Интерактивная карта объектов инновационной инфраструктуры Казахстана',
    type: 'website',
    locale: 'ru_RU',
    alternateLocale: ['kz_KZ', 'en_US']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={geist.className}>
        {children}
      </body>
    </html>
  )
}