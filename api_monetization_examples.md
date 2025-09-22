# API de Monetización - HydroTracker

Este documento contiene ejemplos detallados de cómo usar la API de monetización de HydroTracker para gestionar suscripciones y funcionalidades premium.

## Configuración Inicial

### 1. Autenticación
Los endpoints protegidos requieren autenticación JWT. Obtén un token de acceso:

```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tu_usuario",
    "password": "tu_password"
  }'
```

### 2. Headers de Autenticación
Incluye el token en las solicitudes protegidas:

```bash
Authorization: Bearer <tu_access_token>
```

## API de Estado de Suscripción

### Base URL: `/api/monetization/status/`

### 1. Obtener Estado de Suscripción

**GET /api/monetization/status/**

**Descripción:** Obtiene el estado de suscripción del usuario autenticado, incluyendo funcionalidades disponibles y límites.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/monetization/status/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200) - Usuario Gratuito:**
```json
{
  "is_premium": false,
  "subscription_type": "gratuito",
  "subscription_end_date": null,
  "days_remaining": null,
  "features_available": [
    "Meta diaria fija",
    "Estadísticas básicas",
    "Recordatorios limitados (3 máximo)",
    "Tema estándar"
  ],
  "limitations": {
    "recordatorios_max": 3,
    "consumos_diarios_max": 50,
    "estadisticas_avanzadas": false,
    "exportacion_datos": false,
    "personalizacion_completa": false,
    "anuncios": true
  },
  "upgrade_required": true
}
```

**Respuesta exitosa (200) - Usuario Premium:**
```json
{
  "is_premium": true,
  "subscription_type": "premium",
  "subscription_end_date": null,
  "days_remaining": null,
  "features_available": [
    "Meta diaria personalizada",
    "Estadísticas y análisis avanzados",
    "Recordatorios ilimitados",
    "Sin anuncios",
    "Exportación de datos",
    "Temas personalizados",
    "Sincronización en la nube",
    "Soporte prioritario"
  ],
  "limitations": {
    "recordatorios_max": 10,
    "consumos_diarios_max": 1000,
    "estadisticas_avanzadas": true,
    "exportacion_datos": true,
    "personalizacion_completa": true,
    "anuncios": false
  },
  "upgrade_required": false
}
```

## API de Funcionalidades Premium

### Base URL: `/api/monetization/features/`

### 1. Obtener Funcionalidades Premium

**GET /api/monetization/features/**

**Descripción:** Obtiene la lista completa de funcionalidades premium disponibles. Este endpoint no requiere autenticación.

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/monetization/features/
```

**Respuesta exitosa (200):**
```json
{
  "features": [
    {
      "id": "meta_personalizada",
      "name": "Meta Diaria Personalizada",
      "description": "Calcula tu meta de hidratación basada en tu peso, edad y nivel de actividad",
      "icon": "target",
      "category": "Personalización",
      "is_available": true
    },
    {
      "id": "estadisticas_avanzadas",
      "name": "Estadísticas y Análisis Avanzados",
      "description": "Gráficos detallados, tendencias y análisis de tu progreso de hidratación",
      "icon": "chart-line",
      "category": "Análisis",
      "is_available": true
    },
    {
      "id": "recordatorios_ilimitados",
      "name": "Recordatorios Ilimitados",
      "description": "Crea tantos recordatorios como necesites para mantenerte hidratado",
      "icon": "bell",
      "category": "Recordatorios",
      "is_available": true
    },
    {
      "id": "sin_anuncios",
      "name": "Sin Anuncios",
      "description": "Disfruta de la aplicación sin interrupciones publicitarias",
      "icon": "ad",
      "category": "Experiencia",
      "is_available": true
    },
    {
      "id": "exportacion_datos",
      "name": "Exportación de Datos",
      "description": "Exporta tus datos de hidratación en formato CSV o PDF",
      "icon": "download",
      "category": "Datos",
      "is_available": true
    },
    {
      "id": "temas_personalizados",
      "name": "Temas Personalizados",
      "description": "Personaliza la apariencia de la aplicación con diferentes temas",
      "icon": "palette",
      "category": "Personalización",
      "is_available": true
    },
    {
      "id": "sincronizacion_nube",
      "name": "Sincronización en la Nube",
      "description": "Sincroniza tus datos entre todos tus dispositivos",
      "icon": "cloud",
      "category": "Sincronización",
      "is_available": true
    },
    {
      "id": "soporte_prioritario",
      "name": "Soporte Prioritario",
      "description": "Recibe soporte técnico prioritario y respuesta rápida",
      "icon": "headset",
      "category": "Soporte",
      "is_available": true
    },
    {
      "id": "analisis_tendencias",
      "name": "Análisis de Tendencias",
      "description": "Identifica patrones en tu hidratación y recibe recomendaciones",
      "icon": "trending-up",
      "category": "Análisis",
      "is_available": true
    },
    {
      "id": "recordatorios_inteligentes",
      "name": "Recordatorios Inteligentes",
      "description": "Recordatorios que se adaptan a tu rutina y patrones de hidratación",
      "icon": "brain",
      "category": "Recordatorios",
      "is_available": true
    }
  ],
  "total_features": 10,
  "categories": [
    "Análisis",
    "Datos",
    "Experiencia",
    "Personalización",
    "Recordatorios",
    "Sincronización",
    "Soporte"
  ]
}
```

## API de Límites de Uso

### Base URL: `/api/monetization/limits/`

### 1. Obtener Límites de Uso

**GET /api/monetization/limits/**

**Descripción:** Obtiene los límites de uso actuales del usuario y su progreso.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/monetization/limits/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
{
  "recordatorios": {
    "actual": 2,
    "maximo": 3,
    "porcentaje": 66.7,
    "restantes": 1
  },
  "consumos_diarios": {
    "actual": 15,
    "maximo": 50,
    "porcentaje": 30.0,
    "restantes": 35
  },
  "estadisticas_avanzadas": {
    "disponible": false,
    "descripcion": "Solo disponible en versión premium"
  },
  "exportacion_datos": {
    "disponible": false,
    "descripcion": "Solo disponible en versión premium"
  },
  "personalizacion": {
    "disponible": false,
    "descripcion": "Solo disponible en versión premium"
  }
}
```

## API de Estadísticas de Monetización

### Base URL: `/api/monetization/stats/`

### 1. Obtener Estadísticas de Monetización

**GET /api/monetization/stats/**

**Descripción:** Obtiene estadísticas de monetización del sistema. Solo disponible para administradores.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/monetization/stats/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200) - Administrador:**
```json
{
  "usuarios_totales": 150,
  "usuarios_premium": 25,
  "usuarios_gratuitos": 125,
  "conversion_rate": 16.67,
  "ingresos_mensuales": "0.00",
  "funcionalidades_mas_usadas": [
    {
      "nombre": "Recordatorios",
      "uso": 85,
      "premium": false
    },
    {
      "nombre": "Estadísticas Básicas",
      "uso": 70,
      "premium": false
    },
    {
      "nombre": "Meta Personalizada",
      "uso": 45,
      "premium": true
    },
    {
      "nombre": "Exportación de Datos",
      "uso": 30,
      "premium": true
    },
    {
      "nombre": "Temas Personalizados",
      "uso": 25,
      "premium": true
    }
  ]
}
```

**Respuesta de error (403) - Usuario no administrador:**
```json
{
  "error": "No tienes permisos para ver estas estadísticas"
}
```

## API de Prompt de Upgrade

### Base URL: `/api/monetization/upgrade/`

### 1. Obtener Información de Upgrade

**GET /api/monetization/upgrade/**

**Descripción:** Obtiene información personalizada de upgrade basada en el uso del usuario.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/monetization/upgrade/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200) - Usuario Gratuito:**
```json
{
  "is_premium": false,
  "recomendaciones": [
    {
      "funcionalidad": "Recordatorios Ilimitados",
      "descripcion": "Actualmente tienes 2 recordatorios. Con Premium puedes crear ilimitados.",
      "icon": "bell"
    },
    {
      "funcionalidad": "Estadísticas Avanzadas",
      "descripcion": "Con tantos registros, las estadísticas avanzadas te ayudarían a analizar tu progreso.",
      "icon": "chart-line"
    }
  ],
  "beneficios_principales": [
    "Meta diaria personalizada",
    "Recordatorios ilimitados",
    "Estadísticas avanzadas",
    "Sin anuncios"
  ],
  "precio_mensual": 4.99,
  "precio_anual": 49.99,
  "ahorro_anual": 10.89
}
```

**Respuesta exitosa (200) - Usuario Premium:**
```json
{
  "message": "Ya tienes una suscripción premium activa",
  "is_premium": true
}
```

## Configuración de Límites

### Variables de Entorno

Puedes configurar los límites mediante variables de entorno:

```bash
# Meta fija para usuarios gratuitos (ml)
META_FIJA_ML=2000

# Límite de recordatorios para usuarios gratuitos
META_MAX_RECORDATORIOS_GRATUITOS=3

# Límite de recordatorios para usuarios premium
META_MAX_RECORDATORIOS_PREMIUM=10
```

### Configuración en settings.py

```python
# Configuración de metas de hidratación
META_FIJA_ML = config('META_FIJA_ML', default=2000, cast=int)
META_MAX_RECORDATORIOS_GRATUITOS = config('META_MAX_RECORDATORIOS_GRATUITOS', default=3, cast=int)
META_MAX_RECORDATORIOS_PREMIUM = config('META_MAX_RECORDATORIOS_PREMIUM', default=10, cast=int)
```

## Tipos de Suscripción

### 1. Usuario Gratuito
- **Tipo:** `gratuito`
- **Funcionalidades:** Limitadas
- **Límites:** Recordatorios (3), Consumos diarios (50)
- **Anuncios:** Sí
- **Precio:** Gratis

### 2. Usuario Premium
- **Tipo:** `premium`
- **Funcionalidades:** Completas
- **Límites:** Ilimitados
- **Anuncios:** No
- **Precio:** $4.99/mes o $49.99/año

## Categorías de Funcionalidades Premium

### 1. Personalización
- Meta diaria personalizada
- Temas personalizados
- Configuración avanzada

### 2. Análisis
- Estadísticas avanzadas
- Análisis de tendencias
- Gráficos detallados

### 3. Recordatorios
- Recordatorios ilimitados
- Recordatorios inteligentes
- Configuración avanzada

### 4. Experiencia
- Sin anuncios
- Interfaz premium
- Experiencia optimizada

### 5. Datos
- Exportación de datos
- Sincronización en la nube
- Respaldo automático

### 6. Soporte
- Soporte prioritario
- Respuesta rápida
- Asistencia personalizada

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: No autorizado (solo para estadísticas de admin)
- `500 Internal Server Error`: Error interno del servidor

## Manejo de Errores

### Ejemplo de error de autenticación (401):
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Ejemplo de error de permisos (403):
```json
{
  "error": "No tienes permisos para ver estas estadísticas"
}
```

## Ejemplos de Integración

### JavaScript/Fetch
```javascript
// Obtener estado de suscripción
const response = await fetch('/api/monetization/status/', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const status = await response.json();
console.log('Es premium:', status.is_premium);

// Obtener funcionalidades premium (sin autenticación)
const featuresResponse = await fetch('/api/monetization/features/');
const features = await featuresResponse.json();
console.log('Funcionalidades:', features.features);
```

### Python/Requests
```python
import requests

# Obtener estado de suscripción
response = requests.get(
    'http://127.0.0.1:8000/api/monetization/status/',
    headers={'Authorization': f'Bearer {token}'}
)

status = response.json()
print(f"Es premium: {status['is_premium']}")

# Obtener límites de uso
limits_response = requests.get(
    'http://127.0.0.1:8000/api/monetization/limits/',
    headers={'Authorization': f'Bearer {token}'}
)

limits = limits_response.json()
print(f"Recordatorios: {limits['recordatorios']['actual']}/{limits['recordatorios']['maximo']}")
```

### React/useEffect
```jsx
import { useState, useEffect } from 'react';

function SubscriptionStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/monetization/status/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Estado de Suscripción</h2>
      <p>Tipo: {status.subscription_type}</p>
      <p>Es Premium: {status.is_premium ? 'Sí' : 'No'}</p>
      <p>Funcionalidades: {status.features_available.length}</p>
    </div>
  );
}
```

## Notas Importantes

1. **Seguridad**: Los endpoints de estado y límites requieren autenticación
2. **Funcionalidades**: El endpoint de funcionalidades es público para mostrar beneficios
3. **Límites**: Los límites se calculan en tiempo real basados en el uso actual
4. **Personalización**: Las recomendaciones de upgrade se basan en el comportamiento del usuario
5. **Estadísticas**: Solo administradores pueden ver estadísticas de monetización
6. **Configuración**: Los límites son configurables desde variables de entorno
7. **Escalabilidad**: La API está diseñada para manejar diferentes tipos de suscripción
8. **Monetización**: Incluye información de precios y beneficios para conversión

## Flujo de Monetización

### 1. Usuario Gratuito
1. Usa funcionalidades básicas
2. Alcanza límites → Ve prompt de upgrade
3. Consulta funcionalidades premium
4. Decide actualizar a premium

### 2. Usuario Premium
1. Acceso completo a funcionalidades
2. Sin límites de uso
3. Experiencia sin anuncios
4. Soporte prioritario

### 3. Administrador
1. Monitorea conversiones
2. Analiza uso de funcionalidades
3. Ajusta límites según necesidades
4. Gestiona precios y planes
