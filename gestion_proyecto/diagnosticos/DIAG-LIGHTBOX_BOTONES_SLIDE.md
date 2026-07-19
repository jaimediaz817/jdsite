# DIAGNÓSTICO: Botones de navegación del modal slide (galleryModal)

## Problema
Los botones `#gallery-toggle-slides` y `#gallery-toggle-gallery` del modal `#galleryModal` no responden al click.

## Archivos modificados con console.log

### 1. `backend/blog/static/blog/js/blog_editor/slide-widget.js`
- Agregado `console.log('[slide-widget] modulo cargado');` al iniciar
- Agregado `console.log('🔧 bindGalleryModalControls: pillSlides=', !!pillSlides, ...)` en bind
- Agregado `console.log('📊 pillsSlidesClick called');` en el click handler de slides
- Agregado `console.log('🖼️ pillsGalleryClick called');` en el click handler de gallery

## ACCIÓN REQUERIDA EN EL VPS

### Pasos:
```bash
# 1. Pull los cambios
git pull origin main

# 2. Collectstatic
python manage.py collectstatic --noinput

# 3. Reiniciar el servidor (si aplica)
# systemctl restart gunicorn  # o el comando que uses
```

### Verificar en el navegador:
1. Abrir la consola del navegador (F12)
2. Ir a la página del editor de blog
3. Click en el botón de **Slides** de la barra MTP
4. Ver los logs:
   - `[slide-widget] modulo cargado` - ¿se ve al cargar la página?
   - `🔧 bindGalleryModalControls: pillSlides=true pillGallery=true` - ¿existen los elementos?
   - `📊 pillsSlidesClick called` - ¿se ejecuta al hacer click?

## Posibles causas si no funciona:
1. **jQuery no cargado**: El modal usa `$('#galleryModal').modal('show')` que requiere jQuery
2. **Bootstrap 4 no funciona**: El proyecto usa Bootstrap 4, no 5
3. **Los elementos no existen en el DOM**: Verificar que `#gallery-toggle-slides` y `#gallery-toggle-gallery` están en el template