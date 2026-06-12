'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

export function AboutSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-about').forEach((el, i) => {
              ;(el as HTMLElement).style.animationDelay = `${i * 0.2}s`
              el.classList.add('animate-fade-in-up')
              ;(el as HTMLElement).style.opacity = '1'
            })
          }
        })
      },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="sobre" ref={ref} className="py-28 md:py-36 relative overflow-hidden">
      {/* Warm radial bg */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse,rgba(139,69,34,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Visual side */}
          <div className="relative reveal-about opacity-0">
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden candle-glow">
              <Image
                src="/images/"
                alt="Processo artesanal de criação das velas Chama Ocre"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 md:-right-8 bg-card border border-[#C87A2C]/40 rounded-sm p-5 shadow-xl shadow-black/40 max-w-[180px]">
              <div className="text-xs text-muted-foreground leading-relaxed tracking-wide uppercase">
                Feito à mão com amor e dedicação
              </div>
            </div>

            {/* Logo watermark */}
            <div className="absolute top-6 left-6 w-16 h-16 rounded-full overflow-hidden border-2 border-[#C87A2C]/60 bg-background/80 backdrop-blur-sm">
              <Image
                src="logo.png"
                alt="Chama Ocre Ateliê"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Text side */}
          <div className="space-y-8">
            <div className="reveal-about opacity-0">
              <span className="text-xs tracking-[0.3em] uppercase text-[#C87A2C] font-medium">
                Nossa História
              </span>
            </div>

            <h2 className="font-heading text-5xl md:text-6xl font-light leading-tight text-balance reveal-about opacity-0">
              O Ritual do{' '}
              <em className="italic text-[#E59400]">Aconchego</em>
            </h2>

            <p className="text-muted-foreground leading-relaxed text-lg reveal-about opacity-0">
              A Chama Ocre Ateliê nasceu para transformar momentos comuns em experiências memoráveis.
              Cada vela é produzida artesanalmente, unindo aromas sofisticados, matérias-primas selecionadas
              e um design inspirado no conforto do outono.
            </p>

            <p className="text-muted-foreground leading-relaxed reveal-about opacity-0">
              Acreditamos que um ambiente bem cuidado começa pelo que você sente — e o aroma certo pode
              transformar qualquer espaço em um verdadeiro refúgio. Por isso, cada fragrância é pensada para
              tocar sua memória afetiva e criar momentos de pausa e presença.
            </p>

            {/* Decorative divider */}
            <div className="reveal-about opacity-0 flex items-center gap-4">
              <div className="w-120 h-px bg-[#C87A2C]/60" />
              <span className="text-[#C87A2C] text-lg">✦</span>
              <div className="w-120 h-px bg-[#C87A2C]/60" />
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-4 reveal-about opacity-0">
              {[
                {label: 'Inspiração Outonal' },
                {label: 'Feita à Mão' },
                {label: 'Ingredientes Puros' },
                {label: 'Com Muito Amor' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 text-sm text-muted-foreground "
                >
                  
                  <span className="tracking-wide">{item.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => document.querySelector('#produtos')?.scrollIntoView({ behavior: 'smooth' })}
              className="reveal-about opacity-0 inline-flex items-center gap-3 text-sm tracking-widest uppercase text-[#C87A2C] hover:text-[#E59400] transition-colors duration-300 border-b border-[#C87A2C]/40 hover:border-[#E59400] pb-1"
            >
              Ver Coleção Completa
              
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
