# DIAG-006: Resend API key restringida (Error 401)

## 🔴 Error:
```
Resend API error 401: {"statusCode":401,"message":"This API key is restricted to only send emails","name":"restricted_api_key"}
```

## 🎯 Causas posibles:
1. **El dominio no está verificado** en Resend (requiere DNS)
2. **El email "from" debe ser del dominio verificado** (`contacto@jaimediaz.dev`)
3. **La API key podría estar rotada/revocada**

## 🔧 Solución inmediata (deshabilitar emails):

En `backend/blog/services.py` línea 543:
```python
# CAMBIAR:
if are_admin_notifications_enabled():

# POR:
if False:  # RESUELTO: 2026-07-04 - API key restringida en Resend
```

## 🔍 Verificación posterior:

1. **Ve a resend.com/domains** - verifica que `jaimediaz.dev` tenga ✅ verde
2. **Ve a resend.com/api-keys** - crea nueva key si es necesario
3. **Verifica el FROM en .env**:
```bash
DEFAULT_FROM_EMAIL="Jaime Diaz <contacto@jaimediaz.dev>"
```

## ✅ Configuración final para .env (cuando arregles Resend):

```bash
EMAIL_BACKEND=blog.email_backend.ResendAPIBackend
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=re_tu_api_key
DEFAULT_FROM_EMAIL="Jaime Diaz <contacto@jaimediaz.dev>"
REPLY_TO_EMAIL="jdsolutions817@gmail.com"
```

---

**Después de corregir, ejecuta**:
```bash
sudo systemctl restart jdiaz_gunicorn.service