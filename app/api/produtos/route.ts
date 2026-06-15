import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    
    const name = data.get('name') as string;
    const line = data.get('line') as string;
    const notes = data.get('notes') as string;
    const feeling = data.get('feeling') as string;
    const burnTime = data.get('burnTime') as string;
    const weight = data.get('weight') as string;
    const price = data.get('price') as string; // Mantido como string (ex: "R$ 89,90")
    const tag = data.get('tag') as string || '';
    const tagColor = data.get('tagColor') as string || 'bg-stone-500';
    const imagem = data.get('image') as File;

    if (!imagem || !name || !price) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const bytes = await imagem.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${imagem.name.replace(/\s+/g, '-')}`;
    
    const uploadDir = path.join(process.cwd(), 'public', 'images'); // Salvando na pasta images para manter seu padrão
    const filepath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filepath, buffer);
    
    const imageUrl = `/images/${filename}`;

    const query = `
      INSERT INTO produtos (name, line, notes, feeling, burnTime, weight, price, tag, tagColor, image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [name, line, notes, feeling, burnTime, weight, price, tag, tagColor, imageUrl];
    
    const [result] = await pool.execute(query, values);

    return NextResponse.json({ success: true, id: (result as any).insertId });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar produto' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const query = 'SELECT * FROM produtos ORDER BY criado_em DESC';
    const [rows] = await pool.execute(query);
    return NextResponse.json({ produtos: rows });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}