#!/bin/sh
set -e

echo "Starting backend..."
cd /app/backend
uv run python manage.py migrate
uv run python manage.py seed_data

# Start backend in the background on 0.0.0.0
uv run python manage.py runserver 0.0.0.0:8000 &

echo "Starting frontend..."
cd /app/frontend
# Start frontend on 0.0.0.0 so it is accessible outside container
npm run dev -- --host
