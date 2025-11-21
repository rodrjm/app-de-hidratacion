"""
Comando de Django para hacer premium a un usuario.
"""
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Hace premium a un usuario por su username'

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            type=str,
            help='Nombre de usuario a hacer premium'
        )

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
            if user.es_premium:
                self.stdout.write(
                    self.style.WARNING(f'El usuario "{username}" ya es premium')
                )
            else:
                user.es_premium = True
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Usuario "{username}" ahora es premium')
                )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Usuario "{username}" no encontrado')
            )

