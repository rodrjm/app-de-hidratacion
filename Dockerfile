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
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY backend/ /app/

# Crear directorio para logs
RUN mkdir -p logs

# Exponer el puerto (Render usa la variable PORT)
EXPOSE 8000

# Script de inicio
RUN echo '#!/bin/sh\n\
set -e\n\
python manage.py migrate --noinput\n\
python manage.py collectstatic --noinput || true\n\
PORT=${PORT:-8000}\n\
exec gunicorn hydrotracker.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --access-logfile - --error-logfile -\n\
' > /app/start.sh && chmod +x /app/start.sh

# Comando de inicio para producción
CMD ["/app/start.sh"]

