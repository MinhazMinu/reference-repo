import { Router } from "express";
import { Customer, Product } from "../models/index.js";

export const catalogRouter = Router();

catalogRouter.get("/customers", async (req, res) => {
  const customers = await Customer.findAll({ attributes: ["id", "name", "email"], order: [["name", "ASC"]] });
  res.json({ data: customers });
});

catalogRouter.get("/products", async (req, res) => {
  const products = await Product.findAll({ order: [["name", "ASC"]] });
  res.json({
    data: products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, price_cents: p.priceCents, stock: p.stock })),
  });
});
