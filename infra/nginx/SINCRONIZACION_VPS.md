# 🔥 SINCRONIZACIÓN VPS - El código está DESACTUALIZADO

## El settings.py y urls.py de tu VPS NO coinciden con el repositorio

### EJECUTA EN TU VPS:

```bash
# 1. Verifica que el código está actualizado
cd /var/www/jdiaz.tipsterbyte.com/app
git status

# 2. Si hay cambios pendientes, reinstala desde cero:
git fetch origin
git reset --hard origin/main

# 3. Verifica .env tiene production
cd /var/www/jdiaz.tipsterbyte.com/app/backend
grep "^DJANGO_ENV" .env
# Debe decir: DJANGO_ENV=production

# 4. Reinicia los servicios
sudo systemctl restart jdiaz_gunicorn.service
sleep 3
sudo systemctl reload nginx
```

# Si prefieres NO usar git, copia manualmente:
```bash
# Asegúrate que el urls.py tiene esta línea SIN #:
# path("accounts/", include("allauth.urls")),

# Y que el settings.py tiene esto AL FINAL (sin condicionales):
CSRF_TRUSTED_ORIGINS = ["https://jaimediaz.dev", "https://www.jaimediaz.dev"]
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
ALLOWED_HOSTS = ["*", "jaimediaz.dev", "www.jaimediaz.dev"]