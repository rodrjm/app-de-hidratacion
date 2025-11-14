"""
Configuración alternativa para HydroTracker usando SQLite.
Úsala si tienes problemas con PostgreSQL.
"""

from .settings import *

# Configuración de base de datos SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Configuración adicional para SQLite
DATABASES['default']['OPTIONS'] = {
    'timeout': 20,
}

# Configuración de caché para SQLite (opcional)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    },
    'sessions': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-sessions',
    }
}

# Configuración de sesiones
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'

# Configuración de archivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Configuración de archivos de media
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

print("🔧 Usando configuración SQLite")
print("📁 Base de datos: db.sqlite3")
print("💡 Para usar PostgreSQL, cambia a settings.py")




