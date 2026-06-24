import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import pool from '@/lib/db';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  let connection;

  try {
    const body = await request.json();
    const { 
      formData, 
      items, 
      subtotal,
      frete,
      total, 
      usuario_id, 
      cpf, 
      endereco,
      transportadora_nome,
      transportadora_servico_id
    } = body;

    // 1. Criação do Pagamento no Mercado Pago
    const payment = new Payment(client);
    const paymentData = {
      ...formData, 
      transaction_amount: Number(total),
      description: `Pedido Chama Ocre - ${items.length} itens`,
    };

    const result = await payment.create({ body: paymentData });

    // 2. Salvar o pedido no Banco de Dados (Alinhado 100% com as suas tabelas)
    connection = await pool.getConnection();
    await connection.beginTransaction(); 

    try {
      // 2.1 - Atualiza o CPF do usuário se ele não tinha antes
      if (cpf) {
        await connection.execute(
          'UPDATE usuarios SET cpf = ? WHERE id = ? AND (cpf IS NULL OR cpf = "")',
          [cpf, usuario_id]
        );
      }

      // 2.2 - Inserção na tabela 'pedidos'
      const [orderResult]: any = await connection.execute(
        `INSERT INTO pedidos (
          usuario_id, 
          subtotal, 
          frete, 
          transportadora_nome, 
          transportadora_servico_id, 
          total, 
          status, 
          cep, 
          rua, 
          numero, 
          complemento, 
          bairro, 
          cidade, 
          estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuario_id,
          subtotal,
          frete,
          transportadora_nome || '',
          transportadora_servico_id || null,
          total,
          'aguardando_pagamento',
          endereco.cep || '', 
          endereco.rua || '', 
          endereco.numero || '', 
          endereco.complemento || '', 
          endereco.bairro || '', 
          endereco.cidade || '', 
          endereco.estado || ''
        ]
      );

      const pedidoId = orderResult.insertId;

      // 2.3 - Inserção na tabela 'itens_pedido'
      for (const item of items) {
        await connection.execute(
          `INSERT INTO itens_pedido (
            pedido_id, 
            produto_id, 
            nome_produto, 
            quantidade, 
            preco_unitario
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            pedidoId,
            item.id,
            item.name,
            item.quantity,
            item.price // Aqui mapeamos para preco_unitario
          ]
        );
      }

      await connection.commit(); 
    } catch (dbError) {
      await connection.rollback(); 
      console.error("ERRO SQL AO SALVAR PEDIDO:", dbError);
      throw dbError; 
    } finally {
      connection.release(); 
    }

    // 3. Resposta para o Frontend (PIX ou Cartão)
    if (result.payment_method_id === 'pix') {
      return NextResponse.json({
        success: true,
        payment_method: 'pix',
        qr_code: result.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        payment_id: result.id
      });
    }

    return NextResponse.json({
      success: true,
      payment_method: result.payment_method_id,
      payment_id: result.id,
      status: result.status
    });

  } catch (error: any) {
    console.error('Erro CRÍTICO no Checkout MP:', error);
    if (connection) connection.release(); 
    return NextResponse.json({ success: false, error: 'Erro ao processar pagamento.' }, { status: 500 });
  }
}