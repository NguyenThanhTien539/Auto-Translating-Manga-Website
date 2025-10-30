// const { Pool } = require("pg");
const knex = require("knex");

// module.exports.connectDatabase = async () => {
//   try {
//     const db = new Pool({
//       user: process.env.DB_USER,
//       host: process.env.DB_HOST,
//       database: process.env.DB_NAME,
//       password: process.env.DB_PASSWORD,
//       port: process.env.DB_PORT,
//     });
//     console.log("Connect to database successfully!");
//     return db;
//   } catch (error) {
//     console.log("ERROR when connecting to database!!!!");
//   }
// };

let db;
try {
  db = knex({
    client: process.env.DB_CLIENT,
    connection: {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    },
    pool: { min: 0, max: 10 },
  });
  console.log("Connect to database successfully!");
} catch (error) {
  console.log("ERROR when connecting to database!!!!");
}

module.exports = db;
