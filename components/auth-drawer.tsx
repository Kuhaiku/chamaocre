'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, User, Mail, Lock, Phone, Loader2, LogOut, Package, ChevronRight, ArrowLeft, Edit2, Check, Copy, CheckCircle2, FileText } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { formatarCPF, limparNumeros } from '@/lib/utils';

const statusMap: Record<string, { label: string, color: string }> = {
  'aguardando_pagamento': { label: 'Aguardando Pagamento', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  'pago': { label: 'Pagamento Aprovado', color: 'bg-green-100 text-green-700 border-green-200' },
  'enviado': { label: 'Enviado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'cancelado': { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-200' }
};

export function AuthDrawer() {
  const router = useRouter();
  const { items } = useCartStore();
  const { isOpen, setIsOpen, view, setView, user, setUser, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  
  const [loggedView, setLoggedView] = useState<'menu' | 'orders' | 'edit_profile'>('menu');
  
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', cpf: '', senha: '' });
  const [editData, setEditData] = useState({ nome: '', telefone: '', cpf: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setLoggedView('menu');
        if (view === 'forgot_password') setView('login');
        setErrorMsg('');
        setSuccessMsg('');
      }, 300);
    }
    if (user) {
      setEditData({ nome: user.nome, telefone: user.telefone || '', cpf: formatarCPF(user.cpf || '') });
    }
  }, [isOpen, user, view, setView]);

  useEffect(() => {
    if (loggedView === 'orders' && user) {
      fetchOrders();
    }
  }, [loggedView, user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/pedidos?usuario_id=${user.id}`);
      const data = await res.json();
      if (res.ok) setOrders(data.pedidos || []);
    } catch (error) {
      console.error("Erro ao buscar pedidos");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCopiarRastreio = (codigo: string, pedidoId: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiadoId(pedidoId);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  if (!isMounted) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === 'cpf') value = formatarCPF(value);
    
    setFormData({ ...formData, [e.target.name]: value });
    setErrorMsg('');
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === 'cpf') value = formatarCPF(value);

    setEditData({ ...editData, [e.target.name]: value });
    setErrorMsg('');
  };

  const handleAction = async (e: React.FormEvent, action: string) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let bodyData = {};
      if (action === 'login') bodyData = { action, email: formData.email, senha: formData.senha };
      else if (action === 'register') bodyData = { action, ...formData, cpf: limparNumeros(formData.cpf) };
      else if (action === 'forgot_password') bodyData = { action, email: formData.email };
      else if (action === 'update_profile') bodyData = { action, id: user?.id, ...editData, cpf: limparNumeros(editData.cpf) };

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (action === 'login' || action === 'register') {
          setUser(data.user);
          setLoggedView('menu');
          if (items.length > 0) {
            setIsOpen(false);
            router.push('/checkout');
          }
        } else if (action === 'forgot_password') {
          setSuccessMsg(data.message);
        } else if (action === 'update_profile') {
          setUser({ ...user!, nome: data.user.nome, telefone: data.user.telefone, cpf: data.user.cpf });
          setLoggedView('menu');
        }
      } else {
        setErrorMsg(data.error || 'Erro na operação');
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
        
        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 z-20 text-stone-400 hover:text-[#C87A2C] transition-colors outline-none">
          <X className="w-5 h-5" />
        </button>

        {user ? (
          loggedView === 'menu' ? (
            <div className="flex flex-col h-full animate-fade-in pt-12">
              <div className="flex flex-col items-center justify-center pt-8 pb-8 bg-stone-50 border-b border-stone-100 px-6 relative">
                <button onClick={() => setLoggedView('edit_profile')} className="absolute top-4 right-4 text-stone-400 hover:text-[#C87A2C] flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold outline-none transition-colors">
                  <Edit2 size={12} /> Editar
                </button>
                <div className="w-20 h-20 bg-white border border-stone-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <User className="w-10 h-10 text-[#C87A2C]" />
                </div>
                <h3 className="font-heading text-xl text-stone-900">{user.nome}</h3>
                <p className="text-sm text-stone-500 mt-1">{user.email}</p>
                {user.telefone && <p className="text-xs text-stone-400 mt-1">{user.telefone}</p>}
                {user.cpf && <p className="text-xs text-stone-400 mt-1">CPF: {formatarCPF(user.cpf)}</p>}
              </div>

              <div className="flex-1 p-4 space-y-2">
                <button onClick={() => setLoggedView('orders')} className="w-full flex items-center justify-between p-4 rounded-sm hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100 outline-none">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-stone-100 rounded-sm text-stone-600"><Package className="w-5 h-5" /></div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-stone-900">Meus Pedidos</span>
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">Histórico e Rastreio</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300" />
                </button>
              </div>

              <div className="p-6 border-t border-stone-100">
                <button onClick={() => { logout(); setIsOpen(false); }} className="w-full flex items-center justify-center gap-2 py-4 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-sm text-xs font-bold tracking-widest uppercase transition-colors outline-none">
                  <LogOut size={16} /> Sair da Conta
                </button>
              </div>
            </div>

          ) : loggedView === 'edit_profile' ? (
            <div className="flex flex-col h-full animate-fade-in pt-12">
              <div className="flex items-center gap-3 p-6 border-b border-stone-100">
                <button onClick={() => setLoggedView('menu')} className="p-1 text-stone-400 hover:text-[#C87A2C] transition-colors outline-none"><ArrowLeft className="w-6 h-6" /></button>
                <h3 className="font-heading text-xl text-stone-900">Editar Dados</h3>
              </div>
              <form onSubmit={(e) => handleAction(e, 'update_profile')} className="flex-1 p-6 space-y-4">
                {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-xs border border-red-200 rounded-sm text-center">{errorMsg}</div>}
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input required type="text" name="nome" value={editData.nome} onChange={handleEditChange} className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">CPF</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input type="text" name="cpf" value={editData.cpf} onChange={handleEditChange} placeholder="000.000.000-00" maxLength={14} className="w-full pl-10 pr-3 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input type="tel" name="telefone" value={editData.telefone} onChange={handleEditChange} className="w-full pl-10 pr-3 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                </div>
                <button disabled={isLoading} className="w-full bg-[#C87A2C] hover:bg-[#E59400] disabled:bg-stone-300 text-white py-4 rounded-sm tracking-widest uppercase text-sm font-bold transition-all shadow-md mt-6 outline-none flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Salvar Alterações
                </button>
              </form>
            </div>

          ) : (
            <div className="flex flex-col h-full animate-fade-in pt-12">
              <div className="flex items-center gap-3 p-6 border-b border-stone-100 bg-white sticky top-0 z-10">
                <button onClick={() => setLoggedView('menu')} className="p-1 text-stone-400 hover:text-[#C87A2C] transition-colors outline-none"><ArrowLeft className="w-6 h-6" /></button>
                <h3 className="font-heading text-xl text-stone-900">Meus Pedidos</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50">
                {loadingOrders ? (
                  <div className="flex flex-col items-center justify-center h-full text-stone-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#C87A2C]" />
                    <p className="text-sm">Buscando seus pedidos...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <div className="w-20 h-20 bg-white border border-stone-200 rounded-full flex items-center justify-center mb-6"><Package className="w-10 h-10 text-stone-300" /></div>
                    <h3 className="text-lg font-heading text-stone-900 mb-2">Nenhum pedido ainda</h3>
                    <p className="text-sm text-stone-500 max-w-[250px]">Quando finalizar sua primeira compra, os detalhes aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((pedido) => {
                      const dataPedido = new Date(pedido.criado_em).toLocaleDateString('pt-BR');
                      const statusInfo = statusMap[pedido.status] || { label: pedido.status, color: 'bg-stone-100 text-stone-600 border-stone-200' };

                      return (
                        <div 
                          key={pedido.id} 
                          onClick={() => { setIsOpen(false); router.push(`/meus-pedidos/${pedido.id}`); }}
                          className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden cursor-pointer group hover:border-[#C87A2C] transition-all"
                        >
                          <div className="p-4 border-b border-stone-100 flex justify-between items-start bg-stone-50/50">
                            <div>
                              <span className="text-[10px] text-stone-500 uppercase tracking-widest block mb-1">Pedido #{pedido.id}</span>
                              <span className="text-sm font-medium text-stone-900">{dataPedido}</span>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                              <span className="flex items-center text-[10px] font-bold text-[#C87A2C] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                Ver detalhes <ChevronRight size={12} />
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-4 space-y-2">
                            {pedido.itens.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center text-sm">
                                <span className="text-stone-600 flex items-center gap-2">
                                  <span className="w-5 h-5 bg-stone-100 text-stone-500 flex items-center justify-center rounded-sm text-xs">{item.quantidade}x</span>
                                  <span className="line-clamp-1">{item.nome_produto}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
                            <span className="text-xs text-stone-500 uppercase tracking-widest">Total</span>
                            <span className="font-heading text-[#C87A2C]">R$ {Number(pedido.total).toFixed(2).replace('.', ',')}</span>
                          </div>

                          {pedido.codigo_rastreio && (
                            <div className="px-4 py-4 bg-[#C87A2C]/5 border-t border-[#C87A2C]/20 flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-[#C87A2C] uppercase tracking-widest font-bold mb-0.5">Rastreio</span>
                                  <span className="text-sm font-medium text-stone-900">{pedido.codigo_rastreio}</span>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleCopiarRastreio(pedido.codigo_rastreio, pedido.id); }}
                                  className="p-2 text-[#C87A2C] hover:bg-[#C87A2C]/10 rounded-sm transition-colors outline-none"
                                  title="Copiar código"
                                >
                                  {copiadoId === pedido.id ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                </button>
                              </div>
                              <a 
                                href={`https://melhorrastreio.com.br/rastreio/${pedido.codigo_rastreio}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-center py-2.5 bg-[#C87A2C] hover:bg-[#E59400] text-white text-[11px] font-bold tracking-widest uppercase rounded-sm transition-colors outline-none"
                              >
                                Acompanhar Entrega no Site
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col h-full">
            {view === 'forgot_password' ? (
              <div className="relative p-6 border-b border-stone-100 flex items-center gap-3 pt-12">
                 <button onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }} className="p-1 text-stone-400 hover:text-[#C87A2C] transition-colors outline-none"><ArrowLeft className="w-5 h-5" /></button>
                 <span className="font-heading text-lg text-stone-900 uppercase tracking-widest">Recuperar Senha</span>
              </div>
            ) : (
              <div className="relative p-6 border-b border-stone-100 flex flex-col pt-12">
                <div className="flex bg-stone-100 p-1 rounded-sm w-[90%] mx-auto">
                  <button onClick={() => { setView('login'); setErrorMsg(''); }} className={`flex-1 py-2.5 text-[11px] font-heading tracking-widest uppercase transition-all rounded-sm ${view === 'login' ? 'bg-white text-[#C87A2C] shadow-sm font-bold' : 'text-stone-500 hover:text-stone-800 font-medium'}`}>Entrar</button>
                  <button onClick={() => { setView('register'); setErrorMsg(''); }} className={`flex-1 py-2.5 text-[11px] font-heading tracking-widest uppercase transition-all rounded-sm ${view === 'register' ? 'bg-white text-[#C87A2C] shadow-sm font-bold' : 'text-stone-500 hover:text-stone-800 font-medium'}`}>Criar Conta</button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              {view === 'forgot_password' ? (
                 <form onSubmit={(e) => handleAction(e, 'forgot_password')} className="space-y-6 animate-fade-in">
                    <p className="text-sm text-stone-500 text-center mb-6">Digite seu e-mail e enviaremos um link para você redefinir sua senha.</p>
                    {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-xs border border-red-200 rounded-sm text-center">{errorMsg}</div>}
                    {successMsg && <div className="p-3 bg-green-50 text-green-700 text-xs border border-green-200 rounded-sm text-center">{successMsg}</div>}
                    <div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                        <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C87A2C] outline-none transition-colors" />
                      </div>
                    </div>
                    <button disabled={isLoading} className="w-full bg-[#C87A2C] hover:bg-[#E59400] disabled:bg-stone-300 text-white py-4 rounded-sm tracking-widest uppercase text-sm font-bold transition-all shadow-md outline-none flex items-center justify-center gap-2">
                      {isLoading && <Loader2 size={16} className="animate-spin" />}
                      {isLoading ? 'Enviando...' : 'Enviar Link'}
                    </button>
                 </form>
              ) : view === 'login' ? (
                <form onSubmit={(e) => handleAction(e, 'login')} className="space-y-6 animate-fade-in">
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
                        <span onClick={() => { setView('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }} className="text-[#C87A2C] cursor-pointer hover:underline normal-case tracking-normal text-[10px]">Esqueci a senha</span>
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
                <form onSubmit={(e) => handleAction(e, 'register')} className="space-y-6 animate-fade-in">
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
                      <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">CPF</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                        <input required type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" maxLength={14} className="w-full pl-10 pr-3 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C87A2C] outline-none transition-colors" />
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
        )}
      </div>
    </>
  );
}