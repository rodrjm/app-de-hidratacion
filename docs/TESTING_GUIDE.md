# 🧪 Guía de Testing para HydroTracker API

## 📋 Índice
1. [Introducción](#introducción)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Ejecutar Tests](#ejecutar-tests)
4. [Estructura de Tests](#estructura-de-tests)
5. [Escribir Tests](#escribir-tests)
6. [Cobertura de Código](#cobertura-de-código)
7. [Mejores Prácticas](#mejores-prácticas)

## 🎯 Introducción

Esta guía explica cómo ejecutar, escribir y mantener los tests para la API de HydroTracker. Utilizamos pytest como framework principal junto con django-pytest para integración con Django.

## ⚙️ Configuración del Entorno

### Instalación de Dependencias

```bash
# Instalar dependencias de testing
pip install pytest pytest-django pytest-cov factory-boy

# Verificar instalación
python -m pytest --version
```

### Configuración de pytest

El archivo `pytest.ini` ya está configurado:

```ini
[tool:pytest]
DJANGO_SETTINGS_MODULE = hydrotracker.settings_sqlite
python_files = tests.py test_*.py *_tests.py
python_classes = Test*
python_functions = test_*
addopts = --tb=short --strict-markers --disable-warnings --reuse-db
markers =
    unit: Unit tests
    integration: Integration tests
    api: API tests
    slow: Slow tests
    premium: Premium functionality tests
```

## 🚀 Ejecutar Tests

### Comandos Básicos

```bash
# Ejecutar todos los tests
python -m pytest tests/

# Ejecutar tests con verbose
python -m pytest tests/ -v

# Ejecutar tests específicos
python -m pytest tests/test_models.py -v

# Ejecutar un test específico
python -m pytest tests/test_models.py::TestUserModel::test_user_creation -v
```

### Tests con Cobertura

```bash
# Ejecutar tests con cobertura
python -m pytest tests/ --cov=consumos --cov=users --cov-report=html

# Ver solo cobertura de servicios
python -m pytest tests/test_services.py --cov=consumos.services --cov-report=term-missing

# Cobertura con umbral mínimo
python -m pytest tests/ --cov=consumos --cov=users --cov-fail-under=80
```

### Tests por Marcadores

```bash
# Solo tests unitarios
python -m pytest tests/ -m unit

# Solo tests de integración
python -m pytest tests/ -m integration

# Solo tests de API
python -m pytest tests/ -m api

# Excluir tests lentos
python -m pytest tests/ -m "not slow"
```

## 📁 Estructura de Tests

```
tests/
├── __init__.py
├── conftest.py              # Configuración global y fixtures
├── factories.py             # Factories para datos de prueba
├── test_models.py          # Tests de modelos (25 tests)
├── test_serializers.py     # Tests de serializers
├── test_services.py        # Tests de servicios (18 tests)
├── test_api_integration.py # Tests de integración API
├── test_permissions.py     # Tests de permisos y autenticación
└── htmlcov/                # Reporte HTML de cobertura
```

### Fixtures Globales (conftest.py)

```python
@pytest.fixture
def api_client():
    """Cliente API para tests."""
    return APIClient()

@pytest.fixture
def user():
    """Usuario de prueba."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        peso=70.0,
        edad=25,
        es_premium=False
    )

@pytest.fixture
def authenticated_client(api_client, user):
    """Cliente API autenticado."""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client
```

### Factories (factories.py)

```python
class UserFactory(factory.django.DjangoModelFactory):
    """Factory para crear usuarios de prueba."""
    
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    peso = factory.Faker('pyfloat', min_value=50.0, max_value=120.0)
    edad = factory.Faker('pyint', min_value=18, max_value=80)
    es_premium = False
```

## ✍️ Escribir Tests

### Estructura de un Test

```python
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
```

### Tests de Modelos

```python
@pytest.mark.django_db
class TestUserModel:
    """Tests para el modelo User."""
    
    def test_user_creation(self):
        """Test crear usuario básico."""
        user = UserFactory()
        assert user.username is not None
        assert user.email is not None
        assert user.es_premium is False
    
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
```

### Tests de Servicios

```python
@pytest.mark.django_db
class TestConsumoService:
    """Tests para ConsumoService."""
    
    def test_get_daily_summary(self):
        """Test obtener resumen diario."""
        user = UserFactory()
        service = ConsumoService(user)
        
        # Crear consumos para hoy
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        ConsumoFactory(
            usuario=user,
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=300,
            fecha_hora=timezone.now()
        )
        
        summary = service.get_daily_summary()
        
        assert summary['total_ml'] == 300
        assert summary['cantidad_consumos'] == 1
        assert summary['fecha'] == timezone.now().date()
```

### Tests de API

```python
@pytest.mark.django_db
class TestConsumosAPI:
    """Tests para API de consumos."""
    
    def test_list_consumos(self, authenticated_client, user):
        """Test listar consumos."""
        # Crear algunos consumos
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(3):
            ConsumoFactory(usuario=user, bebida=bebida, recipiente=recipiente)
        
        response = authenticated_client.get('/api/consumos/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_create_consumo(self, authenticated_client, user):
        """Test crear consumo."""
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        data = {
            'bebida': bebida.id,
            'recipiente': recipiente.id,
            'cantidad_ml': 300,
            'nivel_sed': 3,
            'estado_animo': 4
        }
        
        response = authenticated_client.post('/api/consumos/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['cantidad_ml'] == 300
```

### Tests de Permisos

```python
@pytest.mark.django_db
class TestCustomPermissions:
    """Tests para permisos personalizados."""
    
    def test_is_premium_user_permission(self):
        """Test permiso IsPremiumUser."""
        # Usuario gratuito
        free_user = UserFactory(es_premium=False)
        request = type('Request', (), {'user': free_user})()
        
        permission = IsPremiumUser()
        assert not permission.has_permission(request, None)
        
        # Usuario premium
        premium_user = PremiumUserFactory()
        request = type('Request', (), {'user': premium_user})()
        
        assert permission.has_permission(request, None)
```

## 📊 Cobertura de Código

### Generar Reporte HTML

```bash
# Generar reporte HTML
python -m pytest tests/ --cov=consumos --cov=users --cov-report=html

# Abrir reporte en navegador
# El reporte se genera en htmlcov/index.html
```

### Configurar Cobertura

```bash
# Cobertura con umbral mínimo
python -m pytest tests/ --cov=consumos --cov-fail-under=80

# Cobertura específica por módulo
python -m pytest tests/ --cov=consumos.services --cov-report=term-missing

# Excluir archivos de cobertura
python -m pytest tests/ --cov=consumos --cov-omit="*/migrations/*"
```

### Interpretar Cobertura

```
Name                                               Stmts   Miss  Cover   Missing
--------------------------------------------------------------------------------
consumos/services/consumo_service.py             134     16    88%   106, 163-167, 196-203, 301, 308, 335-336
consumos/services/monetization_service.py         38      4    89%   54, 82, 102-103
consumos/services/premium_service.py              35      0   100%
consumos/services/stats_service.py                55      8    85%   93, 126-129, 177-191
```

- **Stmts**: Líneas de código totales
- **Miss**: Líneas no cubiertas
- **Cover**: Porcentaje de cobertura
- **Missing**: Números de línea no cubiertas

## 🏆 Mejores Prácticas

### 1. Nomenclatura de Tests

```python
# ✅ Bueno
def test_user_creation_with_valid_data():
    """Test que un usuario se crea correctamente con datos válidos."""

def test_user_creation_fails_with_invalid_email():
    """Test que la creación de usuario falla con email inválido."""

# ❌ Malo
def test_user():
    """Test user."""

def test1():
    """Test 1."""
```

### 2. Organización de Tests

```python
@pytest.mark.django_db
class TestUserModel:
    """Tests para el modelo User."""
    
    def test_user_creation(self):
        """Test crear usuario básico."""
        pass
    
    def test_user_validation(self):
        """Test validaciones de usuario."""
        pass
    
    def test_user_str_representation(self):
        """Test representación string."""
        pass
```

### 3. Uso de Fixtures

```python
# ✅ Reutilizar fixtures
def test_consumo_creation(self, user, bebida, recipiente):
    """Test crear consumo con fixtures."""
    consumo = ConsumoFactory(
        usuario=user,
        bebida=bebida,
        recipiente=recipiente
    )
    assert consumo.usuario == user

# ❌ Crear datos en cada test
def test_consumo_creation(self):
    """Test crear consumo."""
    user = UserFactory()
    bebida = BebidaFactory()
    recipiente = RecipienteFactory(usuario=user)
    # ... resto del test
```

### 4. Tests de API

```python
# ✅ Usar fixtures de autenticación
def test_create_consumo(self, authenticated_client, user):
    """Test crear consumo autenticado."""
    response = authenticated_client.post('/api/consumos/', data)
    assert response.status_code == status.HTTP_201_CREATED

# ❌ Autenticación manual
def test_create_consumo(self, api_client):
    """Test crear consumo."""
    user = UserFactory()
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    # ... resto del test
```

### 5. Manejo de Errores

```python
def test_invalid_data_raises_validation_error(self):
    """Test que datos inválidos lanzan ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        user = UserFactory(peso=-10.0)
        user.full_clean()
    
    assert 'peso' in str(exc_info.value)
```

### 6. Tests de Performance

```python
@pytest.mark.slow
def test_large_dataset_performance(self):
    """Test rendimiento con dataset grande."""
    # Crear muchos datos
    for i in range(1000):
        ConsumoFactory()
    
    # Medir tiempo de ejecución
    start_time = time.time()
    response = self.client.get('/api/consumos/')
    end_time = time.time()
    
    assert response.status_code == 200
    assert (end_time - start_time) < 2.0  # Menos de 2 segundos
```

### 7. Tests de Integración

```python
@pytest.mark.integration
def test_complete_user_workflow(self, authenticated_client, user):
    """Test flujo completo de usuario."""
    # 1. Crear recipiente
    recipiente_data = {
        'nombre': 'Mi Botella',
        'cantidad_ml': 500
    }
    response = authenticated_client.post('/api/recipientes/', recipiente_data)
    assert response.status_code == 201
    recipiente_id = response.data['id']
    
    # 2. Registrar consumo
    consumo_data = {
        'bebida': 1,
        'recipiente': recipiente_id,
        'cantidad_ml': 300
    }
    response = authenticated_client.post('/api/consumos/', consumo_data)
    assert response.status_code == 201
    
    # 3. Verificar estadísticas
    response = authenticated_client.get('/api/consumos/stats/')
    assert response.status_code == 200
    assert response.data['total_consumos'] == 1
```

## 🔧 Configuración Avanzada

### Variables de Entorno para Testing

```bash
# .env.test
DEBUG=True
SECRET_KEY=test-secret-key
DATABASE_URL=sqlite:///test.db
```

### Configuración de Base de Datos de Test

```python
# settings_test.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
```

### Tests en Paralelo

```bash
# Instalar pytest-xdist
pip install pytest-xdist

# Ejecutar tests en paralelo
python -m pytest tests/ -n 4
```

## 📈 Métricas de Testing

### Objetivos de Cobertura

- **Servicios**: 90%+
- **Modelos**: 80%+
- **Views**: 70%+
- **Serializers**: 80%+

### Comandos Útiles

```bash
# Tests rápidos (sin cobertura)
python -m pytest tests/ -q

# Tests con reporte detallado
python -m pytest tests/ -v --tb=long

# Tests que fallaron en la última ejecución
python -m pytest tests/ --lf

# Tests más lentos
python -m pytest tests/ --durations=10
```

---

**¡Con esta guía puedes mantener una suite de tests robusta y confiable! 🚀**
