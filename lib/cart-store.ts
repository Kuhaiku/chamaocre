import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  weight: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      setIsOpen: (isOpen) => set({ isOpen }),
      
      addItem: (newItem) => set((state) => {
        const existingItem = state.items.find((item) => item.id === newItem.id);
        
        if (existingItem) {
          return {
            items: state.items.map((item) =>
              item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
            isOpen: true,
          };
        }
        
        return { 
          items: [...state.items, { ...newItem, quantity: 1 }], 
          isOpen: true 
        };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),

      updateQuantity: (id, quantity) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter(item => item.id !== id) };
        }
        return {
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        };
      }),

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      
      // TRAVA DE SEGURANÇA: Number(item.price || 0) garante que o cálculo nunca falhe
      getSubtotal: () => get().items.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0),
    }),
    {
      name: 'chama-ocre-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);