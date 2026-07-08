# Diagnóstico: Imágenes de artículos importados no cargan (404)

## Fecha
2026-07-05

## Síntoma #1 (404)
Las imágenes de artículos importados (como `test_blog`) muestran 404:
```
GET https://jaimediaz.dev/static/blogs/test_blog/img_20260501_181947_474178e1.jpg 404
```

## Síntoma #2 (Permission denied)
```
PermissionError: [Errno 13] Permission denied: '/var/www/jdiaz.tipsterbyte.com/app/backend/static/blogs/test_blog/captura_de_pantalla_1_9dfcfc86.png'
```

## Causa raíz
1. Las imágenes existen en `blogs_source/test_blog/` (directorio fuente)
2. Pero NO estaban en `static/blogs/test_blog/` donde nginx las busca
3. Al copiarlas con `sudo cp`, quedaron como `root:root` sin permiso de escritura
4. `www-data` (gunicorn) necesita ser propietario para escribir durante el guardado

## Solución aplicada (VPS)

```bash
# 1. Copiar imágenes desde blogs_source a static/blogs
sudo cp -v blogs_source/test_blog/*.jpg blogs_source/test_blog/*.png static/blogs/test_blog/

# 2. Arreglar propiedad y permisos
sudo chown -R www-data:www-data static/blogs/
sudo chmod -R 775 static/blogs/

sudo chown -R www-data:www-data blogs_source/
sudo chmod -R 775 blogs_source/

sudo chown -R www-data:www-data media/
sudo chmod -R 775 media/

# 3. Recargar servicio
sudo systemctl restart jdiaz_gunicorn
```

## Estado
✅ Imágenes copiadas y sirviendo (HTTP 200) - verificado con curl
✅ Permisos arreglados: `www-data:www-data` con 775
✅ gunicorn reiniciado

## Próximos pasos
1. Recargar editor con Ctrl+F5
2. Recuperar borrador del artículo
3. Guardar el artículo - ya no debería haber Permission denied
