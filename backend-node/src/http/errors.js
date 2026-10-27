import { config } from "../config.js";

export class HttpError extends Error {
  constructor(status, message, errors = undefined) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export class ValidationError extends HttpError {
  constructor(errors) {
    super(422, Object.values(errors)[0][0], errors);
  }
}

export class InsufficientStockError extends HttpError {
  constructor(product, requested) {
    const message = `Only ${product.stock} of ${product.sku} left in stock (requested ${requested}).`;
    super(422, message, { items: [message] });
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...(err.errors && { errors: err.errors }) });
  }

  console.error(err);

  // Verbose errors outside production make debugging easier.
  res.status(500).json(
    config.env === "production"
      ? { message: "Server Error" }
      : { message: err.message, exception: err.name, sql: err.sql, stack: err.stack?.split("\n") },
  );
}
