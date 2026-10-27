<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class OrderPlacementFailed extends RuntimeException
{
    public function __construct(?Throwable $previous = null)
    {
        parent::__construct('We could not place your order right now. Nothing was charged or reserved. Please try again.', 0, $previous);
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 503, ['Retry-After' => '5']);
    }
}
