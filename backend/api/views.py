"""
Vistas para manejo de suscripciones y webhooks de Mercado Pago.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import mercadopago

from users.models import User

logger = logging.getLogger(__name__)


class CreateSubscriptionView(APIView):
    """
    Vista para crear una suscripción y generar una preferencia de pago en Mercado Pago.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Crea una preferencia de pago o preapproval en Mercado Pago según el tipo de plan.
        
        Body esperado:
        {
            "planType": "monthly" | "annual" | "lifetime"
        }
        
        Retorna:
        {
            "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
        }
        """
        try:
            plan_type = request.data.get('planType')
            
            if not plan_type:
                return Response(
                    {'error': 'planType es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if plan_type not in ['monthly', 'annual', 'lifetime']:
                return Response(
                    {'error': 'planType debe ser "monthly", "annual" o "lifetime"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = request.user
            
            # Obtener configuración de Mercado Pago
            mp_access_token = getattr(settings, 'MP_ACCESS_TOKEN', None)
            if not mp_access_token:
                logger.error('MP_ACCESS_TOKEN no está configurado en settings')
                return Response(
                    {'error': 'Configuración de pago no disponible'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            
            # Inicializar SDK de Mercado Pago
            sdk = mercadopago.SDK(mp_access_token)
            
            # Configurar precios y frecuencia según el plan
            if plan_type == 'monthly':
                # Plan mensual: $1,000 ARS el primer mes, luego $2,000 ARS
                # Para simplificar, usamos $2,000 ARS como monto base
                amount = 2000
                frequency = 1
                frequency_type = 'months'
                plan_name = 'Plan Mensual'
            elif plan_type == 'annual':
                # Plan anual: $18,000 ARS
                amount = 18000
                frequency = 12
                frequency_type = 'months'
                plan_name = 'Plan Anual'
            else:  # lifetime
                # Plan de por vida: $100,000 ARS (pago único, no suscripción)
                amount = 100000
                frequency = None
                frequency_type = None
                plan_name = 'Plan De por vida'
            
            # Configurar datos de la preferencia/preapproval
            if plan_type == 'lifetime':
                # Para lifetime, usar preference (pago único)
                preference_data = {
                    "items": [
                        {
                            "title": plan_name,
                            "quantity": 1,
                            "unit_price": float(amount),
                            "currency_id": "ARS"
                        }
                    ],
                    "payer": {
                        "email": user.email,
                        "name": user.get_full_name() or user.username
                    },
                    "back_urls": {
                        "success": f"{frontend_url}/premium?status=success",
                        "failure": f"{frontend_url}/premium?status=failure",
                        "pending": f"{frontend_url}/premium?status=pending"
                    },
                    "auto_return": "approved",
                    "external_reference": str(user.id),
                    "notification_url": f"{backend_url}/api/webhooks/mercadopago/",
                    "statement_descriptor": "DOSIS VITAL PREMIUM"
                }
                
                # Crear preference
                preference_response = sdk.preference().create(preference_data)
                
                if preference_response.get('status') != 201:
                    logger.error(f'Error al crear preference: {preference_response}')
                    return Response(
                        {'error': 'Error al crear la preferencia de pago'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                preference = preference_response.get('response')
                init_point = preference.get('init_point')
                
            else:
                # Para monthly y annual, usar preapproval (suscripción recurrente)
                preapproval_data = {
                    "reason": plan_name,
                    "auto_recurring": {
                        "frequency": frequency,
                        "frequency_type": frequency_type,
                        "transaction_amount": float(amount),
                        "currency_id": "ARS",
                        "start_date": (timezone.now() + timedelta(days=1)).isoformat(),
                        "end_date": None  # Sin fecha de fin para suscripciones continuas
                    },
                    "payer_email": user.email,
                    "external_reference": str(user.id),
                    "back_url": f"{frontend_url}/premium?status=success",
                    "notification_url": f"{backend_url}/api/webhooks/mercadopago/"
                }
                
                # Crear preapproval
                preapproval_response = sdk.preapproval().create(preapproval_data)
                
                if preapproval_response.get('status') != 201:
                    logger.error(f'Error al crear preapproval: {preapproval_response}')
                    return Response(
                        {'error': 'Error al crear la suscripción'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                preapproval = preapproval_response.get('response')
                init_point = preapproval.get('init_point')
            
            if not init_point:
                logger.error('No se obtuvo init_point de Mercado Pago')
                return Response(
                    {'error': 'Error al obtener URL de pago'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            logger.info(f'Suscripción creada para usuario {user.id}, plan: {plan_type}, init_point: {init_point}')
            
            return Response({
                'init_point': init_point
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.exception(f'Error inesperado al crear suscripción: {str(e)}')
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MercadoPagoWebhookView(APIView):
    """
    Vista para recibir notificaciones de webhook de Mercado Pago.
    Esta vista debe ser pública (sin autenticación) ya que Mercado Pago la llama directamente.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Procesa las notificaciones de webhook de Mercado Pago.
        
        Mercado Pago envía notificaciones con:
        - topic: tipo de notificación (preapproval, payment, etc.)
        - id: ID del recurso (preapproval_id o payment_id)
        """
        try:
            topic = request.data.get('type') or request.data.get('topic')
            resource_id = request.data.get('data', {}).get('id') or request.data.get('id')
            
            if not topic or not resource_id:
                logger.warning(f'Webhook recibido sin topic o resource_id: {request.data}')
                return Response({'status': 'ignored'}, status=status.HTTP_200_OK)
            
            # Obtener configuración de Mercado Pago
            mp_access_token = getattr(settings, 'MP_ACCESS_TOKEN', None)
            if not mp_access_token:
                logger.error('MP_ACCESS_TOKEN no está configurado en settings')
                return Response({'status': 'error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            sdk = mercadopago.SDK(mp_access_token)
            
            # Procesar según el tipo de notificación
            if topic == 'preapproval':
                # Notificación de suscripción (preapproval)
                preapproval_response = sdk.preapproval().get(resource_id)
                
                if preapproval_response.get('status') != 200:
                    logger.error(f'Error al obtener preapproval {resource_id}: {preapproval_response}')
                    return Response({'status': 'error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                preapproval = preapproval_response.get('response')
                external_reference = preapproval.get('external_reference')
                status_preapproval = preapproval.get('status')
                
                logger.info(f'Webhook preapproval: id={resource_id}, status={status_preapproval}, user_id={external_reference}')
                
                # Activar cuenta premium si está autorizada
                # Estados válidos: 'pending', 'authorized', 'paused', 'cancelled'
                if status_preapproval == 'authorized':
                    self._activate_premium_user(external_reference, preapproval)
                
            elif topic == 'payment':
                # Notificación de pago (para lifetime o pagos únicos)
                payment_response = sdk.payment().get(resource_id)
                
                if payment_response.get('status') != 200:
                    logger.error(f'Error al obtener payment {resource_id}: {payment_response}')
                    return Response({'status': 'error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                payment = payment_response.get('response')
                external_reference = payment.get('external_reference')
                status_payment = payment.get('status')
                
                logger.info(f'Webhook payment: id={resource_id}, status={status_payment}, user_id={external_reference}')
                
                # Activar cuenta premium si el pago está aprobado
                if status_payment == 'approved':
                    self._activate_premium_user(external_reference, payment)
            
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f'Error al procesar webhook: {str(e)}')
            return Response({'status': 'error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _activate_premium_user(self, external_reference, payment_data):
        """
        Activa la cuenta premium del usuario.
        
        Args:
            external_reference: ID del usuario (string)
            payment_data: Datos del pago/preapproval de Mercado Pago
        """
        try:
            if not external_reference:
                logger.warning('external_reference vacío, no se puede activar usuario')
                return
            
            user_id = int(external_reference)
            
            with transaction.atomic():
                try:
                    user = User.objects.get(id=user_id)
                    
                    # Activar premium
                    user.es_premium = True
                    
                    # Calcular fecha de fin de suscripción si es necesario
                    # Para preapproval, podemos usar la fecha de inicio + frecuencia
                    if 'auto_recurring' in payment_data:
                        # Es una suscripción recurrente
                        frequency = payment_data['auto_recurring'].get('frequency', 1)
                        frequency_type = payment_data['auto_recurring'].get('frequency_type', 'months')
                        
                        if frequency_type == 'months':
                            # Calcular fecha de fin (por ejemplo, 1 mes o 12 meses desde ahora)
                            end_date = timezone.now() + timedelta(days=frequency * 30)
                        else:
                            # Para otros tipos, usar 1 mes por defecto
                            end_date = timezone.now() + timedelta(days=30)
                    else:
                        # Es un pago único (lifetime), no tiene fecha de fin
                        end_date = None
                    
                    # Guardar cambios
                    user.save(update_fields=['es_premium'])
                    
                    logger.info(f'Usuario {user_id} activado como premium. Fecha fin: {end_date}')
                    
                except User.DoesNotExist:
                    logger.error(f'Usuario con id {user_id} no encontrado')
                except Exception as e:
                    logger.exception(f'Error al activar usuario premium {user_id}: {str(e)}')
                    raise
                    
        except ValueError:
            logger.error(f'external_reference inválido: {external_reference}')
        except Exception as e:
            logger.exception(f'Error inesperado al activar usuario premium: {str(e)}')

