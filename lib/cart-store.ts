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
  // Agora aceitamos a quantidade como parâmetro opcional
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
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
        // Pega a quantidade informada ou usa 1 por padrão
        const qtd = newItem.quantity || 1; 
        const existingItem = state.items.find((item) => item.id === newItem.id);
        
        if (existingItem) {
          return {
            items: state.items.map((item) =>
              item.id === newItem.id ? { ...item, quantity: item.quantity + qtd } : item
            ),
            isOpen: true,
          };
        }
        
        return { 
          items: [...state.items, { ...newItem, quantity: qtd }], 
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
      
      getSubtotal: () => get().items.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0),
    }),
    {
      name: 'chama-ocre-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);