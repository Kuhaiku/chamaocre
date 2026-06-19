'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuthStore } from '@/lib/auth-store'

export function CartDrawer() {
  const router = useRouter()
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, getTotalPrice, clearCart, getTotalItems } = useCartStore()
  const { user, openLogin } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Auto-limpeza: Se houver algum item corrompido (NaN) do cache antigo, limpa a sacola.
    const hasCorruptedItems = items.some(item => Number.isNaN(Number(item.quantity)) || Number.isNaN(Number(item.price)))
    if (hasCorruptedItems) {
      clearCart()
    }
  }, [items, clearCart])

  if (!isMounted) return null

  const handleCheckout = () => {
    if (!user) {
      setIsOpen(false)
      openLogin()
    } else {
      setIsOpen(false)
      router.push('/checkout')
    }
  }

  // Fallbacks de segurança para garantir que nunca retorne NaN
  const safeTotalPrice = Number.isNaN(getTotalPrice()) ? 0 : getTotalPrice()
  const safeTotalItems = Number.isNaN(getTotalItems()) ? 0 : getTotalItems()

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-lg font-heading font-medium tracking-widest uppercase flex items-center gap-2 text-stone-900">
            <ShoppingBag size={18} /> Sua Sacola
          </h2>
          <button onClick={() => setIsOpen(false)} className="p-2 text-stone-400 hover:text-stone-700 transition-colors outline-none">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className="text-sm uppercase tracking-widest">Sua sacola está vazia</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => {
                // Garantindo que valores corrompidos sejam tratados como números válidos
                const qty = Number.isNaN(Number(item.quantity)) ? 1 : Number(item.quantity);
                const price = Number.isNaN(Number(item.price)) ? 0 : Number(item.price);
                const estoqueMax = Number(item.estoque) || 999; // Fallback se não tiver estoque

                return (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="relative w-20 h-24 bg-stone-100 rounded-sm overflow-hidden flex-shrink-0 border border-stone-200">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      )}
                    </div>
                    
                    <div className="flex flex-col flex-1 py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-heading text-stone-900 mb-1 line-clamp-1">{item.name}</h3>
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest">{item.weight}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-stone-400 hover:text-red-500 transition-colors outline-none">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-stone-200 rounded-sm h-8 bg-stone-50">
                          <button 
                            onClick={() => updateQuantity(item.id, qty - 1)}
                            className="px-2 text-stone-500 hover:text-[#C87A2C] transition-colors outline-none"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-medium text-stone-800">
                            {qty}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, qty + 1)}
                            disabled={qty >= estoqueMax}
                            className="px-2 text-stone-500 hover:text-[#C87A2C] transition-colors outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-medium text-stone-900">
                          R$ {(price * qty).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-stone-100 p-6 bg-stone-50">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-stone-600 uppercase tracking-widest">Subtotal ({safeTotalItems} itens)</span>
              <span className="text-xl font-heading text-stone-900">R$ {safeTotalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full bg-[#C87A2C] hover:bg-[#E59400] text-white py-4 rounded-sm tracking-widest uppercase text-sm font-bold transition-all shadow-md outline-none"
            >
              Avançar para Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}