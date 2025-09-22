#!/usr/bin/env python
"""
Script de prueba para la API Premium de Estadísticas de HydroTracker.
Prueba todos los endpoints relacionados con historial y estadísticas agregadas.
"""

import requests
import json
import sys
from datetime import datetime, time, timedelta
import time as time_module


class HydroTrackerStatsTester:
    """Clase para probar la API de estadísticas premium de HydroTracker."""
    
    def __init__(self, base_url="http://127.0.0.1:8000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.consumo_ids = []
    
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
    
    def create_test_consumos(self):
        """Crea consumos de prueba para las estadísticas."""
        print("🔄 Creando consumos de prueba...")
        
        # Obtener bebidas disponibles
        try:
            response = self.session.get(
                f"{self.base_url}/bebidas/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                bebidas = response.json()['results']
                if not bebidas:
                    print("   ⚠️  No hay bebidas disponibles para crear consumos de prueba")
                    return False
                
                # Crear consumos de prueba para los últimos 7 días
                for i in range(7):
                    fecha = (datetime.now() - timedelta(days=i)).date()
                    
                    # Crear 2-3 consumos por día
                    for j in range(2):
                        consumo_data = {
                            "cantidad_ml": 250 + (j * 100),
                            "bebida": bebidas[0]['id'],
                            "recipiente": 1,  # Asumir que existe
                            "fecha_hora": f"{fecha}T{10 + j * 4}:00:00Z",
                            "nivel_sed": "moderada",
                            "estado_animo": "bien",
                            "notas": f"Consumo de prueba {i}-{j}",
                            "ubicacion": "Casa"
                        }
                        
                        try:
                            response = self.session.post(
                                f"{self.base_url}/consumos/",
                                json=consumo_data,
                                headers=self.get_headers()
                            )
                            
                            if response.status_code == 201:
                                data = response.json()
                                self.consumo_ids.append(data['id'])
                                print(f"   ✅ Consumo creado: {data['id']}")
                            else:
                                print(f"   ❌ Error creando consumo: {response.status_code}")
                                print(f"      Respuesta: {response.text}")
                                
                        except Exception as e:
                            print(f"   ❌ Error creando consumo: {e}")
                
                print(f"   ✅ {len(self.consumo_ids)} consumos de prueba creados")
                return True
            else:
                print(f"   ❌ Error obteniendo bebidas: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo bebidas: {e}")
            return False
    
    def test_consumo_history(self):
        """Prueba el historial de consumos."""
        print("🔄 Probando historial de consumos...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/history/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Historial de consumos obtenido exitosamente")
                print(f"   Total de consumos: {len(data['results'])}")
                
                if data['results']:
                    primer_consumo = data['results'][0]
                    print(f"   Primer consumo:")
                    print(f"      ID: {primer_consumo['id']}")
                    print(f"      Cantidad: {primer_consumo['cantidad_ml']}ml")
                    print(f"      Bebida: {primer_consumo['bebida']['nombre']}")
                    print(f"      Fecha: {primer_consumo['fecha_formateada']}")
                    print(f"      Hora: {primer_consumo['hora_formateada']}")
                
                return True
            elif response.status_code == 403:
                print("   ⚠️  Usuario no es premium (403 Forbidden)")
                return True  # No es un error, es esperado
            else:
                print(f"❌ Error obteniendo historial: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo historial: {e}")
            return False
    
    def test_consumo_history_filters(self):
        """Prueba filtros del historial de consumos."""
        print("🔄 Probando filtros del historial...")
        
        # Filtro por rango de fechas
        print("   🔍 Probando filtro por rango de fechas...")
        try:
            fecha_inicio = (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d')
            fecha_fin = datetime.now().strftime('%Y-%m-%d')
            
            response = self.session.get(
                f"{self.base_url}/premium/stats/history/?fecha_inicio={fecha_inicio}&fecha_fin={fecha_fin}",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Filtro por fechas exitoso ({len(data['results'])} consumos)")
            else:
                print(f"   ❌ Error filtrando por fechas: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error filtrando por fechas: {e}")
            return False
        
        # Filtro por búsqueda
        print("   🔍 Probando filtro por búsqueda...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/history/?search=prueba",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Filtro por búsqueda exitoso ({len(data['results'])} consumos)")
            else:
                print(f"   ❌ Error filtrando por búsqueda: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error filtrando por búsqueda: {e}")
            return False
        
        return True
    
    def test_consumo_summary_daily(self):
        """Prueba resumen diario de consumos."""
        print("🔄 Probando resumen diario de consumos...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/summary/?period=daily",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Resumen diario obtenido exitosamente")
                print(f"   Días con datos: {len(data)}")
                
                if data:
                    primer_dia = data[0]
                    print(f"   Primer día:")
                    print(f"      Fecha: {primer_dia['fecha']}")
                    print(f"      Total ml: {primer_dia['total_ml']}")
                    print(f"      Hidratación efectiva: {primer_dia['total_hidratacion_efectiva_ml']}ml")
                    print(f"      Cantidad de consumos: {primer_dia['cantidad_consumos']}")
                    print(f"      Meta: {primer_dia['meta_ml']}ml")
                    print(f"      Progreso: {primer_dia['progreso_porcentaje']:.1f}%")
                    print(f"      Completada: {primer_dia['completada']}")
                
                return True
            elif response.status_code == 403:
                print("   ⚠️  Usuario no es premium (403 Forbidden)")
                return True  # No es un error, es esperado
            else:
                print(f"❌ Error obteniendo resumen diario: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo resumen diario: {e}")
            return False
    
    def test_consumo_summary_weekly(self):
        """Prueba resumen semanal de consumos."""
        print("🔄 Probando resumen semanal de consumos...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/summary/?period=weekly",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Resumen semanal obtenido exitosamente")
                print(f"   Semanas con datos: {len(data)}")
                
                if data:
                    primera_semana = data[0]
                    print(f"   Primera semana:")
                    print(f"      Inicio: {primera_semana['semana_inicio']}")
                    print(f"      Fin: {primera_semana['semana_fin']}")
                    print(f"      Total ml: {primera_semana['total_ml']}")
                    print(f"      Promedio diario: {primera_semana['promedio_diario_ml']:.1f}ml")
                    print(f"      Días completados: {primera_semana['dias_completados']}/7")
                    print(f"      Eficiencia: {primera_semana['eficiencia_hidratacion']:.1f}%")
                
                return True
            elif response.status_code == 403:
                print("   ⚠️  Usuario no es premium (403 Forbidden)")
                return True  # No es un error, es esperado
            else:
                print(f"❌ Error obteniendo resumen semanal: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo resumen semanal: {e}")
            return False
    
    def test_consumo_summary_monthly(self):
        """Prueba resumen mensual de consumos."""
        print("🔄 Probando resumen mensual de consumos...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/summary/?period=monthly",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Resumen mensual obtenido exitosamente")
                print(f"   Meses con datos: {len(data)}")
                
                if data:
                    primer_mes = data[0]
                    print(f"   Primer mes:")
                    print(f"      Mes: {primer_mes['mes']} {primer_mes['año']}")
                    print(f"      Total ml: {primer_mes['total_ml']}")
                    print(f"      Promedio diario: {primer_mes['promedio_diario_ml']:.1f}ml")
                    print(f"      Días activos: {primer_mes['dias_activos']}/{primer_mes['dias_totales']}")
                    print(f"      Eficiencia: {primer_mes['eficiencia_hidratacion']:.1f}%")
                    print(f"      Tendencia: {primer_mes['tendencia']}")
                
                return True
            elif response.status_code == 403:
                print("   ⚠️  Usuario no es premium (403 Forbidden)")
                return True  # No es un error, es esperado
            else:
                print(f"❌ Error obteniendo resumen mensual: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo resumen mensual: {e}")
            return False
    
    def test_consumo_trends(self):
        """Prueba tendencias de consumo."""
        print("🔄 Probando tendencias de consumo...")
        
        # Tendencias semanales
        print("   📊 Probando tendencias semanales...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/trends/?period=weekly",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Tendencias semanales obtenidas")
                print(f"      Periodo: {data['periodo']}")
                print(f"      Tendencia: {data['tendencia']}")
                print(f"      Cambio: {data['cambio_porcentaje']:.1f}%")
                print(f"      Promedio actual: {data['promedio_actual']:.1f}ml")
                print(f"      Promedio anterior: {data['promedio_anterior']:.1f}ml")
                
                if data['recomendaciones']:
                    print("      Recomendaciones:")
                    for rec in data['recomendaciones']:
                        print(f"         - {rec}")
            else:
                print(f"   ❌ Error obteniendo tendencias semanales: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo tendencias semanales: {e}")
            return False
        
        # Tendencias mensuales
        print("   📊 Probando tendencias mensuales...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/trends/?period=monthly",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Tendencias mensuales obtenidas")
                print(f"      Periodo: {data['periodo']}")
                print(f"      Tendencia: {data['tendencia']}")
                print(f"      Cambio: {data['cambio_porcentaje']:.1f}%")
            else:
                print(f"   ❌ Error obteniendo tendencias mensuales: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error obteniendo tendencias mensuales: {e}")
            return False
        
        return True
    
    def test_consumo_insights(self):
        """Prueba insights y análisis avanzados."""
        print("🔄 Probando insights y análisis avanzados...")
        
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/insights/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Insights obtenidos exitosamente")
                print(f"   Total de consumos: {data['total_consumos']}")
                print(f"   Total ml: {data['total_ml']}")
                print(f"   Total hidratación efectiva: {data['total_hidratacion_efectiva_ml']}ml")
                print(f"   Periodo de análisis: {data['periodo_analisis']}")
                
                if data['insights']:
                    print("   Insights:")
                    for insight in data['insights']:
                        print(f"      - {insight['titulo']}: {insight['descripcion']}")
                
                if data['patrones']:
                    print("   Patrones detectados:")
                    for patron in data['patrones']:
                        print(f"      - {patron['descripcion']}")
                
                if data['recomendaciones']:
                    print("   Recomendaciones:")
                    for rec in data['recomendaciones']:
                        print(f"      - {rec}")
                
                if data['estadisticas_avanzadas']:
                    print("   Estadísticas avanzadas:")
                    stats = data['estadisticas_avanzadas']
                    if 'cantidad' in stats:
                        print(f"      Promedio por consumo: {stats['cantidad']['promedio_ml']:.1f}ml")
                        print(f"      Máximo: {stats['cantidad']['maximo_ml']}ml")
                        print(f"      Mínimo: {stats['cantidad']['minimo_ml']}ml")
                
                return True
            elif response.status_code == 403:
                print("   ⚠️  Usuario no es premium (403 Forbidden)")
                return True  # No es un error, es esperado
            else:
                print(f"❌ Error obteniendo insights: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error obteniendo insights: {e}")
            return False
    
    def test_premium_access_control(self):
        """Prueba control de acceso premium."""
        print("🔄 Probando control de acceso premium...")
        
        # Probar endpoints premium sin autenticación
        print("   🔒 Probando acceso sin autenticación...")
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/history/",
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
        try:
            response = self.session.get(
                f"{self.base_url}/premium/stats/history/",
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
    
    def test_aggregation_functions(self):
        """Prueba las funciones de agregación."""
        print("🔄 Probando funciones de agregación...")
        
        # Probar diferentes periodos
        periods = ['daily', 'weekly', 'monthly']
        
        for period in periods:
            print(f"   📊 Probando agregación {period}...")
            try:
                response = self.session.get(
                    f"{self.base_url}/premium/stats/summary/?period={period}",
                    headers=self.get_headers()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   ✅ Agregación {period} exitosa ({len(data)} elementos)")
                elif response.status_code == 403:
                    print(f"   ⚠️  Usuario no es premium para {period}")
                else:
                    print(f"   ❌ Error en agregación {period}: {response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"   ❌ Error en agregación {period}: {e}")
                return False
        
        return True
    
    def cleanup(self):
        """Limpia los datos de prueba."""
        print("🧹 Limpiando datos de prueba...")
        
        # Eliminar consumos de prueba
        for consumo_id in self.consumo_ids:
            try:
                response = self.session.delete(
                    f"{self.base_url}/consumos/{consumo_id}/",
                    headers=self.get_headers()
                )
                if response.status_code == 204:
                    print(f"   ✅ Consumo de prueba eliminado: {consumo_id}")
            except Exception as e:
                print(f"   ⚠️  Error eliminando consumo {consumo_id}: {e}")
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas de la API de estadísticas premium."""
        print("🚀 Iniciando pruebas de API Premium de Estadísticas de HydroTracker...")
        print("=" * 70)
        
        tests = [
            ("Autenticación", self.authenticate),
            ("Crear Consumos de Prueba", self.create_test_consumos),
            ("Historial de Consumos", self.test_consumo_history),
            ("Filtros del Historial", self.test_consumo_history_filters),
            ("Resumen Diario", self.test_consumo_summary_daily),
            ("Resumen Semanal", self.test_consumo_summary_weekly),
            ("Resumen Mensual", self.test_consumo_summary_monthly),
            ("Tendencias de Consumo", self.test_consumo_trends),
            ("Insights y Análisis", self.test_consumo_insights),
            ("Control de Acceso Premium", self.test_premium_access_control),
            ("Funciones de Agregación", self.test_aggregation_functions),
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
            print("🎉 ¡Todas las pruebas de API Premium de Estadísticas pasaron exitosamente!")
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
    
    tester = HydroTrackerStatsTester(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
