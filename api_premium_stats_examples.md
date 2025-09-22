# API Premium - Estadísticas e Historial de Consumos

Este documento contiene ejemplos detallados de cómo usar la API premium de estadísticas de HydroTracker para obtener historial detallado y análisis agregados de consumos.

## Configuración Inicial

### 1. Autenticación
Todos los endpoints de estadísticas premium requieren autenticación JWT y que el usuario sea premium.

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
Todos los endpoints de estadísticas verifican que el usuario tenga `es_premium=True`. Si no es premium, retornan 403 Forbidden.

## API de Historial Detallado

### Base URL: `/api/premium/stats/history/`

### 1. Obtener Historial Completo

**GET /api/premium/stats/history/**

**Descripción:** Obtiene un listado completo de todos los consumos del usuario premium, ordenado por fecha descendente.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Parámetros de consulta:**
- `fecha_inicio`: Fecha de inicio (YYYY-MM-DD)
- `fecha_fin`: Fecha de fin (YYYY-MM-DD)
- `bebida`: ID de la bebida para filtrar
- `nivel_sed`: Nivel de sed para filtrar
- `estado_animo`: Estado de ánimo para filtrar
- `search`: Búsqueda en notas, ubicación o nombre de bebida
- `ordering`: Ordenamiento (fecha_hora, cantidad_ml, cantidad_hidratacion_efectiva)

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/premium/stats/history/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
{
  "count": 25,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "cantidad_ml": 250,
      "bebida": {
        "id": 1,
        "nombre": "Agua Natural",
        "factor_hidratacion": 1.0,
        "es_agua": true,
        "es_premium": false
      },
      "recipiente_nombre": "Vaso Grande",
      "hidratacion_efectiva_ml": 250,
      "fecha_hora": "2024-01-15T14:30:00Z",
      "fecha_formateada": "2024-01-15",
      "hora_formateada": "14:30",
      "nivel_sed": "moderada",
      "estado_animo": "bien",
      "notas": "Después del almuerzo",
      "ubicacion": "Casa",
      "fecha_creacion": "2024-01-15T14:30:00Z"
    },
    {
      "id": 2,
      "cantidad_ml": 300,
      "bebida": {
        "id": 2,
        "nombre": "Agua Premium con Electrolitos",
        "factor_hidratacion": 1.2,
        "es_agua": true,
        "es_premium": true
      },
      "recipiente_nombre": "Botella Deportiva",
      "hidratacion_efectiva_ml": 360,
      "fecha_hora": "2024-01-15T10:15:00Z",
      "fecha_formateada": "2024-01-15",
      "hora_formateada": "10:15",
      "nivel_sed": "alta",
      "estado_animo": "bien",
      "notas": "Después del ejercicio",
      "ubicacion": "Gimnasio",
      "fecha_creacion": "2024-01-15T10:15:00Z"
    }
  ]
}
```

### 2. Filtrar por Rango de Fechas

**Ejemplo de solicitud:**
```bash
curl -X GET "http://127.0.0.1:8000/api/premium/stats/history/?fecha_inicio=2024-01-01&fecha_fin=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

### 3. Buscar por Texto

**Ejemplo de solicitud:**
```bash
curl -X GET "http://127.0.0.1:8000/api/premium/stats/history/?search=ejercicio" \
  -H "Authorization: Bearer <token>"
```

### 4. Ordenar por Cantidad

**Ejemplo de solicitud:**
```bash
curl -X GET "http://127.0.0.1:8000/api/premium/stats/history/?ordering=-cantidad_ml" \
  -H "Authorization: Bearer <token>"
```

## API de Estadísticas Agregadas

### Base URL: `/api/premium/stats/summary/`

### 1. Resumen Diario

**GET /api/premium/stats/summary/?period=daily**

**Descripción:** Obtiene estadísticas agregadas por día.

**Parámetros de consulta:**
- `period`: Tipo de periodo (daily, weekly, monthly)
- `fecha_inicio`: Fecha de inicio (YYYY-MM-DD)
- `fecha_fin`: Fecha de fin (YYYY-MM-DD)

**Ejemplo de solicitud:**
```bash
curl -X GET "http://127.0.0.1:8000/api/premium/stats/summary/?period=daily" \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
[
  {
    "fecha": "2024-01-15",
    "total_ml": 1250,
    "total_hidratacion_efectiva_ml": 1500,
    "cantidad_consumos": 5,
    "meta_ml": 2000,
    "progreso_porcentaje": 75.0,
    "completada": false,
    "consumos_por_hora": [
      {
        "hora": 0,
        "total_ml": 0,
        "cantidad_consumos": 0
      },
      {
        "hora": 1,
        "total_ml": 0,
        "cantidad_consumos": 0
      },
      {
        "hora": 8,
        "total_ml": 250,
        "cantidad_consumos": 1
      },
      {
        "hora": 10,
        "total_ml": 300,
        "cantidad_consumos": 1
      },
      {
        "hora": 14,
        "total_ml": 400,
        "cantidad_consumos": 2
      },
      {
        "hora": 18,
        "total_ml": 300,
        "cantidad_consumos": 1
      }
    ]
  },
  {
    "fecha": "2024-01-14",
    "total_ml": 2100,
    "total_hidratacion_efectiva_ml": 2100,
    "cantidad_consumos": 8,
    "meta_ml": 2000,
    "progreso_porcentaje": 105.0,
    "completada": true,
    "consumos_por_hora": [
      // ... datos por hora
    ]
  }
]
```

### 2. Resumen Semanal

**GET /api/premium/stats/summary/?period=weekly**

**Ejemplo de solicitud:**
```bash
curl -X GET "http://127.0.0.1:8000/api/premium/stats/summary/?period=weekly" \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
[
  {
    "semana_inicio": "2024-01-08",
    "semana_fin": "2024-01-14",
    "total_ml": 8750,
    "total_hidratacion_efectiva_ml": 10500,
    "cantidad_consumos": 35,
    "promedio_diario_ml": 1250.0,
    "dias_completados": 6,
    "dias_totales": 7,
    "eficiencia_hidratacion": 120.0,
    "dias_detalle": [
      {
        "fecha": "2024-01-08",
        "total_ml": 1200,
        "total_hidratacion_ml": 1200,
        "cantidad_consumos": 4
      },
      {
        "fecha": "2024-01-09",
        "total_ml": 1500,
        "total_hidratacion_ml": 1800,
        "cantidad_consumos": 6
      }
      // ... resto de días
    ]
  }
]
```

### 3. Resumen Mensual

**GET /api/premium/stats/summary/?period=monthly**

**Ejemplo de solicitud:**
```bash
curl -X GET "http://127.0.0.1:8000/api/premium/stats/summary/?period=monthly" \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
[
  {
    "mes": "January",
    "año": 2024,
    "total_ml": 37500,
    "total_hidratacion_efectiva_ml": 45000,
    "cantidad_consumos": 150,
    "promedio_diario_ml": 1209.68,
    "dias_activos": 28,
    "dias_totales": 31,
    "eficiencia_hidratacion": 120.0,
    "tendencia": "Aumento",
    "semanas_detalle": [
      {
        "semana": 1,
        "inicio": "2024-01-01",
        "fin": "2024-01-07",
        "total_ml": 8750,
        "total_hidratacion_ml": 10500,
        "cantidad_consumos": 35
      },
      {
        "semana": 2,
        "inicio": "2024-01-08",
        "fin": "2024-01-14",
        "total_ml": 9000,
        "total_hidratacion_ml": 10800,
        "cantidad_consumos": 36
      }
      // ... resto de semanas
    ]
  }
]
```

## API de Tendencias

### Base URL: `/api/premium/stats/trends/`

### 1. Obtener Tendencias

**GET /api/premium/stats/trends/**

**Descripción:** Obtiene tendencias de consumo comparando periodos actuales con anteriores.

**Parámetros de consulta:**
- `period`: Tipo de periodo (weekly, monthly)

**Ejemplo de solicitud:**
```bash
curl -X GET "http://127.0.0.1:8000/api/premium/stats/trends/?period=weekly" \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
{
  "periodo": "weekly",
  "tendencia": "Aumento moderado",
  "cambio_porcentaje": 8.5,
  "cambio_ml": 750,
  "promedio_anterior": 1200.0,
  "promedio_actual": 1302.0,
  "recomendaciones": [
    "¡Excelente! Tu consumo ha aumentado considerablemente. Mantén este ritmo.",
    "Tu consumo promedio está por debajo de lo recomendado. Intenta beber más agua."
  ]
}
```

## API de Insights y Análisis

### Base URL: `/api/premium/stats/insights/`

### 1. Obtener Insights Avanzados

**GET /api/premium/stats/insights/**

**Descripción:** Obtiene insights, patrones y análisis avanzados de los consumos.

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/premium/stats/insights/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
{
  "total_consumos": 150,
  "total_ml": 37500,
  "total_hidratacion_efectiva_ml": 45000,
  "periodo_analisis": "2023-12-16 a 2024-01-15",
  "insights": [
    {
      "tipo": "consistencia",
      "titulo": "Excelente consistencia",
      "descripcion": "Has registrado consumos en el 93.3% de los días",
      "nivel": "positivo"
    },
    {
      "tipo": "eficiencia",
      "titulo": "Excelente eficiencia de hidratación",
      "descripcion": "Tu eficiencia de hidratación es del 120.0%",
      "nivel": "positivo"
    }
  ],
  "patrones": [
    {
      "tipo": "hora_pico",
      "descripcion": "Tu hora de mayor consumo es las 14:00",
      "valor": 14,
      "unidad": "hora"
    },
    {
      "tipo": "dia_pico",
      "descripcion": "Tu día de mayor consumo es el Martes",
      "valor": 1,
      "unidad": "dia_semana"
    },
    {
      "tipo": "bebida_favorita",
      "descripcion": "Tu bebida favorita es Agua Natural",
      "valor": "Agua Natural",
      "unidad": "bebida"
    }
  ],
  "recomendaciones": [
    "Considera aumentar tu consumo diario de agua para alcanzar la recomendación de 2L diarios",
    "Intenta beber más agua pura para mejorar tu eficiencia de hidratación"
  ],
  "estadisticas_avanzadas": {
    "cantidad": {
      "promedio_ml": 250.0,
      "maximo_ml": 500,
      "minimo_ml": 100,
      "total_consumos": 150
    },
    "hidratacion": {
      "promedio_hidratacion_ml": 300.0,
      "eficiencia_promedio": 120.0
    },
    "bebidas": [
      {
        "bebida__nombre": "Agua Natural",
        "total_ml": 20000,
        "veces": 80,
        "promedio_ml": 250.0
      },
      {
        "bebida__nombre": "Agua Premium con Electrolitos",
        "total_ml": 10000,
        "veces": 40,
        "promedio_ml": 250.0
      }
    ]
  }
}
```

## Funciones de Agregación

### 1. TruncDay - Agregación Diaria
```python
# Agregar por día
daily_data = consumos.annotate(
    fecha=TruncDay('fecha_hora')
).values('fecha').annotate(
    total_ml=Sum('cantidad_ml'),
    total_hidratacion=Sum('cantidad_hidratacion_efectiva'),
    cantidad_consumos=Count('id')
).order_by('fecha')
```

### 2. TruncWeek - Agregación Semanal
```python
# Agregar por semana
weekly_data = consumos.annotate(
    semana=TruncWeek('fecha_hora')
).values('semana').annotate(
    total_ml=Sum('cantidad_ml'),
    total_hidratacion=Sum('cantidad_hidratacion_efectiva'),
    cantidad_consumos=Count('id')
).order_by('semana')
```

### 3. TruncMonth - Agregación Mensual
```python
# Agregar por mes
monthly_data = consumos.annotate(
    mes=TruncMonth('fecha_hora')
).values('mes').annotate(
    total_ml=Sum('cantidad_ml'),
    total_hidratacion=Sum('cantidad_hidratacion_efectiva'),
    cantidad_consumos=Count('id')
).order_by('mes')
```

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

#### 400 Bad Request
```json
{
  "error": "Periodo no válido. Use: daily, weekly, o monthly"
}
```

## Ejemplos de Integración

### JavaScript/Fetch
```javascript
// Obtener historial de consumos
const response = await fetch('/api/premium/stats/history/', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const history = await response.json();
console.log('Historial:', history.results);

// Obtener resumen diario
const summaryResponse = await fetch('/api/premium/stats/summary/?period=daily', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const dailySummary = await summaryResponse.json();
console.log('Resumen diario:', dailySummary);

// Obtener insights
const insightsResponse = await fetch('/api/premium/stats/insights/', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const insights = await insightsResponse.json();
console.log('Insights:', insights.insights);
```

### Python/Requests
```python
import requests

# Obtener historial de consumos
response = requests.get(
    'http://127.0.0.1:8000/api/premium/stats/history/',
    headers={'Authorization': f'Bearer {token}'}
)

history = response.json()
print(f"Historial: {len(history['results'])} consumos")

# Obtener resumen semanal
summary_response = requests.get(
    'http://127.0.0.1:8000/api/premium/stats/summary/?period=weekly',
    headers={'Authorization': f'Bearer {token}'}
)

weekly_summary = summary_response.json()
print(f"Resumen semanal: {len(weekly_summary)} semanas")

# Obtener tendencias
trends_response = requests.get(
    'http://127.0.0.1:8000/api/premium/stats/trends/?period=monthly',
    headers={'Authorization': f'Bearer {token}'}
)

trends = trends_response.json()
print(f"Tendencia: {trends['tendencia']}")
```

### React/useEffect
```jsx
import { useState, useEffect } from 'react';

function PremiumStats() {
  const [history, setHistory] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener historial
        const historyResponse = await fetch('/api/premium/stats/history/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const historyData = await historyResponse.json();
        setHistory(historyData.results);

        // Obtener resumen diario
        const summaryResponse = await fetch('/api/premium/stats/summary/?period=daily', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const summaryData = await summaryResponse.json();
        setDailySummary(summaryData);

        // Obtener insights
        const insightsResponse = await fetch('/api/premium/stats/insights/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const insightsData = await insightsResponse.json();
        setInsights(insightsData);

      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2>Estadísticas Premium</h2>
      
      <div>
        <h3>Historial de Consumos ({history.length})</h3>
        {history.map(consumo => (
          <div key={consumo.id}>
            {consumo.fecha_formateada} {consumo.hora_formateada}: 
            {consumo.cantidad_ml}ml de {consumo.bebida.nombre}
          </div>
        ))}
      </div>

      <div>
        <h3>Resumen Diario</h3>
        {dailySummary.map(dia => (
          <div key={dia.fecha}>
            {dia.fecha}: {dia.total_ml}ml ({dia.progreso_porcentaje.toFixed(1)}%)
          </div>
        ))}
      </div>

      {insights && (
        <div>
          <h3>Insights</h3>
          {insights.insights.map((insight, index) => (
            <div key={index}>
              <strong>{insight.titulo}:</strong> {insight.descripcion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Características Avanzadas

### 1. Análisis de Patrones
- **Hora pico**: Identifica la hora de mayor consumo
- **Día pico**: Identifica el día de la semana con mayor consumo
- **Bebida favorita**: Identifica la bebida más consumida

### 2. Insights Inteligentes
- **Consistencia**: Analiza la regularidad en el registro de consumos
- **Eficiencia**: Calcula la eficiencia de hidratación
- **Tendencias**: Identifica patrones de aumento/disminución

### 3. Recomendaciones Personalizadas
- Basadas en el nivel de consumo
- Basadas en la eficiencia de hidratación
- Basadas en la consistencia del usuario

### 4. Estadísticas Avanzadas
- Promedios, máximos y mínimos
- Eficiencia de hidratación
- Análisis por bebida
- Comparaciones temporales

## Notas Importantes

1. **Seguridad**: Todos los endpoints requieren autenticación y verificación de usuario premium
2. **Agregación**: Utiliza funciones de agregación de Django ORM para optimizar consultas
3. **Filtros**: Soporte completo para filtros y búsquedas
4. **Ordenamiento**: Múltiples opciones de ordenamiento
5. **Paginación**: Historial paginado para grandes volúmenes de datos
6. **Rendimiento**: Consultas optimizadas con select_related
7. **Escalabilidad**: Diseño preparado para grandes volúmenes de datos
8. **Monetización**: Funcionalidades exclusivas para usuarios premium
