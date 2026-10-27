#!/bin/sh
set -e

[ -f vendor/autoload.php ] || composer install --no-interaction
[ -f .env ] || cp .env.example .env
grep -q '^APP_KEY=base64' .env || php artisan key:generate --force

# Wait for MySQL to accept TCP connections (its first boot runs a temporary socket-only server).
until php artisan tinker --execute="DB::connection()->getPdo();" >/dev/null 2>&1; do echo "Waiting for database..."; sleep 2; done

# Fresh, seeded database on every boot so everyone starts from the same data.
php artisan migrate:fresh --seed --force

# PHP's built-in server directly (not `artisan serve`) so container env vars reach the app.
cd public && exec php -S 0.0.0.0:8000 ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
