// connects to our railway db where we store orders and stuff

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'switchback.proxy.rlwy.net',
  port: process.env.DB_PORT || 53809,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'DkjQxAANMGQdSpvNqKFgIEETSaRUNaTL',
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
