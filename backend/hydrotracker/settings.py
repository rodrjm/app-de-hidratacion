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
# SECRET_KEY debe estar configurado como variable de entorno en producción
# No usar defaults inseguros - forzar configuración explícita
SECRET_KEY = config('SECRET_KEY', default=None)

# Validar SECRET_KEY - requerido en producción, opcional solo en desarrollo
if not SECRET_KEY:
    # Permitir solo en desarrollo (DEBUG=True) o durante tests
    DEBUG_MODE = config('DEBUG', default=False, cast=bool)
    is_testing = 'test' in sys.argv or 'pytest' in sys.modules or 'DJANGO_SETTINGS_MODULE' in os.environ and 'sqlite' in os.environ.get('DJANGO_SETTINGS_MODULE', '')
    
    if not DEBUG_MODE and not is_testing:
        raise ImproperlyConfigured(
            'SECRET_KEY debe estar configurado en producción. '
            'Configure la variable de entorno SECRET_KEY con un valor seguro.'
        )
    # Solo en desarrollo/testing, usar un valor temporal
    SECRET_KEY = 'django-insecure-dev-only-change-in-production'

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
    'api',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'hydrotracker.middleware.RetryDbOperationalErrorOnSafeMethodsMiddleware',
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
# Prioridad: DATABASE_URL (Neon/Render/Heroku) > DB_HOST (Docker) > SQLite (local)
DATABASE_URL = config('DATABASE_URL', default=None)
DB_HOST = config('DB_HOST', default=None)

# Validar que DATABASE_URL no esté vacío y sea válido
if DATABASE_URL and DATABASE_URL.strip():
    # MODO PRODUCCIÓN (Neon/Render/Heroku) - usa DATABASE_URL
    try:
        # Parsear la URL de la base de datos
        db_conn_max_age = config('DB_CONN_MAX_AGE', default=60, cast=int)
        db_config = dj_database_url.parse(DATABASE_URL, conn_max_age=db_conn_max_age)
        
        # Detectar si es una conexión PostgreSQL (no SQLite)
        is_postgres = db_config.get('ENGINE') == 'django.db.backends.postgresql' or \
                     'postgres' in DATABASE_URL.lower() or \
                     'neon' in DATABASE_URL.lower()
        
        # Forzar SSL para PostgreSQL en producción (requerido por Neon.tech)
        if is_postgres:
            # Asegurar que OPTIONS existe
            if 'OPTIONS' not in db_config:
                db_config['OPTIONS'] = {}
            
            # Configurar SSL - Neon.tech requiere SSL obligatoriamente
            # Si la URL ya tiene sslmode, respetarlo; si no, agregar require
            if 'sslmode' not in db_config.get('OPTIONS', {}):
                # Verificar si la URL ya tiene parámetros SSL
                if '?sslmode=' not in DATABASE_URL and '&sslmode=' not in DATABASE_URL:
                    # Agregar sslmode=require si no está presente
                    db_config['OPTIONS']['sslmode'] = 'require'
                else:
                    # Extraer sslmode de la URL si está presente
                    import urllib.parse as urlparse
                    parsed = urlparse.urlparse(DATABASE_URL)
                    query_params = urlparse.parse_qs(parsed.query)
                    if 'sslmode' in query_params:
                        db_config['OPTIONS']['sslmode'] = query_params['sslmode'][0]
                    else:
                        db_config['OPTIONS']['sslmode'] = 'require'
            
            # Configuraciones adicionales recomendadas para Neon
            db_config['OPTIONS']['connect_timeout'] = 10
            db_config['OPTIONS']['keepalives'] = 1
            db_config['OPTIONS']['keepalives_idle'] = 30
            db_config['OPTIONS']['keepalives_interval'] = 10
            db_config['OPTIONS']['keepalives_count'] = 5
        
        DATABASES = {
            'default': db_config
        }
    except (ValueError, Exception) as e:
        # Si DATABASE_URL es inválido, registrar error y usar fallback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error al parsear DATABASE_URL: {str(e)}')
        DATABASE_URL = None

# Si DATABASE_URL no está disponible o es inválido, intentar DB_HOST
# Nota: DB_HOST='db' solo funciona en Docker Compose, no en Render/Heroku
if not DATABASE_URL or (isinstance(DATABASE_URL, str) and not DATABASE_URL.strip()):
    # Solo usar DB_HOST si no es 'db' (que es específico de Docker Compose)
    # y si tenemos todas las variables necesarias configuradas
    db_name = config('DB_NAME', default=None)
    db_user = config('DB_USER', default=None)
    db_password = config('DB_PASSWORD', default=None)
    
    if (DB_HOST and DB_HOST != 'db' and 
        db_name and db_user and db_password):
        # MODO DOCKER/PRODUCCIÓN (PostgreSQL con variables individuales)
        # Nota: Si DB_HOST apunta a Neon, asegurar SSL
        db_config = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name,
            'USER': db_user,
            'PASSWORD': db_password,
            'HOST': DB_HOST,
            'PORT': config('DB_PORT', default='5432'),
        }
        
        # Si es producción (no localhost), forzar SSL
        is_production = not DEBUG and DB_HOST not in ('localhost', '127.0.0.1', 'db')
        if is_production or 'neon' in DB_HOST.lower():
            db_config['OPTIONS'] = {
                'sslmode': 'require',
                'connect_timeout': 10,
            }
        
        DATABASES = {
            'default': db_config
        }
    else:
        # MODO LOCAL (SQLite) - fallback cuando no hay DATABASE_URL ni DB_HOST válido
        # Esto incluye cuando DB_HOST='db' (Docker Compose) pero no estamos en Docker
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

# Verificar si Redis está disponible (debe definirse antes de REST_FRAMEWORK)
REDIS_URL = config('REDIS_URL', default=None)
USE_REDIS = REDIS_URL and REDIS_URL.strip() and not REDIS_URL.startswith('dummy://')

# Django REST Framework
REST_FRAMEWORK = {
    # Autenticación híbrida: JWT para apps móviles (prioridad) y Session para web/admin
    # JWT tiene prioridad porque se verifica primero y funciona mejor en entornos móviles
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # Prioridad: Apps móviles (Capacitor)
        'rest_framework.authentication.SessionAuthentication',  # Respaldo: Web/Admin
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
    # Throttling: solo usar si Redis está disponible, de lo contrario deshabilitar
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ] if USE_REDIS else [],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '120/min',
        'login': '10/min',
        'export': '10/min',
        'export_premium': '60/min',
    } if USE_REDIS else {},
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    # Sesiones largas para "Recordarme": access ~7 días, refresh ~180 días
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=180),
    # No rotamos el refresh ni lo ponemos en blacklist en cada uso, para evitar
    # problemas si el cliente no persiste siempre la última versión.
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
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
# Incluir URLs de desarrollo, producción y Capacitor (App Móvil)
CORS_ALLOWED_ORIGINS_STR = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://192.168.0.26:8000,https://dosis-vital.onrender.com,https://dosis-vital-ahxj.onrender.com'
)
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_STR.split(',') if origin.strip()]

# Orígenes específicos de Capacitor (Apps Móviles)
# capacitor://localhost es el esquema usado en iOS
# http://localhost es usado en Android
CAPACITOR_ORIGINS = [
    'capacitor://localhost',
    'http://localhost',
    'ionic://localhost',
]

# Combinar orígenes web y móviles
CORS_ALLOWED_ORIGINS.extend(CAPACITOR_ORIGINS)

CORS_ALLOW_CREDENTIALS = True

# Métodos HTTP permitidos
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Headers permitidos
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CORS adicional para desarrollo
if DEBUG:
    CORS_ALLOWED_ORIGINS.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

# Configuración de metas de hidratación
META_FIJA_ML = config('META_FIJA_ML', default=2000, cast=int)
META_MAX_RECORDATORIOS_GRATUITOS = config('META_MAX_RECORDATORIOS_GRATUITOS', default=4, cast=int)
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

# Configuración de Caché Redis (opcional)
# Si Redis no está disponible, usar cache en memoria (dummy)
# NOTA: USE_REDIS ya está definido arriba antes de REST_FRAMEWORK

if USE_REDIS:
    # Usar Redis si está configurado
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL + '/1' if not REDIS_URL.endswith('/1') else REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': 50,
                    'retry_on_timeout': True,
                },
                'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
                'IGNORE_EXCEPTIONS': True,  # No fallar si Redis no está disponible
            },
            'KEY_PREFIX': 'hydrotracker',
            'TIMEOUT': 300,  # 5 minutos por defecto
        },
        'sessions': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL + '/2' if not REDIS_URL.endswith('/2') else REDIS_URL.replace('/1', '/2'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'IGNORE_EXCEPTIONS': True,
            },
            'KEY_PREFIX': 'hydrotracker_sessions',
            'TIMEOUT': 15552000,  # 180 días
        },
        'api': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL + '/3' if not REDIS_URL.endswith('/3') else REDIS_URL.replace('/1', '/3'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
                'IGNORE_EXCEPTIONS': True,
            },
            'KEY_PREFIX': 'hydrotracker_api',
            'TIMEOUT': 600,  # 10 minutos
        }
    }
    SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
    SESSION_CACHE_ALIAS = 'sessions'
else:
    # Usar cache en memoria (dummy) cuando Redis no está disponible
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        },
        'sessions': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        },
        'api': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    }
    # Usar sesiones en base de datos cuando Redis no está disponible
    SESSION_ENGINE = 'django.contrib.sessions.backends.db'

SESSION_COOKIE_AGE = 15552000  # 180 días (para coincidir con el REFRESH_TOKEN_LIFETIME)

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

# Configuración de Mercado Pago
# MP_ACCESS_TOKEN y MP_PUBLIC_KEY deben provenir de la cuenta VENDEDOR (no del comprador)
MP_ACCESS_TOKEN = config('MP_ACCESS_TOKEN', default=None)
MP_PUBLIC_KEY = config('MP_PUBLIC_KEY', default=None)
BACKEND_URL = config('BACKEND_URL', default='http://localhost:8000')
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')
