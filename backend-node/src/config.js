import { existsSync } from "node:fs";

if (existsSync(new URL("../.env", import.meta.url))) {
  process.loadEnvFile(new URL("../.env", import.meta.url));
}

const env = process.env;

export const config = {
  env: env.NODE_ENV ?? "development",
  port: Number(env.PORT ?? 8000),
  db: {
    host: env.DB_HOST ?? "127.0.0.1",
    port: Number(env.DB_PORT ?? 3307),
    // Tests always use the separate test database so they can never wipe dev data.
    database: env.NODE_ENV === "test" ? (env.DB_TEST_DATABASE ?? "orderdesk_test") : (env.DB_DATABASE ?? "orderdesk"),
    username: env.DB_USERNAME ?? "orderdesk",
    password: env.DB_PASSWORD ?? "secret",
    logging: env.DB_LOGGING === "true",
  },
  faults: {
    orderEvents: env.FAULT_ORDER_EVENTS || null,
  },
};
