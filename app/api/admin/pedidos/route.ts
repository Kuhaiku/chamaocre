import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. REGRA AUTOMÁTICA: Cancela pedidos aguardando pagamento há mais de 7 dias
    await pool.execute(
      `UPDATE pedidos 
       SET status = 'cancelado' 
       WHERE status = 'aguardando_pagamento' 
       AND criado_em < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // 2. Busca pedidos com os dados do cliente
    const [pedidos]: any = await pool.execute(
      `SELECT p.*, u.nome as cliente_nome, u.email as cliente_email, u.telefone as cliente_telefone, u.cpf 
       FROM pedidos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       ORDER BY p.criado_em DESC`
    );

    if (pedidos.length === 0) {
      return NextResponse.json({ pedidos: [] });
    }

    // 3. Busca e agrupa os itens
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

    await pool.execute(
      'UPDATE pedidos SET status = ?, codigo_rastreio = ? WHERE id = ?',
      [status, codigo_rastreio || null, id]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}