'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ArrowRight, ShoppingBag, Flame } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'

// Reutilizando a lógica de galeria da sua loja
const parseGaleria = (galeriaRaw: any) => {
  if (!galeriaRaw) return [];
  if (Array.isArray(galeriaRaw)) return galeriaRaw;
  if (typeof galeriaRaw === 'string') {
    try {
      const parsed = JSON.parse(galeriaRaw);
      return Array.isArray(parsed) ? parsed : [galeriaRaw];
    } catch (e) {
      return [galeriaRaw];
    }
  }
  return [];
};

export default function NotFound() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const addItemToCart = useCartStore((state) => state.addItem)

  // Busca os produtos para exibir no carrossel de recomendações
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const res = await fetch('/api/produtos')
        if (res.ok) {
          const data = await res.json()
          // Pega apenas os 6 primeiros produtos com estoque para o 404
          const produtosEmEstoque = data.produtos.filter((p: any) => Number(p.estoque) > 0)
          setProdutos(produtosEmEstoque.slice(0, 6))
        }
      } catch (error) {
        console.error('Erro ao buscar produtos no 404:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProdutos()
  }, [])

  const handleComprarRapido = (produto: any) => {
    addItemToCart({
      id: produto.id,
      name: produto.name,
      price: Number(produto.price),
      image: produto.image,
      weight: produto.weight,
      altura: produto.altura,
      largura: produto.largura,
      comprimento: produto.comprimento,
      estoque: Number(produto.estoque),
      quantity: 1
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <Navbar forceSolid />

      <main className="flex-grow pt-32 pb-20 max-w-7xl mx-auto w-full px-4 sm:px-6 flex flex-col items-center justify-center text-center">
        
        {/* Seção de Erro Acolhedor */}
        <div className="max-w-2xl mx-auto mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#C87A2C]/10 rounded-full blur-3xl -z-10" />
          
          <Flame className="w-16 h-16 text-[#C87A2C] mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-heading text-stone-900 font-light mb-4">
            Ops! A chama dessa página se apagou...
          </h1>
          <p className="text-stone-500 mb-8 leading-relaxed">
            A página que você está procurando pode ter mudado de lugar ou não existe mais. 
            Mas não se preocupe, seu momento de aconchego ainda está garantido. Que tal conhecer nossas fragrâncias favoritas?
          </p>
          
          <Link 
            href="/loja"
            className="inline-flex items-center gap-2 bg-[#C87A2C] hover:bg-[#E59400] text-white px-8 py-3.5 rounded-sm text-sm font-medium tracking-widest uppercase transition-colors shadow-sm"
          >
            Ir para a Loja <ArrowRight size={16} />
          </Link>
        </div>

        {/* Carrossel de Produtos Relacionados */}
        {!isLoading && produtos.length > 0 && (
          <div className="w-full mt-12">
            <div className="text-left mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-heading font-light text-stone-900">Recomendações para você</h2>
              <Link href="/loja" className="text-sm text-[#C87A2C] hover:text-[#E59400] uppercase tracking-widest font-medium">
                Ver todos
              </Link>
            </div>

            {/* Container do Carrossel com Tailwind (Snap Scroll) */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {produtos.map((product) => {
                const galeriaArray = parseGaleria(product.galeria);
                const imagemExibicao = galeriaArray.length > 0 ? galeriaArray[0] : product.image;

                return (
                  <div 
                    key={product.id} 
                    className="min-w-[260px] sm:min-w-[280px] max-w-[280px] snap-start group bg-white border border-stone-200 rounded-sm overflow-hidden flex flex-col hover:border-[#C87A2C]/50 transition-colors flex-shrink-0"
                  >
                    <Link href={`/produto/${product.id}`} className="block relative aspect-square overflow-hidden bg-stone-100">
                      <Image
                        src={imagemExibicao as string}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    <div className="p-4 flex flex-col flex-grow text-left">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#C87A2C] font-medium mb-1 block truncate">
                        {product.line}
                      </span>
                      <Link href={`/produto/${product.id}`}>
                        <h3 className="font-heading text-lg text-stone-900 mb-1 truncate hover:text-[#C87A2C] transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-stone-500 mb-4 line-clamp-1">{product.notes}</p>
                      
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <span className="text-lg font-medium text-stone-900">
                          R$ {Number(product.price).toFixed(2).replace('.', ',')}
                        </span>
                        
                        <button 
                          onClick={() => handleComprarRapido(product)}
                          className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-sm text-[10px] font-semibold uppercase tracking-widest transition-all bg-stone-100 text-stone-800 hover:bg-[#C87A2C] hover:text-white"
                          title="Adicionar à sacola"
                        >
                          <ShoppingBag size={14} /> 
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  )
}