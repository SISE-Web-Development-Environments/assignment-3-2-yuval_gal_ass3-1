require("dotenv").config();
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

// q_create_users = CREATE EXTENSION IF NOT EXISTS "uuid-ossp";CREATE TABLE users (user_id UUID PRIMARY KEY NOT NULL default UUID_GENERATE_V4()::UUID,	username varchar(30) NOT NULL UNIQUE,	password varchar(300) NOT NULL)'
// q_add_user = INSERT INTO users VALUES (default, 'demossed', 'demossed')

client.query("SELECT * FROM users", (err, res) => {
  if (err) throw err;
  // for (let row of res.rows) {
  //   console.log(JSON.stringify(row));
  // }
  console.log(res);

  client.end();
});
