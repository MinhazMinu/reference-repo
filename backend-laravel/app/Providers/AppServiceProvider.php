<?php

namespace App\Providers;

use App\Support\Faults\FaultInjector;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FaultInjector::class, fn () => new FaultInjector(config('faults.order_events')));
    }

    public function boot(): void
    {
        if (! $this->app->isProduction()) {
            $this->app->make(FaultInjector::class)->register(DB::connection());
        }
    }
}
