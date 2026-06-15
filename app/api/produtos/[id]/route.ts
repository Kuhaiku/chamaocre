import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';

// ATUALIZAR PRODUTO (PUT)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const data = await request.formData();
    
    const name = data.get('name') as string;
    const line = data.get('line') as string;
    const notes = data.get('notes') as string;
    const feeling = data.get('feeling') as string;
    const burnTime = data.get('burnTime') as string;
    const weight = data.get('weight') as string;
    const price = data.get('price') as string;
    const tag = data.get('tag') as string || '';
    const tagColor = data.get('tagColor') as string || 'bg-stone-500';
    const imagem = data.get('image') as File | null;

    let imageUrl = null;

    // Se uma nova imagem for enviada, fazemos o upload
    if (imagem && imagem.size > 0) {
      const bytes = await imagem.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `${uniqueSuffix}-${imagem.name.replace(/\s+/g, '-')}`;
      
      const uploadDir = path.join(process.cwd(), 'public', 'images');
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      
      imageUrl = `/images/${filename}`;

      // Opcional: Buscar a imagem antiga e apagar do disco para economizar espaço
      const [rows]: any = await pool.execute('SELECT image FROM produtos WHERE id = ?', [id]);
      if (rows.length > 0 && rows[0].image) {
        try {
          const oldFilename = rows[0].image.split('/').pop();
          await unlink(path.join(uploadDir, oldFilename));
        } catch (e) { console.log("Imagem antiga não encontrada para deletar"); }
      }
    }

    // Se tem imagem nova, atualiza com a url da imagem. Se não, atualiza apenas os textos.
    if (imageUrl) {
      const query = `UPDATE produtos SET name=?, line=?, notes=?, feeling=?, burnTime=?, weight=?, price=?, tag=?, tagColor=?, image=? WHERE id=?`;
      await pool.execute(query, [name, line, notes, feeling, burnTime, weight, price, tag, tagColor, imageUrl, id]);
    } else {
      const query = `UPDATE produtos SET name=?, line=?, notes=?, feeling=?, burnTime=?, weight=?, price=?, tag=?, tagColor=? WHERE id=?`;
      await pool.execute(query, [name, line, notes, feeling, burnTime, weight, price, tag, tagColor, id]);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

// DELETAR PRODUTO (DELETE)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // Busca a URL da imagem para deletar o arquivo do servidor
    const [rows]: any = await pool.execute('SELECT image FROM produtos WHERE id = ?', [id]);
    if (rows.length > 0 && rows[0].image) {
      const filename = rows[0].image.split('/').pop();
      const filepath = path.join(process.cwd(), 'public', 'images', filename);
      try {
        await unlink(filepath);
      } catch (err) {
        console.log('Arquivo de imagem não encontrado ou já deletado');
      }
    }

    // Deleta do banco
    await pool.execute('DELETE FROM produtos WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar:', error);
    return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 });
  }
}