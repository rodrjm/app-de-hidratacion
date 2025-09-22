# Ejemplos de Uso de la API HydroTracker

Este documento contiene ejemplos prácticos de cómo usar la API de HydroTracker.

## Configuración Inicial

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Configurar base de datos
```bash
# Crear base de datos PostgreSQL
createdb hydrotracker

# Ejecutar migraciones
python manage.py makemigrations
python manage.py migrate
```

### 3. Crear superusuario
```bash
python manage.py createsuperuser
```

### 4. Ejecutar servidor
```bash
python manage.py runserver
```

## Endpoints de la API

### Base URL
```
http://127.0.0.1:8000/api/
```

## 1. Registro de Usuario

### POST /api/register/

**Descripción:** Registra un nuevo usuario en el sistema.

**Datos requeridos:**
- `username`: Nombre de usuario único (mínimo 3 caracteres)
- `email`: Correo electrónico único
- `password`: Contraseña (mínimo 8 caracteres)
- `password_confirm`: Confirmación de contraseña

**Datos opcionales:**
- `first_name`: Nombre
- `last_name`: Apellido
- `peso`: Peso en kg (20-300)
- `edad`: Edad en años (1-120)
- `fecha_nacimiento`: Fecha de nacimiento (YYYY-MM-DD)
- `genero`: Género (M, F, O)
- `nivel_actividad`: Nivel de actividad física
- `meta_diaria_ml`: Meta diaria de hidratación en ml
- `recordar_notificaciones`: Recibir recordatorios (true/false)
- `hora_inicio`: Hora de inicio para recordatorios (HH:MM)
- `hora_fin`: Hora de fin para recordatorios (HH:MM)
- `intervalo_notificaciones`: Intervalo entre recordatorios en minutos

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan_perez",
    "email": "juan@ejemplo.com",
    "password": "mi_password123",
    "password_confirm": "mi_password123",
    "first_name": "Juan",
    "last_name": "Pérez",
    "peso": 70,
    "edad": 30,
    "genero": "M",
    "nivel_actividad": "moderado"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "username": "juan_perez",
    "email": "juan@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "peso": 70,
    "edad": 30,
    "genero": "M",
    "nivel_actividad": "moderado",
    "meta_diaria_ml": 2520,
    "meta_calculada": 2520,
    "es_premium": false,
    "fecha_creacion": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

## 2. Inicio de Sesión

### POST /api/login/

**Descripción:** Autentica un usuario y retorna tokens JWT.

**Datos requeridos:**
- `username`: Nombre de usuario o email
- `password`: Contraseña

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan_perez",
    "password": "mi_password123"
  }'
```

**Respuesta exitosa (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "username": "juan_perez",
    "email": "juan@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "peso": 70,
    "edad": 30,
    "genero": "M",
    "nivel_actividad": "moderado",
    "meta_diaria_ml": 2520,
    "meta_calculada": 2520,
    "es_premium": false,
    "fecha_creacion": "2024-01-15T10:30:00Z",
    "ultimo_acceso": "2024-01-15T10:30:00Z"
  }
}
```

## 3. Obtener Perfil de Usuario

### GET /api/profile/

**Descripción:** Obtiene el perfil del usuario autenticado.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/profile/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "username": "juan_perez",
  "email": "juan@ejemplo.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "nombre_completo": "Juan Pérez",
  "peso": 70,
  "edad": 30,
  "fecha_nacimiento": null,
  "genero": "M",
  "nivel_actividad": "moderado",
  "meta_diaria_ml": 2520,
  "meta_calculada": 2520,
  "recordar_notificaciones": true,
  "hora_inicio": "08:00:00",
  "hora_fin": "22:00:00",
  "intervalo_notificaciones": 60,
  "es_premium": false,
  "fecha_creacion": "2024-01-15T10:30:00Z",
  "fecha_actualizacion": "2024-01-15T10:30:00Z",
  "ultimo_acceso": "2024-01-15T10:30:00Z",
  "es_activo_hoy": true
}
```

## 4. Actualizar Perfil de Usuario

### PATCH /api/profile/

**Descripción:** Actualiza el perfil del usuario autenticado.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Datos opcionales:** Cualquier campo del perfil de usuario

**Ejemplo de solicitud:**
```bash
curl -X PATCH http://127.0.0.1:8000/api/profile/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "peso": 75,
    "nivel_actividad": "intenso"
  }'
```

**Respuesta exitosa (200):**
```json
{
  "message": "Perfil actualizado exitosamente",
  "id": 1,
  "username": "juan_perez",
  "email": "juan@ejemplo.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "peso": 75,
  "edad": 30,
  "genero": "M",
  "nivel_actividad": "intenso",
  "meta_diaria_ml": 2940,
  "meta_calculada": 2940,
  "es_premium": false
}
```

## 5. Cambiar Contraseña

### POST /api/change-password/

**Descripción:** Cambia la contraseña del usuario autenticado.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Datos requeridos:**
- `old_password`: Contraseña actual
- `new_password`: Nueva contraseña
- `new_password_confirm`: Confirmación de nueva contraseña

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/change-password/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "mi_password123",
    "new_password": "nueva_password456",
    "new_password_confirm": "nueva_password456"
  }'
```

**Respuesta exitosa (200):**
```json
{
  "message": "Contraseña cambiada exitosamente"
}
```

## 6. Obtener Estadísticas del Usuario

### GET /api/stats/

**Descripción:** Obtiene estadísticas del usuario autenticado.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/stats/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Respuesta exitosa (200):**
```json
{
  "usuario": {
    "username": "juan_perez",
    "email": "juan@ejemplo.com",
    "fecha_registro": "2024-01-15T10:30:00Z",
    "dias_registrado": 5,
    "es_premium": false,
    "ultimo_acceso": "2024-01-15T10:30:00Z"
  },
  "hidratacion": {
    "meta_diaria_ml": 2520,
    "meta_calculada_ml": 2520,
    "nivel_actividad": "moderado",
    "recordar_notificaciones": true
  },
  "configuracion": {
    "hora_inicio": "08:00:00",
    "hora_fin": "22:00:00",
    "intervalo_notificaciones": 60
  }
}
```

## 7. Verificar Disponibilidad de Username

### POST /api/check-username/

**Descripción:** Verifica si un nombre de usuario está disponible.

**Datos requeridos:**
- `username`: Nombre de usuario a verificar

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/check-username/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nuevo_usuario"
  }'
```

**Respuesta exitosa (200):**
```json
{
  "available": true,
  "message": "Nombre de usuario disponible"
}
```

## 8. Verificar Disponibilidad de Email

### POST /api/check-email/

**Descripción:** Verifica si un correo electrónico está disponible.

**Datos requeridos:**
- `email`: Correo electrónico a verificar

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/check-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@ejemplo.com"
  }'
```

**Respuesta exitosa (200):**
```json
{
  "available": true,
  "message": "Correo electrónico disponible"
}
```

## 9. Renovar Token de Acceso

### POST /api/token/refresh/

**Descripción:** Renueva el token de acceso usando el token de refresh.

**Datos requeridos:**
- `refresh`: Token de refresh

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }'
```

**Respuesta exitosa (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## 10. Cerrar Sesión

### POST /api/logout/

**Descripción:** Cierra la sesión invalidando el token de refresh.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Datos requeridos:**
- `refresh_token`: Token de refresh a invalidar

**Ejemplo de solicitud:**
```bash
curl -X POST http://127.0.0.1:8000/api/logout/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }'
```

**Respuesta exitosa (200):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Error en los datos enviados
- `401 Unauthorized`: No autenticado o credenciales inválidas
- `403 Forbidden`: No autorizado para realizar la acción
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error interno del servidor

## Manejo de Errores

### Ejemplo de error de validación (400):
```json
{
  "username": [
    "Ya existe un usuario con este nombre de usuario."
  ],
  "email": [
    "Ya existe un usuario con este correo electrónico."
  ],
  "password": [
    "Esta contraseña es demasiado común."
  ]
}
```

### Ejemplo de error de autenticación (401):
```json
{
  "detail": "No active account found with the given credentials"
}
```

## Notas Importantes

1. **Tokens JWT**: Los tokens de acceso tienen una duración de 1 hora por defecto. Usa el endpoint de refresh para obtener nuevos tokens.

2. **Validación de Contraseñas**: Las contraseñas deben cumplir con los validadores de Django (mínimo 8 caracteres, no ser común, etc.).

3. **Cálculo Automático de Meta**: Si proporcionas peso, edad y nivel de actividad, la meta de hidratación se calcula automáticamente.

4. **Campos Opcionales**: La mayoría de campos del perfil son opcionales y se pueden actualizar posteriormente.

5. **Seguridad**: Siempre usa HTTPS en producción y mantén los tokens seguros.
