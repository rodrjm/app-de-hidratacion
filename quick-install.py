#!/usr/bin/env python
"""
Script de instalación rápida para HydroTracker.
Detecta el sistema operativo y instala las dependencias apropiadas.
"""

import os
import sys
import subprocess
import platform

def run_command(command):
    """Ejecuta un comando y retorna True si fue exitoso."""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {command}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error ejecutando: {command}")
        print(f"   Error: {e.stderr}")
        return False

def install_basic_dependencies():
    """Instala las dependencias básicas sin PostgreSQL."""
    print("🔧 Instalando dependencias básicas...")
    
    dependencies = [
        "Django==4.2.7",
        "djangorestframework==3.14.0",
        "djangorestframework-simplejwt==5.3.0",
        "django-cors-headers==4.3.1",
        "django-filter==23.3",
        "python-decouple==3.8"
    ]
    
    for dep in dependencies:
        if not run_command(f"pip install {dep}"):
            return False
    
    return True

def install_postgresql_dependencies():
    """Intenta instalar psycopg2."""
    print("🔧 Intentando instalar psycopg2...")
    
    # Intentar psycopg2-binary primero
    if run_command("pip install psycopg2-binary==2.9.9"):
        return True
    
    # Si falla, intentar psycopg2
    if run_command("pip install psycopg2==2.9.9"):
        return True
    
    return False

def setup_database():
    """Configura la base de datos."""
    print("🗄️ Configurando base de datos...")
    
    # Intentar con PostgreSQL primero
    if run_command("python manage.py migrate"):
        print("✅ Base de datos PostgreSQL configurada")
        return True
    
    # Si falla, usar SQLite
    print("⚠️ PostgreSQL no disponible, usando SQLite...")
    if run_command("python manage_sqlite.py migrate"):
        print("✅ Base de datos SQLite configurada")
        return True
    
    return False

def create_superuser():
    """Crea un superusuario."""
    print("👤 Creando superusuario...")
    
    # Intentar con PostgreSQL
    if run_command("python manage.py createsuperuser --noinput --username admin --email admin@example.com"):
        print("✅ Superusuario creado con PostgreSQL")
        return True
    
    # Si falla, usar SQLite
    if run_command("python manage_sqlite.py createsuperuser --noinput --username admin --email admin@example.com"):
        print("✅ Superusuario creado con SQLite")
        return True
    
    return False

def main():
    """Función principal."""
    print("🚀 Instalador Rápido de HydroTracker")
    print("=" * 50)
    
    # Detectar sistema operativo
    system = platform.system().lower()
    print(f"🖥️ Sistema detectado: {system}")
    
    # Instalar dependencias básicas
    if not install_basic_dependencies():
        print("❌ Error instalando dependencias básicas")
        return False
    
    # Intentar instalar PostgreSQL
    postgresql_available = install_postgresql_dependencies()
    
    if postgresql_available:
        print("✅ PostgreSQL disponible")
    else:
        print("⚠️ PostgreSQL no disponible, usando SQLite")
    
    # Configurar base de datos
    if not setup_database():
        print("❌ Error configurando base de datos")
        return False
    
    # Crear superusuario
    if not create_superuser():
        print("⚠️ No se pudo crear superusuario automáticamente")
        print("   Ejecuta manualmente: python manage.py createsuperuser")
    
    print("\n🎉 Instalación completada!")
    print("\n📋 Próximos pasos:")
    print("1. Ejecuta: python manage.py runserver")
    print("2. Visita: http://127.0.0.1:8000/admin/")
    print("3. Usuario: admin, Contraseña: admin123")
    print("\n🧪 Para probar la API:")
    print("python test_no_ads_api.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)




