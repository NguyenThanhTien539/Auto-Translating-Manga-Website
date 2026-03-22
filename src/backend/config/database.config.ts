import knex, { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const db: Knex = knex({
  client: process.env.DB_CLIENT,
  connection: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
  },
  pool: { min: 0, max: 10 },
});

db.raw("SELECT 1")
  .then(() => {
    console.log("Connect to database successfully!");
  })
  .catch((error) => {
    console.log("ERROR when connecting to database!!!!");
    console.error(error);
  });

export default db;
