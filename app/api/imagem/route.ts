import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file'); // Ex: produtos/pasta/img.png

  if (!file) {
    return new NextResponse('Arquivo não informado', { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', file);
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Imagem não encontrada', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // Define a extensão para o Content-Type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.gif') contentType = 'image/gif';
    if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Erro interno', { status: 500 });
  }
}