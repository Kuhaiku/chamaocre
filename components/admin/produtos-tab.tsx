'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash, Edit2, X, Image as ImageIcon, UploadCloud, ShoppingBag, Save } from 'lucide-react'

const PRODUTO_INICIAL = {
  id: '', name: '', line: '', notes: '', feeling: '', historia: '', price: '', tag: '', tagColor: '#C87A2C', burnTime: '', weight: '', altura: '', largura: '', comprimento: '', estoque: 0
}

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
                {p.tag && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-white/90 backdrop-blur-sm shadow-sm" style={{ color: p.tagColor }}>{p.tag}</span>
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
                <button onClick={() => handleAbrirFormulario(p)} className="flex-1 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-1"><Edit2 size={12}/> Editar</button>
                <button onClick={() => handleExcluir(p.id)} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors flex items-center justify-center"><Trash size={14}/></button>
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
                      <input required type="text" value={produtoEditando.name} onChange={(e) => setProdutoEditando({...produtoEditando, name: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Preço (R$)</label>
                      <input required type="number" step="0.01" value={produtoEditando.price} onChange={(e) => setProdutoEditando({...produtoEditando, price: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Qtd em Estoque</label>
                      <input required type="number" value={produtoEditando.estoque} onChange={(e) => setProdutoEditando({...produtoEditando, estoque: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Peso Comercial (Visível ao Cliente)</label>
                      <input type="text" value={produtoEditando.peso_comercial || ''} onChange={(e) => setProdutoEditando({...produtoEditando, peso_comercial: e.target.value})} placeholder="Ex: 50g ou 250g" className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] outline-none" />
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

                    {/* AQUI ESTÁ O "QUADRADINHO NORMAL": w-12 h-12 (48x48px fixos), sem estourar o layout */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {imagens.map((img, idx) => (
                        <div key={idx} draggable onDragStart={(e) => handleDragStart(e, idx)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, idx)} className={`relative w-20 h-20 shrink-0 rounded-sm border-2 overflow-hidden bg-white cursor-grab active:cursor-grabbing group ${idx === 0 ? 'border-[#C87A2C]' : 'border-stone-200'}`}>
                          
                          {img.url && typeof img.url === 'string' && img.url.trim() !== '' ? (
                            <img src={img.url} alt={`img-${idx}`} className="w-full h-full object-cover absolute inset-0" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300"><ImageIcon size={16} /></div>
                          )}
                          
                          {/* Overlay com botão de apagar */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <button type="button" onClick={() => handleRemoveImage(idx)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 outline-none"><Trash size={12}/></button>
                          </div>
                          
                          {/* Tag de Capa */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Linha / Coleção</label>
                      <input type="text" value={produtoEditando.line} onChange={(e) => setProdutoEditando({...produtoEditando, line: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Etiqueta (Tag)</label>
                      <input type="text" value={produtoEditando.tag} onChange={(e) => setProdutoEditando({...produtoEditando, tag: e.target.value})} placeholder="Ex: Novo" className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Cor da Tag</label>
                      <input type="color" value={produtoEditando.tagColor} onChange={(e) => setProdutoEditando({...produtoEditando, tagColor: e.target.value})} className="w-full h-[42px] p-1 bg-white border border-stone-300 rounded-md cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Tempo de Queima</label>
                    <input type="text" value={produtoEditando.burnTime} onChange={(e) => setProdutoEditando({...produtoEditando, burnTime: e.target.value})} placeholder="Ex: 30 horas" className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Notas Olfativas</label>
                    <textarea rows={2} value={produtoEditando.notes} onChange={(e) => setProdutoEditando({...produtoEditando, notes: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">Sensação (Feeling)</label>
                    <textarea rows={2} value={produtoEditando.feeling} onChange={(e) => setProdutoEditando({...produtoEditando, feeling: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 block">História Detalhada</label>
                    <textarea rows={5} value={produtoEditando.historia} onChange={(e) => setProdutoEditando({...produtoEditando, historia: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none resize-none" />
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
                      onChange={(e) => setProdutoEditando({...produtoEditando, weight: parseFloat(e.target.value) / 1000})} 
                      placeholder="Ex: 300 (para 300g totais)" 
                      className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 flex items-center justify-between">
                      Altura
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">Centímetros (cm)</span>
                    </label>
                    <input required type="number" value={produtoEditando.altura} onChange={(e) => setProdutoEditando({...produtoEditando, altura: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 flex items-center justify-between">
                      Largura
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">Centímetros (cm)</span>
                    </label>
                    <input required type="number" value={produtoEditando.largura} onChange={(e) => setProdutoEditando({...produtoEditando, largura: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase mb-1.5 flex items-center justify-between">
                      Comprimento
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">Centímetros (cm)</span>
                    </label>
                    <input required type="number" value={produtoEditando.comprimento} onChange={(e) => setProdutoEditando({...produtoEditando, comprimento: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-900 focus:border-[#C87A2C] focus:ring-1 focus:ring-[#C87A2C] outline-none" />
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