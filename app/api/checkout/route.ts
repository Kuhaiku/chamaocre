import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  let connection;

  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token do Mercado Pago não configurado no servidor.' }, { status: 500 });
    }

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

    // 1. Limpa o CPF para ter apenas números (Evita erro 400 no Mercado Pago)
    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';

    // 2. Prepara o Payload para o Mercado Pago
    const paymentData = {
      ...formData, 
      transaction_amount: Number(Number(total).toFixed(2)), // Garante max 2 casas decimais
      description: `Pedido Chama Ocre - ${items.length} itens`,
      payer: {
        ...formData.payer,
        identification: {
          type: 'CPF',
          number: cpfLimpo
        }
      }
    };

    // 3. FAZ A REQUISIÇÃO DIRETA NA API DO MP (Bypass da SDK bugada)
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID() // Evita pagamentos duplicados
      },
      body: JSON.stringify(paymentData)
    });

    const resultText = await mpResponse.text();
    let result;
    
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      throw new Error(`API do MP retornou erro não-JSON: ${resultText}`);
    }

    // Se o Mercado Pago recusar, agora sabemos o motivo exato!
    if (!mpResponse.ok) {
      console.error("ERRO RECUSADO PELO MP:", result);
      return NextResponse.json({ 
        success: false, 
        error: 'Pagamento recusado pelo Mercado Pago.',
        motivo_mp: result 
      }, { status: 400 });
    }

    // 4. Salvar o pedido no Banco de Dados
    connection = await pool.getConnection();
    await connection.beginTransaction(); 

    try {
      if (cpf) {
        await connection.execute(
          'UPDATE usuarios SET cpf = ? WHERE id = ? AND (cpf IS NULL OR cpf = "")',
          [cpfLimpo, usuario_id]
        );
      }

      const [orderResult]: any = await connection.execute(
        `INSERT INTO pedidos (
          usuario_id, subtotal, frete, transportadora_nome, transportadora_servico_id, 
          total, status, cep, rua, numero, complemento, bairro, cidade, estado,
          mp_payment_id, metodo_pagamento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuario_id, subtotal, frete, transportadora_nome || '', transportadora_servico_id || null,
          total, 'aguardando_pagamento',
          endereco.cep || '', endereco.rua || '', endereco.numero || '', 
          endereco.complemento || '', endereco.bairro || '', endereco.cidade || '', endereco.estado || '',
          result.id, formData.payment_method_id
        ]
      );

      const pedidoId = orderResult.insertId;

      for (const item of items) {
        await connection.execute(
          `INSERT INTO itens_pedido (
            pedido_id, produto_id, nome_produto, quantidade, preco_unitario
          ) VALUES (?, ?, ?, ?, ?)`,
          [pedidoId, item.id, item.name, item.quantity, item.price]
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

    // 5. Resposta de Sucesso para o Frontend
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
    if (connection) connection.release(); 
    console.error('Erro GERAL no Checkout:', error);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor.', detalhe: error.message }, { status: 500 });
  }
}