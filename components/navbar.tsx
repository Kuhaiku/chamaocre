'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'

const navLinks = [
  { label: 'Início', href: '/' },
  { label: 'Sobre', href: '/#sobre' },
  { label: 'Loja', href: '/loja', highlight: true },
  { label: 'Contato', href: '/#footer' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  // Controle de hidratação
  const [isMounted, setIsMounted] = useState(false)
  
  const { setIsOpen: setSacolaOpen, getTotalItems } = useCartStore()
  const totalItems = getTotalItems()

  useEffect(() => {
    setIsMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-3 group" aria-label="Ir para o início">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#C87A2C]/40 group-hover:border-[#C87A2C] transition-colors duration-300">
            <Image src="/logo.png" alt="Chama Ocre Ateliê" fill className="object-cover" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-widest uppercase text-white/90 group-hover:text-[#C87A2C] transition-colors duration-300">
            Chama Ocre
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-widest uppercase transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#C87A2C] after:transition-all after:duration-300 hover:after:w-full ${
                link.highlight ? 'text-[#C87A2C] font-semibold' : 'text-stone-300 hover:text-[#C87A2C]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setSacolaOpen(true)}
            className="relative p-2 text-stone-300 hover:text-[#C87A2C] transition-colors"
            aria-label="Abrir sacola"
          >
            <ShoppingBag size={20} />
            {/* Só exibe o badge se estiver montado e houver itens */}
            {isMounted && totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-[#C87A2C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1 -translate-y-1">
                {totalItems}
              </span>
            )}
          </button>

          <button
            className="md:hidden text-stone-300 hover:text-[#C87A2C] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`text-left text-sm tracking-widest uppercase transition-colors duration-300 ${
                link.highlight ? 'text-[#C87A2C] font-semibold' : 'text-stone-300 hover:text-[#C87A2C]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}