from django.db import migrations


def recalcular_metas(apps, schema_editor):
    User = apps.get_model('users', 'User')
    from datetime import date

    for user in User.objects.all():
        if not user.peso or not user.fecha_nacimiento:
            continue

        today = date.today()
        edad = today.year - user.fecha_nacimiento.year
        if (today.month, today.day) < (user.fecha_nacimiento.month, user.fecha_nacimiento.day):
            edad -= 1

        peso_kg = user.peso

        if edad <= 13:
            if peso_kg <= 10:
                ml_por_kg = 100
            elif peso_kg <= 20:
                ml_por_kg = 50
            else:
                ml_por_kg = 20
        elif edad <= 65:
            if edad <= 50:
                ml_por_kg = 32.5
            else:
                ml_por_kg = 27.5
        else:
            ml_por_kg = 20 if getattr(user, 'es_fragil_o_insuficiencia_cardiaca', False) else 25

        meta = int(peso_kg * ml_por_kg)
        meta = int(meta * 0.80)
        meta = max(100, min(meta, 10000))

        user.meta_diaria_ml = meta
        user.save(update_fields=['meta_diaria_ml'])


def revert_metas(apps, schema_editor):
    # No es necesario revertir; dejar valores actuales
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_auto_20251114_1110'),
    ]

    operations = [
        migrations.RunPython(recalcular_metas, revert_metas),
    ]

