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
      // Inserção principal do pedido. 
      // Dica: Ajuste os nomes das colunas caso sua tabela 'pedidos' seja diferente.
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
          endereco_entrega, 
          itens_pedido
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuario_id,
          cpf,
          total,
          frete,
          'pendente', // Status inicial aguardando o webhook confirmar
          formData.payment_method_id,
          result.id, // ID da transação no Mercado Pago
          transportadora_nome,
          JSON.stringify(endereco), // Salva o objeto de endereço como string JSON
          JSON.stringify(items)     // Salva o carrinho como string JSON
        ]
      );

      // Se você tiver uma tabela separada para os itens (ex: itens_pedido), 
      // você faria o loop de inserção aqui usando o orderResult.insertId:
      // const pedidoId = orderResult.insertId;
      // for (const item of items) { ... }

      await connection.commit(); // Confirma a gravação no banco
    } catch (dbError) {
      await connection.rollback(); // Desfaz a gravação em caso de erro no banco
      throw dbError; // Repassa o erro para o catch principal
    } finally {
      connection.release(); // Libera a conexão de volta para o pool
    }

    // 3. Retornar os dados corretos para o frontend exibir o QR Code (PIX) ou Sucesso (Cartão)
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
    console.error('Erro no Checkout:', error);
    // Se a conexão ficou aberta durante o erro, garantimos que ela seja liberada
    if (connection) connection.release(); 
    
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao processar pagamento ou salvar pedido.' 
    }, { status: 500 });
  }
}