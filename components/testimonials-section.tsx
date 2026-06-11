'use client'

import { useEffect, useRef, useState } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    name: 'Ana Beatriz',
    role: 'Cliente fiel há 2 anos',
    text: 'A Vela Toca transformou minha rotina noturna. O aroma de maçã assada com canela me faz sentir em casa mesmo nos dias mais difíceis. Uma experiência incrível!',
    stars: 5,
    initials: 'AB',
  },
  {
    name: 'Carla Mendonça',
    role: 'Presenteou com a Crepúsculo',
    text: 'Presenteei minha mãe com a Vela Crepúsculo e ela não para de falar sobre o aroma sofisticado. A embalagem é tão bonita que eu mesma fiquei com vontade de ficar com o presente!',
    stars: 5,
    initials: 'CM',
  },
  {
    name: 'Fernanda Lima',
    role: 'Decoradora de interiores',
    text: 'Indico a Chama Ocre para todos os meus clientes. As velas completam qualquer ambiente com aquela luz e aroma que fazem a diferença. Qualidade artesanal incomparável.',
    stars: 5,
    initials: 'FL',
  },
  {
    name: 'Juliana Ramos',
    role: 'Apaixonada por Bosque',
    text: 'A Vela Bosque me transporta para uma floresta no outono toda vez que a acendo. É mágico! Já comprei três vezes e vou continuar comprando. Recomendo de olhos fechados.',
    stars: 5,
    initials: 'JR',
  },
  {
    name: 'Patrícia Souza',
    role: 'Comprou kit completo',
    text: 'O kit com as três velas é perfeito para quem quer experimentar as linhas. Cada uma tem uma personalidade única e juntas criam uma coleção encantadora. Amei demais!',
    stars: 5,
    initials: 'PS',
  },
]

export function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null)
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)
  const next = () => setCurrent((c) => (c + 1) % testimonials.length)

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-test').forEach((el, i) => {
              setTimeout(() => {
                el.classList.add('animate-fade-in-up')
                ;(el as HTMLElement).style.opacity = '1'
              }, i * 200)
            })
          }
        })
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const visible = [
    testimonials[current],
    testimonials[(current + 1) % testimonials.length],
    testimonials[(current + 2) % testimonials.length],
  ]

  return (
    <section ref={ref} className="py-28 md:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(200,122,44,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C87A2C]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="reveal-test opacity-0 block text-xs tracking-[0.3em] uppercase text-[#C87A2C] font-medium mb-5">
              Depoimentos
            </span>
            <h2 className="reveal-test opacity-0 font-heading text-5xl md:text-6xl font-light leading-tight">
              O que nossos clientes{' '}
              <em className="italic text-[#E59400]">dizem</em>
            </h2>
          </div>
          <div className="reveal-test opacity-0 flex items-center gap-3">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-sm border border-[#C87A2C]/40 hover:border-[#C87A2C] text-muted-foreground hover:text-[#C87A2C] flex items-center justify-center transition-all duration-300"
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="w-12 h-12 rounded-sm border border-[#C87A2C]/40 hover:border-[#C87A2C] text-muted-foreground hover:text-[#C87A2C] flex items-center justify-center transition-all duration-300"
              aria-label="Próximo"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {visible.map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className={`reveal-test opacity-0 border-ocre-glow rounded-sm p-8 bg-card transition-all duration-300 ${
                i === 1 ? 'md:border-[#C87A2C]/50 md:bg-card/80' : ''
              }`}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(t.stars)].map((_, s) => (
                  <Star key={s} size={14} className="fill-[#E59400] text-[#E59400]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C87A2C]/20 border border-[#C87A2C]/40 flex items-center justify-center text-[#C87A2C] text-sm font-medium font-heading">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-1.5 bg-[#C87A2C]' : 'w-1.5 h-1.5 bg-border hover:bg-[#C87A2C]/50'
              }`}
              aria-label={`Ver depoimento ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
