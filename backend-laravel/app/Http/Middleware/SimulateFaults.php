<?php

namespace App\Http\Middleware;

use App\Support\Faults\FaultInjector;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets QA trigger simulated database faults with an `X-Simulate-Fault` header.
 * Never active in production.
 */
class SimulateFaults
{
    public function __construct(private FaultInjector $faults) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->isProduction() && $request->hasHeader('X-Simulate-Fault')) {
            $this->faults->setMode($request->header('X-Simulate-Fault'));
        }

        return $next($request);
    }
}
