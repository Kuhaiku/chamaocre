"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Loader2, Wind, Clock, Scale, Sparkles } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { useCartStore } from "@/lib/cart-store";

export default function ProdutoDetalhes(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const id = params.id;

  const [produto, setProduto] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imagemPrincipal, setImagemPrincipal] = useState<string>("");
  
  const [dominantRGB, setDominantRGB] = useState<string>("200, 122, 44");

  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProduto = async () => {
      try {
        const res = await fetch(`/api/produtos/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduto(data.produto);
          setImagemPrincipal(data.produto.image);
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do produto:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduto();
  }, [id]);

  const extractColor = (e: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const img = e.currentTarget;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let i = 0; i < data.length; i += 40) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      
      setDominantRGB(`${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)}`);
    } catch (err) {
      console.log("Erro ao ler cor (CORS). Mantendo cor padrão.");
    }
  };

  const handleAddToCart = () => {
    addItemToCart({
      id: produto.id,
      name: produto.name,
      price: Number(produto.price),
      image: produto.image,
      weight: produto.weight,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-[#C87A2C]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-medium tracking-widest uppercase">Carregando essência...</p>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <h1 className="text-3xl font-heading font-light mb-4">Produto não encontrado</h1>
        <Link href="/loja" className="text-[#C87A2C] hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para a loja
        </Link>
      </div>
    );
  }

  const todasImagens = [produto.image, ...(produto.galeria || [])];
  const imagensUnicas = Array.from(new Set(todasImagens));

  return (
    <div 
      className="min-h-screen font-sans text-stone-300 relative transition-colors duration-1000"
      style={{ 
        // CORREÇÃO: Separando backgroundImage e backgroundColor para evitar conflito no React
        backgroundImage: `linear-gradient(to bottom, rgba(${dominantRGB}, 0.25) 0%, #0a0a0a 60%)`,
        backgroundColor: '#0a0a0a'
      }}
    >
      <Navbar />

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20">
        
        <Link href="/loja" className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-stone-400 hover:text-white transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          <div className="space-y-6">
            <div 
              className="relative aspect-[4/5] w-full rounded-sm overflow-hidden bg-black/50 border shadow-2xl transition-colors duration-1000"
              style={{ borderColor: `rgba(${dominantRGB}, 0.3)`, boxShadow: `0 25px 50px -12px rgba(${dominantRGB}, 0.2)` }}
            >
              <img 
                src={imagemPrincipal} 
                crossOrigin="anonymous" 
                onLoad={extractColor} 
                className="hidden" 
                alt="Color extractor" 
              />
              
              {produto.tag && (
                <div 
                  className="absolute top-4 left-4 z-10 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-sm shadow-sm transition-colors duration-1000"
                  style={{ backgroundColor: `rgb(${dominantRGB})` }}
                >
                  {produto.tag}
                </div>
              )}
              <Image 
                src={imagemPrincipal} 
                alt={produto.name} 
                fill 
                className="object-cover transition-opacity duration-500" 
                priority
              />
            </div>

            {imagensUnicas.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {imagensUnicas.map((imgUrl, index) => (
                  <button 
                    key={index}
                    onClick={() => setImagemPrincipal(imgUrl as string)}
                    className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-sm overflow-hidden border transition-all duration-300"
                    style={{
                      borderColor: imagemPrincipal === imgUrl ? `rgb(${dominantRGB})` : 'transparent',
                      opacity: imagemPrincipal === imgUrl ? 1 : 0.4
                    }}
                  >
                    <Image src={imgUrl as string} alt={`Miniatura ${index}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col pt-4">
            <div className="flex items-center gap-3 mb-4">
              <span 
                className="text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-1000" 
                style={{ color: `rgb(${dominantRGB})` }}
              >
                {produto.line}
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            
            <h1 className="font-heading text-5xl md:text-6xl font-light text-white mb-6 leading-tight drop-shadow-sm">
              {produto.name}
            </h1>

            <div className="text-4xl font-heading font-light text-white mb-10 drop-shadow-sm">
              R$ {Number(produto.price).toFixed(2).replace('.', ',')}
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-4 py-8 border-y border-white/10 mb-10 bg-black/20 rounded-sm px-4">
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest mb-2">
                  <Wind size={14}/> Notas Aromáticas
                </span>
                <span className="text-sm font-medium text-stone-200">{produto.notes}</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest mb-2">
                  <Sparkles size={14}/> Sensação
                </span>
                <span className="text-sm font-medium text-stone-200">{produto.feeling}</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest mb-2">
                  <Clock size={14}/> Tempo de Queima
                </span>
                <span className="text-sm font-medium text-stone-200">{produto.burnTime}</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest mb-2">
                  <Scale size={14}/> Peso
                </span>
                <span className="text-sm font-medium text-stone-200">{produto.weight}</span>
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-sm tracking-widest uppercase text-white font-medium mb-4">A Experiência</h3>
              <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
                {produto.historia || "Uma essência pensada para transformar o seu ambiente e convidar à pausa."}
              </p>
            </div>

            <button 
              onClick={handleAddToCart}
              className="w-full text-white flex items-center justify-center gap-3 py-5 rounded-sm tracking-widest uppercase text-sm font-semibold transition-all duration-500 shadow-xl hover:-translate-y-1"
              style={{ 
                backgroundColor: `rgb(${dominantRGB})`,
                boxShadow: `0 15px 35px -10px rgba(${dominantRGB}, 0.6)`
              }}
            >
              <ShoppingBag size={18} />
              Adicionar à Sacola
            </button>
            
          </div>
        </div>
      </main>
    </div>
  );
}