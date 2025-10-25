# Guía de Instalación - HydroTracker

Esta guía te ayudará a instalar HydroTracker en diferentes sistemas operativos.

## 🪟 Windows

### Opción 1: Instalación Automática (Recomendada)
```bash
# Ejecuta el script de instalación
install-windows.bat
```

### Opción 2: Instalación Manual

#### Si tienes PostgreSQL instalado:
```bash
pip install -r requirements.txt
```

#### Si NO tienes PostgreSQL instalado:
```bash
# Instala solo las dependencias básicas
pip install Django==4.2.7
pip install djangorestframework==3.14.0
pip install djangorestframework-simplejwt==5.3.0
pip install django-cors-headers==4.3.1
pip install django-filter==23.3
pip install python-decouple==3.8
```

#### Si quieres usar SQLite en lugar de PostgreSQL:
```bash
# Instala las dependencias básicas
pip install Django==4.2.7 djangorestframework==3.14.0 djangorestframework-simplejwt==5.3.0 django-cors-headers==4.3.1 django-filter==23.3 python-decouple==3.8

# Configura para usar SQLite
python manage.py migrate --settings=hydrotracker.settings_sqlite
python manage.py runserver --settings=hydrotracker.settings_sqlite
```

### Solución para Error de psycopg2-binary

Si obtienes el error "Microsoft Visual C++ 14.0 or greater is required":

1. **Opción A**: Instala Microsoft Visual C++ Build Tools
   - Descarga desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Instala "C++ build tools"
   - Reinicia tu terminal
   - Ejecuta: `pip install -r requirements.txt`

2. **Opción B**: Usa SQLite en lugar de PostgreSQL
   - Sigue las instrucciones de "Si quieres usar SQLite" arriba

3. **Opción C**: Instala PostgreSQL
   - Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
   - Instala PostgreSQL
   - Configura la base de datos
   - Ejecuta: `pip install -r requirements.txt`

## 🐧 Linux/Ubuntu/Debian

### Instalación Automática
```bash
# Hacer ejecutable el script
chmod +x install-unix.sh

# Ejecutar instalación
./install-unix.sh
```

### Instalación Manual
```bash
# Instalar dependencias del sistema
sudo apt-get update
sudo apt-get install python3-dev libpq-dev postgresql postgresql-contrib

# Instalar dependencias de Python
pip3 install -r requirements.txt
```

## 🍎 macOS

### Con Homebrew
```bash
# Instalar PostgreSQL
brew install postgresql
brew services start postgresql

# Instalar dependencias de Python
pip3 install -r requirements.txt
```

### Sin Homebrew
```bash
# Instalar dependencias básicas
pip3 install Django==4.2.7 djangorestframework==3.14.0 djangorestframework-simplejwt==5.3.0 django-cors-headers==4.3.1 django-filter==23.3 python-decouple==3.8

# Usar SQLite
python3 manage.py migrate --settings=hydrotracker.settings_sqlite
python3 manage.py runserver --settings=hydrotracker.settings_sqlite
```

## 🚀 Configuración Inicial

### 1. Configurar Variables de Entorno
```bash
# Copia el archivo de ejemplo
cp env.example .env

# Edita el archivo .env con tus configuraciones
nano .env
```

### 2. Ejecutar Migraciones

#### Con PostgreSQL:
```bash
python manage.py migrate
```

#### Con SQLite:
```bash
python manage.py migrate --settings=hydrotracker.settings_sqlite
```

### 3. Crear Superusuario
```bash
# Con PostgreSQL
python manage.py createsuperuser

# Con SQLite
python manage.py createsuperuser --settings=hydrotracker.settings_sqlite
```

### 4. Ejecutar Servidor

#### Con PostgreSQL:
```bash
python manage.py runserver
```

#### Con SQLite:
```bash
python manage.py runserver --settings=hydrotracker.settings_sqlite
```

## 🔧 Configuración de Base de Datos

### PostgreSQL (Recomendado para Producción)

1. **Instalar PostgreSQL**
2. **Crear base de datos**:
   ```sql
   CREATE DATABASE hydrotracker;
   CREATE USER hydrotracker_user WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE hydrotracker TO hydrotracker_user;
   ```

3. **Configurar .env**:
   ```
   DB_NAME=hydrotracker
   DB_USER=hydrotracker_user
   DB_PASSWORD=tu_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

### SQLite (Recomendado para Desarrollo)

1. **No requiere instalación adicional**
2. **Usar configuración SQLite**:
   ```bash
   python manage.py migrate --settings=hydrotracker.settings_sqlite
   python manage.py runserver --settings=hydrotracker.settings_sqlite
   ```

## 🧪 Verificar Instalación

### 1. Ejecutar Pruebas
```bash
# Con PostgreSQL
python test_goals_reminders_api.py
python test_monetization_api.py
python test_premium_api.py
python test_premium_stats_api.py
python test_no_ads_api.py

# Con SQLite
python test_goals_reminders_api.py --settings=hydrotracker.settings_sqlite
python test_monetization_api.py --settings=hydrotracker.settings_sqlite
python test_premium_api.py --settings=hydrotracker.settings_sqlite
python test_premium_stats_api.py --settings=hydrotracker.settings_sqlite
python test_no_ads_api.py --settings=hydrotracker.settings_sqlite
```

### 2. Verificar Endpoints
```bash
# Verificar que el servidor esté funcionando
curl http://127.0.0.1:8000/api/

# Verificar endpoint de verificación de anuncios
curl -X GET http://127.0.0.1:8000/api/monetization/no-ads/ \
  -H "Authorization: Bearer <token>"
```

## 🆘 Solución de Problemas

### Error: "Microsoft Visual C++ 14.0 or greater is required"
- **Solución**: Instala Microsoft Visual C++ Build Tools
- **Alternativa**: Usa SQLite en lugar de PostgreSQL

### Error: "psycopg2 installation failed"
- **Solución**: Instala PostgreSQL y las dependencias del sistema
- **Alternativa**: Usa SQLite

### Error: "ModuleNotFoundError: No module named 'psycopg2'"
- **Solución**: Instala psycopg2 o usa SQLite
- **Comando**: `pip install psycopg2` o `pip install psycopg2-binary`

### Error: "Database connection failed"
- **Solución**: Verifica la configuración de la base de datos en .env
- **Alternativa**: Usa SQLite para desarrollo

## 📚 Recursos Adicionales

- [Documentación de Django](https://docs.djangoproject.com/)
- [Documentación de Django REST Framework](https://www.django-rest-framework.org/)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación de SQLite](https://www.sqlite.org/docs.html)

## 🤝 Soporte

Si tienes problemas con la instalación:

1. Revisa esta guía
2. Verifica que tienes Python 3.8+ instalado
3. Asegúrate de tener pip actualizado: `pip install --upgrade pip`
4. Prueba con SQLite si PostgreSQL no funciona
5. Revisa los logs de error para más detalles




