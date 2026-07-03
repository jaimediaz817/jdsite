# 🚀 COMANDOS DIRECTOS PARA VPS

## 1. ELIMINAR SYMLINKS NGINX (usa mv si rm falla)

```bash
# En tu VPS:
sudo mv /etc/nginx/sites-enabled/tipsterbyte.com /tmp/ 2>/dev/null || true
sudo mv /etc/nginx/sites-enabled/test.tipsterbyte.com /tmp/ 2>/dev/null || true
sudo mv /etc/nginx/sites-enabled/jdiaz.tipsterbyte.com /tmp/ 2>/dev/null || true

# Verifica:
ls -la /etc/nginx/sites-enabled/
# Debería mostrar SOLO: jaimediaz.dev (o similar)
```

## 2. ARREGLAR EL ERROR 403 CSRF EN VPS

```bash
# Conéctate a tu VPS y ejecuta:

# Paso 1: Ir al directorio de Django
cd /var/www/jdiaz.tipsterbyte.com/app/backend

# Paso 2: Verifica el .env actual
cat .env | grep -E "DJANGO_ENV|DEBUG|ALLOWED_HOSTS"

# Si ves algo como:
# ALLOWED_HOSTS=..., www.jaimediaz.dev,... (con espacio)
# ¡ESE ES EL PROBLEMA!

# Paso 3: Corrige el .env en la VPS (edita con nano o vim):
nano .env

# Busca esta línea y corrígela:
# MAL: ALLOWED_HOSTS=jdiaz.tipsterbyte.com,jaimediaz.dev, www.jaimediaz.dev,jdiaz.tipsterbyte.com
# BIEN: ALLOWED_HOSTS=jdiaz.tipsterbyte.com,jaimediaz.dev,www.jaimediaz.dev

# Paso 4: Reinicia servicios
sudo systemctl restart jdiaz_gunicorn.service
sudo systemctl reload nginx

# Paso 5: Verifica el Referrer-Policy
cat /etc/nginx/snippets/security-headers.conf | grep -i referrer
# Si dice "Referrer-Policy same-origin", combínalo:
# Referrer-Policy no-referrer-when-downgrade
```

## 3. VERIFICAR QUE FUNCIONA

```bash
# Prueba el sitio:
curl -I https://jaimediaz.dev

# Prueba el registro (si persiste el error):
curl -X POST https://jaimediaz.dev/accounts/signup/ \
  -d "username=testuser123&password1=Testpass123&password2=Testpass123" \
  -H "Referer: https://jaimediaz.dev/accounts/signup/" \
  -w "\nHTTP_CODE: %{http_code}\n"
```

---

## 🔥 FIX RÁPIDO EN 1 COMANDO (VPS)

Si el .env en la VPS tiene el error del espacio, ejecuta esto:

```bash
# En la VPS, corrige el .env automáticamente
sed -i 's/, www\.jaimediaz\.dev/,www.jaimediaz.dev/g' /var/www/jdiaz.tipsterbyte.com/app/backend/.env

# Reinicia
sudo systemctl restart jdiaz_gunicorn.service