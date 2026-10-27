<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::factory(25)->create();
        $products = Product::factory(15)->create();

        // A product that is nearly sold out, handy for testing stock errors from the UI.
        Product::factory()->create(['sku' => 'LIMITED-001', 'name' => 'Limited edition kettle', 'stock' => 3]);

        foreach (range(1, 120) as $i) {
            $order = Order::factory()->create([
                'reference' => sprintf('ORD-%06d', $i),
                'customer_id' => $customers->random()->id,
            ]);

            $total = 0;
            foreach ($products->random(rand(1, 4)) as $product) {
                $item = OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'unit_price_cents' => $product->price_cents,
                ]);
                $total += $item->quantity * $item->unit_price_cents;
            }

            $order->update(['total_cents' => $total]);
        }
    }
}
