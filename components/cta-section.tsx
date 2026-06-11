'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'

export function CtaSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-cta').forEach((el, i) => {
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
          src="/images/gallery-2.png"
          alt="Ambiente aconchegante com velas"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/88" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(200,122,44,0.18)_0%,transparent_70%)]" />
      </div>

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#C87A2C]/10 animate-glow-pulse pointer-events-none z-0" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Decorative */}
        <div className="reveal-cta opacity-0 flex items-center justify-center gap-4 mb-10">
          <div className="w-16 h-px bg-[#C87A2C]/60" />
          <span className="text-[#C87A2C] text-2xl animate-flicker">✦</span>
          <div className="w-16 h-px bg-[#C87A2C]/60" />
        </div>

        <h2 className="reveal-cta opacity-0 font-heading text-5xl md:text-7xl font-light leading-tight text-balance mb-6">
          Acenda o{' '}
          <em className="italic text-glow text-[#E59400]">conforto.</em>
        </h2>

        <p className="reveal-cta opacity-0 text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto mb-12">
          Descubra a coleção exclusiva da Chama Ocre Ateliê e transforme sua rotina em um ritual de bem-estar.
        </p>

        <div className="reveal-cta opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => document.querySelector('#produtos')?.scrollIntoView({ behavior: 'smooth' })}
            className="group bg-[#C87A2C] hover:bg-[#E59400] text-foreground tracking-widest uppercase text-sm font-medium px-12 py-4 rounded-sm transition-all duration-300 flex items-center gap-3 shadow-xl shadow-[#C87A2C]/25 hover:shadow-[#E59400]/35"
          >
            <ShoppingBag size={16} />
            Comprar Agora
          </button>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#C87A2C]/60 hover:border-[#C87A2C] text-foreground hover:text-[#C87A2C] tracking-widest uppercase text-sm font-medium px-10 py-4 rounded-sm transition-all duration-300"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
