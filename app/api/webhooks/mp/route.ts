import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import pool from '@/lib/db';
import crypto from 'crypto';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const bodyText = await request.text();
    let body: any = {};
    if (bodyText) { try { body = JSON.parse(bodyText); } catch (e) {} }

    let dataId = url.searchParams.get('data.id') || url.searchParams.get('id') || body?.data?.id;

    if (!dataId) return NextResponse.json({ success: true }, { status: 200 });

    const signatureHeader = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    const secret = (process.env.MP_WEBHOOK_SECRET || '').trim(); 

    if (secret && signatureHeader && requestId) {
      const tsMatch = signatureHeader.match(/ts=(\d+)/);
      const v1Match = signatureHeader.match(/v1=([a-f0-9]+)/);
      if (tsMatch && v1Match) {
        const hmac = crypto.createHmac('sha256', secret).update(`id:${dataId};request-id:${requestId};ts:${tsMatch[1]}`).digest('hex');
        if (hmac !== v1Match[1]) console.error('⚠️ AVISO: A assinatura falhou.');
      }
    }

    const paymentApi = new Payment(client);
    const paymentData = await paymentApi.get({ id: dataId });

    if (paymentData.status === 'approved') {
      // 1. Puxa o pedido pra ter certeza que já não foi pago antes (evita baixa dupla)
      const [orderRows]: any = await pool.execute(`SELECT id, status FROM pedidos WHERE mp_payment_id = ? LIMIT 1`, [dataId]);

      if (orderRows.length > 0) {
        const pedido = orderRows[0];

        // Se o pedido AINDA NÃO FOI PAGO, a gente muda o status e tira do estoque
        if (pedido.status !== 'pago' && pedido.status !== 'enviado') {
          
          await pool.execute(`UPDATE pedidos SET status = 'pago' WHERE id = ?`, [pedido.id]);

          // 2. Busca os itens desse pedido
          const [itens]: any = await pool.execute(`SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = ?`, [pedido.id]);

          // 3. Dá a baixa no estoque um por um
          for (const item of itens) {
            // O comando GREATEST(0, ...) garante que seu estoque nunca fique negativo!
            await pool.execute(
              `UPDATE produtos SET estoque = GREATEST(0, estoque - ?) WHERE id = ?`,
              [item.quantidade, item.produto_id]
            );
          }
          console.log(`[Webhook MP] 🚀 SUCESSO! Pedido ${pedido.id} PAGO e Estoque reajustado!`);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}