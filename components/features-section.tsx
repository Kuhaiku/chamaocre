'use client'

import { useEffect, useRef } from 'react'
import { Flame, Leaf, Sparkles, Gift } from 'lucide-react'

const features = [
  {
    icon: Flame,
    title: 'Produção Artesanal',
    description: 'Cada vela é feita à mão com atenção aos mínimos detalhes, garantindo qualidade e exclusividade em cada unidade.',
  },
  {
    icon: Leaf,
    title: 'Inspiração no Outono',
    description: 'Aromas que evocam o conforto da estação mais aconchegante — folhas caindo, madeira aquecida, canela e especiarias.',
  },
  {
    icon: Sparkles,
    title: 'Ingredientes Selecionados',
    description: 'Utilizamos apenas fragrâncias de alta qualidade e ceras naturais para criar aromas sofisticados e duradouros.',
  },
  {
    icon: Gift,
    title: 'Embalagens Premium',
    description: 'Design pensado para encantar desde o unboxing, tornando cada vela o presente perfeito para qualquer ocasião.',
  },
]

export function FeaturesSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-feat').forEach((el, i) => {
              setTimeout(() => {
                el.classList.add('animate-fade-in-up')
                ;(el as HTMLElement).style.opacity = '1'
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
    <section ref={ref} className="py-24 md:py-32 relative overflow-hidden">
      {/* Texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,122,44,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Horizontal rule decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C87A2C]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="reveal-feat opacity-0 block text-xs tracking-[0.3em] uppercase text-[#C87A2C] font-medium mb-5">
            Por Que Escolher
          </span>
          <h2 className="reveal-feat opacity-0 font-heading text-5xl md:text-6xl font-light leading-tight text-balance">
            A arte de criar{' '}
            <em className="italic text-[#E59400]">momentos únicos</em>
          </h2>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="reveal-feat opacity-0 group border-ocre-glow rounded-sm p-8 bg-card/50 hover:bg-card transition-all duration-500 hover:shadow-lg hover:shadow-[#C87A2C]/10 hover:-translate-y-1"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-sm bg-[#C87A2C]/10 border border-[#C87A2C]/30 flex items-center justify-center mb-6 group-hover:bg-[#C87A2C]/20 group-hover:border-[#C87A2C]/60 transition-all duration-300">
                  <Icon size={20} className="text-[#C87A2C] group-hover:text-[#E59400] transition-colors duration-300" />
                </div>

                <h3 className="font-heading text-xl font-medium text-foreground mb-3 group-hover:text-[#E59400] transition-colors duration-300">
                  {feat.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.description}</p>

                {/* Bottom accent */}
                <div className="mt-6 w-8 h-px bg-[#C87A2C]/40 group-hover:w-16 group-hover:bg-[#C87A2C] transition-all duration-500" />
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C87A2C]/40 to-transparent" />
    </section>
  )
}
