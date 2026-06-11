'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

const galleryImages = [
  { src: '/images/gallery-1.png', alt: 'Chama de vela acesa com luz quente', span: 'md:col-span-2 md:row-span-2' },
  { src: '/images/gallery-2.png', alt: 'Canto aconchegante com velas e decoração outonal', span: '' },
  { src: '/images/gallery-3.png', alt: 'Detalhe do rótulo artesanal', span: '' },
  { src: '/images/gallery-4.png', alt: 'Embalagem premium para presente', span: 'md:col-span-2' },
  { src: '/images/gallery-5.png', alt: 'Processo artesanal de criação das velas', span: '' },
  { src: '/images/gallery-6.png', alt: 'Coleção de velas com elementos outonais', span: '' },
]

export function GallerySection() {
  const ref = useRef<HTMLElement>(null)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-gal').forEach((el, i) => {
              setTimeout(() => {
                el.classList.add('animate-fade-in-up')
                ;(el as HTMLElement).style.opacity = '1'
              }, i * 100)
            })
          }
        })
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      <section id="galeria" ref={ref} className="py-28 md:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,122,44,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="reveal-gal opacity-0 block text-xs tracking-[0.3em] uppercase text-[#C87A2C] font-medium mb-5">
              Galeria
            </span>
            <h2 className="reveal-gal opacity-0 font-heading text-5xl md:text-6xl font-light leading-tight text-balance">
              Beleza que se{' '}
              <em className="italic text-[#E59400]">sente</em>
            </h2>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-3 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[180px]">
            {galleryImages.map((img, i) => (
              <button
                key={img.src}
                className={`reveal-gal opacity-0 relative overflow-hidden rounded-sm group cursor-pointer ${img.span}`}
                onClick={() => setLightbox(img)}
                aria-label={`Ver imagem: ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border border-[#C87A2C]/80 bg-[#C87A2C]/20 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-foreground text-lg">+</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[#C87A2C] transition-all duration-200"
            onClick={() => setLightbox(null)}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
          <div
            className="relative max-w-4xl w-full aspect-[4/3] rounded-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.src}
              alt={lightbox.alt}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  )
}
