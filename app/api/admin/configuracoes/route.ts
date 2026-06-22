import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows]: any = await pool.execute('SELECT transportadoras_ativas FROM configuracoes LIMIT 1');
    if (rows.length > 0) {
      // O banco retorna uma string JSON, precisamos converter para array
      const transportadoras = typeof rows[0].transportadoras_ativas === 'string' 
        ? JSON.parse(rows[0].transportadoras_ativas) 
        : rows[0].transportadoras_ativas;
        
      return NextResponse.json({ transportadoras });
    }
    return NextResponse.json({ transportadoras: [] });
  } catch (error) {
    console.error('Erro ao buscar config:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { transportadoras } = await request.json();
    await pool.execute(
      'UPDATE configuracoes SET transportadoras_ativas = ? WHERE id = 1', 
      [JSON.stringify(transportadoras)]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar config:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}