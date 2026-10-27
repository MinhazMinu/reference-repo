<?php

namespace App\Actions;

use App\Exceptions\InsufficientStockException;
use App\Exceptions\OrderPlacementFailed;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\Product;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlaceOrder
{
    /** Deadlocks are retried automatically by DB::transaction up to this many attempts. */
    private const ATTEMPTS = 3;

    /**
     * @param  array<int, array{product_id: int, quantity: int}>  $lines
     */
    public function handle(Customer $customer, array $lines): Order
    {
        try {
            return DB::transaction(fn () => $this->place($customer, $lines), self::ATTEMPTS);
        } catch (QueryException $e) {
            report($e);

            throw new OrderPlacementFailed(previous: $e);
        }
    }

    private function place(Customer $customer, array $lines): Order
    {
        // Lock the rows so concurrent orders can't both pass the stock check (lost update).
        $products = Product::whereIn('id', array_column($lines, 'product_id'))
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($lines as $line) {
            $product = $products[$line['product_id']];

            if ($product->stock < $line['quantity']) {
                throw new InsufficientStockException($product, $line['quantity']);
            }
        }

        $order = Order::create([
            // Placeholder keeps the unique column valid until we know the id; avoids the MAX(id)+1 race.
            'reference' => 'TMP-'.Str::uuid(),
            'customer_id' => $customer->id,
            'status' => 'pending',
            'placed_at' => now(),
        ]);

        $total = 0;

        foreach ($lines as $line) {
            $product = $products[$line['product_id']];

            $product->decrement('stock', $line['quantity']);

            $order->items()->create([
                'product_id' => $product->id,
                'quantity' => $line['quantity'],
                'unit_price_cents' => $product->price_cents,
            ]);

            $total += $product->price_cents * $line['quantity'];
        }

        $order->update([
            'reference' => 'ORD-'.str_pad((string) $order->id, 6, '0', STR_PAD_LEFT),
            'total_cents' => $total,
        ]);

        // The warehouse sync job tails this table, so every placed order must have one.
        OrderEvent::create([
            'order_id' => $order->id,
            'type' => 'order.placed',
            'payload' => ['total_cents' => $total, 'lines' => count($lines)],
        ]);

        return $order;
    }
}
