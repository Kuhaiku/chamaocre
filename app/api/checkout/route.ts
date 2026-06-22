import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // RECEBENDO OS NOVOS DADOS DE CPF E TRANSPORTADORA:
    const { 
      usuario_id, items, subtotal, frete, total, endereco, formData, 
      cpf, transportadora_nome, transportadora_servico_id 
    } = data;

    if (!usuario_id || !items || !formData || !formData.payment_method_id) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const [users]: any = await pool.execute('SELECT nome, email, cpf FROM usuarios WHERE id = ?', [usuario_id]);
    const user = users[0];

    // 1. ATUALIZA O CPF DO USUÁRIO NO BANCO CASO ELE TENHA DIGITADO E AINDA NÃO EXISTA
    if (cpf && cpf !== user.cpf) {
      await pool.execute('UPDATE usuarios SET cpf = ? WHERE id = ?', [cpf, usuario_id]);
    }

    // 2. SALVAR O PEDIDO (AGORA COM OS DADOS DE TRANSPORTE)
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

    const payerEmail = formData?.payer?.email || user.email;
    const payerFirstName = formData?.payer?.first_name || user.nome.split(' ')[0];
    const payerLastName = formData?.payer?.last_name || '';
    
    // Se for PIX ou Cartão sem identificação, passamos o CPF que o cliente acabou de digitar para o Mercado Pago
    const payerIdentification = formData?.payer?.identification || (cpf ? { type: 'CPF', number: cpf.replace(/\D/g, '') } : undefined);
    const entityType = formData?.payer?.entity_type || undefined;
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sualoja.com.br';

    const paymentBody: any = {
      transaction_amount: Number(total),
      description: `Pedido #${pedidoId} - Chama Ocre`,
      payment_method_id: formData.payment_method_id,
      external_reference: pedidoId.toString(),
      notification_url: `${appUrl}/api/webhooks/mp`,
      payer: {
        email: payerEmail,
        first_name: payerFirstName,
        last_name: payerLastName,
      }
    };

    if (payerIdentification) paymentBody.payer.identification = payerIdentification;
    if (entityType) paymentBody.payer.entity_type = entityType;
    if (formData.token) paymentBody.token = formData.token;
    if (formData.installments) paymentBody.installments = formData.installments;
    if (formData.issuer_id) paymentBody.issuer_id = formData.issuer_id;

    const payment = new Payment(client);
    const response = await payment.create({ body: paymentBody });

    // BAIXA IMEDIATA NO ESTOQUE (Pagamentos Aprovados na Hora)
    if (response.status === 'approved') {
      await pool.execute('UPDATE pedidos SET status = ? WHERE id = ?', ['pago', pedidoId]);

      for (const item of items) {
        await pool.execute(
          'UPDATE produtos SET estoque = GREATEST(estoque - ?, 0) WHERE id = ?',
          [item.quantity, item.id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      payment_method: formData.payment_method_id,
      qr_code: response.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
    });

  } catch (error) {
    console.error('Erro no Checkout Transparente:', error);
    return NextResponse.json({ error: 'Falha ao processar pagamento.' }, { status: 500 });
  }
}