"""
Management command para backfillear registration_source a usuarios existentes.

Recorre todos los usuarios y asigna la fuente de registro retroactivamente
basándose en:
1. Si tiene SocialAccount con provider='google' → 'google'
2. Si tiene SocialAccount con provider='github' → 'github'
3. Si es staff/superuser y no tiene SocialAccount → 'admin'
4. En cualquier otro caso → 'basic'

Uso:
    python manage.py backfill_registration_source
    python manage.py backfill_registration_source --dry-run  # Solo muestra lo que haría
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialAccount
from core.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Backfillea registration_source a usuarios existentes"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Solo muestra lo que haría sin escribir en BD",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        created_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        users = User.objects.all().order_by("id")
        total = users.count()
        self.stdout.write(f"Procesando {total} usuarios...")

        for user in users:
            try:
                # Determinar source
                social_accounts = SocialAccount.objects.filter(user=user)
                if social_accounts.exists():
                    # Usar el primer SocialAccount como fuente
                    provider = social_accounts.first().provider
                    if provider == "google":
                        source = "google"
                    elif provider == "github":
                        source = "github"
                    else:
                        source = (
                            provider  # Proveedor desconocido, usarlo tal cual
                        )
                elif user.is_staff or user.is_superuser:
                    source = "admin"
                else:
                    source = "basic"

                # Crear o actualizar UserProfile
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={"registration_source": source},
                )

                if created:
                    created_count += 1
                    action = "CREADO"
                elif profile.registration_source != source:
                    if not dry_run:
                        profile.registration_source = source
                        profile.save(update_fields=["registration_source"])
                    updated_count += 1
                    action = "ACTUALIZADO"
                else:
                    skipped_count += 1
                    action = "SALTADO"

                if dry_run and action != "SALTADO":
                    self.stdout.write(
                        f"  [{action}] User #{user.id} {user.username} → {source}"
                    )

            except Exception as e:
                errors.append(f"User #{user.id} {user.username}: {e}")
                self.stderr.write(
                    self.style.ERROR(f"  ERROR: User #{user.id}: {e}")
                )

        # Resumen
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("RESUMEN:")
        self.stdout.write(f"  Total usuarios: {total}")
        self.stdout.write(f"  Perfiles creados: {created_count}")
        self.stdout.write(f"  Perfiles actualizados: {updated_count}")
        self.stdout.write(f"  Perfiles ya correctos: {skipped_count}")

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "\n⚠️  DRY RUN: No se escribieron cambios en BD."
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS("\n✅ Backfill completado."))

        if errors:
            self.stdout.write(self.style.ERROR(f"\n❌ {len(errors)} error(es):"))
            for err in errors:
                self.stdout.write(self.style.ERROR(f"  - {err}"))
