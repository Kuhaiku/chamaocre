import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { cep_destino, items } = await request.json();

    if (!cep_destino || !items || items.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Preparar os produtos para o formato do Melhor Envio
    const products = items.map((item: any) => {
      // Tenta converter "190g" em 0.19 (kg). Se falhar, usa 0.3kg como padrão.
      let pesoKg = 0.3;
      if (item.weight) {
        const pesoLimpo = item.weight.toString().replace(/[^0-9,.]/g, '').replace(',', '.');
        const pesoNum = parseFloat(pesoLimpo);
        if (!isNaN(pesoNum)) {
          pesoKg = item.weight.toLowerCase().includes('kg') ? pesoNum : pesoNum / 1000;
        }
      }

      return {
        id: item.id.toString(),
        width: 15,  // Largura padrão da caixa da vela em cm
        height: 15, // Altura padrão
        length: 15, // Comprimento padrão
        weight: pesoKg,
        insurance_value: item.price,
        quantity: item.quantity
      };
    });

    const payload = {
      from: { postal_code: process.env.CEP_ORIGEM || '00000000' },
      to: { postal_code: cep_destino.replace(/\D/g, '') },
      products: products
    };

    // 2. Chamar a API do Melhor Envio (URL de Sandbox para testes)
    // Quando for lançar a loja, troque "sandbox.melhorenvio" por "www.melhorenvio"
    const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        'User-Agent': 'Chama Ocre (suporte@chamaocre.com)' // O Melhor Envio exige um e-mail de contato aqui
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Melhor Envio:", data);
      return NextResponse.json({ error: 'Erro ao cotar o frete na transportadora.' }, { status: 400 });
    }

    // 3. Filtrar transportadoras que retornaram erro e ordenar da mais barata para a mais cara
    const fretesValidos = data
      .filter((f: any) => !f.error && f.price)
      .map((f: any) => ({
        id: f.id,
        nome: f.name,
        empresa: f.company.name,
        preco: parseFloat(f.price),
        prazo: f.delivery_time
      }))
      .sort((a: any, b: any) => a.preco - b.preco);

    return NextResponse.json({ fretes: fretesValidos });

  } catch (error) {
    console.error('Erro na rota de frete:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}