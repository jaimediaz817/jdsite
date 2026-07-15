# Solución: PermissionError en blogs_source al guardar borrador en producción

> Error exacto:
> PermissionError: [Errno 13] Permission denied: '/var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/2026-07-03_test'
>
> Origen: al guardar un borrador recuperado desde `backend/blog/templates/blog/blog_editor.html`
> Traceback: `blog/services.py`, línea 336, en `save_blog_to_source()`

---

## Diagnóstico correcto del flujo

`blogs_source/` sí es una carpeta de trabajo en producción, no es solo desarrollo. El flujo real es:

1. Creación/edición de artículos en `backend/blogs_source/<slug>/blog.md` y assets.
2. `import_blogs` procesa y copia imagenes/videos a `backend/static/blogs/<slug>/`.
3. `staticfiles/blogs` es un symlink a `static/blogs` para servir por nginx desde `STATIC_ROOT`.

Por lo tanto, el error se debe a que el proceso web (`www-data`) no tiene permisos de escritura en `backend/blogs_source/`.

---

## Solución paso a paso para la VPS

### Paso 0: Detectar usuario y grupo reales antes de ejecutar chown

```bash
cd /var/www/jdiaz.tipsterbyte.com/app
```

Ejecuta primero:

```bash
id deploy 2>/dev/null || echo "Usuario 'deploy' no existe"
getent group www-data || echo "Grupo 'www-data' no existe"
ps aux | grep -E 'nginx|gunicorn|uwsgi' | grep -v grep | head -5
```

- `id deploy`: verifica si existe un usuario `deploy`.
- `getent group www-data`: verifica si existe el grupo `www-data`.
- `ps aux`: muestra qué usuario ejecuta el proceso web/app.

Si `deploy` no existe, usa tu usuario real con sudo. Anota el usuario y grupo reales, porque lo vas a necesitar en los siguientes pasos.

---

### Paso 1: Cambiar propietario y grupo

```bash
sudo chown -R www-data:www-data backend/blogs_source backend/static backend/media backend/staticfiles
```

- En este VPS el usuario real confirmado es `www-data`.
- `chown -R www-data:www-data` aplica recursivamente a carpetas y archivos existentes.
- Esto evita que el proceso web herede permisos de `root` o de otro usuario inesperado.

---

### Paso 2: Permisos de directorios

```bash
sudo find backend/blogs_source backend/static backend/media backend/staticfiles -type d -exec chmod 2775 {} +
```

- `find ... -type d`: selecciona solo directorios.
- `chmod 2775`:
  - `2`: setgid bit. Los archivos creados dentro heredan el grupo `www-data`.
  - `7`: propietario tiene lectura+escritura+ejecución.
  - `7`: grupo tiene lectura+escritura+ejecución.
  - `5`: otros tienen lectura+ejecución.
- Importante para `blogs_source/`: el editor debe poder crear subcarpetas como `2026-07-03_test/`.

---

### Paso 3: Permisos de archivos

```bash
sudo find backend/blogs_source backend/static backend/media backend/staticfiles -type f -exec chmod 664 {} +
```

- `find ... -type f`: selecciona solo archivos.
- `chmod 664`:
  - `6`: propietario y grupo pueden leer y escribir.
  - `4`: otros pueden leer.
- Ajusta `.md`, imágenes, videos, etc. sin dar ejecutable.
- Con el setgid del paso 2, los archivos nuevos heredan el grupo `www-data`.

---

### Paso 4: Asegurar escritura explícita en rutas productivas

```bash
sudo chmod g+w backend/blogs_source backend/staticfiles backend/media/blog_editor_temp backend/media/qr_codes
```

- `g+w`: agrega escritura para el grupo a la carpeta actual.
- Esto fuerza que `www-data` pueda crear/editar en:
  - `blogs_source/` (flujo del editor).
  - `staticfiles/` (si aplica `collectstatic`).
  - `media/blog_editor_temp/` (subidas temporales).
  - `media/qr_codes/` (QR generados).

---

### Paso 5: Symlink obligatorio para servir estáticos

```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend
sudo rm -f staticfiles/blogs
sudo ln -s ../static/blogs staticfiles/blogs
```

- `rm -f staticfiles/blogs`: elimina symlink viejo o archivo roto si existe.
- `ln -s ../static/blogs staticfiles/blogs`: crea el acceso directo relativo.
- Por qué:
  - Nginx/sirve desde `STATIC_ROOT = staticfiles/`.
  - `import_blogs` copia assets a `static/blogs/<slug>/`.
  - Si no hay symlink, nginx busca en `staticfiles/blogs/` y devuelve 404.
  - Con symlink, `staticfiles/blogs` apunta a `static/blogs` y las imágenes cargan.

---

### Paso 6: Permisos recomendados para `media/`

```bash
cd /var/www/jdiaz.tipsterbyte.com/app
sudo chown -R www-data:www-data backend/media
sudo find backend/media -type d -exec chmod 2775 {} +
sudo find backend/media -type f -exec chmod 664 {} +
sudo chmod g+w backend/media/blog_editor_temp backend/media/qr_codes
```

- `backend/media/` guarda uploads del editor y QR.
- `chown -R ... backend/media`: mismo dueño/grupo que el resto del proyecto.
- `find backend/media -type d -exec chmod 2775 {} +`: aplica setgid a directorios.
- `find backend/media -type f -exec chmod 664 {} +`: ajusta permisos de archivos.
- `chmod g+w ... blog_editor_temp backend/media/qr_codes`: escritura explícita a subcarpetas de escritura real.

---

## Verificación y por qué cada chequeo

### Comando:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app
ls -ld backend/blogs_source backend/static/blogs backend/media/blog_editor_temp backend/media/qr_codes backend/staticfiles
```

- `ls -ld`: muestra dueño, grupo y permisos de cada directorio.
- Debes ver `www-data www-data` y permisos tipo `drwxrwsr-x` para directorios.

---

### Comando:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend
ls -ld staticfiles/blogs
readlink staticfiles/blogs || true
```

- `ls -ld` debe mostrar algo como `lrwxrwxrwx`.
- `readlink` debe devolver `static/blogs`.
- Si devuelve otra ruta o está vacío, el symlink está mal.

---

### Comando:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app
sudo -u www-data touch backend/blogs_source/.perm_test && echo "OK escritura blogs_source" || echo "FAIL escritura blogs_source"
sudo -u www-data rm -f backend/blogs_source/.perm_test
```

- `sudo -u www-data touch ...`: prueba real de escritura como usuario web.
- Si devuelve `OK`, el error original queda resuelto.
- El `.perm_test` se borra después para no dejar archivos basura.

---

## 🚀 Script automático: fix-prod-permissions.sh

Para no tener que ejecutar todo esto manualmente cada vez, creá este script en la VPS:

```bash
#!/bin/bash
# fix-prod-permissions.sh
# Soluciona permisos y symlink para blogs en producción
# Ejecutar: sudo bash fix-prod-permissions.sh

set -e

APP_DIR="/var/www/jdiaz.tipsterbyte.com/app"
USER_GROUP="www-data:www-data"

echo "=== Fix Permisos Producción ==="
echo "Directorio: $APP_DIR"
echo "Usuario/Grupo: $USER_GROUP"
echo

cd "$APP_DIR"

echo "1) Cambiar propietario..."
sudo chown -R $USER_GROUP backend/blogs_source backend/static backend/media backend/staticfiles
echo "   OK"

echo
echo "2) Permisos directorios (setgid)..."
sudo find backend/blogs_source backend/static backend/media backend/staticfiles -type d -exec chmod 2775 {} +
echo "   OK"

echo
echo "3) Permisos archivos..."
sudo find backend/blogs_source backend/static backend/media backend/staticfiles -type f -exec chmod 664 {} +
echo "   OK"

echo
echo "4) Escritura explícita en rutas productivas..."
sudo chmod g+w backend/blogs_source backend/staticfiles backend/media/blog_editor_temp backend/media/qr_codes 2>/dev/null || true
echo "   OK"

echo
echo "5) Corregir symlink staticfiles/blogs..."
cd backend
sudo rm -f staticfiles/blogs
sudo ln -s ../static/blogs staticfiles/blogs
echo "   Symlink: $(readlink staticfiles/blogs)"

echo
echo "6) Verificar..."
ls -ld staticfiles/blogs
ls -la staticfiles/blogs/ 2>/dev/null | head -5

echo
echo "7) Probar escritura como www-data..."
sudo -u www-data touch blogs_source/.perm_test && echo "   OK escritura blogs_source" || echo "   FAIL escritura blogs_source"
sudo rm -f blogs_source/.perm_test

echo
echo "=== ✅ Fix completado ==="
```

### Cómo usarlo

1. Guardá el script en la VPS:
   ```bash
   nano /var/www/jdiaz.tipsterbyte.com/app/fix-prod-permissions.sh
   ```
   Pegá el contenido y guardá (Ctrl+X, Y, Enter).

2. Dale permisos de ejecución:
   ```bash
   chmod +x /var/www/jdiaz.tipsterbyte.com/app/fix-prod-permissions.sh
   ```

3. Ejecutalo cuando tengas problemas de permisos o 404:
   ```bash
   sudo bash /var/www/jdiaz.tipsterbyte.com/app/fix-prod-permissions.sh
   ```

---

## ⚠️ Nota importante: `collectstatic` en producción

Si después de un `git pull` o deploy falla `collectstatic --clear` con:

```
PermissionError: [Errno 13] Permission denied: '.../staticfiles/procedimiento.md'
```

El motivo es que archivos nuevos en `staticfiles/` fueron creados por `jdiaz` en lugar de `www-data`, y `collectstatic --clear` no puede borrarlos.

### Solución rápida

Antes de `collectstatic`, ejecutá:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app
sudo chown -R www-data:www-data backend/staticfiles
sudo chmod -R 2775 backend/staticfiles
```

Luego ejecutá `collectstatic` como `www-data`:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend
sudo -u www-data env/bin/python manage.py collectstatic --noinput --clear
```

O bien, con el entorno virtual activado manualmente:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend
sudo -u www-data bash -c "source env/bin/activate && python manage.py collectstatic --noinput --clear"
```

Después, reimportá los blogs:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend
source env/bin/activate
python manage.py import_blogs 2>&1
```

---

## Comandos de verificación rápida

```bash
cd /var/www/jdiaz.tipsterbyte.com/app

echo "=== 1) Estado symlink ==="
ls -ld backend/staticfiles/blogs 2>&1
readlink backend/staticfiles/blogs 2>&1 || echo "NO_SYMLINK"

echo
echo "=== 2) Carpetas en static/blogs ==="
ls -la backend/static/blogs 2>&1 | head -80

echo
echo "=== 3) Carpetas en blogs_source ==="
ls -la backend/blogs_source 2>&1 | head -80

echo "=== Contenido de static/blogs/2026-07-03_test ==="
ls -la backend/static/blogs/2026-07-03_test

echo
echo "=== Verificar si blog.md tiene cover_image ==="
cat backend/blogs_source/2026-07-03_test/blog.md | head -40