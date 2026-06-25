import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { AuthDrawer } from '@/components/auth-drawer';
import './globals.css'

// Importação do componente da sacola de compras
import { CartDrawer } from '@/components/cart-drawer'

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
  applicationName: 'Chama Ocre',
  authors: [{ name: 'Leonardo Raposo Boechat' }],
  creator: 'Leonardo Raposo Boechat',
  publisher: 'Raposo.Tech',
  keywords: ['velas artesanais', 'velas aromáticas', 'presente', 'decoração', 'aconchego', 'outono'],
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Chama Ocre Ateliê — Velas Artesanais',
    description: 'Transforme sua casa em um refúgio de aconchego com nossas velas artesanais.',
    siteName: 'Chama Ocre',
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
        
        {/* Adição do Drawer da Sacola globalmente */}
        <CartDrawer />
        <AuthDrawer />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}