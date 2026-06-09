"""
Comando para probar el sistema de notificaciones por email del blog.

Uso:
    python manage.py test_email_notifications                    # Probar ambos flujos
    python manage.py test_email_notifications --flow=admin       # Solo email al admin (borrador)
    python manage.py test_email_notifications --flow=author      # Solo email al autor (aprobación)
    python manage.py test_email_notifications --dry-run          # Solo mostrar qué se enviaría
"""

from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from blog.models import BlogPost, BlogEmailConfig


class Command(BaseCommand):
    help = "Prueba el sistema de notificaciones por email del blog"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flow",
            type=str,
            choices=["admin", "author", "both"],
            default="both",
            help="Flujo a probar: admin (borrador), author (aprobación), both (ambos)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Solo mostrar qué se enviaría, sin enviar realmente",
        )
        parser.add_argument(
            "--author-email",
            type=str,
            default=None,
            help="Email del autor para la prueba (si no se provee, busca uno en la BD)",
        )

    def handle(self, *args, **options):
        flow = options["flow"]
        dry_run = options["dry_run"]

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("📧 PRUEBA DE NOTIFICACIONES POR EMAIL")
        self.stdout.write("=" * 60)

        # 1. Verificar configuración de emails
        self._check_email_config()

        # 2. Verificar estado del interruptor
        self._check_switch_status()

        # 3. Verificar configuración SMTP
        self._check_smtp_config()

        # 4. Ejecutar flujo solicitado
        if flow in ("admin", "both"):
            self._test_admin_notification(dry_run)

        if flow in ("author", "both"):
            self._test_author_notification(dry_run, options.get("author_email"))

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("✅ PRUEBA COMPLETADA")
        self.stdout.write("=" * 60)

    def _check_email_config(self):
        """Verificar la configuración del interruptor de emails."""
        self.stdout.write(
            "\n📋 1. CONFIGURACIÓN DEL INTERRUPTOR (BlogEmailConfig)"
        )
        self.stdout.write("-" * 50)

        config = BlogEmailConfig.get_config()
        self.stdout.write(
            f"   Admin notifications:  {'🟢 ACTIVADAS' if config.admin_notifications_enabled else '🔴 DESACTIVADAS'}"
        )
        self.stdout.write(
            f"   Author notifications: {'🟢 ACTIVADAS' if config.author_notifications_enabled else '🔴 DESACTIVADAS'}"
        )
        self.stdout.write(f"   Último cambio: {config.updated_at}")

        if not config.admin_notifications_enabled:
            self.stdout.write(
                self.style.WARNING(
                    "   ⚠️  Las notificaciones al admin están DESACTIVADAS. "
                    "No se enviarán emails de nuevos borradores."
                )
            )
        if not config.author_notifications_enabled:
            self.stdout.write(
                self.style.WARNING(
                    "   ⚠️  Las notificaciones al autor están DESACTIVADAS. "
                    "No se enviarán emails de aprobación/rechazo."
                )
            )

    def _check_switch_status(self):
        """Verificar estado del interruptor."""
        self.stdout.write("\n📋 2. ESTADO DEL INTERRUPTOR")
        self.stdout.write("-" * 50)

        config = BlogEmailConfig.get_config()
        self.stdout.write(
            f"   admin_notifications_enabled: {config.admin_notifications_enabled}"
        )
        self.stdout.write(
            f"   author_notifications_enabled: {config.author_notifications_enabled}"
        )

    def _check_smtp_config(self):
        """Verificar configuración SMTP."""
        self.stdout.write("\n📋 3. CONFIGURACIÓN SMTP")
        self.stdout.write("-" * 50)

        backend = settings.EMAIL_BACKEND
        self.stdout.write(f"   EMAIL_BACKEND: {backend}")

        if "console" in backend:
            self.stdout.write(
                self.style.WARNING(
                    "   ⚠️  Estás en modo CONSOLA. Los emails se imprimirán en terminal "
                    "en lugar de enviarse realmente."
                )
            )
        elif "smtp" in backend.lower() or "resend" in backend.lower():
            self.stdout.write(
                f"   EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'No configurado')}"
            )
            self.stdout.write(
                f"   EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'No configurado')}"
            )
            self.stdout.write(
                f"   EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'No configurado')}"
            )
            self.stdout.write(
                f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}"
            )

        self.stdout.write(f"   OWNER_EMAIL: {settings.OWNER_EMAIL}")
        self.stdout.write(f"   SITE_URL: {settings.SITE_URL}")

    def _test_admin_notification(self, dry_run):
        """Probar envío de email al admin (flujo de borrador)."""
        self.stdout.write("\n📧 4. PRUEBA: Email al admin (nuevo borrador)")
        self.stdout.write("-" * 50)

        config = BlogEmailConfig.get_config()
        if not config.admin_notifications_enabled:
            self.stdout.write(
                self.style.WARNING(
                    "   ⏭️  Saltado: notificaciones al admin desactivadas"
                )
            )
            return

        subject = (
            "[JD Blog] [PRUEBA] Nuevo borrador pendiente: Artículo de prueba"
        )
        message = (
            "📝 Esta es una PRUEBA del sistema de notificaciones.\n\n"
            "Si recibes este email, el sistema de notificación de borradores "
            "está funcionando correctamente.\n\n"
            f"Fecha de prueba: {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}\n"
            f"Sitio: {settings.SITE_URL}\n"
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING("   🔍 DRY RUN - No se enviará email real")
            )
            self.stdout.write(f"   Para: {settings.OWNER_EMAIL}")
            self.stdout.write(f"   Asunto: {subject}")
            self.stdout.write(f"   Mensaje: {message[:100]}...")
        else:
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.OWNER_EMAIL],
                    fail_silently=False,
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"   ✅ Email enviado exitosamente a {settings.OWNER_EMAIL}"
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"   ❌ Error al enviar email: {e}")
                )

    def _test_author_notification(self, dry_run, author_email=None):
        """Probar envío de email al autor (flujo de aprobación)."""
        self.stdout.write("\n📧 5. PRUEBA: Email al autor (artículo aprobado)")
        self.stdout.write("-" * 50)

        config = BlogEmailConfig.get_config()
        if not config.author_notifications_enabled:
            self.stdout.write(
                self.style.WARNING(
                    "   ⏭️  Saltado: notificaciones al autor desactivadas"
                )
            )
            return

        # Buscar un email de autor para la prueba
        if not author_email:
            # Buscar un post con autor que tenga email
            post_with_author = (
                BlogPost.objects.filter(author__email__isnull=False)
                .exclude(author__email="")
                .first()
            )

            if post_with_author:
                author_email = post_with_author.author.email
                self.stdout.write(
                    f"   Usando email del autor del post '{post_with_author.title}': {author_email}"
                )
            else:
                # Usar el email del admin como fallback
                author_email = settings.OWNER_EMAIL
                self.stdout.write(
                    self.style.WARNING(
                        "   ⚠️  No se encontró autor con email. Usando OWNER_EMAIL como destino."
                    )
                )

        subject = "[JD Blog] [PRUEBA] Tu artículo 'Artículo de prueba' ha sido publicado"
        message = (
            "📝 Esta es una PRUEBA del sistema de notificaciones.\n\n"
            "Si recibes este email, el sistema de notificación de aprobación "
            "de artículos está funcionando correctamente.\n\n"
            f"Fecha de prueba: {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}\n"
            f"Sitio: {settings.SITE_URL}\n"
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING("   🔍 DRY RUN - No se enviará email real")
            )
            self.stdout.write(f"   Para: {author_email}")
            self.stdout.write(f"   Asunto: {subject}")
            self.stdout.write(f"   Mensaje: {message[:100]}...")
        else:
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[author_email],
                    fail_silently=False,
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"   ✅ Email enviado exitosamente a {author_email}"
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"   ❌ Error al enviar email: {e}")
                )
