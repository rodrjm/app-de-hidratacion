"""
URLs para la API de suscripciones y webhooks.
"""

from django.urls import path
from .views import CreateSubscriptionView, MercadoPagoWebhookView, CancelSubscriptionView

app_name = 'api'

urlpatterns = [
    path('premium/subscribe/', CreateSubscriptionView.as_view(), name='create-subscription'),
    path('premium/cancel/', CancelSubscriptionView.as_view(), name='cancel-subscription'),
    path('webhooks/mercadopago/', MercadoPagoWebhookView.as_view(), name='mercadopago-webhook'),
]

