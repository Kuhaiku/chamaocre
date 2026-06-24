'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Search, SlidersHorizontal, Loader2, X, ShoppingBag, FilterX, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'

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

function ProductCard({ product, onAdd }: { product: any, onAdd: (p: any, q: number) => void }) {
  const [quantidade, setQuantidade] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);
  const [isAdded, setIsAdded] = useState(false); // NOVO ESTADO AQUI

  const estoqueDisponivel = Number(product.estoque || 0);
  const galeriaArray = parseGaleria(product.galeria);
  const todasImagens = Array.from(new Set([product.image, ...galeriaArray].filter(Boolean)));

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImg((prev) => (prev + 1) % todasImagens.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImg((prev) => (prev - 1 + todasImagens.length) % todasImagens.length);
  };

  // FUNÇÃO QUE CONTROLA O FEEDBACK VISUAL
  const handleAddToCart = () => {
    onAdd(product, quantidade);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setQuantidade(1); // Opcional: reseta a quantidade após adicionar
    }, 2000); // Fica verde por 2 segundos
  };

  return (
    <div className="group bg-white border border-stone-200 rounded-sm overflow-hidden flex flex-col hover:border-[#C87A2C]/50 transition-colors w-full">
      
      {/* ... (O código das imagens continua igualzinho) ... */}
      <div className="relative aspect-square overflow-hidden bg-stone-100 block group/carousel">
        <div className="absolute inset-0 z-0">
          <Image
            src={todasImagens[currentImg] as string}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow relative z-10 bg-white">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#C87A2C] font-medium mb-1 block">
          {product.line}
        </span>
        <h3 className="font-heading text-xl text-stone-900 mb-1">{product.name}</h3>
        <p className="text-xs text-stone-500 mb-4 line-clamp-1">{product.notes}</p>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium text-stone-900 block">
              R$ {Number(product.price).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
              Restam {estoqueDisponivel}
            </span>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border border-stone-200 rounded-sm h-8 sm:h-10 bg-stone-50">
              <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="w-8 h-full flex items-center justify-center text-stone-500 hover:text-[#C87A2C] outline-none">-</button>
              <span className="text-xs sm:text-sm font-medium text-stone-800">{quantidade}</span>
              <button onClick={() => setQuantidade(Math.min(estoqueDisponivel, quantidade + 1))} className="w-8 h-full flex items-center justify-center text-stone-500 hover:text-[#C87A2C] outline-none">+</button>
            </div>
            
            {/* BOTÃO COM FEEDBACK DINÂMICO */}
            <button 
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`w-full h-8 sm:h-10 flex items-center justify-center gap-1.5 rounded-sm text-[10px] font-semibold uppercase tracking-widest transition-all shadow-sm outline-none ${
                isAdded 
                  ? 'bg-green-600 text-white scale-95' 
                  : 'bg-[#C87A2C] hover:bg-[#E59400] text-white'
              }`}
            >
              {isAdded ? (
                <>Na Sacola! ✔</>
              ) : (
                <>
                  <ShoppingBag size={14} /> 
                  <span className="hidden sm:inline">Adicionar à Sacola</span>
                  <span className="sm:hidden">Sacola</span>
                </>
              )}
            </button>

            <Link href={`/produto/${product.id}`} className="w-full h-8 sm:h-10 border border-stone-200 text-stone-600 hover:border-[#C87A2C] hover:text-[#C87A2C] flex items-center justify-center rounded-sm text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors outline-none mt-1">
              Ver Detalhes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function LojaPage() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [busca, setBusca] = useState('')
  const [linhasSelecionadas, setLinhasSelecionadas] = useState<string[]>([])
  const [sensacoesSelecionadas, setSensacoesSelecionadas] = useState<string[]>([])
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

  const linhasUnicas = useMemo(() => {
    // Filtra apenas produtos com estoque para extrair as linhas
    const emEstoque = produtos.filter(p => Number(p.estoque) > 0)
    return Array.from(new Set(emEstoque.map(p => p.line)))
  }, [produtos])
  
  const sensacoesUnicas = useMemo(() => {
    const todasSensacoes = new Set<string>();
    // Filtra apenas produtos com estoque para extrair as sensações
    const emEstoque = produtos.filter(p => Number(p.estoque) > 0)
    emEstoque.forEach(p => {
      if (p.feeling) {
        const feelings = p.feeling.split(',').map((f: string) => f.trim()).filter((f: string) => f !== '');
        feelings.forEach((f: string) => todasSensacoes.add(f));
      }
    });
    return Array.from(todasSensacoes).sort();
  }, [produtos])

  const produtosFiltrados = useMemo(() => {
    // Remove os produtos com estoque 0 ou nulo logo no início
    let filtrados = produtos.filter(p => Number(p.estoque) > 0)

    if (busca) {
      filtrados = filtrados.filter(p => p.name.toLowerCase().includes(busca.toLowerCase()))
    }
    if (linhasSelecionadas.length > 0) {
      filtrados = filtrados.filter(p => linhasSelecionadas.includes(p.line))
    }
    if (sensacoesSelecionadas.length > 0) {
      filtrados = filtrados.filter(p => {
        if (!p.feeling) return false;
        const productFeelings = p.feeling.split(',').map((f: string) => f.trim());
        return productFeelings.some((f: string) => sensacoesSelecionadas.includes(f));
      });
    }
    if (ordenacao === 'menor_preco') {
      filtrados.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (ordenacao === 'maior_preco') {
      filtrados.sort((a, b) => Number(b.price) - Number(a.price))
    }

    return filtrados
  }, [produtos, busca, linhasSelecionadas, sensacoesSelecionadas, ordenacao])

const handleComprar = (produto: any, quantidadeDesejada: number) => {
    addItemToCart({
      id: produto.id,
      name: produto.name,
      price: Number(produto.price),
      image: produto.image,
      weight: produto.weight,
      estoque: Number(produto.estoque), // <-- ADICIONE ESTA LINHA
      quantity: quantidadeDesejada
    })
  }

  const toggleLinha = (linha: string) => {
    setLinhasSelecionadas(prev => 
      prev.includes(linha) ? prev.filter(l => l !== linha) : [...prev, linha]
    )
  }

  const toggleSensacao = (sensacao: string) => {
    setSensacoesSelecionadas(prev => 
      prev.includes(sensacao) ? prev.filter(s => s !== sensacao) : [...prev, sensacao]
    )
  }

  const limparFiltros = () => {
    setBusca('')
    setLinhasSelecionadas([])
    setSensacoesSelecionadas([])
    setOrdenacao('recentes')
  }

  const hasActiveFilters = busca !== '' || linhasSelecionadas.length > 0 || sensacoesSelecionadas.length > 0 || ordenacao !== 'recentes';

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <Navbar forceSolid />

      <main className="flex-grow pt-28 pb-20 max-w-7xl mx-auto w-full px-4 sm:px-6">
        
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
          
          <aside className={`w-full md:w-64 flex-shrink-0 ${isMobileFiltersOpen ? 'fixed inset-0 z-[60] bg-white p-6 overflow-y-auto' : 'hidden md:block'}`}>
            <div className="flex items-center justify-between md:hidden mb-6">
              <h2 className="text-lg font-heading font-medium">Filtros</h2>
              <button onClick={() => setIsMobileFiltersOpen(false)}><X size={20} /></button>
            </div>

            <div className="space-y-8">
              
              {hasActiveFilters && (
                <button 
                  onClick={limparFiltros}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-sm text-xs font-medium tracking-widest uppercase transition-colors"
                >
                  <FilterX size={14} /> Limpar Filtros
                </button>
              )}

              <div>
                <h3 className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-3">Buscar</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Nome da vela..." 
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-sm text-sm text-stone-900 outline-none focus:border-[#C87A2C]"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-3">Linha</h3>
                <div className="flex flex-col gap-3">
                  {linhasUnicas.map(linha => (
                    <label key={linha as string} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-4 h-4 border border-stone-300 rounded-[3px] group-hover:border-[#C87A2C] transition-colors">
                        <input 
                          type="checkbox" 
                          checked={linhasSelecionadas.includes(linha as string)} 
                          onChange={() => toggleLinha(linha as string)} 
                          className="absolute opacity-0 w-full h-full cursor-pointer" 
                        />
                        {linhasSelecionadas.includes(linha as string) && (
                          <div className="w-2.5 h-2.5 bg-[#C87A2C] rounded-[1px]" />
                        )}
                      </div>
                      <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">{linha as string}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-3">Sensação</h3>
                <div className="flex flex-col gap-3">
                  {sensacoesUnicas.map(sensacao => (
                    <label key={sensacao as string} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-4 h-4 border border-stone-300 rounded-[3px] group-hover:border-[#C87A2C] transition-colors">
                        <input 
                          type="checkbox" 
                          checked={sensacoesSelecionadas.includes(sensacao as string)} 
                          onChange={() => toggleSensacao(sensacao as string)} 
                          className="absolute opacity-0 w-full h-full cursor-pointer" 
                        />
                        {sensacoesSelecionadas.includes(sensacao as string) && (
                          <div className="w-2.5 h-2.5 bg-[#C87A2C] rounded-[1px]" />
                        )}
                      </div>
                      <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">{sensacao as string}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
            
            <button 
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full mt-8 md:hidden bg-[#C87A2C] text-white py-3 rounded-sm text-sm font-medium tracking-widest uppercase"
            >
              Ver Resultados
            </button>
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#C87A2C]">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm uppercase tracking-widest">Carregando loja...</p>
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="text-center py-20 bg-white border border-stone-200 rounded-sm">
                <p className="text-stone-500 mb-4">Nenhum produto encontrado com estes filtros.</p>
                <button 
                  onClick={limparFiltros} 
                  className="px-6 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-sm text-sm font-medium uppercase tracking-widest transition-colors"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtosFiltrados.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAdd={handleComprar} 
                  />
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