# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('actividades', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='actividad',
            name='tipo_actividad',
            field=models.CharField(
                max_length=30,
                choices=[
                    ('correr', 'Correr'),
                    ('ciclismo', 'Ciclismo'),
                    ('natacion', 'Natación'),
                    ('futbol_rugby', 'Fútbol / Rugby'),
                    ('baloncesto_voley', 'Baloncesto / Vóley'),
                    ('gimnasio', 'Gimnasio'),
                    ('crossfit_hiit', 'CrossFit / Entrenamiento HIIT'),
                    ('padel_tenis', 'Pádel / Tenis'),
                    ('baile_aerobico', 'Baile aeróbico'),
                    ('caminata_rapida', 'Caminata rápida'),
                    ('pilates', 'Pilates'),
                    ('caminata', 'Caminata'),
                    ('yoga_hatha', 'Yoga (Hatha/Suave)'),
                    ('yoga_bikram', 'Yoga (Bikram/Caliente)'),
                ],
                verbose_name='Tipo de actividad',
                help_text='Tipo de actividad física realizada'
            ),
        ),
    ]

