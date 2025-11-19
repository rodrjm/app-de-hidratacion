#!/usr/bin/env python
"""
Script de configuración para despliegue en producción.
Configura el proyecto Dosis vital: Tu aplicación de hidratación personal para Vercel + Railway.
"""

import os
import sys
import json
import subprocess
from pathlib import Path


def create_railway_config():
    """Crea configuración para Railway."""
    print("🚂 Configurando Railway...")
    
    railway_config = """[build]
builder = "NIXPACKS"

[deploy]
startCommand = "python manage.py migrate && python manage.py runserver 0.0.0.0:$PORT"
healthcheckPath = "/api/health/"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
"""
    
    with open('railway.toml', 'w') as f:
        f.write(railway_config)
    
    print("✅ railway.toml creado")


def create_vercel_config():
    """Crea configuración para Vercel."""
    print("🌐 Configurando Vercel...")
    
    vercel_config = {
        "buildCommand": "npm run build",
        "outputDirectory": "dist",
        "installCommand": "npm install",
        "framework": "vite",
        "rewrites": [
            {
                "source": "/api/(.*)",
                "destination": "https://your-backend.railway.app/api/$1"
            }
        ]
    }
    
    vercel_path = Path('hydrotracker-frontend/vercel.json')
    with open(vercel_path, 'w') as f:
        json.dump(vercel_config, f, indent=2)
    
    print("✅ vercel.json creado")


def create_env_examples():
    """Crea archivos .env.example para producción."""
    print("🔧 Creando archivos de configuración...")
    
    # Backend .env.example
    backend_env = """# Railway Database (auto-configurado)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Railway Redis (auto-configurado)
REDIS_URL=${{Redis.REDIS_URL}}

# Django Configuration
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key
"""
    
    with open('.env.production', 'w') as f:
        f.write(backend_env)
    
    # Frontend .env.example
    frontend_env = """# API Configuration
VITE_API_URL=https://your-backend.railway.app/api

# App Configuration
VITE_APP_NAME=Dosis vital: Tu aplicación de hidratación personal
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
"""
    
    frontend_env_path = Path('hydrotracker-frontend/.env.production')
    with open(frontend_env_path, 'w') as f:
        f.write(frontend_env)
    
    print("✅ Archivos .env.production creados")


def create_health_check():
    """Crea endpoint de health check para Railway."""
    print("🏥 Creando health check endpoint...")
    
    health_check_code = '''from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint para Railway.
    """
    try:
        # Verificar conexión a la base de datos
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            "status": "healthy",
            "service": "Dosis vital: Tu aplicación de hidratación personal API",
            "database": "connected",
            "timestamp": timezone.now().isoformat()
        })
    except Exception as e:
        return JsonResponse({
            "status": "unhealthy",
            "service": "Dosis vital: Tu aplicación de hidratación personal API",
            "error": str(e),
            "timestamp": timezone.now().isoformat()
        }, status=500)
'''
    
    # Crear el archivo en la app consumos
    health_file = Path('consumos/health_views.py')
    with open(health_file, 'w') as f:
        f.write(health_code)
    
    print("✅ Health check endpoint creado")


def update_urls():
    """Actualiza URLs para incluir health check."""
    print("🔗 Actualizando URLs...")
    
    # Leer urls.py actual
    urls_path = Path('hydrotracker/urls.py')
    if urls_path.exists():
        with open(urls_path, 'r') as f:
            content = f.read()
        
        # Agregar health check si no existe
        if 'health_check' not in content:
            # Agregar import
            content = content.replace(
                'from django.contrib import admin',
                'from django.contrib import admin\nfrom consumos.health_views import health_check'
            )
            
            # Agregar URL pattern
            content = content.replace(
                'path("admin/", admin.site.urls),',
                'path("admin/", admin.site.urls),\n    path("api/health/", health_check, name="health_check"),'
            )
            
            with open(urls_path, 'w') as f:
                f.write(content)
    
    print("✅ URLs actualizadas")


def create_deployment_scripts():
    """Crea scripts de despliegue."""
    print("📜 Creando scripts de despliegue...")
    
    # Script para Railway
    railway_script = '''#!/bin/bash
echo "🚂 Deploying to Railway..."

# Verificar que estamos en el directorio correcto
if [ ! -f "manage.py" ]; then
    echo "❌ Error: No se encontró manage.py"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones..."
python manage.py migrate

# Crear superusuario si no existe
echo "👤 Verificando superusuario..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@hydrotracker.com', 'admin123')
    print('✅ Superusuario creado')
else:
    print('ℹ️ Superusuario ya existe')
"

echo "✅ Deploy completado!"
'''
    
    with open('deploy-railway.sh', 'w') as f:
        f.write(railway_script)
    
    # Script para Vercel
    vercel_script = '''#!/bin/bash
echo "🌐 Deploying to Vercel..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Build para producción
echo "🏗️ Building para producción..."
npm run build

echo "✅ Deploy completado!"
'''
    
    vercel_script_path = Path('hydrotracker-frontend/deploy-vercel.sh')
    with open(vercel_script_path, 'w') as f:
        f.write(vercel_script)
    
    print("✅ Scripts de despliegue creados")


def create_dockerfile():
    """Crea Dockerfile para Railway."""
    print("🐳 Creando Dockerfile...")
    
    dockerfile_content = '''FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \\
    && apt-get install -y --no-install-recommends \\
        postgresql-client \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
'''
    
    with open('Dockerfile', 'w') as f:
        f.write(dockerfile_content)
    
    print("✅ Dockerfile creado")


def create_deployment_checklist():
    """Crea checklist de despliegue."""
    print("📋 Creando checklist de despliegue...")
    
    checklist = '''# 🚀 Checklist de Despliegue - Dosis vital: Tu aplicación de hidratación personal

## ✅ Pre-Deploy Checklist

### Backend (Railway)
- [ ] Repositorio conectado a Railway
- [ ] Servicio PostgreSQL creado
- [ ] Servicio Redis creado
- [ ] Variables de entorno configuradas
- [ ] Health check endpoint funcionando
- [ ] Migraciones ejecutadas
- [ ] Superusuario creado

### Frontend (Vercel)
- [ ] Repositorio conectado a Vercel
- [ ] Root directory configurado: `hydrotracker-frontend`
- [ ] Variables de entorno configuradas
- [ ] Build settings configurados
- [ ] Deploy automático funcionando

### Configuración
- [ ] CORS configurado correctamente
- [ ] Dominios personalizados configurados (opcional)
- [ ] SSL certificados funcionando
- [ ] Variables de entorno seguras

## 🧪 Post-Deploy Testing

### Funcionalidad
- [ ] Registro de usuario funciona
- [ ] Login/logout funciona
- [ ] Crear consumo funciona
- [ ] Estadísticas se muestran correctamente
- [ ] API endpoints responden correctamente

### Performance
- [ ] Tiempo de carga < 3 segundos
- [ ] API response time < 500ms
- [ ] No errores en consola
- [ ] Mobile responsive

### Seguridad
- [ ] HTTPS funcionando
- [ ] Variables de entorno no expuestas
- [ ] CORS configurado correctamente
- [ ] JWT tokens funcionando

## 📊 URLs de Producción

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.railway.app
- **Admin**: https://your-backend.railway.app/admin/
- **API Docs**: https://your-backend.railway.app/api/

## 🚨 Troubleshooting

### Problemas Comunes
- **CORS Error**: Verificar CORS_ALLOWED_ORIGINS
- **Database Error**: Verificar DATABASE_URL
- **Build Error**: Verificar variables de entorno
- **404 Error**: Verificar rutas y configuración

### Logs y Debugging
- **Railway**: Ver logs en dashboard
- **Vercel**: Ver function logs
- **Database**: Verificar conexión
- **Redis**: Verificar cache

## 📞 Soporte

- **Railway Docs**: https://docs.railway.app/
- **Vercel Docs**: https://vercel.com/docs
- **Django Docs**: https://docs.djangoproject.com/
- **React Docs**: https://react.dev/
'''
    
    with open('DEPLOYMENT_CHECKLIST.md', 'w') as f:
        f.write(checklist)
    
    print("✅ Checklist de despliegue creado")


def main():
    """Función principal del script."""
    print("🚀 Configurando Dosis vital: Tu aplicación de hidratación personal para despliegue en producción...")
    print("=" * 60)
    
    try:
        # Crear configuraciones
        create_railway_config()
        create_vercel_config()
        create_env_examples()
        create_health_check()
        update_urls()
        create_deployment_scripts()
        create_dockerfile()
        create_deployment_checklist()
        
        print("\n" + "=" * 60)
        print("🎉 ¡Configuración completada exitosamente!")
        print("\n📋 Próximos pasos:")
        print("1. Revisar archivos de configuración creados")
        print("2. Configurar variables de entorno")
        print("3. Conectar repositorio a Railway")
        print("4. Conectar repositorio a Vercel")
        print("5. Seguir DEPLOYMENT_CHECKLIST.md")
        print("\n📚 Documentación:")
        print("- DEPLOYMENT_GUIDE.md: Guía completa")
        print("- DEPLOYMENT_CHECKLIST.md: Checklist paso a paso")
        
    except Exception as e:
        print(f"❌ Error durante la configuración: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
