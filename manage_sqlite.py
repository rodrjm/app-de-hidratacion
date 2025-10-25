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
    # Configurar Django para usar SQLite
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hydrotracker.settings_sqlite')
    
    # Inicializar Django
    django.setup()
    
    # Ejecutar comando
    execute_from_command_line(sys.argv)




