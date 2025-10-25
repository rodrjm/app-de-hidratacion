# 📚 HydroTracker API Documentation

## 🎯 Descripción General

HydroTracker es una API RESTful diseñada para el seguimiento personalizado de hidratación. La aplicación permite a los usuarios registrar sus consumos de líquidos, establecer metas de hidratación, configurar recordatorios y analizar sus patrones de consumo.

## 🚀 Características Principales

### ✨ Funcionalidades Básicas
- **Gestión de Consumos**: Registro detallado de consumo de líquidos
- **Recipientes Personalizados**: Creación y gestión de recipientes favoritos
- **Catálogo de Bebidas**: Base de datos de bebidas con propiedades nutricionales
- **Metas de Hidratación**: Establecimiento y seguimiento de objetivos diarios
- **Sistema de Recordatorios**: Notificaciones personalizables

### 💎 Funcionalidades Premium
- **Meta Personalizada**: Cálculo automático basado en peso y nivel de actividad
- **Bebidas Premium**: Acceso a catálogo exclusivo de bebidas
- **Recordatorios Ilimitados**: Sin restricciones en la cantidad de recordatorios
- **Estadísticas Avanzadas**: Análisis detallado y insights personalizados
- **Sin Anuncios**: Experiencia libre de publicidad

### 🔒 Sistema de Monetización
- **Modelo Freemium**: Funcionalidades básicas gratuitas
- **Límites Inteligentes**: Restricciones que incentivan la actualización
- **Análisis de Conversión**: Métricas para optimizar la monetización

## 🛠️ Tecnologías Utilizadas

- **Backend**: Django 4.2 + Django REST Framework
- **Base de Datos**: PostgreSQL / SQLite
- **Autenticación**: JWT (JSON Web Tokens)
- **Documentación**: drf-spectacular (OpenAPI 3.0)
- **Testing**: pytest + pytest-django
- **Despliegue**: Docker + Nginx

## 📋 Tabla de Contenidos

1. [Instalación y Configuración](#instalación-y-configuración)
2. [Autenticación](#autenticación)
3. [Endpoints de la API](#endpoints-de-la-api)
4. [Modelos de Datos](#modelos-de-datos)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Testing](#testing)
7. [Despliegue](#despliegue)
8. [Contribución](#contribución)

## 🔧 Instalación y Configuración

### Requisitos Previos
- Python 3.8+
- PostgreSQL 12+ (opcional, se puede usar SQLite)
- pip (gestor de paquetes de Python)

### Instalación Rápida

```bash
# Clonar el repositorio
git clone https://github.com/hydrotracker/api.git
cd hydrotracker

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos
python manage_sqlite.py migrate

# Crear superusuario
python manage_sqlite.py createsuperuser

# Ejecutar servidor
python manage_sqlite.py runserver
```

### Configuración Avanzada

Para usar PostgreSQL en producción:

```bash
# Instalar dependencias de PostgreSQL
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Ejecutar migraciones
python manage.py migrate

# Ejecutar servidor
python manage.py runserver
```

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Todos los endpoints protegidos requieren un token válido en el header `Authorization`.

### Obtener Token de Acceso

```bash
# Registro de usuario
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario",
    "email": "usuario@ejemplo.com",
    "password": "contraseña123",
    "peso": 70.0,
    "edad": 25
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario",
    "password": "contraseña123"
  }'
```

### Usar Token en Requests

```bash
curl -X GET http://localhost:8000/api/consumos/ \
  -H "Authorization: Bearer <tu_token_aqui>"
```

## 📡 Endpoints de la API

### 🔑 Autenticación
- `POST /api/auth/register/` - Registro de usuario
- `POST /api/auth/login/` - Inicio de sesión
- `POST /api/auth/logout/` - Cerrar sesión
- `GET /api/auth/profile/` - Perfil del usuario
- `PUT /api/auth/profile/` - Actualizar perfil

### 💧 Consumos
- `GET /api/consumos/` - Listar consumos
- `POST /api/consumos/` - Crear consumo
- `GET /api/consumos/{id}/` - Obtener consumo
- `PUT /api/consumos/{id}/` - Actualizar consumo
- `DELETE /api/consumos/{id}/` - Eliminar consumo

### 🥤 Bebidas
- `GET /api/bebidas/` - Listar bebidas
- `POST /api/bebidas/` - Crear bebida (admin)
- `GET /api/bebidas/{id}/` - Obtener bebida
- `PUT /api/bebidas/{id}/` - Actualizar bebida (admin)
- `DELETE /api/bebidas/{id}/` - Eliminar bebida (admin)

### 🏺 Recipientes
- `GET /api/recipientes/` - Listar recipientes
- `POST /api/recipientes/` - Crear recipiente
- `GET /api/recipientes/{id}/` - Obtener recipiente
- `PUT /api/recipientes/{id}/` - Actualizar recipiente
- `DELETE /api/recipientes/{id}/` - Eliminar recipiente

### 🎯 Metas
- `GET /api/metas-diarias/` - Listar metas diarias
- `POST /api/metas-diarias/` - Crear meta diaria
- `GET /api/goals/` - Meta fija (usuarios gratuitos)

### ⏰ Recordatorios
- `GET /api/recordatorios/` - Listar recordatorios
- `POST /api/recordatorios/` - Crear recordatorio
- `GET /api/recordatorios/{id}/` - Obtener recordatorio
- `PUT /api/recordatorios/{id}/` - Actualizar recordatorio
- `DELETE /api/recordatorios/{id}/` - Eliminar recordatorio

### 💰 Monetización
- `GET /api/monetization/status/` - Estado de suscripción
- `GET /api/monetization/features/` - Funcionalidades premium
- `GET /api/monetization/limits/` - Límites de uso
- `GET /api/monetization/stats/` - Estadísticas (admin)
- `GET /api/monetization/upgrade/` - Sugerencias de upgrade
- `GET /api/monetization/no-ads/` - Verificación de anuncios

### 💎 Premium
- `GET /api/premium/goal/` - Meta personalizada
- `GET /api/premium/beverages/` - Bebidas premium
- `GET /api/premium/reminders/` - Recordatorios ilimitados
- `GET /api/premium/stats/history/` - Historial detallado
- `GET /api/premium/stats/summary/` - Resumen estadístico
- `GET /api/premium/stats/trends/` - Tendencias
- `GET /api/premium/stats/insights/` - Insights personalizados

## 📊 Modelos de Datos

### Usuario
```json
{
  "id": 1,
  "username": "usuario",
  "email": "usuario@ejemplo.com",
  "peso": 70.0,
  "edad": 25,
  "es_premium": false,
  "meta_diaria_ml": 2000,
  "nivel_actividad": "moderado"
}
```

### Consumo
```json
{
  "id": 1,
  "cantidad_ml": 300,
  "cantidad_hidratacion_efectiva": 270,
  "fecha_hora": "2024-01-15T10:30:00Z",
  "bebida": {
    "id": 1,
    "nombre": "Agua",
    "factor_hidratacion": 1.0
  },
  "recipiente": {
    "id": 1,
    "nombre": "Botella",
    "cantidad_ml": 500
  },
  "nivel_sed": 3,
  "estado_animo": 4,
  "notas": "Después del ejercicio",
  "ubicacion": "Gimnasio"
}
```

### Bebida
```json
{
  "id": 1,
  "nombre": "Agua",
  "factor_hidratacion": 1.0,
  "descripcion": "Agua pura",
  "es_agua": true,
  "es_premium": false,
  "calorias_por_ml": 0.0,
  "activa": true
}
```

## 💡 Ejemplos de Uso

### Registrar un Consumo

```bash
curl -X POST http://localhost:8000/api/consumos/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bebida": 1,
    "recipiente": 1,
    "cantidad_ml": 300,
    "nivel_sed": 3,
    "estado_animo": 4,
    "notas": "Después del ejercicio",
    "ubicacion": "Gimnasio"
  }'
```

### Crear un Recordatorio

```bash
curl -X POST http://localhost:8000/api/recordatorios/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hora": "09:00:00",
    "mensaje": "¡Hora de hidratarse!",
    "dias_semana": [1, 2, 3, 4, 5],
    "tipo_recordatorio": "agua",
    "frecuencia": "diario"
  }'
```

### Obtener Estadísticas Premium

```bash
curl -X GET "http://localhost:8000/api/premium/stats/summary/?period=daily" \
  -H "Authorization: Bearer <token>"
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Ejecutar todos los tests
python -m pytest tests/ -v

# Ejecutar tests con cobertura
python -m pytest tests/ --cov=consumos --cov=users --cov-report=html

# Ejecutar tests específicos
python -m pytest tests/test_models.py -v
```

### Estructura de Tests

```
tests/
├── conftest.py              # Configuración global
├── factories.py             # Factories para datos de prueba
├── test_models.py          # Tests de modelos
├── test_services.py        # Tests de servicios
├── test_serializers.py     # Tests de serializers
├── test_api_integration.py # Tests de integración
└── test_permissions.py     # Tests de permisos
```

## 🚀 Despliegue

### Docker

```bash
# Construir imagen
docker build -t hydrotracker-api .

# Ejecutar contenedor
docker run -p 8000:8000 hydrotracker-api
```

### Producción

```bash
# Configurar variables de entorno
export DEBUG=False
export SECRET_KEY=tu-secret-key-super-seguro
export DB_HOST=tu-host-postgresql
export DB_NAME=hydrotracker_prod
export DB_USER=usuario
export DB_PASSWORD=contraseña

# Ejecutar migraciones
python manage.py migrate

# Recopilar archivos estáticos
python manage.py collectstatic

# Ejecutar con Gunicorn
gunicorn hydrotracker.wsgi:application --bind 0.0.0.0:8000
```

## 📖 Documentación Interactiva

### Swagger UI
Accede a la documentación interactiva en: `http://localhost:8000/api/docs/`

### ReDoc
Documentación alternativa en: `http://localhost:8000/api/redoc/`

### Schema OpenAPI
Schema JSON en: `http://localhost:8000/api/schema/`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: dev@hydrotracker.com
- **Documentación**: https://docs.hydrotracker.com
- **Issues**: https://github.com/hydrotracker/api/issues

---

**¡Gracias por usar HydroTracker! 💧✨**
