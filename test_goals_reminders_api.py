#!/usr/bin/env python
"""
Script de prueba para la API de Metas Fijas y Recordatorios de HydroTracker.
Prueba todos los endpoints relacionados con metas y recordatorios.
"""

import requests
import json
import sys
from datetime import datetime, time, timedelta
import time as time_module


class HydroTrackerGoalsRemindersTester:
    """Clase para probar la API de metas y recordatorios de HydroTracker."""
    
    def __init__(self, base_url="http://127.0.0.1:8000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.recordatorio_id = None
    
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
    
    def test_meta_fija(self):
        """Prueba obtener la meta fija de hidratación."""
        print("🔄 Probando meta fija de hidratación...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/goals/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Meta fija obtenida exitosamente")
                print(f"   Meta: {data['meta_ml']}ml")
                print(f"   Tipo: {data['tipo_meta']}")
                print(f"   Personalizable: {data['es_personalizable']}")
                print(f"   Descripción: {data['descripcion']}")
                return True
            else:
                print(f"❌ Error obteniendo meta fija: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo meta fija: {e}")
            return False
    
    def test_recordatorios_crud(self):
        """Prueba CRUD completo de recordatorios."""
        print("🔄 Probando CRUD de recordatorios...")
        
        # 1. Crear recordatorio
        print("   📝 Creando recordatorio...")
        recordatorio_data = {
            "hora": "09:00:00",
            "mensaje": "¡Hora de hidratarse! 💧",
            "tipo_recordatorio": "agua",
            "frecuencia": "diario",
            "dias_semana": [0, 1, 2, 3, 4],  # Lunes a Viernes
            "sonido": "default",
            "vibracion": True
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/recordatorios/",
                json=recordatorio_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                self.recordatorio_id = data['id']
                print(f"   ✅ Recordatorio creado (ID: {self.recordatorio_id})")
                print(f"      Hora: {data['hora']}")
                print(f"      Mensaje: {data['mensaje_completo']}")
                print(f"      Días: {data['dias_semana_display']}")
            else:
                print(f"   ❌ Error creando recordatorio: {response.status_code}")
                print(f"      Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error creando recordatorio: {e}")
            return False
        
        # 2. Listar recordatorios
        print("   📋 Listando recordatorios...")
        try:
            response = self.session.get(
                f"{self.base_url}/recordatorios/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Recordatorios listados ({len(data['results'])} recordatorios)")
            else:
                print(f"   ❌ Error listando recordatorios: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error listando recordatorios: {e}")
            return False
        
        # 3. Obtener recordatorio específico
        print("   🔍 Obteniendo recordatorio específico...")
        try:
            response = self.session.get(
                f"{self.base_url}/recordatorios/{self.recordatorio_id}/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Recordatorio obtenido: {data['hora']} - {data['mensaje_completo']}")
            else:
                print(f"   ❌ Error obteniendo recordatorio: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo recordatorio: {e}")
            return False
        
        # 4. Actualizar recordatorio
        print("   ✏️  Actualizando recordatorio...")
        update_data = {
            "mensaje": "¡Actualizado! Hora de beber agua 💧",
            "vibracion": False
        }
        
        try:
            response = self.session.patch(
                f"{self.base_url}/recordatorios/{self.recordatorio_id}/",
                json=update_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Recordatorio actualizado: {data['mensaje']}")
            else:
                print(f"   ❌ Error actualizando recordatorio: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error actualizando recordatorio: {e}")
            return False
        
        return True
    
    def test_recordatorios_especiales(self):
        """Prueba endpoints especiales de recordatorios."""
        print("🔄 Probando endpoints especiales de recordatorios...")
        
        # 1. Recordatorios activos
        print("   ⭐ Probando endpoint de recordatorios activos...")
        try:
            response = self.session.get(
                f"{self.base_url}/recordatorios/activos/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Recordatorios activos obtenidos ({len(data)} recordatorios)")
            else:
                print(f"   ❌ Error obteniendo activos: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo activos: {e}")
            return False
        
        # 2. Próximos recordatorios
        print("   📅 Probando endpoint de próximos recordatorios...")
        try:
            response = self.session.get(
                f"{self.base_url}/recordatorios/proximos/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Próximos recordatorios obtenidos ({len(data)} recordatorios)")
                for recordatorio in data[:3]:  # Mostrar solo los primeros 3
                    print(f"      - {recordatorio['hora']}: {recordatorio['mensaje']}")
            else:
                print(f"   ❌ Error obteniendo próximos: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo próximos: {e}")
            return False
        
        # 3. Estadísticas de recordatorios
        print("   📊 Probando endpoint de estadísticas...")
        try:
            response = self.session.get(
                f"{self.base_url}/recordatorios/stats/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Estadísticas obtenidas")
                print(f"      Total: {data['total_recordatorios']}")
                print(f"      Activos: {data['recordatorios_activos']}")
                print(f"      Inactivos: {data['recordatorios_inactivos']}")
            else:
                print(f"   ❌ Error obteniendo estadísticas: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo estadísticas: {e}")
            return False
        
        return True
    
    def test_recordatorio_acciones(self):
        """Prueba acciones específicas de recordatorios."""
        print("🔄 Probando acciones de recordatorios...")
        
        if not self.recordatorio_id:
            print("   ❌ No hay recordatorio disponible para las pruebas")
            return False
        
        # 1. Alternar estado activo
        print("   🔄 Probando alternar estado activo...")
        try:
            response = self.session.post(
                f"{self.base_url}/recordatorios/{self.recordatorio_id}/toggle_active/",
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
                f"{self.base_url}/recordatorios/{self.recordatorio_id}/marcar_enviado/",
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
    
    def test_crear_rapido(self):
        """Prueba el endpoint de creación rápida de recordatorios."""
        print("🔄 Probando creación rápida de recordatorio...")
        
        # Crear recordatorio con datos mínimos
        recordatorio_data = {
            "hora": "15:30:00"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/recordatorios/crear_rapido/",
                json=recordatorio_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                print(f"   ✅ Recordatorio rápido creado: {data['hora']}")
                print(f"      Tipo: {data['tipo_recordatorio']}")
                print(f"      Frecuencia: {data['frecuencia']}")
                return True
            else:
                print(f"   ❌ Error en creación rápida: {response.status_code}")
                print(f"      Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error en creación rápida: {e}")
            return False
    
    def test_filtros_recordatorios(self):
        """Prueba filtros de recordatorios."""
        print("🔄 Probando filtros de recordatorios...")
        
        # Filtro por tipo
        print("   🔍 Probando filtro por tipo...")
        try:
            response = self.session.get(
                f"{self.base_url}/recordatorios/?tipo_recordatorio=agua",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Filtro por tipo exitoso ({len(data['results'])} recordatorios de agua)")
            else:
                print(f"   ❌ Error filtrando por tipo: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error filtrando por tipo: {e}")
            return False
        
        # Filtro por frecuencia
        print("   🔍 Probando filtro por frecuencia...")
        try:
            response = self.session.get(
                f"{self.base_url}/recordatorios/?frecuencia=diario",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Filtro por frecuencia exitoso ({len(data['results'])} recordatorios diarios)")
            else:
                print(f"   ❌ Error filtrando por frecuencia: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error filtrando por frecuencia: {e}")
            return False
        
        return True
    
    def cleanup(self):
        """Limpia los datos de prueba."""
        print("🧹 Limpiando datos de prueba...")
        
        # Eliminar recordatorios de prueba
        try:
            response = self.session.get(
                f"{self.base_url}/recordatorios/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                for recordatorio in data['results']:
                    if 'test' in recordatorio.get('mensaje', '').lower() or \
                       recordatorio['hora'] in ['09:00:00', '15:30:00']:
                        try:
                            delete_response = self.session.delete(
                                f"{self.base_url}/recordatorios/{recordatorio['id']}/",
                                headers=self.get_headers()
                            )
                            if delete_response.status_code == 204:
                                print(f"   ✅ Recordatorio de prueba eliminado")
                        except Exception as e:
                            print(f"   ⚠️  Error eliminando recordatorio: {e}")
        except Exception as e:
            print(f"   ⚠️  Error obteniendo recordatorios para limpiar: {e}")
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas de metas y recordatorios."""
        print("🚀 Iniciando pruebas de Metas y Recordatorios de HydroTracker...")
        print("=" * 70)
        
        tests = [
            ("Autenticación", self.authenticate),
            ("Meta Fija", self.test_meta_fija),
            ("CRUD de Recordatorios", self.test_recordatorios_crud),
            ("Endpoints Especiales", self.test_recordatorios_especiales),
            ("Acciones de Recordatorios", self.test_recordatorio_acciones),
            ("Creación Rápida", self.test_crear_rapido),
            ("Filtros de Recordatorios", self.test_filtros_recordatorios),
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
            print("🎉 ¡Todas las pruebas de Metas y Recordatorios pasaron exitosamente!")
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
    
    tester = HydroTrackerGoalsRemindersTester(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
