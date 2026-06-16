'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'

interface Product {
  id: number;
  name: string;
  line: string;
  notes: string;
  feeling: string;
  price: string;
  image: string;
  tag: string;
  tagColor: string;
  burnTime: string;
  weight: string;
}

export function ProductsSection() {
  const ref = useRef<HTMLElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Traz a função de adicionar à sacola do estado global
  const addItemToCart = useCartStore((state) => state.addItem)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/produtos');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.produtos);
        }
      } catch (error) {
        console.error("Erro ao carregar os produtos do catálogo:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (isLoading || products.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-prod').forEach((el, i) => {
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
  }, [isLoading, products]);

  // Função para lidar com a adição rápida à sacola
  const handleComprarRapido = (product: Product) => {
    addItemToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      weight: product.weight,
    })
  }

  return (
    <section id="produtos" ref={ref} className="py-28 md:py-36 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(139,69,34,0.07)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-20">
          <span className="reveal-prod opacity-0 block text-xs tracking-[0.3em] uppercase text-[#C87A2C] font-medium mb-5">
            Catálogo
          </span>
          <h2 className="reveal-prod opacity-0 font-heading text-5xl md:text-6xl font-light leading-tight text-balance">
            Nossa coleção de{' '}
            <em className="italic text-[#E59400]">fragrâncias</em>
          </h2>
          <p className="reveal-prod opacity-0 mt-6 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Cada vela carrega uma intenção, uma memória, uma experiência. Escolha a que mais ressoa com você.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#C87A2C]">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium tracking-widest uppercase">Carregando catálogo...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Nenhum produto cadastrado no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="reveal-prod opacity-0 group relative rounded-sm overflow-hidden border-ocre-glow bg-card hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-[#C87A2C]/15 flex flex-col"
                onMouseEnter={() => setHovered(product.id)}
                onMouseLeave={() => setHovered(null)}
              >
                
                {product.tag && (
                  <div className={`absolute top-4 left-4 z-10 ${product.tagColor || 'bg-stone-500'} text-white text-xs tracking-widest uppercase px-3 py-1 rounded-sm`}>
                    {product.tag}
                  </div>
                )}

                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className={`object-cover transition-all duration-700 ${hovered === product.id ? 'scale-105' : 'scale-100'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                </div>

                <div className="p-7 flex flex-col flex-grow">
                  
                  <span className="text-xs tracking-[0.2em] uppercase text-[#C87A2C] font-medium">
                    {product.line}
                  </span>

                  <h3 className="font-heading text-3xl font-light text-foreground mt-2 mb-5 group-hover:text-[#E59400] transition-colors duration-300">
                    {product.name}
                  </h3>

                  <div className="h-px bg-border mb-5" />

                  <div className="space-y-2 mb-6 flex-grow">
                    <div className="flex gap-2 text-sm">
                      <span className="text-[#C87A2C] font-medium min-w-fit">Notas:</span>
                      <span className="text-muted-foreground">{product.notes}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-[#C87A2C] font-medium min-w-fit">Sensação:</span>
                      <span className="text-muted-foreground">{product.feeling}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-8">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground tracking-wider uppercase mb-0.5">Duração</div>
                      <div className="text-sm text-foreground font-medium">{product.burnTime}</div>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground tracking-wider uppercase mb-0.5">Peso</div>
                      <div className="text-sm text-foreground font-medium">{product.weight}</div>
                    </div>
                  </div>

                  {/* Footer - Botões Lado a Lado */}
                  <div className="mt-auto flex items-center gap-3">
                    <Link 
                      href={`/produto/${product.id}`} 
                      className="flex-1 flex items-center justify-center border border-[#C87A2C] text-[#C87A2C] hover:bg-[#C87A2C] hover:text-white text-xs tracking-widest uppercase px-4 py-3.5 rounded-sm transition-colors duration-300 font-medium"
                    >
                      Ver Detalhes
                    </Link>
                    
                    <button 
                      onClick={() => handleComprarRapido(product)}
                      className="w-12 h-12 flex-shrink-0 bg-[#C87A2C] hover:bg-[#E59400] text-white flex items-center justify-center rounded-sm transition-transform duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg hover:shadow-[#C87A2C]/20"
                      aria-label="Adicionar à sacola"
                      title="Adicionar à sacola"
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-16 reveal-prod opacity-0">
          <p className="text-muted-foreground mb-6 text-sm tracking-wide">
            Quer criar um kit personalizado? Entre em contato e montamos a combinação perfeita para você.
          </p>
          <a
            href="https://wa.me/5522992082292"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#C87A2C]/60 hover:border-[#C87A2C] text-[#C87A2C] hover:text-[#E59400] tracking-widest uppercase text-sm px-8 py-3 rounded-sm transition-all duration-300"
          >
            Montar Kit Personalizado
          </a>
        </div>
      </div>
    </section>
  )
}