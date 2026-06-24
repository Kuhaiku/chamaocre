import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import pool from '@/lib/db';

// Inicializa o Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  let connection;

  try {
    const body = await request.json();
    const { 
      formData, 
      items, 
      total, 
      frete,
      usuario_id, 
      cpf, 
      endereco,
      transportadora_nome 
    } = body;

    // 1. Criação do pagamento no Mercado Pago
    const payment = new Payment(client);
    const paymentData = {
      transaction_amount: Number(total),
      description: `Pedido Chama Ocre - ${items.length} itens`,
      payment_method_id: formData.payment_method_id,
      payer: {
        email: formData.payer.email,
        identification: formData.payer.identification,
      },
    };

    const result = await payment.create({ body: paymentData });

    // 2. Salvar o pedido no Banco de Dados
    connection = await pool.getConnection();
    await connection.beginTransaction(); // Inicia a transação segura

    try {
      // Inserção na tabela principal 'pedidos'
      const [orderResult]: any = await connection.execute(
        `INSERT INTO pedidos (
          usuario_id, 
          cpf, 
          valor_total, 
          valor_frete, 
          status,
          metodo_pagamento, 
          mp_payment_id, 
          transportadora_nome,
          endereco_entrega
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuario_id,
          cpf,
          total,
          frete,
          'aguardando_pagamento', // Consistente com sua regra do cron de 7 dias
          formData.payment_method_id,
          result.id, // ID da transação no Mercado Pago
          transportadora_nome,
          JSON.stringify(endereco) // Salva o endereço
        ]
      );

      const pedidoId = orderResult.insertId;

      // Inserção na tabela separada 'itens_pedido'
      for (const item of items) {
        await connection.execute(
          `INSERT INTO itens_pedido (
            pedido_id, 
            produto_id, 
            nome, 
            quantidade, 
            preco, 
            imagem
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            pedidoId,
            item.id,
            item.name,
            item.quantity,
            item.price,
            item.image || null
          ]
        );
      }

      await connection.commit(); // Confirma a gravação no banco
    } catch (dbError) {
      await connection.rollback(); // Desfaz a gravação em caso de erro no banco
      console.error("Erro no SQL:", dbError);
      throw dbError; 
    } finally {
      connection.release(); // Libera a conexão
    }

    // 3. Retornar os dados para o frontend (QR Code PIX ou sucesso Cartão)
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
    console.error('Erro no Checkout MP:', error);
    if (connection) connection.release(); 
    
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao processar pagamento ou salvar pedido.' 
    }, { status: 500 });
  }
}