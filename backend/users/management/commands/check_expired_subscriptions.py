"""
Comando de Django para verificar y desactivar suscripciones premium expiradas.
Este comando debe ejecutarse periódicamente (ej: con cron o Celery) para limpiar usuarios vencidos.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User


class Command(BaseCommand):
    help = 'Verifica y desactiva usuarios premium cuya suscripción ha expirado'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Ejecuta el comando sin hacer cambios reales (solo muestra qué haría)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now().date()
        
        # Buscar usuarios premium con subscription_end_date vencida
        expired_users = User.objects.filter(
            es_premium=True,
            subscription_end_date__lt=now
        ).exclude(
            subscription_end_date__isnull=True
        )
        
        count = expired_users.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No se encontraron usuarios con suscripciones expiradas.')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'[DRY RUN] Se encontrarían {count} usuario(s) con suscripción expirada:'
                )
            )
            for user in expired_users:
                self.stdout.write(
                    f'  - {user.username} ({user.email}) - Expiró: {user.subscription_end_date}'
                )
            return
        
        # Desactivar usuarios expirados
        updated_count = 0
        for user in expired_users:
            user.es_premium = False
            user.preapproval_id = None
            user.save(update_fields=['es_premium', 'preapproval_id'])
            updated_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Usuario "{user.username}" ({user.email}) desactivado. '
                    f'Fecha de expiración: {user.subscription_end_date}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Proceso completado: {updated_count} usuario(s) desactivado(s).'
            )
        )
