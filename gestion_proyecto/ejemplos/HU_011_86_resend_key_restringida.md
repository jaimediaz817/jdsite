# HU-011.86: Resend API key restringida - Solución

## 🔴 Error 401 persistente

La API key `re_iUtcVyLR_LpHBb27Jq4eEhcXHs97nRAS1` está **restringida explícitamente** por Resend, no por dominio.

## 🔧 Solución inmediata

### Opción 1: Nueva API key (gratuita)
```bash
# Ve a resend.com/api-keys
# Crear nueva key → "Full access" o "Sending access: All domains"
```

### Opción 2: Usar email por defecto de Resend (on-demand)
```python
# En .env:
DEFAULT_FROM_EMAIL="onboarding@resend.dev"  # Email genérico de Resend
```

⚠️ **Limitación**: El email "onboarding@resend.dev" es genérico y parece SPAM.

## ✅ Solución actual (emails deshabilitados)

En `backend/blog/services.py`:
```python
if False:  # are_admin_notifications_enabled():
```

El editor **guarda sin errores**.

## 🔗 Referencias

- [Resend API Keys](https://resend.com/api-keys)
- [Resend Domains](https://resend.com/domains)