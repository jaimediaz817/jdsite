# HU-20_C_V2: Slides — envolver líneas internas en contenedor del widget macho

## Objetivo

Lograr que el `position: relative` del widget macho de `:::slides` / `:::popup:gallery` envuelva visualmente **todas las líneas del bloque** (apertura + imágenes/videos + cierre), de modo que el DOM quede semánticamente agrupado y el widget tenga control sobre el bloque completo.

## Criterios de aceptación

- [ ] Las imágenes dentro de `:::slides` no reciben `CodeMirror-linewidget` individual.
- [ ] Las imágenes dentro de `:::popup:gallery` no reciben `CodeMirror-linewidget` individual.
- [ ] El contenedor con `position: relative` del widget macho agrupa todo el bloque (línea de apertura, imágenes, línea de cierre).
- [ ] Fuera de bloques, imágenes markdown, videos locales y referencias YouTube siguen teniendo su widget individual exactamente igual que antes.
- [ ] No se duplican widgets al arrastrar un slide.
- [ ] El botón de ayuda del widget macho abre el modal explicativo sin errores.

## Estado

Completada.

## Cambios realizados

- `backend/blog/static/blog/js/blog_editor/index.js` — `refreshImageWidgets()`:
  - Al inicio: limpieza de `.slideblock-wrapper` huérfanos.
  - En apertura `:::slides` / `:::popup:gallery`: crea `<div class="slideblock-wrapper widget-container" style="position: relative;">`, inserta el wrapper antes de la línea y mueve la línea de apertura dentro del wrapper.
  - En cierre `:::`: mueve la línea de cierre dentro del wrapper activo.
  - Dentro del bloque: sigue activo el salto `insideBlock` para no crear widgets individuales por imagen/video/YouTube.
  - Después del wrapper: crea el widget macho con `addLineWidget` posicionado en la línea de apertura, que ya está dentro del wrapper.

- `backend/blog/static/blog/js/blog_editor/index.js` — `startBlockDrag()`:
  - El wrapper del CodeMirror (editorWrapper) también recibe la clase `.widget-container` cuando se inicia un arrastre de bloque.

- `backend/blog/static/blog/css/blog_editor.css`:
  - Agregada regla `.slideblock-wrapper { position: relative; }`.

- **NUEVO**: Todos los divs envoltorio de widgets (tanto `.slideblock-wrapper` como el editorWrapper de CodeMirror durante arrastres) incluyen ahora la clase `.widget-container` como selector identificador único. Esto permite apuntar a cualquier contenedor de widget sin depender de estilos inline.

## Selector disponible

```css
.widget-container       /* cualquier div envoltorio de widget (slides, gallery, drag) */
.slideblock-wrapper     /* específicamente el wrapper de bloques :::slides / :::popup:gallery */
```

## Resultado DOM esperado

```html
<div class="slideblock-wrapper widget-container" style="position: relative;">
  <pre class="CodeMirror-line">:::slides</pre>
  <div class="CodeMirror-linewidget">…widget macho…</div>

  <pre class="CodeMirror-line">![img1](…)</pre>
  <pre class="CodeMirror-line">![img2](…)</pre>

  <pre class="CodeMirror-line">:::</pre>
</div>
```

> **Nota:** El selector `.widget-container` identifica a cualquier div envoltorio de widget (slides, popup:gallery, y también el wrapper del CodeMirror durante arrastres). Esto permite apuntar a estos contenedores sin depender de estilos inline como `position: relative`.

## Validación manual recomendada

1. Abrir el editor con un bloque `:::slides` y confirmar que solo se muestra el widget macho.
2. Confirmar que las imágenes del bloque no tienen `CodeMirror-linewidget` propio.
3. Confirmar que fuera de `:::slides` las imágenes/videos/YouTube siguen mostrando su widget individual.
4. Probar arrastrar el slide y validar que no se duplican widgets.
5. Probar el botón de ayuda del widget macho y confirmar que abre el modal.