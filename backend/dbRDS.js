const mysql = require('mysql2/promise');
require('dotenv').config();

const rdsPool = mysql.createPool({
  host:               process.env.RDS_HOST,
  user:               process.env.RDS_USER,
  password:           process.env.RDS_PASSWORD,
  database:           process.env.RDS_NAME,
  port:               3306,
  waitForConnections: true,
  connectionLimit:    5,
  charset:            'utf8mb4',
});

module.exports = rdsPool;
