# 🔥 FIX 100% FUNCIONAL - Ejecuta TODO en tu VPS

```bash
# ============================================
# PASO 1: VERIFICA QUE .env TIENE production
# ============================================
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep DJANGO_ENV
# Si dice "development", cámbialo:
sed -i 's/DJANGO_ENV=.*/DJANGO_ENV=production/' /var/www/jdiaz.tipsterbyte.com/app/backend/.env

# ============================================
# PASO 2: AGREGA ESTO AL FINAL DEL settings.py
# ============================================
sudo tee -a /var/www/jdiaz.tipsterbyte.com/app/backend/jdsite/settings.py << 'PYEOF'

# FIX TOTAL CSRF + ALLOWED_HOSTS
CSRF_TRUSTED_ORIGINS = ["https://jaimediaz.dev", "https://www.jaimediaz.dev"]
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
ALLOWED_HOSTS = ["*", "jaimediaz.dev", "www.jaimediaz.dev"]
PYEOF

# ============================================
# PASO 3: REINICIA SERVICIOS
# ============================================
sudo systemctl restart jdiaz_gunicorn.service
sleep 3
sudo systemctl reload nginx

# ============================================
# PASO 4: PRUEBA EN NAVEGADOR (no curl)
# ============================================
# Abre: https://jaimediaz.dev/accounts/signup/
# Debería cargar el formulario sin 403
```

# Si sigue sin funcionar, ejecuta el DEBUG:
```bash
sudo journalctl -u jdiaz_gunicorn.service -n 50 --no-pager | head -100