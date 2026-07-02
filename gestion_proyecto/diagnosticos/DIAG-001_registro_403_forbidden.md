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
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep -E "DJANGO_ENV\|DEBUG\|SECRET_KEY"

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

## ⏱️ TIEMPO ESTIMADO
10-15 minutos para aplicar fix y redeployar