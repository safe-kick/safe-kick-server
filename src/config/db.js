const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: false,
});

pool.connect()
  .then(client => {
    console.log("✅ PostgreSQL Connected");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL Connection Error");
    console.error(err);
  });

module.exports = pool;