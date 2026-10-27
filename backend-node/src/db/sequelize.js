import { Sequelize } from "sequelize";
import { config } from "../config.js";

export const sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: "mysql",
  logging: config.db.logging ? console.log : false,
  define: { underscored: true },
  pool: { max: 10 },
});
