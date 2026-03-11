#!/usr/bin/env bash
set -e

echo "Waiting for Postgres at ${DATABASE_URL}..."

until pg_isready -q -d "${DATABASE_URL}"; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - running migrations"
mix ecto.create || true
mix ecto.migrate

echo "Starting Phoenix server..."
exec mix phx.server
