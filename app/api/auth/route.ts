import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '@/lib/db';

// Configuração do disparador de e-mails (Substitua pelos seus dados reais depois)
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

    if (action === 'register') {
      const { nome, email, telefone, senha } = data;
      if (!nome || !email || !senha) return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });

      const [existing]: any = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (existing.length > 0) return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 400 });

      const hashedSenha = await bcrypt.hash(senha, 10);
      const [result]: any = await pool.execute(
        'INSERT INTO usuarios (nome, email, telefone, senha, cpf) VALUES (?, ?, ?, ?, ?)',
        [nome, email, telefone || '', hashedSenha, '']
      );

      return NextResponse.json({ success: true, user: { id: result.insertId, nome, email, telefone } });
    }

    if (action === 'login') {
      const { email, senha } = data;
      if (!email || !senha) return NextResponse.json({ error: 'Preencha e-mail e senha' }, { status: 400 });

      const [users]: any = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
      if (users.length === 0) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

      const user = users[0];
      const isValid = await bcrypt.compare(senha, user.senha);
      if (!isValid) return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });

      return NextResponse.json({ success: true, user: { id: user.id, nome: user.nome, email: user.email, telefone: user.telefone } });
    }

    // ================== ATUALIZAR PERFIL ==================
    if (action === 'update_profile') {
      const { id, nome, telefone } = data;
      if (!id || !nome) return NextResponse.json({ error: 'ID e Nome são obrigatórios' }, { status: 400 });

      await pool.execute('UPDATE usuarios SET nome = ?, telefone = ? WHERE id = ?', [nome, telefone || '', id]);
      return NextResponse.json({ success: true, user: { id, nome, telefone } });
    }

    // ================== ESQUECI A SENHA ==================
    if (action === 'forgot_password') {
      const { email } = data;
      if (!email) return NextResponse.json({ error: 'Preencha o e-mail' }, { status: 400 });

      const [users]: any = await pool.execute('SELECT id, nome FROM usuarios WHERE email = ?', [email]);
      if (users.length === 0) return NextResponse.json({ error: 'E-mail não encontrado' }, { status: 404 });

      const token = crypto.randomBytes(32).toString('hex');
      const expiracao = new Date(Date.now() + 3600000); // 1 hora de validade

      await pool.execute('INSERT INTO recuperacao_senha (email, token, expiracao) VALUES (?, ?, ?)', [email, token, expiracao]);

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-senha?token=${token}`;
      
      try {
        await transporter.sendMail({
          from: '"Chama Ocre" <nao-responda@chamaocre.com>',
          to: email,
          subject: 'Recuperação de Senha - Chama Ocre',
          html: `<p>Olá ${users[0].nome},</p><p>Você solicitou a recuperação de senha. Clique no link abaixo para criar uma nova senha:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Este link expira em 1 hora.</p>`,
        });
      } catch (e) {
        console.error("Erro ao enviar email. Configure as credenciais no .env.", e);
        // Ocultar erro de email em dev para não travar o fluxo se o SMTP não estiver configurado ainda
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
      await pool.execute('DELETE FROM recuperacao_senha WHERE email = ?', [email]); // Limpa os tokens usados

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API de Auth:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}