import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

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
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}