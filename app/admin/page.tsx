'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { useAuthStore } from '@/lib/auth-store'
import { Loader2, Package, Truck, Save, MapPin, Settings, CheckCircle2, ShoppingBag, Key } from 'lucide-react'
import { ProdutosTab } from '@/components/admin/produtos-tab'

const EMAIL_ADMIN = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [isMounted, setIsMounted] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'pedidos' | 'configuracoes' | 'produtos'>('pedidos')
  
  // Estados de Pedidos
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loadingPedidos, setLoadingPedidos] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [salvandoId, setSalvandoId] = useState<number | null>(null)

  // Estados de Configuração
  const [transportadorasAtivas, setTransportadorasAtivas] = useState<string[]>([])
  const [modoTeste, setModoTeste] = useState(true)
  const [melhorEnvioToken, setMelhorEnvioToken] = useState('') // NOVO ESTADO AQUI
  const [servicosME, setServicosME] = useState<any[]>([]) 
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [salvandoConfig, setSalvandoConfig] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (user && user.email !== EMAIL_ADMIN) {
      router.push('/')
    } else if (user && user.email === EMAIL_ADMIN) {
      fetchPedidos()
      fetchConfiguracoes()
      fetchServicosMelhorEnvio()
    }
  }, [user, router])

  const fetchPedidos = async () => {
    setLoadingPedidos(true)
    try {
      const res = await fetch('/api/admin/pedidos')
      const data = await res.json()
      if (res.ok) setPedidos(data.pedidos || [])
    } catch (error) { console.error("Erro ao buscar pedidos") } 
    finally { setLoadingPedidos(false) }
  }

  const fetchConfiguracoes = async () => {
    try {
      const res = await fetch('/api/admin/configuracoes')
      const data = await res.json()
      if (res.ok) {
        setTransportadorasAtivas(data.transportadoras || [])
        setModoTeste(data.modo_teste)
        setMelhorEnvioToken(data.melhor_envio_token || '') // CARREGA O TOKEN
      }
    } catch (error) { console.error("Erro ao buscar configurações") }
  }

  const fetchServicosMelhorEnvio = async () => {
    try {
      const res = await fetch('/api/admin/transportadoras')
      const data = await res.json()
      if (res.ok) setServicosME(data.servicos || [])
    } catch (error) { console.error("Erro ao buscar serviços no ME") } 
    finally { setLoadingConfig(false) }
  }

  const handleToggleTransportadora = (nome: string) => {
    setTransportadorasAtivas(prev => prev.includes(nome) ? prev.filter(t => t !== nome) : [...prev, nome])
  }

  const handleSalvarConfiguracoes = async () => {
    setSalvandoConfig(true)
    try {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transportadoras: transportadorasAtivas, 
          modo_teste: modoTeste,
          melhor_envio_token: melhorEnvioToken // ENVIA O TOKEN NO BODY
        })
      })
      if (res.ok) alert('Configurações salvas com sucesso!')
      else alert('Erro da API ao salvar configurações.')
    } catch (error) { alert('Erro de conexão ao salvar configurações.') } 
    finally { setSalvandoConfig(false) }
  }

  const handleUpdatePedido = async (id: number, novoStatus: string, novoRastreio: string) => {
    setSalvandoId(id)
    try {
      const res = await fetch('/api/admin/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: novoStatus, codigo_rastreio: novoRastreio })
      })
      if (res.ok) {
        setPedidos(pedidos.map(p => p.id === id ? { ...p, status: novoStatus, codigo_rastreio: novoRastreio } : p))
        alert('Pedido atualizado com sucesso!')
      } else { alert('Erro ao atualizar o pedido.') }
    } catch (error) { alert('Erro de conexão.') } 
    finally { setSalvandoId(null) }
  }

  if (!isMounted || !user || user.email !== EMAIL_ADMIN) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="w-8 h-8 animate-spin text-[#C87A2C]" /></div>
  }

  const pedidosFiltrados = filtro === 'todos' ? pedidos : pedidos.filter(p => p.status === filtro)

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <Navbar forceSolid />

      <main className="flex-grow pt-28 pb-20 max-w-7xl mx-auto w-full px-4 sm:px-6 flex flex-col lg:flex-row gap-8">
        
        {/* Menu Lateral */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sticky top-28 space-y-2">
            <button onClick={() => setAbaAtiva('pedidos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-colors outline-none ${abaAtiva === 'pedidos' ? 'bg-[#C87A2C] text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
              <Package size={18} /> Vendas
            </button>
            <button onClick={() => setAbaAtiva('produtos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-colors outline-none ${abaAtiva === 'produtos' ? 'bg-[#C87A2C] text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
              <ShoppingBag size={18} /> Produtos
            </button>
            <button onClick={() => setAbaAtiva('configuracoes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-colors outline-none ${abaAtiva === 'configuracoes' ? 'bg-[#C87A2C] text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
              <Settings size={18} /> Configurações
            </button>
          </div>
        </aside>

        {/* Área Principal */}
        <div className="flex-1 relative">
          
          {/* ABA PEDIDOS */}
          {abaAtiva === 'pedidos' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                  <h1 className="text-3xl font-heading text-stone-900">Painel de Vendas</h1>
                  <p className="text-stone-500 text-sm mt-1">Gerencie os pedidos e atualize status.</p>
                </div>
                <div className="flex bg-white rounded-lg shadow-sm border border-stone-200 p-1 overflow-x-auto hide-scrollbar">
                  {['todos', 'aguardando_pagamento', 'pago', 'enviado', 'cancelado'].map((status) => (
                    <button key={status} onClick={() => setFiltro(status)} className={`whitespace-nowrap px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all rounded-md ${filtro === status ? 'bg-[#C87A2C] text-white shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}>
                      {status === 'todos' ? 'Todos' : status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {loadingPedidos ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#C87A2C]" /></div>
              ) : pedidosFiltrados.length === 0 ? (
                <div className="bg-white p-10 text-center rounded-xl border border-stone-200 shadow-sm">
                  <Package className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                  <h3 className="text-xl font-heading text-stone-900">Nenhum pedido encontrado.</h3>
                </div>
              ) : (
                <div className="space-y-6">
                  {pedidosFiltrados.map(pedido => (
                    <PedidoCard key={pedido.id} pedido={pedido} onSave={handleUpdatePedido} salvandoId={salvandoId} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA PRODUTOS */}
          {abaAtiva === 'produtos' && <ProdutosTab />}

          {/* ABA CONFIGURAÇÕES */}
          {abaAtiva === 'configuracoes' && (
            <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm animate-fade-in max-w-2xl">
              <h2 className="text-2xl font-heading text-stone-900 mb-6">Configurações da Loja</h2>
              
              {loadingConfig ? (
                 <Loader2 className="w-6 h-6 animate-spin text-[#C87A2C]" />
              ) : (
                <div className="space-y-6">
                  
                  {/* CAMPO DO TOKEN DO MELHOR ENVIO */}
                  <div className="p-5 border border-stone-200 rounded-lg bg-stone-50/50">
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Key size={16} className="text-[#C87A2C]" />
                      Token do Melhor Envio
                    </h3>
                    <p className="text-xs text-stone-500 mb-4">Cole abaixo o Token OAuth para manter a integração de fretes funcionando.</p>
                    <textarea 
                      value={melhorEnvioToken}
                      onChange={(e) => setMelhorEnvioToken(e.target.value)}
                      placeholder="eyJ0eXAiOiJKV1QiLC..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:border-[#C87A2C] outline-none font-mono resize-none shadow-sm"
                    />
                  </div>

                  {/* CAMPO MODO TESTE */}
                  <div className="flex items-center justify-between p-5 border border-stone-200 rounded-lg bg-stone-50/50">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Modo de Teste (Sandbox)</h3>
                      <p className="text-xs text-stone-500 mt-1">Ao ativar, gerar etiquetas não descontará do seu saldo e criará um rastreio simulado.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input type="checkbox" className="sr-only peer" checked={modoTeste} onChange={(e) => setModoTeste(e.target.checked)} />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C87A2C]"></div>
                    </label>
                  </div>

                  {/* CAMPO TRANSPORTADORAS */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-3">Transportadoras Ativas</h3>
                    <p className="text-xs text-stone-500 mb-4">Marque as opções que deseja oferecer aos seus clientes no Checkout.</p>
                    
                    {servicosME.length === 0 ? (
                      <p className="text-xs text-red-500">Nenhum serviço carregado. Verifique se o Token do Melhor Envio é válido.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {servicosME.map((servico) => {
                          const ativo = transportadorasAtivas.includes(servico.nomeCompleto);
                          return (
                            <label key={servico.id} onClick={() => handleToggleTransportadora(servico.nomeCompleto)} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${ativo ? 'border-[#C87A2C] bg-[#C87A2C]/5 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-white'}`}>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${ativo ? 'bg-[#C87A2C] border-[#C87A2C]' : 'border-stone-300 bg-white'}`}>
                                {ativo && <CheckCircle2 size={12} className="text-white" />}
                              </div>
                              <span className="text-xs font-medium text-stone-900">{servico.nomeCompleto}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* BOTAO SALVAR */}
                  <button onClick={handleSalvarConfiguracoes} disabled={salvandoConfig} className="w-full py-4 mt-4 bg-[#C87A2C] hover:bg-[#E59400] text-white rounded-lg tracking-widest uppercase text-xs font-bold transition-all shadow-md outline-none flex items-center justify-center gap-2">
                    {salvandoConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Configurações
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

function PedidoCard({ pedido, onSave, salvandoId }: { pedido: any, onSave: any, salvandoId: number | null }) {
  const [status, setStatus] = useState(pedido.status)
  const [rastreio, setRastreio] = useState(pedido.codigo_rastreio || '')
  const [gerandoEtiqueta, setGerandoEtiqueta] = useState(false)
  const isMudou = status !== pedido.status || rastreio !== (pedido.codigo_rastreio || '')

  const handleGerarEtiqueta = async () => {
    setGerandoEtiqueta(true)
    try {
      const res = await fetch('/api/admin/gerar-etiqueta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pedido_id: pedido.id }) })
      const data = await res.json()
      if (res.ok && data.success) {
        setRastreio(data.rastreio)
        setStatus('enviado')
        onSave(pedido.id, 'enviado', data.rastreio) 
        if (data.mensagem) alert(data.mensagem) 
      } else { alert('Falha ao gerar etiqueta: ' + data.error) }
    } catch (error) { alert('Erro de conexão ao tentar gerar a etiqueta.') } 
    finally { setGerandoEtiqueta(false) }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm flex flex-col lg:flex-row overflow-hidden">
      <div className="p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-stone-100 bg-stone-50/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-stone-800 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm font-bold">Pedido #{pedido.id}</span>
          <span className="text-xs text-stone-500">{new Date(pedido.criado_em).toLocaleString('pt-BR')}</span>
        </div>
        <h3 className="font-bold text-stone-900 mb-1">{pedido.cliente_nome}</h3>
        <p className="text-sm text-stone-600 mb-1">{pedido.cliente_email}</p>
        <p className="text-sm text-stone-600 mb-6">{pedido.cliente_telefone}</p>
        <div className="flex items-start gap-3 text-sm text-stone-600">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#C87A2C]" />
          <div>
            <p className="font-medium text-stone-900">{pedido.rua}, {pedido.numero} {pedido.complemento && ` - ${pedido.complemento}`}</p>
            <p>{pedido.bairro} - {pedido.cidade}/{pedido.estado}</p>
            <p>CEP: {pedido.cep}</p>
          </div>
        </div>
      </div>

      <div className="p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-stone-100 flex flex-col justify-center">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4">Itens Comprados</h4>
        <div className="space-y-3 mb-4">
          {pedido.itens.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-stone-800"><span className="font-bold text-stone-500 mr-2">{item.quantidade}x</span> {item.nome_produto}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-4 border-t border-stone-100 flex justify-between items-center">
          <span className="text-xs text-stone-500">Frete ({pedido.transportadora_nome || 'N/A'}): R$ {Number(pedido.frete).toFixed(2).replace('.', ',')}</span>
          <span className="font-heading text-lg text-[#C87A2C]">Total: R$ {Number(pedido.total).toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <div className="p-6 lg:w-1/3 flex flex-col justify-center space-y-4 relative">
        {pedido.status === 'pago' && !pedido.codigo_rastreio && (
          <button onClick={handleGerarEtiqueta} disabled={gerandoEtiqueta} className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg tracking-widest uppercase text-[10px] font-bold transition-all shadow-sm outline-none flex items-center justify-center gap-2 mb-2">
            {gerandoEtiqueta ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />} Comprar e Gerar Etiqueta
          </button>
        )}

        <div>
          <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest mb-1.5 block">Status do Pedido</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-[#C87A2C] outline-none">
            <option value="aguardando_pagamento">Aguardando Pagamento</option>
            <option value="pago">Pagamento Aprovado</option>
            <option value="enviado">Pedido Enviado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest mb-1.5 block">Rastreio Oficial</label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input type="text" value={rastreio} onChange={(e) => setRastreio(e.target.value)} placeholder="Ex: QM123456789BR" className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-[#C87A2C] outline-none placeholder:text-stone-400" />
          </div>
        </div>

        <button onClick={() => onSave(pedido.id, status, rastreio)} disabled={!isMudou || salvandoId === pedido.id} className={`w-full py-3 mt-2 rounded-lg tracking-widest uppercase text-xs font-bold transition-all shadow-sm outline-none flex items-center justify-center gap-2 ${isMudou ? 'bg-[#C87A2C] hover:bg-[#E59400] text-white' : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
          {salvandoId === pedido.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Alterações
        </button>
      </div>
    </div>
  )
}