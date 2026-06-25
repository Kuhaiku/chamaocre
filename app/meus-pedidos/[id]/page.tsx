'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Loader2, ArrowLeft, Package, MapPin, CreditCard, Truck, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function DetalhesPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuthStore()
  const router = useRouter()
  const [pedido, setPedido] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    const fetchDetalhes = async () => {
      try {
        const res = await fetch(`/api/meus-pedidos/${resolvedParams.id}?usuario_id=${user.id}`)
        const data = await res.json()
        if (res.ok) {
          setPedido(data.pedido)
        } else {
          router.push('/meus-pedidos')
        }
      } catch (error) {
        console.error("Erro ao buscar pedido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetalhes()
  }, [user, router, resolvedParams.id])

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="w-8 h-8 animate-spin text-[#C87A2C]" /></div>
  }

  if (!pedido) return null

  // Define as etapas para a linha do tempo (Timeline)
  const etapas = [
    { key: 'aguardando_pagamento', label: 'Pedido Realizado', icon: <Package size={16} /> },
    { key: 'pago', label: 'Pagamento Aprovado', icon: <CreditCard size={16} /> },
    { key: 'enviado', label: 'Em Transporte', icon: <Truck size={16} /> }
  ]

  // Determina o índice atual do status na timeline
  const statusIndex = pedido.status === 'aguardando_pagamento' ? 0 : pedido.status === 'pago' ? 1 : pedido.status === 'enviado' ? 2 : -1;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <Navbar forceSolid />
      <main className="flex-grow pt-28 pb-20 max-w-4xl mx-auto w-full px-4 sm:px-6">
        <Link href="/meus-pedidos" className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-stone-500 hover:text-[#C87A2C] transition-colors mb-8 outline-none">
          <ArrowLeft className="w-4 h-4" /> Voltar para Meus Pedidos
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-heading text-stone-900">Pedido #{pedido.id}</h1>
            <p className="text-stone-500 mt-1">Realizado em {new Date(pedido.criado_em).toLocaleString('pt-BR')}</p>
          </div>
          {pedido.status === 'cancelado' && (
            <span className="bg-red-100 text-red-700 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest border border-red-200">
              Pedido Cancelado
            </span>
          )}
        </div>

        {/* Linha do Tempo (Status) */}
        {pedido.status !== 'cancelado' && (
          <div className="bg-white p-6 border border-stone-200 rounded-sm shadow-sm mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-stone-100 -translate-y-1/2 z-0"></div>
              <div className="hidden md:block absolute top-1/2 left-0 h-[2px] bg-[#C87A2C] -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(statusIndex / (etapas.length - 1)) * 100}%` }}></div>

              {etapas.map((etapa, idx) => {
                const atingido = statusIndex >= idx;
                return (
                  <div key={etapa.key} className="flex flex-row md:flex-col items-center gap-4 md:gap-2 relative z-10 w-full md:w-auto mb-6 md:mb-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${atingido ? 'bg-[#C87A2C] text-white border-2 border-[#C87A2C]' : 'bg-white text-stone-300 border-2 border-stone-200'}`}>
                      {atingido && idx < statusIndex ? <CheckCircle2 size={18} /> : etapa.icon}
                    </div>
                    <div className="md:text-center">
                      <p className={`text-xs font-bold uppercase tracking-widest ${atingido ? 'text-stone-900' : 'text-stone-400'}`}>{etapa.label}</p>
                    </div>
                    {/* Linha vertical Mobile */}
                    {idx < etapas.length - 1 && <div className={`md:hidden absolute left-5 top-10 w-[2px] h-10 -ml-[1px] ${statusIndex > idx ? 'bg-[#C87A2C]' : 'bg-stone-100'}`}></div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna Principal: Itens */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-6 border-b border-stone-100 pb-4">Itens do Pedido</h2>
              <div className="space-y-4">
                {pedido.itens.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-stone-900">{item.nome_produto}</span>
                      <span className="text-xs text-stone-500">Qtd: {item.quantidade} x R$ {Number(item.preco_unitario).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <span className="font-medium text-stone-900">
                      R$ {(item.quantidade * item.preco_unitario).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rastreio */}
            {pedido.codigo_rastreio && (
              <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 flex items-center gap-4">
                <div className="bg-stone-100 p-3 rounded-full text-stone-600"><Truck size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">Código de Rastreio</h3>
                  <p className="font-mono text-lg text-[#C87A2C] mt-1">{pedido.codigo_rastreio}</p>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Lateral: Endereço e Totais */}
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-[#C87A2C]" /> Entrega
              </h2>
              <div className="text-sm text-stone-600 space-y-1">
                <p>{pedido.rua}, {pedido.numero}</p>
                {pedido.complemento && <p>{pedido.complemento}</p>}
                <p>{pedido.bairro}</p>
                <p>{pedido.cidade} - {pedido.estado}</p>
                <p>CEP: {pedido.cep}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-900">Transportadora</p>
                <p className="text-sm text-stone-600 mt-1">{pedido.transportadora_nome || 'Não informada'}</p>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-4">Resumo</h2>
              <div className="space-y-2 text-sm text-stone-600 border-b border-stone-100 pb-4 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {Number(pedido.subtotal).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>R$ {Number(pedido.frete).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900 uppercase tracking-widest">Total</span>
                <span className="text-xl font-heading text-[#C87A2C]">R$ {Number(pedido.total).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}