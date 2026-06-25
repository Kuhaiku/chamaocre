import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';

// Configuramos o carteiro com as mesmas credenciais do .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function GET() {
  try {
    // Cancela pedidos aguardando pagamento há mais de 7 dias
    await pool.execute(
      `UPDATE pedidos 
       SET status = 'cancelado' 
       WHERE status = 'aguardando_pagamento' 
       AND criado_em < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // Busca pedidos com os dados do cliente
    const [pedidos]: any = await pool.execute(
      `SELECT p.*, u.nome as cliente_nome, u.email as cliente_email, u.telefone as cliente_telefone, u.cpf 
       FROM pedidos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       ORDER BY p.criado_em DESC`
    );

    if (pedidos.length === 0) {
      return NextResponse.json({ pedidos: [] });
    }

    const [itens]: any = await pool.execute('SELECT * FROM itens_pedido');

    const pedidosComItens = pedidos.map((pedido: any) => ({
      ...pedido,
      itens: itens.filter((i: any) => i.pedido_id === pedido.id)
    }));

    return NextResponse.json({ pedidos: pedidosComItens });

  } catch (error) {
    console.error('Erro ao buscar pedidos admin:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, codigo_rastreio } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Puxa o status antigo e os dados do cliente ANTES de atualizar
    const [pedidoRows]: any = await pool.execute(
      `SELECT p.status as status_antigo, u.nome, u.email 
       FROM pedidos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       WHERE p.id = ? LIMIT 1`, 
      [id]
    );

    // 2. Atualiza a base de dados
    await pool.execute(
      'UPDATE pedidos SET status = ?, codigo_rastreio = ? WHERE id = ?',
      [status, codigo_rastreio || null, id]
    );

    // 3. A MÁGICA DO E-MAIL: Se mudou para "enviado" e tem rastreio, dispara o e-mail!
    if (pedidoRows.length > 0) {
      const { status_antigo, nome, email } = pedidoRows[0];

      if (status === 'enviado' && status_antigo !== 'enviado' && codigo_rastreio) {
        const linkRastreio = `https://melhorrastreio.com.br/rastreio/${codigo_rastreio}`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; padding: 30px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #C87A2C; margin: 0;">O seu pedido está a caminho! 🚚</h2>
            </div>
            <p style="font-size: 16px;">Olá <strong>${nome}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5;">O seu pedido <strong>#${id}</strong> foi embalado com muito carinho e já se encontra nas mãos da transportadora.</p>
            
            <div style="background-color: #C87A2C15; border-left: 4px solid #C87A2C; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #C87A2C; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Código de Rastreio</h3>
              <p style="font-size: 18px; font-weight: bold; margin: 0; letter-spacing: 2px;">${codigo_rastreio}</p>
            </div>

            <p style="font-size: 15px;">Pode acompanhar cada passo da entrega ao clicar no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${linkRastreio}" style="display: inline-block; padding: 14px 28px; background-color: #C87A2C; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Rastrear Encomenda</a>
            </div>
            
            <p style="margin-top: 40px; font-size: 13px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
              Com carinho,<br>Equipa Chama Ocre Ateliê
            </p>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: '"Chama Ocre" <nao-responda@chamaocre.com>',
            to: email,
            subject: `O seu pedido #${id} foi enviado!`,
            html: emailHtml,
          });
        } catch (err) {
          console.error('Erro ao disparar e-mail de rastreio', err);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}