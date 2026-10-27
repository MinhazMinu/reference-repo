import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { Order, OrderEvent, OrderItem } from "../src/models/index.js";
import { createCustomer, createProduct } from "./helpers.js";

const app = createApp();

let customer, kettle, mug;

beforeEach(async () => {
  customer = await createCustomer();
  kettle = await createProduct({ priceCents: 4000, stock: 5 });
  mug = await createProduct({ priceCents: 1000, stock: 1 });
});

const payload = (mugQuantity = 1) => ({
  customer_id: customer.id,
  items: [
    { product_id: kettle.id, quantity: 2 },
    { product_id: mug.id, quantity: mugQuantity },
  ],
});

async function expectNothingWritten() {
  expect(await Order.count(), "An order row was left behind.").toBe(0);
  expect(await OrderItem.count(), "Order item rows were left behind.").toBe(0);
  expect(await OrderEvent.count(), "Order event rows were left behind.").toBe(0);
  expect((await kettle.reload()).stock, "Kettle stock was not restored.").toBe(5);
  expect((await mug.reload()).stock, "Mug stock was not restored.").toBe(1);
}

describe("POST /api/orders", () => {
  it("places an order", async () => {
    const res = await request(app).post("/api/orders").send(payload()).expect(201);

    expect(res.body.data).toMatchObject({ total_cents: 9000, item_count: 3 });
    expect((await kettle.reload()).stock).toBe(3);
    expect((await mug.reload()).stock).toBe(0);
    expect(await OrderEvent.count({ where: { type: "order.placed" } })).toBe(1);
  });

  it("rejects insufficient stock without side effects", async () => {
    const res = await request(app).post("/api/orders").send(payload(2)).expect(422);

    expect(res.body.errors).toHaveProperty("items");
    await expectNothingWritten();
  });

  it("leaves no partial order when a database write fails", async () => {
    const res = await request(app).post("/api/orders").set("X-Simulate-Fault", "table_full").send(payload());

    expect(res.status).toBe(503);
    expect(Object.keys(res.body)).toEqual(["message"]);
    expect(res.body.message).not.toMatch(/insert|order_events|ER_|SQLSTATE|table is full/i);
    await expectNothingWritten();
  });

  it("retries a transient deadlock and places the order exactly once", async () => {
    await request(app).post("/api/orders").set("X-Simulate-Fault", "deadlock_once").send(payload()).expect(201);

    expect(await Order.count()).toBe(1);
    expect(await OrderItem.count()).toBe(2);
    expect(await OrderEvent.count()).toBe(1);
    expect((await kettle.reload()).stock, "Stock was decremented more than once.").toBe(3);
  });
});
