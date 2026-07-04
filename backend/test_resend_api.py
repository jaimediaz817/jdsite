"""
Test script para verificar Resend API backend en local.
Ejecutar desde backend/: source .venv/bin/activate && python test_resend_api.py
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("=" * 60)
print("🧪 Test Resend API Backend")
print("=" * 60)

print(f"\nEMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(
    f"EMAIL_HOST_PASSWORD: {settings.EMAIL_HOST_PASSWORD[:10]}..."
    if settings.EMAIL_HOST_PASSWORD
    else "No configurado"
)
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

# Test sin enviar realmente
try:
    # Importar el backend
    from blog.email_backend import ResendAPIBackend

    print(f"\n✅ Backend ResendAPIBackend importado correctamente")

    # Verificar que la API key es válida
    api_key = settings.EMAIL_HOST_PASSWORD
    if api_key and api_key.startswith("re_"):
        print(f"✅ API key configurada (empieza con re_)")
    else:
        print(f"⚠️ API key no configurada o inválida")

except Exception as e:
    print(f"\n❌ Error importando backend: {e}")

# Test real (solo si se confirma)
if input("\n¿Enviar email de prueba? (y/N): ").lower() == "y":
    try:
        result = send_mail(
            subject="Test Resend API",
            message="Esta es una prueba del backend usando Resend API",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["jdsolutions817@gmail.com"],
            fail_silently=False,
        )
        print(f"✅ Email enviado: {result}")
    except Exception as e:
        print(f"❌ Error enviando email: {e}")

print("\n" + "=" * 60)
