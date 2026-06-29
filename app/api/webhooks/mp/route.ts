import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import pool from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

// Configuramos o carteiro (nodemailer) usando as variáveis que você já tem no .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const bodyText = await request.text();
    let body: any = {};
    if (bodyText) { try { body = JSON.parse(bodyText); } catch (e) {} }

    let dataId = url.searchParams.get('data.id') || url.searchParams.get('id') || body?.data?.id;

    if (!dataId) return NextResponse.json({ success: true }, { status: 200 });

    const paymentApi = new Payment(client);
    const paymentData = await paymentApi.get({ id: dataId });

    if (paymentData.status === 'approved') {
      // 1. Puxamos os dados do pedido e cruzamos com a tabela de usuários para pegar Nome e E-mail
      const [orderRows]: any = await pool.execute(
        `SELECT p.id, p.status, u.nome, u.email 
         FROM pedidos p 
         JOIN usuarios u ON p.usuario_id = u.id 
         WHERE p.mp_payment_id = ? LIMIT 1`, 
        [dataId]
      );

      if (orderRows.length > 0) {
        const pedido = orderRows[0];

        if (pedido.status !== 'pago' && pedido.status !== 'enviado') {
          
          // 2. Atualiza status para PAGO
          await pool.execute(`UPDATE pedidos SET status = 'pago' WHERE id = ?`, [pedido.id]);

          // 3. Puxa os itens e dá baixa no estoque
          const [itens]: any = await pool.execute(`SELECT produto_id, quantidade, nome_produto FROM itens_pedido WHERE pedido_id = ?`, [pedido.id]);

          for (const item of itens) {
            await pool.execute(
              `UPDATE produtos SET estoque = GREATEST(0, estoque - ?) WHERE id = ?`,
              [item.quantidade, item.produto_id]
            );
          }

          // 4. DISPARO DO E-MAIL DE CONFIRMAÇÃO
          const appUrl = process.env.NEXT_PUBLIC_APP_URL;
          const itensHtml = itens.map((i: any) => `<li style="margin-bottom: 5px;">${i.quantidade}x ${i.nome_produto}</li>`).join('');

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 30px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #C87A2C; margin: 0;">Pagamento Aprovado! 🎉</h2>
              </div>
              <p style="font-size: 16px;">Olá <strong>${pedido.nome}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.5;">Recebemos o seu pagamento e o seu pedido <strong>#${pedido.id}</strong> já está sendo preparado com muito carinho pelo nosso ateliê!</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Resumo do Pedido:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #444;">
                  ${itensHtml}
                </ul>
              </div>

              <p style="font-size: 15px;">Você pode acompanhar as etapas do seu pedido em tempo real clicando no botão abaixo:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/meus-pedidos/${pedido.id}" style="display: inline-block; padding: 14px 28px; background-color: #C87A2C; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Acompanhar Pedido</a>
              </div>
              
              <p style="margin-top: 40px; font-size: 13px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                Com carinho,<br>Equipe Chama Ocre Ateliê
              </p>
            </div>
          `;

          try {
            await transporter.sendMail({
              from: '"Chama Ocre" <nao-responda@chamaocre.com>',
              to: pedido.email,
              subject: `Oba! Pagamento do Pedido #${pedido.id} aprovado!`,
              html: emailHtml,
            });
            console.log(`[E-mail] Confirmação enviada para ${pedido.email}`);
          } catch (err) {
            console.error('Erro ao enviar email de pagamento', err);
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}