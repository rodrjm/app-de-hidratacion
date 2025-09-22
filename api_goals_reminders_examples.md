# API de Metas Fijas y Recordatorios - HydroTracker

Este documento contiene ejemplos detallados de cómo usar la API de metas fijas y recordatorios de HydroTracker.

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

## API de Metas Fijas

### Base URL: `/api/goals/`

### 1. Obtener Meta Fija

**GET /api/goals/**

**Descripción:** Obtiene la meta de hidratación fija del usuario. Para usuarios gratuitos es un valor fijo predefinido, para usuarios premium es personalizable.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/goals/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200) - Usuario Gratuito:**
```json
{
  "meta_ml": 2000,
  "tipo_meta": "fija",
  "descripcion": "Meta fija para usuarios gratuitos",
  "es_personalizable": false,
  "fecha_actualizacion": "2024-01-15T10:30:00Z"
}
```

**Respuesta exitosa (200) - Usuario Premium:**
```json
{
  "meta_ml": 2520,
  "tipo_meta": "personalizada",
  "descripcion": "Meta personalizada basada en tu perfil",
  "es_personalizable": true,
  "fecha_actualizacion": "2024-01-15T10:30:00Z"
}
```

## API de Recordatorios

### Base URL: `/api/recordatorios/`

### 1. Crear Recordatorio

**POST /api/recordatorios/**

**Descripción:** Crea un nuevo recordatorio de hidratación.

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
curl -X POST http://127.0.0.1:8000/api/recordatorios/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hora": "09:00:00",
    "mensaje": "¡Hora de hidratarse! 💧",
    "tipo_recordatorio": "agua",
    "frecuencia": "diario",
    "dias_semana": [0, 1, 2, 3, 4],
    "sonido": "default",
    "vibracion": true
  }'
```

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "usuario": "juan_perez",
  "hora": "09:00:00",
  "mensaje": "¡Hora de hidratarse! 💧",
  "mensaje_completo": "¡Hora de hidratarse! 💧",
  "activo": true,
  "dias_semana": [0, 1, 2, 3, 4],
  "dias_semana_display": "Lunes, Martes, Miércoles, Jueves, Viernes",
  "tipo_recordatorio": "agua",
  "frecuencia": "diario",
  "sonido": "default",
  "vibracion": true,
  "fecha_creacion": "2024-01-15T10:30:00Z",
  "fecha_actualizacion": "2024-01-15T10:30:00Z",
  "ultimo_enviado": null,
  "proximo_envio": "2024-01-16T09:00:00Z"
}
```

### 2. Listar Recordatorios

**GET /api/recordatorios/**

**Descripción:** Lista todos los recordatorios del usuario.

**Parámetros de consulta:**
- `activo`: Filtrar por estado activo (true/false)
- `tipo_recordatorio`: Filtrar por tipo
- `frecuencia`: Filtrar por frecuencia
- `search`: Búsqueda en mensaje
- `ordering`: Ordenar por campo

**Ejemplos de consultas:**

```bash
# Listar todos los recordatorios
curl -X GET http://127.0.0.1:8000/api/recordatorios/ \
  -H "Authorization: Bearer <token>"

# Solo recordatorios activos
curl -X GET "http://127.0.0.1:8000/api/recordatorios/?activo=true" \
  -H "Authorization: Bearer <token>"

# Filtrar por tipo
curl -X GET "http://127.0.0.1:8000/api/recordatorios/?tipo_recordatorio=agua" \
  -H "Authorization: Bearer <token>"

# Ordenar por hora
curl -X GET "http://127.0.0.1:8000/api/recordatorios/?ordering=hora" \
  -H "Authorization: Bearer <token>"
```

### 3. Obtener Recordatorio Específico

**GET /api/recordatorios/{id}/**

```bash
curl -X GET http://127.0.0.1:8000/api/recordatorios/1/ \
  -H "Authorization: Bearer <token>"
```

### 4. Actualizar Recordatorio

**PUT/PATCH /api/recordatorios/{id}/**

```bash
curl -X PATCH http://127.0.0.1:8000/api/recordatorios/1/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mensaje": "¡Actualizado! Hora de beber agua 💧",
    "vibracion": false
  }'
```

### 5. Eliminar Recordatorio

**DELETE /api/recordatorios/{id}/**

```bash
curl -X DELETE http://127.0.0.1:8000/api/recordatorios/1/ \
  -H "Authorization: Bearer <token>"
```

### 6. Endpoints Especiales

#### Recordatorios Activos
**GET /api/recordatorios/activos/**

```bash
curl -X GET http://127.0.0.1:8000/api/recordatorios/activos/ \
  -H "Authorization: Bearer <token>"
```

#### Próximos Recordatorios
**GET /api/recordatorios/proximos/**

```bash
curl -X GET http://127.0.0.1:8000/api/recordatorios/proximos/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "hora": "09:00:00",
    "mensaje": "¡Hora de hidratarse! 💧",
    "tipo_recordatorio": "agua",
    "proximo_envio": "2024-01-16T09:00:00Z",
    "dias_semana": [0, 1, 2, 3, 4]
  }
]
```

#### Estadísticas de Recordatorios
**GET /api/recordatorios/stats/**

```bash
curl -X GET http://127.0.0.1:8000/api/recordatorios/stats/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
{
  "total_recordatorios": 5,
  "recordatorios_activos": 4,
  "recordatorios_inactivos": 1,
  "proximos_recordatorios": [
    {
      "id": 1,
      "hora": "09:00:00",
      "mensaje": "¡Hora de hidratarse! 💧",
      "proximo_envio": "2024-01-16T09:00:00Z"
    }
  ],
  "recordatorios_por_tipo": {
    "agua": 3,
    "meta": 1,
    "personalizado": 1
  },
  "recordatorios_por_frecuencia": {
    "diario": 4,
    "dias_laborales": 1
  }
}
```

#### Alternar Estado Activo
**POST /api/recordatorios/{id}/toggle_active/**

```bash
curl -X POST http://127.0.0.1:8000/api/recordatorios/1/toggle_active/ \
  -H "Authorization: Bearer <token>"
```

#### Marcar como Enviado
**POST /api/recordatorios/{id}/marcar_enviado/**

```bash
curl -X POST http://127.0.0.1:8000/api/recordatorios/1/marcar_enviado/ \
  -H "Authorization: Bearer <token>"
```

#### Creación Rápida
**POST /api/recordatorios/crear_rapido/**

```bash
curl -X POST http://127.0.0.1:8000/api/recordatorios/crear_rapido/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hora": "15:30:00"
  }'
```

## Configuración de Metas

### Variables de Entorno

Puedes configurar las metas fijas mediante variables de entorno:

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

## Tipos de Recordatorios

### 1. Recordatorio de Agua
- **Tipo:** `agua`
- **Propósito:** Recordar beber agua
- **Mensaje por defecto:** "💧 ¡Hora de hidratarse! Recuerda beber agua."

### 2. Recordatorio de Meta
- **Tipo:** `meta`
- **Propósito:** Recordar la meta diaria
- **Mensaje por defecto:** "🎯 ¡No olvides tu meta diaria de hidratación!"

### 3. Recordatorio Personalizado
- **Tipo:** `personalizado`
- **Propósito:** Mensaje personalizado
- **Mensaje por defecto:** "⏰ Recordatorio personalizado"

## Frecuencias de Recordatorios

### 1. Diario
- **Frecuencia:** `diario`
- **Días:** Todos los días de la semana
- **Uso:** Recordatorios que se repiten diariamente

### 2. Días Laborales
- **Frecuencia:** `dias_laborales`
- **Días:** Lunes a Viernes (0-4)
- **Uso:** Recordatorios solo en días de trabajo

### 3. Fines de Semana
- **Frecuencia:** `fines_semana`
- **Días:** Sábado y Domingo (5-6)
- **Uso:** Recordatorios solo en fines de semana

### 4. Personalizado
- **Frecuencia:** `personalizado`
- **Días:** Configurables por el usuario
- **Uso:** Días específicos seleccionados por el usuario

## Días de la Semana

Los días se representan como números:
- `0`: Lunes
- `1`: Martes
- `2`: Miércoles
- `3`: Jueves
- `4`: Viernes
- `5`: Sábado
- `6`: Domingo

**Ejemplo:**
```json
{
  "dias_semana": [0, 1, 2, 3, 4]  // Lunes a Viernes
}
```

## Validaciones y Restricciones

### Recordatorios
- **Hora:** Formato HH:MM:SS válido
- **Mensaje:** Máximo 200 caracteres
- **Días de la semana:** Números entre 0 y 6
- **Unicidad:** No puede haber duplicados de hora y tipo para el mismo usuario
- **Límites:** Usuarios gratuitos tienen límite de recordatorios

### Metas
- **Meta fija:** Valor predefinido para usuarios gratuitos
- **Meta personalizada:** Solo para usuarios premium
- **Configuración:** Centralizada en settings.py

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Recurso eliminado exitosamente
- `400 Bad Request`: Error en los datos enviados
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: No autorizado
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error interno del servidor

## Manejo de Errores

### Ejemplo de error de validación (400):
```json
{
  "hora": [
    "Ya tienes un recordatorio a esta hora con el mismo tipo."
  ],
  "dias_semana": [
    "Día inválido: 7. Debe ser un número entre 0 y 6."
  ]
}
```

### Ejemplo de error de límite (400):
```json
{
  "error": "Has alcanzado el límite máximo de recordatorios para tu plan"
}
```

## Ejemplos de Integración

### JavaScript/Fetch
```javascript
// Crear un recordatorio
const response = await fetch('/api/recordatorios/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    hora: '09:00:00',
    mensaje: '¡Hora de hidratarse! 💧',
    tipo_recordatorio: 'agua',
    frecuencia: 'diario',
    dias_semana: [0, 1, 2, 3, 4]
  })
});

const recordatorio = await response.json();
```

### Python/Requests
```python
import requests

# Obtener meta fija
response = requests.get(
    'http://127.0.0.1:8000/api/goals/',
    headers={'Authorization': f'Bearer {token}'}
)

meta = response.json()
print(f"Meta: {meta['meta_ml']}ml")

# Crear recordatorio
response = requests.post(
    'http://127.0.0.1:8000/api/recordatorios/',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'hora': '09:00:00',
        'mensaje': '¡Hora de hidratarse! 💧',
        'tipo_recordatorio': 'agua',
        'frecuencia': 'diario'
    }
)

recordatorio = response.json()
```

## Notas Importantes

1. **Seguridad**: Todos los endpoints requieren autenticación JWT
2. **Propiedad de Datos**: Los usuarios solo pueden acceder a sus propios recordatorios
3. **Límites**: Los usuarios gratuitos tienen límite de recordatorios
4. **Validación**: Validación robusta de horas, días y mensajes
5. **Cálculos Automáticos**: Próximo envío calculado automáticamente
6. **Filtros**: Filtros potentes para consultas específicas
7. **Paginación**: Todas las listas están paginadas
8. **Configuración**: Metas fijas configurables desde settings
