#!/usr/bin/env python
"""
Script de gestión para HydroTracker usando SQLite.
Úsalo si tienes problemas con PostgreSQL.
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    # Asegurar que el paquete del proyecto ('hydrotracker') se pueda importar desde ./backend
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
    if BACKEND_DIR not in sys.path:
        sys.path.insert(0, BACKEND_DIR)

    # Configurar Django para usar settings de SQLite
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hydrotracker.settings_sqlite')

    # Inicializar Django
    django.setup()

    # Ejecutar comando
    execute_from_command_line(sys.argv)




