'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Menu, X, ShoppingBag } from 'lucide-react'

const navLinks = [
  { label: 'Início', href: '#hero' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Produtos', href: '#produtos' },
  { label: 'Galeria', href: '#galeria' },
  { label: 'Contato', href: '#footer' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (href: string) => {
    setIsOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => scrollTo('#hero')}
          className="flex items-center gap-3 group"
          aria-label="Ir para o início"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#C87A2C]/40 group-hover:border-[#C87A2C] transition-colors duration-300">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-Mk6htbXNcCgkPqaQKPAUqTCi1zab9x.png"
              alt="Chama Ocre Ateliê"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-heading text-lg font-semibold tracking-widest uppercase text-foreground/90 group-hover:text-[#C87A2C] transition-colors duration-300">
            Chama Ocre
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-sm tracking-widest uppercase text-muted-foreground hover:text-[#C87A2C] transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#C87A2C] after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => scrollTo('#produtos')}
            className="flex items-center gap-2 bg-[#C87A2C] hover:bg-[#E59400] text-foreground text-sm tracking-widest uppercase px-5 py-2.5 rounded-sm transition-all duration-300 font-medium"
          >
            <ShoppingBag size={15} />
            Comprar
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground hover:text-[#C87A2C] transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-md border-t border-border px-6 py-6 flex flex-col gap-5">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-left text-sm tracking-widest uppercase text-muted-foreground hover:text-[#C87A2C] transition-colors duration-300"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('#produtos')}
            className="mt-2 bg-[#C87A2C] hover:bg-[#E59400] text-foreground text-sm tracking-widest uppercase px-5 py-3 rounded-sm transition-all duration-300 font-medium text-center"
          >
            Comprar Agora
          </button>
        </div>
      )}
    </header>
  )
}
