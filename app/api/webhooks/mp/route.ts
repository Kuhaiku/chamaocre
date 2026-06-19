import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  try {
    // O Mercado Pago envia os IDs do pagamento via Query Params na URL
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (topic === 'payment' && id) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: String(id) });

      const pedidoId = paymentData.external_reference;
      const status = paymentData.status; // 'approved', 'pending', 'rejected', etc.

      if (pedidoId) {
        let novoStatus = 'aguardando_pagamento';
        if (status === 'approved') novoStatus = 'pago';
        else if (status === 'rejected' || status === 'cancelled') novoStatus = 'cancelado';

        // 1. Atualiza o status do pedido no banco de dados
        await pool.execute('UPDATE pedidos SET status = ? WHERE id = ?', [novoStatus, pedidoId]);

        // 2. Se o pagamento foi aprovado, dá baixa no estoque automaticamente
        if (status === 'approved') {
           const [itens]: any = await pool.execute(
             'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = ?', 
             [pedidoId]
           );
           
           for (const item of itens) {
             await pool.execute(
               'UPDATE produtos SET estoque = GREATEST(estoque - ?, 0) WHERE id = ?', 
               [item.quantidade, item.produto_id]
             );
           }
        }
      }
    }

    // Sempre retorne 200 OK rapidamente para o Mercado Pago saber que você recebeu o aviso
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Erro no Webhook do Mercado Pago:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}