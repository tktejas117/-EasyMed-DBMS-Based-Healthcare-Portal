// db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'nodeuser',       // <-- change to your DB user (or 'root')
  password: 'StrongPass123!', // <-- change to your password
  database: 'healthcare',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
