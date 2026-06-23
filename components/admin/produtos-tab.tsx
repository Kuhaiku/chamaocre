'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash, Edit2, X, Image as ImageIcon, UploadCloud, ShoppingBag, Save } from 'lucide-react'

const PRODUTO_INICIAL = {
  id: '', name: '', line: '', notes: '', feeling: '', historia: '', price: '', tag: '', tagColor: '', burnTime: '', weight: '', altura: '', largura: '', comprimento: '', estoque: 0
}

// Lista de cores para a Grid. 
// O Tailwind escaneia este arquivo automaticamente, então isso JÁ FUNCIONA como Safelist!
const CORES_DISPONIVEIS = [
  'bg-black',
  'bg-white',
  'bg-slate-50',
  'bg-slate-100',
  'bg-slate-200',
  'bg-slate-300',
  'bg-slate-400',
  'bg-slate-500',
  'bg-slate-600',
  'bg-slate-700',
  'bg-slate-800',
  'bg-slate-900',
  'bg-slate-950',
  'bg-gray-50',
  'bg-gray-100',
  'bg-gray-200',
  'bg-gray-300',
  'bg-gray-400',
  'bg-gray-500',
  'bg-gray-600',
  'bg-gray-700',
  'bg-gray-800',
  'bg-gray-900',
  'bg-gray-950',
  'bg-zinc-50',
  'bg-zinc-100',
  'bg-zinc-200',
  'bg-zinc-300',
  'bg-zinc-400',
  'bg-zinc-500',
  'bg-zinc-600',
  'bg-zinc-700',
  'bg-zinc-800',
  'bg-zinc-900',
  'bg-zinc-950',
  'bg-neutral-50',
  'bg-neutral-100',
  'bg-neutral-200',
  'bg-neutral-300',
  'bg-neutral-400',
  'bg-neutral-500',
  'bg-neutral-600',
  'bg-neutral-700',
  'bg-neutral-800',
  'bg-neutral-900',
  'bg-neutral-950',
  'bg-stone-50',
  'bg-stone-100',
  'bg-stone-200',
  'bg-stone-300',
  'bg-stone-400',
  'bg-stone-500',
  'bg-stone-600',
  'bg-stone-700',
  'bg-stone-800',
  'bg-stone-900',
  'bg-stone-950',
  'bg-red-50',
  'bg-red-100',
  'bg-red-200',
  'bg-red-300',
  'bg-red-400',
  'bg-red-500',
  'bg-red-600',
  'bg-red-700',
  'bg-red-800',
  'bg-red-900',
  'bg-red-950',
  'bg-orange-50',
  'bg-orange-100',
  'bg-orange-200',
  'bg-orange-300',
  'bg-orange-400',
  'bg-orange-500',
  'bg-orange-600',
  'bg-orange-700',
  'bg-orange-800',
  'bg-orange-900',
  'bg-orange-950',
  'bg-amber-50',
  'bg-amber-100',
  'bg-amber-200',
  'bg-amber-300',
  'bg-amber-400',
  'bg-amber-500',
  'bg-amber-600',
  'bg-amber-700',
  'bg-amber-800',
  'bg-amber-900',
  'bg-amber-950',
  'bg-yellow-50',
  'bg-yellow-100',
  'bg-yellow-200',
  'bg-yellow-300',
  'bg-yellow-400',
  'bg-yellow-500',
  'bg-yellow-600',
  'bg-yellow-700',
  'bg-yellow-800',
  'bg-yellow-900',
  'bg-yellow-950',
  'bg-lime-50',
  'bg-lime-100',
  'bg-lime-200',
  'bg-lime-300',
  'bg-lime-400',
  'bg-lime-500',
  'bg-lime-600',
  'bg-lime-700',
  'bg-lime-800',
  'bg-lime-900',
  'bg-lime-950',
  'bg-green-50',
  'bg-green-100',
  'bg-green-200',
  'bg-green-300',
  'bg-green-400',
  'bg-green-500',
  'bg-green-600',
  'bg-green-700',
  'bg-green-800',
  'bg-green-900',
  'bg-green-950',
  'bg-emerald-50',
  'bg-emerald-100',
  'bg-emerald-200',
  'bg-emerald-300',
  'bg-emerald-400',
  'bg-emerald-500',
  'bg-emerald-600',
  'bg-emerald-700',
  'bg-emerald-800',
  'bg-emerald-900',
  'bg-emerald-950',
  'bg-teal-50',
  'bg-teal-100',
  'bg-teal-200',
  'bg-teal-300',
  'bg-teal-400',
  'bg-teal-500',
  'bg-teal-600',
  'bg-teal-700',
  'bg-teal-800',
  'bg-teal-900',
  'bg-teal-950',
  'bg-cyan-50',
  'bg-cyan-100',
  'bg-cyan-200',
  'bg-cyan-300',
  'bg-cyan-400',
  'bg-cyan-500',
  'bg-cyan-600',
  'bg-cyan-700',
  'bg-cyan-800',
  'bg-cyan-900',
  'bg-cyan-950',
  'bg-sky-50',
  'bg-sky-100',
  'bg-sky-200',
  'bg-sky-300',
  'bg-sky-400',
  'bg-sky-500',
  'bg-sky-600',
  'bg-sky-700',
  'bg-sky-800',
  'bg-sky-900',
  'bg-sky-950',
  'bg-blue-50',
  'bg-blue-100',
  'bg-blue-200',
  'bg-blue-300',
  'bg-blue-400',
  'bg-blue-500',
  'bg-blue-600',
  'bg-blue-700',
  'bg-blue-800',
  'bg-blue-900',
  'bg-blue-950',
  'bg-indigo-50',
  'bg-indigo-100',
  'bg-indigo-200',
  'bg-indigo-300',
  'bg-indigo-400',
  'bg-indigo-500',
  'bg-indigo-600',
  'bg-indigo-700',
  'bg-indigo-800',
  'bg-indigo-900',
  'bg-indigo-950',
  'bg-violet-50',
  'bg-violet-100',
  'bg-violet-200',
  'bg-violet-300',
  'bg-violet-400',
  'bg-violet-500',
  'bg-violet-600',
  'bg-violet-700',
  'bg-violet-800',
  'bg-violet-900',
  'bg-violet-950',
  'bg-purple-50',
  'bg-purple-100',
  'bg-purple-200',
  'bg-purple-300',
  'bg-purple-400',
  'bg-purple-500',
  'bg-purple-600',
  'bg-purple-700',
  'bg-purple-800',
  'bg-purple-900',
  'bg-purple-950',
  'bg-fuchsia-50',
  'bg-fuchsia-100',
  'bg-fuchsia-200',
  'bg-fuchsia-300',
  'bg-fuchsia-400',
  'bg-fuchsia-500',
  'bg-fuchsia-600',
  'bg-fuchsia-700',
  'bg-fuchsia-800',
  'bg-fuchsia-900',
  'bg-fuchsia-950',
  'bg-pink-50',
  'bg-pink-100',
  'bg-pink-200',
  'bg-pink-300',
  'bg-pink-400',
  'bg-pink-500',
  'bg-pink-600',
  'bg-pink-700',
  'bg-pink-800',
  'bg-pink-900',
  'bg-pink-950',
  'bg-rose-50',
  'bg-rose-100',
  'bg-rose-200',
  'bg-rose-300',
  'bg-rose-400',
  'bg-rose-500',
  'bg-rose-600',
  'bg-rose-700',
  'bg-rose-800',
  'bg-rose-900',
  'bg-rose-950',
];

// Função auxiliar para definir a cor da tag e contraste do texto automaticamente
const obterClassesDaTag = (tagColor?: string | null) => {
  if (!tagColor) return 'bg-stone-500 text-white';
  const match = tagColor.match(/-(\d+)/);
  const peso = match ? parseInt(match[1], 10) : 500;
  const corDoTexto = peso >= 500 ? 'text-white' : 'text-stone-900';
  return `${tagColor} ${corDoTexto}`;
};

export function ProdutosTab() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isFormAberto, setIsFormAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<any>(null)
  const [imagens, setImagens] = useState<{ id?: number, url: string, file?: File, ordem: number }[]>([])
  const [formTab, setFormTab] = useState<'basico' | 'textos' | 'frete'>('basico')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetchProdutos()
  }, [])

  const fetchProdutos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/produtos')
      const data = await res.json()
      if (res.ok) setProdutos(data.produtos || [])
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const handleAbrirFormulario = (produto: any = null) => {
    if (produto) {
      setProdutoEditando({ ...PRODUTO_INICIAL, ...produto })

      if ((!produto.imagens || produto.imagens.length === 0) && produto.image) {
        setImagens([{ url: produto.image, ordem: 0 }])
      } else {
        setImagens(produto.imagens || [])
      }
    } else {
      setProdutoEditando({ ...PRODUTO_INICIAL })
      setImagens([])
    }
    setFormTab('basico')
    setIsFormAberto(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file, index) => ({
        url: URL.createObjectURL(file),
        file,
        ordem: imagens.length + index
      }))
      setImagens([...imagens, ...newFiles])
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setImagens(imagens.filter((_, i) => i !== indexToRemove))
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('imageIndex', index.toString())
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    const dragIndex = parseInt(e.dataTransfer.getData('imageIndex'))
    if (dragIndex === dropIndex) return

    const novasImagens = [...imagens]
    const [draggedImage] = novasImagens.splice(dragIndex, 1)
    novasImagens.splice(dropIndex, 0, draggedImage)

    setImagens(novasImagens.map((img, idx) => ({ ...img, ordem: idx })))
  }

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)

    try {
      const folderName = (produtoEditando.name || 'novo-produto')
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const imagensParaSalvar = await Promise.all(imagens.map(async (img) => {
        if (img.file) {
          const formData = new FormData()
          formData.append('file', img.file)
          formData.append('folder', folderName)
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadData = await uploadRes.json()
          return { url: uploadData.url, ordem: img.ordem }
        }
        return { id: img.id, url: img.url, ordem: img.ordem }
      }))

      const imagemCapa = imagensParaSalvar.length > 0 && imagensParaSalvar[0].url ? imagensParaSalvar[0].url : '';

      const payload = {
        ...produtoEditando,
        image: imagemCapa,
        imagens: imagensParaSalvar
      }

      const isEdit = !!produtoEditando.id
      const res = await fetch('/api/admin/produtos', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        fetchProdutos()
        setIsFormAberto(false)
      } else { alert('Erro ao salvar produto.') }
    } catch (error) { alert('Erro ao processar dados.') }
    finally { setSalvando(false) }
  }

  const handleExcluir = async (id: number) => {
    if (!confirm('Excluir este produto permanentemente?')) return
    try {
      await fetch(`/api/admin/produtos?id=${id}`, { method: 'DELETE' })
      setProdutos(produtos.filter(p => p.id !== id))
    } catch (error) { alert('Erro ao excluir.') }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#C87A2C]" /></div>

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-heading text-stone-900">Estoque de Produtos</h1>
          <p className="text-stone-500 text-sm mt-1">Gerencie itens, imagens e detalhes.</p>
        </div>
        <button onClick={() => handleAbrirFormulario()} className="px-6 py-2.5 bg-[#C87A2C] hover:bg-[#E59400] text-white rounded-md tracking-widest uppercase text-[11px] font-bold shadow-sm transition-all flex items-center justify-center gap-2">
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {produtos.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-lg border border-stone-200">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-heading text-stone-900">Nenhum produto cadastrado.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {produtos.map(p => (
            <div key={p.id} className={`bg-white border-2 rounded-md shadow-sm overflow-hidden flex flex-col relative ${p.estoque === 0 ? 'border-red-400' : p.estoque <= 3 ? 'border-orange-400' : 'border-stone-200 border-opacity-50 font-normal'}`}>
              <div className="aspect-square relative bg-stone-100 border-b border-stone-100">
                {p.image && typeof p.image === 'string' && p.image.trim() !== '' ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover absolute inset-0" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300"><ImageIcon size={32} strokeWidth={1} /></div>
                )}

                {/* Etiqueta renderizada com as classes do Tailwind dinamicamente */}
                {p.tag && (
                  <span className={`absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm shadow-sm backdrop-blur-sm ${obterClassesDaTag(p.tagColor)}`}>
                    {p.tag}
                  </span>
                )}

              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9px] text-stone-400 uppercase tracking-widest mb-1 truncate">{p.line || 'Sem Linha'}</div>
                <h3 className="font-heading text-sm text-stone-900 mb-2 leading-tight line-clamp-2">{p.name}</h3>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-bold text-[#C87A2C] text-xs">R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${p.estoque === 0 ? 'bg-red-100 text-red-700' : p.estoque <= 3 ? 'bg-orange-100 text-orange-800 flex items-center gap-1' : 'bg-green-100 text-green-700'}`}>
                    {p.estoque <= 3 && p.estoque > 0 && <span title="Estoque Baixo">⚠️</span>} Qtd: {p.estoque}
                  </span>
                </div>
              </div>
              <div className="p-2 border-t border-stone-100 bg-stone-50 flex gap-2">
                <button onClick={() => handleAbrirFormulario(p)} className="flex-1 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-1"><Edit2 size={12} /> Editar</button>
                <button onClick={() => handleExcluir(p.id)} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors flex items-center justify-center"><Trash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormAberto && produtoEditando && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[80] flex items-center justify-center p-2 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsFormAberto(false) }}>

          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden">

            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-heading text-stone-900">{produtoEditando.id ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsFormAberto(false)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors outline-none"><X size={20} /></button>
            </div>

            <div className="flex border-b border-stone-200 px-5 bg-stone-50 shrink-0 overflow-x-auto hide-scrollbar">
              <button type="button" onClick={() => setFormTab('basico')} className={`py-3 px-4 text-[11px] whitespace-nowrap font-bold tracking-widest uppercase border-b-2 outline-none ${formTab === 'basico' ? 'border-[#C87A2C] text-[#C87A2C]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>1. Básico & Imagens</button>
              <button type="button" onClick={() => setFormTab('textos')} className={`py-3 px-4 text-[11px] whitespace-nowrap font-bold tracking-widest uppercase border-b-2 outline-none ${formTab === 'textos' ? 'border-[#C87A2C] text-[#C87A2C]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>2. Textos & Tags</button>
              <button type="button" onClick={() => setFormTab('frete')} className={`py-3 px-4 text-[11px] whitespace-nowrap font-bold tracking-widest uppercase border-b-2 outline-none ${formTab === 'frete' ? 'border-[#C87A2C] text-[#C87A2C]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>3. Logística</button>
            </div>

            <form id="form-produto" onSubmit={handleSalvarProduto} className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white min-h-0">

              {formTab === 'basico' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Nome do Produto *</label>
                      <input required type="text" value={produtoEditando.name} onChange={(e) => setProdutoEditando({ ...produtoEditando, name: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Preço (R$)</label>
                      <input required type="number" step="0.01" value={produtoEditando.price} onChange={(e) => setProdutoEditando({ ...produtoEditando, price: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Qtd em Estoque</label>
                      <input required type="number" value={produtoEditando.estoque} onChange={(e) => setProdutoEditando({ ...produtoEditando, estoque: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Peso Comercial (Visível ao Cliente)</label>
                      <input type="text" value={produtoEditando.peso_comercial || ''} onChange={(e) => setProdutoEditando({ ...produtoEditando, peso_comercial: e.target.value })} placeholder="Ex: 50g ou 250g" className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] outline-none" />
                    </div>
                  </div>

                  <div className="bg-stone-50 p-4 border border-stone-200 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <label className="text-xs font-bold text-stone-900 uppercase block">Imagens do Produto</label>
                        <span className="text-[10px] text-stone-500">Arraste para reordenar. A primeira será a capa.</span>
                      </div>
                      <label className="cursor-pointer px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-2">
                        <UploadCloud size={14} /> Adicionar Fotos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {imagens.map((img, idx) => (
                        <div key={idx} draggable onDragStart={(e) => handleDragStart(e, idx)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, idx)} className={`relative w-20 h-20 shrink-0 rounded-sm border-2 overflow-hidden bg-white cursor-grab active:cursor-grabbing group ${idx === 0 ? 'border-[#C87A2C]' : 'border-stone-200'}`}>

                          {img.url && typeof img.url === 'string' && img.url.trim() !== '' ? (
                            <img src={img.url} alt={`img-${idx}`} className="w-full h-full object-cover absolute inset-0" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300"><ImageIcon size={16} /></div>
                          )}

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <button type="button" onClick={() => handleRemoveImage(idx)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 outline-none"><Trash size={12} /></button>
                          </div>

                          {idx === 0 && <span className="absolute bottom-0 left-0 w-full bg-[#C87A2C] text-white text-[7px] font-bold text-center py-[2px] uppercase tracking-widest z-10 leading-none">Capa</span>}
                        </div>
                      ))}
                    </div>
                    {imagens.length === 0 && (
                      <div className="w-full mt-3 py-6 border-2 border-dashed border-stone-300 rounded-md flex flex-col items-center justify-center text-stone-400">
                        <ImageIcon size={24} className="mb-2 opacity-50" />
                        <span className="text-[10px] uppercase tracking-widest">Nenhuma foto</span>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {formTab === 'textos' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coluna Esquerda */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Linha / Coleção</label>
                        <input type="text" value={produtoEditando.line} onChange={(e) => setProdutoEditando({ ...produtoEditando, line: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Etiqueta (Tag)</label>
                        <input type="text" value={produtoEditando.tag} onChange={(e) => setProdutoEditando({ ...produtoEditando, tag: e.target.value })} placeholder="Ex: Novo" className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                      </div>

                      <div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Cor da Tag</label>

                          {/* Grid de Cores Visual */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {CORES_DISPONIVEIS.map((cor) => (
                              <button
                                key={cor}
                                type="button"
                                onClick={() => setProdutoEditando({ ...produtoEditando, tagColor: cor })}
                                className={`w-7 h-7 rounded-full shadow-sm border-2 transition-all ${cor} ${produtoEditando?.tagColor === cor
                                    ? 'border-white ring-2 ring-[#C87A2C] scale-110'
                                    : 'border-transparent hover:scale-110'
                                  }`}
                                title={cor}
                              />
                            ))}
                          </div>

                          {/* Input mantido caso queira digitar manualmente */}
                          <input
                            id="tagColor"
                            name="tagColor"
                            type="text"
                            value={produtoEditando?.tagColor || ''}
                            onChange={(e) => setProdutoEditando({ ...produtoEditando, tagColor: e.target.value })}
                            placeholder="Ou digite a classe (ex: bg-amber-500)"
                            className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Tempo de Queima</label>
                        <input type="text" value={produtoEditando.burnTime} onChange={(e) => setProdutoEditando({ ...produtoEditando, burnTime: e.target.value })} placeholder="Ex: 30 horas" className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                      </div>
                    </div>

                    {/* Coluna Direita */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Notas Olfativas</label>
                        <textarea rows={3} value={produtoEditando.notes} onChange={(e) => setProdutoEditando({ ...produtoEditando, notes: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none resize-none" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Sensação (Feeling)</label>
                        <textarea rows={4} value={produtoEditando.feeling} onChange={(e) => setProdutoEditando({ ...produtoEditando, feeling: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none resize-none" />
                      </div>
                    </div>
                  </div>

                  {/* Linha Inteira na parte inferior */}
                  <div className="mt-4">
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">História Detalhada</label>
                    <textarea rows={4} value={produtoEditando.historia} onChange={(e) => setProdutoEditando({ ...produtoEditando, historia: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none resize-none" />
                  </div>
                </div>
              )}

              {formTab === 'frete' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Peso Bruto Total p/ Frete (g)</label>
                    <input
                      type="number"
                      value={produtoEditando.weight ? Math.round(Number(produtoEditando.weight) * 1000) : ''}
                      onChange={(e) => setProdutoEditando({ ...produtoEditando, weight: parseFloat(e.target.value) / 1000 })}
                      placeholder="Ex: 300 (para 300g totais)"
                      className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 flex items-center justify-between">
                      Altura
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">Centímetros (cm)</span>
                    </label>
                    <input required type="number" value={produtoEditando.altura} onChange={(e) => setProdutoEditando({ ...produtoEditando, altura: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 flex items-center justify-between">
                      Largura
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">Centímetros (cm)</span>
                    </label>
                    <input required type="number" value={produtoEditando.largura} onChange={(e) => setProdutoEditando({ ...produtoEditando, largura: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 flex items-center justify-between">
                      Comprimento
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">Centímetros (cm)</span>
                    </label>
                    <input required type="number" value={produtoEditando.comprimento} onChange={(e) => setProdutoEditando({ ...produtoEditando, comprimento: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                  </div>
                </div>
              )}

            </form>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsFormAberto(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-600 bg-white border border-stone-300 hover:bg-stone-100 rounded-md transition-colors outline-none">Cancelar</button>
              <button type="submit" form="form-produto" disabled={salvando} className="px-6 py-2.5 bg-[#C87A2C] hover:bg-[#E59400] text-white text-xs font-bold uppercase tracking-widest rounded-md transition-colors flex items-center gap-2 shadow-sm outline-none">
                {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {produtoEditando.id ? 'Salvar Alterações' : 'Criar Produto'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}