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
            # 1. Obtener datos
            plan_type = request.data.get('planType')
            user_email = request.user.email
            user_id = request.user.id
            
            print(f"--- Intento FINAL suscripción para: {user_email}, Plan: {plan_type} ---")

            # 2. Configurar SDK
            mp_access_token = getattr(settings, 'MP_ACCESS_TOKEN', None)
            if not mp_access_token:
                print("ERROR: MP_ACCESS_TOKEN no está configurado en settings")
                return Response(
                    {'error': 'Configuración de pago no disponible'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            sdk = mercadopago.SDK(mp_access_token)
            
            # URL de retorno
            back_url = settings.FRONTEND_URL.rstrip('/')
            notification_url = f"{settings.BACKEND_URL.rstrip('/')}/api/webhooks/mercadopago/"

            # ----------------------------------------
            # CASO A: PAGO ÚNICO (LIFETIME)
            # ----------------------------------------
            if plan_type == 'lifetime':
                preference_data = {
                    "items": [
                        {
                            "title": "Dosis Vital - Plan De por vida",
                            "quantity": 1,
                            "currency_id": "ARS",
                            "unit_price": 100000.00
                        }
                    ],
                    "payer": { "email": user_email },
                    "external_reference": str(user_id),
                    "back_urls": {
                        "success": f"{back_url}/premium",
                        "failure": f"{back_url}/premium",
                        "pending": f"{back_url}/premium"
                    },
                    "notification_url": notification_url,
                    "auto_return": "approved"
                }
                
                response = sdk.preference().create(preference_data)
                
                if response["status"] == 201:
                    return Response({"init_point": response["response"]["init_point"]})
                else:
                    return Response(response["response"], status=status.HTTP_400_BAD_REQUEST)

            # ----------------------------------------
            # CASO B: SUSCRIPCIÓN (MENSUAL/ANUAL)
            # ----------------------------------------
            else:
                if plan_type == 'monthly':
                    frequency = 1
                    transaction_amount = 2000.00
                    reason = "Dosis Vital - Plan Mensual"
                elif plan_type == 'annual':
                    frequency = 12
                    transaction_amount = 18000.00
                    reason = "Dosis Vital - Plan Anual"
                else:
                    return Response({"error": "Plan inválido"}, status=status.HTTP_400_BAD_REQUEST)

                # PAYLOAD LIMPIO: Sin status, sin fechas, sin notification_url (por ahora)
                preapproval_data = {
                    "reason": reason,
                    "external_reference": str(user_id),
                    "payer_email": user_email,
                    "auto_recurring": {
                        "frequency": frequency,
                        "frequency_type": "months",
                        "transaction_amount": transaction_amount,
                        "currency_id": "ARS"
                    },
                    "back_url": f"{back_url}/premium",
                    "notification_url": notification_url
                }

                print(f"Enviando data LIMPIA a MP: {preapproval_data}") 
                response = sdk.preapproval().create(preapproval_data)

                # MP suele devolver 201 Created
                if response["status"] == 201:
                    return Response({"init_point": response["response"]["init_point"]})
                else:
                    print("❌ Error MP Preapproval:", response)
                    return Response(response["response"], status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("Error Servidor:", str(e))
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        - type/topic: tipo de notificación (preapproval, payment, subscription_preapproval, etc.)
        - id: ID del recurso (preapproval_id o payment_id)
        Puede venir en query params (?type=payment&data.id=123) o en el body
        """
        try:
            # Mercado Pago puede enviar los datos en query params o en el body
            topic = request.GET.get('type') or request.data.get('type') or request.data.get('topic')
            resource_id = (
                request.GET.get('data.id') or 
                request.data.get('data', {}).get('id') or 
                request.data.get('id')
            )
            
            logger.info(f'Webhook recibido - topic: {topic}, resource_id: {resource_id}, query_params: {dict(request.GET)}, body: {request.data}')
            
            if not topic or not resource_id:
                logger.warning(f'Webhook recibido sin topic o resource_id. Query: {dict(request.GET)}, Body: {request.data}')
                return Response({'status': 'ignored'}, status=status.HTTP_200_OK)
            
            # Obtener configuración de Mercado Pago
            mp_access_token = getattr(settings, 'MP_ACCESS_TOKEN', None)
            if not mp_access_token:
                logger.error('MP_ACCESS_TOKEN no está configurado en settings')
                return Response({'status': 'error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            sdk = mercadopago.SDK(mp_access_token)
            
            # Procesar según el tipo de notificación
            if topic in ('preapproval', 'subscription_preapproval'):
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
                else:
                    logger.info(f'Preapproval {resource_id} en estado {status_preapproval}, no se activa premium')
                
            elif topic == 'payment':
                # Notificación de pago (para lifetime o pagos únicos)
                payment_response = sdk.payment().get(resource_id)
                
                # Manejar caso cuando el payment no existe (404) - puede ser rechazado/cancelado
                if payment_response.get('status') == 404:
                    logger.warning(f'Payment {resource_id} no encontrado (404). Puede haber sido rechazado/cancelado antes de procesarse.')
                    return Response({'status': 'ignored', 'reason': 'payment_not_found'}, status=status.HTTP_200_OK)
                
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
                else:
                    logger.info(f'Payment {resource_id} en estado {status_payment}, no se activa premium')
            
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

