# 🚀 Guía de Performance - HydroTracker API

## 📋 Índice
1. [Introducción](#introducción)
2. [Optimizaciones Implementadas](#optimizaciones-implementadas)
3. [Configuración de Caché](#configuración-de-caché)
4. [Optimización de Consultas](#optimización-de-consultas)
5. [Monitoreo de Performance](#monitoreo-de-performance)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Troubleshooting](#troubleshooting)

## 🎯 Introducción

Esta guía documenta las optimizaciones de performance implementadas en HydroTracker API para asegurar un rendimiento óptimo incluso con grandes volúmenes de datos.

## ⚡ Optimizaciones Implementadas

### 1. **Sistema de Caché Redis**
- ✅ **Caché de consultas** frecuentes
- ✅ **Caché de estadísticas** de usuario
- ✅ **Caché de respuestas** de API
- ✅ **Invalidación inteligente** de caché
- ✅ **Compresión** de datos en caché

### 2. **Optimización de Consultas**
- ✅ **select_related** para relaciones directas
- ✅ **prefetch_related** para relaciones reversas
- ✅ **Índices de base de datos** estratégicos
- ✅ **Agregaciones optimizadas**
- ✅ **Lazy loading** de querysets

### 3. **Serializers Optimizados**
- ✅ **Campos específicos** en lugar de `__all__`
- ✅ **Serializers anidados** optimizados
- ✅ **Serializers de lista** con campos mínimos
- ✅ **Caché de serialización**

### 4. **Paginación Inteligente**
- ✅ **Paginación por defecto** (20 elementos)
- ✅ **Paginación personalizable**
- ✅ **Caché de páginas** frecuentes

## 🔧 Configuración de Caché

### Configuración Redis

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
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
        'TIMEOUT': 300,  # 5 minutos
    },
    'api': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/3',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'hydrotracker_api',
        'TIMEOUT': 600,  # 10 minutos
    }
}
```

### Utilidades de Caché

```python
from consumos.utils.cache_utils import CacheManager, cache_result

# Decorador para cachear métodos
@cache_result(timeout=600, key_prefix='user_stats')
def get_user_stats(self, user):
    # Lógica del método
    pass

# Caché manual
cache_key = CacheManager.get_cache_key('user_stats', user.id)
result = CacheManager.get_or_set(
    cache_key,
    lambda: calculate_stats(user),
    timeout=300
)
```

## 🗄️ Optimización de Consultas

### 1. **select_related y prefetch_related**

```python
# ❌ Malo - N+1 queries
consumos = Consumo.objects.filter(usuario=user)
for consumo in consumos:
    print(consumo.bebida.nombre)  # Query adicional por cada consumo

# ✅ Bueno - 1 query
consumos = Consumo.objects.select_related(
    'bebida', 'recipiente', 'usuario'
).filter(usuario=user)
for consumo in consumos:
    print(consumo.bebida.nombre)  # Sin queries adicionales
```

### 2. **Agregaciones Optimizadas**

```python
# ❌ Malo - Múltiples queries
total_ml = Consumo.objects.filter(usuario=user).aggregate(Sum('cantidad_ml'))
count = Consumo.objects.filter(usuario=user).count()
avg = Consumo.objects.filter(usuario=user).aggregate(Avg('cantidad_ml'))

# ✅ Bueno - 1 query
stats = Consumo.objects.filter(usuario=user).aggregate(
    total_ml=Sum('cantidad_ml'),
    count=Count('id'),
    avg=Avg('cantidad_ml')
)
```

### 3. **Índices de Base de Datos**

```sql
-- Índices implementados automáticamente
CREATE INDEX idx_consumo_usuario_fecha ON consumos_consumo (usuario_id, fecha_hora);
CREATE INDEX idx_consumo_fecha ON consumos_consumo (fecha_hora);
CREATE INDEX idx_bebida_activa ON consumos_bebida (activa);
CREATE INDEX idx_recipiente_usuario ON consumos_recipiente (usuario_id);
```

### 4. **Querysets Optimizados**

```python
class ConsumoViewSet(BaseViewSet):
    queryset = Consumo.objects.select_related(
        'usuario', 'bebida', 'recipiente'
    ).prefetch_related(
        'bebida__categoria',
        'recipiente__usuario'
    ).all()
```

## 📊 Monitoreo de Performance

### 1. **Django Debug Toolbar**

```python
# settings.py (solo en desarrollo)
if DEBUG:
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
```

### 2. **Endpoint de Performance**

```bash
# Probar performance
GET /api/consumos/performance_test/
```

**Respuesta:**
```json
{
  "performance_comparison": {
    "sin_optimizaciones": "0.1234s",
    "con_select_related": "0.0456s",
    "con_cache": "0.0012s",
    "mejora_select_related": "63.0%",
    "mejora_cache": "99.0%"
  }
}
```

### 3. **Métricas de Caché**

```python
# Verificar estadísticas de caché
from django.core.cache import cache

# Obtener estadísticas
cache_stats = cache.get_stats()
print(f"Cache hits: {cache_stats['hits']}")
print(f"Cache misses: {cache_stats['misses']}")
print(f"Hit rate: {cache_stats['hits'] / (cache_stats['hits'] + cache_stats['misses']) * 100}%")
```

### 4. **Monitoreo de Consultas**

```python
# En desarrollo, usar logging
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['console'],
        },
    },
}
```

## 🏆 Mejores Prácticas

### 1. **Optimización de ViewSets**

```python
class OptimizedViewSet(BaseViewSet):
    # Usar querysets optimizados
    queryset = Model.objects.select_related('related_field').all()
    
    # Implementar caché en métodos costosos
    @cache_result(timeout=600)
    def expensive_method(self):
        pass
    
    # Usar serializers optimizados
    def get_serializer_class(self):
        if self.action == 'list':
            return OptimizedListSerializer
        return OptimizedDetailSerializer
```

### 2. **Optimización de Serializers**

```python
class OptimizedSerializer(serializers.ModelSerializer):
    # Solo campos necesarios
    class Meta:
        model = Model
        fields = ['id', 'name', 'created_at']  # No usar __all__
    
    # Usar serializers anidados optimizados
    related_field = OptimizedRelatedSerializer(read_only=True)
```

### 3. **Gestión de Caché**

```python
# Invalidar caché cuando sea necesario
def on_model_save(sender, instance, **kwargs):
    CacheManager.clear_user_cache(instance.usuario.id)

# Usar timeouts apropiados
@cache_result(timeout=300)  # 5 minutos para datos que cambian poco
def get_static_data():
    pass

@cache_result(timeout=60)   # 1 minuto para datos dinámicos
def get_dynamic_data():
    pass
```

### 4. **Optimización de Base de Datos**

```python
# Usar índices compuestos para consultas frecuentes
class Meta:
    indexes = [
        models.Index(fields=['usuario', 'fecha_hora']),
        models.Index(fields=['activo', 'tipo']),
    ]

# Usar select_related en consultas frecuentes
queryset = Model.objects.select_related('usuario', 'categoria')
```

## 🔍 Troubleshooting

### 1. **Problemas de Performance Comunes**

#### **N+1 Queries**
```python
# ❌ Problema
for consumo in Consumo.objects.all():
    print(consumo.bebida.nombre)  # N+1 queries

# ✅ Solución
for consumo in Consumo.objects.select_related('bebida'):
    print(consumo.bebida.nombre)  # 1 query
```

#### **Consultas Lentas**
```python
# ❌ Problema
consumos = Consumo.objects.filter(
    usuario=user,
    fecha_hora__date=date
).order_by('-fecha_hora')

# ✅ Solución
consumos = Consumo.objects.select_related(
    'bebida', 'recipiente'
).filter(
    usuario=user,
    fecha_hora__date=date
).order_by('-fecha_hora')
```

### 2. **Problemas de Caché**

#### **Caché No Funciona**
```python
# Verificar configuración Redis
from django.core.cache import cache
cache.set('test', 'value', 60)
assert cache.get('test') == 'value'
```

#### **Caché Desactualizado**
```python
# Invalidar caché manualmente
CacheManager.clear_user_cache(user.id)
CacheManager.invalidate_pattern('user:*')
```

### 3. **Comandos de Diagnóstico**

```bash
# Verificar conexión Redis
redis-cli ping

# Ver estadísticas de Redis
redis-cli info stats

# Limpiar caché
redis-cli flushdb

# Ver claves de caché
redis-cli keys "hydrotracker:*"
```

### 4. **Monitoreo en Producción**

```python
# Middleware personalizado para monitoreo
class PerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        response = self.get_response(request)
        process_time = time.time() - start_time
        
        # Log performance
        if process_time > 1.0:  # Más de 1 segundo
            logger.warning(f"Slow request: {request.path} took {process_time:.2f}s")
        
        return response
```

## 📈 Métricas de Performance

### **Objetivos de Rendimiento**

- **Tiempo de respuesta API**: < 200ms
- **Tiempo de consultas DB**: < 50ms
- **Hit rate de caché**: > 80%
- **Memoria utilizada**: < 512MB por worker
- **CPU utilizada**: < 70%

### **Herramientas de Monitoreo**

```python
# Métricas personalizadas
import time
from django.core.cache import cache

class PerformanceMetrics:
    @staticmethod
    def track_query_time(func):
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            duration = time.time() - start
            
            # Almacenar métrica
            cache.set(f'query_time_{func.__name__}', duration, 3600)
            return result
        return wrapper
    
    @staticmethod
    def get_cache_stats():
        return {
            'hit_rate': cache.get('cache_hit_rate', 0),
            'total_requests': cache.get('total_requests', 0),
            'avg_response_time': cache.get('avg_response_time', 0)
        }
```

## 🚀 Optimizaciones Futuras

### **Próximas Mejoras**

1. **CDN para archivos estáticos**
2. **Compresión gzip/brotli**
3. **Connection pooling** para base de datos
4. **Read replicas** para consultas
5. **Caché de sesiones** optimizado
6. **Lazy loading** de imágenes
7. **WebSockets** para actualizaciones en tiempo real

### **Escalabilidad**

```python
# Configuración para alta carga
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': [
            'redis://redis1:6379/1',
            'redis://redis2:6379/1',
            'redis://redis3:6379/1',
        ],
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 100,
                'retry_on_timeout': True,
            },
        },
    }
}
```

---

**¡Con estas optimizaciones, HydroTracker API está preparada para manejar alta carga de manera eficiente! 🚀**
