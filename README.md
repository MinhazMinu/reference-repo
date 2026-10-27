# OrderDesk: Full-Stack Technical Session

OrderDesk is an internal dashboard our operations team uses to browse and place customer orders.

- **frontend/**: Next.js 16 (App Router, React 19, TypeScript)
- **Backend: choose ONE.** Both implement the same API with the same problems:
  - **backend-laravel/**: Laravel 13 (PHP 8.3+, Eloquent). Tests use SQLite.
  - **backend-node/**: Node.js 20+ (Express 5, Sequelize 6). Tests use the MySQL test database.

Only work in the backend you chose and ignore the other folder.

The app mostly works, but it has problems. Several were reported by the ops team, and QA has
written acceptance tests that currently fail. Your job is to get it into a state you'd be happy
to ship.

**Timebox: 90 minutes.** We care much more about how you reason than about finishing everything.

---

## Getting started

### Option A: Docker (recommended)

```bash
docker compose --profile laravel up --build   # if you chose Laravel
docker compose --profile node up --build      # if you chose Node.js
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000/orders |
| API      | http://localhost:8000/api/orders |
| MySQL    | localhost:3307 (orderdesk / secret) |

Ports can be changed with `FRONTEND_PORT`, `BACKEND_PORT` and `MYSQL_PORT`.
The database is re-created and seeded every time the backend container starts.

Run the test suites:

```bash
docker compose exec backend-laravel php artisan test   # Laravel
docker compose exec backend-node npm test              # Node.js
cd frontend && npm install && npm test
```

### Option B: Local toolchain

```bash
# Laravel backend (PHP 8.3+, Composer)
cd backend-laravel
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve            # http://localhost:8000
php artisan test

# Node.js backend (Node 20+). Needs MySQL: `docker compose up -d mysql` gives you one on port 3307.
cd backend-node
npm install
cp .env.example .env
npm run db:seed
npm run dev                  # http://localhost:8000
npm test                     # uses the orderdesk_test database

# Frontend (Node 20+)
cd frontend
npm install
npm run dev                  # http://localhost:3000, proxies /api to :8000
npm test
```

---

## Your tasks

Work through them in order. Commit as you go, in small commits with meaningful messages.

### 1. Finish the merge (frontend)

Two developers built features on the orders table in parallel:

- `feature/order-filters` (status filter + search) is **already merged** into `main`.
- `feature/order-pagination` (pagination + item counts) is **not**.

Merge `feature/order-pagination` into `main` and resolve the conflicts. Both features must work
together, and nothing either developer built should be lost.

`npm test -- OrdersTable` should pass when you're done.

### 2. The orders list is slow (backend)

Ops say `GET /api/orders` gets noticeably slower as the page size grows, and that the filters
"sometimes return orders with the wrong status".

Fix both without changing the shape of the JSON response. The orders-list tests should pass (Laravel: `OrderIndexTest`, Node: `tests/orderIndex.test.js`).

### 3. Orders with missing items (backend + frontend)

From the ops bug tracker:

> **OD-142:** Warehouse received an order with no line items, and stock for one product went down
> even though the customer said the checkout failed.
>
> **OD-157:** When placing an order fails, the form just... does nothing. People click
> "Place order" again and sometimes get duplicate orders.

Our production MySQL cluster occasionally returns write errors (deadlocks under load, and once a
full disk). You can reproduce these locally. See `backend-laravel/app/Support/Faults/FaultInjector.php` or
`backend-node/src/faults/faultInjector.js`.
Send an `X-Simulate-Fault: table_full` or `X-Simulate-Fault: deadlock_once` header, or open
`http://localhost:3000/orders/new?fault=table_full` in the browser.

Expected behaviour:

- Placing an order is all-or-nothing. A failure must never leave behind a partial order or
  changed stock.
- A transient deadlock should not fail the customer's order.
- A database failure that can't be recovered returns **HTTP 503** with a JSON `message` that is
  safe to show to users (no SQL, no internals).
- The frontend API client rejects on non-2xx responses with an error that carries the server's
  `message` and the HTTP `status`.
- The form shows the error, keeps what the user entered, and can't be submitted twice.

The place-order tests (Laravel: `PlaceOrderTest`, Node: `tests/placeOrder.test.js`), plus
`api.test.ts` and `NewOrderForm.test.tsx`, should pass.

### 4. If you have time

Pick anything you think matters and either fix it or write it up. There are more problems than
the tests cover.

---

## Ground rules

- **Do not modify the existing tests or the fault injector.** They're the spec. You may add tests.
- Use whatever tools you normally use, including AI assistants. You'll be asked to walk us
  through every change you made and why, so make sure you understand them.
- Think out loud. If something is ambiguous, ask, or make a call and write it down.
- Before you finish, add a short `NOTES.md` covering what you changed, what you'd do next,
  and anything you noticed but didn't get to.
