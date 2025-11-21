@echo off
echo Instalando dependencias para Dosis vital: Tu aplicación de hidratación personal en Windows...
echo.

echo Opcion 1: Instalar con psycopg2 (requiere PostgreSQL instalado)
echo Opcion 2: Instalar con psycopg2-binary (puede fallar sin Visual C++)
echo Opcion 3: Instalar solo dependencias basicas (sin PostgreSQL)
echo.

set /p choice="Selecciona una opcion (1, 2, o 3): "

if "%choice%"=="1" (
    echo.
    echo Instalando con psycopg2...
    pip install Django==4.2.7
    pip install djangorestframework==3.14.0
    pip install djangorestframework-simplejwt==5.3.0
    pip install django-cors-headers==4.3.1
    pip install django-filter==23.3
    pip install psycopg2==2.9.9
    pip install python-decouple==3.8
    echo.
    echo Instalacion completada con psycopg2
    echo NOTA: Asegurate de tener PostgreSQL instalado en tu sistema
) else if "%choice%"=="2" (
    echo.
    echo Instalando con psycopg2-binary...
    echo NOTA: Si falla, instala Microsoft Visual C++ Build Tools
    echo Descarga desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/
    pip install -r requirements.txt
    echo.
    echo Si la instalacion fallo, ejecuta esta opcion nuevamente despues de instalar Visual C++ Build Tools
) else if "%choice%"=="3" (
    echo.
    echo Instalando solo dependencias basicas...
    pip install Django==4.2.7
    pip install djangorestframework==3.14.0
    pip install djangorestframework-simplejwt==5.3.0
    pip install django-cors-headers==4.3.1
    pip install django-filter==23.3
    pip install python-decouple==3.8
    echo.
    echo Instalacion completada sin PostgreSQL
    echo NOTA: Necesitaras configurar SQLite o instalar PostgreSQL mas tarde
) else (
    echo.
    echo Opcion invalida. Saliendo...
    exit /b 1
)

echo.
echo Instalacion completada!
echo.
echo Para continuar:
echo 1. Ejecuta: python manage.py migrate
echo 2. Ejecuta: python manage.py runserver
echo.
pause




