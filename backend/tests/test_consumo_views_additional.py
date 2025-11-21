"""
Tests adicionales para aumentar cobertura de consumo_views.py.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from consumos.models import Consumo, Bebida, Recipiente
from django.utils import timezone
from datetime import date, timedelta

User = get_user_model()


@pytest.mark.django_db
class TestConsumoViewSetAdditional:
    """Tests adicionales para ConsumoViewSet."""
    
    @pytest.fixture
    def user(self, db):
        """Usuario de prueba."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=False
        )
    
    @pytest.fixture
    def authenticated_client(self, user):
        """Cliente autenticado."""
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return client
    
    @pytest.fixture
    def bebida(self, db):
        """Bebida de prueba."""
        bebida, _ = Bebida.objects.get_or_create(
            nombre='Agua Additional Tests',
            defaults={
                'factor_hidratacion': 1.0,
                'es_agua': True
            }
        )
        return bebida
    
    @pytest.fixture
    def recipiente(self, user):
        """Recipiente de prueba."""
        return Recipiente.objects.create(
            usuario=user,
            nombre='Vaso Additional',
            cantidad_ml=250
        )
    
    @pytest.fixture
    def consumos(self, user, bebida, recipiente):
        """Crear consumos de prueba."""
        consumos = []
        for i in range(10):
            fecha = date.today() - timedelta(days=i)
            fecha_hora = timezone.now().replace(
                year=fecha.year,
                month=fecha.month,
                day=fecha.day,
                hour=10 + (i % 12),
                minute=0,
                second=0,
                microsecond=0
            )
            consumo = Consumo.objects.create(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=250 + (i * 50),
                fecha_hora=fecha_hora
            )
            consumos.append(consumo)
        return consumos
    
    def test_daily_summary_with_timezone(self, authenticated_client, consumos):
        """Test: Resumen diario con zona horaria."""
        response = authenticated_client.get('/api/consumos/daily_summary/?tz=America/Mexico_City')
        assert response.status_code == status.HTTP_200_OK
        assert 'total_hidratacion_efectiva_ml' in response.data
    
    def test_weekly_summary_with_timezone(self, authenticated_client, consumos):
        """Test: Resumen semanal con zona horaria."""
        response = authenticated_client.get('/api/consumos/weekly_summary/?tz=America/Mexico_City')
        assert response.status_code == status.HTTP_200_OK
    
    def test_trends_with_timezone(self, authenticated_client, consumos):
        """Test: Tendencias con zona horaria."""
        response = authenticated_client.get('/api/consumos/trends/?period=weekly&tz=America/Mexico_City')
        assert response.status_code == status.HTTP_200_OK
    
    def test_trends_annual_period(self, authenticated_client, consumos):
        """Test: Tendencias con período anual."""
        response = authenticated_client.get('/api/consumos/trends/?period=annual')
        assert response.status_code == status.HTTP_200_OK
    
    def test_cached_stats_daily(self, authenticated_client, consumos):
        """Test: Estadísticas cacheadas diarias."""
        response = authenticated_client.get('/api/consumos/cached_stats/?period=daily')
        assert response.status_code == status.HTTP_200_OK
        assert 'total_hidratacion_efectiva_ml' in response.data
    
    def test_cached_stats_weekly(self, authenticated_client, consumos):
        """Test: Estadísticas cacheadas semanales."""
        response = authenticated_client.get('/api/consumos/cached_stats/?period=weekly')
        assert response.status_code == status.HTTP_200_OK
    
    def test_cached_stats_monthly(self, authenticated_client, consumos):
        """Test: Estadísticas cacheadas mensuales."""
        response = authenticated_client.get('/api/consumos/cached_stats/?period=monthly')
        assert response.status_code == status.HTTP_200_OK
    
    def test_performance_test_endpoint(self, authenticated_client, consumos):
        """Test: Endpoint de prueba de performance."""
        response = authenticated_client.get('/api/consumos/performance_test/')
        assert response.status_code == status.HTTP_200_OK
        assert 'performance_comparison' in response.data
        assert 'sin_optimizaciones' in response.data['performance_comparison']
        assert 'con_select_related' in response.data['performance_comparison']
        assert 'con_cache' in response.data['performance_comparison']
    
    def test_filter_by_bebida(self, authenticated_client, consumos, bebida):
        """Test: Filtrar consumos por bebida."""
        response = authenticated_client.get(f'/api/consumos/?bebida={bebida.id}')
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_by_recipiente(self, authenticated_client, consumos, recipiente):
        """Test: Filtrar consumos por recipiente."""
        response = authenticated_client.get(f'/api/consumos/?recipiente={recipiente.id}')
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_by_nivel_sed(self, authenticated_client, consumos):
        """Test: Filtrar consumos por nivel de sed."""
        # Actualizar un consumo con nivel de sed
        consumo = consumos[0]
        consumo.nivel_sed = 5
        consumo.save()
        
        response = authenticated_client.get('/api/consumos/?nivel_sed=5')
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_by_estado_animo(self, authenticated_client, consumos):
        """Test: Filtrar consumos por estado de ánimo."""
        # Actualizar un consumo con estado de ánimo válido
        consumo = consumos[0]
        # Usar un valor válido de las opciones del modelo
        consumo.estado_animo = 'bueno'
        consumo.save()
        
        response = authenticated_client.get('/api/consumos/?estado_animo=bueno')
        # El filtro puede funcionar o no dependiendo de la configuración
        assert response.status_code == status.HTTP_200_OK
    
    def test_ordering_by_cantidad_ml(self, authenticated_client, consumos):
        """Test: Ordenar consumos por cantidad."""
        response = authenticated_client.get('/api/consumos/?ordering=cantidad_ml')
        assert response.status_code == status.HTTP_200_OK
    
    def test_ordering_by_cantidad_ml_desc(self, authenticated_client, consumos):
        """Test: Ordenar consumos por cantidad descendente."""
        response = authenticated_client.get('/api/consumos/?ordering=-cantidad_ml')
        assert response.status_code == status.HTTP_200_OK
    
    def test_ordering_by_hidratacion_efectiva(self, authenticated_client, consumos):
        """Test: Ordenar consumos por hidratación efectiva."""
        response = authenticated_client.get('/api/consumos/?ordering=-cantidad_hidratacion_efectiva')
        assert response.status_code == status.HTTP_200_OK
    
    def test_search_by_notas(self, authenticated_client, consumos):
        """Test: Buscar consumos por notas."""
        # Actualizar un consumo con notas
        consumo = consumos[0]
        consumo.notas = 'Después del ejercicio'
        consumo.save()
        
        response = authenticated_client.get('/api/consumos/?search=ejercicio')
        assert response.status_code == status.HTTP_200_OK
    
    def test_search_by_ubicacion(self, authenticated_client, consumos):
        """Test: Buscar consumos por ubicación."""
        # Actualizar un consumo con ubicación
        consumo = consumos[0]
        consumo.ubicacion = 'Casa'
        consumo.save()
        
        response = authenticated_client.get('/api/consumos/?search=Casa')
        assert response.status_code == status.HTTP_200_OK
    
    def test_daily_summary_with_past_date(self, authenticated_client, consumos):
        """Test: Resumen diario con fecha pasada."""
        past_date = date.today() - timedelta(days=5)
        response = authenticated_client.get(f'/api/consumos/daily_summary/?fecha={past_date.isoformat()}')
        assert response.status_code == status.HTTP_200_OK
    
    def test_weekly_summary_with_past_date(self, authenticated_client, consumos):
        """Test: Resumen semanal con fecha pasada."""
        past_date = date.today() - timedelta(days=14)
        response = authenticated_client.get(f'/api/consumos/weekly_summary/?fecha_inicio={past_date.isoformat()}')
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_queryset_with_date_filter(self, authenticated_client, consumos):
        """Test: get_queryset con filtro de fecha."""
        fecha = date.today().isoformat()
        response = authenticated_client.get(f'/api/consumos/?date={fecha}')
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_queryset_with_date_range_and_tz(self, authenticated_client, consumos):
        """Test: get_queryset con rango de fechas y zona horaria."""
        fecha_inicio = (date.today() - timedelta(days=7)).isoformat()
        fecha_fin = date.today().isoformat()
        response = authenticated_client.get(
            f'/api/consumos/?fecha_inicio={fecha_inicio}&fecha_fin={fecha_fin}&tz=America/Mexico_City'
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_queryset_with_invalid_date(self, authenticated_client, consumos):
        """Test: get_queryset con fecha inválida (debe ignorarse)."""
        response = authenticated_client.get('/api/consumos/?date=invalid-date')
        assert response.status_code == status.HTTP_200_OK  # Ignora fecha inválida
    
    def test_get_queryset_with_invalid_fecha_inicio(self, authenticated_client, consumos):
        """Test: get_queryset con fecha_inicio inválida (debe ignorarse)."""
        response = authenticated_client.get('/api/consumos/?fecha_inicio=invalid')
        assert response.status_code == status.HTTP_200_OK  # Ignora fecha inválida
    
    def test_get_queryset_with_invalid_fecha_fin(self, authenticated_client, consumos):
        """Test: get_queryset con fecha_fin inválida (debe ignorarse)."""
        response = authenticated_client.get('/api/consumos/?fecha_fin=invalid')
        assert response.status_code == status.HTTP_200_OK  # Ignora fecha inválida

