@echo off
echo ========================================
echo   Instalador Simple de Dosis vital: Tu aplicación de hidratación personal
echo   Usando SQLite (Recomendado para desarrollo)
echo ========================================
echo.

REM Verificar si existe entorno virtual
if not exist "venv\" (
    echo [1/5] Creando entorno virtual...
    python -m venv venv
    echo Entorno virtual creado exitosamente.
)

echo [2/5] Activando entorno virtual...
call venv\Scripts\activate.bat

echo [3/5] Instalando dependencias (SIN PostgreSQL)...
pip install -r requirements-dev.txt
if errorlevel 1 (
    echo ERROR: No se pudieron instalar las dependencias.
    echo Verifica que tengas Python 3.8+ instalado.
    pause
    exit /b 1
)

echo.
echo [4/5] Configurando base de datos SQLite...
python manage_sqlite.py migrate
if errorlevel 1 (
    echo ERROR: No se pudo configurar la base de datos.
    pause
    exit /b 1
)

echo.
echo [5/5] Creando superusuario...
echo Por favor ingresa:
echo   Usuario: admin
echo   Email: admin@example.com
echo   Contraseña: admin123
python manage_sqlite.py createsuperuser --noinput --username admin --email admin@example.com
if errorlevel 1 (
    echo No se pudo crear superusuario automáticamente.
    echo Ejecuta manualmente: python manage_sqlite.py createsuperuser
)

echo.
echo ========================================
echo   Instalacion completada!
echo ========================================
echo.
echo Para iniciar el servidor:
echo   python manage_sqlite.py runserver
echo.
echo Acceder a:
echo   - Admin: http://127.0.0.1:8000/admin/
echo   - API: http://127.0.0.1:8000/api/docs/
echo.
echo Usuario: admin / Contrasena: admin123
echo.
pause
