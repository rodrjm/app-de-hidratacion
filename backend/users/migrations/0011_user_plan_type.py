# Generated manually for adding plan_type field to User model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_remove_toma_prefix_from_codes'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='plan_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('monthly', 'Mensual'),
                    ('annual', 'Anual'),
                    ('lifetime', 'De por vida'),
                ],
                help_text='Tipo de plan premium del usuario (solo para usuarios premium)',
                max_length=20,
                null=True,
                verbose_name='Tipo de Plan'
            ),
        ),
    ]

