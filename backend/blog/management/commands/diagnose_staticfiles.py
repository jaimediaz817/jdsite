import os
import subprocess
from pathlib import Path
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Diagnostica problemas de permisos en staticfiles"

    def handle(self, *args, **options):
        base = Path("/var/www/jdiaz.tipsterbyte.com/app/backend")

        self.stdout.write("\n=== DIAGNÓSTICO DE PERMISOS ===\n")

        # 1. Verificar archivo problemático
        target = base / "staticfiles" / "procedimiento.md"
        if target.exists():
            stat = target.stat()
            self.stdout.write(f"📄 {target}")
            self.stdout.write(f"   Dueño: {stat.st_uid} | Grupo: {stat.st_gid}")
            self.stdout.write(f"   Permisos: {oct(stat.st_mode)[-3:]}")

            # Intentar borrar como usuario actual
            try:
                os.remove(target)
                self.stdout.write(self.style.SUCCESS("   ✓ Se pudo borrar"))
            except PermissionError:
                self.stdout.write(
                    self.style.ERROR("   ✗ No se pudo borrar (PermissionError)")
                )
        else:
            self.stdout.write(f"✓ {target} no existe")

        # 2. Verificar carpeta staticfiles
        staticfiles_dir = base / "staticfiles"
        if staticfiles_dir.exists():
            stat = staticfiles_dir.stat()
            self.stdout.write(f"\n📁 {staticfiles_dir}")
            self.stdout.write(f"   Dueño: {stat.st_uid} | Grupo: {stat.st_gid}")
            self.stdout.write(f"   Permisos: {oct(stat.st_mode)[-3:]}")

        # 3. Contar archivos y permisos
        self.stdout.write("\n=== ARCHIVOS EN STATICFILES ===\n")
        try:
            for item in staticfiles_dir.iterdir():
                if item.is_file():
                    stat = item.stat()
                    self.stdout.write(
                        f"{item.name}: {oct(stat.st_mode)[-3:]} (uid:{stat.st_uid} gid:{stat.st_gid})"
                    )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))

        # 4. Verificar quién ejecuta Django
        self.stdout.write("\n=== USUARIO ACTUAL ===")
        import getpass

        user = getpass.getuser()
        self.stdout.write(f"Usuario actual: {user}")

        # 5. Sugerir solución
        self.stdout.write("\n=== SOLUCIÓN ===")
        self.stdout.write("Ejecutá estos comandos en la VPS:\n")
        self.stdout.write(
            "sudo chown -R www-data:www-data /var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles"
        )
        self.stdout.write(
            "sudo chmod -R 2775 /var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles"
        )
        self.stdout.write(
            "sudo -u www-data env/bin/python manage.py collectstatic --noinput --clear"
        )
