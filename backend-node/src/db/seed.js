// Re-creates the schema and fills it with demo data: `npm run db:seed`.
import { sequelize } from "./sequelize.js";
import { Customer, Order, OrderItem, Product, ORDER_STATUSES } from "../models/index.js";

const FIRST = ["Alice", "Bilal", "Chen", "Dana", "Emeka", "Farah", "Gustavo", "Hana", "Ivan", "Jia", "Kofi", "Lena", "Mateo"];
const LAST = ["Moreno", "Khan", "Wei", "Novak", "Okafor", "Haddad", "Silva", "Sato", "Petrov", "Li", "Mensah", "Berg"];
const PRODUCTS = ["Ceramic mug", "Pour-over set", "Tea tin", "French press", "Milk frother", "Glass carafe", "Bamboo tray",
  "Coffee grinder", "Travel tumbler", "Espresso cups", "Tea infuser", "Cold brew jar", "Scale", "Filter papers", "Kettle"];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const between = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

await sequelize.sync({ force: true });

const customers = await Customer.bulkCreate(
  Array.from({ length: 25 }, (_, i) => {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    return { name, email: `${name.toLowerCase().replace(" ", ".")}.${i}@example.com`, tier: pick(["standard", "standard", "gold"]) };
  }),
);

const products = await Product.bulkCreate(
  PRODUCTS.map((name, i) => ({ sku: `SKU-${String(i + 1).padStart(4, "0")}`, name, priceCents: between(500, 25000), stock: between(10, 200) })),
);

// A product that is nearly sold out, handy for testing stock errors from the UI.
await Product.create({ sku: "LIMITED-001", name: "Limited edition kettle", priceCents: 8900, stock: 3 });

for (let i = 1; i <= 120; i++) {
  const order = await Order.create({
    reference: `ORD-${String(i).padStart(6, "0")}`,
    customerId: pick(customers).id,
    status: pick(ORDER_STATUSES),
    placedAt: new Date(Date.now() - between(0, 60) * 86_400_000),
  });

  const lines = [...products].sort(() => Math.random() - 0.5).slice(0, between(1, 4));
  const items = await OrderItem.bulkCreate(
    lines.map((p) => ({ orderId: order.id, productId: p.id, quantity: between(1, 5), unitPriceCents: p.priceCents })),
  );

  await order.update({ totalCents: items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0) });
}

console.log("Seeded 25 customers, 16 products and 120 orders.");
await sequelize.close();
