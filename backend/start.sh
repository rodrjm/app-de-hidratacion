#!/bin/sh
set -e

echo "Starting Django application..."

# Ejecutar migraciones
echo "Running migrations..."
python manage.py migrate --noinput

# Cargar bebidas iniciales si no existen
echo "Checking if beverages need to be seeded..."
python manage.py seed_bebidas

# Recolectar archivos estáticos
echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Iniciar Gunicorn
PORT=${PORT:-8000}
echo "Starting Gunicorn on port $PORT..."
exec gunicorn hydrotracker.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -

