import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { produto_id, email } = await request.json();

    if (!produto_id || !email) {
      return NextResponse.json({ error: 'Faltam dados' }, { status: 400 });
    }

    // Verifica se já existe um aviso pendente para esse cliente e produto (evita duplicatas)
    const [existing]: any = await pool.execute(
      'SELECT id FROM avisos_estoque WHERE produto_id = ? AND usuario_email = ? AND avisado = 0',
      [produto_id, email]
    );

    if (existing.length === 0) {
      await pool.execute(
        'INSERT INTO avisos_estoque (produto_id, usuario_email) VALUES (?, ?)',
        [produto_id, email]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar aviso:', error);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}