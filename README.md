# 💧 Dosis vital: Tu aplicación de hidratación personal - Sistema de Hidratación Inteligente

![Frontend CI](https://github.com/OWNER/REPO/actions/workflows/frontend-ci.yml/badge.svg)

Una aplicación completa de seguimiento de hidratación con funcionalidades premium, sistema de monetización y análisis avanzado de patrones de consumo.

## 📖 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Testing](#-testing)
- [Documentación](#-documentación)
- [Despliegue](#-despliegue)
- [Contribución](#-contribución)

## 🚀 Instalación

### Requisitos Previos

- **Python**: 3.8 o superior
- **Node.js**: 18.x o superior
- **PostgreSQL**: 12+ (opcional, SQLite para desarrollo)
- **Redis**: 6.0+ (opcional, para caché)

### Instalación Rápida

### Windows
```bash
# Opción 1: Instalación automática
install-windows.bat

# Opción 2: Instalación rápida con Python
python quick-install.py
```

### Linux/macOS
```bash
# Opción 1: Instalación automática
chmod +x install-unix.sh
./install-unix.sh

# Opción 2: Instalación rápida con Python
python3 quick-install.py
```

### Instalación Manual
```bash
# Instalar dependencias básicas
pip install Django==4.2.7 djangorestframework==3.14.0 djangorestframework-simplejwt==5.3.0 django-cors-headers==4.3.1 django-filter==23.3 python-decouple==3.8

# Configurar base de datos
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver
```

## 🔧 Solución de Problemas

### Error: "Microsoft Visual C++ 14.0 or greater is required"

**Solución 1**: Instalar Visual C++ Build Tools
- Descarga desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Instala "C++ build tools"
- Reinicia terminal y ejecuta: `pip install -r requirements.txt`

**Solución 2**: Usar SQLite
```bash
python manage_sqlite.py migrate
python manage_sqlite.py runserver
```

**Solución 3**: Instalar solo dependencias básicas
```bash
pip install Django==4.2.7 djangorestframework==3.14.0 djangorestframework-simplejwt==5.3.0 django-cors-headers==4.3.1 django-filter==23.3 python-decouple==3.8
```

## 📚 Documentación

### Documentación del Proyecto

- **[Análisis Exhaustivo](docs/ANALISIS_EXHAUSTIVO_PROYECTO.md)**: Análisis completo del proyecto
- **[Guía de Instalación](docs/INSTALACION.md)**: Instrucciones detalladas de instalación
- **[Guía de Testing](docs/TESTING_GUIDE.md)**: Cómo escribir y ejecutar tests
- **[Guía de Integración](frontend/INTEGRATION_GUIDE.md)**: Integración frontend-backend

### Documentación de API

La API está documentada con OpenAPI/Swagger:

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **Schema JSON**: `http://localhost:8000/api/schema/`

### Correcciones Aplicadas

- **[Fase 1](docs/FASE1_CORRECCIONES_APLICADAS.md)**: Seguridad Crítica
- **[Fase 2](docs/FASE2_CORRECCIONES_APLICADAS.md)**: Seguridad y Configuración
- **[Fase 3](docs/FASE3_CORRECCIONES_APLICADAS.md)**: Mejoras de Código
- **[Fase 4](docs/FASE4_CORRECCIONES_APLICADAS.md)**: Optimización

## 🎯 Características

### ✅ Funcionalidades Básicas
- **Gestión de Consumos**: Registrar y consultar consumos de hidratación
- **Metas Diarias**: Configurar y seguir metas de hidratación
- **Recordatorios**: Sistema de recordatorios personalizables
- **Bebidas**: Catálogo de bebidas con factores de hidratación
- **Recipientes**: Gestión de recipientes personalizados

### 💎 Funcionalidades Premium
- **Meta Personalizada**: Cálculo basado en peso y actividad
- **Bebidas Premium**: Acceso a catálogo completo
- **Recordatorios Ilimitados**: Sin restricciones de cantidad
- **Estadísticas Avanzadas**: Análisis detallados y tendencias
- **Insights Inteligentes**: Patrones y recomendaciones

### 🔒 Seguridad
- **Autenticación JWT**: Sistema seguro de autenticación
- **Permisos Granulares**: Control de acceso por funcionalidad
- **Validación de Datos**: Validación robusta de entrada
- **Protección CSRF**: Protección contra ataques CSRF

## 🛠️ Tecnologías

- **Backend**: Django 4.2.7 + Django REST Framework
- **Base de Datos**: PostgreSQL (producción) / SQLite (desarrollo)
- **Autenticación**: JWT con djangorestframework-simplejwt
- **Filtros**: django-filter para consultas avanzadas
- **CORS**: django-cors-headers para integración frontend

## 📊 Endpoints Principales

### 🔐 Autenticación
- `POST /api/login/` - Iniciar sesión
- `POST /api/register/` - Registro de usuario
- `POST /api/refresh/` - Renovar token

### 💧 Consumos
- `GET /api/consumos/` - Listar consumos
- `POST /api/consumos/` - Crear consumo
- `GET /api/consumos/{id}/` - Obtener consumo
- `PUT /api/consumos/{id}/` - Actualizar consumo
- `DELETE /api/consumos/{id}/` - Eliminar consumo

### 🎯 Metas y Recordatorios
- `GET /api/goals/` - Meta diaria fija
- `GET /api/recordatorios/` - Listar recordatorios
- `POST /api/recordatorios/` - Crear recordatorio
- `DELETE /api/recordatorios/{id}/` - Eliminar recordatorio

### 💰 Monetización
- `GET /api/monetization/status/` - Estado de suscripción
- `GET /api/monetization/features/` - Funcionalidades premium
- `GET /api/monetization/limits/` - Límites de uso
- `GET /api/monetization/no-ads/` - Verificación de anuncios

### 💎 Premium
- `GET /api/premium/goal/` - Meta personalizada
- `GET /api/premium/beverages/` - Bebidas premium
- `GET /api/premium/stats/history/` - Historial detallado
- `GET /api/premium/stats/summary/` - Estadísticas agregadas
- `GET /api/premium/stats/insights/` - Insights avanzados

## 🧪 Testing

### Backend (Django)

```bash
# Instalar dependencias de testing
pip install pytest pytest-django pytest-cov factory-boy

# Ejecutar todos los tests
cd backend
pytest tests/

# Ejecutar con cobertura
pytest tests/ --cov=users --cov=consumos --cov-report=html

# Ejecutar tests específicos
pytest tests/test_security.py -v
pytest tests/test_views.py -v

# Ejecutar por marcadores
pytest tests/ -m unit
pytest tests/ -m integration
pytest tests/ -m api
```

### Frontend (React/Vite)

```bash
# Ejecutar tests
cd frontend
npm run test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

### Tests de Seguridad

Los tests de seguridad cubren:
- Autenticación y autorización
- Validación de entrada
- Protección contra SQL injection
- Rate limiting
- Permisos premium

```bash
pytest tests/test_security.py -v
```

## 🚀 Despliegue

### Desarrollo

```bash
# Backend
cd backend
python manage.py runserver

# Frontend
cd frontend
npm run dev
```

### Calidad y Accesibilidad

- Lint de a11y (jsx-a11y) y React en `frontend`:
  - `npm run lint` y `npm run lint:fix`
- CI ejecuta type-check, lint, build y Lighthouse (ver workflow `Frontend CI`).
- Presupuestos de rendimiento en `.github/workflows/lh-budgets.json`.

### Producción
```bash
# Configurar variables de entorno
cp env.example .env
# Editar .env con configuraciones de producción

# Ejecutar migraciones
python manage.py migrate

# Recopilar archivos estáticos
python manage.py collectstatic

# Ejecutar con Gunicorn
gunicorn hydrotracker.wsgi:application
```

## 📈 Monitoreo

### Logs
```bash
# Ver logs de Django
tail -f logs/django.log

# Ver logs de errores
tail -f logs/error.log
```

### Métricas
- Tiempo de respuesta de endpoints
- Uso de memoria y CPU
- Errores y excepciones
- Uso de base de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas:

1. Revisa la [Guía de Instalación](INSTALACION.md)
2. Verifica que tienes Python 3.8+ instalado
3. Asegúrate de tener pip actualizado: `pip install --upgrade pip`
4. Prueba con SQLite si PostgreSQL no funciona
5. Revisa los logs de error para más detalles

## 📞 Contacto

- **Proyecto**: Dosis vital: Tu aplicación de hidratación personal
- **Versión**: 1.0.0
- **Autor**: Equipo de Desarrollo
- **Email**: support@hydrotracker.com

---

¡Gracias por usar Dosis vital: Tu aplicación de hidratación personal! 💧