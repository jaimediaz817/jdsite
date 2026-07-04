# Diagnóstico: Resend SMTP en producción

## 🔍 Verificar conectividad SMTP

```bash
# Verificar DNS
nslookup smtp.resend.com
dig smtp.resend.com

# Verificar puerto 587 está abierto
telnet smtp.resend.com 587
# O si telnet no existe:
nc -zv smtp.resend.com 587

# Verificar firewall (en droplet)
sudo ufw status
```

## 🔧 Solución rápida: Deshabilitar notificaciones admin

Editar `backend/blog/services.py` línea 543:

```python
# CAMBIAR ESTA LÍNEA:
if are_admin_notifications_enabled():

# POR ESTA (temporalmente):
if False:  # are_admin_notifications_enabled() - DESHABILITADO SMTP
```

## 🔁 Reiniciar después del cambio

```bash
sudo systemctl restart jdiaz_gunicorn.service
```

## 📋 Verificar variables .env cargadas

```bash
# Ver si Django las lee correctamente
cd /var/www/jdiaz.tipsterbyte.com/app/backend
python -c "from django.conf import settings; print('EMAIL_HOST:', settings.EMAIL_HOST); print('EMAIL_PORT:', settings.EMAIL_PORT)"
```

---

## ⚠️ Notas importantes

- El error "Unexpected token '<'" indica que el SMTP falla y devuelve HTML de error 500
- El código tiene `fail_silently=True` pero igual falla - posiblemente una excepción no capturada
- Mientras el SMTP no funcione, deshabilitar las notificaciones permite guardar blogs