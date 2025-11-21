"""
Configuración alternativa para Dosis vital: Tu aplicación de hidratación personal usando SQLite.
Úsala si tienes problemas con PostgreSQL.
Ideal para desarrollo y testing.
"""

from .settings import *
import os

# Forzar DEBUG=True para SQLite/testing
DEBUG = True

# Configurar ALLOWED_HOSTS para desarrollo/testing
if not os.environ.get('ALLOWED_HOSTS'):
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']

# Deshabilitar security headers para testing
SECURE_SSL_REDIRECT = False
SECURE_BROWSER_XSS_FILTER = False
SECURE_CONTENT_TYPE_NOSNIFF = False
X_FRAME_OPTIONS = 'SAMEORIGIN'
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

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

# Configuración de Django Debug Toolbar (solo en desarrollo)
if DEBUG:
    INTERNAL_IPS = [
        '127.0.0.1',
        'localhost',
    ]
    
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    
    # Configuración adicional para debug toolbar
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TEMPLATE_CONTEXT': True,
        'SHOW_COLLAPSED': True,
    }

print("🔧 Usando configuración SQLite")
print("📁 Base de datos: db.sqlite3")
print("💡 Para usar PostgreSQL, cambia a settings.py")




