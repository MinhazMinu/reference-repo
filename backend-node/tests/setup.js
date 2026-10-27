import { afterAll, beforeAll, beforeEach } from "vitest";
import { sequelize } from "../src/db/sequelize.js";
import "../src/models/index.js";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of ["order_events", "order_items", "orders", "products", "customers"]) {
    await sequelize.query(`TRUNCATE TABLE \`${table}\``);
  }
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
});

afterAll(async () => {
  await sequelize.close();
});
