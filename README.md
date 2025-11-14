# 💧 HydroTracker - API de Hidratación

![Frontend CI](https://github.com/OWNER/REPO/actions/workflows/frontend-ci.yml/badge.svg)

Una API RESTful completa para el seguimiento de hidratación con funcionalidades premium y sistema de monetización.

## 🚀 Instalación Rápida

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

- Ver carpeta `docs/` en el repositorio

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

## 🧪 Pruebas

```bash
# Ejecutar todas las pruebas
python test_goals_reminders_api.py
python test_monetization_api.py
python test_premium_api.py
python test_premium_stats_api.py
python test_no_ads_api.py

# Con SQLite
python test_no_ads_api.py --settings=hydrotracker.settings_sqlite
```

## 🚀 Despliegue
## ✅ Calidad y Accesibilidad

- Lint de a11y (jsx-a11y) y React en `frontend`:
  - `npm run lint` y `npm run lint:fix`
- CI ejecuta type-check, lint, build y Lighthouse (ver workflow `Frontend CI`).
- Presupuestos de rendimiento en `.github/workflows/lh-budgets.json`.


### Desarrollo
```bash
python manage.py runserver
```

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

- **Proyecto**: HydroTracker
- **Versión**: 1.0.0
- **Autor**: Equipo de Desarrollo
- **Email**: support@hydrotracker.com

---

¡Gracias por usar HydroTracker! 💧