import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import pool from '@/lib/db';
import crypto from 'crypto'; // Usado para gerar chave única para o MP

export async function POST(request: Request) {
  let connection;

  try {
    // 1. GARANTE QUE O TOKEN SEJA LIDO EM TEMPO REAL
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      throw new Error("MP_ACCESS_TOKEN não está configurado no servidor.");
    }

    const client = new MercadoPagoConfig({ accessToken: token });

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

    // 2. INJETA O CPF MANUALMENTE NO PAYLOAD DO MERCADO PAGO
    // O Brick não coletou o CPF, então pegamos do nosso input e forçamos aqui
    const payment = new Payment(client);
    const paymentData = {
      ...formData, 
      transaction_amount: Number(total),
      description: `Pedido Chama Ocre - ${items.length} itens`,
      payer: {
        ...formData.payer,
        identification: {
          type: 'CPF',
          number: cpf // O MP rejeita silenciosamente sem isso!
        }
      }
    };

    // Envia para o MP com Chave de Idempotência
    const result = await payment.create({ 
      body: paymentData,
      requestOptions: { idempotencyKey: crypto.randomUUID() }
    });

    // 3. SALVAR NO BANCO DE DADOS (Estrutura exata do seu painel)
    connection = await pool.getConnection();
    await connection.beginTransaction(); 

    try {
      // Salva o CPF no usuário caso ele não tenha
      if (cpf) {
        await connection.execute(
          'UPDATE usuarios SET cpf = ? WHERE id = ? AND (cpf IS NULL OR cpf = "")',
          [cpf, usuario_id]
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
      console.error("ERRO SQL:", dbError);
      throw dbError; 
    } finally {
      connection.release(); 
    }

    // 4. RESPOSTA PARA O FRONTEND
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
    
    console.error('Erro DETALHADO Checkout MP:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Falha ao processar pagamento. Verifique seus dados.',
      detalhe: error.message || "Erro desconhecido"
    }, { status: 500 });
  }
}