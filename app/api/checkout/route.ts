import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configura o Mercado Pago com o seu Token
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { usuario_id, items, subtotal, frete, total, endereco, freteSelecionado } = data;

    if (!usuario_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos para gerar o pedido.' }, { status: 400 });
    }

    // 1. Salvar o Pedido no Banco de Dados
    const [pedidoResult]: any = await pool.execute(
      `INSERT INTO pedidos 
      (usuario_id, subtotal, frete, total, cep, rua, numero, complemento, bairro, cidade, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id, subtotal, frete, total, 
        endereco.cep || '', endereco.rua, endereco.numero, endereco.complemento || '', 
        endereco.bairro, endereco.cidade, endereco.estado
      ]
    );
    const pedidoId = pedidoResult.insertId;

    // 2. Salvar os Itens do Pedido
    for (const item of items) {
      await pool.execute(
        `INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario) 
        VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, item.id, item.name, item.quantity, item.price]
      );
    }

    // 3. Montar os itens para o Mercado Pago
    const mpItems = items.map((item: any) => ({
      id: item.id.toString(),
      title: item.name,
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      currency_id: 'BRL',
    }));

    // Adiciona o Frete como um "item" no Mercado Pago para cobrar junto
    if (frete > 0 && freteSelecionado) {
      mpItems.push({
        id: 'FRETE',
        title: `Frete - ${freteSelecionado.empresa} ${freteSelecionado.nome}`,
        quantity: 1,
        unit_price: Number(frete),
        currency_id: 'BRL',
      });
    }

    // 4. Criar a Preferência (Link de Pagamento) no Mercado Pago
    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: mpItems,
        external_reference: pedidoId.toString(), // Nosso ID do banco linkado com o MP
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sucesso`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pendente`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/erro`,
        },
        auto_return: 'approved',
      }
    });

    // Retorna o link de pagamento para o cliente
    return NextResponse.json({ success: true, payment_url: response.init_point });

  } catch (error) {
    console.error('Erro no Checkout:', error);
    return NextResponse.json({ error: 'Erro ao gerar pagamento' }, { status: 500 });
  }
}