import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import pool from '@/lib/db';
import crypto from 'crypto';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    // Lemos o body como texto primeiro para não quebrar a requisição
    const bodyText = await request.text();
    let body: any = {};
    if (bodyText) {
      try { body = JSON.parse(bodyText); } catch (e) { console.error('Erro ao fazer parse do JSON'); }
    }

    if (!dataId && (body.type === 'payment' || body.topic === 'payment')) {
      dataId = body.data?.id;
    }

    if (!dataId) {
      return NextResponse.json({ success: true, message: 'Notificação ignorada' }, { status: 200 });
    }

    // --- 1. VALIDAÇÃO DE SEGURANÇA (ASSINATURA SECRETA) ---
    const signatureHeader = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    const secret = process.env.MP_WEBHOOK_SECRET;

    if (secret && signatureHeader && requestId) {
      // Extrai os dados do cabeçalho enviado pelo Mercado Pago (ts e v1)
      const tsMatch = signatureHeader.match(/ts=(\d+)/);
      const v1Match = signatureHeader.match(/v1=([a-f0-9]+)/);

      if (tsMatch && v1Match) {
        const ts = tsMatch[1];
        const v1 = v1Match[1];
        
        // Cria a string de manifesto exatamente como o Mercado Pago exige
        const manifest = `id:${dataId};request-id:${requestId};ts:${ts}`;
        
        // Gera a criptografia local usando a sua Assinatura Secreta
        const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

        // Se a assinatura gerada for diferente da que chegou, é uma fraude
        if (hmac !== v1) {
          console.error('[Webhook MP] ALERTA DE SEGURANÇA: Assinatura Inválida! Possível tentativa de fraude.');
          return NextResponse.json({ error: 'Assinatura inválida. Acesso negado.' }, { status: 403 });
        }
      }
    }
    // --------------------------------------------------------

    // 2. Confirmação Dupla: Busca os dados reais na API do Mercado Pago
    const paymentApi = new Payment(client);
    const paymentData = await paymentApi.get({ id: dataId });

    // 3. Atualiza o banco de dados se realmente estiver pago
    if (paymentData.status === 'approved') {
      const [result]: any = await pool.execute(
        `UPDATE pedidos SET status = 'pago' WHERE mp_payment_id = ?`,
        [dataId]
      );

      if (result.affectedRows > 0) {
        console.log(`[Webhook MP] Sucesso! Pedido com MP_ID ${dataId} foi marcado como PAGO.`);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[Webhook MP] Erro Crítico:', error);
    return NextResponse.json({ error: 'Erro interno no processamento' }, { status: 500 });
  }
}