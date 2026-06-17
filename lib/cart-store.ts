import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string | number
  name: string
  price: number
  image: string
  weight: string
  quantity: number
  estoque: number // Nova propriedade obrigatória
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

        if (existingItem) {
          // Trava: Soma a quantidade atual da sacola com a nova, mas limita ao estoque máximo
          const newQuantity = Math.min(existingItem.quantity + (item.quantity || 1), item.estoque)
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: newQuantity } : i
            ),
            isOpen: true,
          })
        } else {
          // Trava: Garante que a primeira adição não ultrapasse o estoque
          const initialQuantity = Math.min(item.quantity || 1, item.estoque)
          set({
            items: [...currentItems, { ...item, quantity: initialQuantity }],
            isOpen: true,
          })
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) => {
        const currentItems = get().items
        const itemToUpdate = currentItems.find((i) => i.id === id)
        if (!itemToUpdate) return

        // Trava: Impede de aumentar no botão de + além do estoque
        const validQuantity = Math.min(Math.max(1, quantity), itemToUpdate.estoque)
        
        set({
          items: currentItems.map((i) =>
            i.id === id ? { ...i, quantity: validQuantity } : i
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      setIsOpen: (isOpen) => set({ isOpen }),
      getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: 'chama-ocre-cart',
    }
  )
)