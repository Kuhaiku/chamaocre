import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';

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
    if (data.imagens) {
      for (const img of data.imagens) {
        if (img.url) await pool.execute('INSERT INTO produto_imagens (produto_id, imagem_url, ordem) VALUES (?, ?, ?)', [data.id, img.url, img.ordem]);
      }
    }

    // --- GATILHO DE AVISO DE ESTOQUE ---
    if (Number(data.estoque) > 0) {
      const [avisos]: any = await pool.execute(
        'SELECT id, usuario_email FROM avisos_estoque WHERE produto_id = ? AND avisado = 0',
        [data.id]
      );

      if (avisos.length > 0) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: Number(process.env.EMAIL_PORT) || 587,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        for (const aviso of avisos) {
          const linkProduto = `${process.env.NEXT_PUBLIC_APP_URL}/produto/${data.id}`;

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 30px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #C87A2C; margin: 0;">Boas notícias! ✨</h2>
              </div>
              <p style="font-size: 16px;">A essência que estava à espera acabou de voltar ao nosso estoque!</p>
              <p style="font-size: 16px; line-height: 1.5;">O estoque é limitado e feito de forma artesanal. Garanta a sua vela antes que acabe novamente.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${linkProduto}" style="display: inline-block; padding: 14px 28px; background-color: #C87A2C; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Garantir a Minha</a>
              </div>
              
              <p style="margin-top: 40px; font-size: 13px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                Com carinho,<br>Equipa Chama Ocre Ateliê
              </p>
            </div>
          `;

          try {
            await transporter.sendMail({
              from: '"Chama Ocre" <nao-responda@chamaocre.com>',
              to: aviso.usuario_email,
              subject: `Voltou ao estoque! Não perca!`,
              html: emailHtml,
            });
            
            // Marca no banco que esse cliente já foi avisado
            await pool.execute('UPDATE avisos_estoque SET avisado = 1 WHERE id = ?', [aviso.id]);
            console.log(`[Aviso de Estoque] E-mail enviado para ${aviso.usuario_email}`);
          } catch (err) {
            console.error('Erro ao enviar email de aviso:', err);
          }
        }
      }
    }
    // -----------------------------------

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