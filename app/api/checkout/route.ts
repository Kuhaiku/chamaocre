import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const { 
      usuario_id, items, subtotal, frete, total, endereco, formData, 
      cpf, transportadora_nome, transportadora_servico_id 
    } = data;

    if (!usuario_id || !items || !formData || !formData.payment_method_id) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const [users]: any = await pool.execute('SELECT nome, email, cpf FROM usuarios WHERE id = ?', [usuario_id]);
    const user = users[0];

    if (cpf && cpf !== user.cpf) {
      await pool.execute('UPDATE usuarios SET cpf = ? WHERE id = ?', [cpf, usuario_id]);
    }

    const [pedidoResult]: any = await pool.execute(
      `INSERT INTO pedidos (usuario_id, subtotal, frete, total, cep, rua, numero, complemento, bairro, cidade, estado, transportadora_nome, transportadora_servico_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id, subtotal, frete, total, 
        endereco.cep || '', endereco.rua, endereco.numero, endereco.complemento || '', endereco.bairro, endereco.cidade, endereco.estado,
        transportadora_nome || null, transportadora_servico_id || null
      ]
    );
    const pedidoId = pedidoResult.insertId;

    for (const item of items) {
      await pool.execute(
        `INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, item.id, item.name, item.quantity, item.price]
      );
    }

    // Correção do Mercado Pago: Garantindo Sobrenome e formatando CPF limpo
    const nomePartes = user.nome.trim().split(' ');
    const payerFirstName = formData?.payer?.first_name || nomePartes[0];
    const payerLastName = formData?.payer?.last_name || (nomePartes.length > 1 ? nomePartes.slice(1).join(' ') : 'Cliente');
    
    const payerIdentification = formData?.payer?.identification || (cpf ? { type: 'CPF', number: cpf.replace(/\D/g, '') } : undefined);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const paymentBody: any = {
      transaction_amount: Number(total),
      description: `Pedido #${pedidoId} - Chama Ocre`,
      payment_method_id: formData.payment_method_id,
      external_reference: pedidoId.toString(),
      notification_url: `${appUrl}/api/webhooks/mp`,
      payer: {
        email: formData?.payer?.email || user.email,
        first_name: payerFirstName,
        last_name: payerLastName,
      }
    };

    if (payerIdentification) paymentBody.payer.identification = payerIdentification;
    if (formData.token) paymentBody.token = formData.token;
    if (formData.installments) paymentBody.installments = formData.installments;
    if (formData.issuer_id) paymentBody.issuer_id = formData.issuer_id;

    // Removido o entity_type que estava causando o crash no Brick

    const payment = new Payment(client);
    const response = await payment.create({ body: paymentBody });

    if (response.status === 'approved') {
      await pool.execute('UPDATE pedidos SET status = ? WHERE id = ?', ['pago', pedidoId]);
      for (const item of items) {
        await pool.execute('UPDATE produtos SET estoque = GREATEST(estoque - ?, 0) WHERE id = ?', [item.quantity, item.id]);
      }
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      payment_method: formData.payment_method_id,
      qr_code: response.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
    });

  } catch (error: any) {
    console.error('Erro no Checkout Transparente:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar pagamento.' }, { status: 500 });
  }
}