# Usar imagen base de Python
FROM python:3.11-slim

# Establecer directorio de trabajo
WORKDIR /app

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements y instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del proyecto
COPY . .

# Crear directorio para logs
RUN mkdir -p logs

# Crear script de inicio
RUN echo '#!/bin/sh\n\
set -e\n\
echo "Starting Django application..."\n\
echo "Running migrations..."\n\
python manage.py migrate --noinput\n\
echo "Checking if beverages need to be seeded..."\n\
python manage.py seed_bebidas\n\
echo "Collecting static files..."\n\
python manage.py collectstatic --noinput || true\n\
PORT=${PORT:-8000}\n\
echo "Starting Gunicorn on port $PORT..."\n\
exec gunicorn hydrotracker.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --access-logfile - --error-logfile -\n\
' > /app/start.sh && chmod +x /app/start.sh

# Exponer el puerto
EXPOSE 8000

# Comando de inicio para producción
CMD ["/app/start.sh"]

