import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  weight: string; // Importante manter o peso para o cálculo do Melhor Envio no checkout
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean; // Controla se o painel lateral da sacola está aberto ou fechado
  
  // Ações
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  
  // Cálculos
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
          // Se o produto já está na sacola, apenas aumenta a quantidade
          return {
            items: state.items.map((item) =>
              item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
            isOpen: true, // Abre a sacola automaticamente ao adicionar
          };
        }
        
        // Se for um produto novo, adiciona com quantidade 1
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
          // Se a quantidade chegar a zero, remove o item
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
      
      getSubtotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
    }),
    {
      name: 'chama-ocre-cart', // Nome da chave que ficará salva no LocalStorage do navegador
      partialize: (state) => ({ items: state.items }), // Salva apenas os itens, ignorando se a sacola está aberta ou não
    }
  )
);