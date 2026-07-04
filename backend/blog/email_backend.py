"""
Resend API Email Backend para DigitalOcean

DigitalOcean bloquea puertos SMTP salientes (25, 587, 465), pero permite HTTPS.
Este backend usa la API REST de Resend en lugar de SMTP.
"""

import requests
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage


class ResendAPIBackend(BaseEmailBackend):
    """Email backend usando Resend API en lugar de SMTP.

    Configuración en .env:
        EMAIL_BACKEND=blog.email_backend.ResendAPIBackend
        EMAIL_HOST_PASSWORD=re_tu_api_key_de_resend
        DEFAULT_FROM_EMAIL="Tu Nombre <tu@dominio.com>"

    La API de Resend usa HTTPS (puerto 443), no SMTP.
    """

    def send_messages(self, email_messages):
        """
        Send one or more EmailMessage objects and return the number
        of email messages sent.
        """
        if not email_messages:
            return 0

        sent_count = 0
        for message in email_messages:
            if self._send(message):
                sent_count += 1

        return sent_count

    def _send(self, message):
        """
        Envía un mensaje usando la API de Resend.
        """
        from django.conf import settings

        api_key = getattr(settings, "EMAIL_HOST_PASSWORD", None)
        if not api_key or not api_key.startswith("re_"):
            if not self.fail_silently:
                raise ValueError(
                    "API key de Resend no configurada en EMAIL_HOST_PASSWORD"
                )
            return False

        url = "https://api.resend.com/emails"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # Preparar datos del email
        data = {
            "from": getattr(settings, "DEFAULT_FROM_EMAIL", message.from_email),
            "to": message.to,
            "subject": message.subject,
            "text": message.body,
        }

        # Agregar reply_to si existe
        if message.reply_to:
            data["reply_to"] = message.reply_to[0]

        # Agregar HTML si existe
        if message.alternatives:
            for content, mimetype in message.alternatives:
                if mimetype == "text/html":
                    data["html"] = content
                    break

        try:
            response = requests.post(url, json=data, headers=headers, timeout=30)

            if response.status_code == 200:
                return True
            elif response.status_code == 201:
                return True
            else:
                if not self.fail_silently:
                    raise ConnectionError(
                        f"Resend API error {response.status_code}: {response.text}"
                    )
                return False

        except requests.exceptions.RequestException as e:
            if not self.fail_silently:
                raise
            return False
