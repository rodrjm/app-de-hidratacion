# Generated manually - Data migration for updating beverages

from django.db import migrations


def update_bebidas_data(apps, schema_editor):
    """
    Actualiza las bebidas existentes con los nuevos factores de hidratación
    y marca las bebidas alcohólicas.
    """
    Bebida = apps.get_model('consumos', 'Bebida')
    
    # Bebidas gratuitas
    bebidas_gratuitas = {
        'Agua': {'factor': 1.00, 'es_agua': True, 'es_alcoholica': False},
        'Té': {'factor': 0.95, 'es_agua': False, 'es_alcoholica': False},
        'Mate': {'factor': 0.95, 'es_agua': False, 'es_alcoholica': False},
        'Mate cocido': {'factor': 0.95, 'es_agua': False, 'es_alcoholica': False},
        'Café': {'factor': 0.80, 'es_agua': False, 'es_alcoholica': False},
    }
    
    # Bebidas premium
    bebidas_premium = {
        'Suero de Rehidratación Oral': {'factor': 1.50, 'es_agua': False, 'es_alcoholica': False, 'es_premium': True},
        'Bebidas deportivas': {'factor': 1.35, 'es_agua': False, 'es_alcoholica': False, 'es_premium': True},
        'Jugo de naranja natural': {'factor': 1.10, 'es_agua': False, 'es_alcoholica': False, 'es_premium': True},
        'Agua con gas': {'factor': 1.00, 'es_agua': True, 'es_alcoholica': False, 'es_premium': True},
        'Agua saborizada': {'factor': 0.95, 'es_agua': False, 'es_alcoholica': False, 'es_premium': True},
        'Gaseosa': {'factor': 0.90, 'es_agua': False, 'es_alcoholica': False, 'es_premium': True},
        'Bebidas energéticas': {'factor': 0.85, 'es_agua': False, 'es_alcoholica': False, 'es_premium': True},
        'Leche descremada': {'factor': 1.50, 'es_agua': False, 'es_alcoholica': False, 'es_premium': True},
        'Leche entera': {'factor': 1.10, 'es_agua': False, 'es_alcoholica': False, 'es_premium': True},
        'Chocolatada': {'factor': 1.20, 'es_agua': False, 'es_alcoholica': False, 'es_premium': True},
        'Cerveza': {'factor': 0.50, 'es_agua': False, 'es_alcoholica': True, 'es_premium': True},
        'Vino': {'factor': 0.40, 'es_agua': False, 'es_alcoholica': True, 'es_premium': True},
        'Fernet con cola': {'factor': 0.30, 'es_agua': False, 'es_alcoholica': True, 'es_premium': True},
    }
    
    # Actualizar bebidas gratuitas
    for nombre, datos in bebidas_gratuitas.items():
        Bebida.objects.update_or_create(
            nombre=nombre,
            defaults={
                'factor_hidratacion': datos['factor'],
                'es_agua': datos['es_agua'],
                'es_alcoholica': datos['es_alcoholica'],
                'es_premium': False,
                'activa': True,
            }
        )
    
    # Actualizar bebidas premium
    for nombre, datos in bebidas_premium.items():
        Bebida.objects.update_or_create(
            nombre=nombre,
            defaults={
                'factor_hidratacion': datos['factor'],
                'es_agua': datos.get('es_agua', False),
                'es_alcoholica': datos['es_alcoholica'],
                'es_premium': datos.get('es_premium', True),
                'activa': True,
            }
        )


def reverse_update_bebidas_data(apps, schema_editor):
    """
    Reversa la migración de datos (opcional, para rollback).
    """
    # No hacemos nada en el reverso, ya que no queremos perder datos
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('consumos', '0003_add_alcohol_fields'),
    ]

    operations = [
        migrations.RunPython(update_bebidas_data, reverse_update_bebidas_data),
    ]

