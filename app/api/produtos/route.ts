import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    
    const nome = data.get('nome') as string;
    const preco = data.get('preco') as string;
    const estoque = data.get('estoque') as string;
    const descricao = data.get('descricao') as string;
    const imagem = data.get('imagem') as File;

    if (!imagem || !nome || !preco || !estoque || !descricao) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // Processar e Salvar a Imagem
    const bytes = await imagem.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Nome único para evitar sobreposição de arquivos
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${imagem.name.replace(/\s+/g, '-')}`;
    
    // Caminho para salvar a imagem (public/uploads)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filepath = path.join(uploadDir, filename);

    // Garante que a pasta uploads existe
    await mkdir(uploadDir, { recursive: true });
    
    // Escreve o arquivo no disco
    await writeFile(filepath, buffer);
    const imagemUrl = `/uploads/${filename}`;

    // Salvar no MySQL
    const query = `
      INSERT INTO produtos (nome, preco, estoque, descricao, imagem_url) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [nome, parseFloat(preco), parseInt(estoque), descricao, imagemUrl];
    
    const [result] = await pool.execute(query, values);

    return NextResponse.json({ 
      success: true, 
      message: 'Produto cadastrado com sucesso!',
      produtoId: (result as any).insertId 
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar produto' }, { status: 500 });
  }
}