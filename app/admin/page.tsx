'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { useAuthStore } from '@/lib/auth-store'
import { Loader2, Package, Truck, Save, MapPin, Settings, FileText, CheckCircle2, ShoppingBag, Plus, Trash, Edit2, X, Image as ImageIcon } from 'lucide-react'

const EMAIL_ADMIN = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const PRODUTO_INICIAL = {
  id: '', name: '', line: '', notes: '', feeling: '', historia: '', price: '', image: '', tag: '', tagColor: '#C87A2C', burnTime: '', weight: '', altura: '', largura: '', comprimento: '', estoque: 0
}

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
  const [servicosME, setServicosME] = useState<any[]>([]) 
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [salvandoConfig, setSalvandoConfig] = useState(false)

  // Estados de Produtos
  const [produtos, setProdutos] = useState<any[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [produtoEditando, setProdutoEditando] = useState<any>(null)
  const [isFormAberto, setIsFormAberto] = useState(false)
  const [formTab, setFormTab] = useState<'basico' | 'textos' | 'frete'>('basico')
  const [salvandoProduto, setSalvandoProduto] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (user && user.email !== EMAIL_ADMIN) {
      router.push('/')
    } else if (user && user.email === EMAIL_ADMIN) {
      fetchPedidos()
      fetchConfiguracoes()
      fetchServicosMelhorEnvio()
      fetchProdutos()
    }
  }, [user, router])

  // ================== FETCHS ==================
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

  const fetchProdutos = async () => {
    setLoadingProdutos(true)
    try {
      const res = await fetch('/api/admin/produtos')
      const data = await res.json()
      if (res.ok) setProdutos(data.produtos || [])
    } catch (error) { console.error("Erro ao buscar produtos") } 
    finally { setLoadingProdutos(false) }
  }

  // ================== HANDLERS CONFIG ==================
  const handleToggleTransportadora = (nome: string) => {
    setTransportadorasAtivas(prev => prev.includes(nome) ? prev.filter(t => t !== nome) : [...prev, nome])
  }

  const handleSalvarConfiguracoes = async () => {
    setSalvandoConfig(true)
    try {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transportadoras: transportadorasAtivas, modo_teste: modoTeste })
      })
      if (res.ok) alert('Configurações salvas com sucesso!')
    } catch (error) { alert('Erro ao salvar configurações.') } 
    finally { setSalvandoConfig(false) }
  }

  // ================== HANDLERS PEDIDOS ==================
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

  // ================== HANDLERS PRODUTOS ==================
  const handleAbrirFormulario = (produto: any = null) => {
    // Merge seguro para garantir que NENHUM campo venha undefined
    setProdutoEditando(produto ? { ...PRODUTO_INICIAL, ...produto } : { ...PRODUTO_INICIAL })
    setFormTab('basico')
    setIsFormAberto(true)
  }

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvandoProduto(true)
    try {
      const isEdit = !!produtoEditando.id
      const res = await fetch('/api/admin/produtos', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produtoEditando)
      })
      if (res.ok) {
        fetchProdutos()
        setIsFormAberto(false)
      } else { alert('Erro ao salvar produto.') }
    } catch (error) { alert('Erro de conexão.') } 
    finally { setSalvandoProduto(false) }
  }

  const handleExcluirProduto = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    try {
      const res = await fetch(`/api/admin/produtos?id=${id}`, { method: 'DELETE' })
      if (res.ok) setProdutos(produtos.filter(p => p.id !== id))
    } catch (error) { alert('Erro ao excluir.') }
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
          
          {/* ================= ABA PEDIDOS ================= */}
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

          {/* ================= ABA PRODUTOS ================= */}
          {abaAtiva === 'produtos' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                  <h1 className="text-3xl font-heading text-stone-900">Seus Produtos</h1>
                  <p className="text-stone-500 text-sm mt-1">Gerencie o estoque e crie novos itens.</p>
                </div>
                <button onClick={() => handleAbrirFormulario()} className="px-6 py-3 bg-[#C87A2C] hover:bg-[#E59400] text-white rounded-lg tracking-widest uppercase text-xs font-bold transition-all shadow-md outline-none flex items-center justify-center gap-2">
                  <Plus size={16} /> Novo Produto
                </button>
              </div>

              {loadingProdutos ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#C87A2C]" /></div>
              ) : produtos.length === 0 ? (
                <div className="bg-white p-10 text-center rounded-xl border border-stone-200 shadow-sm">
                  <ShoppingBag className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                  <h3 className="text-xl font-heading text-stone-900">Nenhum produto cadastrado.</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {produtos.map(p => (
                    <div key={p.id} className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                      <div className="aspect-square relative bg-stone-100 overflow-hidden">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300"><ImageIcon size={48} strokeWidth={1} /></div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button onClick={() => handleAbrirFormulario(p)} className="p-2.5 bg-white/90 backdrop-blur-sm text-stone-700 hover:text-[#C87A2C] rounded-full shadow-sm transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleExcluirProduto(p.id)} className="p-2.5 bg-white/90 backdrop-blur-sm text-red-500 hover:text-red-700 rounded-full shadow-sm transition-colors"><Trash size={16} /></button>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-stone-400 uppercase tracking-widest">{p.line || 'Sem Linha'}</span>
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${p.tagColor}15`, color: p.tagColor }}>{p.tag || 'Sem Tag'}</span>
                        </div>
                        <h3 className="font-heading text-lg text-stone-900 mb-3 leading-tight">{p.name}</h3>
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-stone-100">
                          <span className="font-bold text-stone-900">R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
                          <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md ${p.estoque > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.estoque > 0 ? `${p.estoque} un` : 'Esgotado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= ABA CONFIGURAÇÕES ================= */}
          {abaAtiva === 'configuracoes' && (
            <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm animate-fade-in max-w-2xl">
              <h2 className="text-2xl font-heading text-stone-900 mb-6">Configurações da Loja</h2>
              
              {loadingConfig ? (
                 <Loader2 className="w-6 h-6 animate-spin text-[#C87A2C]" />
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-5 border border-stone-200 rounded-lg bg-stone-50">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Modo de Teste</h3>
                      <p className="text-xs text-stone-500 mt-1">Ao ativar, gerar etiquetas não descontará do seu saldo e criará um rastreio simulado.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input type="checkbox" className="sr-only peer" checked={modoTeste} onChange={(e) => setModoTeste(e.target.checked)} />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C87A2C]"></div>
                    </label>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-3">Transportadoras Ativas</h3>
                    <p className="text-xs text-stone-500 mb-4">Opções buscadas do Melhor Envio. Marque as que deseja oferecer.</p>
                    
                    {servicosME.length === 0 ? (
                      <p className="text-xs text-red-500">Erro: Nenhuma transportadora retornada pela API.</p>
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

                  <button onClick={handleSalvarConfiguracoes} disabled={salvandoConfig} className="w-full py-4 bg-[#C87A2C] hover:bg-[#E59400] text-white rounded-lg tracking-widest uppercase text-xs font-bold transition-all shadow-md outline-none flex items-center justify-center gap-2">
                    {salvandoConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Configurações
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ================= MODAL PROFISSIONAL DE PRODUTOS ================= */}
      {isFormAberto && produtoEditando && (
        <div 
          className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 sm:p-6 transition-opacity" 
          onClick={(e) => { if (e.target === e.currentTarget) setIsFormAberto(false) }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in relative overflow-hidden">
            
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-white z-10 shrink-0">
              <div>
                <h2 className="text-2xl font-heading text-stone-900">{produtoEditando.id ? 'Editar Produto' : 'Novo Produto'}</h2>
                <p className="text-xs text-stone-500 mt-1">Preencha as informações do produto abaixo.</p>
              </div>
              <button onClick={() => setIsFormAberto(false)} className="p-2 bg-stone-50 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors outline-none"><X size={20} /></button>
            </div>

            {/* Abas do Formulário (Scrollável Mobile) */}
            <div className="flex border-b border-stone-100 px-6 bg-stone-50 shrink-0 overflow-x-auto hide-scrollbar">
               <button type="button" onClick={(e) => { e.preventDefault(); setFormTab('basico'); }} className={`py-4 px-6 text-[10px] whitespace-nowrap font-bold tracking-widest uppercase border-b-2 transition-colors outline-none ${formTab === 'basico' ? 'border-[#C87A2C] text-[#C87A2C]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Dados Básicos</button>
               <button type="button" onClick={(e) => { e.preventDefault(); setFormTab('textos'); }} className={`py-4 px-6 text-[10px] whitespace-nowrap font-bold tracking-widest uppercase border-b-2 transition-colors outline-none ${formTab === 'textos' ? 'border-[#C87A2C] text-[#C87A2C]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Conteúdo</button>
               <button type="button" onClick={(e) => { e.preventDefault(); setFormTab('frete'); }} className={`py-4 px-6 text-[10px] whitespace-nowrap font-bold tracking-widest uppercase border-b-2 transition-colors outline-none ${formTab === 'frete' ? 'border-[#C87A2C] text-[#C87A2C]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Logística</button>
            </div>

            {/* Corpo do Formulário */}
            <form id="form-produto" onSubmit={handleSalvarProduto} className="flex-1 overflow-y-auto p-6 bg-white">
              
              {formTab === 'basico' && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Nome do Produto *</label>
                    <input required type="text" value={produtoEditando.name} onChange={(e) => setProdutoEditando({...produtoEditando, name: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Preço (R$) *</label>
                      <input required type="number" step="0.01" value={produtoEditando.price} onChange={(e) => setProdutoEditando({...produtoEditando, price: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Estoque *</label>
                      <input required type="number" value={produtoEditando.estoque} onChange={(e) => setProdutoEditando({...produtoEditando, estoque: Number(e.target.value)})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">URL da Imagem</label>
                    <div className="flex gap-3">
                      <input type="text" value={produtoEditando.image} onChange={(e) => setProdutoEditando({...produtoEditando, image: e.target.value})} placeholder="/produtos/imagem.jpg" className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                      {produtoEditando.image && (
                        <div className="w-12 h-12 relative rounded-lg border border-stone-200 overflow-hidden flex-shrink-0 bg-stone-100">
                          <Image src={produtoEditando.image} alt="Preview" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                    <div className="sm:col-span-1">
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Linha / Coleção</label>
                      <input type="text" value={produtoEditando.line} onChange={(e) => setProdutoEditando({...produtoEditando, line: e.target.value})} placeholder="Ex: Clássica" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Tag Visual</label>
                      <input type="text" value={produtoEditando.tag} onChange={(e) => setProdutoEditando({...produtoEditando, tag: e.target.value})} placeholder="Lançamento" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block flex items-center justify-between">
                        Cor da Tag 
                        <span className="w-3 h-3 rounded-full border border-stone-200" style={{ backgroundColor: produtoEditando.tagColor }}></span>
                      </label>
                      <input type="color" value={produtoEditando.tagColor} onChange={(e) => setProdutoEditando({...produtoEditando, tagColor: e.target.value})} className="w-full h-[46px] p-1 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}

              {formTab === 'textos' && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Tempo de Queima</label>
                    <input type="text" value={produtoEditando.burnTime} onChange={(e) => setProdutoEditando({...produtoEditando, burnTime: e.target.value})} placeholder="Ex: 30 horas" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Notas Olfativas</label>
                    <textarea rows={2} value={produtoEditando.notes} onChange={(e) => setProdutoEditando({...produtoEditando, notes: e.target.value})} placeholder="Ex: Topo: Maçã. Corpo: Canela. Fundo: Baunilha." className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Sensação (Feeling)</label>
                    <textarea rows={2} value={produtoEditando.feeling} onChange={(e) => setProdutoEditando({...produtoEditando, feeling: e.target.value})} placeholder="Ex: Aconchego e doçura para dias frios." className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">História / Descrição Detalhada</label>
                    <textarea rows={6} value={produtoEditando.historia} onChange={(e) => setProdutoEditando({...produtoEditando, historia: e.target.value})} placeholder="Conte a história por trás deste aroma..." className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all resize-none" />
                  </div>
                </div>
              )}

              {formTab === 'frete' && (
                <div className="animate-fade-in">
                  <div className="mb-6 p-4 bg-[#C87A2C]/5 border border-[#C87A2C]/20 rounded-lg">
                    <p className="text-sm text-stone-700 font-medium">Medidas de Postagem</p>
                    <p className="text-xs text-stone-500 mt-1">Estes dados são enviados ao Melhor Envio para o cálculo preciso do frete. Insira os valores do produto já embalado.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Peso Bruto (Kg) *</label>
                      <input required type="number" step="0.01" value={produtoEditando.weight} onChange={(e) => setProdutoEditando({...produtoEditando, weight: e.target.value})} placeholder="Ex: 0.5" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Altura (cm) *</label>
                      <input required type="number" value={produtoEditando.altura} onChange={(e) => setProdutoEditando({...produtoEditando, altura: e.target.value})} placeholder="Ex: 15" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Largura (cm) *</label>
                      <input required type="number" value={produtoEditando.largura} onChange={(e) => setProdutoEditando({...produtoEditando, largura: e.target.value})} placeholder="Ex: 15" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-2 block">Comprimento (cm) *</label>
                      <input required type="number" value={produtoEditando.comprimento} onChange={(e) => setProdutoEditando({...produtoEditando, comprimento: e.target.value})} placeholder="Ex: 15" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C87A2C]/20 focus:border-[#C87A2C] transition-all" />
                    </div>
                  </div>
                </div>
              )}

            </form>

            {/* Footer Modal */}
            <div className="p-5 border-t border-stone-100 bg-stone-50 flex justify-end gap-3 shrink-0">
               <button type="button" onClick={() => setIsFormAberto(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-200 rounded-lg transition-colors outline-none">Cancelar</button>
               <button type="submit" form="form-produto" disabled={salvandoProduto} className="px-8 py-3 bg-[#C87A2C] hover:bg-[#E59400] text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 shadow-md outline-none">
                 {salvandoProduto ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                 {produtoEditando.id ? 'Salvar Edição' : 'Criar Produto'}
               </button>
            </div>

          </div>
        </div>
      )}

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
            {gerandoEtiqueta ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Comprar e Gerar Etiqueta
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