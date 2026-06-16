import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    
    const name = data.get('name') as string;
    const line = data.get('line') as string;
    const historia = data.get('historia') as string;
    const notes = data.get('notes') as string;
    const feeling = data.get('feeling') as string;
    const burnTime = data.get('burnTime') as string;
    const weight = data.get('weight') as string;
    const price = data.get('price') as string;
    const estoque = data.get('estoque') as string;
    const tag = data.get('tag') as string || '';
    const tagColor = data.get('tagColor') as string || 'bg-stone-500';
    
    // Novas dimensões
    const altura = data.get('altura') as string || '0';
    const largura = data.get('largura') as string || '0';
    const comprimento = data.get('comprimento') as string || '0';
    
    const totalImagens = parseInt(data.get('total_imagens') as string || '0');

    if (totalImagens === 0 || !name || !price) {
      return NextResponse.json({ error: 'Campos obrigatórios ou imagens faltando' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'images');
    await mkdir(uploadDir, { recursive: true });

    let imageUrlCapa = '';
    const imagensSalvas = [];

    for (let i = 0; i < totalImagens; i++) {
      const imagem = data.get(`imagem_${i}`) as File;
      
      if (imagem && imagem.size > 0) {
        const bytes = await imagem.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `${uniqueSuffix}-${imagem.name.replace(/\s+/g, '-')}`;
        const filepath = path.join(uploadDir, filename);
        
        await writeFile(filepath, buffer);
        const url = `/images/${filename}`;
        
        imagensSalvas.push({ url, ordem: i });
        
        if (i === 0) {
          imageUrlCapa = url;
        }
      }
    }

    const queryProd = `
      INSERT INTO produtos (name, line, historia, notes, feeling, burnTime, weight, price, tag, tagColor, image, altura, largura, comprimento) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [resultProd] = await pool.execute(queryProd, [
      name, line, historia, notes, feeling, burnTime, weight, price, tag, tagColor, imageUrlCapa, altura, largura, comprimento
    ]);
    
    const produtoId = (resultProd as any).insertId;

    if (imagensSalvas.length > 0) {
      const queryGaleria = `INSERT INTO produto_imagens (produto_id, imagem_url, ordem) VALUES (?, ?, ?)`;
      for (const img of imagensSalvas) {
        await pool.execute(queryGaleria, [produtoId, img.url, img.ordem]);
      }
    }

    return NextResponse.json({ success: true, id: produtoId });

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