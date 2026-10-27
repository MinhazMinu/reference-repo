<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reference' => 'ORD-'.fake()->unique()->numerify('######'),
            'customer_id' => Customer::factory(),
            'status' => fake()->randomElement(Order::STATUSES),
            'total_cents' => 0,
            'placed_at' => fake()->dateTimeBetween('-60 days'),
        ];
    }
}
