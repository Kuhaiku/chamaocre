'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Loader2, Package, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function MeusPedidosPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [pedidos, setPedidos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    const fetchPedidos = async () => {
      try {
        const res = await fetch(`/api/meus-pedidos?usuario_id=${user.id}`)
        const data = await res.json()
        if (res.ok) setPedidos(data.pedidos)
      } catch (error) {
        console.error("Erro ao buscar pedidos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPedidos()
  }, [user, router])

  const getStatusVisual = (status: string) => {
    switch (status) {
      case 'pago': return { cor: 'text-green-600 bg-green-50 border-green-200', icone: <CheckCircle2 size={16} />, texto: 'Pagamento Aprovado' }
      case 'enviado': return { cor: 'text-blue-600 bg-blue-50 border-blue-200', icone: <Truck size={16} />, texto: 'Pedido Enviado' }
      case 'cancelado': return { cor: 'text-red-600 bg-red-50 border-red-200', icone: <XCircle size={16} />, texto: 'Cancelado' }
      default: return { cor: 'text-orange-600 bg-orange-50 border-orange-200', icone: <Clock size={16} />, texto: 'Aguardando Pagamento' }
    }
  }

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C87A2C]" /></div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <Navbar forceSolid />
      <main className="flex-grow pt-28 pb-20 max-w-4xl mx-auto w-full px-4 sm:px-6">
        <h1 className="text-3xl font-heading text-stone-900 mb-8 flex items-center gap-3">
          <Package className="text-[#C87A2C]" /> Meus Pedidos
        </h1>

        {pedidos.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-sm border border-stone-200 shadow-sm">
            <p className="text-stone-500 mb-6">Você ainda não possui nenhum pedido.</p>
            <Link href="/loja" className="bg-[#C87A2C] text-white px-6 py-3 rounded-sm text-xs font-bold tracking-widest uppercase hover:bg-[#E59400] transition-colors">
              Ir para a loja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => {
              const statusProps = getStatusVisual(pedido.status)
              return (
                <div key={pedido.id} className="bg-white p-6 border border-stone-200 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#C87A2C]/50">
                  <div>
                    <p className="text-xs text-stone-500 mb-1">
                      Pedido feito em {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                    <h3 className="font-heading text-lg text-stone-900">Pedido #{pedido.id}</h3>
                    <p className="text-sm font-medium text-stone-900 mt-2">
                      Total: R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest ${statusProps.cor}`}>
                      {statusProps.icone} {statusProps.texto}
                    </div>
                    {pedido.codigo_rastreio && (
                      <p className="text-xs font-medium text-stone-600 bg-stone-100 px-3 py-1.5 rounded-sm border border-stone-200">
                        📦 Rastreio: {pedido.codigo_rastreio}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}