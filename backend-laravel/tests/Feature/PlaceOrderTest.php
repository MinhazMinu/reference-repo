<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

/**
 * Uses DatabaseMigrations (not RefreshDatabase) so the code under test runs
 * outside of any test-level transaction, exactly as it does in production.
 */
class PlaceOrderTest extends TestCase
{
    use DatabaseMigrations;

    private Customer $customer;

    private Product $kettle;

    private Product $mug;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = Customer::factory()->create();
        $this->kettle = Product::factory()->create(['price_cents' => 4000, 'stock' => 5]);
        $this->mug = Product::factory()->create(['price_cents' => 1000, 'stock' => 1]);
    }

    private function payload(int $mugQuantity = 1): array
    {
        return [
            'customer_id' => $this->customer->id,
            'items' => [
                ['product_id' => $this->kettle->id, 'quantity' => 2],
                ['product_id' => $this->mug->id, 'quantity' => $mugQuantity],
            ],
        ];
    }

    private function assertNothingWasWritten(): void
    {
        $this->assertSame(0, Order::count(), 'An order row was left behind.');
        $this->assertSame(0, OrderItem::count(), 'Order item rows were left behind.');
        $this->assertSame(0, OrderEvent::count(), 'Order event rows were left behind.');
        $this->assertSame(5, $this->kettle->fresh()->stock, 'Kettle stock was not restored.');
        $this->assertSame(1, $this->mug->fresh()->stock, 'Mug stock was not restored.');
    }

    public function test_it_places_an_order(): void
    {
        $this->postJson('/api/orders', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.total_cents', 9000)
            ->assertJsonPath('data.item_count', 3);

        $this->assertSame(3, $this->kettle->fresh()->stock);
        $this->assertSame(0, $this->mug->fresh()->stock);
        $this->assertSame(1, OrderEvent::where('type', 'order.placed')->count());
    }

    public function test_insufficient_stock_is_rejected_without_side_effects(): void
    {
        $this->postJson('/api/orders', $this->payload(mugQuantity: 2))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items');

        $this->assertNothingWasWritten();
    }

    public function test_a_failed_database_write_leaves_no_partial_order(): void
    {
        $response = $this->withHeader('X-Simulate-Fault', 'table_full')
            ->postJson('/api/orders', $this->payload());

        $response->assertStatus(503)->assertJsonStructure(['message']);
        $this->assertStringNotContainsStringIgnoringCase('insert into', $response->json('message'));
        $this->assertStringNotContainsStringIgnoringCase('SQLSTATE', $response->json('message'));

        $this->assertNothingWasWritten();
    }

    public function test_a_transient_deadlock_is_retried_and_the_order_is_placed_once(): void
    {
        $this->withHeader('X-Simulate-Fault', 'deadlock_once')
            ->postJson('/api/orders', $this->payload())
            ->assertCreated();

        $this->assertSame(1, Order::count());
        $this->assertSame(2, OrderItem::count());
        $this->assertSame(1, OrderEvent::count());
        $this->assertSame(3, $this->kettle->fresh()->stock, 'Stock was decremented more than once.');
    }
}
