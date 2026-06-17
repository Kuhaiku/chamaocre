import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthView = 'login' | 'register';

export interface User {
  id: number;
  nome: string;
  email: string;
  telefone: string;
}

interface AuthState {
  isOpen: boolean;
  view: AuthView;
  user: User | null; // Guarda os dados do cliente
  
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
      name: 'chama-ocre-auth', // Nome salvo no navegador
      partialize: (state) => ({ user: state.user }), // Salva apenas o usuário logado
    }
  )
);