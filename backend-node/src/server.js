import { createApp } from "./app.js";
import { config } from "./config.js";
import { sequelize } from "./db/sequelize.js";
import "./models/index.js";

await sequelize.authenticate();

createApp().listen(config.port, () => {
  console.log(`OrderDesk API listening on http://localhost:${config.port}`);
});
