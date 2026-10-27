<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'status' => $this->status,
            'total_cents' => $this->total_cents,
            'placed_at' => $this->placed_at?->toIso8601String(),
            'item_count' => $this->item_count,
            'customer' => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
                'lifetime_orders' => $this->customer->orders_count ?? $this->customer->orders()->count(),
            ],
            'items' => OrderItemResource::collection($this->items),
        ];
    }
}
