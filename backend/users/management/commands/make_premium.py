"""
Comando de Django para hacer premium a un usuario.
"""
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Hace premium a un usuario por username o por email'

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            nargs='?',
            type=str,
            help='Nombre de usuario a hacer premium'
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email del usuario a hacer premium (alternativa a username)'
        )

    def handle(self, *args, **options):
        email = options.get('email')
        username = options.get('username')
        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Usuario con email "{email}" no encontrado')
                )
                return
        elif username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Usuario "{username}" no encontrado')
                )
                return
        else:
            self.stdout.write(
                self.style.ERROR('Indica username o --email <email>')
            )
            return
        if user.es_premium:
            self.stdout.write(
                self.style.WARNING(f'El usuario "{user.email}" ya es premium')
            )
        else:
            user.es_premium = True
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Usuario "{user.email}" ahora es premium')
            )

