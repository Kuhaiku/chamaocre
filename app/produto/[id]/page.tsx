"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  Star,
  Loader2,
  Leaf,
  Clock,
  Scale,
} from "lucide-react";

export default function ProdutoDetalhes(props: {
  params: Promise<{ id: string }>;
}) {
  // Desembrulhando os parâmetros da rota no Next.js App Router
  const params = use(props.params);
  const id = params.id;

  const [produto, setProduto] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imagemPrincipal, setImagemPrincipal] = useState<string>("");

  useEffect(() => {
    const fetchProduto = async () => {
      try {
        const res = await fetch(`/api/produtos/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduto(data.produto);
          setImagemPrincipal(data.produto.image); // Define a imagem de capa inicial
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do produto:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduto();
  }, [id]);

  const handleAddToCart = () => {
    // Aqui entrará a lógica do seu carrinho de compras futuramente
    alert(`${produto.name} adicionado ao carrinho!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#C87A2C] mb-4" />
        <p className="text-sm font-medium tracking-widest uppercase text-stone-500">
          Carregando essência...
        </p>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <h1 className="text-2xl font-heading text-stone-800 mb-4">
          Produto não encontrado
        </h1>
        <Link
          href="/"
          className="text-[#C87A2C] hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>
      </div>
    );
  }

  // Junta a imagem principal com a galeria extra para exibir nas miniaturas
  const todasImagens = [produto.image, ...(produto.galeria || [])];
  // Remove duplicadas caso a imagem principal também tenha sido salva na tabela de galeria
  const imagensUnicas = Array.from(new Set(todasImagens));

  return (
    <div className="min-h-screen bg-stone-50 pb-20 pt-28 font-sans text-stone-800">
      <div className="max-w-6xl mx-auto px-6">
        {/* Breadcrumb / Voltar */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#C87A2C] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Catálogo
        </Link>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* LADO ESQUERDO: Galeria de Imagens */}
          <div className="space-y-4">
            {/* Imagem Principal */}
            <div className="relative aspect-[4/5] md:aspect-square w-full rounded-sm overflow-hidden bg-white border border-stone-200">
              {produto.tag && (
                <div
                  className={`absolute top-4 left-4 z-10 ${produto.tagColor || "bg-stone-500"} text-white text-xs tracking-widest uppercase px-3 py-1 rounded-sm shadow-sm`}
                >
                  {produto.tag}
                </div>
              )}
              <Image
                src={imagemPrincipal}
                alt={produto.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Miniaturas da Galeria */}
            {imagensUnicas.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {imagensUnicas.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setImagemPrincipal(imgUrl as string)}
                    className={`relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-sm overflow-hidden border-2 transition-all ${imagemPrincipal === imgUrl ? "border-[#C87A2C] opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <Image
                      src={imgUrl as string}
                      alt={`Miniatura ${index}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LADO DIREITO: Informações do Produto */}
          <div className="flex flex-col">
            <span className="text-xs tracking-[0.2em] uppercase text-[#C87A2C] font-medium mb-3">
              {produto.line}
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-stone-900 mb-4">
              {produto.name}
            </h1>
             {/* Storytelling */}
            <div>
              <h3 className="text-lg font-heading text-stone-900 mb-4">
                A História da {produto.name}
              </h3>
              <div className="prose prose-stone text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">
                {produto.historia ||
                  "Uma essência pensada para transformar o seu ambiente."}
              </div>
                {/* Ficha Técnica Rápida */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 py-6 border-y border-stone-200 mb-10">
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-wider mb-1">
                  <Leaf size={14} /> Notas Aromáticas
                </span>
                <span className="text-sm font-medium text-stone-800">
                  {produto.notes}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-wider mb-1">
                  <Star size={14} /> Sensação
                </span>
                <span className="text-sm font-medium text-stone-800">
                  {produto.feeling}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-wider mb-1">
                  <Clock size={14} /> Queima
                </span>
                <span className="text-sm font-medium text-stone-800">
                  {produto.burnTime}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-wider mb-1">
                  <Scale size={14} /> Peso
                </span>
                <span className="text-sm font-medium text-stone-800">
                  {produto.weight}
                </span>
              </div>
            </div>

            </div>
            <div className="text-3xl font-heading font-light text-stone-900 mb-8">
              {produto.price}
            </div>

            {/* Botão de Carrinho */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#C87A2C] hover:bg-[#E59400] text-white flex items-center justify-center gap-3 py-4 rounded-sm tracking-widest uppercase text-sm font-medium transition-all shadow-lg shadow-[#C87A2C]/20 mb-10"
            >
              <ShoppingBag size={18} />
              Adicionar ao Carrinho
            </button>

          
           
          </div>
        </div>
      </div>
    </div>
  );
}
