'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Search, SlidersHorizontal, Loader2, X, Plus } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'

export default function LojaPage() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estados dos Filtros
  const [busca, setBusca] = useState('')
  const [linhaSelecionada, setLinhaSelecionada] = useState<string>('todas')
  const [sensacaoSelecionada, setSensacaoSelecionada] = useState<string>('todas')
  const [ordenacao, setOrdenacao] = useState<string>('recentes')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const addItemToCart = useCartStore((state) => state.addItem)

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const res = await fetch('/api/produtos')
        if (res.ok) {
          const data = await res.json()
          setProdutos(data.produtos)
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProdutos()
  }, [])

  // Extrai filtros dinamicamente do banco
  const linhasUnicas = useMemo(() => Array.from(new Set(produtos.map(p => p.line))), [produtos])
  const sensacoesUnicas = useMemo(() => Array.from(new Set(produtos.map(p => p.feeling))), [produtos])

  // Lógica de Filtragem e Ordenação
  const produtosFiltrados = useMemo(() => {
    let filtrados = [...produtos]

    if (busca) {
      filtrados = filtrados.filter(p => p.name.toLowerCase().includes(busca.toLowerCase()))
    }
    if (linhaSelecionada !== 'todas') {
      filtrados = filtrados.filter(p => p.line === linhaSelecionada)
    }
    if (sensacaoSelecionada !== 'todas') {
      filtrados = filtrados.filter(p => p.feeling === sensacaoSelecionada)
    }

    // Ordenação
    if (ordenacao === 'menor_preco') {
      filtrados.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (ordenacao === 'maior_preco') {
      filtrados.sort((a, b) => Number(b.price) - Number(a.price))
    }

    return filtrados
  }, [produtos, busca, linhaSelecionada, sensacaoSelecionada, ordenacao])

  const handleComprar = (produto: any) => {
    addItemToCart({
      id: produto.id,
      name: produto.name,
      price: Number(produto.price),
      image: produto.image,
      weight: produto.weight,
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 max-w-7xl mx-auto w-full px-4 sm:px-6">
        
        {/* Cabeçalho da Loja */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-heading text-stone-900 font-light mb-2">Loja</h1>
            <p className="text-sm text-stone-500">{produtosFiltrados.length} produtos encontrados</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileFiltersOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-sm text-sm font-medium text-stone-700"
            >
              <SlidersHorizontal size={16} /> Filtros
            </button>
            
            <select 
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="px-4 py-2 bg-white border border-stone-200 rounded-sm text-sm text-stone-700 outline-none focus:border-[#C87A2C]"
            >
              <option value="recentes">Mais Recentes</option>
              <option value="menor_preco">Menor Preço</option>
              <option value="maior_preco">Maior Preço</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* BARRA LATERAL - FILTROS (Desktop) */}
          <aside className={`w-full md:w-64 flex-shrink-0 ${isMobileFiltersOpen ? 'fixed inset-0 z-[60] bg-white p-6 overflow-y-auto' : 'hidden md:block'}`}>
            <div className="flex items-center justify-between md:hidden mb-6">
              <h2 className="text-lg font-heading font-medium">Filtros</h2>
              <button onClick={() => setIsMobileFiltersOpen(false)}><X size={20} /></button>
            </div>

            <div className="space-y-8">
              {/* Busca */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-3">Buscar</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Nome da vela..." 
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-sm text-sm outline-none focus:border-[#C87A2C]"
                  />
                </div>
              </div>

              {/* Linhas */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-3">Linha</h3>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="linha" checked={linhaSelecionada === 'todas'} onChange={() => setLinhaSelecionada('todas')} className="accent-[#C87A2C]" />
                    <span className="text-sm text-stone-700">Todas</span>
                  </label>
                  {linhasUnicas.map(linha => (
                    <label key={linha as string} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="linha" checked={linhaSelecionada === linha} onChange={() => setLinhaSelecionada(linha as string)} className="accent-[#C87A2C]" />
                      <span className="text-sm text-stone-700">{linha as string}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sensações */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-3">Sensação</h3>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="sensacao" checked={sensacaoSelecionada === 'todas'} onChange={() => setSensacaoSelecionada('todas')} className="accent-[#C87A2C]" />
                    <span className="text-sm text-stone-700">Todas</span>
                  </label>
                  {sensacoesUnicas.map(sensacao => (
                    <label key={sensacao as string} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="sensacao" checked={sensacaoSelecionada === sensacao} onChange={() => setSensacaoSelecionada(sensacao as string)} className="accent-[#C87A2C]" />
                      <span className="text-sm text-stone-700">{sensacao as string}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
            
            {/* Botão aplicar (Apenas mobile) */}
            <button 
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full mt-8 md:hidden bg-[#C87A2C] text-white py-3 rounded-sm text-sm font-medium tracking-widest uppercase"
            >
              Ver Resultados
            </button>
          </aside>

          {/* GRADE DE PRODUTOS */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#C87A2C]">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm uppercase tracking-widest">Carregando loja...</p>
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="text-center py-20 bg-white border border-stone-200 rounded-sm">
                <p className="text-stone-500">Nenhum produto encontrado com estes filtros.</p>
                <button onClick={() => { setBusca(''); setLinhaSelecionada('todas'); setSensacaoSelecionada('todas'); }} className="mt-4 text-[#C87A2C] hover:underline text-sm font-medium">
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtosFiltrados.map((product) => (
                  <div key={product.id} className="group bg-white border border-stone-200 rounded-sm overflow-hidden flex flex-col hover:border-[#C87A2C]/50 transition-colors">
                    
                    <Link href={`/produto/${product.id}`} className="relative aspect-square overflow-hidden bg-stone-100 block">
                      {product.tag && (
                        <div className={`absolute top-3 left-3 z-10 ${product.tagColor || 'bg-stone-500'} text-white text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm`}>
                          {product.tag}
                        </div>
                      )}
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    <div className="p-5 flex flex-col flex-grow">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#C87A2C] font-medium mb-1 block">
                        {product.line}
                      </span>
                      <Link href={`/produto/${product.id}`} className="font-heading text-xl text-stone-900 mb-1 hover:text-[#C87A2C] transition-colors">
                        {product.name}
                      </Link>
                      <p className="text-xs text-stone-500 mb-4 line-clamp-1">{product.notes}</p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-lg font-medium text-stone-900">
                          R$ {Number(product.price).toFixed(2).replace('.', ',')}
                        </span>
                        
                        <button 
                          onClick={() => handleComprar(product)}
                          className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-[#C87A2C] hover:text-white transition-colors"
                          aria-label="Adicionar à sacola"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}