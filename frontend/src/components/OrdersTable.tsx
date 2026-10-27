"use client";

import { useEffect, useState } from "react";
import OrderFilters from "@/components/OrderFilters";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchOrders } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { Order, OrderStatus, Paginated } from "@/lib/types";

export default function OrdersTable() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [response, setResponse] = useState<{ key: string; result?: Paginated<Order>; error?: string } | null>(null);

  const queryKey = JSON.stringify([status, debouncedSearch, page]);
  const loading = response?.key !== queryKey;
  const result = response?.result;
  const error = loading ? null : response?.error;

  useEffect(() => {
    // Abort the in-flight request whenever the query changes so a slow response
    // for an old page/filter can never overwrite the current one.
    const controller = new AbortController();

    fetchOrders({ status, search: debouncedSearch, page }, controller.signal)
      .then((res) => setResponse({ key: queryKey, result: res }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResponse((prev) => ({ key: queryKey, result: prev?.result, error: err.message }));
      });

    return () => controller.abort();
  }, [status, debouncedSearch, page, queryKey]);

  // A new filter means a new result set, so start again from its first page.
  function changeStatus(next: OrderStatus | "") {
    setStatus(next);
    setPage(1);
  }

  function changeSearch(next: string) {
    setSearch(next);
    setPage(1);
  }

  return (
    <>
      <OrderFilters status={status} search={search} onStatusChange={changeStatus} onSearchChange={changeSearch} />

      {error && <p role="alert" className="alert">{error}</p>}

      {loading && !result ? (
        <p>Loading orders…</p>
      ) : result ? (
        <>
          <table aria-busy={loading}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Status</th>
                <th className="num">Items</th>
                <th>Placed</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((order) => (
                <tr key={order.id}>
                  <td>{order.reference}</td>
                  <td>
                    {order.customer.name}
                    <br />
                    <small>{order.customer.lifetime_orders} orders</small>
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="num">{order.item_count}</td>
                  <td>{formatDate(order.placed_at)}</td>
                  <td className="num">{formatMoney(order.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={result.meta.current_page} lastPage={result.meta.last_page} onPageChange={setPage} />
        </>
      ) : null}
    </>
  );
}
