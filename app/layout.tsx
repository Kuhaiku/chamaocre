import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Chama Ocre Ateliê — Velas Artesanais',
  description:
    'Velas artesanais criadas para desacelerar o tempo, aquecer ambientes e despertar memórias. Experimente a coleção exclusiva da Chama Ocre Ateliê.',
  generator: 'v0.app',
  keywords: ['velas artesanais', 'velas aromáticas', 'presente', 'decoração', 'aconchego', 'outono'],
  openGraph: {
    title: 'Chama Ocre Ateliê — Velas Artesanais',
    description: 'Transforme sua casa em um refúgio de aconchego com nossas velas artesanais.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
