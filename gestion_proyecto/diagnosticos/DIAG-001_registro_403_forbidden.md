# 🔍 DIAGNÓSTICO: Error 403 en registro POST

## 📅 Fecha
2026-07-02

## ⚠️ PROBLEMA REPORTADO
- El registro POST en `/accounts/signup/` funciona en LOCAL
- En PRODUCCIÓN retorna error 403 Forbidden
- El formulario incluye `{% csrf_token %}` correctamente

---

## 🔍 ANÁLISIS DE CAUSA RAÍZ

### ✅ **CAUSA PRINCIPAL: Falta CSRF_TRUSTED_ORIGINS en settings.py**

Cuando Django corre detrás de **Nginx con HTTPS**, el token CSRF debe confiar en el origen del sitio. Sin esta configuración, Django rechaza las peticiones POST porque no puede verificar el token CSRF contra un origen no confiado.

### ✅ **EVIDENCIA TÉCNICA**

1. **Settings.py LÍNEA 30-31** (modo producción):
   ```python
   if DJANGO_ENV == "production":
       DEBUG = False
   ```
   - Solo establece `DEBUG = False` y `ALLOWED_HOSTS`
   - **FALTA**: Configuración CSRF para HTTPS

2. **Nginx config** (infra/nginx/jaimediaz.dev.conf):
   - Incluye `snippets/security-headers.conf` (desconocido contenido)
   - Redirige HTTP → HTTPS
   - Proxy a Gunicorn via socket

3. **Variables .env actuales**:
   - `DJANGO_ENV=development` (en local)
   - En producción debe ser `production` pero falta configuración CSRF

---

## 🛠️ SOLUCIÓN RECOMENDADA

### **OPCIÓN A: Agregar CSRF_TRUSTED_ORIGINS (RECOMENDADO)**

Modificar `backend/jdsite/settings.py` para agregar:

```python
# DESPUÉS de la línea 35 (ALLOWED_HOSTS)
# Agregar configuración CSRF para producción
if DJANGO_ENV == "production":
    CSRF_TRUSTED_ORIGINS = [
        "https://jaimediaz.dev",
        "https://www.jaimediaz.dev",
        "https://jdiaz.tipsterbyte.com",
    ]
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
```

### **OPCIÓN B: Verificar security-headers.conf**

El archivo `snippets/security-headers.conf` podría contener algo como:
```
add_header Content-Security-Policy "form-action 'self';"
```
Esto podría estar bloqueando el POST.

**VERIFICADO**: Tu security-headers.conf contiene solo:
- `X-Frame-Options SAMEORIGIN`
- `X-Content-Type-Options nosniff`
- `X-XSS-Protection`
- `Referrer-Policy` (comentado)

**✅ NO bloquea peticiones POST** - No es el problema.

### **OPCIÓN C: Verificar .env de producción**

Asegurarse que en `.env` del servidor:
```env
DJANGO_ENV=production
DEBUG=False
```

---

## 📋 PASOS PARA VERIFICAR EN VPS

Ejecutar estos comandos en la VPS:

```bash
# 1. Verificar logs de Gunicorn (el error real)
sudo journalctl -u gunicorn -n 100 --no-pager | grep -i "csrf\|forbidden\|error"

# 2. Verificar .env actual
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep -E "DJANGO_ENV|DEBUG|SECRET_KEY"

# 3. Verificar security headers
cat /etc/nginx/snippets/security-headers.conf

# 4. Verificar que CSRF token llega en el request
curl -X POST https://jaimediaz.dev/accounts/signup/ -d "username=test&password1=test12345&password2=test12345" -v 2>&1 | grep -E "csrf|403|cookie"
```

---

## 📦 ARCHIVOS AFECTADOS

| Archivo                          | Acción                          |
| -------------------------------- | ------------------------------- |
| `backend/jdsite/settings.py`     | Agregar CSRF_TRUSTED_ORIGINS    |
| `infra/nginx/jaimediaz.dev.conf` | Verificar security-headers.conf |

---

## ⚡ **FIX APLICADO LOCAL** (esperando deploy a VPS)

### **CAMBIOS REALIZADOS EN LOCAL**

Se agregó a `backend/jdsite/settings.py` (líneas 30-39):

```python
if DJANGO_ENV == "production":
    DEBUG = False
    ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "jdiaz.tipsterbyte.com").split(",")
    # CSRF/HTTPS security settings for production
    CSRF_TRUSTED_ORIGINS = [
        "https://jaimediaz.dev",
        "https://www.jaimediaz.dev",
        "https://jdiaz.tipsterbyte.com",
    ]
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
```

---

## ⚠️ **VERIFICACIÓN REQUERIDA EN VPS**

### **CRÍTICO**: Verifica el .env de producción

Ejecuta esto en la VPS:

```bash
# Verifica el valor actual
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep -E "DJANGO_ENV|ALLOWED_HOSTS|DEBUG"

# El ALLOWED_HOSTS debe ser SIN espacios:
# MAL: ALLOWED_HOSTS=jdiaz.tipsterbyte.com,jaimediaz.dev, www.jaimediaz.dev,jdiaz.tipsterbyte.com
# BIEN: ALLOWED_HOSTS=jdiaz.tipsterbyte.com,jaimediaz.dev,www.jaimediaz.dev

# Debe decir:
# DJANGO_ENV=production
# DEBUG=False (o no tener DEBUG=True)
```

---

## 🚀 **PASOS PARA APLICAR EN VPS**

```bash
# 1. En la VPS, después del git pull
cd /var/www/jdiaz.tipsterbyte.com/app/backend

# 2. Verificar .env (posible problema de ALLOWED_HOSTS con espacio)
cat .env | grep ALLOWED_HOSTS

# 3. Verificar security headers
cat /etc/nginx/snippets/security-headers.conf

# 4. Reiniciar servicios
sudo systemctl restart gunicorn
sudo systemctl reload nginx
```

---

## 🔍 **VERIFICAR ALLOWED_HOSTS**

**Importante:** El .env local tiene un problema con ALLOWED_HOSTS:

```
ALLOWED_HOSTS=jdiaz.tipsterbyte.com,jaimediaz.dev, www.jaimediaz.dev,jdiaz.tipsterbyte.com
```

**Fíjate en el ESPACIO antes de `www.jaimediaz.dev`** - Esto hace que Django NO reconozca `www.jaimediaz.dev` como host válido.

```bash
# Verifica qué hosts Django acepta:
cd /var/www/jdiaz.tipsterbyte.com/app/backend
source .venv/bin/activate
python manage.py shell -c "from django.conf import settings; print('ALLOWED_HOSTS:', settings.ALLOWED_HOSTS)"
```

**Debe mostrar:**
```
['jdiaz.tipsterbyte.com', 'jaimediaz.dev', 'www.jaimediaz.dev']
```

---

## 🔍 **VERIFICAR LOGS DE GUNICORN (CRÍTICO)**

Tu servicio se llama `jdiaz_gunicorn.service` (no `gunicorn`):

```bash
# Ver últimos logs (ejecutar en la VPS):
sudo journalctl -u jdiaz_gunicorn.service -n 50 --no-pager

# O ver en tiempo real:
sudo journalctl -u jdiaz_gunicorn.service -f
# (Intenta registro en otra terminal y verás el error exacto)
```

**Busca mensajes como:**
- `CSRF verification failed`
- `Forbidden: CSRF token missing or incorrect`

---

## 🔥 **¡CAUSA ENCONTRADA! REFERRER-POLICY BLOQUEANDO CSRF**

El curl mostró el error real:
```
Referrer-Policy: same-origin
...
<p>Verificación CSRF fallida. Solicitud abortada.</p>
<p>Este sitio HTTPS requiere que tu navegador web envíe un "encabezado de referencia", pero no se envió ninguno.
```

**El problema es que nginx envía `Referrer-Policy: same-origin` que bloquea el header Referer necesario para CSRF.**

### **FIX INMEDIATO:**

Editar `infra/nginx/jaimediaz.dev.conf` o el archivo `snippets/security-headers.conf`:

```bash
# Ver el contenido:
sudo cat /etc/nginx/snippets/security-headers.conf

# Cambiar:
# Referrer-Policy same-origin
# Por:
# Referrer-Policy no-referrer-when-downgrade
```

O simplemente **comentar la línea de Referrer-Policy**.

---

## 🔥 **¡PROBLEMA ENCONTRADO! Falta SECURE_PROXY_SSL_HEADER**

En el settings.py local se ve que falta la configuración crítica:

```python
# NO existe SECURE_PROXY_SSL_HEADER en settings.py
```

**Cuando Django está detrás de nginx con HTTPS, necesita saber que es HTTPS:**

```python
# Agregar a settings.py (línea 45 después del bloque production):
if DJANGO_ENV == "production":
    # ... config existente ...
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

**Sin esto, Django no confía en que la petición es HTTPS y rechaza el CSRF token.**

---

## 🔍 **VERIFICAR SI EL 403 ES DE DJANGO O NGINX**

**Importante:** El formato del 403 que ves es típico de nginx (`<title>403 Forbidden</title>`), no de Django.

Esto puede ser porque el request no llega a Django correctamente:

```bash
# Verifica que el socket de Gunicorn existe y funciona:
ls -la /var/www/jdiaz.tipsterbyte.com/app/run/jdiaz.sock

# Verifica permisos del socket:
sudo chown www-data:www-data /var/www/jdiaz.tipsterbyte.com/app/run/jdiaz.sock

# Reinicia gunicorn para regenerar socket:
sudo systemctl restart jdiaz_gunicorn.service

# Verifica que nginx puede leer el socket:
sudo nginx -t
```

---

## ✅ **FIX APLICADO - DEBES HACER GIT PULL EN VPS**

```bash
# En tu VPS:
git pull origin main
sudo systemctl restart jdiaz_gunicorn.service
```

---

## 🔥 **¡EL 403 PERSISTE! SIGUEN ESTAS CAUSAS POSSIBLES:**

### **Si ya tienes los cambios deployados, verifica:**

```bash
# 1. ¿El .env está en production?
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep -E "DJANGO_ENV|DEBUG"

# 2. ¿El socket tiene permisos correctos?
ls -la /var/www/jdiaz.tipsterbyte.com/app/run/jdiaz.sock

# 3. ¿Django está viendo el .env correcto?
cd /var/www/jdiaz.tipsterbyte.com/app/backend
source .venv/bin/activate
python -c "from django.conf import settings; print('ENV:', settings.DJANGO_ENV, 'DEBUG:', settings.DEBUG)"
```

### **El error "Referer requerido" persiste porque:**
1. **`DJANGO_ENV` no es `production`** en el .env de la VPS
2. **El socket de Gunicorn no está siendo leído correctamente** por nginx
3. **Hay un middleware personalizado que exige Referer**

## 🔧 **COMANDOS CURL PARA PROBAR EL REGISTRO**

### **PROBAR CON REFERER (SOLUCIÓN INMEDIATA):**
```bash
curl -X POST https://jaimediaz.dev/accounts/signup/ \
  -d "username=testuser&password1=Test12345678&password2=Test12345678" \
  -H "Referer: https://jaimediaz.dev/accounts/signup/" \
  -w "\nHTTP_CODE: %{http_code}\n"
```

### **Probar sin CSRF (para verificar si el error persiste):**
```bash
curl -X POST https://jaimediaz.dev/accounts/signup/ \
  -d "username=testuser&password1=Test12345678&password2=Test12345678" \
  -w "\nHTTP_CODE: %{http_code}\n"
# HTTP_CODE: 403 significa que sigue habiendo problema CSRF
```

### **Obtener CSRF token y probar (método correcto):**
```bash
# 1. Obtener la página del formulario (guarda cookies)
curl -c /tmp/cookies.txt -s https://jaimediaz.dev/accounts/signup/ > /tmp/form.html

# 2. Extraer CSRF token (si tienes grep)
CSRF=$(grep -oP 'name="csrfmiddlewaretoken" value="\K[^"]' /tmp/form.html)

# 3. Enviar POST con token
curl -b /tmp/cookies.txt -X POST https://jaimediaz.dev/accounts/signup/ \
  -d "csrfmiddlewaretoken=$CSRF" \
  -d "username=testuser123&password1=Test12345678&password2=Test12345678&email=test@test.com" \
  -H "Referer: https://jaimediaz.dev/accounts/signup/" \
  -w "\nHTTP_CODE: %{http_code}\n"
```

### **¡EL ERROR INDICA QUE DJANGO REQUIERE EL HEADER REFERER!**

El mensaje dice: **"Este sitio HTTPS requiere que tu navegador web envíe un 'encabezado de referencia'"**

Esto es causado por Django 4.2+ cuando usa `CSRF_TRUSTED_ORIGINS` y verifica el Referer como medida adicional de seguridad.
