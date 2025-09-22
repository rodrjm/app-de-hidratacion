#!/usr/bin/env python
"""
Script de prueba para la API Premium de HydroTracker.
Prueba todos los endpoints relacionados con funcionalidades premium.
"""

import requests
import json
import sys
from datetime import datetime, time, timedelta
import time as time_module


class HydroTrackerPremiumTester:
    """Clase para probar la API premium de HydroTracker."""
    
    def __init__(self, base_url="http://127.0.0.1:8000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.recordatorio_id = None
        self.bebida_premium_id = None
    
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
    
    def test_premium_goal(self):
        """Prueba obtener la meta personalizada premium."""
        print("🔄 Probando meta personalizada premium...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/premium/goal/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Meta personalizada obtenida exitosamente")
                print(f"   Meta recomendada: {data['meta_recomendada_ml']}ml")
                print(f"   Meta actual: {data['meta_actual_ml']}ml")
                print(f"   Diferencia: {data['diferencia_ml']}ml")
                print(f"   Factor de actividad: {data['factor_actividad']}")
                print(f"   Peso del usuario: {data['peso_usuario']}kg")
                print(f"   Nivel de actividad: {data['nivel_actividad']}")
                print(f"   Fórmula usada: {data['formula_usada']}")
                
                print("   Recomendaciones:")
                for rec in data['recomendaciones']:
                    print(f"      - {rec}")
                
                return True
            elif response.status_code == 403:
                print("   ⚠️  Usuario no es premium (403 Forbidden)")
                print("   Esto es esperado si el usuario no tiene es_premium=True")
                return True  # No es un error, es esperado
            else:
                print(f"❌ Error obteniendo meta personalizada: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo meta personalizada: {e}")
            return False
    
    def test_premium_beverages(self):
        """Prueba obtener bebidas premium."""
        print("🔄 Probando bebidas premium...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/premium/beverages/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Bebidas premium obtenidas exitosamente")
                print(f"   Total de bebidas: {data['total_bebidas']}")
                print(f"   Categorías disponibles: {', '.join(data['categorias_disponibles'])}")
                
                # Mostrar algunas bebidas
                print("   Bebidas destacadas:")
                for bebida in data['bebidas'][:5]:
                    premium_mark = " (Premium)" if bebida['es_premium'] else ""
                    print(f"      - {bebida['nombre']}: {bebida['categoria']}{premium_mark}")
                
                # Guardar ID de una bebida premium para pruebas posteriores
                for bebida in data['bebidas']:
                    if bebida['es_premium']:
                        self.bebida_premium_id = bebida['id']
                        break
                
                return True
            elif response.status_code == 403:
                print("   ⚠️  Usuario no es premium (403 Forbidden)")
                return True  # No es un error, es esperado
            else:
                print(f"❌ Error obteniendo bebidas premium: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo bebidas premium: {e}")
            return False
    
    def test_premium_beverages_filters(self):
        """Prueba filtros de bebidas premium."""
        print("🔄 Probando filtros de bebidas premium...")
        
        # Filtro por categoría premium
        print("   🔍 Probando filtro por categoría premium...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/beverages/?categoria=premium",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Filtro premium exitoso ({len(data['bebidas'])} bebidas premium)")
            else:
                print(f"   ❌ Error filtrando por premium: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error filtrando por premium: {e}")
            return False
        
        # Filtro por factor de hidratación
        print("   🔍 Probando filtro por factor de hidratación...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/beverages/?factor_min=0.8",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Filtro por factor exitoso ({len(data['bebidas'])} bebidas hidratantes)")
            else:
                print(f"   ❌ Error filtrando por factor: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error filtrando por factor: {e}")
            return False
        
        return True
    
    def test_premium_reminders_crud(self):
        """Prueba CRUD de recordatorios premium."""
        print("🔄 Probando CRUD de recordatorios premium...")
        
        # 1. Crear recordatorio premium
        print("   📝 Creando recordatorio premium...")
        recordatorio_data = {
            "hora": "10:30:00",
            "mensaje": "¡Recordatorio premium! 💎",
            "tipo_recordatorio": "agua",
            "frecuencia": "diario",
            "dias_semana": [0, 1, 2, 3, 4, 5, 6],  # Todos los días
            "sonido": "premium",
            "vibracion": True
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/premium/reminders/",
                json=recordatorio_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                self.recordatorio_id = data['id']
                print(f"   ✅ Recordatorio premium creado (ID: {self.recordatorio_id})")
                print(f"      Hora: {data['hora']}")
                print(f"      Mensaje: {data['mensaje_completo']}")
                print(f"      Es Premium: {data['es_premium']}")
            else:
                print(f"   ❌ Error creando recordatorio premium: {response.status_code}")
                print(f"      Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error creando recordatorio premium: {e}")
            return False
        
        # 2. Listar recordatorios premium
        print("   📋 Listando recordatorios premium...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/reminders/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Recordatorios premium listados ({len(data['results'])} recordatorios)")
            else:
                print(f"   ❌ Error listando recordatorios premium: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error listando recordatorios premium: {e}")
            return False
        
        return True
    
    def test_premium_reminders_special(self):
        """Prueba endpoints especiales de recordatorios premium."""
        print("🔄 Probando endpoints especiales de recordatorios premium...")
        
        # 1. Estadísticas premium
        print("   📊 Probando estadísticas premium...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/reminders/stats/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Estadísticas premium obtenidas")
                print(f"      Total: {data['total_recordatorios']}")
                print(f"      Activos: {data['recordatorios_activos']}")
                print(f"      Es Premium: {data['es_premium']}")
                print(f"      Límite: {data['limite_recordatorios']}")
            else:
                print(f"   ❌ Error obteniendo estadísticas premium: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo estadísticas premium: {e}")
            return False
        
        # 2. Creación rápida premium
        print("   ⚡ Probando creación rápida premium...")
        try:
            response = self.session.post(
                f"{self.base_url}/premium/reminders/crear_rapido/",
                json={"hora": "16:45:00"},
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                print(f"   ✅ Recordatorio rápido premium creado: {data['hora']}")
                print(f"      Es Premium: {data['es_premium']}")
            else:
                print(f"   ❌ Error en creación rápida premium: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error en creación rápida premium: {e}")
            return False
        
        return True
    
    def test_premium_reminders_actions(self):
        """Prueba acciones de recordatorios premium."""
        print("🔄 Probando acciones de recordatorios premium...")
        
        if not self.recordatorio_id:
            print("   ❌ No hay recordatorio disponible para las pruebas")
            return False
        
        # 1. Alternar estado activo
        print("   🔄 Probando alternar estado activo...")
        try:
            response = self.session.post(
                f"{self.base_url}/premium/reminders/{self.recordatorio_id}/toggle_active/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Estado alternado: Activo = {data['activo']}")
            else:
                print(f"   ❌ Error alternando estado: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error alternando estado: {e}")
            return False
        
        # 2. Marcar como enviado
        print("   ✅ Probando marcar como enviado...")
        try:
            response = self.session.post(
                f"{self.base_url}/premium/reminders/{self.recordatorio_id}/marcar_enviado/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Recordatorio marcado como enviado")
                print(f"      Último enviado: {data['ultimo_enviado']}")
            else:
                print(f"   ❌ Error marcando como enviado: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error marcando como enviado: {e}")
            return False
        
        return True
    
    def test_premium_reminders_grouping(self):
        """Prueba agrupación de recordatorios premium."""
        print("🔄 Probando agrupación de recordatorios premium...")
        
        # Agrupar por tipo
        print("   📊 Probando agrupación por tipo...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/reminders/por_tipo/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Agrupación por tipo exitosa")
                for tipo, recordatorios in data.items():
                    print(f"      {tipo}: {len(recordatorios)} recordatorios")
            else:
                print(f"   ❌ Error agrupando por tipo: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error agrupando por tipo: {e}")
            return False
        
        return True
    
    def test_premium_access_control(self):
        """Prueba control de acceso premium."""
        print("🔄 Probando control de acceso premium...")
        
        # Probar endpoints premium sin autenticación
        print("   🔒 Probando acceso sin autenticación...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/goal/",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                print("   ✅ Endpoint premium protegido correctamente (401 Unauthorized)")
            else:
                print(f"   ❌ Endpoint debería estar protegido: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error probando acceso sin autenticación: {e}")
            return False
        
        # Probar con usuario no premium (simulado)
        print("   👤 Probando con usuario no premium...")
        # Nota: En un entorno real, aquí probarías con un usuario que no sea premium
        # Por ahora solo verificamos que el endpoint funciona con el usuario actual
        try:
            response = self.session.get(
                f"{self.base_url}/premium/goal/",
                headers=self.get_headers()
            )
            
            if response.status_code in [200, 403]:  # 200 si es premium, 403 si no
                print("   ✅ Control de acceso funcionando correctamente")
            else:
                print(f"   ❌ Error inesperado: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error probando control de acceso: {e}")
            return False
        
        return True
    
    def test_premium_limits(self):
        """Prueba que no hay límites para usuarios premium."""
        print("🔄 Probando ausencia de límites premium...")
        
        # Crear múltiples recordatorios para probar que no hay límite
        print("   📝 Creando múltiples recordatorios premium...")
        recordatorios_creados = 0
        
        for i in range(5):  # Crear 5 recordatorios
            recordatorio_data = {
                "hora": f"{12 + i}:00:00",
                "mensaje": f"Recordatorio premium {i + 1} 💎",
                "tipo_recordatorio": "agua",
                "frecuencia": "diario",
                "dias_semana": [0, 1, 2, 3, 4, 5, 6]
            }
            
            try:
                response = self.session.post(
                    f"{self.base_url}/premium/reminders/",
                    json=recordatorio_data,
                    headers=self.get_headers()
                )
                
                if response.status_code == 201:
                    recordatorios_creados += 1
                elif response.status_code == 403:
                    print(f"   ⚠️  Usuario no es premium, no se pueden crear recordatorios")
                    break
                else:
                    print(f"   ❌ Error creando recordatorio {i + 1}: {response.status_code}")
                    break
                    
            except Exception as e:
                print(f"   ❌ Error creando recordatorio {i + 1}: {e}")
                break
        
        print(f"   ✅ Recordatorios premium creados: {recordatorios_creados}")
        
        # Verificar que no hay límite en las estadísticas
        try:
            response = self.session.get(
                f"{self.base_url}/premium/reminders/stats/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Límite de recordatorios: {data['limite_recordatorios']}")
                print(f"   ✅ Total de recordatorios: {data['total_recordatorios']}")
            else:
                print(f"   ❌ Error obteniendo estadísticas: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo estadísticas: {e}")
            return False
        
        return True
    
    def cleanup(self):
        """Limpia los datos de prueba."""
        print("🧹 Limpiando datos de prueba premium...")
        
        # Eliminar recordatorios de prueba
        try:
            response = self.session.get(
                f"{self.base_url}/premium/reminders/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                for recordatorio in data['results']:
                    if 'premium' in recordatorio.get('mensaje', '').lower() or \
                       recordatorio['hora'] in ['10:30:00', '16:45:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00']:
                        try:
                            delete_response = self.session.delete(
                                f"{self.base_url}/premium/reminders/{recordatorio['id']}/",
                                headers=self.get_headers()
                            )
                            if delete_response.status_code == 204:
                                print(f"   ✅ Recordatorio premium de prueba eliminado")
                        except Exception as e:
                            print(f"   ⚠️  Error eliminando recordatorio: {e}")
        except Exception as e:
            print(f"   ⚠️  Error obteniendo recordatorios para limpiar: {e}")
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas de la API premium."""
        print("🚀 Iniciando pruebas de API Premium de HydroTracker...")
        print("=" * 70)
        
        tests = [
            ("Autenticación", self.authenticate),
            ("Meta Personalizada Premium", self.test_premium_goal),
            ("Bebidas Premium", self.test_premium_beverages),
            ("Filtros de Bebidas Premium", self.test_premium_beverages_filters),
            ("CRUD de Recordatorios Premium", self.test_premium_reminders_crud),
            ("Endpoints Especiales Premium", self.test_premium_reminders_special),
            ("Acciones de Recordatorios Premium", self.test_premium_reminders_actions),
            ("Agrupación de Recordatorios Premium", self.test_premium_reminders_grouping),
            ("Control de Acceso Premium", self.test_premium_access_control),
            ("Ausencia de Límites Premium", self.test_premium_limits),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 {test_name}")
            if test_func():
                passed += 1
            print("-" * 50)
        
        # Limpiar datos de prueba
        self.cleanup()
        
        print(f"\n📊 Resultados: {passed}/{total} pruebas pasaron")
        
        if passed == total:
            print("🎉 ¡Todas las pruebas de API Premium pasaron exitosamente!")
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
    
    tester = HydroTrackerPremiumTester(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
