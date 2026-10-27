<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\OrderItem */
class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->product->sku,
            'name' => $this->product->name,
            'quantity' => $this->quantity,
            'unit_price_cents' => $this->unit_price_cents,
        ];
    }
}
