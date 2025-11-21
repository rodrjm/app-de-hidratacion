#!/usr/bin/env python
"""
Script para crear un superusuario en Dosis vital: Tu aplicación de hidratación personal
"""
import os
import django

# Configurar Django para usar settings SQLite
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hydrotracker.settings_sqlite')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Crear superusuario
username = 'admin'
email = 'admin@hydrotracker.com'
password = 'admin123'

# Verificar si el usuario ya existe
if User.objects.filter(username=username).exists():
    print(f"⚠️ El usuario '{username}' ya existe.")
    print("📝 Intentando cambiar la contraseña...")
    user = User.objects.get(username=username)
    user.set_password(password)
    user.save()
    print("✅ Contraseña actualizada exitosamente")
else:
    print(f"🔨 Creando superusuario '{username}'...")
    User.objects.create_superuser(username=username, email=email, password=password)
    print("✅ Superusuario creado exitosamente")

print("\n📋 Credenciales de acceso:")
print(f"Usuario: {username}")
print(f"Email: {email}")
print(f"Contraseña: {password}")
print(f"\n🌐 Accede a: http://127.0.0.1:8000/admin/")

