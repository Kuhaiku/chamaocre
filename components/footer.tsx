'use client'

import Image from 'next/image'
import { MessageCircle } from 'lucide-react'

const navLinks = [
  { label: 'Início', href: '#hero' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Produtos', href: '#produtos' },
]

export function Footer() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer id="footer" className="relative border-t border-border bg-card/30">
      {/* Top rule */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C87A2C]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#C87A2C]/50">
                <Image
                  src="logo.png"
                  alt="Chama Ocre Ateliê"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-heading text-lg font-semibold tracking-widest uppercase text-foreground">
                  Chama Ocre
                </div>
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Ateliê</div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Velas artesanais criadas para transformar momentos comuns em experiências memoráveis.
              Feitas à mão com amor e ingredientes selecionados.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-8">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/chama_ocre/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-sm border border-[#C87A2C]/30 bg-[#C87A2C]/5 flex items-center justify-center text-muted-foreground hover:text-[#C87A2C] hover:border-[#C87A2C]/70 hover:bg-[#C87A2C]/10 transition-all duration-300"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* WhatsApp */}
              {/* <a
                href="https://wa.me/5522992082292"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-sm border border-[#C87A2C]/30 bg-[#C87A2C]/5 flex items-center justify-center text-muted-foreground hover:text-[#C87A2C] hover:border-[#C87A2C]/70 hover:bg-[#C87A2C]/10 transition-all duration-300"
              >
                <MessageCircle size={16} />
              </a> */}
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-xs tracking-[0.3em] uppercase text-[#C87A2C] font-medium mb-6">
              Navegação
            </h4>
            <nav className="space-y-3" aria-label="Navegação do rodapé">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="block text-sm text-muted-foreground hover:text-[#C87A2C] transition-colors duration-300"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.3em] uppercase text-[#C87A2C] font-medium mb-6">
              Contato
            </h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <a
                href="https://wa.me/5522992082292"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#C87A2C] transition-colors duration-300"
              >
                <MessageCircle size={14} />
                (22) 99208-2292
              </a>
              <p>@chama_ocre</p>
              <p className="leading-relaxed">
                Pedidos personalizados<br />
                e kits sob encomenda
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Chama Ocre Ateliê. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-[#C87A2C] transition-colors duration-300">
              Política de Privacidade
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-[#C87A2C] transition-colors duration-300">
              Termos de Uso
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}