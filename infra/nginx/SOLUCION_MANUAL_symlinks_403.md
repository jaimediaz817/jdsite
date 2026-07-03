# 🛠️ SOLUCIÓN MANUAL: Problemas con symlinks y error 403

## 📍 PARTE 1: Eliminar symlinks de nginx

### Comandos para ejecutar DIRECTAMENTE en la VPS:

```bash
# 1. Ver los archivos actuales (ver qué tipo son)
ls -la /etc/nginx/sites-enabled/

# 2. Si son symlinks y tienes error de permisos, usa ESTOS comandos:
sudo rm -fv /etc/nginx/sites-enabled/tipsterbyte.com
sudo rm -fv /etc/nginx/sites-enabled/test.tipsterbyte.com  
sudo rm -fv /etc/nginx/sites-enabled/jdiaz.tipsterbyte.com

# 3. Si persiste el error de permisos, fuerza con:
sudo rm -f -- /etc/nginx/sites-enabled/tipsterbyte.com
sudo rm -f -- /etc/nginx/sites-enabled/test.tipsterbyte.com
sudo rm -f -- /etc/nginx/sites-enabled/jdiaz.tipsterbyte.com

# 4. Alternativa: mover a /tmp en vez de borrar
sudo mv /etc/nginx/sites-enabled/tipsterbyte.com /tmp/
sudo mv /etc/nginx/sites-enabled/test.tipsterbyte.com /tmp/
sudo mv /etc/nginx/sites-enabled/jdiaz.tipsterbyte.com /tmp/

# 5. Verifica que solo quede jaimediaz.dev
ls -la /etc/nginx/sites-enabled/
```

---

## 📍 PARTE 2: Arreglar el error 403 CSRF

### En la VPS, ejecuta estos comandos:

```bash
# 1. Verifica el .env ACTUAL en producción
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep -E "DJANGO_ENV|DEBUG|ALLOWED_HOSTS"

# 2. El ALLOWED_HOSTS TIENE ERROR - hay espacio antes de www:
# MAL: ALLOWED_HOSTS=jdiaz.tipsterbyte.com,jaimediaz.dev, www.jaimediaz.dev,jdiaz.tipsterbyte.com
# BIEN: ALLOWED_HOSTS=jdiaz.tipsterbyte.com,jaimediaz.dev,www.jaimediaz.dev

# 3. Verifica security-headers.conf (el Referrer-Policy está bloqueando el Referer)
cat /etc/nginx/snippets/security-headers.conf

# Debe tener o comentar Referrer-Policy:
# Referrer-Policy no-referrer-when-downgrade  # ✅ PERMITE el header Referer
```

### 3. Reinicia servicios:

```bash
sudo systemctl restart jdiaz_gunicorn.service
sudo systemctl reload nginx

# Verifica que Gunicorn está OK:
sudo systemctl status jdiaz_gunicorn.service --no-pager
```

---

## 📍 PARTE 3: Verificar que funciona

```bash
# Prueba el registro con Referer (solución temporal):
curl -X POST https://jaimediaz.dev/accounts/signup/ \
  -d "username=testuser&password1=Testpass123&password2=Testpass123" \
  -H "Referer: https://jaimediaz.dev/accounts/signup/" \
  -w "\nHTTP_CODE: %{http_code}\n"
```

---

## 📍 DOMINIOS ACTUALES CONFIGURADOS

Según `infra/nginx/jaimediaz.dev.conf`:
- **Dominio principal**: `jaimediaz.dev` y `www.jaimediaz.dev`
- **Socket Gunicorn**: `/var/www/jdiaz.tipsterbyte.com/app/run/jdiaz.sock`
- **Root**: `/var/www/jdiaz.tipsterbyte.com`

Los symlinks que eliminaste (`tipsterbyte.com`, `jdiaz.tipsterbyte.com`, `test.tipsterbyte.com`) ya no son necesarios si solo usas `jaimediaz.dev`.