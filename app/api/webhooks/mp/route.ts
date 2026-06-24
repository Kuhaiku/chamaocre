import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import pool from '@/lib/db';
import crypto from 'crypto';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    
    // Lê o texto puro (obrigatório para a assinatura não quebrar)
    const bodyText = await request.text();
    let body: any = {};
    if (bodyText) {
      try { body = JSON.parse(bodyText); } catch (e) {}
    }

    // Pega o ID com precisão máxima (Tenta na URL, se não tiver, tenta no corpo)
    let dataId = url.searchParams.get('data.id') || url.searchParams.get('id') || body?.data?.id;

    if (!dataId) {
      return NextResponse.json({ success: true, message: 'Ignorado: Sem ID' }, { status: 200 });
    }

    // --- 1. VALIDAÇÃO DE SEGURANÇA ---
    const signatureHeader = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    
    // O trim() salva a vida: remove espaços vazios ou quebras de linha acidentais do .env
    const secret = (process.env.MP_WEBHOOK_SECRET || '').trim(); 

    if (secret && signatureHeader && requestId) {
      const tsMatch = signatureHeader.match(/ts=(\d+)/);
      const v1Match = signatureHeader.match(/v1=([a-f0-9]+)/);

      if (tsMatch && v1Match) {
        const ts = tsMatch[1];
        const v1 = v1Match[1];
        
        const manifest = `id:${dataId};request-id:${requestId};ts:${ts}`;
        const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

        if (hmac !== v1) {
          // SE FALHAR AGORA, ELE VAI MOSTRAR NO LOG O MOTIVO EXATO
          console.error('--- ALERTA: FALHA NA ASSINATURA MP ---');
          console.error('1. Manifesto gerado:', manifest);
          console.error('2. Assinatura do MP (v1):', v1);
          console.error('3. Nossa Assinatura (hmac):', hmac);
          console.error('4. Tamanho do Secret usado:', secret.length);
          console.error('--------------------------------------');
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 403 });
        }
      }
    }
    // ---------------------------------

    // 2. Confirmação direta na API do MP
    const paymentApi = new Payment(client);
    const paymentData = await paymentApi.get({ id: dataId });

    // 3. Atualiza o banco de dados
    if (paymentData.status === 'approved') {
      const [result]: any = await pool.execute(
        `UPDATE pedidos SET status = 'pago' WHERE mp_payment_id = ?`,
        [dataId]
      );

      if (result.affectedRows > 0) {
        console.log(`[Webhook MP] 🚀 SUCESSO! Pedido com MP_ID ${dataId} foi marcado como PAGO.`);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook MP] Erro Interno:', error.message);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}