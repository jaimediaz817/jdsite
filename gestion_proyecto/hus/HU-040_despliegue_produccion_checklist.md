# 🚀 HU-040: Checklist de Despliegue a Producción VPS

> **Objetivo:** Establecer un procedimiento definitivo, repetible y seguro para desplegar cambios a producción en la VPS, incluyendo permisos de usuarios/carpetas, verificación de dependencias, orden de comandos y migraciones.
>
> **Fecha:** 11/06/2026
> **Responsable:** Jaime Díaz
> **Tiempo estimado:** 15-20 minutos (despliegue completo con verificaciones)
> **Entorno objetivo:** VPS Producción (Nginx + Gunicorn + MySQL)
>
> **Referencias:**
> - PROC-003: Manual completo de despliegue y backup
> - PERMISOS_VPS_MEDIA_QR: Guía de permisos para media/
> - DIAG-003: Diagnóstico permisos editor en producción

---

## 📋 ÍNDICE

1. [Pre-requisitos antes de comenzar](#-1-pre-requisitos-antes-de-comenzar)
2. [Checklist de verificación local](#-2-checklist-de-verificación-local)
3. [Orden de ejecución en VPS (paso a paso)](#-3-orden-de-ejecución-en-vps-paso-a-paso)
4. [Permisos de usuarios y carpetas](#-4-permisos-de-usuarios-y-carpetas)
5. [Verificación post-despliegue](#-5-verificación-post-despliegue)
6. [Troubleshooting común](#-6-troubleshooting-común)
7. [Rollback rápido](#-7-rollback-rápido)

---

## ✅ 1. PRE-REQUISITOS ANTES DE COMENZAR

### 1.1 Acceso y conectividad

| #   | Verificación              | Comando                                    | Estado |
| --- | ------------------------- | ------------------------------------------ | ------ |
| 1   | Acceso SSH a VPS funciona | `ssh jdiaz@jaimediaz.dev`                  | ⬜      |
| 2   | Usuario con permisos sudo | `sudo -v`                                  | ⬜      |
| 3   | Dominio responde          | `curl -I https://jaimediaz.dev` → `200 OK` | ⬜      |

### 1.2 Estado del repositorio local

| #   | Verificación                        | Comando                                       | Estado |
| --- | ----------------------------------- | --------------------------------------------- | ------ |
| 4   | Sin commits sin pushear             | `git log --oneline origin/main..HEAD` → vacío | ⬜      |
| 5   | Rama actual es `main`               | `git branch --show-current` → `main`          | ⬜      |
| 6   | Sin archivos modificados sin commit | `git status` → "working tree clean"           | ⬜      |

### 1.3 Configuración de producción

| #   | Verificación                     | Comando/Archivo                            | Estado |
| --- | -------------------------------- | ------------------------------------------ | ------ |
| 7   | Archivo `.env` existe en VPS     | `ls -la /var/www/jdsite/.env`              | ⬜      |
| 8   | Variable `DJANGO_ENV=production` | `grep DJANGO_ENV /var/www/jdsite/.env`     | ⬜      |
| 9   | Variable `DEBUG=False`           | `grep DEBUG /var/www/jdsite/.env`          | ⬜      |
| 10  | `ALLOWED_HOSTS` incluye dominio  | `grep ALLOWED_HOSTS /var/www/jdsite/.env`  | ⬜      |
| 11  | Credenciales BD correctas        | `grep DATABASE_URL /var/www/jdsite/.env`   | ⬜      |
| 12  | Variables de email configuradas  | `grep RESEND_API_KEY /var/www/jdsite/.env` | ⬜      |

### 1.4 Dependencias y código

| #   | Verificación                              | Comando                                             | Estado |
| --- | ----------------------------------------- | --------------------------------------------------- | ------ |
| 13  | `requirements.txt` actualizado            | `git diff origin/main -- requirements.txt`          | ⬜      |
| 14  | No hay dependencias nuevas sin aprobación | Revisar diff de requirements.txt                    | ⬜      |
| 15  | Migraciones nuevas son aditivas           | `ls backend/*/migrations/0*.py` (últimas)           | ⬜      |
| 16  | No hay migraciones destructivas           | Verificar que ninguna migración tenga `DeleteModel` | ⬜      |

> ⚠️ **REGLA DE ORO:** Si hay migraciones destructivas (DeleteModel, RemoveField), cancelar despliegue y consultar al equipo.

---

## 📦 2. CHECKLIST DE VERIFICACIÓN LOCAL

### 2.1 Verificar requirements.txt

```bash
# Comparar con la versión en producción
git diff origin/main -- requirements.txt

# Si hay cambios, verificar que sean seguros:
# - Solo versiones cambiadas (no paquetes nuevos sin讨论)
# - Versiones pinned (==) para reproducibilidad
# - Sin conflictos de dependencias
pip check
```

**Criterios de aceptación:**
- [ ] No hay dependencias nuevas sin aprobación explícita
- [ ] Todas las versiones están fijadas con `==`
- [ ] `pip check` no muestra conflictos

### 2.2 Verificar migraciones pendientes

```bash
# Ver estado de migraciones
python manage.py showmigrations

# Verificar que no haya migraciones sin aplicar en local
python manage.py migrate --check
```

**Criterios de aceptación:**
- [ ] No hay migraciones sin aplicar en local
- [ ] Las migraciones nuevas son aditivas (AddField, CreateModel)
- [ ] No hay migraciones que borren datos

### 2.3 Probar checklist local (si aplica)

```bash
# Si hay cambios en modelos, probar migraciones en local primero
python manage.py makemigrations --check  # Solo verifica, no crea
python manage.py migrate
python manage.py test blog.tests  # Ejecutar tests si existen
```

---

## 🚀 3. ORDEN DE EJECUCIÓN EN VPS (PASO A PASO)

### 🔴 PASO 1: Backup PRE-despliegue (OBLIGATORIO)

```bash
# Conectar a VPS
ssh jdiaz@jaimediaz.dev
cd /var/www/jdsite

# Backup de base de datos
BACKUP_FILE="/var/backups/jdsite/pre_deploy_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -u jdsite -p$(grep DB_PASSWORD .env | cut -d'=' -f2) jdsite > $BACKUP_FILE
gzip $BACKUP_FILE
echo "✅ Backup BD: ${BACKUP_FILE}.gz"

# Tag de git para rollback rápido
git tag -a deploy-pre-$(date +%Y%m%d_%H%M%S) -m "Backup pre-deploy $(date +%Y-%m-%d_%H:%M)"
git rev-parse HEAD > /tmp/last_deploy_commit.txt
echo "✅ Tag creado: deploy-pre-$(date +%Y%m%d_%H%M%S)"
```

**Verificación:**
- [ ] Backup de BD creado en `/var/backups/jdsite/`
- [ ] Tag de git creado
- [ ] Commit HEAD documentado en `/tmp/last_deploy_commit.txt`

---

### 🟠 PASO 2: Actualizar código desde GitHub

```bash
cd /var/www/jdsite

# Traer últimos cambios
git fetch --all
git pull origin main
```

**Verificación:**
- [ ] `git pull` completado sin conflictos
- [ ] No hay archivos en conflicto

> ⚠️ **SI HAY CONFLICTOS:** Abortar inmediatamente, no resolver en producción. Ir a sección [Rollback](#7-rollback-rápido).

---

### 🟠 PASO 3: Activar entorno virtual

```bash
cd /var/www/jdsite
source venv/bin/activate
```

**Verificación:**
- [ ] Prompt muestra `(venv)` activado

---

### 🟠 PASO 4: Instalar dependencias nuevas (si las hay)

```bash
# Solo si requirements.txt cambió
pip install -r requirements.txt
```

**Verificación:**
- [ ] Todas las dependencias instaladas sin errores
- [ ] No hay warnings de conflicto

> 💡 **Tip:** Comparar con local: `diff requirements.txt /var/www/jdsite/requirements.txt`

---

### 🟠 PASO 5: Compilar SCSS (si aplica)

```bash
# Solo si hay cambios en archivos .scss
cd /var/www/jdsite
npm run sass:build
```

**Verificación:**
- [ ] CSS generado en `backend/static/css/`
- [ ] No hay errores de compilación

> ⚡ **Saltar este paso** si solo cambiaron templates o Python.

---

### 🟠 PASO 6: Ejecutar migraciones de base de datos

```bash
cd /var/www/jdsite/backend
python manage.py migrate
```

**Verificación:**
- [ ] Migraciones aplicadas sin errores
- [ ] No muestra "You have X migrations that have not been applied"
- [ ] Revisar logs: `sudo journalctl -u jdiaz_gunicorn.service -n 50 --no-pager`

> ⚠️ **CRÍTICO:**
> - NUNCA ejecutar migraciones destructivas en producción
> - Si una migración falla, hacer rollback inmediatamente
> - Verificar que `import_blogs` siga funcionando después

---

### 🟠 PASO 7: Recolectar archivos estáticos

```bash
cd /var/www/jdsite/backend
python manage.py collectstatic --noinput
```

**Verificación:**
- [ ] Comando completado sin errores
- [ ] Archivos estáticos actualizados en `/var/www/jdsite/staticfiles/`
- [ ] Symlinks creados correctamente

---

### 🟠 PASO 8: Importar blogs (si hubo cambios en blogs_source/)

```bash
cd /var/www/jdsite/backend
python manage.py import_blogs
```

**Verificación:**
- [ ] Comando completado sin errores
- [ ] Verificar que no haya artículos duplicados
- [ ] Revisar logs de importación

> 💡 **Nota:** Este paso es opcional si no se modificaron archivos en `blogs_source/`.

---

### 🟠 PASO 9: Aplicar permisos de carpetas

```bash
cd /var/www/jdsite

# Permisos generales del proyecto
sudo chown -R jdiaz:jdiaz backend/
sudo chown -R www-data:www-data backend/media/
sudo chown -R www-data:www-data backend/staticfiles/

# Permisos específicos (QR, editor, blogs)
sudo chmod 755 backend/media/qr_codes/
sudo chmod 775 backend/media/blog_editor_temp/
sudo chmod -R 755 backend/static/blogs/

# Asegurar que el directorio run/ existe (socket gunicorn)
sudo mkdir -p /var/www/jdsite/app/run
sudo chown www-data:www-data /var/www/jdsite/app/run
```

**Verificación:**
- [ ] `backend/media/` pertenece a `www-data:www-data`
- [ ] `backend/staticfiles/` pertenece a `www-data:www-data`
- [ ] Directorio `run/` existe con permisos correctos

> 📋 **Ver detalle completo:** Ver `PERMISOS_VPS_MEDIA_QR.md`

---

### 🟠 PASO 10: Reiniciar servicios

```bash
# Reiniciar Gunicorn
sudo systemctl restart jdiaz_gunicorn.service

# Recargar Nginx
sudo systemctl reload nginx
```

**Verificación:**
- [ ] Gunicorn activo: `sudo systemctl status jdiaz_gunicorn.service --no-pager`
- [ ] Nginx recargado sin errores
- [ ] Sin errores en logs: `sudo journalctl -u jdiaz_gunicorn.service -n 50 --no-pager`

---

### 🟢 PASO 11: Verificación post-despliegue

```bash
# Verificar que el sitio responde
curl -I https://jaimediaz.dev

# Verificar logs en tiempo real (opcional, por 30 segundos)
sudo journalctl -u jdiaz_gunicorn.service -f
```

**Checklist manual:**
- [ ] Sitio carga sin errores 500
- [ ] CSS/JS cargan correctamente (F12 → Console sin 404)
- [ ] Artículos del blog se visualizan
- [ ] Sitemap carga: `https://jaimediaz.dev/sitemap.xml`
- [ ] Login/registro funcionan
- [ ] Admin de Django accesible: `https://jaimediaz.dev/admin/`

---

## 🔐 4. PERMISOS DE USUARIOS Y CARPETAS

### 4.1 Usuarios del sistema

| Usuario    | Grupo      | Propósito        | Carpetas                                 |
| ---------- | ---------- | ---------------- | ---------------------------------------- |
| `jdiaz`    | `jdiaz`    | Desarrollo y SSH | `/var/www/jdsite/` (owner)               |
| `www-data` | `www-data` | Nginx + Gunicorn | `backend/media/`, `backend/staticfiles/` |

### 4.2 Matriz de permisos

| Carpeta                                           | Usuario    | Grupo      | Otros | Propósito                                |
| ------------------------------------------------- | ---------- | ---------- | ----- | ---------------------------------------- |
| `/var/www/jdsite/`                                | `jdiaz`    | `jdiaz`    | `r-x` | Código fuente (solo lectura para web)    |
| `/var/www/jdsite/backend/media/`                  | `www-data` | `www-data` | `r-x` | Uploads de usuarios (escritura web)      |
| `/var/www/jdsite/backend/media/qr_codes/`         | `www-data` | `www-data` | `r-x` | QR codes generados                       |
| `/var/www/jdsite/backend/media/blog_editor_temp/` | `www-data` | `www-data` | `rwx` | Imágenes temporales del editor           |
| `/var/www/jdsite/backend/staticfiles/`            | `www-data` | `www-data` | `r-x` | Estáticos recolectados                   |
| `/var/www/jdsite/backend/static/blogs/`           | `www-data` | `www-data` | `r-x` | Imágenes estáticas de blogs              |
| `/var/www/jdsite/backend/blogs_source/`           | `jdiaz`    | `jdiaz`    | `r-x` | Fuente de verdad (NO escribir desde web) |
| `/var/www/jdsite/app/run/`                        | `www-data` | `www-data` | `rwx` | Socket de Gunicorn                       |

### 4.3 Comandos de permisos (copy-paste)

```bash
# === PERMISOS COMPLETOS (ejecutar después de cada deploy) ===

# 1. Propietario del código fuente
sudo chown -R jdiaz:jdiaz /var/www/jdsite/backend/

# 2. Carpetas que necesita escribir www-data (upload, static, media)
sudo chown -R www-data:www-data /var/www/jdsite/backend/media/
sudo chown -R www-data:www-data /var/www/jdsite/backend/staticfiles/
sudo chown -R www-data:www-data /var/www/jdsite/backend/static/blogs/

# 3. Permisos específicos
sudo chmod 755 /var/www/jdsite/backend/media/qr_codes/
sudo chmod 775 /var/www/jdsite/backend/media/blog_editor_temp/
sudo chmod -R 755 /var/www/jdsite/backend/static/blogs/

# 4. Directorio de socket Gunicorn
sudo mkdir -p /var/www/jdsite/app/run
sudo chown www-data:www-data /var/www/jdsite/app/run
sudo chmod 775 /var/www/jdsite/app/run

# 5. Verificar
ls -la /var/www/jdsite/backend/media/
ls -la /var/www/jdsite/app/run/
```

### 4.4 Troubleshooting de permisos

| Síntoma                     | Causa probable                         | Solución                                                        |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| Error 500 al subir archivos | `media/` sin permiso escritura         | `sudo chown -R www-data:www-data backend/media/`                |
| QR no se genera             | `media/qr_codes/` sin permisos         | `sudo chmod 755 backend/media/qr_codes/`                        |
| Imágenes no cargan (404)    | `static/blogs/` sin permisos           | `sudo chown -R www-data:www-data backend/static/blogs/`         |
| Error 502 Bad Gateway       | Socket `run/` no existe o sin permisos | `sudo mkdir -p app/run && sudo chown www-data:www-data app/run` |
| Upload falla con 500        | `blog_editor_temp/` sin permisos       | `sudo chmod 775 backend/media/blog_editor_temp/`                |

---

## ✅ 5. VERIFICACIÓN POST-DESPLIEGUE

### 5.1 Verificación automática (logs y servicios)

```bash
# 1. Estado de Gunicorn
sudo systemctl status jdiaz_gunicorn.service --no-pager
# Esperado: active (running)

# 2. Estado de Nginx
sudo systemctl status nginx --no-pager
# Esperado: active (running)

# 3. Últimos logs (buscar errores 500)
sudo journalctl -u jdiaz_gunicorn.service -n 100 --no-pager | grep -E "(ERROR|500|Traceback)"

# 4. Verificar que el sitio responde
curl -I https://jaimediaz.dev
# Esperado: HTTP/1.1 200 OK
```

### 5.2 Verificación manual (navegador)

Abrir `https://jaimediaz.dev` y verificar:

| #   | Componente             | Verificación                                                      | Estado |
| --- | ---------------------- | ----------------------------------------------------------------- | ------ |
| 1   | **Homepage**           | Carga sin errores 500                                             | ⬜      |
| 2   | **CSS/JS**             | F12 → Console sin errores 404                                     | ⬜      |
| 3   | **Artículos del blog** | Abrir 2-3 artículos, verificar contenido e imágenes               | ⬜      |
| 4   | **Sitemap**            | `https://jaimediaz.dev/sitemap.xml` carga correctamente           | ⬜      |
| 5   | **Login/Registro**     | `https://jaimediaz.dev/accounts/login/` funciona                  | ⬜      |
| 6   | **Admin Django**       | `https://jaimediaz.dev/admin/` accesible                          | ⬜      |
| 7   | **Dashboard**          | `https://jaimediaz.dev/blog/dashboard/` carga (si estás logueado) | ⬜      |
| 8   | **Imágenes estáticas** | Verificar que las imágenes de artículos carguen                   | ⬜      |
| 9   | **Formularios**        | Probar formulario de comentarios (si está activo)                 | ⬜      |
| 10  | **HTTPS**              | No hay warnings de certificado SSL                                | ⬜      |

### 5.3 Verificación de funcionalidad específica

Si la HU incluye cambios en:

| Cambio                        | Verificación específica                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| **Nuevas migraciones**        | `python manage.py showmigrations` → Todo marcado con `[X]`                 |
| **Cambios en modelos**        | Admin de Django → Verificar que los modelos se muestren correctamente      |
| **Nuevos archivos estáticos** | F12 → Network → Verificar que los archivos nuevos tengan status 200        |
| **Cambios en `import_blogs`** | Ejecutar manualmente: `python manage.py import_blogs` → Sin errores        |
| **Cambios en email**          | Verificar logs de Resend o email de prueba                                 |
| **QR codes**                  | Generar un QR de prueba, verificar que se genere y descargue correctamente |

---

## ⚠️ 6. TROUBLESHOOTING COMÚN

### 6.1 Error 500 tras despliegue

```bash
# 1. Ver logs de Gunicorn
sudo journalctl -u jdiaz_gunicorn.service -n 100 --no-pager

# 2. Verificar migraciones pendientes
cd /var/www/jdsite/backend
python manage.py showmigrations

# 3. Verificar archivos estáticos
ls -la /var/www/jdsite/staticfiles/

# 4. Verificar permisos
ls -la /var/www/jdsite/backend/media/
```

**Causas comunes:**
- Migración no aplicada → Aplicar manualmente
- Permisos incorrectos → Ejecutar sección 4.3
- Archivos estáticos desactualizados → Ejecutar `collectstatic`
- Variable de entorno faltante → Verificar `.env`

### 6.2 Error 502 Bad Gateway

```bash
# 1. Verificar que Gunicorn esté corriendo
sudo systemctl status jdiaz_gunicorn.service

# 2. Verificar socket
ls -la /var/www/jdsite/app/run/
sudo journalctl -u jdiaz_gunicorn.service -n 50 --no-pager

# 3. Reiniciar Gunicorn
sudo systemctl restart jdiaz_gunicorn.service
```

**Causas comunes:**
- Socket no existe → `sudo mkdir -p /var/www/jdsite/app/run && sudo chown www-data:www-data /var/www/jdsite/app/run`
- Permisos incorrectos en socket → Verificar que `www-data` pueda leer/escribir
- Gunicorn caído → Reiniciar servicio

### 6.3 Error 403 Forbidden

```bash
# Verificar archivos .htaccess o permisos nginx
sudo nginx -t
sudo systemctl reload nginx
```

**Causas comunes:**
- Permisos de archivos estáticos → Verificar sección 4.2
- Configuración de Nginx → Verificar `infra/nginx/jaimediaz.dev.conf`

### 6.4 Imágenes no cargan (404)

```bash
# 1. Verificar que staticfiles tenga los archivos
ls -la /var/www/jdsite/staticfiles/blog/images/

# 2. Verificar symlinks
ls -la /var/www/jdsite/backend/staticfiles/

# 3. Recolectar estáticos de nuevo
cd /var/www/jdsite/backend
python manage.py collectstatic --noinput
```

---

## ↩️ 7. ROLLBACK RÁPIDO

### 7.1 Rollback completo (si algo salió mal)

```bash
# 1. Volver al commit anterior usando el tag
cd /var/www/jdsite
git tag -l "deploy-pre-*" | sort -r | head -1 | xargs git checkout
git checkout main

# 2. Restaurar base de datos (si fue necesario)
cd backend
# Opción A: Restaurar backup completo
gunzip < /var/backups/jdsite/pre_deploy_YYYYMMDD_HHMMSS.sql.gz | mysql -u jdsite -p jdsite

# Opción B: Revertir migración específica
python manage.py migrate blog 0008  # Reemplazar con la migración anterior

# 3. Reactivar entorno virtual y recolectar estáticos
source venv/bin/activate
python manage.py collectstatic --noinput

# 4. Reiniciar servicios
sudo systemctl restart jdiaz_gunicorn.service
sudo systemctl reload nginx

# 5. Eliminar tag de deploy fallido
git tag -d deploy-pre-YYYYMMDD_HHMMSS
```

### 7.2 Rollback parcial (sin tocar BD)

```bash
# Solo revertir código
cd /var/www/jdsite
git reset --hard deploy-pre-YYYYMMDD_HHMMSS

# Reactivar entorno virtual
source venv/bin/activate
cd backend
python manage.py collectstatic --noinput

sudo systemctl restart jdiaz_gunicorn.service
sudo systemctl reload nginx
```

### 7.3 Reglas de rollback

| Regla                                   | Descripción                           |
| --------------------------------------- | ------------------------------------- |
| **1. NUNCA arreglar en caliente**       | Todos los cambios deben pasar por git |
| **2. SIEMPRE hacer backup antes**       | Tag de git + backup de BD             |
| **3. Probar rollback en local primero** | Antes de ejecutar en producción       |
| **4. Documentar el incidente**          | Anotar qué salió mal y por qué        |

---

## 📊 RESUMEN EJECUTIVO

### Orden correcto de comandos (minimalista)

```bash
# === PRE-DEPLOY ===
ssh jdiaz@jaimediaz.dev "cd /var/www/jdsite && mysqldump -u jdsite -p\$(grep DB_PASSWORD .env | cut -d'=' -f2) jdsite | gzip > /var/backups/jdsite/pre_deploy_\$(date +%Y%m%d_%H%M%S).sql.gz && git tag -a deploy-pre-\$(date +%Y%m%d_%H%M%S) -m 'Backup'"

# === DEPLOY ===
cd /var/www/jdsite
git pull origin main
source venv/bin/activate
pip install -r requirements.txt  # Solo si hay cambios
npm run sass:build  # Solo si hay cambios en .scss
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py import_blogs  # Solo si hay cambios en blogs_source/

# === PERMISOS ===
sudo chown -R www-data:www-data backend/media/ backend/staticfiles/ backend/static/blogs/
sudo chmod 755 backend/media/qr_codes/
sudo chmod 775 backend/media/blog_editor_temp/
sudo mkdir -p /var/www/jdsite/app/run && sudo chown www-data:www-data /var/www/jdsite/app/run

# === REINICIAR ===
sudo systemctl restart jdiaz_gunicorn.service
sudo systemctl reload nginx
```

### Tiempo estimado por fase

| Fase                | Tiempo       | Dependencias                            |
| ------------------- | ------------ | --------------------------------------- |
| Backup BD           | 1-2 min      | MySQL corriendo                         |
| Git pull            | 30 seg       | Conexión a GitHub                       |
| pip install         | 1-3 min      | Solo si hay cambios en requirements.txt |
| npm build           | 30 seg       | Solo si hay cambios en .scss            |
| Migraciones         | 30 seg       | Sin migraciones destructivas            |
| collectstatic       | 1-2 min      | Archivos estáticos actualizados         |
| import_blogs        | 2-5 min      | Solo si hay cambios en blogs_source/    |
| Permisos            | 1 min        | Ejecutar como sudo                      |
| Reiniciar servicios | 30 seg       | Gunicorn + Nginx                        |
| Verificación        | 2-3 min      | Navegador + curl                        |
| **TOTAL**           | **8-15 min** | Sin contratiempos                       |

---

## 📚 REFERENCIAS

- **PROC-003:** Manual completo de despliegue y backup
- **PERMISOS_VPS_MEDIA_QR:** Guía detallada de permisos para media/
- **DIAG-003:** Diagnóstico de permisos de editor en producción
- **commands_ubuntu_permisos_usuarios.md:** Comandos Ubuntu para permisos

---

## ✅ CRITERIOS DE ACEPTACIÓN

- [ ] Se puede desplegar siguiendo esta checklist sin omitir pasos
- [ ] Todos los comandos están probados y funcionan en la VPS
- [ ] Los permisos de carpetas quedan correctos después del deploy
- [ ] La verificación post-despliegue pasa al 100%
- [ ] El rollback funciona en menos de 5 minutos si algo sale mal
- [ ] No se requiere conocimiento tribal (todo documentado aquí)

---

> 🎯 **OBJETIVO FINAL:** Cualquier desarrollador puede desplegar a producción siguiendo esta checklist, sin necesidad de consultar a Jaime ni adivinar comandos.