import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Mapeamento dos status recebidos do Melhor Envio para o padrão do seu banco
const statusMap: Record<string, string> = {
  'posted': 'enviado',
  'delivered': 'entregue',
  'canceled': 'cancelado',
  'undelivered': 'devolvido',
};

export async function POST(request: Request) {
  try {
    // Validação de segurança recomendada:
    // O Melhor Envio permite configurar um token. Descomente as linhas abaixo se configurar um.
    /*
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MELHOR_ENVIO_WEBHOOK_SECRET}`) {
       return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    */

    const data = await request.json();

    // A estrutura do payload do Melhor Envio envia o status e o código de rastreio.
    // Dependendo do evento configurado no painel deles, pode vir no formato abaixo:
    const trackingCode = data.tracking || data.tracking_code; 
    const meStatus = data.status; 

    if (!trackingCode || !meStatus) {
      return NextResponse.json({ error: 'Payload inválido ou incompleto' }, { status: 400 });
    }

    const novoStatus = statusMap[meStatus];

    // Se o status recebido estiver no nosso mapeamento, atualiza no banco
    if (novoStatus) {
      const [result]: any = await pool.execute(
        'UPDATE pedidos SET status = ? WHERE codigo_rastreio = ?',
        [novoStatus, trackingCode]
      );

      if (result.affectedRows > 0) {
        console.log(`[Webhook Melhor Envio] Pedido com rastreio ${trackingCode} atualizado para: ${novoStatus}`);
      } else {
        console.log(`[Webhook Melhor Envio] Nenhum pedido encontrado com o rastreio: ${trackingCode}`);
      }
    }

    // Sempre retorne 200 OK rapidamente para o Melhor Envio saber que você recebeu
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Webhook Melhor Envio] Erro interno:', error);
    return NextResponse.json({ success: false, error: 'Erro ao processar webhook' }, { status: 500 });
  }
}