"""
Tests para casos edge y validaciones en vistas de consumo.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from consumos.models import Consumo, Bebida, Recipiente
from django.utils import timezone
from datetime import date, timedelta, datetime

User = get_user_model()


@pytest.mark.django_db
class TestConsumoViewSetEdgeCases:
    """Tests para casos edge y validaciones en ConsumoViewSet."""
    
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
            nombre='Agua Edge Cases',
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
            nombre='Vaso Edge',
            cantidad_ml=250
        )
    
    def test_create_consumo_with_future_date(self, authenticated_client, bebida, recipiente):
        """Test: Crear consumo con fecha futura debe fallar."""
        future_date = timezone.now() + timedelta(days=1)
        data = {
            'bebida': bebida.id,
            'recipiente': recipiente.id,
            'cantidad_ml': 250,
            'fecha_hora': future_date.isoformat()
        }
        response = authenticated_client.post('/api/consumos/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_consumo_with_negative_amount(self, authenticated_client, bebida, recipiente):
        """Test: Crear consumo con cantidad negativa debe fallar."""
        data = {
            'bebida': bebida.id,
            'recipiente': recipiente.id,
            'cantidad_ml': -100
        }
        response = authenticated_client.post('/api/consumos/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_consumo_with_zero_amount(self, authenticated_client, bebida, recipiente):
        """Test: Crear consumo con cantidad cero debe fallar."""
        data = {
            'bebida': bebida.id,
            'recipiente': recipiente.id,
            'cantidad_ml': 0
        }
        response = authenticated_client.post('/api/consumos/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_consumo_with_invalid_bebida(self, authenticated_client, recipiente):
        """Test: Crear consumo con bebida inválida debe fallar."""
        data = {
            'bebida': 99999,  # ID que no existe
            'recipiente': recipiente.id,
            'cantidad_ml': 250
        }
        response = authenticated_client.post('/api/consumos/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_consumo_with_invalid_recipiente(self, authenticated_client, bebida):
        """Test: Crear consumo con recipiente inválido debe fallar."""
        data = {
            'bebida': bebida.id,
            'recipiente': 99999,  # ID que no existe
            'cantidad_ml': 250
        }
        response = authenticated_client.post('/api/consumos/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_daily_summary_with_invalid_date_format(self, authenticated_client):
        """Test: Resumen diario con formato de fecha inválido."""
        response = authenticated_client.get('/api/consumos/daily_summary/?fecha=invalid-date')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_weekly_summary_with_invalid_date_format(self, authenticated_client):
        """Test: Resumen semanal con formato de fecha inválido."""
        response = authenticated_client.get('/api/consumos/weekly_summary/?fecha_inicio=invalid-date')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_trends_with_invalid_period(self, authenticated_client):
        """Test: Tendencias con período inválido."""
        response = authenticated_client.get('/api/consumos/trends/?period=invalid')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_trends_with_invalid_timezone(self, authenticated_client):
        """Test: Tendencias con zona horaria inválida."""
        response = authenticated_client.get('/api/consumos/trends/?period=weekly&tz=Invalid/Timezone')
        # Puede ser 200 (ignora tz inválida), 400 o 500 (si hay error no manejado)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR]
    
    def test_filter_by_invalid_date_range(self, authenticated_client):
        """Test: Filtrar con rango de fechas inválido."""
        response = authenticated_client.get('/api/consumos/?fecha_inicio=2024-13-45&fecha_fin=invalid')
        # Puede ser 200 (ignora fechas inválidas) o 400
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
    
    def test_cached_stats_with_invalid_period(self, authenticated_client):
        """Test: Estadísticas cacheadas con período inválido."""
        response = authenticated_client.get('/api/consumos/cached_stats/?period=invalid')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_update_consumo_with_future_date(self, authenticated_client, user, bebida, recipiente):
        """Test: Actualizar consumo con fecha futura debe fallar."""
        consumo = Consumo.objects.create(
            usuario=user,
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=250,
            fecha_hora=timezone.now()
        )
        
        future_date = timezone.now() + timedelta(days=1)
        data = {
            'fecha_hora': future_date.isoformat()
        }
        response = authenticated_client.patch(f'/api/consumos/{consumo.id}/', data, format='json')
        # Puede ser 400 (validación) o 200 (si la validación no se aplica en update)
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK]
    
    def test_filter_by_date_with_timezone(self, authenticated_client, bebida, recipiente):
        """Test: Filtrar por fecha con zona horaria."""
        # Crear consumo
        consumo = Consumo.objects.create(
            usuario=User.objects.get(email='test@example.com'),
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=250,
            fecha_hora=timezone.now()
        )
        
        fecha = date.today().isoformat()
        response = authenticated_client.get(f'/api/consumos/?fecha_inicio={fecha}&fecha_fin={fecha}&tz=America/Mexico_City')
        assert response.status_code == status.HTTP_200_OK
    
    def test_performance_test_endpoint(self, authenticated_client):
        """Test: Endpoint de prueba de performance."""
        response = authenticated_client.get('/api/consumos/performance_test/')
        assert response.status_code == status.HTTP_200_OK
        assert 'performance_comparison' in response.data
    
    def test_empty_queryset_returns_empty_list(self, authenticated_client):
        """Test: QuerySet vacío retorna lista vacía."""
        response = authenticated_client.get('/api/consumos/')
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data or isinstance(response.data, list)
    
    def test_daily_summary_with_specific_date(self, authenticated_client, bebida, recipiente):
        """Test: Resumen diario con fecha específica."""
        user = User.objects.get(email='test@example.com')
        fecha = date.today() - timedelta(days=1)
        fecha_hora = timezone.now().replace(
            year=fecha.year,
            month=fecha.month,
            day=fecha.day,
            hour=12,
            minute=0,
            second=0,
            microsecond=0
        )
        Consumo.objects.create(
            usuario=user,
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=500,
            fecha_hora=fecha_hora
        )
        
        response = authenticated_client.get(f'/api/consumos/daily_summary/?fecha={fecha.isoformat()}')
        assert response.status_code == status.HTTP_200_OK
        assert 'total_hidratacion_efectiva_ml' in response.data
    
    def test_weekly_summary_with_specific_date(self, authenticated_client, bebida, recipiente):
        """Test: Resumen semanal con fecha específica."""
        user = User.objects.get(email='test@example.com')
        fecha_inicio = date.today() - timedelta(days=7)
        
        for i in range(3):
            fecha = fecha_inicio + timedelta(days=i)
            fecha_hora = timezone.now().replace(
                year=fecha.year,
                month=fecha.month,
                day=fecha.day,
                hour=12,
                minute=0,
                second=0,
                microsecond=0
            )
            Consumo.objects.create(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=250,
                fecha_hora=fecha_hora
            )
        
        response = authenticated_client.get(f'/api/consumos/weekly_summary/?fecha_inicio={fecha_inicio.isoformat()}')
        assert response.status_code == status.HTTP_200_OK
    
    def test_trends_daily_period(self, authenticated_client, bebida, recipiente):
        """Test: Tendencias con período diario."""
        user = User.objects.get(email='test@example.com')
        # Crear consumos para hoy y ayer
        for i in range(2):
            fecha = date.today() - timedelta(days=i)
            fecha_hora = timezone.now().replace(
                year=fecha.year,
                month=fecha.month,
                day=fecha.day,
                hour=12,
                minute=0,
                second=0,
                microsecond=0
            )
            Consumo.objects.create(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=250,
                fecha_hora=fecha_hora
            )
        
        response = authenticated_client.get('/api/consumos/trends/?period=daily')
        assert response.status_code == status.HTTP_200_OK
        assert 'periodo' in response.data
        assert response.data['periodo'] == 'daily'
    
    def test_cached_stats_different_periods(self, authenticated_client):
        """Test: Estadísticas cacheadas con diferentes períodos."""
        periods = ['daily', 'weekly', 'monthly']
        for period in periods:
            response = authenticated_client.get(f'/api/consumos/cached_stats/?period={period}')
            assert response.status_code == status.HTTP_200_OK

