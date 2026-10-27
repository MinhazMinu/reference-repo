"use client";

import { FormEvent, useEffect, useState } from "react";
import { createOrder, fetchCustomers, fetchProducts } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Customer, Product } from "@/lib/types";

interface Line {
  productId: string;
  quantity: number;
}

const emptyLine = (): Line => ({ productId: "", quantity: 1 });

export default function NewOrderForm({ simulateFault }: { simulateFault?: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers().then((res) => setCustomers(res.data));
    fetchProducts().then((res) => setProducts(res.data));
  }, []);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSuccess(null);
    setError(null);
    setSubmitting(true);

    try {
      const res = await createOrder(
        {
          customer_id: Number(customerId),
          items: lines.map((line) => ({ product_id: Number(line.productId), quantity: line.quantity })),
        },
        { simulateFault },
      );

      setSuccess(`Order ${res.data.reference} placed for ${formatMoney(res.data.total_cents)}.`);
      setCustomerId("");
      setLines([emptyLine()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      {success && <p role="status" className="notice">{success}</p>}
      {error && <p role="alert" className="alert">{error}</p>}

      <label>
        Customer
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
          <option value="">Select a customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      {lines.map((line, index) => (
        <div className="line" key={index}>
          <label>
            Product
            <select value={line.productId} onChange={(e) => updateLine(index, { productId: e.target.value })} required>
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatMoney(p.price_cents)}, {p.stock} in stock)
                </option>
              ))}
            </select>
          </label>
          <label>
            Qty
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
            />
          </label>
          <button
            type="button"
            className="secondary"
            onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
            disabled={lines.length === 1}
          >
            Remove
          </button>
        </div>
      ))}

      <div>
        <button type="button" className="secondary" onClick={() => setLines((current) => [...current, emptyLine()])}>
          Add line
        </button>
      </div>

      <div>
        <button type="submit" disabled={submitting}>
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </div>
    </form>
  );
}
