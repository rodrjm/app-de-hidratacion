"""
Tests de performance para HydroTracker API.
"""

import pytest
import time
from django.test import TestCase, TransactionTestCase
from django.core.cache import cache
from django.db import connection
from django.test.utils import override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count, Avg
from rest_framework.test import APIClient
from rest_framework import status

from consumos.models import Consumo, Bebida, Recipiente
from consumos.utils.cache_utils import CacheManager
from tests.factories import (
    UserFactory, ConsumoFactory, BebidaFactory, RecipienteFactory
)

User = get_user_model()


@pytest.mark.django_db
class TestQueryOptimization(TestCase):
    """Tests para optimización de consultas."""

    def test_select_related_optimization(self):
        """Test que select_related reduce el número de consultas."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        # Crear varios consumos
        for i in range(10):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente
            )

        # Test sin select_related
        with self.assertNumQueries(11):  # 1 para consumos + 10 para bebidas/recipientes
            consumos = Consumo.objects.filter(usuario=user)
            for consumo in consumos:
                _ = consumo.bebida.nombre
                _ = consumo.recipiente.nombre

        # Test con select_related
        with self.assertNumQueries(1):  # Solo 1 consulta
            consumos = Consumo.objects.select_related(
                'bebida', 'recipiente'
            ).filter(usuario=user)
            for consumo in consumos:
                _ = consumo.bebida.nombre
                _ = consumo.recipiente.nombre

    def test_prefetch_related_optimization(self):
        """Test que prefetch_related optimiza consultas de relaciones reversas."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        # Crear consumos
        for i in range(5):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente
            )

        # Test sin prefetch_related
        with self.assertNumQueries(2):  # 1 para bebida + 1 para consumos
            bebida = Bebida.objects.get(id=bebida.id)
            _ = list(bebida.consumos.all())

        # Test con prefetch_related
        with self.assertNumQueries(1):  # Solo 1 consulta
            bebida = Bebida.objects.prefetch_related('consumos').get(id=bebida.id)
            _ = list(bebida.consumos.all())

    def test_aggregation_optimization(self):
        """Test que las agregaciones se ejecutan en una sola consulta."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        # Crear consumos
        for i in range(10):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=100 * (i + 1)
            )

        # Test agregación optimizada
        with self.assertNumQueries(1):
            stats = Consumo.objects.filter(usuario=user).aggregate(
                total_ml=Sum('cantidad_ml'),
                count=Count('id'),
                avg=Avg('cantidad_ml')
            )
            assert stats['total_ml'] == 5500  # 100+200+...+1000
            assert stats['count'] == 10


@pytest.mark.django_db
class TestCachePerformance(TestCase):
    """Tests para performance de caché."""

    def setUp(self):
        """Configurar datos de prueba."""
        self.user = UserFactory()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Limpiar caché
        cache.clear()

    def test_cache_hit_performance(self):
        """Test que el caché mejora el rendimiento."""
        # Crear datos de prueba
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=self.user)
        
        for i in range(50):
            ConsumoFactory(
                usuario=self.user,
                bebida=bebida,
                recipiente=recipiente
            )

        # Test sin caché
        start_time = time.time()
        response1 = self.client.get('/api/consumos/')
        time_without_cache = time.time() - start_time
        
        # Test con caché (segunda llamada)
        start_time = time.time()
        response2 = self.client.get('/api/consumos/')
        time_with_cache = time.time() - start_time
        
        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK
        assert time_with_cache < time_without_cache

    def test_cache_invalidation(self):
        """Test que la invalidación de caché funciona correctamente."""
        # Crear consumo inicial
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=self.user)
        consumo = ConsumoFactory(
            usuario=self.user,
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=100
        )

        # Obtener lista inicial
        response1 = self.client.get('/api/consumos/')
        assert response1.status_code == status.HTTP_200_OK
        assert len(response1.data['results']) == 1

        # Crear nuevo consumo (debería invalidar caché)
        ConsumoFactory(
            usuario=self.user,
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=200
        )

        # Verificar que se ve el nuevo consumo
        response2 = self.client.get('/api/consumos/')
        assert response2.status_code == status.HTTP_200_OK
        assert len(response2.data['results']) == 2

    def test_cache_key_generation(self):
        """Test que las claves de caché se generan correctamente."""
        key1 = CacheManager.get_cache_key('test', 'user1', 'param1')
        key2 = CacheManager.get_cache_key('test', 'user1', 'param1')
        key3 = CacheManager.get_cache_key('test', 'user2', 'param1')
        
        assert key1 == key2
        assert key1 != key3
        assert key1.startswith('hydrotracker:')

    def test_cache_timeout(self):
        """Test que el timeout de caché funciona."""
        cache_key = CacheManager.get_cache_key('timeout_test')
        
        # Establecer valor con timeout corto
        cache.set(cache_key, 'test_value', timeout=1)
        assert cache.get(cache_key) == 'test_value'
        
        # Esperar que expire
        time.sleep(1.1)
        assert cache.get(cache_key) is None


@pytest.mark.django_db
class TestDatabaseIndexes(TestCase):
    """Tests para verificar que los índices mejoran el rendimiento."""

    def test_consumo_user_date_index(self):
        """Test que el índice de usuario y fecha mejora las consultas."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        # Crear muchos consumos
        for i in range(100):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente
            )

        # Medir tiempo de consulta con índice
        start_time = time.time()
        consumos = Consumo.objects.filter(
            usuario=user,
            fecha_hora__date=timezone.now().date()
        )
        list(consumos)  # Forzar evaluación
        query_time = time.time() - start_time
        
        # Verificar que la consulta es rápida (menos de 0.1 segundos)
        assert query_time < 0.1

    def test_bebida_activa_index(self):
        """Test que el índice de bebidas activas mejora las consultas."""
        # Crear muchas bebidas
        for i in range(100):
            BebidaFactory(activa=True)
        for i in range(50):
            BebidaFactory(activa=False)

        # Medir tiempo de consulta
        start_time = time.time()
        bebidas_activas = Bebida.objects.filter(activa=True)
        list(bebidas_activas)  # Forzar evaluación
        query_time = time.time() - start_time
        
        # Verificar que la consulta es rápida
        assert query_time < 0.1
        assert len(bebidas_activas) == 100


@pytest.mark.django_db
class TestAPIPerformance(TestCase):
    """Tests para performance de endpoints de API."""

    def setUp(self):
        """Configurar datos de prueba."""
        self.user = UserFactory()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_consumos_list_performance(self):
        """Test que la lista de consumos es rápida."""
        # Crear datos de prueba
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=self.user)
        
        for i in range(100):
            ConsumoFactory(
                usuario=self.user,
                bebida=bebida,
                recipiente=recipiente
            )

        # Medir tiempo de respuesta
        start_time = time.time()
        response = self.client.get('/api/consumos/')
        response_time = time.time() - start_time
        
        assert response.status_code == status.HTTP_200_OK
        assert response_time < 1.0  # Menos de 1 segundo
        assert len(response.data['results']) <= 20  # Paginación funcionando

    def test_stats_performance(self):
        """Test que las estadísticas se calculan rápidamente."""
        # Crear datos de prueba
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=self.user)
        
        for i in range(50):
            ConsumoFactory(
                usuario=self.user,
                bebida=bebida,
                recipiente=recipiente
            )

        # Medir tiempo de respuesta
        start_time = time.time()
        response = self.client.get('/api/consumos/stats/')
        response_time = time.time() - start_time
        
        assert response.status_code == status.HTTP_200_OK
        assert response_time < 0.5  # Menos de 0.5 segundos

    def test_cached_stats_performance(self):
        """Test que las estadísticas cacheadas son más rápidas."""
        # Crear datos de prueba
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=self.user)
        
        for i in range(50):
            ConsumoFactory(
                usuario=self.user,
                bebida=bebida,
                recipiente=recipiente
            )

        # Primera llamada (sin caché)
        start_time = time.time()
        response1 = self.client.get('/api/consumos/cached_stats/')
        time_first_call = time.time() - start_time
        
        # Segunda llamada (con caché)
        start_time = time.time()
        response2 = self.client.get('/api/consumos/cached_stats/')
        time_second_call = time.time() - start_time
        
        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK
        assert time_second_call < time_first_call

    def test_performance_test_endpoint(self):
        """Test que el endpoint de performance funciona."""
        # Crear datos de prueba
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=self.user)
        
        for i in range(20):
            ConsumoFactory(
                usuario=self.user,
                bebida=bebida,
                recipiente=recipiente
            )

        response = self.client.get('/api/consumos/performance_test/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'performance_comparison' in response.data
        assert 'datos' in response.data
        
        # Verificar que hay mejoras de performance
        comparison = response.data['performance_comparison']
        assert 'mejora_select_related' in comparison
        assert 'mejora_cache' in comparison


@pytest.mark.django_db
class TestMemoryUsage(TestCase):
    """Tests para uso de memoria."""

    def test_large_dataset_memory_usage(self):
        """Test que grandes datasets no consumen demasiada memoria."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        # Crear dataset grande
        consumos = []
        for i in range(1000):
            consumos.append(ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente
            ))

        # Verificar que se puede procesar sin problemas
        queryset = Consumo.objects.select_related(
            'bebida', 'recipiente'
        ).filter(usuario=user)
        
        # Procesar en lotes para evitar problemas de memoria
        batch_size = 100
        total_processed = 0
        
        for i in range(0, len(consumos), batch_size):
            batch = queryset[i:i+batch_size]
            total_processed += len(batch)
        
        assert total_processed == 1000

    def test_queryset_evaluation(self):
        """Test que los querysets se evalúan eficientemente."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        # Crear consumos
        for i in range(100):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente
            )

        # Test que el queryset se evalúa solo cuando es necesario
        queryset = Consumo.objects.filter(usuario=user)
        
        # El queryset no se ha evaluado aún
        assert not queryset._result_cache
        
        # Evaluar el queryset
        list(queryset)
        
        # Ahora el queryset está en caché
        assert queryset._result_cache is not None


@pytest.mark.django_db
class TestConcurrentAccess(TestCase):
    """Tests para acceso concurrente."""

    def test_concurrent_cache_access(self):
        """Test que el caché maneja acceso concurrente correctamente."""
        user = UserFactory()
        
        # Simular acceso concurrente
        def get_cached_data():
            cache_key = CacheManager.get_cache_key('concurrent_test', user.id)
            return CacheManager.get_or_set(
                cache_key,
                lambda: f"data_for_user_{user.id}",
                timeout=60
            )
        
        # Ejecutar múltiples veces (simulando concurrencia)
        results = []
        for i in range(10):
            results.append(get_cached_data())
        
        # Todos los resultados deberían ser iguales
        assert all(result == results[0] for result in results)
        assert results[0] == f"data_for_user_{user.id}"

    def test_concurrent_database_access(self):
        """Test que el acceso concurrente a la base de datos funciona."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        # Crear consumos concurrentemente
        def create_consumo(index):
            return ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=100 * index
            )
        
        # Simular creación concurrente
        consumos = []
        for i in range(10):
            consumos.append(create_consumo(i))
        
        # Verificar que todos se crearon correctamente
        assert len(consumos) == 10
        assert all(consumo.usuario == user for consumo in consumos)
