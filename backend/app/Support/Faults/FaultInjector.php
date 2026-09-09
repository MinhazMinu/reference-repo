<?php

namespace App\Support\Faults;

use Illuminate\Database\Connection;
use Illuminate\Database\QueryException;
use PDOException;

/**
 * Simulates MySQL write failures on the order_events table so the
 * order flow can be exercised against realistic database errors.
 *
 * Modes:
 *  - deadlock_once: the first insert fails with a MySQL 1213 deadlock, later inserts succeed.
 *  - table_full:    every insert fails with MySQL 1114 "table is full".
 *
 * DO NOT MODIFY - this class stands in for the database. Fix the application code instead.
 */
class FaultInjector
{
    public const MODES = ['deadlock_once', 'table_full'];

    private ?string $mode = null;

    private int $hits = 0;

    public function __construct(?string $mode = null)
    {
        $this->setMode($mode);
    }

    public function setMode(?string $mode): void
    {
        $this->mode = in_array($mode, self::MODES, true) ? $mode : null;
        $this->hits = 0;
    }

    public function register(Connection $connection): void
    {
        $connection->beforeExecuting(function (string $query, array $bindings, Connection $connection) {
            if ($this->mode === null || ! preg_match('/^insert into [`"]?order_events\b/i', $query)) {
                return;
            }

            $this->hits++;

            if ($this->mode === 'deadlock_once' && $this->hits > 1) {
                return;
            }

            throw new QueryException($connection->getName(), $query, $bindings, $this->exception());
        });
    }

    private function exception(): PDOException
    {
        $e = match ($this->mode) {
            'deadlock_once' => new PDOException('SQLSTATE[40001]: Serialization failure: 1213 Deadlock found when trying to get lock; try restarting transaction'),
            'table_full' => new PDOException("SQLSTATE[HY000]: General error: 1114 The table 'order_events' is full"),
        };

        $e->errorInfo = $this->mode === 'deadlock_once' ? ['40001', 1213, 'Deadlock found'] : ['HY000', 1114, 'The table is full'];

        return $e;
    }
}
