"""
Servicio para consultar datos climáticos de Open-Meteo API.
"""
import logging
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
from zoneinfo import ZoneInfo
from django.utils import timezone
from django.core.cache import cache

logger = logging.getLogger(__name__)


class WeatherService:
    """
    Servicio para obtener datos climáticos de Open-Meteo.
    """
    
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    
    def get_weather_data(
        self,
        latitude: float,
        longitude: float,
        activity_datetime: datetime,
        user_timezone: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Obtiene datos climáticos para una ubicación y fecha/hora específica.
        
        Args:
            latitude: Latitud de la ubicación
            longitude: Longitud de la ubicación
            activity_datetime: Fecha y hora de la actividad (datetime con timezone, típicamente UTC)
            user_timezone: Zona horaria del usuario (ej. "America/Argentina/Buenos_Aires") para
                           mostrar la hora en el mensaje y buscar el slot horario en la respuesta de la API.
        
        Returns:
            Dict con:
            - temperature: Temperatura en °C (o None si no disponible)
            - humidity: Humedad relativa en % (o None si no disponible)
            - weather_message: Mensaje descriptivo del clima (hora en zona del usuario)
            - success: Boolean indicando si se obtuvo datos válidos
        """
        try:
            # Convertir activity_datetime a UTC si tiene timezone
            if activity_datetime.tzinfo:
                activity_datetime_utc = activity_datetime.astimezone(timezone.utc)
            else:
                # Si no tiene timezone, asumir que es UTC
                activity_datetime_utc = activity_datetime.replace(tzinfo=timezone.utc)
            
            # Para buscar en la API y mostrar al usuario: usar hora en zona del usuario si se proporciona
            if user_timezone:
                try:
                    tz = ZoneInfo(user_timezone)
                    activity_datetime_local = activity_datetime_utc.astimezone(tz)
                except Exception:
                    # Fallback: nombres comunes que pueden venir del cliente (ej. America/Buenos_Aires)
                    _tz_fallback = {
                        "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
                        "America/Mexico_City": "America/Mexico_City",
                    }
                    tz_name = _tz_fallback.get(user_timezone) or user_timezone
                    try:
                        tz = ZoneInfo(tz_name)
                        activity_datetime_local = activity_datetime_utc.astimezone(tz)
                    except Exception:
                        activity_datetime_local = activity_datetime_utc
            else:
                activity_datetime_local = activity_datetime_utc
            
            # Verificar si la fecha es muy antigua (más de 7 días)
            now_utc = timezone.now()
            days_diff = (now_utc - activity_datetime_utc).days
            
            if days_diff > 7:
                logger.warning(
                    f'Fecha de actividad muy antigua ({days_diff} días). '
                    f'Usando valores neutros sin penalización climática.'
                )
                return {
                    'temperature': None,
                    'humidity': None,
                    'weather_message': 'Datos climáticos no disponibles para fechas anteriores a 7 días. Sin ajuste climático.',
                    'success': False
                }
            
            # Formatear fecha para la API (YYYY-MM-DD). Usar fecha local si hay timezone
            # para que la respuesta horaria coincida con el día del usuario.
            date_str = activity_datetime_local.strftime('%Y-%m-%d')
            
            # Clave de caché por lat/lon/fecha para reducir llamadas a Open-Meteo
            cache_key = f"weather:{round(latitude, 4)}:{round(longitude, 4)}:{date_str}"
            data = cache.get(cache_key)
            if data is not None:
                logger.debug(f"WeatherService cache HIT: {cache_key}")
            else:
                # Construir URL de la API
                url = f"{self.BASE_URL}"
                params = {
                    'latitude': latitude,
                    'longitude': longitude,
                    'hourly': 'temperature_2m,relative_humidity_2m',
                    'timezone': 'auto',
                    'start_date': date_str,
                    'end_date': date_str
                }
                
                logger.info(f'Consultando Open-Meteo: lat={latitude}, lon={longitude}, fecha={date_str}')
                
                # Hacer petición a la API
                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                # Cachear por ~30 minutos para evitar 429 y mejorar performance
                try:
                    cache.set(cache_key, data, timeout=1800)
                    logger.debug(f"WeatherService cache SET: {cache_key}")
                except Exception:
                    logger.debug(f"No se pudo cachear respuesta de Open-Meteo para {cache_key}")
            
            # Extraer arrays de datos horarios
            hourly = data.get('hourly', {})
            times = hourly.get('time', [])
            temperatures = hourly.get('temperature_2m', [])
            humidities = hourly.get('relative_humidity_2m', [])
            
            if not times or not temperatures or not humidities:
                logger.warning('Open-Meteo no devolvió datos horarios válidos')
                return {
                    'temperature': None,
                    'humidity': None,
                    'weather_message': 'No se pudieron obtener datos climáticos. Sin ajuste climático.',
                    'success': False
                }
            
            # Encontrar el índice correspondiente a la hora de la actividad.
            # Open-Meteo con timezone='auto' devuelve las horas en la zona local de la ubicación;
            # usamos la hora local del usuario para coincidir con ese formato.
            activity_hour = activity_datetime_local.strftime('%Y-%m-%dT%H:00')
            
            try:
                # Buscar el índice exacto
                index = times.index(activity_hour)
            except ValueError:
                # Si no se encuentra la hora exacta, buscar la más cercana
                logger.warning(f'Hora exacta {activity_hour} no encontrada, buscando la más cercana')
                index = self._find_closest_hour_index(times, activity_datetime_local)
            
            if index is None or index >= len(temperatures) or index >= len(humidities):
                logger.warning('Índice de hora no válido')
                return {
                    'temperature': None,
                    'humidity': None,
                    'weather_message': 'No se encontró la hora correspondiente en los datos climáticos. Sin ajuste climático.',
                    'success': False
                }
            
            temperature = temperatures[index]
            humidity = humidities[index]
            
            # Formatear hora para el mensaje en la zona del usuario
            hora_formateada = activity_datetime_local.strftime('%H:%M')
            
            weather_message = (
                f'El clima a las {hora_formateada} era de {temperature:.1f}°C '
                f'con {humidity:.0f}% de humedad.'
            )
            
            logger.info(
                f'Datos climáticos obtenidos: T={temperature}°C, H={humidity}%, '
                f'hora_local={activity_hour}'
            )
            
            return {
                'temperature': float(temperature),
                'humidity': float(humidity),
                'weather_message': weather_message,
                'success': True
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f'Error al consultar Open-Meteo API: {str(e)}')
            return {
                'temperature': None,
                'humidity': None,
                'weather_message': 'Error al consultar datos climáticos. Sin ajuste climático.',
                'success': False
            }
        except Exception as e:
            logger.exception(f'Error inesperado en WeatherService: {str(e)}')
            return {
                'temperature': None,
                'humidity': None,
                'weather_message': 'Error al procesar datos climáticos. Sin ajuste climático.',
                'success': False
            }
    
    def _find_closest_hour_index(self, times: list, target_datetime: datetime) -> Optional[int]:
        """
        Encuentra el índice de la hora más cercana a target_datetime.
        
        Args:
            times: Lista de strings de tiempo en formato ISO
            target_datetime: Fecha/hora objetivo
        
        Returns:
            Índice de la hora más cercana o None si no se encuentra
        """
        try:
            target_hour = target_datetime.hour
            target_date = target_datetime.strftime('%Y-%m-%d')
            
            # Buscar horas del mismo día
            closest_index = None
            min_diff = float('inf')
            
            for i, time_str in enumerate(times):
                if not time_str.startswith(target_date):
                    continue
                
                # Extraer hora del string
                try:
                    hour_str = time_str.split('T')[1].split(':')[0]
                    hour = int(hour_str)
                    
                    diff = abs(hour - target_hour)
                    if diff < min_diff:
                        min_diff = diff
                        closest_index = i
                except (IndexError, ValueError):
                    continue
            
            return closest_index
            
        except Exception as e:
            logger.error(f'Error al buscar hora más cercana: {str(e)}')
            return None
