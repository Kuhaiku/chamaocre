'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCartStore } from '@/lib/cart-store'
import { useAuthStore } from '@/lib/auth-store'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Loader2, CreditCard, ArrowLeft, Truck, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type OpcaoFrete = {
  id: number;
  nome: string;
  empresa: string;
  preco: number;
  prazo: number;
};

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, getTotalItems } = useCartStore()
  const { user } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)

  // Endereço
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState({ rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
  const [buscandoCep, setBuscandoCep] = useState(false)

  // Frete
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([])
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  const [freteSelecionado, setFreteSelecionado] = useState<OpcaoFrete | null>(null)

  useEffect(() => {
    setIsMounted(true)
    if (!user || items.length === 0) router.push('/loja')
  }, [user, items, router])

  if (!isMounted || !user || items.length === 0) return null

  const calcularFrete = async (cepDestino: string) => {
    setCalculandoFrete(true)
    setOpcoesFrete([])
    setFreteSelecionado(null)

    try {
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep_destino: cepDestino, items })
      });
      const data = await res.json();
      
      if (res.ok && data.fretes.length > 0) {
        setOpcoesFrete(data.fretes);
        setFreteSelecionado(data.fretes[0]); // Seleciona o mais barato por padrão
      }
    } catch (error) {
      console.error("Erro ao calcular frete");
    } finally {
      setCalculandoFrete(false);
    }
  }

  const buscarCEP = async (valorCep: string) => {
    const cepLimpo = valorCep.replace(/\D/g, '')
    setCep(valorCep)

    if (cepLimpo.length === 8) {
      setBuscandoCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        const data = await res.json()

        if (!data.erro) {
          setEndereco(prev => ({ ...prev, rua: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }))
          document.getElementById('numero')?.focus()
          
          // Assim que achar o CEP, dispara o cálculo de frete
          calcularFrete(cepLimpo)
        }
      } catch (error) {
        console.error("Erro ao buscar CEP")
      } finally {
        setBuscandoCep(false)
      }
    }
  }

  const handleEnderecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndereco({ ...endereco, [e.target.name]: e.target.value })
  }
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  const handleIrParaPagamento = async () => {
    setProcessandoPagamento(true);
    
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          items,
          subtotal: getTotalPrice(),
          frete: freteSelecionado ? freteSelecionado.preco : 0,
          total: getTotalPrice() + (freteSelecionado ? freteSelecionado.preco : 0),
          endereco: { ...endereco, cep },
          freteSelecionado
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        // Redireciona o cliente para a tela do Mercado Pago
        window.location.href = data.payment_url;
      } else {
        alert(data.error || 'Erro ao processar pagamento.');
        setProcessandoPagamento(false);
      }
    } catch (error) {
      console.error("Erro no checkout", error);
      alert('Erro de conexão. Tente novamente.');
      setProcessandoPagamento(false);
    }
  }

  const subtotal = getTotalPrice()
  const valorFrete = freteSelecionado ? freteSelecionado.preco : 0
  const total = subtotal + valorFrete

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <Navbar forceSolid />

      <main className="flex-grow pt-28 pb-20 max-w-6xl mx-auto w-full px-4 sm:px-6">
        <Link href="/loja" className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-stone-500 hover:text-[#C87A2C] transition-colors mb-8 outline-none">
          <ArrowLeft className="w-4 h-4" /> Voltar para a Loja
        </Link>

        <h1 className="text-3xl font-heading text-stone-900 mb-8">Finalizar Compra</h1>

        <div className="flex flex-col lg:flex-row gap-10">
          
          <div className="flex-1 space-y-8">
            <section className="bg-white p-6 md:p-8 border border-stone-200 rounded-sm shadow-sm">
              <h2 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#C87A2C] text-white flex items-center justify-center text-xs">1</span>
                Seus Dados
              </h2>
              <div className="flex flex-col gap-1">
                <span className="text-stone-900 font-medium">{user.nome}</span>
                <span className="text-stone-500 text-sm">{user.email}</span>
                <span className="text-stone-500 text-sm">{user.telefone}</span>
              </div>
            </section>

            <section className="bg-white p-6 md:p-8 border border-stone-200 rounded-sm shadow-sm">
              <h2 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#C87A2C] text-white flex items-center justify-center text-xs">2</span>
                Endereço de Entrega
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 relative">
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">CEP</label>
                  <input type="text" value={cep} onChange={(e) => buscarCEP(e.target.value)} placeholder="00000-000" maxLength={9} className="w-full md:w-1/2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                  {buscandoCep && <Loader2 className="absolute left-[45%] top-[38px] w-4 h-4 animate-spin text-[#C87A2C]" />}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Rua / Avenida</label>
                  <input type="text" name="rua" value={endereco.rua} onChange={handleEnderecoChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Número</label>
                  <input type="text" id="numero" name="numero" value={endereco.numero} onChange={handleEnderecoChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Complemento <span className="text-stone-400 normal-case tracking-normal">(opcional)</span></label>
                  <input type="text" name="complemento" value={endereco.complemento} onChange={handleEnderecoChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Bairro</label>
                  <input type="text" name="bairro" value={endereco.bairro} onChange={handleEnderecoChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Cidade</label>
                  <input type="text" name="cidade" value={endereco.cidade} onChange={handleEnderecoChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Estado (UF)</label>
                  <input type="text" name="estado" value={endereco.estado} onChange={handleEnderecoChange} maxLength={2} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors uppercase" />
                </div>
              </div>
            </section>

            {/* SEÇÃO DE FRETE DINÂMICO */}
            <section className="bg-white p-6 md:p-8 border border-stone-200 rounded-sm shadow-sm">
              <h2 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#C87A2C] text-white flex items-center justify-center text-xs">3</span>
                Opções de Entrega
              </h2>

              {calculandoFrete ? (
                <div className="flex flex-col items-center justify-center py-8 text-stone-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C87A2C]" />
                  <p className="text-sm animate-pulse">Calculando as melhores opções...</p>
                </div>
              ) : opcoesFrete.length > 0 ? (
                <div className="space-y-3">
                  {opcoesFrete.map((frete) => (
                    <label 
                      key={frete.id} 
                      className={`flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-colors ${
                        freteSelecionado?.id === frete.id 
                          ? 'border-[#C87A2C] bg-[#C87A2C]/5' 
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${freteSelecionado?.id === frete.id ? 'border-[#C87A2C]' : 'border-stone-300'}`}>
                          {freteSelecionado?.id === frete.id && <div className="w-2.5 h-2.5 rounded-full bg-[#C87A2C]" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-stone-900 flex items-center gap-2">
                            {frete.empresa} {frete.nome}
                          </span>
                          <span className="text-xs text-stone-500">Entrega em até {frete.prazo} dias úteis</span>
                        </div>
                      </div>
                      <span className="font-heading text-stone-900">
                        R$ {frete.preco.toFixed(2).replace('.', ',')}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-stone-400 gap-3 text-center">
                  <Truck className="w-10 h-10 opacity-50" />
                  <p className="text-sm">Preencha o CEP de destino acima para visualizar as opções de entrega.</p>
                </div>
              )}
            </section>

          </div>

          <aside className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white p-6 border border-stone-200 rounded-sm shadow-sm sticky top-32">
              <h2 className="text-lg font-heading text-stone-900 mb-6">Resumo do Pedido</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 bg-stone-100 rounded-sm overflow-hidden flex-shrink-0 border border-stone-200">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-sm font-medium text-stone-900 line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-stone-500">Qtd: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-stone-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Subtotal ({getTotalItems()} itens)</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Frete</span>
                  {freteSelecionado ? (
                    <span>R$ {freteSelecionado.preco.toFixed(2).replace('.', ',')}</span>
                  ) : (
                    <span className="text-stone-400 italic">A calcular</span>
                  )}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                  <span className="font-bold text-stone-900 uppercase tracking-widest text-sm">Total</span>
                  <span className="text-xl font-heading text-[#C87A2C]">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

             <button 
                onClick={handleIrParaPagamento}
                disabled={!freteSelecionado || !endereco.numero || processandoPagamento}
                className="w-full bg-[#C87A2C] hover:bg-[#E59400] disabled:bg-stone-300 disabled:cursor-not-allowed text-white py-4 rounded-sm tracking-widest uppercase text-sm font-bold transition-all shadow-md outline-none flex items-center justify-center gap-2"
              >
                {processandoPagamento ? (
                  <><Loader2 size={18} className="animate-spin" /> Processando...</>
                ) : (
                  <><CreditCard size={18} /> Ir para o Pagamento</>
                )}
              </button>
            </div>
          </aside>

        </div>
      </main>
      <Footer />
    </div>
  )
}