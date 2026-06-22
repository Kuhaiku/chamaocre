import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Busca todos os pedidos da loja
export async function GET() {
  try {
    // Busca pedidos fazendo um JOIN com a tabela de usuários para pegar nome e e-mail
    const [pedidos]: any = await pool.execute(
      `SELECT p.*, u.nome as cliente_nome, u.email as cliente_email, u.telefone as cliente_telefone 
       FROM pedidos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       ORDER BY p.criado_em DESC`
    );

    if (pedidos.length === 0) {
      return NextResponse.json({ pedidos: [] });
    }

    // Busca todos os itens de todos os pedidos
    const [itens]: any = await pool.execute('SELECT * FROM itens_pedido');

    // Agrupa os itens dentro dos pedidos correspondentes
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

// Atualiza o status e o código de rastreio de um pedido
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