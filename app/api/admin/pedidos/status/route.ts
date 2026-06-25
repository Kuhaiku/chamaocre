import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Essa rota é chamada pelo front-end para saber se o PIX já caiu
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mp_payment_id = searchParams.get('mp_payment_id');

  if (!mp_payment_id) return NextResponse.json({ error: 'Faltando ID' }, { status: 400 });

  try {
    const [rows]: any = await pool.execute('SELECT status FROM pedidos WHERE mp_payment_id = ? LIMIT 1', [mp_payment_id]);
    if (rows.length > 0) {
      return NextResponse.json({ status: rows[0].status });
    }
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no banco' }, { status: 500 });
  }
}