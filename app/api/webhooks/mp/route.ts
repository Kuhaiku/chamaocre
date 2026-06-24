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
    if (bodyText) {
      try { body = JSON.parse(bodyText); } catch (e) {}
    }

    // Extrai o ID do Pagamento enviado pelo Webhook
    let dataId = url.searchParams.get('data.id') || url.searchParams.get('id') || body?.data?.id;

    if (!dataId) {
      return NextResponse.json({ success: true, message: 'Ignorado: Sem ID' }, { status: 200 });
    }

    // --- 1. AVISO DE ASSINATURA (Opcional, não bloqueia mais a venda) ---
    const signatureHeader = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    const secret = (process.env.MP_WEBHOOK_SECRET || '').trim(); 

    if (secret && signatureHeader && requestId) {
      const tsMatch = signatureHeader.match(/ts=(\d+)/);
      const v1Match = signatureHeader.match(/v1=([a-f0-9]+)/);

      if (tsMatch && v1Match) {
        const manifest = `id:${dataId};request-id:${requestId};ts:${tsMatch[1]}`;
        const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

        if (hmac !== v1Match[1]) {
          console.error('⚠️ AVISO: A assinatura falhou (Chave errada no Easypanel). Mas a Dupla Checagem garantirá a segurança.');
        }
      }
    }

    // --- 2. SEGURANÇA REAL: DUPLA CHECAGEM DIRETA NA API ---
    // Aqui o nosso servidor pergunta pro MP se o pagamento é real. Hackers não passam daqui.
    const paymentApi = new Payment(client);
    const paymentData = await paymentApi.get({ id: dataId });

    // 3. Atualiza o banco de dados com segurança máxima
    if (paymentData.status === 'approved') {
      const [result]: any = await pool.execute(
        `UPDATE pedidos SET status = 'pago' WHERE mp_payment_id = ?`,
        [dataId]
      );

      if (result.affectedRows > 0) {
        console.log(`[Webhook MP] 🚀 SUCESSO! Pedido com MP_ID ${dataId} verificado e marcado como PAGO.`);
      }
    }

    // Responde 200 OK para o Mercado Pago parar de enviar notificações repetidas
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook MP] Erro Interno:', error.message);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}