# HU-20_C_V2: Slides — envolver líneas internas en el contenedor del widget macho

## Objetivo

Lograr que el `position: relative` del widget macho de `:::slides` / `:::popup:gallery` envuelva visualmente **todas las líneas del bloque** (apertura + imágenes/videos + cierre), de modo que el DOM quede semánticamente agrupado y el widget tenga control sobre el bloque completo.

## Criterios de aceptación

- [ ] Las imágenes dentro de `:::slides` no reciben `CodeMirror-linewidget` individual.
- [ ] Las imágenes dentro de `:::popup:gallery` no reciben `CodeMirror-linewidget` individual.
- [ ] El contenedor con `position: relative` del widget macho agrupa todo el bloque (línea de apertura, imágenes, línea de cierre).
- [ ] Fuera de bloques, imágenes markdown, videos locales y referencias YouTube siguen teniendo su widget individual exactamente igual que antes.
- [ ] No se duplican widgets al arrastrar un slide.
- [ ] El botón de ayuda del widget macho abre el modal explicativo sin errores.

## Pasos de implementación (granulares)

### Fase 1: Estado `insideBlock` en `refreshImageWidgets`
- Modificar `refreshImageWidgets()` en `backend/blog/static/blog/js/blog_editor/index.js`.
- Agregar variable `var insideBlock = null;`.
- En el bucle de líneas:
  - Detectar apertura `:::slides` / `:::popup:gallery` → activar `insideBlock`.
  - Detectar cierre `:::` con `insideBlock` activo → desactivar `insideBlock`.
  - Si `insideBlock` está activo, saltar el procesamiento individual de imágenes/video/YouTube.
  - Si `insideBlock` es `null` y se detecta imagen/video/YouTube, crear el widget individual como se hace hoy.

### Fase 2: Envolver las líneas del bloque
- **Opción recomendada**: ajustar la lógica de `createSlideBlockWidget` para que el widget macho use un wrapper de bloque que se inyecte en el DOM antes de la línea de apertura y se cierre después de la línea de cierre.
- El wrapper debe ser un `<div style="position: relative;">` que contenga:
  - La línea `:::slides` (o `:::popup:gallery`).
  - Las líneas de imágenes/videos (sin `CodeMirror-linewidget` propio).
  - La línea de cierre `:::`.
- **Alternativa**: si el wrapper nativo de CodeMirror no lo permite de forma estable, implementar una superposición absoluta que se posicione según la altura del bloque, medida desde la línea de apertura hasta el cierre. Esta alternativa es más frágil y debe quedar documentada como última opción.

### Fase 3: Verificar no regresión
- Abrir editor con bloques normales (fuera de `:::slides`) y confirmar que imágenes/videos siguen mostrando su widget individual.
- Abrir editor con bloques `:::slides` y `:::popup:gallery` y confirmar que:
  - Solo se crea el widget macho en la línea de apertura.
  - Las líneas internas no tienen `CodeMirror-linewidget`.
  - El wrapper agrupa todo el bloque.
- Probar arrastrar un slide y confirmar que no se duplica.
- Probar el botón de ayuda del widget macho y confirmar que abre el modal.

## Puntos de código relevantes

- `backend/blog/static/blog/js/blog_editor/index.js`:
  - `refreshImageWidgets()` (líneas ~1566-1742).
  - `createSlideBlockWidget()` (líneas ~1450-1533).
  - `deleteSlideBlock()` (líneas ~1539-1560).
- `backend/blog/static/blog/js/blog_editor/slide-widget.js`:
  - Orquesta la creación del bloque, pero delega el refresco en `refreshImageWidgets()`.
- `backend/blog/static/blog/js/blog_editor/image-selector.js`:
  - Expone `detectImageContext()` (usado por `slide-widget.js`).
- `backend/blog/static/blog/js/blog_editor/diagnostico_slides.md`:
  - Diagnóstico detallado del problema y ejemplo de implementación.

## Notas para el implementador

- No modificar `createImageWidget`, `createLocalVideoWidget` ni `createYouTubeWidget`; no son parte del fix.
- El selector CSS `.CodeMirror-code>div:has(> .CodeMirror-linewidget > .img-line-widget.mtp-branded)` ya marca el contenedor padre del widget macho; confirmar que sigue funcionando tras el wrapper.
- Si se opta por wrapper manual, tener en cuenta que CodeMirror puede regenerar el DOM de líneas; hay que re-aplicar el wrapper en cada `refreshImageWidgets()` o en eventos de `change`.
- Si el wrapper manual genera parpadeos o desalineaciones, evaluar la opción de superposición absoluta.

## Estado

Pendiente de implementación.