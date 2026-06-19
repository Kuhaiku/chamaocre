import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuario_id = searchParams.get('usuario_id');

    if (!usuario_id) return NextResponse.json({ error: 'Usuário não informado' }, { status: 400 });

    // Busca os pedidos do usuário ordenados do mais recente para o mais antigo
    const [pedidos]: any = await pool.execute(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY criado_em DESC',
      [usuario_id]
    );

    if (pedidos.length === 0) {
      return NextResponse.json({ pedidos: [] });
    }

    // Pega os IDs dos pedidos para buscar os itens de uma vez só
    const pedidoIds = pedidos.map((p: any) => p.id);
    const placeholders = pedidoIds.map(() => '?').join(',');
    
    const [itens]: any = await pool.execute(
      `SELECT * FROM itens_pedido WHERE pedido_id IN (${placeholders})`,
      pedidoIds
    );

    // Agrupa os itens dentro de seus respectivos pedidos
    const pedidosComItens = pedidos.map((pedido: any) => ({
      ...pedido,
      itens: itens.filter((i: any) => i.pedido_id === pedido.id)
    }));

    return NextResponse.json({ pedidos: pedidosComItens });

  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}