import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { pedido_id } = await request.json();

    if (!pedido_id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });

    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Token do Melhor Envio ausente no servidor.' }, { status: 500 });
    }

    // 1. Busca os dados completos do pedido e do cliente
    const [pedidos]: any = await pool.execute(
      `SELECT p.*, u.nome, u.email, u.telefone 
       FROM pedidos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       WHERE p.id = ?`,
      [pedido_id]
    );
    const pedido = pedidos[0];

    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    // 2. Busca os itens comprados
    const [itens]: any = await pool.execute('SELECT * FROM itens_pedido WHERE pedido_id = ?', [pedido_id]);

    // =====================================================================
    // PAYLOAD OFICIAL DO MELHOR ENVIO (Integração Real)
    // =====================================================================
    const payloadMelhorEnvio = {
      service: 1, // ATENÇÃO: 1 é o código padrão para Correios PAC
      agency: 1,  // ID da agência de postagem (necessário para Jadlog, etc)
      from: {
        name: "Chama Ocre",
        phone: "22992082292", 
        email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        document: "18272995760", // IMPORTANTE: Coloque seu CPF/CNPJ real aqui
        address: "Rua campos de Paz",
        number: "8",
        district: "Viaduto",
        city: "Araruama",
        state_abbr: "RJ",
        country_id: "BR",
        postal_code: process.env.CEP_ORIGEM || "28970000",
      },
      to: {
        name: pedido.nome,
        phone: pedido.telefone || "00000000000",
        email: pedido.email,
        document: "00000000000", // IMPORTANTE: A API do ME exige o CPF do cliente
        address: pedido.rua,
        number: pedido.numero,
        complement: pedido.complemento || "",
        district: pedido.bairro,
        city: pedido.cidade,
        state_abbr: pedido.estado,
        country_id: "BR",
        postal_code: pedido.cep.replace(/\D/g, ''),
      },
      products: itens.map((i: any) => ({
        name: i.nome_produto,
        quantity: i.quantidade,
        unitary_value: Number(i.preco_unitario)
      })),
      volumes: [{ height: 15, width: 15, length: 15, weight: 0.5 }],
      options: {
        insurance_value: Number(pedido.total),
        receipt: false,
        own_hand: false,
        non_commercial: true 
      }
    };

    // 3. Comunicação real com a API do Melhor Envio
    const meResponse = await fetch('https://www.melhorenvio.com.br/api/v2/me/cart', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': `ChamaOcre (${process.env.NEXT_PUBLIC_ADMIN_EMAIL})`
      },
      body: JSON.stringify(payloadMelhorEnvio)
    });

    const meData = await meResponse.json();

    if (!meResponse.ok) {
      console.error("Erro Melhor Envio:", meData);
      return NextResponse.json({ error: 'Erro ao gerar etiqueta no Melhor Envio.' }, { status: 400 });
    }

    // 4. Captura o rastreio oficial devolvido pela plataforma
    const rastreioOficial = meData.tracking;

    // 5. Salva o rastreio no banco e muda o status para "Enviado"
    await pool.execute(
      'UPDATE pedidos SET codigo_rastreio = ?, status = ? WHERE id = ?',
      [rastreioOficial, 'enviado', pedido_id]
    );

    return NextResponse.json({ 
      success: true, 
      rastreio: rastreioOficial 
    });

  } catch (error) {
    console.error('Erro ao gerar etiqueta:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}