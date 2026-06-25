import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usuario_id = searchParams.get('usuario_id');

  if (!usuario_id) return NextResponse.json({ error: 'Usuário não informado' }, { status: 400 });

  try {
    const [pedidos]: any = await pool.execute(
      `SELECT id, total, status, criado_em, codigo_rastreio, transportadora_nome 
       FROM pedidos WHERE usuario_id = ? ORDER BY criado_em DESC`, 
      [usuario_id]
    );
    return NextResponse.json({ pedidos });
  } catch (error) {
    return NextResponse.json({ error: 'Erro de banco de dados' }, { status: 500 });
  }
}