import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '@/lib/db';

// Configuração do disparador de e-mails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  auth: {
    user: process.env.EMAIL_USER || 'seuemail@gmail.com',
    pass: process.env.EMAIL_PASS || 'sua_senha_de_app_aqui',
  },
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const action = data.action;

    // ================== REGISTRO ==================
    if (action === 'register') {
      // CORREÇÃO: Adicionado o cpf aqui na desestruturação
      const { nome, email, telefone, senha, cpf } = data; 
      if (!nome || !email || !senha) return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });

      const [existing]: any = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (existing.length > 0) return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 400 });

      const hashedSenha = await bcrypt.hash(senha, 10);
      const [result]: any = await pool.execute(
        'INSERT INTO usuarios (nome, email, telefone, senha, cpf) VALUES (?, ?, ?, ?, ?)',
        // CORREÇÃO: Injetando o cpf no banco ao invés de uma string vazia ''
        [nome, email, telefone || '', hashedSenha, cpf || ''] 
      );

      // CRIANDO O COOKIE PARA O MIDDLEWARE
      const token = crypto.randomBytes(32).toString('hex');
      cookies().set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 semana
      });

      // CORREÇÃO: Devolvendo o cpf para o store do front-end
      return NextResponse.json({ success: true, user: { id: result.insertId, nome, email, telefone, cpf: cpf || '' } });
    }

    // ================== LOGIN ==================
    if (action === 'login') {
      const { email, senha } = data;
      if (!email || !senha) return NextResponse.json({ error: 'Preencha e-mail e senha' }, { status: 400 });

      const [users]: any = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
      if (users.length === 0) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

      const user = users[0];
      const isValid = await bcrypt.compare(senha, user.senha);
      if (!isValid) return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });

      // CRIANDO O COOKIE PARA O MIDDLEWARE
      const token = crypto.randomBytes(32).toString('hex');
      cookies().set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 semana
      });

      // CORREÇÃO: Devolvendo o cpf do banco de dados para o front-end
      return NextResponse.json({ success: true, user: { id: user.id, nome: user.nome, email: user.email, telefone: user.telefone, cpf: user.cpf } });
    }

    // ================== ATUALIZAR PERFIL ==================
    if (action === 'update_profile') {
      // CORREÇÃO: Lendo o cpf do data
      const { id, nome, telefone, cpf } = data;
      if (!id || !nome) return NextResponse.json({ error: 'ID e Nome são obrigatórios' }, { status: 400 });

      // CORREÇÃO: Atualizando o CPF no banco de dados também
      await pool.execute('UPDATE usuarios SET nome = ?, telefone = ?, cpf = ? WHERE id = ?', [nome, telefone || '', cpf || '', id]);
      
      // CORREÇÃO: Retornando os dados com o cpf atualizado
      return NextResponse.json({ success: true, user: { id, nome, telefone, cpf } });
    }

    // ================== ESQUECI A SENHA ==================
    if (action === 'forgot_password') {
      const { email } = data;
      if (!email) return NextResponse.json({ error: 'Preencha o e-mail' }, { status: 400 });

      const [users]: any = await pool.execute('SELECT id, nome FROM usuarios WHERE email = ?', [email]);
      if (users.length === 0) return NextResponse.json({ error: 'E-mail não encontrado' }, { status: 404 });

      const token = crypto.randomBytes(32).toString('hex');

      await pool.execute(
        'INSERT INTO recuperacao_senha (email, token, expiracao) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))', 
        [email, token]
      );

      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      const resetLink = `${appUrl}/reset-senha?token=${token}`;
      const logoUrl = `${appUrl}/images/Logofaixa.png`;
      
      const [ultimosProdutos]: any = await pool.execute(
        'SELECT id, name, price, image FROM produtos ORDER BY id DESC LIMIT 3'
      );

      const produtosHTML = ultimosProdutos.map((p: any) => `
        <td width="33%" align="center" style="padding: 10px; vertical-align: top;">
            <a href="${appUrl}/produto/${p.id}" style="text-decoration: none; color: #333;">
                <img src="${appUrl}${p.image}" alt="${p.name}" style="width: 100%; max-width: 120px; height: 120px; object-fit: cover; border-radius: 4px; background-color: #f4f4f4;">
                <p style="font-size: 14px; margin: 10px 0 5px 0; font-weight: bold; color: #333333;">${p.name}</p>
                <p style="font-size: 14px; color: #C17722; margin: 0 0 10px 0;">R$ ${Number(p.price).toFixed(2).replace('.', ',')}</p>
            </a>
        </td>
      `).join('');

      const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de Senha - Chama Ocre</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 40px 0;">
              <tr>
                  <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                          <tr>
                              <td align="center" style="padding: 30px 20px 20px 20px;">
                                  <img src="${logoUrl}" alt="Logo Chama Ocre" style="max-width: 180px; height: auto; display: block; border: none;" />
                              </td>
                          </tr>
                          <tr>
                              <td align="center" style="background-color: #C17722; padding: 30px 20px;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Recuperação de Senha</h1>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 40px 30px 20px 30px; line-height: 1.6;">
                                  <p style="margin: 0 0 20px 0; font-size: 16px;">Olá <strong>${users[0].nome}</strong>,</p>
                                  <p style="margin: 0 0 20px 0; font-size: 16px;">Você solicitou a recuperação de senha. Clique no botão abaixo para criar uma nova senha:</p>
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                      <tr>
                                          <td align="center" style="padding: 10px 0 30px 0;">
                                              <a href="${resetLink}" style="background-color: #C17722; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 4px; display: inline-block;">Criar Nova Senha</a>
                                          </td>
                                      </tr>
                                  </table>
                                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #666666;">
                                      Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
                                      <a href="${resetLink}" style="color: #C17722; word-break: break-all;">${resetLink}</a>
                                  </p>
                                  <p style="margin: 0; font-size: 14px; font-weight: bold; color: #d9534f;">Este link expira em 1 hora.</p>
                              </td>
                          </tr>
                          ${ultimosProdutos.length > 0 ? `
                          <tr>
                              <td style="padding: 0 30px 30px 30px;">
                                  <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 30px;">
                                  <h2 style="font-size: 18px; color: #333333; text-align: center; margin-bottom: 20px;">Aproveite e confira nossas novidades:</h2>
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                      <tr>
                                          ${produtosHTML}
                                      </tr>
                                  </table>
                              </td>
                          </tr>
                          ` : ''}
                          <tr>
                              <td align="center" style="padding: 20px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
                                  <p style="margin: 0;">Caso não tenha solicitado essa alteração, por favor ignore este e-mail.</p>
                                  <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Chama Ocre. Todos os direitos reservados.</p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
      `;

      try {
        await transporter.sendMail({
          from: '"Chama Ocre" <nao-responda@chamaocre.com>',
          to: email,
          subject: 'Recuperação de Senha - Chama Ocre',
          html: emailHtml,
        });
      } catch (e) {
        console.error("Erro ao enviar email:", e);
      }

      return NextResponse.json({ success: true, message: 'Se o e-mail existir, um link de recuperação foi enviado.' });
    }

    // ================== REDEFINIR SENHA ==================
    if (action === 'reset_password') {
      const { token, novaSenha } = data;
      if (!token || !novaSenha) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

      const [tokens]: any = await pool.execute('SELECT email FROM recuperacao_senha WHERE token = ? AND expiracao > NOW()', [token]);
      if (tokens.length === 0) return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });

      const email = tokens[0].email;
      const hashedSenha = await bcrypt.hash(novaSenha, 10);

      await pool.execute('UPDATE usuarios SET senha = ? WHERE email = ?', [hashedSenha, email]);
      await pool.execute('DELETE FROM recuperacao_senha WHERE email = ?', [email]); 

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API de Auth:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
