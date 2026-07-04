# HU-011.85: Usar API de Resend en lugar de SMTP

## 🤯 Problema en DigitalOcean

DigitalOcean **bloquea puertos SMTP salientes (25, 587, 465)**. La API HTTP de Resend (puerto 443) funciona perfecto.

## 📁 Estructura de archivos

```
backend/
├── blog/
│   ├── services.py          # Función send_blog_notification()
│   ├── email_backend.py     # NUEVO: Email backend usando Resend API
│   └── templates/
│       └── emails/
│           └── notification_email.txt
```

## 🔧 Solución: Usar Resend API (HTTP)

### Opción 1: Backend personalizado (recomendado)

Crear `backend/blog/email_backend.py`:

```python
# backend/blog/email_backend.py
import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

class ResendAPIBackend(BaseEmailBackend):
    """Email backend usando Resend API en lugar de SMTP.
    
    DigitalOcean bloquea SMTP saliente, pero permite HTTP/HTTPS.
    """
    
    def send_messages(self, email_messages):
        sent = 0
        for message in email_messages:
            if self._send(message):
                sent += 1
        return sent
    
    def _send(self, message):
        api_key = settings.EMAIL_HOST_PASSWORD  # re_xxxxx
        if not api_key:
            return False
        
        # Resend API endpoint
        url = "https://api.resend.com/v1/emails"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": message.to,
            "subject": message.subject,
            "text": message.body,
        }
        
        # Agregar reply_to si existe
        if hasattr(message, 'reply_to') and message.reply_to:
            data["reply_to"] = message.reply_to[0]
        
        try:
            response = requests.post(url, json=data, headers=headers, timeout=30)
            return response.status_code == 200
        except Exception as e:
            if not self.fail_silently:
                raise
            return False
```

### Opción 2: Modificar .env prod

```bash
# En producción (.env):
EMAIL_BACKEND=blog.email_backend.ResendAPIBackend
# El EMAIL_HOST y EMAIL_PORT NO se usan con este backend
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=re_tu_api_key_de_resend
DEFAULT_FROM_EMAIL="Jaime Diaz <contacto@jaimediaz.dev>"
```

### Opción 3: Deshabilitar temporalmente emails

En `backend/blog/services.py` línea 543:
```python
# CAMBIAR:
if are_admin_notifications_enabled():

# POR:
if False:  # TEMP: SMTP bloqueado en DigitalOcean
```

## ✅ Testing local

```bash
# Activar entorno virtual
cd /ruta/proyecto/backend
source .venv/bin/activate

# Probar desde shell de Django
python manage.py shell

>>> from django.core.mail import send_mail
>>> send_mail("Test", "Contenido", "contacto@jaimediaz.dev", ["test@email.com"])
```

## 📋 Verificar en VPS

```bash
# Ver puertos abiertos
sudo netstat -tuln | grep -E ":(25|587|465|443)"
# Si no aparecen, están bloqueados

# Ver conectividad SMTP (fallará)
telnet smtp.resend.com 587
# Ver conectividad API (debe funcionar)
curl -I https://api.resend.com/v1/emails
```

## 🔗 Referencias

- [Resend API Docs](https://resend.com/docs/api-reference)
- [Django Custom Email Backends](https://docs.djangoproject.com/en/4.2/topics/email/#writing-an-email-backend)