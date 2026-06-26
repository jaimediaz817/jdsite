# Prompt para implementar HU-20_C_V2 — Slide Block Wrapper + .widget-container

```
Eres un desarrollador senior JS/Django trabajando en el proyecto jdsite_clean, siguiendo las reglas del archivo .clinerules del proyecto.

## Contexto

Esta HU ya fue implementada. El código actual en `index.js` ya contiene:
1. Flag `insideBlock` en `refreshImageWidgets()` que salta widgets individuales dentro de bloques `:::slides` / `:::popup:gallery`.
2. Wrapper fluido `.slideblock-wrapper` que envuelve apertura, imágenes y cierre del bloque.
3. Clase `.widget-container` añadida a los 3 divs envoltorio con `position: relative`.
4. En `startBlockDrag()`, el `editorWrapper` también recibe `.widget-container`.

## Si necesitas REVISAR o DEBUGGEAR el estado actual

1. Lee la HU: `gestion_proyecto/hus/HU-20_C_V2_slide_block_wrapper.md`
2. Lee el diagnóstico: `backend/blog/static/blog/js/blog_editor/diagnostico_slides.md`
3. Busca en `index.js`:
   - `refreshImageWidgets()` → busca `insideBlock`, `slideblock-wrapper`, `widget-container`
   - `startBlockDrag()` → busca `editorWrapper.classList.add('widget-container')`
4. Busca en CSS: `blog_editor.css` → regla `.slideblock-wrapper { position: relative; }`

## Si necesitas AJUSTAR o EXTENDER

### Selectores CSS disponibles
```css
.widget-container       /* cualquier div envoltorio de widget (slides, gallery, drag) */
.slideblock-wrapper     /* específicamente el wrapper de bloques :::slides / :::popup:gallery */
```

### Reglas de no regresión
- Fuera de bloques `:::slides`/`:::popup:gallery`, imágenes markdown, videos locales y YouTube deben seguir teniendo su widget individual.
- No modificar `createImageWidget`, `createLocalVideoWidget`, `createYouTubeWidget`.
- No modificar el comportamiento de videos sueltos.
- No borrar código existente; solo hacer cambios aditivos.

### Puntos de código clave
- `backend/blog/static/blog/js/blog_editor/index.js`:
  - `refreshImageWidgets()` — wrapper fluido, flag insideBlock, creación de widget macho.
  - `startBlockDrag()` — clase `.widget-container` al editorWrapper durante arrastre.
  - `cleanupBlockDragState()` — limpieza de clase dragging y referencias.
- `backend/blog/static/blog/css/blog_editor.css`:
  - `.slideblock-wrapper { position: relative; }` — contenedor fluido del bloque.

### Procedimiento obligatorio
- Activar entorno virtual: `source .venv/Scripts/activate`
- Luego `cd backend && python manage.py ...`
- NUNCA ejecutar comandos Django sin activar el entorno virtual primero.

### Flujo de trabajo
1. Cada cambio debe ser atómico y verificable.
2. Probar en navegador con F12 → inspeccionar DOM del editor.
3. Confirmar que dentro de `:::slides` las imágenes NO tienen `CodeMirror-linewidget`.
4. Confirmar que fuera del bloque las imágenes SÍ mantienen su widget individual.
5. Probar arrastrar slide → no debe duplicar widgets.
6. Probar botón de ayuda del widget macho → debe abrir modal.