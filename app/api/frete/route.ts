import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { cep_destino, items } = await request.json();

    if (!cep_destino || !items || items.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // 1. Busca no banco de dados quais transportadoras você ativou no Admin
    let transportadorasPermitidas: string[] = [];
    try {
      const [configRows]: any = await pool.execute('SELECT transportadoras_ativas FROM configuracoes LIMIT 1');
      if (configRows.length > 0) {
        transportadorasPermitidas = typeof configRows[0].transportadoras_ativas === 'string'
          ? JSON.parse(configRows[0].transportadoras_ativas)
          : configRows[0].transportadoras_ativas;
      }
    } catch (e) {
      console.error("Erro ao ler configurações do banco, assumindo array vazio.");
    }

    
   // 2. Prepara os itens para o Melhor Envio usando as dimensões REAIS do banco
    const products = items.map((item: any) => {
      // Tenta pegar o peso real e converter para Quilos (Kg)
      let pesoKg = 0.5; // fallback de segurança (500g)
      if (item.weight && !isNaN(Number(item.weight)) && Number(item.weight) > 0) {
        pesoKg = Number(item.weight);
      } else if (item.peso_comercial) {
        // Se vier como "140g", extrai apenas os números
        const match = String(item.peso_comercial).match(/(\d+)/);
        if (match) {
          const gramas = Number(match[1]);
          pesoKg = gramas > 1000 ? gramas / 1000 : gramas / 1000;
        }
      }

      // Dimensões: Se estiver '0' ou vazio no banco, usa o MÍNIMO exigido pelos Correios
      const w = Number(item.largura) > 0 ? Number(item.largura) : 11;
      const h = Number(item.altura) > 0 ? Number(item.altura) : 2;
      const l = Number(item.comprimento) > 0 ? Number(item.comprimento) : 16;

      return {
        id: item.id.toString(),
        width: w,
        height: h,
        length: l,
        weight: pesoKg,
        insurance_value: Number(item.price),
        quantity: Number(item.quantity),
      };
    });
    // 3. Faz a cotação real no Melhor Envio (Servidor de Produção)
    const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        'User-Agent': 'ChamaOcre (atendimento@chamaocre.com)' // Boa prática exigida por eles
      },
      body: JSON.stringify({
        from: { postal_code: process.env.CEP_ORIGEM || '28970000' },
        to: { postal_code: cep_destino.replace(/\D/g, '') },
        products: products,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Melhor Envio:", data);
      return NextResponse.json({ error: 'Erro ao calcular frete' }, { status: 500 });
    }

    // 4. A Mágica do Filtro: Remove opções com erro e cruza com as suas escolhas do Admin
    const fretesFiltrados = data
      .filter((frete: any) => !frete.error) 
      .map((frete: any) => {
        // O Melhor Envio devolve separado, ex: company: "Correios", name: "PAC"
        const nomeCompleto = `${frete.company.name} ${frete.name}`;
        return {
          id: frete.id,
          nome: frete.name,
          empresa: frete.company.name,
          nomeCompleto: nomeCompleto,
          preco: Number(frete.custom_price || frete.price),
          prazo: frete.custom_delivery_time || frete.delivery_time,
        };
      })
      // Só deixa passar as transportadoras que estão marcadas com "Check" no seu painel
      .filter((frete: any) => transportadorasPermitidas.includes(frete.nomeCompleto))
      .sort((a: any, b: any) => a.preco - b.preco); // Ordena da mais barata para a mais cara

    return NextResponse.json({ fretes: fretesFiltrados });

  } catch (error) {
    console.error('Erro na rota de frete:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}