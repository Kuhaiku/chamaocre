import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '136.248.87.149', // Mude para o IP do servidor/container em produção
  port: '3051', 
  user: 'root',      // Seu usuário do MySQL
  password: 'sua_senha_aqui', // Sua senha
  database: 'chama_ocre',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;