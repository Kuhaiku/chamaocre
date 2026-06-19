import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { usuario_id, items, subtotal, frete, total, endereco, formData } = data;

    if (!usuario_id || !items || !formData || !formData.payment_method_id) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const [users]: any = await pool.execute('SELECT nome, email FROM usuarios WHERE id = ?', [usuario_id]);
    const user = users[0];

    const [pedidoResult]: any = await pool.execute(
      `INSERT INTO pedidos (usuario_id, subtotal, frete, total, cep, rua, numero, complemento, bairro, cidade, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, subtotal, frete, total, endereco.cep || '', endereco.rua, endereco.numero, endereco.complemento || '', endereco.bairro, endereco.cidade, endereco.estado]
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
    const payerIdentification = formData?.payer?.identification || undefined;
    const entityType = formData?.payer?.entity_type || undefined; // Adicionado para evitar o aviso no console

    const paymentBody: any = {
      transaction_amount: Number(total),
      description: `Pedido #${pedidoId} - Chama Ocre`,
      payment_method_id: formData.payment_method_id,
      external_reference: pedidoId.toString(),
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