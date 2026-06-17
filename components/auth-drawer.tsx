'use client';

import { useEffect, useState } from 'react';
import { X, User, Mail, Lock, Phone, Loader2, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export function AuthDrawer() {
  const { isOpen, setIsOpen, view, setView, user, setUser, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', senha: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: formData.email, senha: formData.senha })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setIsOpen(false);
      } else {
        setErrorMsg(data.error || 'Erro ao entrar');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...formData })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setIsOpen(false);
      } else {
        setErrorMsg(data.error || 'Erro ao criar conta');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="relative p-6 border-b border-stone-100 flex flex-col pt-8">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-[#C87A2C] transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          {!user && (
            <div className="flex bg-stone-100 p-1 rounded-sm w-[85%] mx-auto mt-4">
              <button 
                onClick={() => { setView('login'); setErrorMsg(''); }}
                className={`flex-1 py-2.5 text-[11px] font-heading tracking-widest uppercase transition-all rounded-sm ${view === 'login' ? 'bg-white text-[#C87A2C] shadow-sm font-bold' : 'text-stone-500 hover:text-stone-800 font-medium'}`}
              >
                Entrar
              </button>
              <button 
                onClick={() => { setView('register'); setErrorMsg(''); }}
                className={`flex-1 py-2.5 text-[11px] font-heading tracking-widest uppercase transition-all rounded-sm ${view === 'register' ? 'bg-white text-[#C87A2C] shadow-sm font-bold' : 'text-stone-500 hover:text-stone-800 font-medium'}`}
              >
                Criar Conta
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {user ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in text-center">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200">
                <User className="w-10 h-10 text-[#C87A2C]" />
              </div>
              <div>
                <h2 className="text-2xl font-heading text-stone-900">Olá, {user.nome.split(' ')[0]}</h2>
                <p className="text-sm text-stone-500 mt-1">{user.email}</p>
              </div>
              <button 
                onClick={() => { logout(); setIsOpen(false); }}
                className="flex items-center gap-2 px-6 py-3 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-sm text-xs font-bold tracking-widest uppercase transition-colors outline-none mt-8"
              >
                <LogOut size={16} /> Sair da Conta
              </button>
            </div>
          ) : view === 'login' ? (
            
            <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <User className="w-10 h-10 mx-auto text-[#C87A2C] mb-3 opacity-80" />
                <h2 className="text-xl font-heading text-stone-900">Bem-vindo de volta</h2>
              </div>

              {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-xs border border-red-200 rounded-sm text-center">{errorMsg}</div>}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="flex justify-between items-center text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5">
                    <span>Senha</span>
                    <span className="text-[#C87A2C] cursor-pointer hover:underline normal-case tracking-normal text-[10px]">Esqueci a senha</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input required type="password" name="senha" value={formData.senha} onChange={handleInputChange} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                </div>
              </div>

              <button disabled={isLoading} className="w-full bg-[#C87A2C] hover:bg-[#E59400] disabled:bg-stone-300 text-white py-4 rounded-sm tracking-widest uppercase text-sm font-bold transition-all shadow-md mt-6 outline-none flex items-center justify-center gap-2">
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            
            <form onSubmit={handleRegister} className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-xl font-heading text-stone-900">Nova Conta</h2>
              </div>

              {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-xs border border-red-200 rounded-sm text-center">{errorMsg}</div>}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input required type="text" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Como devemos te chamar?" className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" className="w-full pl-10 pr-3 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input required minLength={6} type="password" name="senha" value={formData.senha} onChange={handleInputChange} placeholder="Mínimo 6 caracteres" className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                </div>
              </div>

              <button disabled={isLoading} className="w-full bg-[#C87A2C] hover:bg-[#E59400] disabled:bg-stone-300 text-white py-4 rounded-sm tracking-widest uppercase text-sm font-bold transition-all shadow-md mt-6 outline-none flex items-center justify-center gap-2">
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Criando Conta...' : 'Criar Conta'}
              </button>
            </form>
          )}

        </div>
      </div>
    </>
  );
}