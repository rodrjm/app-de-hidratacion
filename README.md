# HydroTracker API

API REST para la aplicación de seguimiento de hidratación HydroTracker, desarrollada con Django REST Framework.

## Características

- **Autenticación JWT**: Sistema de autenticación seguro con tokens JWT
- **Registro de usuarios**: Creación de cuentas con validación completa
- **Perfil de usuario**: Gestión de datos personales y configuración de hidratación
- **Modelo de datos robusto**: Usuarios, consumos, bebidas, recipientes y metas diarias
- **API RESTful**: Endpoints bien estructurados siguiendo las mejores prácticas

## Instalación

### Requisitos

- Python 3.8+
- PostgreSQL 12+
- pip

### Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd app-de-hidratacion
   ```

2. **Crear entorno virtual**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   # Editar .env con tus configuraciones
   ```

5. **Configurar base de datos**
   ```bash
   # Crear base de datos PostgreSQL
   createdb hydrotracker
   
   # Ejecutar migraciones
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Crear superusuario**
   ```bash
   python manage.py createsuperuser
   ```

7. **Ejecutar servidor**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

### Autenticación

- `POST /api/register/` - Registro de nuevos usuarios
- `POST /api/login/` - Inicio de sesión
- `POST /api/logout/` - Cerrar sesión
- `POST /api/token/refresh/` - Renovar token de acceso

### Perfil de Usuario

- `GET /api/profile/` - Obtener perfil del usuario
- `PATCH /api/profile/` - Actualizar perfil del usuario
- `POST /api/change-password/` - Cambiar contraseña
- `GET /api/stats/` - Obtener estadísticas del usuario

### Validaciones

- `POST /api/check-username/` - Verificar disponibilidad de nombre de usuario
- `POST /api/check-email/` - Verificar disponibilidad de correo electrónico

## Estructura del Proyecto

```
hydrotracker/
├── hydrotracker/          # Configuración principal
│   ├── settings.py        # Configuración de Django
│   ├── urls.py           # URLs principales
│   └── wsgi.py           # Configuración WSGI
├── users/                # App de usuarios
│   ├── models.py         # Modelo User personalizado
│   ├── serializers.py    # Serializers para API
│   ├── views.py          # Vistas de la API
│   ├── urls.py           # URLs de usuarios
│   └── admin.py          # Configuración del admin
├── consumos/             # App de consumos
│   ├── models.py         # Modelos de consumos, bebidas, etc.
│   ├── views.py          # Vistas de consumos
│   ├── urls.py           # URLs de consumos
│   └── admin.py          # Configuración del admin
├── requirements.txt      # Dependencias de Python
├── manage.py            # Script de gestión de Django
└── README.md            # Este archivo
```

## Modelos de Datos

### User (Usuario)
- Campos básicos: username, email, password
- Datos personales: peso, edad, fecha_nacimiento, género
- Configuración de hidratación: meta_diaria_ml, nivel_actividad
- Configuración de notificaciones: recordar_notificaciones, horarios

### Bebida
- Información de bebidas y su factor de hidratación
- Calorías por mililitro
- Clasificación de tipo de bebida

### Recipiente
- Recipientes personalizados del usuario
- Capacidad en mililitros
- Configuración visual (color, icono)

### Consumo
- Registro de consumos de hidratación
- Relación con bebida y recipiente
- Datos adicionales: ubicación, temperatura, nivel de sed

### MetaDiaria
- Metas diarias de hidratación
- Seguimiento de progreso
- Cálculo automático de hidratación efectiva

## Características Técnicas

- **Django 4.2.7**: Framework web robusto
- **Django REST Framework 3.14.0**: API REST completa
- **JWT Authentication**: Autenticación segura sin estado
- **PostgreSQL**: Base de datos relacional robusta
- **Validación completa**: Validación de datos en frontend y backend
- **Documentación automática**: Endpoints bien documentados

## Desarrollo

### Ejecutar tests
```bash
python manage.py test
```

### Crear migraciones
```bash
python manage.py makemigrations
python manage.py migrate
```

### Cargar datos de ejemplo
```bash
python manage.py loaddata fixtures/initial_data.json
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
