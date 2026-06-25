import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string | number
  name: string
  price: number
  image: string
  quantity: number
  estoque: number
  peso_comercial?: string;
  weight?: string | number;
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string | number) => void
  updateQuantity: (id: string | number, quantity: number) => void
  clearCart: () => void
  setIsOpen: (isOpen: boolean) => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (item) => {
        const currentItems = get().items
        const existingItem = currentItems.find((i) => i.id === item.id)

        const safeEstoque = Number(item.estoque) || 999;
        const safeQuantity = Number(item.quantity) || 1;
        
        let safePrice = item.price;
        if (typeof safePrice === 'string') {
          safePrice = Number((safePrice as string).replace(',', '.'));
        }
        safePrice = Number(safePrice) || 0;

        if (existingItem) {
          const currentQty = Number(existingItem.quantity) || 0;
          const newQuantity = Math.min(currentQty + safeQuantity, safeEstoque);
          
          set({
            items: currentItems.map((i) =>
              i.id === item.id 
                ? { ...i, quantity: newQuantity, price: safePrice, estoque: safeEstoque } 
                : i
            ),
            // A linha isOpen foi removida para não abrir a sacola
          })
        } else {
          const initialQuantity = Math.min(safeQuantity, safeEstoque);
          set({
            items: [...currentItems, { 
              ...item, 
              quantity: initialQuantity, 
              price: safePrice, 
              estoque: safeEstoque 
            }],
            // A linha isOpen foi removida para não abrir a sacola
          })
        }
      },
      
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      
      updateQuantity: (id, quantity) => {
        const currentItems = get().items
        const itemToUpdate = currentItems.find((i) => i.id === id)
        if (!itemToUpdate) return

        const safeEstoque = Number(itemToUpdate.estoque) || 999;
        const safeRequestedQty = Number(quantity) || 1;
        
        const validQuantity = Math.min(Math.max(1, safeRequestedQty), safeEstoque)
        
        set({
          items: currentItems.map((i) =>
            i.id === id ? { ...i, quantity: validQuantity } : i
          ),
        })
      },
      
      clearCart: () => set({ items: [] }),
      setIsOpen: (isOpen) => set({ isOpen }),
      
      getTotalPrice: () => {
        const total = get().items.reduce((total, item) => {
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity) || 0;
          return total + (price * qty);
        }, 0);
        return Number.isNaN(total) ? 0 : total;
      },
      
      getTotalItems: () => {
        const total = get().items.reduce((total, item) => {
          const qty = Number(item.quantity) || 0;
          return total + qty;
        }, 0);
        return Number.isNaN(total) ? 0 : total;
      },
    }),
    {
      name: 'chama-ocre-cart',
    }
  )
)