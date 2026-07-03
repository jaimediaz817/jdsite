# 🔥 PASO A PASO CORRECTO PARA VPS

## El entorno virtual está en `/app/env/` (no `.venv`):

```bash
# 1. Activa el entorno virtual (ruta correcta)
cd /var/www/jdiaz.tipsterbyte.com/app/backend
source /app/env/bin/activate  # O quizás .venv si existe allí

# 2. Usa DJANGO_SETTINGS_MODULE
DJANGO_SETTINGS_MODULE=jdsite.settings python manage.py shell -c "from django.conf import settings; print('ENV:', settings.DJANGO_ENV, '| DEBUG:', settings.DEBUG)"
```

## Verifica el .env ACTUAL:
```bash
# 3. Verifica el .env real (sin activar nada)
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep -E "^DJANGO_ENV|^DEBUG|^ALLOWED_HOSTS"
```

## Si el .env tiene el error del espacio, corrígelo:
```bash
# 4. Corrige el espacio en ALLOWED_HOSTS
sed -i 's/, www\.jaimediaz\.dev/,www.jaimediaz.dev/g' /var/www/jdiaz.tipsterbyte.com/app/backend/.env

# 5. Verifica la corrección
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep ALLOWED_HOSTS
```

## Reinicia los servicios:
```bash
# 6. Reinicia Gunicorn
sudo systemctl restart jdiaz_gunicorn.service

# 7. Espera 2 segundos
sleep 2

# 8. Recarga nginx
sudo systemctl reload nginx
```

## Verifica que funciona:
```bash
# 9. Prueba el registro con Referer
curl -X POST https://jaimediaz.dev/accounts/signup/ \
  -d "username=testuser123&password1=Testpass123&password2=Testpass123" \
  -H "Referer: https://jaimediaz.dev/accounts/signup/" \
  -w "\nHTTP_CODE: %{http_code}\n"