# 🔒 PERMISOS VPS - Django + NGINX (Guía Definitiva)

> **HU-037: Configuración de permisos para producción**  
> Basado en diagnósticos reales y soluciones efectivas

---

## 📍 Rutas críticas que requieren permisos de escritura

```
backend/media/                          → Imágenes uploaded desde editor
backend/media/blog_editor_temp/           → Uploads temporales
backend/media/qr_codes/                   → Códigos QR generados
backend/staticfiles/                      → collectstatic (archivos estáticos compilados)
backend/static/images/                    → Imágenes fuente estáticas
```

---

## 🛠️ COMANDOS ESENCIALES PARA PERMISOS (ejecutar después de deploy)

```bash
# 1. Variables (ajustar según tu setup)
PROJECT_DIR="/var/www/jdsite"
DJANGO_USER="www-data"  # o el usuario de tu servidor web

# 2. Directorios MEDIA - escrictura para imágenes y QR
sudo mkdir -p /var/www/jdsite/backend/media/blog_editor_temp
sudo mkdir -p /var/www/jdsite/backend/media/qr_codes

# 3. Asignar propietario correcto (claves nginx)
sudo chown -R ${DJANGO_USER}:${DJANGO_USER} ${PROJECT_DIR}/backend/media/
sudo chown -R ${DJANGO_USER}:${DJANGO_USER} ${PROJECT_DIR}/backend/staticfiles/

# 4. Permisos de escritura (755 para directorios ejecutable, 644 para archivos)
sudo find ${PROJECT_DIR}/backend/media -type d -exec chmod 755 {} \;
sudo find ${PROJECT_DIR}/backend/media -type f -exec chmod 644 {} \;
sudo find ${PROJECT_DIR}/backend/staticfiles -type d -exec chmod 755 {} \;
sudo find ${PROJECT_DIR}/backend/staticfiles -type f -exec chmod 644 {} \;

# 5. Permisos especiales para uploads
sudo chmod 775 ${PROJECT_DIR}/backend/media/
sudo chmod 775 ${PROJECT_DIR}/backend/media/blog_editor_temp/
sudo chmod 775 ${PROJECT_DIR}/backend/media/qr_codes/
```

---

## 🔍 VERIFICACIÓN DE PERMISOS (chequeo post-deploy)

```bash
# Ver estructura de media
ls -la /var/www/jdsite/backend/media/

# Ver symlinks creados por deploy
ls -la /var/www/jdsite/backend/staticfiles/

# Chequear que NGINX pueda servir media
sudo -u www-data ls -la /var/www/jdsite/backend/media/qr_codes/
```

---

## 🔗 SYMLINKS RECOMENDADOS (NGINX)

En el config de NGINX (`/etc/nginx/sites-available/jaimediaz.dev`):

```nginx
# Servir archivos MEDIA (uploads, QR)
location /media/ {
    alias /var/www/jdsite/backend/media/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# Servir archivos STATIC (collectstatic)
location /static/ {
    alias /var/www/jdsite/backend/staticfiles/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

| Error                     | Causa                       | Solución                                  |
| ------------------------- | --------------------------- | ----------------------------------------- |
| 403 Forbidden en imágenes | Propietario incorrecto      | `sudo chown -R www-data:www-data media/`  |
| Upload falla con 500      | Sin permiso escritura       | `chmod 775 media/blog_editor_temp/`       |
| QR no se genera           | media/qr_codes sin permisos | `chmod 755 media/qr_codes/`               |
| Static no carga           | staticfiles sin symlinks    | Ejecutar `python manage.py collectstatic` |

---

## 💡 VERIFICACIÓN AUTOMÁTICA DE PERMISOS

```bash
# Script de verificación rápida
cat << 'EOF' > check_permissions.sh
#!/bin/bash
PROJECT="/var/www/jdsite/backend"
USER="www-data"

echo "=== Checking MEDIA permissions ==="
ls -la ${PROJECT}/media/
echo ""
echo "=== Checking QR codes permissions ==="
ls -la ${PROJECT}/media/qr_codes/
echo ""
echo "=== Testing write access ==="
sudo -u ${USER} touch ${PROJECT}/media/qr_codes/.test 2>&1 && echo "✓ Write OK" || echo "✗ Write FAILED"
sudo rm -f ${PROJECT}/media/qr_codes/.test
EOF
```

---

## 📝 NOTAS IMPORTANTES

- Los directorios `media/qr_codes/` y `media/blog_editor_temp/` DEBEN existir antes del primer deploy
- El `.gitignore` excluye `backend/media/qr_codes/` - se crean vacíos en VPS
- Siempre ejecutar `collectstatic --noinput` después de `git pull`
- NGINX requiere `www-data` (Ubuntu) o `nginx` (CentOS) según el SO