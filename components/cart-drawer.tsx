'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export function CartDrawer() {
  const { isOpen, setIsOpen, items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  
  // Impede erros de hidratação (hydration mismatch) ao usar o localStorage
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const subtotal = getSubtotal();

  return (
    <>
      {/* Fundo Escuro (Overlay) */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Painel Lateral (Drawer) */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-lg font-heading text-stone-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Sua Sacola
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-stone-400 hover:text-stone-700 transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-4">
              <ShoppingBag className="w-12 h-12 opacity-20" />
              <p>Sua sacola está vazia.</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[#C87A2C] font-medium hover:underline outline-none"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-20 h-20 rounded-sm overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-stone-900 leading-tight">{item.name}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{item.weight}</p>
                    </div>
                    <p className="text-sm font-medium text-stone-900 whitespace-nowrap">
                      R$ {item.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    {/* Controles de Quantidade */}
                    <div className="flex items-center border border-stone-200 rounded-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-stone-500 hover:text-[#C87A2C] transition-colors outline-none"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium text-stone-700">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-stone-500 hover:text-[#C87A2C] transition-colors outline-none"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Botão Remover */}
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1 outline-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé / Checkout */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 p-6 bg-stone-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-stone-600 text-sm font-medium">Subtotal</span>
              <span className="text-xl font-heading font-medium text-stone-900">
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-6">
              Frete e impostos calculados no checkout.
            </p>
            <button className="w-full bg-[#C87A2C] hover:bg-[#E59400] text-white py-4 rounded-sm tracking-widest uppercase text-sm font-medium transition-all shadow-lg shadow-[#C87A2C]/20 outline-none">
              Avançar para Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}