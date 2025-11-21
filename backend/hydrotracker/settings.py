"""
Django settings for hydrotracker project.
"""

from pathlib import Path
import os
import sys
from decouple import config
from django.core.exceptions import ImproperlyConfigured
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

# Validar SECRET_KEY en producción
if not SECRET_KEY or SECRET_KEY == 'django-insecure-change-this-in-production':
    # Permitir solo en desarrollo (DEBUG=True)
    DEBUG_MODE = config('DEBUG', default=True, cast=bool)
    if not DEBUG_MODE:
        raise ImproperlyConfigured(
            'SECRET_KEY debe estar configurado en producción. '
            'Configure la variable de entorno SECRET_KEY con un valor seguro.'
        )

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

# ALLOWED_HOSTS - Validar en producción
# Obtener DEBUG antes de validar (puede ser sobrescrito por settings_sqlite)
DEBUG_FOR_VALIDATION = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS_STR = config('ALLOWED_HOSTS', default='localhost,127.0.0.1')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(',') if host.strip()]

# Validar que ALLOWED_HOSTS esté configurado en producción
# Permitir localhost/testserver para desarrollo y testing
is_testing = 'test' in sys.argv or 'pytest' in sys.modules or 'DJANGO_SETTINGS_MODULE' in os.environ and 'sqlite' in os.environ.get('DJANGO_SETTINGS_MODULE', '')
if not ALLOWED_HOSTS or (not DEBUG_FOR_VALIDATION and not is_testing and 'localhost' in ALLOWED_HOSTS and '127.0.0.1' in ALLOWED_HOSTS and len(ALLOWED_HOSTS) == 2):
    if not DEBUG_FOR_VALIDATION and not is_testing:
        raise ImproperlyConfigured(
            'ALLOWED_HOSTS debe estar configurado en producción. '
            'Configure la variable de entorno ALLOWED_HOSTS con el dominio de producción.'
        )

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'django_redis',
    'debug_toolbar',
    'django_extensions',
]

LOCAL_APPS = [
    'users',
    'consumos',
    'actividades',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'hydrotracker.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hydrotracker.wsgi.application'

# Database - Configuración consciente del entorno
# Prioridad: DATABASE_URL (Render/Heroku) > DB_HOST (Docker) > SQLite (local)
DATABASE_URL = config('DATABASE_URL', default=None)
DB_HOST = config('DB_HOST', default=None)

# Validar que DATABASE_URL no esté vacío y sea válido
if DATABASE_URL and DATABASE_URL.strip():
    # MODO RENDER/HEROKU (usa DATABASE_URL)
    try:
        DATABASES = {
            'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
        }
    except (ValueError, Exception):
        # Si DATABASE_URL es inválido, usar fallback
        DATABASE_URL = None

# Si DATABASE_URL no está disponible o es inválido, intentar DB_HOST
if not DATABASE_URL or (isinstance(DATABASE_URL, str) and not DATABASE_URL.strip()):
    if DB_HOST:
        # MODO DOCKER/PRODUCCIÓN (PostgreSQL con variables individuales)
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': config('DB_NAME'),
                'USER': config('DB_USER'),
                'PASSWORD': config('DB_PASSWORD'),
                'HOST': DB_HOST,  # Será 'db' en Docker Compose
                'PORT': config('DB_PORT', default='5432'),
            }
        }
    else:
        # MODO LOCAL (SQLite)
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

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '120/min',
        'login': '10/min',
        'export': '10/min',
        'export_premium': '60/min',
    },
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
    'BLACKLIST_TOKEN_CHECKS': [
        'rest_framework_simplejwt.token_blacklist.models.BlacklistedToken',
    ],
}

# CORS settings - Configurable desde variables de entorno
CORS_ALLOWED_ORIGINS_STR = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000'
)
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_STR.split(',') if origin.strip()]

CORS_ALLOW_CREDENTIALS = True

# CORS adicional para desarrollo
if DEBUG:
    CORS_ALLOWED_ORIGINS.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

# Configuración de metas de hidratación
META_FIJA_ML = config('META_FIJA_ML', default=2000, cast=int)
META_MAX_RECORDATORIOS_GRATUITOS = config('META_MAX_RECORDATORIOS_GRATUITOS', default=3, cast=int)
META_MAX_RECORDATORIOS_PREMIUM = config('META_MAX_RECORDATORIOS_PREMIUM', default=10, cast=int)

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'security': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} [SECURITY] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'formatter': 'security',
        },
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'users.security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}

# drf-spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Dosis vital: Tu aplicación de hidratación personal API',
    'DESCRIPTION': '''
    # Dosis vital: Tu aplicación de hidratación personal API Documentation
    
    API RESTful para el seguimiento de hidratación personal.
    
    ## Características Principales
    
    - **Gestión de Consumos**: Registro y seguimiento de consumo de líquidos
    - **Metas Personalizadas**: Establecimiento y seguimiento de objetivos de hidratación
    - **Recordatorios**: Sistema de notificaciones personalizables
    - **Estadísticas Avanzadas**: Análisis detallado de patrones de hidratación
    - **Monetización**: Sistema freemium con funcionalidades premium
    
    ## Autenticación
    
    La API utiliza JWT (JSON Web Tokens) para la autenticación. Incluye el token en el header:
    ```
    Authorization: Bearer <tu_token>
    ```
    
    ## Funcionalidades Premium
    
    - Meta diaria personalizada basada en peso y actividad
    - Bebidas premium exclusivas
    - Recordatorios ilimitados
    - Estadísticas avanzadas y insights
    - Sin anuncios
    
    ## Límites para Usuarios Gratuitos
    
    - Máximo 3 recordatorios
    - Máximo 10 consumos por día
    - Acceso limitado a estadísticas básicas
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    'TAGS': [
        {'name': 'Autenticación', 'description': 'Endpoints de autenticación y gestión de usuarios'},
        {'name': 'Consumos', 'description': 'Gestión de consumos de hidratación'},
        {'name': 'Recipientes', 'description': 'Gestión de recipientes personalizados'},
        {'name': 'Bebidas', 'description': 'Catálogo de bebidas y sus propiedades'},
        {'name': 'Metas', 'description': 'Gestión de metas de hidratación'},
        {'name': 'Recordatorios', 'description': 'Sistema de recordatorios personalizables'},
        {'name': 'Monetización', 'description': 'Endpoints relacionados con la lógica freemium'},
        {'name': 'Premium', 'description': 'Funcionalidades exclusivas para usuarios premium'},
        {'name': 'Estadísticas', 'description': 'Análisis y reportes de hidratación'},
    ],
    'EXTENSIONS_INFO': {
        'x-logo': {
            'url': 'https://via.placeholder.com/200x50/4CAF50/FFFFFF?text=Dosis%20vital%3A%20Tu%20aplicaci%C3%B3n%20de%20hidrataci%C3%B3n%20personal',
            'altText': 'Dosis vital: Tu aplicación de hidratación personal Logo'
        }
    },
    'CONTACT': {
        'name': 'Equipo de Desarrollo Dosis vital: Tu aplicación de hidratación personal',
        'email': 'dev@hydrotracker.com',
        'url': 'https://hydrotracker.com'
    },
    'LICENSE': {
        'name': 'MIT License',
        'url': 'https://opensource.org/licenses/MIT'
    },
    'EXTERNAL_DOCS': {
        'description': 'Documentación adicional',
        'url': 'https://docs.hydrotracker.com'
    }
}

# Configuración de Caché Redis
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'hydrotracker',
        'TIMEOUT': 300,  # 5 minutos por defecto
    },
    'sessions': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/2'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'hydrotracker_sessions',
        'TIMEOUT': 86400,  # 24 horas
    },
    'api': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/3'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'hydrotracker_api',
        'TIMEOUT': 600,  # 10 minutos
    }
}

# Configuración de sesiones con Redis
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'
SESSION_COOKIE_AGE = 86400  # 24 horas

# Security Headers - Solo en producción (HTTPS requerido)
if not DEBUG:
    # HTTPS Settings
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Security Headers
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)  # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Session Security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # CSRF Security
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    CSRF_COOKIE_SAMESITE = 'Lax'
else:
    # En desarrollo, headers menos restrictivos
    X_FRAME_OPTIONS = 'SAMEORIGIN'
    SECURE_BROWSER_XSS_FILTER = False
    SECURE_CONTENT_TYPE_NOSNIFF = True

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
