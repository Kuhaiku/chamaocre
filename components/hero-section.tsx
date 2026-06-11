'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { ArrowDown } from 'lucide-react'

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${10 + (i * 7.5) % 80}%`,
  delay: `${(i * 0.4) % 3}s`,
  duration: `${3 + (i * 0.5) % 3}s`,
  drift: `${-30 + (i * 5) % 60}px`,
  size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
}))

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
          }
        })
      },
      { threshold: 0.1 }
    )
    const elements = sectionRef.current?.querySelectorAll('.reveal')
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollToNext = () => {
    const el = document.querySelector('#sobre')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-candle.png"
          alt="Vela artesanal acesa em ambiente aconchegante"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
        {/* Warm glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(200,122,44,0.12)_0%,transparent_70%)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-[#E59400] opacity-0"
            style={{
              left: p.left,
              bottom: '20%',
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationName: 'particle-rise',
              animationDuration: p.duration,
              animationDelay: p.delay,
              animationTimingFunction: 'ease-out',
              animationIterationCount: 'infinite',
              ['--drift' as string]: p.drift,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 border border-[#C87A2C]/50 bg-[#C87A2C]/10 backdrop-blur-sm text-[#E59400] text-xs tracking-[0.3em] uppercase px-5 py-2 rounded-full mb-10 reveal opacity-0"
          style={{ animationDelay: '0.1s' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#E59400] animate-pulse" />
          Velas Artesanais Exclusivas
        </div>

        {/* Heading */}
        <h1
          className="font-heading text-5xl md:text-7xl lg:text-8xl font-light leading-[1.1] text-foreground mb-8 reveal opacity-0 text-balance"
          style={{ animationDelay: '0.25s' }}
        >
          Transforme sua casa em um{' '}
          <em className="text-glow not-italic text-[#E59400]">refúgio de aconchego.</em>
        </h1>

        {/* Subtitle */}
        <p
          className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-12 reveal opacity-0"
          style={{ animationDelay: '0.45s' }}
        >
          Velas artesanais criadas para desacelerar o tempo, aquecer ambientes e despertar memórias.
        </p>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 reveal opacity-0"
          style={{ animationDelay: '0.65s' }}
        >
          <button
            onClick={() => document.querySelector('#produtos')?.scrollIntoView({ behavior: 'smooth' })}
            className="group bg-[#C87A2C] hover:bg-[#E59400] text-foreground tracking-widest uppercase text-sm font-medium px-10 py-4 rounded-sm transition-all duration-300 flex items-center gap-2 shadow-lg shadow-[#C87A2C]/20 hover:shadow-[#E59400]/30"
          >
            Conhecer Coleção
            <ArrowDown size={14} className="group-hover:translate-y-1 transition-transform duration-300" />
          </button>
          <button
            onClick={() => document.querySelector('#produtos')?.scrollIntoView({ behavior: 'smooth' })}
            className="border border-[#C87A2C]/60 hover:border-[#C87A2C] text-foreground hover:text-[#C87A2C] tracking-widest uppercase text-sm font-medium px-10 py-4 rounded-sm transition-all duration-300 backdrop-blur-sm"
          >
            Comprar Agora
          </button>
        </div>

        {/* Stats */}
        <div
          className="mt-20 flex flex-wrap items-center justify-center gap-12 reveal opacity-0"
          style={{ animationDelay: '0.85s' }}
        >
          {[
            { value: '500+', label: 'Clientes Satisfeitas' },
            { value: '100%', label: 'Produção Artesanal' },
            { value: '3', label: 'Linhas Exclusivas' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-3xl font-light text-[#C87A2C] mb-1">{stat.value}</div>
              <div className="text-xs tracking-widest uppercase text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-muted-foreground hover:text-[#C87A2C] transition-colors duration-300 animate-float"
        aria-label="Rolar para baixo"
      >
        <span className="text-xs tracking-[0.3em] uppercase">Descobrir</span>
        <div className="w-px h-10 bg-gradient-to-b from-[#C87A2C]/80 to-transparent" />
      </button>

      <style jsx>{`
        .reveal {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .in-view .reveal, .reveal {
          animation-play-state: running;
        }
      `}</style>
    </section>
  )
}
