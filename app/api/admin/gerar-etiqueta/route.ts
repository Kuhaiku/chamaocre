import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { pedido_id } = await request.json();
    if (!pedido_id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });

    // 1. Verifica se o MODO TESTE está ligado no banco
    const [configRows]: any = await pool.execute('SELECT modo_teste FROM configuracoes WHERE id = 1 LIMIT 1');
    const modoTeste = configRows.length > 0 ? Boolean(configRows[0].modo_teste) : true;

    // 2. Busca os dados do pedido
    const [pedidos]: any = await pool.execute(
      `SELECT p.*, u.nome, u.email, u.telefone, u.cpf FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?`,
      [pedido_id]
    );
    const pedido = pedidos[0];

    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    // SE O MODO TESTE ESTIVER LIGADO (Simulação Perfeita)
    if (modoTeste) {
      const mockRastreio = `QM${Math.floor(100000000 + Math.random() * 900000000)}BR`;
      await pool.execute('UPDATE pedidos SET codigo_rastreio = ?, status = ? WHERE id = ?', [mockRastreio, 'enviado', pedido_id]);
      return NextResponse.json({ success: true, rastreio: mockRastreio, mensagem: 'Etiqueta de TESTE gerada.' });
    }

    // SE O MODO TESTE ESTIVER DESLIGADO (Compra Real)
    const token = process.env.MELHOR_ENVIO_TOKEN_COMPRA;
    if (!token) return NextResponse.json({ error: 'Token de compra ausente.' }, { status: 500 });
    if (!pedido.cpf || !pedido.transportadora_servico_id) return NextResponse.json({ error: 'Faltam dados do cliente (CPF/Serviço).' }, { status: 400 });

    const [itens]: any = await pool.execute('SELECT * FROM itens_pedido WHERE pedido_id = ?', [pedido_id]);

    const payloadMelhorEnvio = {
      service: pedido.transportadora_servico_id,
      agency: 1, 
      from: {
        name: "Chama Ocre", phone: "22999999999", email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@chamaocre.com",
        document: "00000000000", address: "Sua Rua", number: "123", district: "Bairro", city: "Araruama", state_abbr: "RJ", country_id: "BR", postal_code: process.env.CEP_ORIGEM || "28970000"
      },
      to: {
        name: pedido.nome, phone: pedido.telefone || "00000000000", email: pedido.email, document: pedido.cpf.replace(/\D/g, ''),
        address: pedido.rua, number: pedido.numero, complement: pedido.complemento || "", district: pedido.bairro, city: pedido.cidade, state_abbr: pedido.estado, country_id: "BR", postal_code: pedido.cep.replace(/\D/g, '')
      },
      products: itens.map((i: any) => ({ name: i.nome_produto, quantity: i.quantidade, unitary_value: Number(i.preco_unitario) })),
      volumes: [{ height: 15, width: 15, length: 15, weight: 0.5 }],
      options: { insurance_value: Number(pedido.total), receipt: false, own_hand: false, non_commercial: true }
    };

    const meResponse = await fetch('https://www.melhorenvio.com.br/api/v2/me/cart', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'User-Agent': `ChamaOcre` },
      body: JSON.stringify(payloadMelhorEnvio)
    });

    const meData = await meResponse.json();
    if (!meResponse.ok) return NextResponse.json({ error: 'Erro no Melhor Envio.' }, { status: 400 });

    await pool.execute('UPDATE pedidos SET codigo_rastreio = ?, status = ? WHERE id = ?', [meData.tracking, 'enviado', pedido_id]);
    return NextResponse.json({ success: true, rastreio: meData.tracking });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}