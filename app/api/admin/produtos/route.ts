import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [produtosRows]: any = await pool.execute('SELECT * FROM produtos ORDER BY id DESC');
    const [imagensRows]: any = await pool.execute('SELECT * FROM produto_imagens ORDER BY ordem ASC');

    const produtos = produtosRows.map((produto: any) => ({
      ...produto,
      imagens: imagensRows
        .filter((img: any) => img.produto_id === produto.id)
        .map((img: any) => ({ id: img.id, url: img.imagem_url, ordem: img.ordem }))
    }));

    return NextResponse.json({ produtos });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Inserindo o novo campo peso_comercial
    const [result]: any = await pool.execute(
      `INSERT INTO produtos 
      (\`name\`, \`line\`, \`notes\`, \`feeling\`, \`historia\`, \`price\`, \`image\`, \`tag\`, \`tagColor\`, \`burnTime\`, \`weight\`, \`peso_comercial\`, \`altura\`, \`largura\`, \`comprimento\`, \`estoque\`) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name || '', data.line || '', data.notes || '', data.feeling || '', data.historia || '',
        data.price || '0', data.image || '', data.tag || '', data.tagColor || '#C87A2C', data.burnTime || '',
        data.weight || '0', data.peso_comercial || '', data.altura || '0', data.largura || '0', data.comprimento || '0', data.estoque || 0
      ]
    );

    const produtoId = result.insertId;
    if (data.imagens) {
      for (const img of data.imagens) {
        if (img.url) await pool.execute('INSERT INTO produto_imagens (produto_id, imagem_url, ordem) VALUES (?, ?, ?)', [produtoId, img.url, img.ordem]);
      }
    }
    return NextResponse.json({ success: true, id: produtoId });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    await pool.execute(
      `UPDATE produtos SET 
      \`name\`=?, \`line\`=?, \`notes\`=?, \`feeling\`=?, \`historia\`=?, \`price\`=?, \`image\`=?, \`tag\`=?, \`tagColor\`=?, \`burnTime\`=?, \`weight\`=?, \`peso_comercial\`=?, \`altura\`=?, \`largura\`=?, \`comprimento\`=?, \`estoque\`=? 
      WHERE id=?`,
      [
        data.name, data.line, data.notes, data.feeling, data.historia, data.price, data.image, data.tag, data.tagColor, data.burnTime,
        data.weight, data.peso_comercial, data.altura, data.largura, data.comprimento, data.estoque, data.id
      ]
    );
    // Atualiza imagens... (manter mesma lógica anterior)
    await pool.execute('DELETE FROM produto_imagens WHERE produto_id = ?', [data.id]);
    for (const img of data.imagens) {
      if (img.url) await pool.execute('INSERT INTO produto_imagens (produto_id, imagem_url, ordem) VALUES (?, ?, ?)', [data.id, img.url, img.ordem]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await pool.execute('DELETE FROM produto_imagens WHERE produto_id = ?', [id]);
  await pool.execute('DELETE FROM produtos WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}