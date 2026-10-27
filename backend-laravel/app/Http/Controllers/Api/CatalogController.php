<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;

class CatalogController extends Controller
{
    public function customers()
    {
        return ['data' => Customer::orderBy('name')->get(['id', 'name', 'email'])];
    }

    public function products()
    {
        return ['data' => Product::orderBy('name')->get(['id', 'sku', 'name', 'price_cents', 'stock'])];
    }
}
