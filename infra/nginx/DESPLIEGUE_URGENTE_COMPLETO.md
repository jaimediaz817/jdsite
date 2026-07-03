# 🔥 DESPLIEGUE URGENTE - El 403 es CSRF y requiere git pull

## El error "CSRF verification failed" indica que el settings.py NO tiene las actualizaciones

### Ejecuta EN TU VPS estos comandos:

```bash
# 1. Ir al proyecto
cd /var/www/jdiaz.tipsterbyte.com/app

# 2. Verificar si el código está actualizado
git log -1

# 3. Si no está actualizado, hacer git pull
git pull origin main

# 4. Verificar que el settings.py tiene CSRF_TRUSTED_ORIGINS
grep -A5 "CSRF_TRUSTED_ORIGINS" /var/www/jdiaz.tipsterbyte.com/app/backend/jdsite/settings.py

# Debe mostrar:
# CSRF_TRUSTED_ORIGINS = [
#     "https://jaimediaz.dev",
#     "https://www.jaimediaz.dev",
#     ...

# 5. Verificar el .env tiene DJANGO_ENV=production
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep DJANGO_ENV

# 6. Reiniciar Gunicorn
sudo systemctl restart jdiaz_gunicorn.service

# 7. Esperar 3 segundos
sleep 3

# 8. Recargar nginx
sudo systemctl reload nginx
```

---

## Si el settings.py NO tiene CSRF_TRUSTED_ORIGINS (desactualizado):

```bash
# Agregar manualmente al settings.py:
cat >> /var/www/jdiaz.tipsterbyte.com/app/backend/jdsite/settings.py << 'EOF'

# CSRF para HTTPS (crítico en producción)
CSRF_TRUSTED_ORIGINS = [
    "https://jaimediaz.dev",
    "https://www.jaimediaz.dev",
]
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
EOF
```

Luego reinicia:
```bash
sudo systemctl restart jdiaz_gunicorn.service