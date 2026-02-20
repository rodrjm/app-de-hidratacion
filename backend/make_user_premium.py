#!/usr/bin/env python
"""
Script para hacer premium a test_user_2@testuser.com.

Cómo ejecutarlo (desde la carpeta backend, con el entorno donde
tienes instaladas las dependencias del backend, p. ej. venv activado):

  cd backend
  python make_user_premium.py

Si no tienes venv activado, actívalo antes o instala dependencias:
  pip install -r requirements.txt
"""
import os
import sys

if __name__ == "__main__":
    try:
        import dj_database_url  # noqa: F401
    except ModuleNotFoundError:
        print(
            "Falta el módulo dj_database_url. Activa el entorno virtual del backend\n"
            "y/o ejecuta: pip install -r requirements.txt"
        )
        sys.exit(1)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hydrotracker.settings")
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    import django
    django.setup()

    from django.utils import timezone
    from datetime import timedelta
    from users.models import User

    EMAIL = "test_user_2@testuser.com"
    try:
        user = User.objects.get(email=EMAIL)
        end_date = timezone.now().date() + timedelta(days=30)
        user.es_premium = True
        user.plan_type = "monthly"
        user.subscription_end_date = end_date
        user.preapproval_id = "test_monthly_1"
        user.auto_renewal = True
        user.save(update_fields=["es_premium", "plan_type", "subscription_end_date", "preapproval_id", "auto_renewal"])
        print(f'Usuario "{EMAIL}" configurado como premium mensual (suscripción de prueba hasta {end_date}).')
    except User.DoesNotExist:
        print(f'Usuario con email "{EMAIL}" no encontrado.')
        sys.exit(1)
