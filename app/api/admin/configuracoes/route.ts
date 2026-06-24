import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows]: any = await pool.execute('SELECT modo_teste, transportadoras_ativas, melhor_envio_token FROM configuracoes WHERE id = 1 LIMIT 1');
    if (rows.length > 0) {
      const transportadoras = typeof rows[0].transportadoras_ativas === 'string' 
        ? JSON.parse(rows[0].transportadoras_ativas) 
        : rows[0].transportadoras_ativas;
        
      return NextResponse.json({ 
        transportadoras, 
        modo_teste: Boolean(rows[0].modo_teste),
        melhor_envio_token: rows[0].melhor_envio_token || '' 
      });
    }
    return NextResponse.json({ transportadoras: [], modo_teste: true, melhor_envio_token: '' });
  } catch (error) {
    console.error('Erro GET config:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { transportadoras, modo_teste, melhor_envio_token } = await request.json();
    
    // O "|| null" garante que o MySQL não receba 'undefined', o que causava o erro 500
    await pool.execute(
      'UPDATE configuracoes SET transportadoras_ativas = ?, modo_teste = ?, melhor_envio_token = ? WHERE id = 1', 
      [
        JSON.stringify(transportadoras || []), 
        modo_teste ? 1 : 0, 
        melhor_envio_token || null
      ]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro PUT config:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}