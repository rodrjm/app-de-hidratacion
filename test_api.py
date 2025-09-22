#!/usr/bin/env python
"""
Script de prueba para la API de HydroTracker.
Verifica que todos los endpoints funcionen correctamente.
"""

import requests
import json
import sys
from datetime import datetime


class HydroTrackerAPITester:
    """Clase para probar la API de HydroTracker."""
    
    def __init__(self, base_url="http://127.0.0.1:8000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
    
    def test_register(self):
        """Prueba el registro de un nuevo usuario."""
        print("🔄 Probando registro de usuario...")
        
        # Datos de prueba
        user_data = {
            "username": f"test_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@ejemplo.com",
            "password": "test_password123",
            "password_confirm": "test_password123",
            "first_name": "Usuario",
            "last_name": "Prueba",
            "peso": 70,
            "edad": 30,
            "genero": "M",
            "nivel_actividad": "moderado"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/register/",
                json=user_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                data = response.json()
                self.access_token = data["tokens"]["access"]
                self.refresh_token = data["tokens"]["refresh"]
                self.user_id = data["user"]["id"]
                print("✅ Registro exitoso")
                print(f"   Usuario ID: {self.user_id}")
                print(f"   Username: {data['user']['username']}")
                print(f"   Meta calculada: {data['user']['meta_calculada']}ml")
                return True
            else:
                print(f"❌ Error en registro: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error en registro: {e}")
            return False
    
    def test_login(self):
        """Prueba el inicio de sesión."""
        print("🔄 Probando inicio de sesión...")
        
        login_data = {
            "username": "admin",  # Usuario por defecto
            "password": "admin123"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/login/",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access"]
                self.refresh_token = data["refresh"]
                print("✅ Inicio de sesión exitoso")
                print(f"   Usuario: {data['user']['username']}")
                return True
            else:
                print(f"❌ Error en login: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error en login: {e}")
            return False
    
    def test_profile(self):
        """Prueba obtener el perfil del usuario."""
        print("🔄 Probando obtención de perfil...")
        
        if not self.access_token:
            print("❌ No hay token de acceso")
            return False
        
        try:
            response = self.session.get(
                f"{self.base_url}/profile/",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Perfil obtenido exitosamente")
                print(f"   Username: {data['username']}")
                print(f"   Email: {data['email']}")
                print(f"   Meta diaria: {data['meta_diaria_ml']}ml")
                return True
            else:
                print(f"❌ Error obteniendo perfil: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo perfil: {e}")
            return False
    
    def test_update_profile(self):
        """Prueba actualizar el perfil del usuario."""
        print("🔄 Probando actualización de perfil...")
        
        if not self.access_token:
            print("❌ No hay token de acceso")
            return False
        
        update_data = {
            "peso": 75,
            "nivel_actividad": "intenso"
        }
        
        try:
            response = self.session.patch(
                f"{self.base_url}/profile/",
                json=update_data,
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Perfil actualizado exitosamente")
                print(f"   Nuevo peso: {data['peso']}kg")
                print(f"   Nuevo nivel: {data['nivel_actividad']}")
                print(f"   Nueva meta: {data['meta_diaria_ml']}ml")
                return True
            else:
                print(f"❌ Error actualizando perfil: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error actualizando perfil: {e}")
            return False
    
    def test_stats(self):
        """Prueba obtener estadísticas del usuario."""
        print("🔄 Probando obtención de estadísticas...")
        
        if not self.access_token:
            print("❌ No hay token de acceso")
            return False
        
        try:
            response = self.session.get(
                f"{self.base_url}/stats/",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Estadísticas obtenidas exitosamente")
                print(f"   Días registrado: {data['usuario']['dias_registrado']}")
                print(f"   Meta diaria: {data['hidratacion']['meta_diaria_ml']}ml")
                return True
            else:
                print(f"❌ Error obteniendo estadísticas: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
            return False
    
    def test_check_username(self):
        """Prueba verificar disponibilidad de username."""
        print("🔄 Probando verificación de username...")
        
        check_data = {
            "username": "usuario_inexistente_12345"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/check-username/",
                json=check_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Verificación de username exitosa")
                print(f"   Disponible: {data['available']}")
                print(f"   Mensaje: {data['message']}")
                return True
            else:
                print(f"❌ Error verificando username: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error verificando username: {e}")
            return False
    
    def test_check_email(self):
        """Prueba verificar disponibilidad de email."""
        print("🔄 Probando verificación de email...")
        
        check_data = {
            "email": "email_inexistente_12345@ejemplo.com"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/check-email/",
                json=check_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Verificación de email exitosa")
                print(f"   Disponible: {data['available']}")
                print(f"   Mensaje: {data['message']}")
                return True
            else:
                print(f"❌ Error verificando email: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error verificando email: {e}")
            return False
    
    def test_token_refresh(self):
        """Prueba renovar token de acceso."""
        print("🔄 Probando renovación de token...")
        
        if not self.refresh_token:
            print("❌ No hay token de refresh")
            return False
        
        refresh_data = {
            "refresh": self.refresh_token
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/token/refresh/",
                json=refresh_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access"]
                print("✅ Token renovado exitosamente")
                return True
            else:
                print(f"❌ Error renovando token: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error renovando token: {e}")
            return False
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas."""
        print("🚀 Iniciando pruebas de la API HydroTracker...")
        print("=" * 50)
        
        tests = [
            ("Registro de Usuario", self.test_register),
            ("Inicio de Sesión", self.test_login),
            ("Obtener Perfil", self.test_profile),
            ("Actualizar Perfil", self.test_update_profile),
            ("Obtener Estadísticas", self.test_stats),
            ("Verificar Username", self.test_check_username),
            ("Verificar Email", self.test_check_email),
            ("Renovar Token", self.test_token_refresh),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 {test_name}")
            if test_func():
                passed += 1
            print("-" * 30)
        
        print(f"\n📊 Resultados: {passed}/{total} pruebas pasaron")
        
        if passed == total:
            print("🎉 ¡Todas las pruebas pasaron exitosamente!")
            return True
        else:
            print("❌ Algunas pruebas fallaron")
            return False


def main():
    """Función principal."""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://127.0.0.1:8000/api"
    
    tester = HydroTrackerAPITester(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
