#!/usr/bin/env python
"""
Script de prueba para la API de Verificación de Estado Premium para Anuncios.
Prueba el endpoint simple y rápido para verificar si mostrar anuncios.
"""

import requests
import json
import sys
from datetime import datetime
import time as time_module


class HydroTrackerNoAdsTester:
    """Clase para probar la API de verificación de anuncios de HydroTracker."""
    
    def __init__(self, base_url="http://127.0.0.1:8000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
    
    def authenticate(self):
        """Autentica el usuario para las pruebas."""
        print("🔄 Autenticando usuario...")
        
        # Intentar login con admin
        login_data = {
            "username": "admin",
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
                self.user_id = data["user"]["id"]
                print("✅ Autenticación exitosa")
                return True
            else:
                print(f"❌ Error en autenticación: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error en autenticación: {e}")
            return False
    
    def get_headers(self):
        """Retorna los headers con autenticación."""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def test_no_ads_endpoint(self):
        """Prueba el endpoint de verificación de anuncios."""
        print("🔄 Probando endpoint de verificación de anuncios...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/no-ads/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Endpoint de verificación de anuncios funcionando")
                print(f"   Respuesta: {data}")
                
                # Verificar estructura de respuesta
                if 'is_premium' in data:
                    print(f"   Estado premium: {data['is_premium']}")
                    print("   ✅ Estructura de respuesta correcta")
                else:
                    print("   ❌ Campo 'is_premium' no encontrado en la respuesta")
                    return False
                
                # Verificar que solo hay un campo
                if len(data) == 1:
                    print("   ✅ Respuesta minimalista (solo un campo)")
                else:
                    print(f"   ⚠️  Respuesta contiene {len(data)} campos (esperado: 1)")
                
                return True
            else:
                print(f"❌ Error en endpoint de verificación: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error en endpoint de verificación: {e}")
            return False
    
    def test_no_ads_performance(self):
        """Prueba el rendimiento del endpoint de verificación."""
        print("🔄 Probando rendimiento del endpoint...")
        
        # Realizar múltiples solicitudes para medir rendimiento
        num_requests = 10
        start_time = time_module.time()
        
        try:
            for i in range(num_requests):
                response = self.session.get(
                    f"{self.base_url}/monetization/no-ads/",
                    headers=self.get_headers()
                )
                
                if response.status_code != 200:
                    print(f"   ❌ Error en solicitud {i+1}: {response.status_code}")
                    return False
            
            end_time = time_module.time()
            total_time = end_time - start_time
            avg_time = total_time / num_requests
            
            print(f"   ✅ {num_requests} solicitudes completadas en {total_time:.2f} segundos")
            print(f"   ✅ Tiempo promedio por solicitud: {avg_time:.3f} segundos")
            
            if avg_time < 0.1:  # Menos de 100ms por solicitud
                print("   ✅ Rendimiento excelente (< 100ms por solicitud)")
            elif avg_time < 0.5:  # Menos de 500ms por solicitud
                print("   ✅ Rendimiento bueno (< 500ms por solicitud)")
            else:
                print("   ⚠️  Rendimiento podría mejorarse (> 500ms por solicitud)")
            
            return True
            
        except Exception as e:
            print(f"   ❌ Error en prueba de rendimiento: {e}")
            return False
    
    def test_no_ads_unauthorized(self):
        """Prueba el endpoint sin autenticación."""
        print("🔄 Probando endpoint sin autenticación...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/no-ads/",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                print("   ✅ Endpoint protegido correctamente (401 Unauthorized)")
                return True
            else:
                print(f"   ❌ Endpoint debería estar protegido: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error probando sin autenticación: {e}")
            return False
    
    def test_no_ads_response_format(self):
        """Prueba el formato de respuesta del endpoint."""
        print("🔄 Probando formato de respuesta...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/no-ads/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verificar que es un diccionario
                if not isinstance(data, dict):
                    print("   ❌ Respuesta no es un diccionario")
                    return False
                
                # Verificar que tiene exactamente un campo
                if len(data) != 1:
                    print(f"   ❌ Respuesta tiene {len(data)} campos, esperado: 1")
                    return False
                
                # Verificar que el campo es 'is_premium'
                if 'is_premium' not in data:
                    print("   ❌ Campo 'is_premium' no encontrado")
                    return False
                
                # Verificar que el valor es booleano
                if not isinstance(data['is_premium'], bool):
                    print(f"   ❌ Valor de 'is_premium' no es booleano: {type(data['is_premium'])}")
                    return False
                
                print("   ✅ Formato de respuesta correcto")
                print(f"   ✅ Campo 'is_premium': {data['is_premium']} ({type(data['is_premium']).__name__})")
                
                return True
            else:
                print(f"   ❌ Error obteniendo respuesta: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error probando formato: {e}")
            return False
    
    def test_no_ads_caching_headers(self):
        """Prueba si el endpoint incluye headers de caché."""
        print("🔄 Probando headers de caché...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/no-ads/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                # Verificar headers de caché
                cache_control = response.headers.get('Cache-Control')
                expires = response.headers.get('Expires')
                
                if cache_control:
                    print(f"   ✅ Cache-Control: {cache_control}")
                else:
                    print("   ⚠️  No se encontró header Cache-Control")
                
                if expires:
                    print(f"   ✅ Expires: {expires}")
                else:
                    print("   ⚠️  No se encontró header Expires")
                
                # Verificar content-type
                content_type = response.headers.get('Content-Type')
                if content_type and 'application/json' in content_type:
                    print("   ✅ Content-Type correcto")
                else:
                    print(f"   ⚠️  Content-Type: {content_type}")
                
                return True
            else:
                print(f"   ❌ Error obteniendo headers: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error probando headers: {e}")
            return False
    
    def test_no_ads_different_users(self):
        """Prueba el endpoint con diferentes usuarios (simulado)."""
        print("🔄 Probando con diferentes estados de usuario...")
        
        # Nota: En un entorno real, aquí probarías con diferentes usuarios
        # Por ahora solo verificamos que el endpoint funciona con el usuario actual
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/no-ads/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Usuario actual - is_premium: {data['is_premium']}")
                
                # En un entorno real, aquí probarías con:
                # - Usuario premium (is_premium=True)
                # - Usuario gratuito (is_premium=False)
                # - Usuario no autenticado (401)
                
                print("   ℹ️  Para probar completamente, necesitarías usuarios con diferentes estados premium")
                
                return True
            else:
                print(f"   ❌ Error con usuario actual: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error probando diferentes usuarios: {e}")
            return False
    
    def test_no_ads_integration(self):
        """Prueba la integración con otros endpoints de monetización."""
        print("🔄 Probando integración con otros endpoints...")
        
        # Probar endpoint de estado de suscripción
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/status/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                status_data = response.json()
                print("   ✅ Endpoint de estado de suscripción funcionando")
                
                # Comparar con endpoint no-ads
                no_ads_response = self.session.get(
                    f"{self.base_url}/monetization/no-ads/",
                    headers=self.get_headers()
                )
                
                if no_ads_response.status_code == 200:
                    no_ads_data = no_ads_response.json()
                    
                    # Verificar consistencia
                    if status_data.get('is_premium') == no_ads_data.get('is_premium'):
                        print("   ✅ Consistencia entre endpoints verificada")
                    else:
                        print("   ❌ Inconsistencia entre endpoints")
                        print(f"      Status: {status_data.get('is_premium')}")
                        print(f"      No-ads: {no_ads_data.get('is_premium')}")
                        return False
                else:
                    print("   ❌ Error obteniendo endpoint no-ads para comparación")
                    return False
            else:
                print("   ⚠️  Endpoint de estado de suscripción no disponible")
            
            return True
            
        except Exception as e:
            print(f"   ❌ Error probando integración: {e}")
            return False
    
    def test_no_ads_error_handling(self):
        """Prueba el manejo de errores del endpoint."""
        print("🔄 Probando manejo de errores...")
        
        # Probar con token inválido
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/no-ads/",
                headers={"Authorization": "Bearer invalid_token"}
            )
            
            if response.status_code == 401:
                print("   ✅ Token inválido manejado correctamente (401)")
            else:
                print(f"   ⚠️  Respuesta inesperada para token inválido: {response.status_code}")
            
        except Exception as e:
            print(f"   ❌ Error probando token inválido: {e}")
            return False
        
        # Probar con token expirado (simulado)
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/no-ads/",
                headers={"Authorization": "Bearer expired_token"}
            )
            
            if response.status_code == 401:
                print("   ✅ Token expirado manejado correctamente (401)")
            else:
                print(f"   ⚠️  Respuesta inesperada para token expirado: {response.status_code}")
            
        except Exception as e:
            print(f"   ❌ Error probando token expirado: {e}")
            return False
        
        return True
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas de la API de verificación de anuncios."""
        print("🚀 Iniciando pruebas de API de Verificación de Anuncios de HydroTracker...")
        print("=" * 70)
        
        tests = [
            ("Autenticación", self.authenticate),
            ("Endpoint de Verificación", self.test_no_ads_endpoint),
            ("Formato de Respuesta", self.test_no_ads_response_format),
            ("Rendimiento", self.test_no_ads_performance),
            ("Protección de Acceso", self.test_no_ads_unauthorized),
            ("Headers de Caché", self.test_no_ads_caching_headers),
            ("Diferentes Usuarios", self.test_no_ads_different_users),
            ("Integración", self.test_no_ads_integration),
            ("Manejo de Errores", self.test_no_ads_error_handling),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 {test_name}")
            if test_func():
                passed += 1
            print("-" * 50)
        
        print(f"\n📊 Resultados: {passed}/{total} pruebas pasaron")
        
        if passed == total:
            print("🎉 ¡Todas las pruebas de API de Verificación de Anuncios pasaron exitosamente!")
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
    
    tester = HydroTrackerNoAdsTester(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
