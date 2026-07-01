import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const folder: string = data.get('folder') as string || 'geral'; // Pega o nome da pasta enviado

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cria um nome único para o arquivo
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`;
    
    // Caminho correto: public/produtos/nome-do-produto/
    const uploadDir = path.join(process.cwd(), 'public', 'produtos', folder);
    
    // Cria a pasta do produto se ela não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Retorna a URL chamando a nova rota dinâmica de leitura
    return NextResponse.json({ 
      success: true, 
      url: `/api/imagem?file=produtos/${folder}/${filename}` 
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Falha no upload da imagem.' }, { status: 500 });
  }
}