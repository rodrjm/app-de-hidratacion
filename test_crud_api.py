#!/usr/bin/env python
"""
Script de prueba para la API CRUD de HydroTracker.
Prueba todos los endpoints de Consumos y Recipientes.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time


class HydroTrackerCRUDTester:
    """Clase para probar la API CRUD de HydroTracker."""
    
    def __init__(self, base_url="http://127.0.0.1:8000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.bebida_id = None
        self.recipiente_id = None
        self.consumo_id = None
    
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
    
    def test_bebidas_list(self):
        """Prueba listar bebidas disponibles."""
        print("🔄 Probando listado de bebidas...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/bebidas/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Bebidas listadas exitosamente ({len(data['results'])} bebidas)")
                
                # Guardar ID de la primera bebida para pruebas
                if data['results']:
                    self.bebida_id = data['results'][0]['id']
                    print(f"   Bebida seleccionada: {data['results'][0]['nombre']}")
                
                return True
            else:
                print(f"❌ Error listando bebidas: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error listando bebidas: {e}")
            return False
    
    def test_recipientes_crud(self):
        """Prueba CRUD completo de recipientes."""
        print("🔄 Probando CRUD de recipientes...")
        
        # 1. Crear recipiente
        print("   📝 Creando recipiente...")
        recipiente_data = {
            "nombre": f"Botella Test {datetime.now().strftime('%H%M%S')}",
            "cantidad_ml": 500,
            "color": "#3B82F6",
            "icono": "bottle",
            "es_favorito": True
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/recipientes/",
                json=recipiente_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                self.recipiente_id = data['id']
                print(f"   ✅ Recipiente creado (ID: {self.recipiente_id})")
            else:
                print(f"   ❌ Error creando recipiente: {response.status_code}")
                print(f"      Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error creando recipiente: {e}")
            return False
        
        # 2. Listar recipientes
        print("   📋 Listando recipientes...")
        try:
            response = self.session.get(
                f"{self.base_url}/recipientes/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Recipientes listados ({len(data['results'])} recipientes)")
            else:
                print(f"   ❌ Error listando recipientes: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error listando recipientes: {e}")
            return False
        
        # 3. Obtener recipiente específico
        print("   🔍 Obteniendo recipiente específico...")
        try:
            response = self.session.get(
                f"{self.base_url}/recipientes/{self.recipiente_id}/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Recipiente obtenido: {data['nombre']}")
            else:
                print(f"   ❌ Error obteniendo recipiente: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo recipiente: {e}")
            return False
        
        # 4. Actualizar recipiente
        print("   ✏️  Actualizando recipiente...")
        update_data = {
            "cantidad_ml": 750,
            "es_favorito": False
        }
        
        try:
            response = self.session.patch(
                f"{self.base_url}/recipientes/{self.recipiente_id}/",
                json=update_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Recipiente actualizado: {data['cantidad_ml']}ml, favorito: {data['es_favorito']}")
            else:
                print(f"   ❌ Error actualizando recipiente: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error actualizando recipiente: {e}")
            return False
        
        # 5. Probar endpoint de favoritos
        print("   ⭐ Probando endpoint de favoritos...")
        try:
            response = self.session.get(
                f"{self.base_url}/recipientes/favoritos/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Favoritos obtenidos ({len(data)} recipientes)")
            else:
                print(f"   ❌ Error obteniendo favoritos: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo favoritos: {e}")
            return False
        
        return True
    
    def test_consumos_crud(self):
        """Prueba CRUD completo de consumos."""
        print("🔄 Probando CRUD de consumos...")
        
        if not self.bebida_id:
            print("   ❌ No hay bebida disponible para la prueba")
            return False
        
        # 1. Crear consumo
        print("   📝 Creando consumo...")
        consumo_data = {
            "bebida": self.bebida_id,
            "cantidad_ml": 250,
            "fecha_hora": datetime.now().isoformat(),
            "notas": "Prueba de consumo",
            "nivel_sed": 3,
            "estado_animo": "bueno"
        }
        
        if self.recipiente_id:
            consumo_data["recipiente"] = self.recipiente_id
        
        try:
            response = self.session.post(
                f"{self.base_url}/consumos/",
                json=consumo_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                self.consumo_id = data['id']
                print(f"   ✅ Consumo creado (ID: {self.consumo_id})")
                print(f"      Hidratación efectiva: {data['cantidad_hidratacion_efectiva']}ml")
            else:
                print(f"   ❌ Error creando consumo: {response.status_code}")
                print(f"      Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error creando consumo: {e}")
            return False
        
        # 2. Listar consumos
        print("   📋 Listando consumos...")
        try:
            response = self.session.get(
                f"{self.base_url}/consumos/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Consumos listados ({len(data['results'])} consumos)")
            else:
                print(f"   ❌ Error listando consumos: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error listando consumos: {e}")
            return False
        
        # 3. Filtrar consumos por fecha
        print("   📅 Probando filtro por fecha...")
        hoy = datetime.now().date().isoformat()
        try:
            response = self.session.get(
                f"{self.base_url}/consumos/?date={hoy}",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Filtro por fecha exitoso ({len(data['results'])} consumos hoy)")
            else:
                print(f"   ❌ Error filtrando por fecha: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error filtrando por fecha: {e}")
            return False
        
        # 4. Obtener consumo específico
        print("   🔍 Obteniendo consumo específico...")
        try:
            response = self.session.get(
                f"{self.base_url}/consumos/{self.consumo_id}/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Consumo obtenido: {data['cantidad_ml']}ml de {data['bebida_nombre']}")
            else:
                print(f"   ❌ Error obteniendo consumo: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo consumo: {e}")
            return False
        
        # 5. Actualizar consumo
        print("   ✏️  Actualizando consumo...")
        update_data = {
            "cantidad_ml": 300,
            "notas": "Consumo actualizado en prueba"
        }
        
        try:
            response = self.session.patch(
                f"{self.base_url}/consumos/{self.consumo_id}/",
                json=update_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Consumo actualizado: {data['cantidad_ml']}ml")
            else:
                print(f"   ❌ Error actualizando consumo: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error actualizando consumo: {e}")
            return False
        
        # 6. Probar endpoint de consumos de hoy
        print("   📊 Probando endpoint de consumos de hoy...")
        try:
            response = self.session.get(
                f"{self.base_url}/consumos/hoy/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Consumos de hoy obtenidos")
                print(f"      Total: {data['resumen']['total_ml']}ml")
                print(f"      Progreso: {data['resumen']['progreso_porcentaje']:.1f}%")
            else:
                print(f"   ❌ Error obteniendo consumos de hoy: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo consumos de hoy: {e}")
            return False
        
        # 7. Probar endpoint de estadísticas
        print("   📈 Probando endpoint de estadísticas...")
        try:
            response = self.session.get(
                f"{self.base_url}/consumos/stats/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Estadísticas obtenidas")
                print(f"      Total consumido: {data['totales']['total_consumido_ml']}ml")
                print(f"      Promedio diario: {data['totales']['promedio_diario_ml']:.1f}ml")
            else:
                print(f"   ❌ Error obteniendo estadísticas: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo estadísticas: {e}")
            return False
        
        return True
    
    def test_quick_add(self):
        """Prueba el endpoint de agregado rápido."""
        print("🔄 Probando agregado rápido de consumo...")
        
        try:
            response = self.session.post(
                f"{self.base_url}/consumos/quick_add/",
                json={"cantidad_ml": 200},
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                print(f"   ✅ Consumo rápido creado: {data['cantidad_ml']}ml")
                return True
            else:
                print(f"   ❌ Error en agregado rápido: {response.status_code}")
                print(f"      Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error en agregado rápido: {e}")
            return False
    
    def test_metas_diarias(self):
        """Prueba los endpoints de metas diarias."""
        print("🔄 Probando endpoints de metas diarias...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/metas-diarias/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Metas diarias obtenidas ({len(data['results'])} metas)")
                
                # Probar resumen semanal
                response = self.session.get(
                    f"{self.base_url}/metas-diarias/resumen_semanal/",
                    headers=self.get_headers()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   ✅ Resumen semanal obtenido")
                    print(f"      Días completados: {data['resumen']['dias_completados']}/7")
                else:
                    print(f"   ❌ Error obteniendo resumen semanal: {response.status_code}")
                    return False
                
                return True
            else:
                print(f"   ❌ Error obteniendo metas diarias: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo metas diarias: {e}")
            return False
    
    def cleanup(self):
        """Limpia los datos de prueba."""
        print("🧹 Limpiando datos de prueba...")
        
        # Eliminar consumo de prueba
        if self.consumo_id:
            try:
                response = self.session.delete(
                    f"{self.base_url}/consumos/{self.consumo_id}/",
                    headers=self.get_headers()
                )
                if response.status_code == 204:
                    print("   ✅ Consumo de prueba eliminado")
                else:
                    print(f"   ⚠️  No se pudo eliminar consumo: {response.status_code}")
            except Exception as e:
                print(f"   ⚠️  Error eliminando consumo: {e}")
        
        # Eliminar recipiente de prueba
        if self.recipiente_id:
            try:
                response = self.session.delete(
                    f"{self.base_url}/recipientes/{self.recipiente_id}/",
                    headers=self.get_headers()
                )
                if response.status_code == 204:
                    print("   ✅ Recipiente de prueba eliminado")
                else:
                    print(f"   ⚠️  No se pudo eliminar recipiente: {response.status_code}")
            except Exception as e:
                print(f"   ⚠️  Error eliminando recipiente: {e}")
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas CRUD."""
        print("🚀 Iniciando pruebas CRUD de la API HydroTracker...")
        print("=" * 60)
        
        tests = [
            ("Autenticación", self.authenticate),
            ("Listado de Bebidas", self.test_bebidas_list),
            ("CRUD de Recipientes", self.test_recipientes_crud),
            ("CRUD de Consumos", self.test_consumos_crud),
            ("Agregado Rápido", self.test_quick_add),
            ("Metas Diarias", self.test_metas_diarias),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 {test_name}")
            if test_func():
                passed += 1
            print("-" * 40)
        
        # Limpiar datos de prueba
        self.cleanup()
        
        print(f"\n📊 Resultados: {passed}/{total} pruebas pasaron")
        
        if passed == total:
            print("🎉 ¡Todas las pruebas CRUD pasaron exitosamente!")
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
    
    tester = HydroTrackerCRUDTester(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
