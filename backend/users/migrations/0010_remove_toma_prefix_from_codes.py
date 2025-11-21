from django.db import migrations
import string
import secrets


def generate_unique_code(UserModel):
    caracteres = string.ascii_uppercase + string.digits
    while True:
        codigo = ''.join(secrets.choice(caracteres) for _ in range(8))
        if not UserModel.objects.filter(codigo_referido=codigo).exists():
            return codigo


def remove_toma_prefix(apps, schema_editor):
    User = apps.get_model('users', 'User')
    usuarios = User.objects.filter(codigo_referido__startswith='TOMA_')

    for usuario in usuarios.iterator():
        codigo_actual = usuario.codigo_referido or ''

        # Intentar reutilizar el sufijo sin el prefijo
        nuevo_codigo = codigo_actual[5:] if len(codigo_actual) > 5 else ''

        # Validar que sea alfanumérico y de longitud 8
        if len(nuevo_codigo) != 8 or not nuevo_codigo.isalnum():
            nuevo_codigo = generate_unique_code(User)
        else:
            # Verificar que no exista duplicado (excluyendo al propio usuario)
            duplicado = (
                User.objects
                .filter(codigo_referido=nuevo_codigo)
                .exclude(pk=usuario.pk)
                .exists()
            )
            if duplicado:
                nuevo_codigo = generate_unique_code(User)

        usuario.codigo_referido = nuevo_codigo
        usuario.save(update_fields=['codigo_referido'])


def revert_prefix(apps, schema_editor):
    User = apps.get_model('users', 'User')
    usuarios = User.objects.exclude(codigo_referido__startswith='TOMA_')

    for usuario in usuarios.iterator():
        codigo_actual = usuario.codigo_referido or ''
        usuario.codigo_referido = f"TOMA_{codigo_actual}"
        usuario.save(update_fields=['codigo_referido'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_fix_zero_meta'),
    ]

    operations = [
        migrations.RunPython(remove_toma_prefix, revert_prefix),
    ]

