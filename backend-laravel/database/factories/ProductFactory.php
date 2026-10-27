<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\Product> */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'sku' => strtoupper(fake()->unique()->bothify('??-####')),
            'name' => ucfirst(fake()->words(2, true)),
            'price_cents' => fake()->numberBetween(500, 25000),
            'stock' => fake()->numberBetween(10, 200),
        ];
    }
}
