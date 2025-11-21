from django.core.management.base import BaseCommand
from consumos.models import Bebida


class Command(BaseCommand):
    help = "Crea/actualiza el catálogo básico de bebidas (incluye premium). Idempotente."

    def handle(self, *args, **options):
        bebidas = [
            # Bebidas estándar
            {
                "nombre": "Agua",
                "factor_hidratacion": 1.0,
                "descripcion": "Agua pura",
                "es_agua": True,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },
            {
                "nombre": "Té",
                "factor_hidratacion": 0.95,
                "descripcion": "Infusión de té (sin azúcar)",
                "es_agua": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },
            {
                "nombre": "Mate",
                "factor_hidratacion": 0.95,
                "descripcion": "Infusión de yerba mate",
                "es_agua": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },
            {
                "nombre": "Café",
                "factor_hidratacion": 0.9,
                "descripcion": "Café (solo / con poca leche, sin azúcar)",
                "es_agua": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },
            {
                "nombre": "Mate cocido",
                "factor_hidratacion": 0.95,
                "descripcion": "Infusión de yerba mate cocida",
                "es_agua": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },

            # Bebidas premium
            {
                "nombre": "Gaseosa",
                "factor_hidratacion": 0.6,
                "descripcion": "Bebida azucarada carbonatada",
                "es_agua": False,
                "calorias_por_ml": 0.42,  # ~42 kcal por 100ml
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Agua saborizada",
                "factor_hidratacion": 0.95,
                "descripcion": "Agua con sabor, puede contener azúcar",
                "es_agua": False,
                "calorias_por_ml": 0.2,  # ~20 kcal por 100ml (varía)
                "activa": True,
                "es_premium": True,
            },
        ]

        creadas, actualizadas = 0, 0
        for data in bebidas:
            obj, created = Bebida.objects.update_or_create(
                nombre=data["nombre"],
                defaults=data,
            )
            if created:
                creadas += 1
            else:
                actualizadas += 1

        self.stdout.write(self.style.SUCCESS(
            f"Bebidas procesadas: creadas={creadas}, actualizadas={actualizadas}"
        ))


