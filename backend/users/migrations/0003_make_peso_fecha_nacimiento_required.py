# Generated manually

from django.db import migrations, models
import django.core.validators
from datetime import date, timedelta


def set_default_fecha_nacimiento(apps, schema_editor):
    """Establece una fecha de nacimiento por defecto para usuarios existentes sin fecha."""
    User = apps.get_model('users', 'User')
    # Para usuarios sin fecha_nacimiento, usar una fecha por defecto (hace 30 años)
    # Esto permite calcular una edad razonable por defecto
    default_date = date.today() - timedelta(days=30*365)
    User.objects.filter(fecha_nacimiento__isnull=True).update(fecha_nacimiento=default_date)


def set_default_peso(apps, schema_editor):
    """Establece un peso por defecto para usuarios existentes sin peso."""
    User = apps.get_model('users', 'User')
    # Peso por defecto: 70 kg (promedio razonable)
    User.objects.filter(peso__isnull=True).update(peso=70.0)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_es_fragil_o_insuficiencia_cardiaca_and_more'),
    ]

    operations = [
        # Establecer valores por defecto para usuarios existentes
        migrations.RunPython(set_default_fecha_nacimiento, migrations.RunPython.noop),
        migrations.RunPython(set_default_peso, migrations.RunPython.noop),
        # Hacer fecha_nacimiento obligatorio
        migrations.AlterField(
            model_name='user',
            name='fecha_nacimiento',
            field=models.DateField(help_text='Fecha de nacimiento del usuario', verbose_name='Fecha de nacimiento'),
        ),
        # Hacer peso obligatorio
        migrations.AlterField(
            model_name='user',
            name='peso',
            field=models.FloatField(help_text='Peso del usuario en kilogramos', validators=[django.core.validators.MinValueValidator(1.0), django.core.validators.MaxValueValidator(500.0)], verbose_name='Peso (kg)'),
        ),
    ]

