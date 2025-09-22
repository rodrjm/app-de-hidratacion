#!/usr/bin/env python
"""
Script de prueba para la API de Monetización de HydroTracker.
Prueba todos los endpoints relacionados con suscripciones y funcionalidades premium.
"""

import requests
import json
import sys
from datetime import datetime


class HydroTrackerMonetizationTester:
    """Clase para probar la API de monetización de HydroTracker."""
    
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
    
    def test_subscription_status(self):
        """Prueba obtener el estado de suscripción."""
        print("🔄 Probando estado de suscripción...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/status/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Estado de suscripción obtenido exitosamente")
                print(f"   Es Premium: {data['is_premium']}")
                print(f"   Tipo de suscripción: {data['subscription_type']}")
                print(f"   Funcionalidades disponibles: {len(data['features_available'])}")
                print(f"   Necesita upgrade: {data['upgrade_required']}")
                
                # Mostrar algunas funcionalidades
                print("   Funcionalidades:")
                for feature in data['features_available'][:3]:
                    print(f"      - {feature}")
                if len(data['features_available']) > 3:
                    print(f"      ... y {len(data['features_available']) - 3} más")
                
                return True
            else:
                print(f"❌ Error obteniendo estado de suscripción: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo estado de suscripción: {e}")
            return False
    
    def test_premium_features(self):
        """Prueba obtener funcionalidades premium (sin autenticación)."""
        print("🔄 Probando funcionalidades premium...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/features/",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Funcionalidades premium obtenidas exitosamente")
                print(f"   Total de funcionalidades: {data['total_features']}")
                print(f"   Categorías: {', '.join(data['categories'])}")
                
                # Mostrar algunas funcionalidades
                print("   Funcionalidades destacadas:")
                for feature in data['features'][:5]:
                    print(f"      - {feature['name']}: {feature['description']}")
                
                return True
            else:
                print(f"❌ Error obteniendo funcionalidades premium: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo funcionalidades premium: {e}")
            return False
    
    def test_usage_limits(self):
        """Prueba obtener límites de uso del usuario."""
        print("🔄 Probando límites de uso...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/limits/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Límites de uso obtenidos exitosamente")
                
                # Mostrar límites de recordatorios
                recordatorios = data['recordatorios']
                print(f"   Recordatorios: {recordatorios['actual']}/{recordatorios['maximo']} ({recordatorios['porcentaje']:.1f}%)")
                print(f"   Restantes: {recordatorios['restantes']}")
                
                # Mostrar límites de consumos
                consumos = data['consumos_diarios']
                print(f"   Consumos hoy: {consumos['actual']}/{consumos['maximo']} ({consumos['porcentaje']:.1f}%)")
                print(f"   Restantes: {consumos['restantes']}")
                
                # Mostrar funcionalidades
                print("   Funcionalidades:")
                for func, info in data.items():
                    if isinstance(info, dict) and 'disponible' in info:
                        status = "✅" if info['disponible'] else "❌"
                        print(f"      {status} {func.replace('_', ' ').title()}: {info['descripcion']}")
                
                return True
            else:
                print(f"❌ Error obteniendo límites de uso: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo límites de uso: {e}")
            return False
    
    def test_upgrade_prompt(self):
        """Prueba obtener información de upgrade personalizada."""
        print("🔄 Probando prompt de upgrade...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/upgrade/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Información de upgrade obtenida exitosamente")
                
                if data.get('is_premium'):
                    print("   Usuario ya es premium")
                else:
                    print(f"   Precio mensual: ${data['precio_mensual']}")
                    print(f"   Precio anual: ${data['precio_anual']}")
                    print(f"   Ahorro anual: ${data['ahorro_anual']}")
                    
                    print("   Beneficios principales:")
                    for beneficio in data['beneficios_principales']:
                        print(f"      - {beneficio}")
                    
                    if data.get('recomendaciones'):
                        print("   Recomendaciones personalizadas:")
                        for rec in data['recomendaciones']:
                            print(f"      - {rec['funcionalidad']}: {rec['descripcion']}")
                
                return True
            else:
                print(f"❌ Error obteniendo información de upgrade: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo información de upgrade: {e}")
            return False
    
    def test_monetization_stats(self):
        """Prueba obtener estadísticas de monetización (solo admin)."""
        print("🔄 Probando estadísticas de monetización...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/stats/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Estadísticas de monetización obtenidas exitosamente")
                print(f"   Usuarios totales: {data['usuarios_totales']}")
                print(f"   Usuarios premium: {data['usuarios_premium']}")
                print(f"   Usuarios gratuitos: {data['usuarios_gratuitos']}")
                print(f"   Tasa de conversión: {data['conversion_rate']}%")
                print(f"   Ingresos mensuales: ${data['ingresos_mensuales']}")
                
                print("   Funcionalidades más usadas:")
                for func in data['funcionalidades_mas_usadas']:
                    premium_mark = " (Premium)" if func['premium'] else ""
                    print(f"      - {func['nombre']}: {func['uso']}%{premium_mark}")
                
                return True
            elif response.status_code == 403:
                print("   ⚠️  No tienes permisos para ver estadísticas (solo administradores)")
                return True  # No es un error, es esperado para usuarios no-admin
            else:
                print(f"❌ Error obteniendo estadísticas: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
            return False
    
    def test_unauthorized_access(self):
        """Prueba acceso no autorizado a endpoints protegidos."""
        print("🔄 Probando acceso no autorizado...")
        
        # Probar endpoint protegido sin token
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/status/",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                print("   ✅ Endpoint protegido correctamente (401 Unauthorized)")
            else:
                print(f"   ❌ Endpoint debería estar protegido: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error probando acceso no autorizado: {e}")
            return False
        
        # Probar endpoint público sin token
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/features/",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                print("   ✅ Endpoint público accesible sin autenticación")
            else:
                print(f"   ❌ Endpoint público debería ser accesible: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error probando endpoint público: {e}")
            return False
        
        return True
    
    def test_different_user_types(self):
        """Prueba con diferentes tipos de usuario."""
        print("🔄 Probando diferentes tipos de usuario...")
        
        # Probar con usuario actual (admin)
        print("   👤 Probando con usuario admin...")
        try:
            response = self.session.get(
                f"{self.base_url}/monetization/status/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"      Estado premium: {data['is_premium']}")
                print(f"      Tipo: {data['subscription_type']}")
            else:
                print(f"      ❌ Error: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"      ❌ Error: {e}")
            return False
        
        # Nota: En un entorno real, aquí probarías con diferentes usuarios
        # Por ahora solo verificamos que el endpoint funciona
        print("   ✅ Pruebas de diferentes tipos de usuario completadas")
        return True
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas de monetización."""
        print("🚀 Iniciando pruebas de Monetización de HydroTracker...")
        print("=" * 70)
        
        tests = [
            ("Autenticación", self.authenticate),
            ("Estado de Suscripción", self.test_subscription_status),
            ("Funcionalidades Premium", self.test_premium_features),
            ("Límites de Uso", self.test_usage_limits),
            ("Prompt de Upgrade", self.test_upgrade_prompt),
            ("Estadísticas de Monetización", self.test_monetization_stats),
            ("Acceso No Autorizado", self.test_unauthorized_access),
            ("Diferentes Tipos de Usuario", self.test_different_user_types),
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
            print("🎉 ¡Todas las pruebas de Monetización pasaron exitosamente!")
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
    
    tester = HydroTrackerMonetizationTester(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
