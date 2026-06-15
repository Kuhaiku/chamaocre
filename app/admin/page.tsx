"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  UploadCloud, 
  CheckCircle2,
  Loader2,
  Trash2,
  Edit
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("produtos");
  
  const [isHovering, setIsHovering] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagemFile, setImagemFile] = useState<File | null>(null);

  const [produtos, setProdutos] = useState<any[]>([]);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);

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
    if (activeTab === "produtos") {
      fetchProdutos();
    }
  }, [activeTab]);

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImagemFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagemFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imagemFile) return alert('Selecione uma imagem.');

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('image', imagemFile); // Chave ajustada para 'image'

    try {
      const res = await fetch('/api/produtos', { method: 'POST', body: formData });
      if (res.ok) {
        setIsSuccess(true);
        setImagemFile(null);
        (e.target as HTMLFormElement).reset();
        setTimeout(() => {
          setIsSuccess(false);
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
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800">Painel Admin</h2>
          <p className="text-xs text-stone-500 mt-1">Chama Ocre</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab("visao-geral")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "visao-geral" ? "bg-amber-50 text-amber-700" : "text-stone-600 hover:bg-stone-50"}`}>
            <LayoutDashboard className="w-5 h-5" /> Visão Geral
          </button>
          <button onClick={() => setActiveTab("produtos")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "produtos" ? "bg-amber-50 text-amber-700" : "text-stone-600 hover:bg-stone-50"}`}>
            <Package className="w-5 h-5" /> Meus Produtos
          </button>
          <button onClick={() => setActiveTab("novo-produto")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "novo-produto" ? "bg-amber-50 text-amber-700" : "text-stone-600 hover:bg-stone-50"}`}>
            <PlusCircle className="w-5 h-5" /> Novo Produto
          </button>
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {activeTab === "visao-geral" && (
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">Visão Geral</h1>
            <p className="text-stone-500 mt-2">Métricas e informações em breve.</p>
          </div>
        )}

        {/* LISTAGEM DE PRODUTOS (Vindo do Banco) */}
        {activeTab === "produtos" && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-stone-800">Meus Produtos</h1>
              </div>
              <button onClick={() => setActiveTab('novo-produto')} className="bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-800 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Cadastrar
              </button>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-sm text-stone-500">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">Linha</th>
                    <th className="p-4 font-medium">Preço</th>
                    <th className="p-4 font-medium">Tag</th>
                    <th className="p-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoadingProdutos ? (
                    <tr><td colSpan={5} className="p-8 text-center text-stone-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Carregando...</td></tr>
                  ) : produtos.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-stone-500">Nenhum produto cadastrado.</td></tr>
                  ) : (
                    produtos.map((prod) => (
                      <tr key={prod.id} className="hover:bg-stone-50/50">
                        <td className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">{prod.name}</p>
                            <p className="text-xs text-stone-500">{prod.weight} | {prod.burnTime}</p>
                          </div>
                        </td>
                        <td className="p-4 text-stone-600 text-sm">{prod.line}</td>
                        <td className="p-4 text-stone-600 font-medium">{prod.price}</td>
                        <td className="p-4">
                          {prod.tag && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${prod.tagColor}`}>
                              {prod.tag}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CADASTRO DE PRODUTO */}
        {activeTab === "novo-produto" && (
          <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <h1 className="text-2xl font-semibold text-stone-800">Cadastrar Novo Produto</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-stone-700">Nome do Produto</label>
                  <input id="name" name="name" type="text" placeholder="Ex: Vela Relaxante" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="line" className="text-sm font-medium text-stone-700">Linha</label>
                  <input id="line" name="line" type="text" placeholder="Ex: Aconchego" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="notes" className="text-sm font-medium text-stone-700">Notas (Aromas)</label>
                  <input id="notes" name="notes" type="text" placeholder="Ex: Maçã Assada, Canela e Baunilha" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="feeling" className="text-sm font-medium text-stone-700">Sensação</label>
                  <input id="feeling" name="feeling" type="text" placeholder="Ex: Calor, proteção e conforto" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="burnTime" className="text-sm font-medium text-stone-700">Duração</label>
                  <input id="burnTime" name="burnTime" type="text" placeholder="Ex: 40h" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="weight" className="text-sm font-medium text-stone-700">Peso</label>
                  <input id="weight" name="weight" type="text" placeholder="Ex: 200g" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium text-stone-700">Preço</label>
                  <input id="price" name="price" type="text" placeholder="Ex: R$ 89,90" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tag" className="text-sm font-medium text-stone-700">Tag (Opcional)</label>
                  <input id="tag" name="tag" type="text" placeholder="Ex: Mais Vendida" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="tagColor" className="text-sm font-medium text-stone-700">Cor da Tag (Classes Tailwind, Opcional)</label>
                  <input id="tagColor" name="tagColor" type="text" placeholder="Ex: bg-[#C87A2C]" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 outline-none" />
                </div>

                {/* Upload de Imagem */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-stone-700">Imagem do Produto</label>
                  <label 
                    htmlFor="imagem-upload"
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${isHovering ? 'border-amber-500 bg-amber-50/50' : 'border-stone-300 bg-stone-50 hover:bg-stone-100'}`}
                    onDragEnter={() => setIsHovering(true)} onDragLeave={() => setIsHovering(false)} onDrop={handleImageDrop} onDragOver={(e) => e.preventDefault()}
                  >
                    <UploadCloud className={`w-10 h-10 mb-3 transition-colors ${imagemFile ? 'text-green-600' : 'text-stone-400'}`} />
                    {imagemFile ? <p className="text-sm font-medium text-green-700">{imagemFile.name}</p> : <><p className="text-sm font-medium text-stone-700">Clique ou arraste a imagem</p><p className="text-xs text-stone-500 mt-1">PNG ou JPG até 5MB</p></>}
                    <input id="imagem-upload" type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={handleImageSelect} />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button type="button" onClick={() => { setImagemFile(null); (document.querySelector('form') as HTMLFormElement).reset(); }} className="px-5 py-2.5 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 outline-none">
                  Limpar
                </button>
                <button type="submit" disabled={isLoading} className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg flex items-center gap-2 outline-none transition-colors ${isSuccess ? 'bg-green-600' : 'bg-amber-700 hover:bg-amber-800'}`}>
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