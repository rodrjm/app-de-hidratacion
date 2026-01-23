# Generated manually for adding subscription management fields to User model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_user_plan_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='preapproval_id',
            field=models.CharField(
                blank=True,
                help_text='ID de la suscripción en Mercado Pago (solo para planes recurrentes)',
                max_length=255,
                null=True,
                verbose_name='ID de Preapproval'
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='auto_renewal',
            field=models.BooleanField(
                default=True,
                help_text='Indica si la suscripción se renueva automáticamente',
                verbose_name='Renovación Automática'
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='subscription_end_date',
            field=models.DateField(
                blank=True,
                help_text='Fecha en que termina el período pagado de la suscripción',
                null=True,
                verbose_name='Fecha de Fin de Suscripción'
            ),
        ),
    ]
