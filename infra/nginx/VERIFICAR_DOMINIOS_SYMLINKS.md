# 🔍 VERIFICAR DOMINIOS Y SYMLINKS EN TU VPS

Ejecuta ESTOS comandos **en tu VPS**:

```bash
# 1. ¿Qué symlinks tienes?
ls -la /etc/nginx/sites-enabled/

# 2. Verifica el .env REAL
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep -E "^DJANGO_ENV|^DEBUG|^ALLOWED_HOSTS"

# 3. Verifica con Python (ruta correcta del venv)
cd /var/www/jdiaz.tipsterbyte.com/app/backend
DJANGO_SETTINGS_MODULE=jdsite.settings /app/env/bin/python -c "from django.conf import settings; print('ENV:', settings.DJANGO_ENV, '| DEBUG:', settings.DEBUG, '| ALLOWED_HOSTS:', settings.ALLOWED_HOSTS)"