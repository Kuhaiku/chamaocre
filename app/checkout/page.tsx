'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCartStore } from '@/lib/cart-store'
import { useAuthStore } from '@/lib/auth-store'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Loader2, ArrowLeft, Truck, CheckCircle2, Copy } from 'lucide-react'
import Link from 'next/link'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { formatarCPF, limparNumeros } from '@/lib/utils'

const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
if (publicKey) {
  initMercadoPago(publicKey, { locale: 'pt-BR' });
} else {
  console.error("Chave Pública do Mercado Pago não encontrada no .env");
}

type OpcaoFrete = { id: number; nome: string; empresa: string; nomeCompleto: string; preco: number; prazo: number; };

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)

  const [cpf, setCpf] = useState('')
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState({ rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([])
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  const [freteSelecionado, setFreteSelecionado] = useState<OpcaoFrete | null>(null)

  const [pedidoFinalizado, setPedidoFinalizado] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null) // NOVO: Guarda o ID para verificar o status
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    if (user?.cpf && !cpf) {
      setCpf(formatarCPF(user.cpf))
    }
    
    if (!user || (items.length === 0 && !pedidoFinalizado)) {
      router.push('/loja')
    }
  }, [user, items, router, pedidoFinalizado, cpf])

// --- A MÁGICA DO REDIRECIONAMENTO (POLLING) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Se for PIX (tem pixData), fica checando o banco a cada 3 segundos
    if (pedidoFinalizado && pixData && paymentId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/pedidos/status?mp_payment_id=${paymentId}`);
          const data = await res.json();
          if (data.status === 'pago') {
            clearInterval(interval);
            // Agora ele joga direto pra página ESPECÍFICA do pedido!
            router.push(`/meus-pedidos/${data.id}`); 
          }
        } catch (err) { console.error(err) }
      }, 3000);
    }

    // Se for Cartão (Aprova direto na hora), ele busca o ID do pedido e redireciona
    if (pedidoFinalizado && !pixData && paymentId) {
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/pedidos/status?mp_payment_id=${paymentId}`);
          const data = await res.json();
          if (data.id) {
            router.push(`/meus-pedidos/${data.id}`);
          } else {
            router.push('/meus-pedidos'); // fallback de segurança
          }
        } catch (err) {
          router.push('/meus-pedidos');
        }
      }, 4000);
    }

    return () => clearInterval(interval);
  }, [pedidoFinalizado, pixData, paymentId, router]);

  // --- ROLAGEM AUTOMÁTICA PARA O TOPO (PIX GERADO) ---
  // ✅ AGORA SIM: DO LADO DE FORA, SEPARADO E SEGURO
  useEffect(() => {
    if (pedidoFinalizado) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pedidoFinalizado]);
  // ----------------------------------------------
  if (!isMounted || !user || (items.length === 0 && !pedidoFinalizado)) return null

  const calcularFrete = async (cepDestino: string) => {
    setCalculandoFrete(true)
    setOpcoesFrete([])
    setFreteSelecionado(null)

    try {
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep_destino: cepDestino, items })
      })
      const data = await res.json()
      if (res.ok && data.fretes.length > 0) {
        setOpcoesFrete(data.fretes)
        setFreteSelecionado(data.fretes[0])
      }
    } catch (error) {
      console.error("Erro ao calcular frete")
    } finally {
      setCalculandoFrete(false)
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

  const subtotal = getTotalPrice()
  const valorFrete = freteSelecionado ? freteSelecionado.preco : 0
  const total = subtotal + valorFrete

  const onSubmitPayment = async (param: any) => {
    const formData = param.formData;

    return new Promise<void>((resolve, reject) => {
      fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          cpf: limparNumeros(cpf),
          transportadora_nome: freteSelecionado?.nomeCompleto || `${freteSelecionado?.empresa} ${freteSelecionado?.nome}`,
          transportadora_servico_id: freteSelecionado?.id,
          items, 
          subtotal, 
          frete: valorFrete, 
          total,
          endereco: { ...endereco, cep },
          formData 
        })
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          if (data.payment_method === 'pix') {
            setPixData({ qr_code: data.qr_code, qr_code_base64: data.qr_code_base64 })
          }
          setPaymentId(data.payment_id) // CAPTURA O ID DA VENDA PARA O POLLING ESPIONAR
          setPedidoFinalizado(true)
          clearCart()
          resolve()
        } else {
          alert(data.error || 'Não foi possível processar o pagamento. Verifique os dados.')
          reject()
        }
      })
      .catch(() => {
        alert('Erro de conexão. Tente novamente.')
        reject()
      })
    })
  }

  if (pedidoFinalizado) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
        <Navbar forceSolid />
        <main className="flex-grow flex items-center justify-center pt-28 pb-20 px-4 max-w-3xl mx-auto w-full">
          <div className="bg-white p-10 border border-stone-200 rounded-sm shadow-sm text-center w-full animate-fade-in">
            {pixData ? (
              <div className="space-y-6">
                <h1 className="text-2xl font-heading text-stone-900">Pagamento via PIX</h1>
                <p className="text-sm text-stone-500">Escaneie o QR Code abaixo no seu aplicativo do banco.</p>
                
                <div className="flex justify-center p-4 bg-stone-50 rounded-sm inline-block mx-auto border border-stone-100">
                  <Image src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" width={250} height={250} />
                </div>
                
                <div className="flex items-center gap-2 max-w-md mx-auto relative">
                  <input type="text" value={pixData.qr_code} readOnly className="w-full bg-stone-100 text-xs text-stone-600 p-4 pr-12 rounded-sm border border-stone-200 outline-none" />
                  <button 
                    onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
                    className="absolute right-2 top-2 p-2 text-stone-500 hover:text-[#C87A2C] transition-colors"
                    title="Copiar código"
                  >
                    {copiado ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>

                {/* Loader Dinâmico Avisando que o site tá escutando o banco */}
                <div className="flex items-center justify-center gap-2 mt-8 text-[#C87A2C] bg-[#C87A2C]/10 py-3 px-4 rounded-sm max-w-xs mx-auto">
                   <Loader2 size={16} className="animate-spin" />
                   <span className="text-[10px] font-bold tracking-widest uppercase">Aguardando Pagamento...</span>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
                <h1 className="text-3xl font-heading text-stone-900">Pedido Confirmado!</h1>
                <p className="text-stone-500">Seu pagamento com cartão foi aprovado com sucesso.</p>
                <div className="flex justify-center mt-6 text-[#C87A2C]">
                   <Loader2 size={24} className="animate-spin" />
                </div>
                <p className="text-xs text-stone-400 mt-2">Redirecionando...</p>
              </div>
            )}
            
          </div>
        </main>
        <Footer />
      </div>
    )
  }

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
                Dados e Endereço de Entrega
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">CPF (Obrigatório para o envio)</label>
                  <input type="text" value={cpf} onChange={(e) => setCpf(formatarCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} className="w-full md:w-1/2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                </div>

                <div className="md:col-span-2 relative mt-2">
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
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Complemento</label>
                  <input type="text" name="complemento" value={endereco.complemento} onChange={handleEnderecoChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                </div>
                <div className="md:col-span-2 flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">Bairro</label>
                    <input type="text" name="bairro" value={endereco.bairro} onChange={handleEnderecoChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors" />
                  </div>
                  <div className="w-20">
                    <label className="text-xs font-medium text-stone-700 uppercase tracking-widest mb-1.5 block">UF</label>
                    <input type="text" name="estado" value={endereco.estado} onChange={handleEnderecoChange} maxLength={2} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-sm text-sm text-stone-900 focus:border-[#C87A2C] outline-none transition-colors uppercase" />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 md:p-8 border border-stone-200 rounded-sm shadow-sm">
              <h2 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#C87A2C] text-white flex items-center justify-center text-xs">2</span>
                Opções de Entrega
              </h2>

              {calculandoFrete ? (
                <div className="flex flex-col items-center justify-center py-8 text-stone-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C87A2C]" />
                </div>
              ) : opcoesFrete.length > 0 ? (
                <div className="space-y-3">
                  {opcoesFrete.map((frete) => (
                    <label 
                      key={frete.id} 
                      onClick={() => setFreteSelecionado(frete)}
                      className={`flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-colors ${freteSelecionado?.id === frete.id ? 'border-[#C87A2C] bg-[#C87A2C]/5' : 'border-stone-200 hover:border-stone-300 bg-stone-50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${freteSelecionado?.id === frete.id ? 'border-[#C87A2C]' : 'border-stone-300'}`}>
                          {freteSelecionado?.id === frete.id && <div className="w-2.5 h-2.5 rounded-full bg-[#C87A2C]" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-stone-900">{frete.empresa} {frete.nome}</span>
                          <span className="text-xs text-stone-500">Entrega em até {frete.prazo} dias úteis</span>
                        </div>
                      </div>
                      <span className="font-heading text-stone-900">R$ {frete.preco.toFixed(2).replace('.', ',')}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-stone-400 gap-3 text-center">
                  <Truck className="w-10 h-10 opacity-50" />
                  <p className="text-sm">Preencha o CEP para visualizar as opções.</p>
                </div>
              )}
            </section>

            {freteSelecionado && endereco.numero && cpf && (
              <section className="bg-white p-6 md:p-8 border border-stone-200 rounded-sm shadow-sm animate-fade-in">
                <h2 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-6 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#C87A2C] text-white flex items-center justify-center text-xs">3</span>
                  Pagamento Seguro
                </h2>
                
                <Payment
                  initialization={{ 
                    amount: Number(total.toFixed(2)),
                    payer: {
                      email: user.email, 
                    }
                  }}
                  customization={{
                    paymentMethods: {
                      bankTransfer: 'all', 
                      ticket: 'all',       
                      creditCard: 'all',   
                    },
                  }}
                  onSubmit={onSubmitPayment}
                  onError={(error) => {
                    console.error("Erro interno do Brick:", error);
                  }}
                />

              </section>
            )}

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
            </div>
          </aside>

        </div>
      </main>
      <Footer />
    </div>
  )
}