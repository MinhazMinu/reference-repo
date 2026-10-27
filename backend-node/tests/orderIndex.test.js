import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { countQueries, createCustomer, createOrder, createOrderItem } from "./helpers.js";

const app = createApp();

describe("GET /api/orders", () => {
  it("lists orders with customer and items", async () => {
    const order = await createOrder({ status: "paid" });
    await createOrderItem({ orderId: order.id, quantity: 3 });
    await createOrderItem({ orderId: order.id, quantity: 3 });

    const res = await request(app).get("/api/orders").expect(200);

    expect(res.body.data[0]).toMatchObject({
      id: order.id,
      reference: order.reference,
      status: "paid",
      item_count: 6,
      customer: { lifetime_orders: 1 },
    });
    expect(res.body.data[0].items).toHaveLength(2);
    expect(Object.keys(res.body.data[0].items[0])).toEqual(["id", "sku", "name", "quantity", "unit_price_cents"]);
    expect(res.body.meta).toMatchObject({ current_page: 1, last_page: 1, total: 1 });
  });

  it("uses a constant number of queries", async () => {
    for (let i = 0; i < 15; i++) {
      const order = await createOrder();
      for (let j = 0; j < 3; j++) await createOrderItem({ orderId: order.id });
    }

    let res;
    const queries = await countQueries(async () => {
      res = await request(app).get("/api/orders?per_page=15");
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(15);
    expect(queries, `GET /api/orders ran ${queries} queries for 15 orders.`).toBeLessThanOrEqual(6);
  });

  it("combines the status and search filters", async () => {
    const alice = await createCustomer({ name: "Alice Moreno" });
    const paid = await createOrder({ customerId: alice.id, status: "paid" });
    await createOrder({ customerId: alice.id, status: "cancelled" });
    await createOrder({ status: "paid" });

    const res = await request(app).get("/api/orders?status=paid&search=Moreno").expect(200);

    expect(res.body.data.map((o) => o.id)).toEqual([paid.id]);
  });
});
