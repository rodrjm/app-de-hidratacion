#!/usr/bin/env python
"""
Crea 5 usuarios de prueba en la BD (Neon): 2 gratuitos, 1 premium mensual,
1 premium anual, 1 premium de por vida. Edades 18–80, pesos distintos.

Ejecutar desde la carpeta backend (para que use backend/.env):
  cd backend
  python crear_usuarios_prueba.py

Los usuarios se crean en la tabla users_user. Si no ves datos en Neon, comprueba
que DATABASE_URL en backend/.env apunte a tu proyecto Neon.
"""
import os
import sys
from datetime import date, timedelta
from pathlib import Path

if __name__ == "__main__":
    # Cargar .env del backend para que Django use DATABASE_URL de Neon (y no SQLite local)
    backend_dir = Path(__file__).resolve().parent
    env_file = backend_dir / ".env"
    if env_file.exists():
        with open(env_file, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key:
                        os.environ.setdefault(key, value)
    else:
        print("Aviso: no existe backend/.env. Si quieres usar Neon, crea .env con DATABASE_URL.")

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hydrotracker.settings")
    sys.path.insert(0, str(backend_dir))
    import django
    django.setup()

    from django.utils import timezone
    from django.conf import settings
    from users.models import User
    from users.utils import crear_recipientes_por_defecto

    # Mostrar qué base de datos se usa (para verificar que sea Neon y no SQLite)
    db_engine = settings.DATABASES["default"]["ENGINE"]
    db_name = settings.DATABASES["default"].get("NAME", "")
    if "sqlite" in db_engine:
        print("ADVERTENCIA: Estás usando SQLite local. Los usuarios se crean en backend/db.sqlite3, NO en Neon.")
        print("Para usar Neon, define DATABASE_URL en backend/.env con la URL de tu proyecto Neon.")
    else:
        print(f"Base de datos: {db_engine} — Name: {db_name}")
        print("Los usuarios se guardan en la tabla 'users_user' en Neon.")
    print()

    PASSWORD = "TestPass123!"  # Contraseña común para todos (cámbiala si quieres)

    usuarios = [
        # 2 gratuitos (es_premium=False, plan_type=None, subscription_end_date=None)
        {
            "username": "prueba_gratis_1",
            "email": "prueba.gratis.1@test.dosisvital.com",
            "first_name": "Ana",
            "last_name": "García",
            "peso": 58.0,
            "fecha_nacimiento": date(1995, 6, 10),  # ~29 años
            "es_premium": False,
            "plan_type": None,
            "subscription_end_date": None,
        },
        {
            "username": "prueba_gratis_2",
            "email": "prueba.gratis.2@test.dosisvital.com",
            "first_name": "Luis",
            "last_name": "Martínez",
            "peso": 82.0,
            "fecha_nacimiento": date(1988, 11, 22),  # ~36 años
            "es_premium": False,
            "plan_type": None,
            "subscription_end_date": None,
        },
        # 1 premium mensual
        {
            "username": "prueba_premium_mensual",
            "email": "prueba.premium.mensual@test.dosisvital.com",
            "first_name": "Carmen",
            "last_name": "López",
            "peso": 65.0,
            "fecha_nacimiento": date(1977, 3, 15),  # ~47 años
            "es_premium": True,
            "plan_type": "monthly",
            "subscription_end_date": timezone.now().date() + timedelta(days=30),
            "preapproval_id": "test_premium_mensual_1",
            "auto_renewal": True,
        },
        # 1 premium anual
        {
            "username": "prueba_premium_anual",
            "email": "prueba.premium.anual@test.dosisvital.com",
            "first_name": "Roberto",
            "last_name": "Sánchez",
            "peso": 91.0,
            "fecha_nacimiento": date(1962, 8, 1),  # ~62 años
            "es_premium": True,
            "plan_type": "annual",
            "subscription_end_date": timezone.now().date() + timedelta(days=365),
            "preapproval_id": "test_premium_anual_1",
            "auto_renewal": True,
        },
        # 1 premium de por vida
        {
            "username": "prueba_premium_vitalicio",
            "email": "prueba.premium.vitalicio@test.dosisvital.com",
            "first_name": "Elena",
            "last_name": "Fernández",
            "peso": 72.0,
            "fecha_nacimiento": date(1950, 1, 20),  # ~75 años
            "es_premium": True,
            "plan_type": "lifetime",
            "subscription_end_date": None,
            "preapproval_id": None,
            "auto_renewal": False,
        },
    ]

    for u in usuarios:
        sub_end = u.pop("subscription_end_date")
        plan_type = u.pop("plan_type")
        es_premium = u.pop("es_premium")
        preapproval_id = u.pop("preapproval_id", None)
        auto_renewal = u.pop("auto_renewal", True)
        if User.objects.filter(email=u["email"]).exists():
            print(f'Ya existe: {u["email"]}')
            continue
        user = User.objects.create_user(
            password=PASSWORD,
            **u
        )
        user.es_premium = es_premium
        user.plan_type = plan_type
        user.subscription_end_date = sub_end
        user.preapproval_id = preapproval_id
        user.auto_renewal = auto_renewal
        user.save(update_fields=["es_premium", "plan_type", "subscription_end_date", "preapproval_id", "auto_renewal"])
        user.generar_codigo_referido()
        crear_recipientes_por_defecto(user)
        print(f'Creado: {user.email} ({user.get_nombre_completo()}) — premium={es_premium}, plan={plan_type}')
    print("Listo.")
