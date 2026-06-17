import { NextResponse } from 'next/server';
import { writeFile, unlink, rm, mkdir } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';

const sanitizeName = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

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
        
        // Busca a imagem atual para descobrir em qual pasta ela está
        const [rows]: any = await pool.execute('SELECT image FROM produtos WHERE id = ?', [id]);
        let safeFolderName = '';
        
        if (rows.length > 0 && rows[0].image) {
          // Extrai o nome da pasta da URL antiga (Ex: /produtos/vela-bosque/img.png -> vela-bosque)
          const parts = rows[0].image.split('/');
          if (parts[1] === 'produtos' && parts.length >= 3) {
            safeFolderName = parts[2];
          }
        }
        
        // Se por algum motivo não achar a pasta antiga, cria uma baseada no nome atual
        if (!safeFolderName) {
           safeFolderName = sanitizeName(name) || `produto-${id}`;
        }

        const uploadDir = path.join(process.cwd(), 'public', 'produtos', safeFolderName);
        await mkdir(uploadDir, { recursive: true }); // Garante que a pasta existe

        const bytes = await imagem.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `${uniqueSuffix}-${imagem.name.replace(/\s+/g, '-')}`;
        const filepath = path.join(uploadDir, filename);
        
        await writeFile(filepath, buffer);
        imageUrlCapa = `/produtos/${safeFolderName}/${filename}`;

        // Deleta a foto de capa antiga
        if (rows.length > 0 && rows[0].image) {
          try {
            // Reconstrói o caminho completo a partir da URL guardada no banco
            const oldPathParts = rows[0].image.split('/').filter(Boolean);
            const oldFilepath = path.join(process.cwd(), 'public', ...oldPathParts);
            await unlink(oldFilepath);
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
    
    // Pega o caminho da imagem e deleta a PASTA INTEIRA do produto
    if (rows.length > 0 && rows[0].image) {
      const parts = rows[0].image.split('/');
      if (parts[1] === 'produtos' && parts.length >= 3) {
        const folderName = parts[2];
        const folderPath = path.join(process.cwd(), 'public', 'produtos', folderName);
        try {
          // rm(..., { recursive: true }) é igual a deletar a pasta e tudo que tem dentro
          await rm(folderPath, { recursive: true, force: true });
        } catch (err) {
          console.log('Pasta não encontrada ou já deletada');
        }
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