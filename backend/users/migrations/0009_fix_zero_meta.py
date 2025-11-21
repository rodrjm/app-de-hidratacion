from django.db import migrations


def asegurar_metas_no_nulas(apps, schema_editor):
    """
    Asegura que ningún usuario tenga meta_diaria_ml en cero o nula.
    Recalcula cuando haya datos suficientes y, si no,
    asigna un valor seguro por defecto (2000 ml).
    """
    User = apps.get_model('users', 'User')
    from datetime import date

    for user in User.objects.filter(meta_diaria_ml__lte=0):
        meta = 2000  # valor seguro por defecto

        if user.peso and user.peso > 0 and user.fecha_nacimiento:
            hoy = date.today()
            edad = hoy.year - user.fecha_nacimiento.year
            if (hoy.month, hoy.day) < (user.fecha_nacimiento.month, user.fecha_nacimiento.day):
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
                ml_por_kg = 32.5 if edad <= 50 else 27.5
            else:
                es_fragil = getattr(user, 'es_fragil_o_insuficiencia_cardiaca', False)
                ml_por_kg = 20 if es_fragil else 25

            meta = int(peso_kg * ml_por_kg)
            meta = int(meta * 0.80)
            meta = max(500, min(meta, 10000))

        user.meta_diaria_ml = meta
        user.save(update_fields=['meta_diaria_ml'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_recalculate_meta_diaria'),
    ]

    operations = [
        migrations.RunPython(asegurar_metas_no_nulas, migrations.RunPython.noop),
    ]

