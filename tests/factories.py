"""
Factories para crear objetos de prueba.
"""

import factory
from django.contrib.auth import get_user_model
from consumos.models import Bebida, Recipiente, Consumo, MetaDiaria, Recordatorio
from django.utils import timezone
from datetime import datetime, time

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    """Factory para crear usuarios de prueba."""
    
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    peso = factory.Faker('pyfloat', min_value=50.0, max_value=120.0)
    edad = factory.Faker('pyint', min_value=18, max_value=80)
    es_premium = False
    nivel_actividad = 'moderado'
    meta_diaria_ml = 2000


class PremiumUserFactory(UserFactory):
    """Factory para crear usuarios premium."""
    es_premium = True
    meta_diaria_ml = 2500


class BebidaFactory(factory.django.DjangoModelFactory):
    """Factory para crear bebidas de prueba."""
    
    class Meta:
        model = Bebida
    
    nombre = factory.Sequence(lambda n: f'Bebida{n}')
    factor_hidratacion = factory.Faker('pyfloat', min_value=0.5, max_value=1.5)
    descripcion = factory.Faker('sentence')
    es_agua = False
    calorias_por_ml = factory.Faker('pyfloat', min_value=0.0, max_value=2.0)
    activa = True
    es_premium = False


class PremiumBebidaFactory(BebidaFactory):
    """Factory para crear bebidas premium."""
    es_premium = True


class RecipienteFactory(factory.django.DjangoModelFactory):
    """Factory para crear recipientes de prueba."""
    
    class Meta:
        model = Recipiente
    
    usuario = factory.SubFactory(UserFactory)
    nombre = factory.Faker('word')
    cantidad_ml = factory.Faker('pyint', min_value=100, max_value=1000)
    color = factory.Faker('hex_color')
    icono = factory.Faker('word')
    es_favorito = False


class ConsumoFactory(factory.django.DjangoModelFactory):
    """Factory para crear consumos de prueba."""
    
    class Meta:
        model = Consumo
    
    usuario = factory.SubFactory(UserFactory)
    bebida = factory.SubFactory(BebidaFactory)
    recipiente = factory.SubFactory(RecipienteFactory)
    cantidad_ml = factory.Faker('pyint', min_value=50, max_value=500)
    nivel_sed = factory.Faker('pyint', min_value=1, max_value=5)
    estado_animo = factory.Faker('pyint', min_value=1, max_value=5)
    notas = factory.Faker('sentence')
    ubicacion = factory.Faker('city')
    fecha_hora = factory.LazyFunction(timezone.now)


class MetaDiariaFactory(factory.django.DjangoModelFactory):
    """Factory para crear metas diarias de prueba."""
    
    class Meta:
        model = MetaDiaria
    
    usuario = factory.SubFactory(UserFactory)
    fecha = factory.LazyFunction(timezone.now().date)
    meta_ml = factory.Faker('pyint', min_value=1500, max_value=3000)
    consumido_ml = factory.Faker('pyint', min_value=0, max_value=3000)
    completada = False


class RecordatorioFactory(factory.django.DjangoModelFactory):
    """Factory para crear recordatorios de prueba."""
    
    class Meta:
        model = Recordatorio
    
    usuario = factory.SubFactory(UserFactory)
    hora = factory.Faker('time')
    mensaje = factory.Faker('sentence')
    activo = True
    dias_semana = [1, 2, 3, 4, 5]  # Lunes a Viernes
    tipo_recordatorio = 'agua'
    frecuencia = 'diario'
    sonido = 'default'
    vibracion = True
