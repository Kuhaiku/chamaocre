import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;
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
    
    const altura = data.get('altura') as string || '0';
    const largura = data.get('largura') as string || '0';
    const comprimento = data.get('comprimento') as string || '0';
    
    const totalImagens = parseInt(data.get('total_imagens') as string || '0');

    let imageUrlCapa = null;

    if (totalImagens > 0) {
      const imagem = data.get(`imagem_0`) as File;
      if (imagem && imagem.size > 0) {
        const bytes = await imagem.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `${uniqueSuffix}-${imagem.name.replace(/\s+/g, '-')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'images');
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);
        imageUrlCapa = `/images/${filename}`;

        const [rows]: any = await pool.execute('SELECT image FROM produtos WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].image) {
          try {
            const oldFilename = rows[0].image.split('/').pop();
            await unlink(path.join(uploadDir, oldFilename));
          } catch (e) { console.log("Imagem antiga não encontrada para deletar"); }
        }
      }
    }

    if (imageUrlCapa) {
      const query = `UPDATE produtos SET name=?, line=?, historia=?, notes=?, feeling=?, burnTime=?, weight=?, price=?, estoque=?, tag=?, tagColor=?, altura=?, largura=?, comprimento=?, image=? WHERE id=?`;
      await pool.execute(query, [name, line, historia, notes, feeling, burnTime, weight, price, estoque, tag, tagColor, altura, largura, comprimento, imageUrlCapa, id]);
    } else {
      const query = `UPDATE produtos SET name=?, line=?, historia=?, notes=?, feeling=?, burnTime=?, weight=?, price=?, estoque=?, tag=?, tagColor=?, altura=?, largura=?, comprimento=? WHERE id=?`;
      await pool.execute(query, [name, line, historia, notes, feeling, burnTime, weight, price, estoque, tag, tagColor, altura, largura, comprimento, id]);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;

    const [rows]: any = await pool.execute('SELECT image FROM produtos WHERE id = ?', [id]);
    if (rows.length > 0 && rows[0].image) {
      const filename = rows[0].image.split('/').pop();
      const filepath = path.join(process.cwd(), 'public', 'images', filename);
      try {
        await unlink(filepath);
      } catch (err) {
        console.log('Arquivo não encontrado');
      }
    }

    await pool.execute('DELETE FROM produtos WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar:', error);
    return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 });
  }
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;

    const [produtoRows]: any = await pool.execute('SELECT * FROM produtos WHERE id = ?', [id]);
    if (produtoRows.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    
    const produto = produtoRows[0];
    const [galeriaRows]: any = await pool.execute('SELECT imagem_url FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC', [id]);

    const produtoCompleto = {
      ...produto,
      galeria: galeriaRows.map((g: any) => g.imagem_url)
    };

    return NextResponse.json({ produto: produtoCompleto });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}