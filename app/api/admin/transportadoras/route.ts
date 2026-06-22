import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) return NextResponse.json({ error: 'Token ausente' }, { status: 500 });

    const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/services', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': `ChamaOcre (${process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@chamaocre.com'})`
      }
    });

    if (!response.ok) return NextResponse.json({ error: 'Falha na API' }, { status: response.status });

    const data = await response.json();
    
    // Formata a lista para o nosso painel
    const servicos = data.map((servico: any) => ({
      id: servico.id,
      nomeCompleto: `${servico.company.name} ${servico.name}`
    }));

    return NextResponse.json({ servicos });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}