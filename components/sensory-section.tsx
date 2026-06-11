'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

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
                ;(el as HTMLElement).style.opacity = '1'
              }, i * 200)
            })
          }
        })
      },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/gallery-1.png"
          alt="Chama de vela artesanal"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(200,122,44,0.15)_0%,transparent_65%)]" />
      </div>

      {/* Animated glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-[#C87A2C]/10 animate-glow-pulse pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <span className="reveal-sens opacity-0 block text-xs tracking-[0.3em] uppercase text-[#C87A2C] font-medium mb-8">
          A Experiência Chama Ocre
        </span>

        <h2 className="reveal-sens opacity-0 font-heading text-5xl md:text-7xl font-light leading-tight text-balance mb-8">
          Mais que uma vela.{' '}
          <em className="italic text-glow text-[#E59400]">Uma experiência.</em>
        </h2>

        <p className="reveal-sens opacity-0 text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-16">
          Cada fragrância foi criada para transformar ambientes e criar momentos de pausa em meio à correria do dia.
          Porque você merece desacelerar.
        </p>

        {/* Sensory pillars */}
        <div className="reveal-sens opacity-0 grid grid-cols-3 gap-8 md:gap-16">
          {[
            { label: 'Visão', value: 'Chama hipnótica', icon: '👁' },
            { label: 'Olfato', value: 'Aromas envolventes', icon: '✦' },
            { label: 'Tato', value: 'Texturas artesanais', icon: '✋' },
          ].map((sense) => (
            <div key={sense.label} className="text-center group">
              <div className="w-14 h-14 rounded-full border border-[#C87A2C]/40 bg-[#C87A2C]/10 flex items-center justify-center mx-auto mb-4 group-hover:border-[#C87A2C] group-hover:bg-[#C87A2C]/20 transition-all duration-300 text-lg">
                {sense.icon}
              </div>
              <div className="text-xs tracking-[0.2em] uppercase text-[#C87A2C] mb-1">{sense.label}</div>
              <div className="text-sm text-muted-foreground">{sense.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C87A2C]/30 to-transparent" />
    </section>
  )
}
