import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '136.248.87.149',
  port: 3051, // Convertido para number, que é o formato exigido pelo mysql2
  user: 'root',
  password: 'Raposo88125442@@',
  database: 'chama_ocre',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;