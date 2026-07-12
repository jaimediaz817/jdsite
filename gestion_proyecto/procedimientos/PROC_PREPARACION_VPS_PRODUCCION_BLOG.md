# Procedimiento: Preparar VPS para producción (blog jdiaz)

> Objetivo: dejar la VPS lista desde cero, sin imágenes basura, sin `PermissionError`, y con las rutas de estáticos/media funcionando.
> Entorno producción: `/var/www/jdiaz.tipsterbyte.com/app`

---

## 1) Rutas que usa este blog (solo estas)

| Variable/ruta   | Valor                   | Responsabilidad                                                                   |
| --------------- | ----------------------- | --------------------------------------------------------------------------------- |
| `STATIC_ROOT`   | `backend/staticfiles/`  | Se llena con `collectstatic`. No se edita manualmente.                            |
| `MEDIA_ROOT`    | `backend/media/`        | Uploads temporales/editor y QR.                                                   |
| `blogs_source`  | `backend/blogs_source/` | **NO USAR EN PRODUCCIÓN**. Solo desarrollo local.                                 |
| `static/blogs/` | `backend/static/blogs/` | Fuente estática del blog. En prod se accede desde `staticfiles` mediante symlink. |

En producción **no se escribe** en `blogs_source`. El flujo correcto usa `import_blogs` y sirve estáticos desde `staticfiles/`.

### Carpetas de escritura en producción
- `backend/media/blog_editor_temp/` → subidas del editor
- `backend/media/qr_codes/` → QR generados
- `backend/staticfiles/` → se regenera con `collectstatic`

### Symlink obligatorio
`backend/staticfiles/blogs` -> `backend/static/blogs`

Nginx/serve sirve desde `STATIC_ROOT`, por lo que `staticfiles/blogs` debe apuntar a `static/blogs`.

---

## 2) Diagnóstico rápido (sin tocar nada)

Ejecuta en la VPS:
```bash
cd /var/www/jdiaz.tipsterbyte.com/app

echo "=== Carpetas y symlink ==="
for d in backend/staticfiles backend/static backend/static/blogs backend/blogs_source backend/media backend/media/blog_editor_temp backend/media/qr_codes; do
  [ -d "$d" ] && echo "[OK DIR] $d" || echo "[NO DIR] $d"
done

[ -L backend/staticfiles/blogs ] && echo "[OK SYMLINK] staticfiles/blogs -> static/blogs" || echo "[NO SYMLINK] staticfiles/blogs"

echo
echo "=== Ocupación ==="
du -sh backend/staticfiles backend/static/blogs backend/blogs_source backend/media/blog_editor_temp backend/media/qr_codes 2>/dev/null || true

echo
echo "=== Archivos ==="
find backend/staticfiles backend/static/blogs backend/blogs_source backend/media/blog_editor_temp backend/media/qr_codes -type f 2>/dev/null | wc -l
```

---

## 3) Limpieza para empezar desde cero

```bash
cd /var/www/jdiaz.tipsterbyte.com/app

echo "=== Limpiando recursos ==="
rm -f backend/staticfiles/blogs
[ -d backend/staticfiles ] && find backend/staticfiles -mindepth 1 -maxdepth 2 -exec rm -rf {} +

[ -d backend/static/blogs ] && find backend/static/blogs -mindepth 1 -maxdepth 2 -exec rm -rf {} +

[ -d backend/media/blog_editor_temp ] && find backend/media/blog_editor_temp -mindepth 1 -maxdepth 1 -exec rm -rf {} +

[ -d backend/media/qr_codes ] && find backend/media/qr_codes -mindepth 1 -maxdepth 1 -exec rm -rf {} +

# blogs_source no debería existir en producción
[ -d backend/blogs_source ] && find backend/blogs_source -mindepth 1 -maxdepth 2 -exec rm -rf {} +

echo "=== Recreando carpetas base ==="
mkdir -p backend/staticfiles backend/static/blogs backend/media/blog_editor_temp backend/media/qr_codes

echo "=== Verificación ==="
du -sh backend/staticfiles backend/static/blogs backend/blogs_source backend/media/blog_editor_temp backend/media/qr_codes 2>/dev/null || true
find backend/staticfiles backend/static/blogs backend/blogs_source backend/media/blog_editor_temp backend/media/qr_codes -type f 2>/dev/null | wc -l
```

---

## 4) Permisos fijos (evita `PermissionError`)

Usuario web: `www-data`.
Usuario recomendado despliegue: `deploy`.

```bash
cd /var/www/jdiaz.tipsterbyte.com/app

sudo chown -R deploy:www-data backend/staticfiles backend/static backend/media
sudo find backend/staticfiles backend/static backend/media -type d -exec chmod 2775 {} +
sudo find backend/staticfiles backend/static backend/media -type f -exec chmod 664 {} +
sudo chmod g+w backend/staticfiles backend/media/blog_editor_temp backend/media/qr_codes

# blogs_source no debería existir en prod; si existe, lo saneamos pero sin escritura global
if [ -d backend/blogs_source ]; then
  sudo chown -R root:www-data backend/blogs_source 2>/dev/null || true
  sudo find backend/blogs_source -type d -exec chmod 2755 {} +
  sudo find backend/blogs_source -type f -exec chmod 644 {} +
fi
```

Nota: `blogs_source/` no es ruta de escritura en producción. Cualquier `PermissionError` ahí indica flujo incorrecto en código.

---

## 5) Symlink obligatorio y verificación

```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend

# Si existe ruta o symlink anterior, lo eliminamos
rm -f staticfiles/blogs

# Crear symlink exacto
sudo ln -s static/blogs staticfiles/blogs

# Verificar
ls -ld staticfiles/blogs
readlink staticfiles/blogs || true
```

## 6) Checklist final

```bash
cd /var/www/jdiaz.tipsterbyte.com/app

echo "=== Estado ==="
for d in backend/staticfiles backend/static backend/static/blogs backend/media backend/media/blog_editor_temp backend/media/qr_codes; do
  [ -d "$d" ] && echo "[OK DIR] $d" || echo "[NO DIR] $d"
done
[ -L backend/staticfiles/blogs ] && echo "[OK SYMLINK] staticfiles/blogs" || echo "[NO SYMLINK] staticfiles/blogs"

echo
echo "=== Permisos ==="
namei -l backend/staticfiles/blogs backend/media/blog_editor_temp backend/media/qr_codes 2>/dev/null || ls -ld backend/staticfiles/blogs backend/media/blog_editor_temp backend/media/qr_codes

echo
echo "=== Contenido ==="
find backend/staticfiles backend/static/blogs backend/media/blog_editor_temp backend/media/qr_codes -type f 2>/dev/null | wc -l
```

---

## 7) Reglas de producción (no negociables)

1. `blogs_source/` **no existe** en producción.
2. `backend/staticfiles/` se regenera con `collectstatic` y no se edita a mano.
3. `backend/staticfiles/blogs` debe ser un symlink a `backend/static/blogs`.
4. `backend/media/` es la única ruta de escritura real del blog en prod.
5. Cualquier `PermissionError` en `blogs_source` en prod indica flujo incorrecto; usar exclusivamente `import_blogs`.

---

## 8) Diagnóstico y solución del error `PermissionError` en `blogs_source`

### Síntoma
```text
PermissionError: [Errno 13] Permission denied: '/var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/2026-07-03_test'
```
Traceback apunta a `blog/services.py` en `save_blog_to_source()` intentando crear carpetas en `blogs_source/`.

### Causa raíz
En producción **no se debe escribir** en `blogs_source/`. Si el código intenta crear carpetas ahí, indica uno de estos problemas:
1. `DJANGO_ENV=production` no está activo y el flujo usa lógica de desarrollo.
2. Existe `blogs_source/` con permisos incorrectos que permiten escritura cuando no debería.
3. El flujo web está usando `save_blog_to_source()` en lugar del modo importación.

### Solución paso a paso

```bash
cd /var/www/jdiaz.tipsterbyte.com/app

# 1) Confirmar entorno
grep DJANGO_ENV backend/.env || true

# 2) Quitar permisos de escritura a blogs_source si existe por error
if [ -d backend/blogs_source ]; then
  echo "[WARN] blogs_source existe en prod; limpiando y saneando..."
  find backend/blogs_source -mindepth 1 -maxdepth 2 -exec rm -rf {} +
  sudo chown -R root:www-data backend/blogs_source
  sudo find backend/blogs_source -type d -exec chmod 2755 {} +
  sudo find backend/blogs_source -type f -exec chmod 644 {} +
fi

# 3) Asegurar que el proceso web NO pueda escribir aquí
sudo chmod g-w backend/blogs_source 2>/dev/null || true

# 4) Verificar que las rutas de escritura reales estén correctas
sudo chown -R deploy:www-data backend/media backend/staticfiles backend/static
sudo find backend/media backend/staticfiles backend/static -type d -exec chmod 2775 {} +
sudo find backend/media backend/staticfiles backend/static -type f -exec chmod 664 {} +
sudo chmod g+w backend/media/blog_editor_temp backend/media/qr_codes backend/staticfiles

# 5) Recrear symlink de estáticos
cd /var/www/jdiaz.tipsterbyte.com/app/backend
rm -f staticfiles/blogs
sudo ln -s static/blogs staticfiles/blogs
```

### Verificación post-solución

```bash
cd /var/www/jdiaz.tipsterbyte.com/app

echo "=== Entorno ==="
grep DJANGO_ENV backend/.env || echo "DJANGO_ENV no definido"

echo
echo "=== Carpetas y symlink ==="
for d in backend/staticfiles backend/static backend/static/blogs backend/media backend/media/blog_editor_temp backend/media/qr_codes; do
  [ -d "$d" ] && echo "[OK DIR] $d" || echo "[NO DIR] $d"
done
[ -L backend/staticfiles/blogs ] && echo "[OK SYMLINK] staticfiles/blogs" || echo "[NO SYMLINK] staticfiles/blogs"

echo
echo "=== Permisos críticos ==="
ls -ld backend/media/blog_editor_temp backend/media/qr_codes backend/staticfiles
ls -ld backend/blogs_source 2>/dev/null || true

echo
echo "=== Contenido ==="
find backend/staticfiles backend/static backend/static/blogs backend/media/blog_editor_temp backend/media/qr_codes -type f 2>/dev/null | wc -l
```

### Recomendación adicional
Si después de este procedimiento el error persiste, forzar el flujo de edición en producción mediante `import_blogs` y evitar `save_blog_to_source()` en `services.py` cuando `DJANGO_ENV=production`.
