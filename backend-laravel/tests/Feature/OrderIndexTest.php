<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrderIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_orders_with_customer_and_items(): void
    {
        $order = Order::factory()->create(['status' => 'paid']);
        OrderItem::factory()->count(2)->create(['order_id' => $order->id, 'quantity' => 3]);

        $this->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('data.0.reference', $order->reference)
            ->assertJsonPath('data.0.item_count', 6)
            ->assertJsonPath('data.0.customer.lifetime_orders', 1)
            ->assertJsonCount(2, 'data.0.items')
            ->assertJsonStructure([
                'data' => [['id', 'reference', 'status', 'total_cents', 'placed_at', 'item_count',
                    'customer' => ['id', 'name', 'email', 'lifetime_orders'],
                    'items' => [['id', 'sku', 'name', 'quantity', 'unit_price_cents']],
                ]],
                'meta' => ['current_page', 'last_page', 'total'],
            ]);
    }

    public function test_listing_orders_uses_a_constant_number_of_queries(): void
    {
        Order::factory()->count(15)->create()->each(
            fn (Order $order) => OrderItem::factory()->count(3)->create(['order_id' => $order->id])
        );

        DB::enableQueryLog();
        $this->getJson('/api/orders?per_page=15')->assertOk()->assertJsonCount(15, 'data');
        $queries = count(DB::getQueryLog());

        $this->assertLessThanOrEqual(6, $queries, "GET /api/orders ran {$queries} queries for 15 orders.");
    }

    public function test_status_and_search_filters_are_combined(): void
    {
        $alice = Customer::factory()->create(['name' => 'Alice Moreno']);
        $paid = Order::factory()->create(['customer_id' => $alice->id, 'status' => 'paid']);
        Order::factory()->create(['customer_id' => $alice->id, 'status' => 'cancelled']);
        Order::factory()->create(['status' => 'paid']);

        $this->getJson('/api/orders?status=paid&search=Moreno')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $paid->id);
    }
}
