# Diagnóstico: Imágenes no cargan después de guardar artículo

## Fecha
2026-07-05

## Síntoma
Al crear/editar un artículo, subir una imagen, guardar, y luego volver a editar, las imágenes aparecen como rotas.

## Causa confirmada
Nginx busca archivos en `staticfiles/blogs/` pero Django guarda en `static/blogs/`. No existe symlink.

## Diagnóstico en VPS

### Directorios确认
```
/var/www/jdiaz.tipsterbyte.com/app/backend/media/blog_editor_temp/    ✓ EXISTE
/var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/               ✓ EXISTE
/var/www/jdiaz.tipsterbyte.com/app/backend/static/blogs/               ✓ EXISTE
```

### Error nginx (confirmado)
```
open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/2026-07-04_primer-articulo/jd_marca_personal_d189772f.jpg" failed (2: No such file or directory)
```

## Solución

Ejecutar en la VPS:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend

# 1. Crear symlink de staticfiles/blogs → static/blogs
sudo ln -s static/blogs staticfiles/blogs

# 2. Verificar que se creó
ls -la staticfiles/ | grep blogs

# 3. Recargar nginx
sudo systemctl reload nginx

# 4. Verificar que nginx sirve el archivo
curl -I http://localhost/static/blogs/2026-07-04_primer-articulo/jd_marca_personal_d189772f.jpg
```

El comando 4 debe responder `HTTP/1.1 200 OK`.

## ¿Qué hace exactamente el symlink y por qué lo necesitamos?

### Explicación conceptual

Imagina que tienes dos carpetas:

**Carpeta A (`static/blogs/`)** — donde Django guarda las imágenes de los artículos al subirlas desde el editor.

**Carpeta B (`staticfiles/blogs/`)** — donde nginx espera encontrar los archivos estáticos para servirlos por HTTP.

El problema es que nginx nunca mira en la carpeta A. Solo está configurado para servir desde la carpeta B. Por eso, aunque las imágenes existen en disco, nginx responde 403/404.

El symlink funciona como un **acceso directo**: creas un archivo especial `staticfiles/blogs` que apunta a `static/blogs`. Cuando nginx pida `/static/blogs/imagen.jpg`, el sistema operativo resuelve que debe leer realmente desde `static/blogs/imagen.jpg`.

No es una copia, no es un duplicado: es el mismo contenido, solo una ruta alternativa.

### Caso de uso paso a paso

**Escenario:** subes `foto.jpg` en el artículo `mi-post`.

1. Usuario sube imagen en el editor → Django la guarda en:
   `/var/www/jdiaz.tipsterbyte.com/app/backend/static/blogs/mi-post/foto.jpg`

2. Cuando el artículo se publica, el navegador pide:
   `https://jaimediaz.dev/static/blogs/mi-post/foto.jpg`

3. Nginx recibe la petición, y según su configuración:
   - `/static/` → mapea a `/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/`
   - Busca el archivo en: `/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/mi-post/foto.jpg`

4. **Sin symlink:** el archivo no existe en `staticfiles/blogs/` → nginx devuelve 404 → imagen rota.

5. **Con symlink:** `staticfiles/blogs` apunta a `static/blogs` → nginx encuentra el archivo → devuelve 200 → imagen se muestra correctamente.

## Fix frontend adicional (ya aplicado)
Se modificó `backend/blog/static/blog/js/blog_editor/index.js` línea 2122 para forzar URL permanente al recuperar borradores.

## Verificación final
1. Recargar editor con Ctrl+F5
2. Subir imagen de prueba
3. Guardar artículo
4. Editar nuevamente
5. Verificar que la imagen carga correctamente