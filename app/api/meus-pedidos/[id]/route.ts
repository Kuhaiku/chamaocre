import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // NOVO: Aguarda a resolução dos parâmetros da URL (Exigência do Next.js 15+)
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const { searchParams } = new URL(request.url);
  const usuario_id = searchParams.get('usuario_id');

  if (!id || !usuario_id) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  try {
    // Busca os dados gerais do pedido
    const [pedidos]: any = await pool.execute(
      `SELECT * FROM pedidos WHERE id = ? AND usuario_id = ? LIMIT 1`,
      [id, usuario_id]
    );

    if (pedidos.length === 0) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const pedido = pedidos[0];

    // Busca os itens vinculados a este pedido
    const [itens]: any = await pool.execute(
      `SELECT * FROM itens_pedido WHERE pedido_id = ?`,
      [id]
    );

    return NextResponse.json({ pedido: { ...pedido, itens } });
  } catch (error) {
    console.error('Erro ao buscar detalhes do pedido:', error);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}