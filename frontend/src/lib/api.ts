import type { Customer, NewOrder, Order, OrderStatus, Paginated, Product } from "./types";

const BASE_URL = "/api";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  return res.json();
}

export interface OrderQuery {
  status?: OrderStatus | "";
  search?: string;
  page?: number;
}

export function fetchOrders(query: OrderQuery = {}, signal?: AbortSignal): Promise<Paginated<Order>> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  if (query.page && query.page > 1) params.set("page", String(query.page));

  const qs = params.toString();
  return request(`/orders${qs ? `?${qs}` : ""}`, { signal });
}

export function fetchCustomers(): Promise<{ data: Customer[] }> {
  return request("/customers");
}

export function fetchProducts(): Promise<{ data: Product[] }> {
  return request("/products");
}

export function createOrder(order: NewOrder, options: { simulateFault?: string } = {}): Promise<{ data: Order }> {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(order),
    headers: options.simulateFault ? { "X-Simulate-Fault": options.simulateFault } : {},
  });
}
