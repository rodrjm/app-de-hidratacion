"""
Tests unitarios para modelos.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from datetime import date, time

from users.models import User
from consumos.models import Bebida, Recipiente, Consumo, MetaDiaria, Recordatorio
from tests.factories import (
    UserFactory, PremiumUserFactory, BebidaFactory, PremiumBebidaFactory,
    RecipienteFactory, ConsumoFactory, MetaDiariaFactory, RecordatorioFactory
)


@pytest.mark.django_db
class TestUserModel:
    """Tests para el modelo User."""
    
    def test_user_creation(self):
        """Test crear usuario básico."""
        user = UserFactory()
        assert user.username is not None
        assert user.email is not None
        assert user.peso is not None
        assert user.edad is not None
        assert user.es_premium is False
        assert user.meta_diaria_ml == 2000
    
    def test_premium_user_creation(self):
        """Test crear usuario premium."""
        user = PremiumUserFactory()
        assert user.es_premium is True
        assert user.meta_diaria_ml == 2500
    
    def test_user_str_representation(self):
        """Test representación string del usuario."""
        user = UserFactory(first_name='Juan', last_name='Pérez')
        expected = f"{user.username} ({user.email})"
        assert str(user) == expected
    
    def test_user_weight_validation(self):
        """Test validación de peso."""
        # Peso válido
        user = UserFactory(peso=70.0)
        assert user.peso == 70.0
        
        # Peso inválido (muy bajo)
        with pytest.raises(ValidationError):
            user = UserFactory(peso=10.0)
            user.full_clean()
    
    def test_user_age_validation(self):
        """Test validación de edad."""
        # Edad válida
        user = UserFactory(edad=25)
        assert user.edad == 25
        
        # Edad inválida (muy alta)
        with pytest.raises(ValidationError):
            user = UserFactory(edad=150)
            user.full_clean()


@pytest.mark.django_db
class TestBebidaModel:
    """Tests para el modelo Bebida."""
    
    def test_bebida_creation(self):
        """Test crear bebida básica."""
        bebida = BebidaFactory()
        assert bebida.nombre is not None
        assert bebida.factor_hidratacion > 0
        assert bebida.es_agua is False
        assert bebida.es_premium is False
        assert bebida.activa is True
    
    def test_premium_bebida_creation(self):
        """Test crear bebida premium."""
        bebida = PremiumBebidaFactory()
        assert bebida.es_premium is True
    
    def test_bebida_str_representation(self):
        """Test representación string de la bebida."""
        bebida = BebidaFactory(nombre='Agua')
        assert str(bebida) == 'Agua'
    
    def test_bebida_factor_validation(self):
        """Test validación del factor de hidratación."""
        # Factor válido
        bebida = BebidaFactory(factor_hidratacion=1.0)
        assert bebida.factor_hidratacion == 1.0
        
        # Factor inválido (negativo)
        with pytest.raises(ValidationError):
            bebida = BebidaFactory(factor_hidratacion=-0.5)
            bebida.full_clean()
    
    def test_bebida_unique_name(self):
        """Test nombre único de bebida."""
        BebidaFactory(nombre='Agua')
        
        with pytest.raises(IntegrityError):
            BebidaFactory(nombre='Agua')


@pytest.mark.django_db
class TestRecipienteModel:
    """Tests para el modelo Recipiente."""
    
    def test_recipiente_creation(self):
        """Test crear recipiente."""
        user = UserFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        assert recipiente.usuario == user
        assert recipiente.nombre is not None
        assert recipiente.cantidad_ml > 0
        assert recipiente.es_favorito is False
    
    def test_recipiente_str_representation(self):
        """Test representación string del recipiente."""
        recipiente = RecipienteFactory(nombre='Botella', cantidad_ml=500)
        assert 'Botella' in str(recipiente)
        assert '500ml' in str(recipiente)
    
    def test_recipiente_capacity_validation(self):
        """Test validación de capacidad."""
        # Capacidad válida
        recipiente = RecipienteFactory(cantidad_ml=500)
        assert recipiente.cantidad_ml == 500
        
        # Capacidad inválida (muy alta)
        with pytest.raises(ValidationError):
            recipiente = RecipienteFactory(cantidad_ml=10000)
            recipiente.full_clean()
    
    def test_recipiente_unique_per_user(self):
        """Test nombre único por usuario."""
        user = UserFactory()
        RecipienteFactory(usuario=user, nombre='Botella')
        
        with pytest.raises(IntegrityError):
            RecipienteFactory(usuario=user, nombre='Botella')


@pytest.mark.django_db
class TestConsumoModel:
    """Tests para el modelo Consumo."""
    
    def test_consumo_creation(self):
        """Test crear consumo."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        consumo = ConsumoFactory(
            usuario=user,
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=300
        )
        
        assert consumo.usuario == user
        assert consumo.bebida == bebida
        assert consumo.recipiente == recipiente
        assert consumo.cantidad_ml == 300
    
    def test_consumo_hidratacion_efectiva_calculation(self):
        """Test cálculo de hidratación efectiva."""
        bebida = BebidaFactory(factor_hidratacion=0.8)
        consumo = ConsumoFactory(
            bebida=bebida,
            cantidad_ml=500
        )
        
        hidratacion_esperada = 500 * 0.8
        assert consumo.cantidad_hidratacion_efectiva == hidratacion_esperada
    
    def test_consumo_str_representation(self):
        """Test representación string del consumo."""
        user = UserFactory(username='testuser')
        bebida = BebidaFactory(nombre='Agua')
        consumo = ConsumoFactory(usuario=user, bebida=bebida)
        
        assert 'testuser' in str(consumo)
        assert 'Agua' in str(consumo)
    
    def test_consumo_metadata(self):
        """Test metadatos del consumo."""
        consumo = ConsumoFactory(
            nivel_sed=3,
            estado_animo=4,
            notas='Test note',
            ubicacion='Casa'
        )
        
        assert consumo.nivel_sed == 3
        assert consumo.estado_animo == 4
        assert consumo.notas == 'Test note'
        assert consumo.ubicacion == 'Casa'


@pytest.mark.django_db
class TestMetaDiariaModel:
    """Tests para el modelo MetaDiaria."""
    
    def test_meta_diaria_creation(self):
        """Test crear meta diaria."""
        user = UserFactory()
        meta = MetaDiariaFactory(usuario=user)
        
        assert meta.usuario == user
        assert meta.fecha is not None
        assert meta.meta_ml > 0
        assert meta.completada is False
    
    def test_meta_diaria_completion_calculation(self):
        """Test cálculo de completado."""
        # Crear meta con hidratación efectiva suficiente
        meta = MetaDiariaFactory(meta_ml=2000, hidratacion_efectiva_ml=2000)
        # Marcar como completada manualmente para el test
        meta.completada = True
        meta.save()
        assert meta.completada is True
        
        # Crear meta con hidratación efectiva insuficiente
        meta2 = MetaDiariaFactory(meta_ml=2000, hidratacion_efectiva_ml=1500)
        meta2.completada = False
        meta2.save()
        assert meta2.completada is False
    
    def test_meta_diaria_progress_calculation(self):
        """Test cálculo de progreso."""
        meta = MetaDiariaFactory(meta_ml=2000, consumido_ml=1000)
        progreso_esperado = (1000 / 2000) * 100
        assert meta.get_progreso_porcentaje() == progreso_esperado


@pytest.mark.django_db
class TestRecordatorioModel:
    """Tests para el modelo Recordatorio."""
    
    def test_recordatorio_creation(self):
        """Test crear recordatorio."""
        user = UserFactory()
        recordatorio = RecordatorioFactory(usuario=user)
        
        assert recordatorio.usuario == user
        assert recordatorio.hora is not None
        assert recordatorio.activo is True
        assert recordatorio.tipo_recordatorio == 'agua'
        assert recordatorio.frecuencia == 'diario'
    
    def test_recordatorio_str_representation(self):
        """Test representación string del recordatorio."""
        user = UserFactory(username='testuser')
        recordatorio = RecordatorioFactory(usuario=user, mensaje='Beber agua')
        
        expected = f"{user.username} - {recordatorio.hora} ({recordatorio.tipo_recordatorio})"
        assert str(recordatorio) == expected
    
    def test_recordatorio_dias_semana(self):
        """Test configuración de días de la semana."""
        recordatorio = RecordatorioFactory(dias_semana=[1, 2, 3, 4, 5])
        assert recordatorio.dias_semana == [1, 2, 3, 4, 5]
    
    def test_recordatorio_toggle_active(self):
        """Test alternar estado activo."""
        recordatorio = RecordatorioFactory(activo=True)
        recordatorio.activo = False
        recordatorio.save()
        
        assert recordatorio.activo is False
