# Fix: Error SMTP con Resend en producción

## 🔥 Solución rápida: Usar SMTP directo (sin TLS)

Django a veces falla con `EMAIL_USE_TLS=True` usando Resend. Prueba con:

```bash
# Editar .env en producción
sudo nano /var/www/jdiaz.tipsterbyte.com/app/backend/.env

# CAMBIAR:
EMAIL_USE_TLS=True

# POR:
EMAIL_USE_TLS=False
EMAIL_USE_SSL=True
```

## 🛠️ Solución alternativa: Deshabilitar notificaciones admin (temporal)

En `backend/blog/services.py` línea 543:

```python
# COMENTAR temporalmente:
# if are_admin_notifications_enabled():
#     send_mail(...)
```

## 🔍 Ver error exacto

```bash
# Traer los últimos 500 logs y buscar el error SMTP
sudo journalctl -u jdiaz_gunicorn.service -n 500 --no-pager | grep -A 10 -B 5 "SMTP\|ConnectionRefusedError\|gaierror"
```

## 📋 Configuración Resend correcta

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=re_tu_api_key_de_resend
DEFAULT_FROM_EMAIL="Tu Nombre <tu@dominio.com>"
```

**Nota:** El error "ConnectionRefusedError" o "gaierror" indica que no puede resolver `smtp.resend.com` - verifica conectividad:
```bash
telnet smtp.resend.com 587