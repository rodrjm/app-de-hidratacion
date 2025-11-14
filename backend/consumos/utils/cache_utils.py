"""
Utilidades de caché para optimización de performance.
"""

from django.core.cache import cache, caches
from django.core.cache.utils import make_template_fragment_key
from django.conf import settings
from functools import wraps
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Gestor de caché para la aplicación HydroTracker.
    """
    
    # Tiempos de expiración en segundos
    CACHE_TIMEOUTS = {
        'user_stats': 300,      # 5 minutos
        'consumo_stats': 600,   # 10 minutos
        'bebida_list': 1800,    # 30 minutos
        'premium_features': 3600,  # 1 hora
        'api_responses': 300,   # 5 minutos
        'database_queries': 600, # 10 minutos
    }
    
    @classmethod
    def get_cache_key(cls, prefix, *args, **kwargs):
        """
        Genera una clave de caché consistente.
        """
        # Crear hash de los argumentos
        key_data = f"{prefix}:{':'.join(map(str, args))}"
        if kwargs:
            key_data += f":{hashlib.md5(json.dumps(kwargs, sort_keys=True).encode()).hexdigest()[:8]}"
        
        return f"hydrotracker:{key_data}"
    
    @classmethod
    def get_or_set(cls, key, callable_func, timeout=None, cache_alias='api'):
        """
        Obtiene un valor del caché o lo calcula y almacena.
        """
        try:
            # Seleccionar caché por alias con fallback a default
            try:
                selected_cache = caches[cache_alias] if cache_alias else cache
            except Exception:
                selected_cache = cache
            # Intentar obtener del caché
            cached_value = selected_cache.get(key)
            if cached_value is not None:
                logger.debug(f"Cache HIT: {key}")
                return cached_value
            
            # Calcular valor
            logger.debug(f"Cache MISS: {key}")
            value = callable_func()
            
            # Almacenar en caché
            if timeout is None:
                timeout = cls.CACHE_TIMEOUTS.get('api_responses', 300)
            
            selected_cache.set(key, value, timeout=timeout)
            return value
            
        except Exception as e:
            logger.error(f"Error en caché para clave {key}: {e}")
            # En caso de error, ejecutar función directamente
            return callable_func()
    
    @classmethod
    def invalidate_pattern(cls, pattern, cache_alias='api'):
        """
        Invalida todas las claves que coincidan con un patrón.
        """
        try:
            # En Redis, usar SCAN para encontrar claves
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection(cache_alias)
            
            keys = []
            cursor = 0
            while True:
                cursor, partial_keys = redis_conn.scan(cursor, match=pattern, count=100)
                keys.extend(partial_keys)
                if cursor == 0:
                    break
            
            if keys:
                redis_conn.delete(*keys)
                logger.info(f"Invalidated {len(keys)} cache keys matching pattern: {pattern}")
                
        except Exception as e:
            logger.error(f"Error invalidating cache pattern {pattern}: {e}")
    
    @classmethod
    def clear_user_cache(cls, user_id):
        """
        Limpia todo el caché relacionado con un usuario.
        """
        patterns = [
            f"hydrotracker:user:{user_id}:*",
            f"hydrotracker:consumos:user:{user_id}:*",
            f"hydrotracker:stats:user:{user_id}:*",
        ]
        
        for pattern in patterns:
            cls.invalidate_pattern(pattern)


def cache_result(timeout=None, cache_alias='api', key_prefix=''):
    """
    Decorador para cachear resultados de funciones.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generar clave de caché
            cache_key = CacheManager.get_cache_key(
                f"{key_prefix}:{func.__name__}",
                *args,
                **kwargs
            )
            
            return CacheManager.get_or_set(
                cache_key,
                lambda: func(*args, **kwargs),
                timeout=timeout,
                cache_alias=cache_alias
            )
        return wrapper
    return decorator


def cache_user_data(timeout=None):
    """
    Decorador específico para cachear datos de usuario.
    Soporta métodos que reciben el usuario como argumento o que lo tienen en self.user.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Obtener usuario desde kwargs, args o self.user
            user = kwargs.get('user')
            if user is None:
                # Intentar deducir desde self.user
                user = getattr(self, 'user', None)
            if user is None and args:
                # Si el primer arg es un user, úsalo (por compatibilidad)
                possible_user = args[0]
                if hasattr(possible_user, 'id'):
                    user = possible_user
                    args = args[1:]

            if user is None or not hasattr(user, 'id'):
                # Si no se pudo determinar el usuario, ejecutar sin caché para no romper
                return func(self, *args, **kwargs)

            cache_key = CacheManager.get_cache_key(
                f"user:{user.id}:{func.__name__}",
                *args,
                **kwargs
            )
            
            return CacheManager.get_or_set(
                cache_key,
                lambda: func(self, *args, **kwargs),
                timeout=timeout or CacheManager.CACHE_TIMEOUTS.get('user_stats', 300),
                cache_alias='api'
            )
        return wrapper
    return decorator


class QueryCache:
    """
    Caché específico para consultas de base de datos.
    """
    
    @staticmethod
    def cache_queryset(queryset, cache_key, timeout=600):
        """
        Cachea un queryset completo.
        """
        try:
            # Intentar obtener del caché
            try:
                selected_cache = caches['api']
            except Exception:
                selected_cache = cache
            cached_data = selected_cache.get(cache_key)
            if cached_data is not None:
                logger.debug(f"QueryCache HIT: {cache_key}")
                return cached_data
            
            # Ejecutar consulta y cachear
            logger.debug(f"QueryCache MISS: {cache_key}")
            data = list(queryset)
            selected_cache.set(cache_key, data, timeout=timeout)
            return data
            
        except Exception as e:
            logger.error(f"Error en QueryCache para {cache_key}: {e}")
            return list(queryset)
    
    @staticmethod
    def cache_aggregation(queryset, cache_key, timeout=600):
        """
        Cachea resultados de agregaciones.
        """
        try:
            try:
                selected_cache = caches['api']
            except Exception:
                selected_cache = cache
            cached_result = selected_cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"AggregationCache HIT: {cache_key}")
                return cached_result
            
            logger.debug(f"AggregationCache MISS: {cache_key}")
            result = queryset.aggregate(
                total=Sum('cantidad_ml'),
                count=Count('id'),
                avg=Avg('cantidad_ml')
            )
            selected_cache.set(cache_key, result, timeout=timeout)
            return result
            
        except Exception as e:
            logger.error(f"Error en AggregationCache para {cache_key}: {e}")
            return queryset.aggregate(
                total=Sum('cantidad_ml'),
                count=Count('id'),
                avg=Avg('cantidad_ml')
            )


class CacheInvalidation:
    """
    Gestión de invalidación de caché.
    """
    
    @staticmethod
    def on_consumo_created(consumo):
        """
        Invalidar caché cuando se crea un consumo.
        """
        user_id = consumo.usuario.id
        CacheManager.clear_user_cache(user_id)
        
        # Invalidar caché de estadísticas globales
        CacheManager.invalidate_pattern("hydrotracker:stats:global:*")
        CacheManager.invalidate_pattern("hydrotracker:consumos:list:*")
    
    @staticmethod
    def on_consumo_updated(consumo):
        """
        Invalidar caché cuando se actualiza un consumo.
        """
        user_id = consumo.usuario.id
        CacheManager.clear_user_cache(user_id)
    
    @staticmethod
    def on_consumo_deleted(consumo):
        """
        Invalidar caché cuando se elimina un consumo.
        """
        user_id = consumo.usuario.id
        CacheManager.clear_user_cache(user_id)
    
    @staticmethod
    def on_user_updated(user):
        """
        Invalidar caché cuando se actualiza un usuario.
        """
        CacheManager.clear_user_cache(user.id)
    
    @staticmethod
    def on_bebida_updated(bebida):
        """
        Invalidar caché cuando se actualiza una bebida.
        """
        CacheManager.invalidate_pattern("hydrotracker:bebidas:*")
        CacheManager.invalidate_pattern("hydrotracker:consumos:*")


# Configuración de logging para caché
logging.basicConfig(level=logging.INFO)
cache_logger = logging.getLogger('hydrotracker.cache')
cache_logger.setLevel(logging.DEBUG)
