#!/bin/bash
# 🔥 DEBUG COMPLETO - Ejecutar en VPS

echo "=== 1. Verifica .env ==="
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep -E "^DJANGO_ENV|^DEBUG|^ALLOWED_HOSTS"

echo ""
echo "=== 2. Verifica CSRF en settings.py ==="
grep -A5 "CSRF_TRUSTED_ORIGINS" /var/www/jdiaz.tipsterbyte.com/app/backend/jdsite/settings.py || echo "NO TIENE CSRF"

echo ""
echo "=== 3. Logs de Gunicorn (últimos errores) ==="
sudo journalctl -u jdiaz_gunicorn.service -n 30 --no-pager | grep -i "error\|csrf\|forbidden\|exception" || echo "Sin errores recientes"

echo ""
echo "=== 4. ¿Qué dominios están en sites-enabled? ==="
ls -la /etc/nginx/sites-enabled/

echo ""
echo "=== 5. Prueba GET simple ==="
curl -s -o /dev/null -w "HTTP_CODE: %{http_code}\n" https://jaimediaz.dev/accounts/signup/