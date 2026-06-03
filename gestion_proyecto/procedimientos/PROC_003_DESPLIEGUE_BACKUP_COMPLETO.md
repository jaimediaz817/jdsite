# 🚀 PROC-003: Manual Completo de Despliegue y Backup para jdsite

> **Versión:** 2.0 (Unifica y reemplaza a PROC-002)
> **Fecha:** 02/06/2026
> **Responsable:** Jaime Díaz
> **Tiempo estimado:** 10-15 min (despliegue completo)
> **Entorno objetivo:** VPS Producción (Nginx + Gunicorn) / Local (Django runserver)

---

## 📋 SECCIONES

1. [Estructura del proyecto](#-1-estructura-del-proyecto)
2. [Despliegue rápido (checklist)](#-2-despliegue-rápido-paso-a-paso)
3. [Despliegue con SCSS](#-3-despliegue-con-scss-cuando-aplica)
4. [Respaldos (Backups)](#-4-respaldos-backups)
5. [Restauración desde backup](#-5-restauración-desde-backup)
6. [Rollback (algo salió mal)](#-6-rollback-si-algo-sale-mal)
7. [Automatización con script](#-7-automatización-opcional)
8. [Referencia rápida](#-8-referencia-rápida-de-comandos)

---

## 🏗 1. ESTRUCTURA DEL PROYECTO

```
/var/www/jdsite/                          ← Raíz en VPS (o raíz local)
├── backend/
│   ├── manage.py                         ← Entry point Django
│   ├── blog/
│   │   ├── models.py                     ← Modelos (Category, Tag, BlogPost, Concept)
│   │   ├── views.py                      ← Vistas (BlogListView, BlogDetailView)
│   │   ├── urls.py                       ← URLs del blog
│   │   ├── sitemaps.py                   ← Sitemaps (BlogPostSitemap)
│   │   ├── feeds.py                      ← RSS/Atom feeds
│   │   ├── templatetags/
│   │   ├── templates/blog/
│   │   │   ├── blog_detail.html
│   │   │   ├── blog_list.html
│   │   │   └── partials/
│   │   └── static/blog/
│   │       ├── css/blog_detail.css
│   │       ├── css/blog_list.css
│   │       ├── js/blog_detail.js
│   │       └── ...
│   ├── jdsite/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── static/                           ← Archivos estáticos RECOLECTADOS
│   │   ├── css/
│   │   ├── js/
│   │   └── blog/images/
│   ├── blogs_source/                     ← 📝 Fuente de verdad de los blogs (.md)
│   │   └── YYYY-MM-DD_titulo/
│   │       ├── blog.md
│   │       └── images/
│   └── media/                            ← Archivos subidos por usuarios
├── .venv/                                ← Entorno virtual Python (NO se sube a git)
├── .env                                  ← Variables sensibles (NO se sube a git)
├── requirements.txt
├── package.json                          ← SCSS (sass watch, sass build)
├── infra/
│   └── mysql/
│       └── docker-compose.yml            ← MySQL local + phpMyAdmin
└── gestion_proyecto/                     ← Documentación del proyecto
```

### 📌 Regla de oro: ¿Qué se sube a git?

| Archivo/Carpeta                  | ¿Git? | Motivo                          |
| -------------------------------- | ----- | ------------------------------- |
| `backend/` (código)              | ✅ Sí  | Fuente de verdad del desarrollo |
| `backend/blogs_source/`          | ✅ Sí  | Fuente de verdad de los blogs   |
| `infra/`                         | ✅ Sí  | Infraestructura como código     |
| `gestion_proyecto/`              | ✅ Sí  | Documentación                   |
| `requirements.txt`               | ✅ Sí  | Dependencias                    |
| `package.json`                   | ✅ Sí  | SCSS build                      |
| `.venv/`                         | ❌ NO  | Entorno virtual, se regenera    |
| `.env`                           | ❌ NO  | Secrets, solo en servidor       |
| `backend/static/` (recolectados) | ❌ NO  | Se regenera con `collectstatic` |
| `node_modules/`                  | ❌ NO  | Se regenera con `npm install`   |
| `__pycache__/`                   | ❌ NO  | Caché de Python                 |

---

## ✅ 2. DESPLIEGUE RÁPIDO (Paso a Paso)

> ⏱ **Tiempo estimado:** 5-7 minutos

### 🔴 PRERREQUISITOS
- [ ] Tienes acceso SSH a la VPS
- [ ] El `.env` de producción está actualizado en el servidor
- [ ] Los cambios están pusheados a `main` en GitHub
- [ ] No hay otro despliegue en curso

### 🟠 PASO 1: Conectarse al servidor
```bash
ssh usuario@jaimediaz.dev
cd /var/www/jdsite
```

### 🟠 PASO 2: Actualizar código desde GitHub
```bash
# Ver estado actual
git status
git fetch --all

# Traer últimos cambios
git pull origin main
```
> ⚠️ Si hay CONFLICTOS: abortar, no resolver en producción. Hacer rollback.

### 🟠 PASO 3: Activar entorno virtual
```bash
source venv/bin/activate
```
> En local (Windows): `source .venv/Scripts/activate`

### 🟠 PASO 4: Instalar dependencias nuevas (si las hay)
```bash
pip install -r requirements.txt
```

### 🟠 PASO 5: Compilar SCSS (si hay cambios en .scss)
```bash
cd /var/www/jdsite  # raíz del proyecto (donde está package.json)
npm run sass:build
```
> En local: `npm run sass:watch` para desarrollo continuo

> Si no hay cambios SCSS, saltar este paso.

### 🟠 PASO 6: Ejecutar migraciones de base de datos
```bash
cd backend
python manage.py migrate
```
> ⚠️ Verificar que las migraciones no sean destructivas (no borrar columnas)

### 🟠 PASO 7: Recolectar archivos estáticos
```bash
python manage.py collectstatic --noinput
```
> ✅ **OBLIGATORIO SIEMPRE.** Actualiza CSS, JS, imágenes en producción.

### 🟠 PASO 8: Importar blogs actualizados
```bash
python manage.py import_blogs
```
> ✅ **SIEMPRE.** Idempotente, seguro, no crea duplicados.

### 🟠 PASO 9: Reiniciar Gunicorn
```bash
sudo systemctl restart jdiaz_gunicorn.service
```

### 🟠 PASO 10: Verificar estado
```bash
sudo systemctl status jdiaz_gunicorn.service --no-pager
curl -I https://jaimediaz.dev
```
> ✅ Debe mostrar `active (running)` y HTTP `200 OK`

### 🟠 PASO 11: Prueba de humo manual
- [ ] Abrir `https://jaimediaz.dev` en navegador
- [ ] Revisar que carga sin errores 500
- [ ] Revisar que CSS/JS carguen (F12 → Console, sin errores 404)
- [ ] Abrir un par de artículos del blog
- [ ] Verificar que sitemap.xml cargue: `https://jaimediaz.dev/sitemap.xml`

---

## 🎨 3. DESPLIEGUE CON SCSS (cuando aplica)

Los estilos SCSS viven en `backend/static/css/scss/`. Se compilan a CSS normal.

### 3.1 En desarrollo (local - Windows)
```bash
# Terminal 1: Compilación automática ante cambios
npm run sass:watch
```
Usa `_home_custom.scss`, `_header.scss`, `_projects_section.scss`, etc.

### 3.2 En producción (VPS)
```bash
# Compilación única
npm run sass:build

# Luego recolectar estáticos
cd backend
python manage.py collectstatic --noinput
```

### 3.3 ¿Cuándo compilar SCSS?
| Situación                                | ¿Compilar?                     |
| ---------------------------------------- | ------------------------------ |
| Cambios solo en HTML/Django templates    | ❌ No                           |
| Cambios en CSS directo (blog_detail.css) | ❌ No, solo collectstatic       |
| Cambios en .scss (SASS)                  | ✅ Sí, compilar + collectstatic |
| Nueva HU que toca estilos                | ✅ Sí                           |

---

## 💾 4. RESPALDOS (BACKUPS)

> ⚠️ **CRÍTICO:** Sin backups, cualquier error en DB puede ser irreversible.

### 4.1 ¿Qué hay que respaldar? (Prioridades)

| Prioridad | Elemento                      | Método          | Frecuencia sugerida               |
| --------- | ----------------------------- | --------------- | --------------------------------- |
| 🔴 CRÍTICO | Base de datos MySQL           | `mysqldump`     | Diaria                            |
| 🟡 ALTA    | Archivos `.md` (blogs_source) | Git             | Cada commit (ya está en git)      |
| 🟡 ALTA    | Carpeta `media/`              | `rsync` o SCP   | Semanal                           |
| 🟢 MEDIA   | Archivos estáticos            | `collectstatic` | Se regeneran (no requiere backup) |
| 🟢 MEDIA   | Configuración Nginx           | `rsync`         | Solo cuando cambie                |
| 🟢 MEDIA   | `.env`                        | Backup manual   | Cada vez que cambie               |

### 4.2 Backup de base de datos (MySQL)

#### Comando manual
```bash
# En la VPS
mysqldump -u jdsite -p jdsite > /var/backups/jdsite_$(date +%Y%m%d_%H%M%S).sql
```

#### Script automatizado (`/var/www/jdsite/scripts/backup_db.sh`)
```bash
#!/bin/bash
# 📦 Backup automático de base de datos jdsite
# Ejecutar: bash scripts/backup_db.sh

BACKUP_DIR="/var/backups/jdsite"
DB_NAME="jdsite"
DB_USER="jdsite"
DB_PASS="$(grep DB_PASSWORD /var/www/jdsite/.env | cut -d '=' -f2)"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Nombre del archivo
FILENAME="${BACKUP_DIR}/jdsite_$(date +%Y%m%d_%H%M%S).sql"

# Exportar
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $FILENAME

# Comprimir (ahorra ~80% espacio)
gzip $FILENAME

# Eliminar backups antiguos (>30 días)
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup creado: ${FILENAME}.gz"
echo "📊 Total backups: $(ls $BACKUP_DIR/*.sql.gz | wc -l)"
```

### 4.3 Backup de archivos (media, nginx, .env)

```bash
#!/bin/bash
# 📦 Backup de archivos del proyecto
BACKUP_DIR="/var/backups/jdsite_files"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Respaldar media, .env y config nginx
tar -czf "${BACKUP_DIR}/jdsite_files_${DATE}.tar.gz" \
    -C /var/www/jdsite backend/media \
    -C /var/www/jdsite .env \
    -C /etc/nginx/sites-available jaimediaz.dev

echo "✅ Backup de archivos: jdsite_files_${DATE}.tar.gz"
```

### 4.4 Automatizar con cron (VPS)

```bash
# Editar crontab
crontab -e

# Agregar estas líneas:
# Backup BD todos los días a las 3:00 AM
0 3 * * * bash /var/www/jdsite/scripts/backup_db.sh >> /var/log/jdsite_backup.log 2>&1

# Backup archivos cada domingo a las 4:00 AM
0 4 * * 0 bash /var/www/jdsite/scripts/backup_files.sh >> /var/log/jdsite_backup_files.log 2>&1
```

### 4.5 ¿A dónde llevar los backups?

| Destino                      | Método         | Recomendación                          |
| ---------------------------- | -------------- | -------------------------------------- |
| Mismo servidor (VPS)         | Script local   | ✅ Rápido, pero si el servidor muere... |
| GitHub Secrets               | GitHub Actions | ✅ Bueno para `.env`                    |
| AWS S3 / DigitalOcean Spaces | `aws s3 cp`    | ✅ Recomendado (off-site)               |
| Dropbox / Google Drive       | `rclone`       | 🟡 Alternativa gratuita                 |
| SCP a otro servidor          | `scp`          | 🟡 Si tienes segundo VPS                |

**Recomendación:** Al menos backup LOCAL (VPS) + copia a S3 o Dropbox.

---

## 🔄 5. RESTAURACIÓN DESDE BACKUP

### 5.1 Restaurar base de datos
```bash
# Listar backups disponibles
ls -la /var/backups/jdsite/

# Descomprimir si está .gz
gunzip /var/backups/jdsite/jdsite_20260602_030000.sql.gz

# Restaurar
mysql -u jdsite -p jdsite < /var/backups/jdsite/jdsite_20260602_030000.sql
```

### 5.2 Restaurar archivos
```bash
# Listar backups
ls -la /var/backups/jdsite_files/

# Extraer
tar -xzf /var/backups/jdsite_files/jdsite_files_20260602.tar.gz -C /
```

---

## 🔙 6. ROLLBACK (si algo sale mal)

### 6.1 Rollback de código (rápido)
```bash
# Volver al commit anterior
cd /var/www/jdsite
git reset --hard HEAD~1

# Recolectar estáticos del commit anterior
cd backend
python manage.py collectstatic --noinput

# Reiniciar servicio
sudo systemctl restart jdiaz_gunicorn.service
```

### 6.2 Rollback de base de datos
```bash
# Si se ejecutó una migración problemática:
# Opción 1: Revertir migración
python manage.py migrate blog 0008  # volver a migración anterior

# Opción 2: Restaurar backup (si tienes)
mysql -u jdsite -p jdsite < /var/backups/jdsite/backup_anterior.sql
```

### 6.3 Rollback completo (código + BD)
```bash
# 1. Restaurar código
git reset --hard <commit-hash-estable>

# 2. Restaurar BD
mysql -u jdsite -p jdsite < /var/backups/jdsite/backup_anterior.sql

# 3. Recolectar estáticos
python manage.py collectstatic --noinput

# 4. Reiniciar
sudo systemctl restart jdiaz_gunicorn.service
```

---

## 🤖 7. AUTOMATIZACIÓN (Opcional)

### 7.1 Script único de despliegue

Crear `/var/www/jdsite/scripts/deploy.sh`:

```bash
#!/bin/bash
# 🚀 Despliegue automático completo jdsite
# Uso: bash scripts/deploy.sh

set -e  # Salir si algún comando falla

echo "🚀 Iniciando despliegue..."

cd /var/www/jdsite

# 1. Git pull
echo "📥 Actualizando código..."
git pull origin main

# 2. Activar venv
echo "🐍 Activando entorno virtual..."
source venv/bin/activate

# 3. Dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

# 4. SCSS (si existe)
if [ -f "package.json" ] && grep -q "sass:build" package.json; then
    echo "🎨 Compilando SCSS..."
    npm run sass:build
fi

# 5. Migraciones
echo "🗄 Ejecutando migraciones..."
cd backend
python manage.py migrate

# 6. Estáticos
echo "📁 Recolectando estáticos..."
python manage.py collectstatic --noinput

# 7. Blogs
echo "📝 Importando blogs..."
python manage.py import_blogs

# 8. Reiniciar
echo "🔄 Reiniciando Gunicorn..."
sudo systemctl restart jdiaz_gunicorn.service

# 9. Verificar
echo "✅ Verificando..."
sleep 2
sudo systemctl status jdiaz_gunicorn.service --no-pager
curl -I https://jaimediaz.dev | head -n 1

echo "🎉 Despliegue completado!"
```

> ⚠️ Dar permisos de ejecución: `chmod +x scripts/deploy.sh`
> ▶️ Ejecutar: `bash scripts/deploy.sh`

### 7.2 (Futuro) GitHub Actions

Para despliegue automático al hacer push a `main`, se puede crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Execute deploy script on VPS
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/jdsite
            bash scripts/deploy.sh
```

---

## ⚡ 8. REFERENCIA RÁPIDA DE COMANDOS

### 🔧 Local (desarrollo)

```bash
# Activar entorno
source .venv/Scripts/activate

# Servidor de desarrollo
cd backend && python manage.py runserver 0.0.0.0:8000

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Importar blogs
python manage.py import_blogs

# SCSS watch (auto-compila)
npm run sass:watch

# SCSS build (una vez)
npm run sass:build
```

### 🖥 VPS (producción)

```bash
# Conectarse
ssh usuario@jaimediaz.dev

# Actualizar código
cd /var/www/jdsite && git pull origin main

# Ver logs de Gunicorn
sudo journalctl -u jdiaz_gunicorn.service -f -n 100

# Reiniciar Gunicorn
sudo systemctl restart jdiaz_gunicorn.service

# Ver estado
sudo systemctl status jdiaz_gunicorn.service --no-pager

# Backup manual BD
bash scripts/backup_db.sh

# Backup manual archivos
bash scripts/backup_files.sh

# Despliegue completo
bash scripts/deploy.sh

# Rollback
git reset --hard HEAD~1 && cd backend && python manage.py collectstatic --noinput && sudo systemctl restart jdiaz_gunicorn.service
```

### 🐳 Docker (MySQL local)
```bash
# Iniciar MySQL + phpMyAdmin
cd infra/mysql && docker compose up -d

# phpMyAdmin: http://localhost:8081
# MySQL: puerto 3307
```

---

## ✅ CHECKLIST POST-DESPLIEGUE

- [ ] Página principal carga sin errores (200 OK)
- [ ] Estilos CSS cargan correctamente (sin 404)
- [ ] JavaScript no muestra errores en consola
- [ ] Blog list muestra artículos correctamente
- [ ] Blog detail carga con todos los elementos (tags, conceptos, schema)
- [ ] Sitemap.xml incluye todos los posts: `curl https://jaimediaz.dev/sitemap.xml | grep url`
- [ ] RSS/Atom feed funciona: `curl https://jaimediaz.dev/blog/feed/rss/`
- [ ] Formulario de contacto funciona
- [ ] Login OAuth (Google/GitHub) funciona
- [ ] Comentarios: se pueden crear y ver
- [ ] Google Rich Results Test: sin errores (opcional)
- [ ] `sudo systemctl status gunicorn` → active (running)

---

## 📌 NOTAS IMPORTANTES

1. **PROC-003 reemplaza a PROC-002.** Este documento contiene todo el conocimiento acumulado.
2. **Siempre hacer backup antes de migraciones destructivas.**
3. **No resolver conflictos de git en producción.** Rollback y arreglar en local.
4. **La fuente de verdad de los blogs es `blogs_source/`.** La BD es solo cache.
5. **Los highlights de usuarios (HU-016) viven en localStorage.** No hay BD que respaldar.
6. **Si añades una nueva app Django**, recuerda: `makemigrations` + `migrate` + registrar en `settings.py`.

> 📌 **Última actualización:** 02/06/2026
> 📌 **Aplicable desde:** HU-012 en adelante
> 📌 **Reemplaza a:** PROC-002 (v1.0, 28/04/2026)