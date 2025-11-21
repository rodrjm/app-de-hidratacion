# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('consumos', '0002_add_performance_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='bebida',
            name='es_alcoholica',
            field=models.BooleanField(
                default=False,
                help_text='Indica si la bebida es alcohólica (tiene impacto negativo en el balance hídrico)',
                verbose_name='Es Alcohólica'
            ),
        ),
        migrations.AddField(
            model_name='consumo',
            name='deshidratacion_neta_ml',
            field=models.IntegerField(
                default=0,
                help_text='Cantidad de deshidratación neta para bebidas alcohólicas (negativo indica pérdida de hidratación)',
                verbose_name='Deshidratación neta (ml)'
            ),
        ),
        migrations.AddField(
            model_name='consumo',
            name='agua_compensacion_recomendada_ml',
            field=models.PositiveIntegerField(
                default=0,
                help_text='Cantidad de agua pura recomendada para compensar la deshidratación neta',
                verbose_name='Agua de compensación recomendada (ml)'
            ),
        ),
    ]

