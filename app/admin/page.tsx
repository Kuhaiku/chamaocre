"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  UploadCloud, 
  CheckCircle2 
} from "lucide-react";

export default function AdminDashboard() {
  // Controle de qual aba do admin está ativa
  const [activeTab, setActiveTab] = useState("novo-produto");
  
  // Estados do formulário
  const [isHovering, setIsHovering] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans">
      
      {/* Sidebar (Barra Lateral) */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800">Painel Admin</h2>
          <p className="text-xs text-stone-500 mt-1">Chama Ocre</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("visao-geral")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "visao-geral" 
                ? "bg-amber-50 text-amber-700" 
                : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Visão Geral
          </button>

          <button 
            onClick={() => setActiveTab("produtos")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "produtos" 
                ? "bg-amber-50 text-amber-700" 
                : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
            }`}
          >
            <Package className="w-5 h-5" />
            Meus Produtos
          </button>

          <button 
            onClick={() => setActiveTab("novo-produto")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "novo-produto" 
                ? "bg-amber-50 text-amber-700" 
                : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            Novo Produto
          </button>
        </nav>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Renderização Condicional: Visão Geral */}
        {activeTab === "visao-geral" && (
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">Visão Geral</h1>
            <p className="text-stone-500 mt-2">Em breve: gráficos e estatísticas da loja.</p>
          </div>
        )}

        {/* Renderização Condicional: Lista de Produtos */}
        {activeTab === "produtos" && (
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">Meus Produtos</h1>
            <p className="text-stone-500 mt-2">Em breve: lista de produtos cadastrados.</p>
          </div>
        )}

        {/* Renderização Condicional: Cadastro de Produto */}
        {activeTab === "novo-produto" && (
          <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <h1 className="text-2xl font-semibold text-stone-800">Cadastrar Novo Produto</h1>
              <p className="text-sm text-stone-500 mt-1">
                Adicione uma nova vela ao catálogo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="nome" className="text-sm font-medium text-stone-700">Nome da Vela</label>
                  <input 
                    id="nome" type="text" placeholder="Ex: Vela Bosque" 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="preco" className="text-sm font-medium text-stone-700">Preço (R$)</label>
                  <input 
                    id="preco" type="number" step="0.01" placeholder="0,00" 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="estoque" className="text-sm font-medium text-stone-700">Estoque Inicial</label>
                  <input 
                    id="estoque" type="number" placeholder="0" 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="descricao" className="text-sm font-medium text-stone-700">Descrição Aromática</label>
                  <textarea 
                    id="descricao" rows={4} placeholder="Descreva as notas aromáticas..." 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition-all resize-none"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-stone-700">Imagem do Produto</label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 
                      ${isHovering ? 'border-amber-500 bg-amber-50/50' : 'border-stone-300 bg-stone-50 hover:bg-stone-100'}`}
                    onDragEnter={() => setIsHovering(true)}
                    onDragLeave={() => setIsHovering(false)}
                    onDrop={(e) => { e.preventDefault(); setIsHovering(false); }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <UploadCloud className={`w-10 h-10 mb-3 transition-colors ${isHovering ? 'text-amber-600' : 'text-stone-400'}`} />
                    <p className="text-sm font-medium text-stone-700">Clique para fazer upload ou arraste a imagem</p>
                    <p className="text-xs text-stone-500 mt-1">PNG ou JPG até 5MB</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button type="button" className="px-5 py-2.5 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-all outline-none">
                  Cancelar
                </button>
                <button type="submit" className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-all outline-none ${isSuccess ? 'bg-green-600' : 'bg-amber-700 hover:bg-amber-800'}`}>
                  {isSuccess ? <><CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!</> : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}