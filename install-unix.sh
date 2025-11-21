#!/bin/bash

echo "Instalando dependencias para Dosis vital: Tu aplicación de hidratación personal en sistemas Unix/Linux/macOS..."
echo

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 no está instalado"
    echo "Por favor instala Python3 antes de continuar"
    exit 1
fi

# Verificar si pip está instalado
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 no está instalado"
    echo "Por favor instala pip3 antes de continuar"
    exit 1
fi

echo "Instalando dependencias..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo
    echo "✅ Instalación completada exitosamente!"
    echo
    echo "Para continuar:"
    echo "1. Ejecuta: python3 manage.py migrate"
    echo "2. Ejecuta: python3 manage.py runserver"
    echo
else
    echo
    echo "❌ Error durante la instalación"
    echo
    echo "Soluciones posibles:"
    echo "1. Instala PostgreSQL: sudo apt-get install postgresql postgresql-contrib (Ubuntu/Debian)"
    echo "2. Instala PostgreSQL: brew install postgresql (macOS)"
    echo "3. Instala dependencias del sistema: sudo apt-get install python3-dev libpq-dev (Ubuntu/Debian)"
    echo
fi




