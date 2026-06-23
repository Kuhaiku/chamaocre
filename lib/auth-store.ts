import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// CORREÇÃO AQUI: Adicionado o 'forgot_password'
type AuthView = 'login' | 'register' | 'forgot_password';

export interface User {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string; // <-- ADICIONADO AQUI PARA PARAR O ERRO DO TYPESCRIPT
}

interface AuthState {
  isOpen: boolean;
  view: AuthView;
  user: User | null; 
  
  setIsOpen: (isOpen: boolean) => void;
  setView: (view: AuthView) => void;
  openLogin: () => void;
  openRegister: () => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isOpen: false,
      view: 'login',
      user: null,
      
      setIsOpen: (isOpen) => set({ isOpen }),
      setView: (view) => set({ view }),
      openLogin: () => set({ isOpen: true, view: 'login' }),
      openRegister: () => set({ isOpen: true, view: 'register' }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'chama-ocre-auth', 
      partialize: (state) => ({ user: state.user }), 
    }
  )
);