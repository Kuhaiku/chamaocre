"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, PlusCircle, Package, UploadCloud, 
  CheckCircle2, Loader2, Trash2, Edit, ArrowLeft, ArrowRight 
} from "lucide-react";

type ImagemGaleria = {
  id: string;
  url: string;
  file?: File;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("produtos");
  const [produtos, setProdutos] = useState<any[]>([]);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [galeria, setGaleria] = useState<ImagemGaleria[]>([]);

  const fetchProdutos = async () => {
    setIsLoadingProdutos(true);
    try {
      const res = await fetch('/api/produtos');
      if (res.ok) {
        const data = await res.json();
        setProdutos(data.produtos);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setIsLoadingProdutos(false);
    }
  };

  useEffect(() => {
    if (activeTab === "produtos") fetchProdutos();
  }, [activeTab]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto permanentemente?")) return;
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProdutos(produtos.filter(p => p.id !== id));
      } else {
        alert("Erro ao excluir o produto.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão.");
    }
  };

  const adicionarImagens = (files: FileList | File[]) => {
    const novasImagens = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      file: file
    }));
    setGaleria(prev => [...prev, ...novasImagens]);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files?.length > 0) adicionarImagens(e.dataTransfer.files);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) adicionarImagens(e.target.files);
  };

  const removerImagem = (id: string) => {
    setGaleria(prev => prev.filter(img => img.id !== id));
  };

  const moverImagem = (index: number, direcao: 'esq' | 'dir') => {
    const novaGaleria = [...galeria];
    if (direcao === 'esq' && index > 0) {
      [novaGaleria[index - 1], novaGaleria[index]] = [novaGaleria[index], novaGaleria[index - 1]];
    } else if (direcao === 'dir' && index < novaGaleria.length - 1) {
      [novaGaleria[index + 1], novaGaleria[index]] = [novaGaleria[index], novaGaleria[index + 1]];
    }
    setGaleria(novaGaleria);
  };

const handleEditClick = async (produto: any) => {
    setProdutoEditando(produto);
    setGaleria([]); 
    setActiveTab("form-produto");

    try {
      const res = await fetch(`/api/produtos/${produto.id}`);
      if (res.ok) {
        const data = await res.json();
        const prodCompleto = data.produto;
        setProdutoEditando(prodCompleto);
        
        const imagensCarregadas = [];
        
        // 1. Carrega a Capa
        if (prodCompleto.image) {
          imagensCarregadas.push({
            id: 'capa-' + Math.random().toString(36).substr(2, 9),
            url: prodCompleto.image
          });
        }
        
        // 2. Carrega a Galeria
        if (prodCompleto.galeria && prodCompleto.galeria.length > 0) {
          prodCompleto.galeria.forEach((url: string) => {
            imagensCarregadas.push({
              id: 'gal-' + Math.random().toString(36).substr(2, 9),
              url: url
            });
          });
        }
        
        setGaleria(imagensCarregadas);
      }
    } catch (error) {
      console.error("Erro ao carregar imagens do produto:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!produtoEditando && galeria.length === 0) {
      return alert('Adicione pelo menos uma imagem para a galeria do novo produto.');
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    galeria.forEach((img, index) => {
      if (img.file) {
        formData.append(`imagem_${index}`, img.file);
      }
    });
    formData.append('total_imagens', galeria.length.toString());

    const isEditing = !!produtoEditando;
    const url = isEditing ? `/api/produtos/${produtoEditando.id}` : '/api/produtos';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, body: formData });
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setGaleria([]);
          (e.target as HTMLFormElement).reset();
          setActiveTab("produtos");
        }, 1500);
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans">
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800">Painel Admin</h2>
          <p className="text-xs text-stone-500 mt-1">Chama Ocre</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab("produtos")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "produtos" ? "bg-amber-50 text-amber-700" : "text-stone-600 hover:bg-stone-50"}`}>
            <Package className="w-5 h-5" /> Meus Produtos
          </button>
          <button onClick={() => { setProdutoEditando(null); setGaleria([]); setActiveTab("form-produto"); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "form-produto" && !produtoEditando ? "bg-amber-50 text-amber-700" : "text-stone-600 hover:bg-stone-50"}`}>
            <PlusCircle className="w-5 h-5" /> Novo Produto
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        
        {activeTab === "produtos" && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
             <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-stone-800">Meus Produtos</h1>
              <button onClick={() => { setProdutoEditando(null); setGaleria([]); setActiveTab('form-produto'); }} className="bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-800 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Cadastrar
              </button>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-sm text-stone-500">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">Estoque</th>
                    <th className="p-4 font-medium">Preço</th>
                    <th className="p-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoadingProdutos ? (
                    <tr><td colSpan={4} className="p-8 text-center text-stone-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Carregando...</td></tr>
                  ) : produtos.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-stone-500">Nenhum produto cadastrado.</td></tr>
                  ) : (
                    produtos.map((prod) => (
                      <tr key={prod.id} className="hover:bg-stone-50/50">
                        <td className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">{prod.name}</p>
                            <p className="text-xs text-stone-500">{prod.line}</p>
                          </div>
                        </td>
                        <td className="p-4 text-stone-600 text-sm">{prod.estoque} un.</td>
                        <td className="p-4 text-stone-600 font-medium">R$ {Number(prod.price).toFixed(2).replace('.', ',')}</td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleEditClick(prod)} className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(prod.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "form-produto" && (
          <div className="max-w-4xl bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-stone-800">
                {produtoEditando ? `Editar: ${produtoEditando.name}` : 'Cadastrar Novo Produto'}
              </h1>
              {produtoEditando && (
                <button onClick={() => setActiveTab("produtos")} className="text-sm text-stone-500 hover:text-stone-800">Voltar</button>
              )}
            </div>

            <form key={produtoEditando ? produtoEditando.id : 'novo'} onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Nome do Produto</label>
                  <input name="name" type="text" defaultValue={produtoEditando?.name} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Linha</label>
                  <input name="line" type="text" defaultValue={produtoEditando?.line} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-stone-700">História da Vela (Storytelling)</label>
                  <textarea name="historia" rows={4} defaultValue={produtoEditando?.historia} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none resize-none" required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Notas Aromáticas</label>
                  <input name="notes" type="text" defaultValue={produtoEditando?.notes} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Sensação</label>
                  <input name="feeling" type="text" defaultValue={produtoEditando?.feeling} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                {/* Campos Físicos / Envio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Peso (Ex: 200g)</label>
                  <input name="weight" type="text" defaultValue={produtoEditando?.weight} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Duração (Ex: 40h)</label>
                  <input name="burnTime" type="text" defaultValue={produtoEditando?.burnTime} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="grid grid-cols-3 gap-3 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Altura (cm)</label>
                    <input name="altura" type="number" step="0.1" defaultValue={produtoEditando?.altura || 0} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Largura (cm)</label>
                    <input name="largura" type="number" step="0.1" defaultValue={produtoEditando?.largura || 0} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Comprimento (cm)</label>
                    <input name="comprimento" type="number" step="0.1" defaultValue={produtoEditando?.comprimento || 0} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Preço Venda (R$)</label>
                  <input name="price" type="number" step="0.01" defaultValue={produtoEditando?.price} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Estoque Físico</label>
                  <input name="estoque" type="number" defaultValue={produtoEditando?.estoque || 0} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Tag (Ex: Lançamento)</label>
                  <input name="tag" type="text" defaultValue={produtoEditando?.tag} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Cor da Tag (Tailwind)</label>
                  <input name="tagColor" type="text" defaultValue={produtoEditando?.tagColor} placeholder="bg-[#C87A2C]" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" />
                </div>

                <div className="space-y-4 md:col-span-2 pt-4 border-t border-stone-100">
                  <h3 className="text-lg font-medium text-stone-800">Galeria de Imagens</h3>
                  <p className="text-sm text-stone-500">A primeira imagem será a capa do produto. Arraste para reordenar.</p>
                  
                  {galeria.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {galeria.map((img, index) => (
                        <div key={img.id} className="relative group bg-stone-100 rounded-lg border border-stone-200 p-2 flex flex-col items-center">
                          <div className="w-full aspect-square relative rounded-md overflow-hidden mb-2">
                            <img src={img.url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            {index === 0 && <span className="absolute top-1 left-1 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">CAPA</span>}
                          </div>
                          <div className="flex items-center justify-between w-full px-1">
                            <button type="button" onClick={() => moverImagem(index, 'esq')} disabled={index === 0} className="p-1 text-stone-500 hover:text-amber-700 disabled:opacity-30"><ArrowLeft className="w-4 h-4" /></button>
                            <button type="button" onClick={() => removerImagem(img.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            <button type="button" onClick={() => moverImagem(index, 'dir')} disabled={index === galeria.length - 1} className="p-1 text-stone-500 hover:text-amber-700 disabled:opacity-30"><ArrowRight className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <label 
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${isHovering ? 'border-amber-500 bg-amber-50/50' : 'border-stone-300 bg-stone-50 hover:bg-stone-100'}`}
                    onDragEnter={() => setIsHovering(true)} onDragLeave={() => setIsHovering(false)} onDrop={handleImageDrop} onDragOver={(e) => e.preventDefault()}
                  >
                    <UploadCloud className={`w-10 h-10 mb-3 transition-colors ${isHovering ? 'text-amber-600' : 'text-stone-400'}`} />
                    <p className="text-sm font-medium text-stone-700">Adicionar imagens</p>
                    <input type="file" multiple accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={handleImageSelect} />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-100">
                <button type="submit" disabled={isLoading} className={`px-6 py-3 text-sm font-medium text-white rounded-lg flex items-center gap-2 outline-none disabled:opacity-70 ${isSuccess ? 'bg-green-600' : 'bg-amber-700 hover:bg-amber-800'}`}>
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : isSuccess ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}