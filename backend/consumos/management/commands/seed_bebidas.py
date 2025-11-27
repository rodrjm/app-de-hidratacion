from django.core.management.base import BaseCommand
from consumos.models import Bebida


class Command(BaseCommand):
    help = "Crea/actualiza el catálogo completo de bebidas (incluye premium). Idempotente."

    def handle(self, *args, **options):
        bebidas = [
            # Bebidas gratuitas
            {
                "nombre": "Agua",
                "factor_hidratacion": 1.00,
                "descripcion": "Agua pura",
                "es_agua": True,
                "es_alcoholica": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },
            {
                "nombre": "Té",
                "factor_hidratacion": 0.95,
                "descripcion": "Infusión de té (sin azúcar)",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },
            {
                "nombre": "Mate",
                "factor_hidratacion": 0.95,
                "descripcion": "Infusión de yerba mate",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },
            {
                "nombre": "Mate cocido",
                "factor_hidratacion": 0.95,
                "descripcion": "Infusión de yerba mate cocida",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },
            {
                "nombre": "Café",
                "factor_hidratacion": 0.80,
                "descripcion": "Café (solo / con poca leche, sin azúcar)",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": False,
            },
            
            # Bebidas premium
            {
                "nombre": "Suero de Rehidratación Oral",
                "factor_hidratacion": 1.50,
                "descripcion": "Suero de rehidratación oral para recuperación",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Bebidas deportivas",
                "factor_hidratacion": 1.35,
                "descripcion": "Bebidas isotónicas para deportistas",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.25,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Jugo de naranja natural",
                "factor_hidratacion": 1.10,
                "descripcion": "Jugo de naranja natural recién exprimido",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.45,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Agua con gas",
                "factor_hidratacion": 1.00,
                "descripcion": "Agua carbonatada",
                "es_agua": True,
                "es_alcoholica": False,
                "calorias_por_ml": 0.0,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Agua saborizada",
                "factor_hidratacion": 0.95,
                "descripcion": "Agua con sabor, puede contener azúcar",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.2,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Gaseosa",
                "factor_hidratacion": 0.90,
                "descripcion": "Bebida azucarada carbonatada",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.42,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Bebidas energéticas",
                "factor_hidratacion": 0.85,
                "descripcion": "Bebidas con cafeína y taurina",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.45,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Leche descremada",
                "factor_hidratacion": 1.50,
                "descripcion": "Leche con bajo contenido de grasa",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.34,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Leche entera",
                "factor_hidratacion": 1.10,
                "descripcion": "Leche con contenido completo de grasa",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.61,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Chocolatada",
                "factor_hidratacion": 1.20,
                "descripcion": "Bebida de chocolate con leche",
                "es_agua": False,
                "es_alcoholica": False,
                "calorias_por_ml": 0.75,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Cerveza",
                "factor_hidratacion": 0.50,
                "descripcion": "Bebida alcohólica fermentada",
                "es_agua": False,
                "es_alcoholica": True,
                "calorias_por_ml": 0.43,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Vino",
                "factor_hidratacion": 0.40,
                "descripcion": "Bebida alcohólica fermentada de uva",
                "es_agua": False,
                "es_alcoholica": True,
                "calorias_por_ml": 0.83,
                "activa": True,
                "es_premium": True,
            },
            {
                "nombre": "Fernet con cola",
                "factor_hidratacion": 0.30,
                "descripcion": "Bebida alcohólica con cola",
                "es_agua": False,
                "es_alcoholica": True,
                "calorias_por_ml": 0.65,
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


