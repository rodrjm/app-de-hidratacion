#!/usr/bin/env python
"""
Script de configuración inicial para HydroTracker API.
Ejecuta las tareas necesarias para configurar el proyecto.
"""

import os
import sys
import subprocess
import django
from django.core.management import execute_from_command_line


def run_command(command, description):
    """Ejecuta un comando y muestra el resultado."""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completado exitosamente")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error en {description}:")
        print(e.stderr)
        return False


def setup_django():
    """Configura Django y ejecuta las migraciones."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hydrotracker.settings')
    django.setup()
    
    print("\n🔄 Configurando Django...")
    
    # Crear migraciones
    try:
        execute_from_command_line(['manage.py', 'makemigrations'])
        print("✅ Migraciones creadas")
    except Exception as e:
        print(f"❌ Error creando migraciones: {e}")
        return False
    
    # Ejecutar migraciones
    try:
        execute_from_command_line(['manage.py', 'migrate'])
        print("✅ Migraciones ejecutadas")
    except Exception as e:
        print(f"❌ Error ejecutando migraciones: {e}")
        return False
    
    return True


def create_superuser():
    """Crea un superusuario si no existe."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if not User.objects.filter(is_superuser=True).exists():
        print("\n🔄 Creando superusuario...")
        try:
            execute_from_command_line([
                'manage.py', 'createsuperuser',
                '--username', 'admin',
                '--email', 'admin@hydrotracker.com',
                '--noinput'
            ])
            print("✅ Superusuario creado (username: admin, password: admin123)")
        except Exception as e:
            print(f"❌ Error creando superusuario: {e}")
            return False
    else:
        print("✅ Superusuario ya existe")
    
    return True


def load_initial_data():
    """Carga datos iniciales si existen."""
    print("\n🔄 Cargando datos iniciales...")
    
    # Crear bebidas básicas
    from consumos.models import Bebida
    
    bebidas_basicas = [
        {'nombre': 'Agua', 'factor_hidratacion': 1.0, 'es_agua': True, 'calorias_por_ml': 0.0},
        {'nombre': 'Café', 'factor_hidratacion': 0.8, 'es_agua': False, 'calorias_por_ml': 0.02},
        {'nombre': 'Té', 'factor_hidratacion': 0.9, 'es_agua': False, 'calorias_por_ml': 0.01},
        {'nombre': 'Refresco', 'factor_hidratacion': 0.6, 'es_agua': False, 'calorias_por_ml': 0.4},
        {'nombre': 'Jugo de frutas', 'factor_hidratacion': 0.7, 'es_agua': False, 'calorias_por_ml': 0.5},
    ]
    
    for bebida_data in bebidas_basicas:
        bebida, created = Bebida.objects.get_or_create(
            nombre=bebida_data['nombre'],
            defaults=bebida_data
        )
        if created:
            print(f"✅ Bebida '{bebida.nombre}' creada")
        else:
            print(f"ℹ️  Bebida '{bebida.nombre}' ya existe")
    
    print("✅ Datos iniciales cargados")
    return True


def main():
    """Función principal del script de configuración."""
    print("🚀 Configurando HydroTracker API...")
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists('manage.py'):
        print("❌ Error: No se encontró manage.py. Ejecuta este script desde el directorio raíz del proyecto.")
        sys.exit(1)
    
    # Verificar Python
    if sys.version_info < (3, 8):
        print("❌ Error: Se requiere Python 3.8 o superior")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} detectado")
    
    # Instalar dependencias
    if not run_command("pip install -r requirements.txt", "Instalando dependencias"):
        print("❌ Error instalando dependencias")
        sys.exit(1)
    
    # Configurar Django
    if not setup_django():
        print("❌ Error configurando Django")
        sys.exit(1)
    
    # Crear superusuario
    if not create_superuser():
        print("❌ Error creando superusuario")
        sys.exit(1)
    
    # Cargar datos iniciales
    if not load_initial_data():
        print("❌ Error cargando datos iniciales")
        sys.exit(1)
    
    print("\n🎉 ¡Configuración completada exitosamente!")
    print("\n📋 Próximos pasos:")
    print("1. Configura tu archivo .env con las credenciales de la base de datos")
    print("2. Ejecuta: python manage.py runserver")
    print("3. Visita: http://127.0.0.1:8000/admin/")
    print("4. Usa las credenciales: admin / admin123")
    print("\n📚 Documentación de la API disponible en el README.md")


if __name__ == '__main__':
    main()
