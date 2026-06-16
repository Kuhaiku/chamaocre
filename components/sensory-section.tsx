'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Sparkles, Hand, ShoppingBag, MessageCircle } from 'lucide-react'

export function SensorySection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-sens').forEach((el, i) => {
              setTimeout(() => {
                el.classList.add('animate-fade-in-up')
                ;(el as HTMLElement).style.opacity = '0.1'
              }, i * 150)
            })
          }
        })
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative w-full bg-[#0a0a0a] overflow-hidden font-sans">
      
      {/* Fundo unificado cobrindo toda a seção */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/images/gallery-1.png" 
          alt="Ambiente Chama Ocre" 
          fill 
          className="object-cover opacity-30"
        />
        {/* Gradiente vindo de baixo para cima: funde 100% com o fundo na base e escurece o topo */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/90" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
        
        {/* =========================================
            PARTE 1: SENSORIAL
        ============================================= */}
        <div className="relative w-full flex flex-col items-center mb-32">
          
          {/* Efeito de Brilho Central (Glow Orb) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-[#C87A2C]/20 blur-[80px] rounded-full pointer-events-none" />
          
          <span className="reveal-sens opacity-0 text-[10px] tracking-[0.3em] uppercase text-[#C87A2C] font-semibold mb-6">
            A Experiência Chama Ocre
          </span>
          
          <h2 className="reveal-sens opacity-0 font-heading text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
            Mais que uma vela.<br/>
            <em className="italic text-[#E59400]">Uma experiência.</em>
          </h2>
          
          <p className="reveal-sens opacity-0 text-stone-400 text-sm md:text-base max-w-xl leading-relaxed mb-16">
            Cada fragrância foi criada para transformar ambientes e criar momentos de pausa em meio à correria do dia. Porque você merece desacelerar.
          </p>

          <div className="reveal-sens opacity-0 flex flex-wrap justify-center gap-12 md:gap-24">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-[#C87A2C]/40 flex items-center justify-center mb-4 bg-black/40">
                <Eye className="w-5 h-5 text-stone-300" strokeWidth={1.5} />
              </div>
              <span className="text-xs uppercase tracking-widest text-stone-300 mb-1">Visão</span>
              <span className="text-[10px] text-stone-500">Chama hipnótica</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-[#C87A2C]/40 flex items-center justify-center mb-4 bg-black/40">
                <Sparkles className="w-5 h-5 text-stone-300" strokeWidth={1.5} />
              </div>
              <span className="text-xs uppercase tracking-widest text-stone-300 mb-1">Olfato</span>
              <span className="text-[10px] text-stone-500">Aromas envolventes</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-[#C87A2C]/40 flex items-center justify-center mb-4 bg-black/40">
                <Hand className="w-5 h-5 text-stone-300" strokeWidth={1.5} />
              </div>
              <span className="text-xs uppercase tracking-widest text-stone-300 mb-1">Tato</span>
              <span className="text-[10px] text-stone-500">Texturas artesanais</span>
            </div>
          </div>
        </div>

        {/* =========================================
            PARTE 2: CTA (Acenda o conforto)
        ============================================= */}
        <div className="relative w-full flex flex-col items-center">
           
           {/* Efeito de Brilho Central (Glow Orb) */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-[#C87A2C]/15 blur-[80px] rounded-full pointer-events-none" />

           <div className="reveal-sens opacity-0 flex items-center gap-4 mb-6">
             <div className="w-8 h-px bg-[#C87A2C]/50" />
             <Sparkles className="w-3 h-3 text-[#C87A2C]" />
             <div className="w-8 h-px bg-[#C87A2C]/50" />
           </div>

          {/* <h2 className="reveal-sens opacity-0 font-heading text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
            Acenda o <em className="italic text-[#E59400]">conforto.</em>
          </h2> */}

          {/* <p className="reveal-sens opacity-0 text-stone-400 text-sm md:text-base max-w-lg leading-relaxed mb-10">
            Descubra a coleção exclusiva da Chama Ocre Ateliê e transforme sua rotina em um momento de bem-estar.
          </p> */}

          {/* <div className="reveal-sens opacity-0 flex flex-col sm:flex-row gap-4">
             <Link 
              href="#produtos" 
              className="bg-[#C87A2C] hover:bg-[#E59400] text-white flex items-center justify-center gap-2 px-8 py-3.5 rounded-sm tracking-widest uppercase text-[11px] font-medium transition-all"
            >
              <ShoppingBag size={14} />
              Comprar Agora
            </Link> 
            
             <a 
              href="https://wa.me/5522992082292"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#C87A2C] text-white hover:bg-[#C87A2C]/10 flex items-center justify-center gap-2 px-8 py-3.5 rounded-sm tracking-widest uppercase text-[11px] font-medium transition-all"
            >
              <MessageCircle size={14} />
              Falar no WhatsApp
            </a>
          </div> */}
        </div>

      </div>
    </section>
  )
}