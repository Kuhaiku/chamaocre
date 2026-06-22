import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { pedido_id } = await request.json();

    if (!pedido_id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });

    // Puxando o token correto para compras
    const token = process.env.MELHOR_ENVIO_TOKEN_COMPRA;
    if (!token) {
      return NextResponse.json({ error: 'Token de compra do Melhor Envio ausente no servidor.' }, { status: 500 });
    }

    // 1. Busca os dados completos do pedido e do cliente (AGORA INCLUINDO O CPF E O SERVIÇO)
    const [pedidos]: any = await pool.execute(
      `SELECT p.*, u.nome, u.email, u.telefone, u.cpf 
       FROM pedidos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       WHERE p.id = ?`,
      [pedido_id]
    );
    const pedido = pedidos[0];

    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    if (!pedido.cpf) return NextResponse.json({ error: 'CPF do cliente ausente no cadastro.' }, { status: 400 });
    if (!pedido.transportadora_servico_id) return NextResponse.json({ error: 'Serviço de frete não registrado neste pedido.' }, { status: 400 });

    // 2. Busca os itens comprados
    const [itens]: any = await pool.execute('SELECT * FROM itens_pedido WHERE pedido_id = ?', [pedido_id]);

    // =====================================================================
    // PAYLOAD OFICIAL DO MELHOR ENVIO (Integração Real Dinâmica)
    // =====================================================================
    const payloadMelhorEnvio = {
      service: pedido.transportadora_servico_id, // ID dinâmico do serviço escolhido pelo cliente
      agency: 1,  // ID da agência de postagem (Mude se for usar Jadlog e tiver ID específico na sua região)
      from: {
        name: "Chama Ocre",
        phone: "22999999999", 
        email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "seu@email.com",
        document: "00000000000", // IMPORTANTE: Coloque seu CPF/CNPJ real aqui
        address: "Sua Rua",
        number: "123",
        district: "Seu Bairro",
        city: "Araruama",
        state_abbr: "RJ",
        country_id: "BR",
        postal_code: process.env.CEP_ORIGEM || "28970000",
      },
      to: {
        name: pedido.nome,
        phone: pedido.telefone || "00000000000",
        email: pedido.email,
        document: pedido.cpf.replace(/\D/g, ''), // CPF do cliente limpo, apenas números
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
        non_commercial: true // Envio com Declaração de Conteúdo (Sem Nota Fiscal)
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