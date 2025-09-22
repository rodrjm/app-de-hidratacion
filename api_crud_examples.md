# API CRUD de HydroTracker - Ejemplos de Uso

Este documento contiene ejemplos detallados de cómo usar la API CRUD para Consumos y Recipientes de HydroTracker.

## Configuración Inicial

### 1. Autenticación
Todos los endpoints requieren autenticación JWT. Obtén un token de acceso:

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

## API de Consumos

### Base URL: `/api/consumos/`

### 1. Crear Consumo

**POST /api/consumos/**

**Datos requeridos:**
- `bebida`: ID de la bebida
- `cantidad_ml`: Cantidad en mililitros

**Datos opcionales:**
- `recipiente`: ID del recipiente
- `fecha_hora`: Fecha y hora del consumo (por defecto: ahora)
- `notas`: Notas adicionales
- `ubicacion`: Ubicación del consumo
- `temperatura_ambiente`: Temperatura en °C
- `nivel_sed`: Nivel de sed (1-5)
- `estado_animo`: Estado de ánimo

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/consumos/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bebida": 1,
    "recipiente": 1,
    "cantidad_ml": 250,
    "fecha_hora": "2024-01-15T14:30:00Z",
    "notas": "Agua después del ejercicio",
    "ubicacion": "Gimnasio",
    "nivel_sed": 4,
    "estado_animo": "bueno"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "usuario": "juan_perez",
  "bebida": 1,
  "bebida_nombre": "Agua",
  "recipiente": 1,
  "recipiente_nombre": "Botella grande",
  "cantidad_ml": 250,
  "cantidad_hidratacion_efectiva": 250,
  "hidratacion_efectiva_porcentaje": 100.0,
  "fecha_hora": "2024-01-15T14:30:00Z",
  "notas": "Agua después del ejercicio",
  "ubicacion": "Gimnasio",
  "temperatura_ambiente": null,
  "nivel_sed": 4,
  "estado_animo": "bueno",
  "fecha_creacion": "2024-01-15T14:30:00Z",
  "meta_diaria_progreso": {
    "meta_ml": 2520,
    "consumido_ml": 500,
    "hidratacion_efectiva_ml": 500,
    "progreso_porcentaje": 19.8,
    "completada": false
  }
}
```

### 2. Listar Consumos

**GET /api/consumos/**

**Parámetros de consulta:**
- `date`: Filtrar por fecha específica (YYYY-MM-DD)
- `fecha_inicio`: Fecha de inicio del rango
- `fecha_fin`: Fecha de fin del rango
- `bebida`: Filtrar por ID de bebida
- `recipiente`: Filtrar por ID de recipiente
- `nivel_sed`: Filtrar por nivel de sed
- `estado_animo`: Filtrar por estado de ánimo
- `search`: Búsqueda en notas, ubicación, nombre de bebida/recipiente
- `ordering`: Ordenar por campo (ej: `-fecha_hora`, `cantidad_ml`)

**Ejemplos de consultas:**

```bash
# Listar todos los consumos
curl -X GET http://127.0.0.1:8000/api/consumos/ \
  -H "Authorization: Bearer <token>"

# Filtrar por fecha específica
curl -X GET "http://127.0.0.1:8000/api/consumos/?date=2024-01-15" \
  -H "Authorization: Bearer <token>"

# Filtrar por rango de fechas
curl -X GET "http://127.0.0.1:8000/api/consumos/?fecha_inicio=2024-01-01&fecha_fin=2024-01-31" \
  -H "Authorization: Bearer <token>"

# Buscar en notas
curl -X GET "http://127.0.0.1:8000/api/consumos/?search=ejercicio" \
  -H "Authorization: Bearer <token>"

# Ordenar por cantidad
curl -X GET "http://127.0.0.1:8000/api/consumos/?ordering=-cantidad_ml" \
  -H "Authorization: Bearer <token>"
```

### 3. Obtener Consumo Específico

**GET /api/consumos/{id}/**

```bash
curl -X GET http://127.0.0.1:8000/api/consumos/1/ \
  -H "Authorization: Bearer <token>"
```

### 4. Actualizar Consumo

**PUT/PATCH /api/consumos/{id}/**

```bash
curl -X PATCH http://127.0.0.1:8000/api/consumos/1/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cantidad_ml": 300,
    "notas": "Consumo actualizado"
  }'
```

### 5. Eliminar Consumo

**DELETE /api/consumos/{id}/**

```bash
curl -X DELETE http://127.0.0.1:8000/api/consumos/1/ \
  -H "Authorization: Bearer <token>"
```

### 6. Endpoints Especiales

#### Consumos de Hoy
**GET /api/consumos/hoy/**

```bash
curl -X GET http://127.0.0.1:8000/api/consumos/hoy/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
{
  "fecha": "2024-01-15",
  "consumos": [...],
  "resumen": {
    "total_ml": 1500,
    "total_hidratacion_ml": 1500,
    "meta_ml": 2520,
    "progreso_porcentaje": 59.5,
    "completada": false,
    "consumos_count": 6
  }
}
```

#### Estadísticas
**GET /api/consumos/stats/**

```bash
curl -X GET "http://127.0.0.1:8000/api/consumos/stats/?fecha_inicio=2024-01-01&fecha_fin=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

#### Agregado Rápido
**POST /api/consumos/quick_add/**

```bash
curl -X POST http://127.0.0.1:8000/api/consumos/quick_add/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cantidad_ml": 200
  }'
```

## API de Recipientes

### Base URL: `/api/recipientes/`

### 1. Crear Recipiente

**POST /api/recipientes/**

**Datos requeridos:**
- `nombre`: Nombre del recipiente
- `cantidad_ml`: Capacidad en mililitros

**Datos opcionales:**
- `color`: Color en hexadecimal (por defecto: #3B82F6)
- `icono`: Nombre del icono (por defecto: bottle)
- `es_favorito`: Marcar como favorito (por defecto: false)

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/recipientes/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Botella deportiva",
    "cantidad_ml": 750,
    "color": "#FF6B6B",
    "icono": "sports_bottle",
    "es_favorito": true
  }'
```

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "usuario": "juan_perez",
  "nombre": "Botella deportiva",
  "cantidad_ml": 750,
  "color": "#FF6B6B",
  "icono": "sports_bottle",
  "es_favorito": true,
  "fecha_creacion": "2024-01-15T14:30:00Z",
  "hidratacion_efectiva_ml": 750
}
```

### 2. Listar Recipientes

**GET /api/recipientes/**

**Parámetros de consulta:**
- `es_favorito`: Filtrar por favoritos (true/false)
- `cantidad_ml`: Filtrar por capacidad
- `search`: Búsqueda en nombre
- `ordering`: Ordenar por campo

**Ejemplos:**

```bash
# Listar todos los recipientes
curl -X GET http://127.0.0.1:8000/api/recipientes/ \
  -H "Authorization: Bearer <token>"

# Solo favoritos
curl -X GET "http://127.0.0.1:8000/api/recipientes/?es_favorito=true" \
  -H "Authorization: Bearer <token>"

# Por capacidad específica
curl -X GET "http://127.0.0.1:8000/api/recipientes/?cantidad_ml=500" \
  -H "Authorization: Bearer <token>"
```

### 3. Endpoints Especiales

#### Favoritos
**GET /api/recipientes/favoritos/**

```bash
curl -X GET http://127.0.0.1:8000/api/recipientes/favoritos/ \
  -H "Authorization: Bearer <token>"
```

#### Por Capacidad
**GET /api/recipientes/por_capacidad/**

```bash
curl -X GET "http://127.0.0.1:8000/api/recipientes/por_capacidad/?capacidad=500" \
  -H "Authorization: Bearer <token>"
```

#### Alternar Favorito
**POST /api/recipientes/{id}/toggle_favorite/**

```bash
curl -X POST http://127.0.0.1:8000/api/recipientes/1/toggle_favorite/ \
  -H "Authorization: Bearer <token>"
```

## API de Bebidas

### Base URL: `/api/bebidas/`

### 1. Listar Bebidas Disponibles

**GET /api/bebidas/**

```bash
curl -X GET http://127.0.0.1:8000/api/bebidas/ \
  -H "Authorization: Bearer <token>"
```

**Parámetros de consulta:**
- `es_agua`: Filtrar solo agua (true/false)
- `activa`: Filtrar solo activas (true/false)
- `factor_hidratacion`: Filtrar por factor
- `search`: Búsqueda en nombre/descripción

### 2. Endpoints Especiales

#### Bebidas Hidratantes
**GET /api/bebidas/hidratantes/**

```bash
curl -X GET http://127.0.0.1:8000/api/bebidas/hidratantes/ \
  -H "Authorization: Bearer <token>"
```

#### Solo Agua
**GET /api/bebidas/agua/**

```bash
curl -X GET http://127.0.0.1:8000/api/bebidas/agua/ \
  -H "Authorization: Bearer <token>"
```

## API de Metas Diarias

### Base URL: `/api/metas-diarias/`

### 1. Listar Metas Diarias

**GET /api/metas-diarias/**

```bash
curl -X GET http://127.0.0.1:8000/api/metas-diarias/ \
  -H "Authorization: Bearer <token>"
```

### 2. Resumen Semanal

**GET /api/metas-diarias/resumen_semanal/**

```bash
curl -X GET http://127.0.0.1:8000/api/metas-diarias/resumen_semanal/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
{
  "periodo": {
    "inicio_semana": "2024-01-15",
    "fin_semana": "2024-01-21"
  },
  "resumen": {
    "total_meta_ml": 17640,
    "total_consumido_ml": 15200,
    "total_hidratacion_efectiva_ml": 15200,
    "dias_completados": 4,
    "dias_totales": 7,
    "promedio_diario_ml": 2171.4,
    "eficiencia_hidratacion": 100.0
  },
  "metas_diarias": [...]
}
```

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Recurso eliminado exitosamente
- `400 Bad Request`: Error en los datos enviados
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: No autorizado
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error interno del servidor

## Validaciones y Restricciones

### Consumos
- `cantidad_ml`: Entre 1 y 5000ml
- `fecha_hora`: No puede ser futura
- `bebida`: Debe estar activa
- `recipiente`: Debe pertenecer al usuario
- `nivel_sed`: Entre 1 y 5
- `estado_animo`: Valores predefinidos

### Recipientes
- `nombre`: Único por usuario
- `cantidad_ml`: Entre 1 y 5000ml
- `color`: Formato hexadecimal válido

## Paginación

Todas las listas están paginadas con 20 elementos por página:

```json
{
  "count": 150,
  "next": "http://127.0.0.1:8000/api/consumos/?page=2",
  "previous": null,
  "results": [...]
}
```

## Filtros Avanzados

### Filtros de Fecha
- `date`: Fecha específica (YYYY-MM-DD)
- `fecha_inicio`: Inicio del rango
- `fecha_fin`: Fin del rango

### Filtros de Búsqueda
- `search`: Busca en múltiples campos
- Campos específicos según el endpoint

### Ordenamiento
- `ordering`: Campo(s) de ordenamiento
- Prefijo `-` para orden descendente
- Múltiples campos separados por coma

## Ejemplos de Integración

### JavaScript/Fetch
```javascript
// Crear un consumo
const response = await fetch('/api/consumos/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bebida: 1,
    cantidad_ml: 250,
    notas: 'Agua después del ejercicio'
  })
});

const consumo = await response.json();
```

### Python/Requests
```python
import requests

# Crear un recipiente
response = requests.post(
    'http://127.0.0.1:8000/api/recipientes/',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'nombre': 'Botella grande',
        'cantidad_ml': 1000,
        'es_favorito': True
    }
)

recipiente = response.json()
```

## Notas Importantes

1. **Seguridad**: Todos los endpoints requieren autenticación JWT
2. **Propiedad de Datos**: Los usuarios solo pueden acceder a sus propios datos
3. **Validación**: Validación robusta en frontend y backend
4. **Cálculos Automáticos**: La hidratación efectiva se calcula automáticamente
5. **Metas Diarias**: Se actualizan automáticamente al crear/modificar consumos
6. **Filtros**: Filtros potentes para consultas específicas
7. **Paginación**: Todas las listas están paginadas para mejor rendimiento
