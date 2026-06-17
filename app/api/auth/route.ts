import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const action = data.action; // Define se é 'login' ou 'register'

    // ================== ROTA DE REGISTRO ==================
    if (action === 'register') {
      const { nome, email, telefone, senha } = data;

      if (!nome || !email || !senha) {
        return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
      }

      // 1. Verifica se o email já existe
      const [existing]: any = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
      if (existing.length > 0) {
        return NextResponse.json({ error: 'E-mail já cadastrado. Faça login.' }, { status: 400 });
      }

      // 2. Criptografa a senha
      const hashedSenha = await bcrypt.hash(senha, 10);

      // 3. Salva no banco (CPF vai vazio por enquanto)
      const query = `INSERT INTO usuarios (nome, email, telefone, senha, cpf) VALUES (?, ?, ?, ?, ?)`;
      const [result]: any = await pool.execute(query, [nome, email, telefone || '', hashedSenha, '']);

      return NextResponse.json({ 
        success: true, 
        user: { id: result.insertId, nome, email, telefone } 
      });
    }

    // ================== ROTA DE LOGIN ==================
    if (action === 'login') {
      const { email, senha } = data;

      if (!email || !senha) {
        return NextResponse.json({ error: 'Preencha e-mail e senha' }, { status: 400 });
      }

      // 1. Busca o usuário pelo e-mail
      const [users]: any = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
      if (users.length === 0) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }

      const user = users[0];

      // 2. Compara as senhas
      const isValid = await bcrypt.compare(senha, user.senha);
      if (!isValid) {
        return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
      }

      // 3. Devolve os dados com sucesso
      return NextResponse.json({ 
        success: true, 
        user: { id: user.id, nome: user.nome, email: user.email, telefone: user.telefone } 
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API de Auth:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}