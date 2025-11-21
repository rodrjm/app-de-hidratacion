# 📚 Guía Completa de la API - HydroTracker

## 🎯 Resumen
Esta guía documenta todos los endpoints de la API de HydroTracker, incluyendo ejemplos de uso, autenticación y casos de uso.

## 🔐 Autenticación
La API utiliza JWT (JSON Web Tokens) para autenticación.

### Endpoints de Autenticación
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/register/` - Registro de usuario
- `POST /api/auth/token/refresh/` - Renovar token
- `POST /api/auth/logout/` - Cerrar sesión

## 📊 Endpoints Principales

### Consumos
- `GET /api/consumos/` - Listar consumos del usuario
- `POST /api/consumos/` - Crear nuevo consumo
- `GET /api/consumos/{id}/` - Obtener consumo específico
- `PUT /api/consumos/{id}/` - Actualizar consumo
- `DELETE /api/consumos/{id}/` - Eliminar consumo

### Estadísticas
- `GET /api/stats/daily/` - Estadísticas diarias
- `GET /api/stats/weekly/` - Estadísticas semanales
- `GET /api/stats/monthly/` - Estadísticas mensuales
- `GET /api/stats/trends/` - Tendencias de hidratación
- `GET /api/stats/insights/` - Insights personalizados

### Monetización
- `GET /api/monetization/status/` - Estado de suscripción
- `GET /api/monetization/features/` - Características premium
- `GET /api/monetization/limits/` - Límites de uso
- `GET /api/monetization/stats/` - Estadísticas de monetización
- `GET /api/monetization/prompt/` - Prompt de actualización

### Premium
- `GET /api/premium/goals/` - Metas premium
- `POST /api/premium/goals/` - Crear meta premium
- `GET /api/premium/beverages/` - Bebidas premium
- `GET /api/premium/reminders/` - Recordatorios premium
- `POST /api/premium/reminders/` - Crear recordatorio premium

### No Ads
- `GET /api/monetization/no-ads/` - Verificar estado de anuncios

## 📝 Ejemplos de Uso

### Crear un Consumo
```bash
curl -X POST http://localhost:8000/api/consumos/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bebida": 1,
    "recipiente": 1,
    "cantidad_ml": 250,
    "nivel_sed": 3,
    "estado_animo": "bueno"
  }'
```

### Obtener Estadísticas Diarias
```bash
curl -X GET http://localhost:8000/api/stats/daily/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Verificar Estado Premium
```bash
curl -X GET http://localhost:8000/api/monetization/status/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Configuración

### Variables de Entorno
```env
DATABASE_URL=postgresql://user:password@localhost:5432/hydrotracker
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Instalación
```bash
# Backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd hydrotracker-frontend
npm install
npm run dev
```

## 📈 Códigos de Estado HTTP

- `200` - OK
- `201` - Creado
- `400` - Solicitud incorrecta
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `500` - Error interno del servidor

## 🚀 Características Avanzadas

### Caching
- Redis para caché de consultas frecuentes
- TTL configurable por endpoint
- Invalidación automática

### Filtros y Búsqueda
- Filtrado por fecha, bebida, recipiente
- Búsqueda por texto
- Ordenamiento personalizable

### Paginación
- Paginación automática en listados
- Límites configurables
- Navegación de páginas

## 📚 Documentación Adicional

- [Guía de Despliegue](DEPLOYMENT_GUIDE.md)
- [Guía de Rendimiento](PERFORMANCE_GUIDE.md)
- [Guía de Testing](TESTING_GUIDE.md)