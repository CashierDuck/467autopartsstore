// connection to the NIU legacy parts database
// needs SSL because we're connecting from outside their network

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'blitz.cs.niu.edu',
  port: 3306,
  user: 'student',
  password: 'student',
  database: 'csci467',
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
