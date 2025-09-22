# API Premium - HydroTracker

Este documento contiene ejemplos detallados de cómo usar la API premium de HydroTracker para funcionalidades exclusivas de usuarios premium.

## Configuración Inicial

### 1. Autenticación
Todos los endpoints premium requieren autenticación JWT y que el usuario sea premium.

```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tu_usuario",
    "password": "tu_password"
  }'
```

### 2. Headers de Autenticación
Incluye el token en todas las solicitudes:

```bash
Authorization: Bearer <tu_access_token>
```

### 3. Verificación de Usuario Premium
Todos los endpoints premium verifican que el usuario tenga `es_premium=True`. Si no es premium, retornan 403 Forbidden.

## API de Meta Personalizada Premium

### Base URL: `/api/premium/goal/`

### 1. Obtener Meta Personalizada

**GET /api/premium/goal/**

**Descripción:** Calcula una meta personalizada de hidratación basada en el peso y nivel de actividad del usuario.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Lógica de Cálculo:**
- Fórmula: `(peso_en_kg * 0.033) * factor_actividad`
- Factores de actividad:
  - Baja: 1.0
  - Moderada: 1.2
  - Alta: 1.5
  - Muy alta: 1.8

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/premium/goal/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
{
  "meta_recomendada_ml": 2640,
  "meta_actual_ml": 2000,
  "diferencia_ml": 640,
  "factor_actividad": 1.2,
  "peso_usuario": 70.0,
  "nivel_actividad": "moderada",
  "formula_usada": "(peso_kg * 0.033) * factor_actividad = (70.0 * 0.033) * 1.2",
  "recomendaciones": [
    "Tu meta actual es 640ml menor que la recomendada.",
    "Considera aumentar gradualmente tu meta diaria.",
    "Con tu nivel de actividad moderada, la hidratación es importante para mantener el rendimiento."
  ],
  "fecha_calculo": "2024-01-15T10:30:00Z"
}
```

**Respuesta de error (403) - Usuario no premium:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

## API de Bebidas Premium

### Base URL: `/api/premium/beverages/`

### 1. Obtener Todas las Bebidas

**GET /api/premium/beverages/**

**Descripción:** Obtiene todas las bebidas disponibles (gratuitas y premium) para usuarios premium.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Parámetros de consulta:**
- `categoria`: Filtrar por categoría (premium, gratuitas, agua, hidratantes)
- `factor_min`: Filtrar por factor de hidratación mínimo
- `search`: Búsqueda por nombre

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/premium/beverages/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
{
  "bebidas": [
    {
      "id": 1,
      "nombre": "Agua Natural",
      "factor_hidratacion": 1.0,
      "es_agua": true,
      "calorias_por_ml": 0.0,
      "activa": true,
      "es_premium": false,
      "categoria": "Agua",
      "es_disponible": true,
      "fecha_creacion": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "nombre": "Agua Premium con Electrolitos",
      "factor_hidratacion": 1.2,
      "es_agua": true,
      "calorias_por_ml": 0.0,
      "activa": true,
      "es_premium": true,
      "categoria": "Agua",
      "es_disponible": true,
      "fecha_creacion": "2024-01-15T10:30:00Z"
    },
    {
      "id": 3,
      "nombre": "Bebida Deportiva Premium",
      "factor_hidratacion": 0.9,
      "es_agua": false,
      "calorias_por_ml": 0.4,
      "activa": true,
      "es_premium": true,
      "categoria": "Hidratante",
      "es_disponible": true,
      "fecha_creacion": "2024-01-15T10:30:00Z"
    }
  ],
  "total_bebidas": 15,
  "bebidas_por_categoria": {
    "Agua": [
      {
        "id": 1,
        "nombre": "Agua Natural",
        "es_premium": false
      },
      {
        "id": 2,
        "nombre": "Agua Premium con Electrolitos",
        "es_premium": true
      }
    ],
    "Hidratante": [
      {
        "id": 3,
        "nombre": "Bebida Deportiva Premium",
        "es_premium": true
      }
    ]
  },
  "categorias_disponibles": ["Agua", "Hidratante", "Moderada", "Deshidratante"]
}
```

### 2. Filtrar Bebidas por Categoría

**Ejemplos de filtros:**

```bash
# Solo bebidas premium
curl -X GET "http://127.0.0.1:8000/api/premium/beverages/?categoria=premium" \
  -H "Authorization: Bearer <token>"

# Solo bebidas gratuitas
curl -X GET "http://127.0.0.1:8000/api/premium/beverages/?categoria=gratuitas" \
  -H "Authorization: Bearer <token>"

# Solo bebidas de agua
curl -X GET "http://127.0.0.1:8000/api/premium/beverages/?categoria=agua" \
  -H "Authorization: Bearer <token>"

# Bebidas hidratantes (factor >= 0.8)
curl -X GET "http://127.0.0.1:8000/api/premium/beverages/?categoria=hidratantes" \
  -H "Authorization: Bearer <token>"

# Filtrar por factor de hidratación mínimo
curl -X GET "http://127.0.0.1:8000/api/premium/beverages/?factor_min=0.8" \
  -H "Authorization: Bearer <token>"

# Buscar por nombre
curl -X GET "http://127.0.0.1:8000/api/premium/beverages/?search=premium" \
  -H "Authorization: Bearer <token>"
```

## API de Recordatorios Premium

### Base URL: `/api/premium/reminders/`

### 1. Crear Recordatorio Premium

**POST /api/premium/reminders/**

**Descripción:** Crea un recordatorio premium sin límites de cantidad.

**Datos requeridos:**
- `hora`: Hora del recordatorio (HH:MM:SS)

**Datos opcionales:**
- `mensaje`: Mensaje personalizado
- `tipo_recordatorio`: Tipo de recordatorio (agua, meta, personalizado)
- `frecuencia`: Frecuencia (diario, dias_laborales, fines_semana, personalizado)
- `dias_semana`: Lista de días de la semana (0=Lunes, 6=Domingo)
- `sonido`: Sonido del recordatorio
- `vibracion`: Activar vibración (true/false)

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/premium/reminders/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hora": "09:00:00",
    "mensaje": "¡Hora de hidratarse! 💎",
    "tipo_recordatorio": "agua",
    "frecuencia": "diario",
    "dias_semana": [0, 1, 2, 3, 4, 5, 6],
    "sonido": "premium",
    "vibracion": true
  }'
```

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "usuario": "juan_perez",
  "hora": "09:00:00",
  "mensaje": "¡Hora de hidratarse! 💎",
  "mensaje_completo": "¡Hora de hidratarse! 💎",
  "activo": true,
  "dias_semana": [0, 1, 2, 3, 4, 5, 6],
  "dias_semana_display": "Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo",
  "tipo_recordatorio": "agua",
  "frecuencia": "diario",
  "sonido": "premium",
  "vibracion": true,
  "fecha_creacion": "2024-01-15T10:30:00Z",
  "fecha_actualizacion": "2024-01-15T10:30:00Z",
  "ultimo_enviado": null,
  "proximo_envio": "2024-01-16T09:00:00Z",
  "es_premium": true
}
```

### 2. Listar Recordatorios Premium

**GET /api/premium/reminders/**

**Descripción:** Lista todos los recordatorios del usuario premium.

**Parámetros de consulta:**
- `activo`: Filtrar por estado activo (true/false)
- `tipo_recordatorio`: Filtrar por tipo
- `frecuencia`: Filtrar por frecuencia
- `search`: Búsqueda en mensaje
- `ordering`: Ordenar por campo

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/premium/reminders/ \
  -H "Authorization: Bearer <token>"
```

### 3. Obtener Recordatorio Específico

**GET /api/premium/reminders/{id}/**

```bash
curl -X GET http://127.0.0.1:8000/api/premium/reminders/1/ \
  -H "Authorization: Bearer <token>"
```

### 4. Actualizar Recordatorio Premium

**PUT/PATCH /api/premium/reminders/{id}/**

```bash
curl -X PATCH http://127.0.0.1:8000/api/premium/reminders/1/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mensaje": "¡Actualizado! Recordatorio premium 💎",
    "vibracion": false
  }'
```

### 5. Eliminar Recordatorio Premium

**DELETE /api/premium/reminders/{id}/**

```bash
curl -X DELETE http://127.0.0.1:8000/api/premium/reminders/1/ \
  -H "Authorization: Bearer <token>"
```

### 6. Endpoints Especiales Premium

#### Recordatorios Activos
**GET /api/premium/reminders/activos/**

```bash
curl -X GET http://127.0.0.1:8000/api/premium/reminders/activos/ \
  -H "Authorization: Bearer <token>"
```

#### Próximos Recordatorios
**GET /api/premium/reminders/proximos/**

```bash
curl -X GET http://127.0.0.1:8000/api/premium/reminders/proximos/ \
  -H "Authorization: Bearer <token>"
```

#### Estadísticas Premium
**GET /api/premium/reminders/stats/**

```bash
curl -X GET http://127.0.0.1:8000/api/premium/reminders/stats/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
{
  "total_recordatorios": 15,
  "recordatorios_activos": 12,
  "recordatorios_inactivos": 3,
  "proximos_recordatorios": [
    {
      "id": 1,
      "hora": "09:00:00",
      "mensaje": "¡Hora de hidratarse! 💎",
      "proximo_envio": "2024-01-16T09:00:00Z"
    }
  ],
  "recordatorios_por_tipo": {
    "agua": 8,
    "meta": 4,
    "personalizado": 3
  },
  "recordatorios_por_frecuencia": {
    "diario": 10,
    "dias_laborales": 3,
    "personalizado": 2
  },
  "es_premium": true,
  "limite_recordatorios": "Ilimitado"
}
```

#### Alternar Estado Activo
**POST /api/premium/reminders/{id}/toggle_active/**

```bash
curl -X POST http://127.0.0.1:8000/api/premium/reminders/1/toggle_active/ \
  -H "Authorization: Bearer <token>"
```

#### Marcar como Enviado
**POST /api/premium/reminders/{id}/marcar_enviado/**

```bash
curl -X POST http://127.0.0.1:8000/api/premium/reminders/1/marcar_enviado/ \
  -H "Authorization: Bearer <token>"
```

#### Creación Rápida Premium
**POST /api/premium/reminders/crear_rapido/**

```bash
curl -X POST http://127.0.0.1:8000/api/premium/reminders/crear_rapido/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hora": "15:30:00"
  }'
```

#### Agrupar por Tipo
**GET /api/premium/reminders/por_tipo/**

```bash
curl -X GET http://127.0.0.1:8000/api/premium/reminders/por_tipo/ \
  -H "Authorization: Bearer <token>"
```

## Diferencias con la Versión Gratuita

### 1. Meta Personalizada
- **Gratuita**: Meta fija predefinida (2000ml)
- **Premium**: Meta calculada personalmente basada en peso y actividad

### 2. Bebidas
- **Gratuita**: Solo bebidas gratuitas
- **Premium**: Acceso completo a catálogo (gratuitas + premium)

### 3. Recordatorios
- **Gratuita**: Límite de 3 recordatorios
- **Premium**: Ilimitados

### 4. Funcionalidades Adicionales
- **Premium**: Estadísticas avanzadas, agrupación, filtros avanzados
- **Gratuita**: Funcionalidades básicas

## Control de Acceso

### Permisos Requeridos
- `IsAuthenticated`: Usuario autenticado
- `IsPremiumUser`: Usuario con `es_premium=True`

### Respuestas de Error

#### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

## Categorías de Bebidas

### 1. Agua
- Factor de hidratación: 1.0
- Incluye: Agua natural, agua premium, agua con electrolitos

### 2. Hidratante
- Factor de hidratación: >= 0.8
- Incluye: Bebidas deportivas, isotónicas, agua de coco

### 3. Moderada
- Factor de hidratación: 0.5 - 0.79
- Incluye: Té, café, bebidas ligeras

### 4. Deshidratante
- Factor de hidratación: < 0.5
- Incluye: Bebidas alcohólicas, refrescos

## Ejemplos de Integración

### JavaScript/Fetch
```javascript
// Obtener meta personalizada
const response = await fetch('/api/premium/goal/', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const goal = await response.json();
console.log('Meta recomendada:', goal.meta_recomendada_ml);

// Obtener bebidas premium
const beveragesResponse = await fetch('/api/premium/beverages/', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const beverages = await beveragesResponse.json();
console.log('Bebidas disponibles:', beverages.total_bebidas);

// Crear recordatorio premium
const reminderResponse = await fetch('/api/premium/reminders/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    hora: '09:00:00',
    mensaje: '¡Hora de hidratarse! 💎',
    tipo_recordatorio: 'agua',
    frecuencia: 'diario'
  })
});

const reminder = await reminderResponse.json();
console.log('Recordatorio creado:', reminder.id);
```

### Python/Requests
```python
import requests

# Obtener meta personalizada
response = requests.get(
    'http://127.0.0.1:8000/api/premium/goal/',
    headers={'Authorization': f'Bearer {token}'}
)

goal = response.json()
print(f"Meta recomendada: {goal['meta_recomendada_ml']}ml")

# Obtener bebidas premium
beverages_response = requests.get(
    'http://127.0.0.1:8000/api/premium/beverages/',
    headers={'Authorization': f'Bearer {token}'}
)

beverages = beverages_response.json()
print(f"Bebidas disponibles: {beverages['total_bebidas']}")

# Crear recordatorio premium
reminder_response = requests.post(
    'http://127.0.0.1:8000/api/premium/reminders/',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'hora': '09:00:00',
        'mensaje': '¡Hora de hidratarse! 💎',
        'tipo_recordatorio': 'agua',
        'frecuencia': 'diario'
    }
)

reminder = reminder_response.json()
print(f"Recordatorio creado: {reminder['id']}")
```

### React/useEffect
```jsx
import { useState, useEffect } from 'react';

function PremiumFeatures() {
  const [goal, setGoal] = useState(null);
  const [beverages, setBeverages] = useState([]);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const fetchPremiumData = async () => {
      try {
        // Obtener meta personalizada
        const goalResponse = await fetch('/api/premium/goal/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const goalData = await goalResponse.json();
        setGoal(goalData);

        // Obtener bebidas premium
        const beveragesResponse = await fetch('/api/premium/beverages/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const beveragesData = await beveragesResponse.json();
        setBeverages(beveragesData.bebidas);

        // Obtener recordatorios premium
        const remindersResponse = await fetch('/api/premium/reminders/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const remindersData = await remindersResponse.json();
        setReminders(remindersData.results);

      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchPremiumData();
  }, []);

  return (
    <div>
      <h2>Funcionalidades Premium</h2>
      
      {goal && (
        <div>
          <h3>Meta Personalizada</h3>
          <p>Recomendada: {goal.meta_recomendada_ml}ml</p>
          <p>Actual: {goal.meta_actual_ml}ml</p>
        </div>
      )}

      <div>
        <h3>Bebidas Premium ({beverages.length})</h3>
        {beverages.map(beverage => (
          <div key={beverage.id}>
            {beverage.nombre} {beverage.es_premium && '💎'}
          </div>
        ))}
      </div>

      <div>
        <h3>Recordatorios Premium ({reminders.length})</h3>
        {reminders.map(reminder => (
          <div key={reminder.id}>
            {reminder.hora}: {reminder.mensaje_completo}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Notas Importantes

1. **Seguridad**: Todos los endpoints premium requieren autenticación y verificación de usuario premium
2. **Límites**: Los usuarios premium no tienen límites en recordatorios
3. **Acceso**: Solo usuarios con `es_premium=True` pueden acceder a estos endpoints
4. **Personalización**: La meta se calcula personalmente para cada usuario
5. **Catálogo Completo**: Acceso a todas las bebidas (gratuitas y premium)
6. **Funcionalidades Avanzadas**: Estadísticas, agrupación, filtros avanzados
7. **Escalabilidad**: Diseño preparado para futuras funcionalidades premium
8. **Monetización**: Diferenciación clara entre usuarios gratuitos y premium
