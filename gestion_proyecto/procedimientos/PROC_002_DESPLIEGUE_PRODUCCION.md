# 🚀 PROCEDIMIENTO ESTANDAR DESPLIEGUE A PRODUCCION
## VERSION 2.0

> 📌 **FECHA ACTUALIZACIÓN:** 30/06/2026
> 📌 **COMPATIBLE CON:** Estructura actual del proyecto (Backend Django + Nginx + Gunicorn)
> 📌 **TIEMPO ESTIMADO:** 15-20 minutos (incluye verificaciones)

---

### 🎯 IDENTIFICACION
| Campo                   | Valor                           |
| ----------------------- | ------------------------------- |
| **ID Procedimiento**    | PROC-002                        |
| **Version**             | 2.0                             |
| **Fecha creacion**      | 28/04/2026                      |
| **Fecha actualizacion** | 30/06/2026                      |
| **Responsable**         | Jaime Díaz                      |
| **Tiempo estimado**     | 15-20 minutos                   |
| **Entorno objetivo**    | VPS Produccion Nginx + Gunicorn |

---

## 📋 PRE REQUISITOS OBLIGATORIOS ANTES DE EMPEZAR
✅ ✅ ✅

### ✅ 1. Acceso y conectividad
- [ ] Acceso SSH configurado a la VPS (~/.ssh/config o clave cargada)
- [ ] IP/dominio de producción conocido
- [ ] Usuario con permisos sudo configurado

### ✅ 2. Código y repositorio
- [ ] Código pusheado a rama `main` en GitHub
- [ ] Sin conflictos sin resolver en Git
- [ ] Tests locales pasan sin errores
- [ ] Changelog/commit message describe cambios

### ✅ 3. Variables de entorno
- [ ] Archivo `.env` de producción actualizado y validado
- [ ] Variables sensibles (SECRET_KEY, passwords) rotadas recientemente
- [ ] DEBUG=False confirmado en `.env`
- [ ] ALLOWED_HOSTS incluye dominio(s) de producción

### ✅ 4. Servidor y recursos
- [ ] Al menos 1GB RAM libre (recomendado para Django + collectstatic)
- [ ] Espacio en disco >5GB libres (para migrations y static files)
- [ ] No hay despliegues en curso (verificar con `ps aux | grep gunicorn`)
- [ ] Backup de base de datos reciente (<24h) existe

### ✅ 5. Dependencias y configuración local
- [ ] requirements.txt actualizado si se instalaron paquetes nuevos
- [ ] No hay migraciones destructivas pendientes (verificar en `/backend/blog/migrations/`)
- [ ] Archivos estáticos nuevos agregados a `backend/static/`

---

## 🔴 PASOS DE DESPLIEGUE EN ORDEN ESTRICTO

### ⚠️ REGLA DE ORO:
**Si algún paso falla, DETENTE y ejecuta el procedimiento de rollback**
**Nunca continúes con errores sin resolver**

---

### 🟠 PASO 1: Backup PRE-DESPLIEGUE (obligatorio)
```bash
# 1.1 Tag del commit actual
git tag -a deploy-pre-$(date +%Y%m%d_%H%M%S) -m "Backup pre-deploy $(date)"

# 1.2 Documentar commit HEAD actual
git rev-parse HEAD > /tmp/last_deploy_commit.txt
```

> ✅ Si algo sale mal, tenemos punto de restauración exacto

---

### 🟠 PASO 2: Conectarse al servidor
```bash
ssh usuario@ip-servidor
cd /var/www/jdsite/backend
```

> ✅ Path correcto: `cd /var/www/jdsite/backend` (Django manage.py está en /backend)

---

### 🟠 PASO 3: Actualizar código desde repositorio
```bash
cd /var/www/jdsite
git status
git pull origin main
git log -1  # Verificar último commit
```
> ✅ IMPORTANTE: Si hay conflictos ABORTAR y hacer rollback inmediatamente

**Si hay conflictos:**
```bash
git merge --abort
git reset --hard HEAD
source venv/bin/activate
python manage.py migrate --run-syncdb
sudo systemctl restart gunicorn
echo "DESPLIEGUE ABORTADO - Conflictos en Git"
exit 1
```

---

### 🟠 PASO 4: Activar entorno virtual
```bash
source venv/bin/activate
```

> ✅ Verificar activación: `which python` debe mostrar `.../venv/bin/python`

---
cd backend
### 🟠 PASO 5: Instalar dependencias nuevas (si existen)
```bash
pip install -r requirements.txt
```
> ✅ Solo si se agregaron paquetes nuevos. Si no hay cambios en requirements, saltar

---

### 🟠 PASO 6: Ejecutar migraciones de base de datos
```bash
cd /var/www/jdsite/backend
python manage.py showmigrations  # Ver estado actual
python manage.py migrate
python manage.py migrate --run-syncdb  # Para tablas de terceros (allauth, etc)
```
> ✅ CRÍTICO: Nunca ejecutar migraciones `DeleteModel` o destructivas en producción
> ✅ Verificar que no haya errores 500 tras migraciones

---

### 🟠 PASO 7: Recolectar archivos estáticos
```bash
cd /var/www/jdsite/backend
python manage.py collectstatic --noinput --clear
```
> ✅ `--clear` limpia estáticos viejos para evitar conflictos de cache
> ✅ Actualiza CSS, JS, imágenes. Obligatorio SIEMPRE que haya cambios en static/

**Verificar que se hayan copiado archivos nuevos:**
```bash
ls -la /var/www/jdsite/staticfiles/blog/js/blog_editor/
# Debe aparecer index.js actualizado si hubo cambios
```

---

### 🟠 PASO 8: Validar configuración de producción
```bash
cd /var/www/jdsite/backend
python manage.py check --deploy
```
> ✅ Revisa configuraciones inseguras (DEBUG, SECRET_KEY, ALLOWED_HOSTS, etc)

**Verificar .env:**
```bash
cat .env | grep -E "DEBUG|SECRET_KEY|ALLOWED_HOSTS|DATABASE_URL"
# Confirmar DEBUG=False
```

---

### 🟠 PASO 9: Importar blogs actualizados
```bash
cd /var/www/jdsite/backend
python manage.py import_blogs
```
> ✅ Solo si se actualizaron fuentes en `blogs_source/`
> ✅ Si no hay cambios en blogs, se puede omitir (ahorra tiempo)

**Verificar importación:**
```bash
python manage.py shell -c "from blog.models import BlogPost; print(f'Posts: {BlogPost.objects.count()}')"
```

---

### 🟠 PASO 10: Reiniciar servicios en orden correcto
```bash
# 10.1 Reiniciar Gunicorn
sudo systemctl restart gunicorn

# 10.2 Esperar que levante completamente
sleep 3

# 10.3 Recargar Nginx (si aplica)
sudo systemctl reload nginx
```

> ✅ Importante: Gunicorn primero, Nginx después
> ✅ sleep 3 evita race condition en el arranque

---

### 🟠 PASO 11: Verificar estado del servicio
```bash
# 11.1 Estado de Gunicorn
sudo systemctl status gunicorn --no-pager

# 11.2 Verificar que no haya errores en logs recientes
sudo journalctl -u gunicorn -n 50 --no-pager | grep -i "error\|exception\|critical"

# 11.3 Verificar puerto escuchando
sudo netstat -tulpn | grep :8000
```

> ✅ Debe aparecer `active (running)` en verde
> ✅ No debe haber errores críticos en logs

---

### 🟠 PASO 12: Pruebas de validación POST-DESPLIEGUE
```bash
# 12.1 Prueba HTTP
curl -I https://jaimediaz.dev

# 12.2 Verificar respuesta 200
curl -s -o /dev/null -w "%{http_code}\n" https://jaimediaz.dev

# 12.3 Verificar CSS/JS cargan
curl -s https://jaimediaz.dev/static/blog/css/blog_editor.css | head -5

# 12.4 Verificar que no hay errores 500
curl -s -o /dev/null -w "%{http_code}\n" https://jaimediaz.dev/blog/
```

> ✅ Debe retornar 200 OK
> ✅ Archivos estáticos deben responder 200, no 404

---

### 🟠 PASO 13: Limpiar archivos temporales locales
```bash
cd /var/www/jdsite
git tag -d deploy-pre-$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
```

---

## ✅ CHECKLIST DE VERIFICACION POST DESPLIEGUE

**Verificar en el navegador (abrir https://jaimediaz.dev):**

### 🟢 Funcionalidad básica
- [ ] Página principal carga sin errores 500
- [ ] Página de blog lista carga correctamente
- [ ] Artículo individual se ve completo (no falta CSS/JS)
- [ ] Navegación entre páginas funciona

### 🎨 Estilos y assets
- [ ] CSS carga correctamente (inspeccionar Network tab, filtrar por CSS)
- [ ] JavaScript funciona (abrir consola, no debe haber errores rojos)
- [ ] Imágenes se muestran (incluyendo favicon)
- [ ] Font Awesome iconos aparecen correctamente

### 📝 Blog y editor
- [ ] Blog list muestra artículos con tags dinámicos
- [ ] Página de blog individual carga con comentarios
- [ ] Footer del blog se ve correctamente (incluyendo newsletter)
- [ ] Login de administrador funciona
- [ ] Dashboard carga sin errores
- [ ] Editor de artículos abre (si tienes acceso)

### 📧 Funcionalidades dinámicas
- [ ] Formulario de contacto funciona y envía correo
- [ ] Sistema de comentarios carga (si aplica)
- [ ] Búsqueda/filtros de blog funcionan
- [ ] RSS feed se accede (/feed/)

### 🔒 Seguridad y rendimiento
- [ ] HTTP redirige a HTTPS automáticamente
- [ ] No hay información sensible en el código fuente vista (SECRET_KEY, DEBUG, etc)
- [ ] Página responde en <2 segundos (verificar en Network > Time)
- [ ] No hay errores en consola del navegador (F12 > Console)

### 📊 SEO y analytics
- [ ] Meta tags se ven en el código fuente (título, descripción)
- [ ] Schema markup/JSON-LD está presente (si aplica)
- [ ] Google Search Console no reporta errores nuevos (revisar en 24-48h)

---
**Verificar en terminal/servidor:**
- [ ] `sudo systemctl status gunicorn` muestra `active (running)`
- [ ] Logs no tienen errores críticos: `sudo journalctl -u gunicorn -n 100 | grep -i error`
- [ ] Base de datos responde: `python manage.py dbshell` (conecta sin error)

---

## ⚠️ PROCEDIMIENTO DE ROLLBACK SI ALGO FALLA

### 🚨 Si el despliegue falla DESPUÉS del Paso 3 (git pull):

**Opción A: Rollback rápido con tag (recomendado)**
```bash
ssh usuario@ip-servidor
cd /var/www/jdsite
git tag -l "deploy-pre-*" | sort -r | head -1 | xargs git checkout
git checkout main
git reset --hard deploy-pre-<ultimo-tag>
cd backend
source venv/bin/activate
python manage.py migrate --run-syncdb  # Solo si es necesario
sudo systemctl restart gunicorn
sudo systemctl reload nginx
git tag -d deploy-pre-$(date +%Y%m%d_%H%M%S)  # Limpiar tag de abort
```

**Opción B: Rollback con backup de base de datos**
```bash
ssh usuario@ip-servidor
cd /var/www/jdsite
git reset --hard HEAD~1
cd backend
source venv/bin/activate
# Restaurar backup si hubo cambios en migraciones
psql -U usuario_db nombre_db < /tmp/backup_pre_deploy_YYYYMMDD_HHMMSS.sql
sudo systemctl restart gunicorn
```

### 🚨 Si hay error 500 tras despliegue:

**Verificar logs para diagnosticar:**
```bash
sudo journalctl -u gunicorn -n 200 --no-pager > /tmp/gunicorn_errors.log
tail -50 /var/www/jdsite/staticfiles/logs/django_error.log  # si existe
```

**Diagnóstico rápido:**
```bash
# Verificar si es problema de static files
curl -I https://jaimediaz.dev/static/blog/css/blog_editor.css

# Verificar si es problema de BD
cd /var/www/jdsite/backend
python manage.py dbshell -c "SELECT 1;"

# Verificar si es problema de settings
cat .env | grep DEBUG
```

### 🚨 Si el servidor no responde en absoluto:

**Reinicio completo de servicios:**
```bash
ssh usuario@ip-servidor
sudo systemctl restart gunicorn
sudo systemctl restart nginx
sudo systemctl status gunicorn nginx
```

> ⚠️ REGLAS DE ROLLBACK:
> 1. NUNCA arreglar cosas en caliente en producción sin hacer commit
> 2. SIEMPRE probar rollback en staging primero (si existe)
> 3. DOCUMENTAR el fallo en gestion_proyecto/diagnosticos/
> 4. Revisar logs antes de reintentar despliegue

---

## 🔑 VARIABLES .ENV OBLIGATORIAS EN PRODUCCION

### Variables críticas (no omitir):
```env
# Seguridad
DEBUG=False
SECRET_KEY=<clave-secreta-64-caracteres-minimo>
ALLOWED_HOSTS=jaimediaz.dev,www.jaimediaz.dev,localhost,127.0.0.1

# Base de datos (PostgreSQL recomendado para producción)
DATABASE_URL=postgres://usuario:password@localhost:5432/nombre_db

# Dominios
SITE_URL=https://jaimediaz.dev

# Email (Gmail SMTP o servicio profesional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=correo@gmail.com
EMAIL_HOST_PASSWORD=<contraseña-de-aplicacion>

# Seguridad adicional (recomendado)
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

### Variables opcionales (si aplica):
```env
# Google Services (si usas Analytics, Search Console, etc)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
GOOGLE_RECAPTCHA_SITE_KEY=***
GOOGLE_RECAPTCHA_SECRET_KEY=***

# APIs externas
YOUTUBE_API_KEY=***
ZOHO_API_URL=***
ZOHO_CLIENT_ID=***
ZOHO_CLIENT_SECRET=***
ZOHO_REFRESH_TOKEN=***

# Storage (si usas S3 o similar)
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
AWS_STORAGE_BUCKET_NAME=jdsite-media
```

### Validación pre-despliege de .env:
```bash
cd /var/www/jdsite/backend
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
critical = ['DEBUG', 'SECRET_KEY', 'ALLOWED_HOSTS', 'DATABASE_URL', 'EMAIL_HOST_USER']
missing = [v for v in critical if not os.getenv(v)]
if missing:
    print('❌ Variables faltantes:', missing)
    exit(1)
else:
    print('✅ Variables críticas configuradas')
"
```

---

## 🚨 TROUBLESHOOTING FRECUENTE

### Error: "No module named 'xxx'"
```bash
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart gunicorn
```

### Error 500 en producción pero funciona locally
```bash
# Verificar logs
sudo journalctl -u gunicorn -n 100 --no-pager

# Verificar migraciones pendientes
cd /var/www/jdsite/backend
python manage.py showmigrations | grep -i "no"

# Verificar permisos de archivos estáticos
ls -la /var/www/jdsite/staticfiles/
sudo chown -R www-data:www-data /var/www/jdsite/staticfiles
```

### Error: "Static files not found"
```bash
cd /var/www/jdsite/backend
python manage.py collectstatic --noinput --clear
sudo systemctl reload nginx
```

### Error: "Database connection failed"
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar credenciales en .env
cat .env | grep DATABASE_URL

# Probar conexión
cd /var/www/jdsite/backend
python manage.py dbshell
```

### Error 502 Bad Gateway
```bash
# Verificar que Gunicorn esté corriendo
sudo systemctl status gunicorn

# Verificar puerto
sudo netstat -tulpn | grep :8000

# Reiniciar servicios
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

---

## 📚 REFERENCIAS Y DOCUMENTACIÓN RELACIONADA

- **Backup de BD:** Verificar que existe backup automático diario en `/var/backups/postgresql/`
- **Logs de Django:** `/var/www/jdsite/staticfiles/logs/django_error.log` (si existe configuración)
- **Configuración Nginx:** `/etc/nginx/sites-available/jdsite`
- **Systemd Gunicorn:** `/etc/systemd/system/gunicorn.service`
- **Monitoreo:** Verificar UptimeRobot / Healthchecks.io configurados para https://jaimediaz.dev

---

> 📌 **ULTIMA ACTUALIZACIÓN:** 30/06/2026
> 📌 **APLICABLE DESDE:** HU-011 en adelante
> 📌 **ESTE PROCEDIMIENTO ES OBLIGATORIO PARA TODO DESPLIEGUE**
> 📌 **MANTENEDOR:** Jaime Díaz
> 📌 **PRÓXIMA REVISIÓN:** 30/07/2026