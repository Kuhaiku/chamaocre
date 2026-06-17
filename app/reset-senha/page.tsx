'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Link de recuperação inválido ou ausente.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', token, novaSenha: senha })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setErrorMsg(data.error || 'Erro ao redefinir senha.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full p-8 bg-white border border-stone-200 rounded-sm shadow-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-stone-50 border border-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-[#C87A2C]" />
        </div>
        <h1 className="text-2xl font-heading text-stone-900">Nova Senha</h1>
        <p className="text-sm text-stone-500 mt-2">Crie uma nova senha segura para sua conta.</p>
      </div>

      {success ? (
        <div className="text-center animate-fade-in">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-stone-700 font-medium mb-2">Senha alterada com sucesso!</p>
          <p className="text-xs text-stone-500">Redirecionando para o início...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-xs border border-red-200 rounded-sm text-center">{errorMsg}</div>}
          
          <div>
            <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Nova Senha</label>
            <input 
              required minLength={6} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} disabled={!token}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none" 
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Confirmar Senha</label>
            <input 
              required minLength={6} type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} disabled={!token}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none" 
            />
          </div>

          <button disabled={isLoading || !token} className="w-full bg-[#C87A2C] hover:bg-[#E59400] disabled:bg-stone-300 text-white py-4 rounded-sm tracking-widest uppercase text-sm font-bold transition-all shadow-md mt-2 outline-none flex items-center justify-center gap-2">
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetSenhaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <Navbar forceSolid />
      <main className="flex-grow flex items-center justify-center px-4 pt-28 pb-20">
        <Suspense fallback={<div className="flex items-center gap-2 text-[#C87A2C]"><Loader2 className="animate-spin" /> Carregando...</div>}>
          <ResetForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}