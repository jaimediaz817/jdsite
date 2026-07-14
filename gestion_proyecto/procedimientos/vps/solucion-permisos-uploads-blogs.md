# Solución: 404 en imágenes de blogs por permisos y hash mismatch

## Diagnóstico
- `import_blogs` falla con `PermissionError` al copiar imágenes.
- Se resuelve con `chown jdiaz:www-data` + `chmod 775` en `backend/static/blogs` y `backend/media`.
- Luego suele reaparecer un 404 porque el artículo sigue reference un hash viejo.

## Procedimiento rápido
```bash
cd /var/www/jdiaz.tipsterbyte.com/app

# Si hay un 404 tras una importación: corregir permisos
sudo chown -R jdiaz:www-data backend/media backend/static/blogs
sudo chmod -R 775 backend/media backend/static/blogs

# Limpiar la carpeta del slug afectado (si existe)
sudo rm -rf backend/static/blogs/2026-07-03_test

# Re-importar
cd backend && source env/bin/activate
python manage.py import_blogs 2>&1
```

## Verificación posterior
```bash
ls -la backend/static/blogs/2026-07-03_test/
```
Tiene que figurar al menos la imagen del artículo.