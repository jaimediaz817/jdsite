# DIAGNÓSTICO: Slides — contenedor agrupador de líneas internas

## Problema actual

Dentro de un bloque `:::slides` o `:::popup:gallery`, las líneas del bloque (apertura + imágenes/videos + cierre) **no están agrupadas** en el mismo contenedor. El widget macho se crea en la línea de apertura, pero las líneas internas quedan como **elementos hermanos separados** fuera del contenedor que aloja el widget.

**Agrupación DOM NO es posible** con CodeMirror 5 sin modificar el núcleo. Cualquier intento de mover `<pre class="CodeMirror-line">` es revertido internamente.

## Solución implementada (Parcial / No funciona completamente)

### 1. Flag `insideBlock` — SKIP de líneas internas
Funciona: cuando se detecta `:::slides` o `:::popup:gallery`, se activa el flag y se salta la creación de widgets individuales para cada línea dentro del bloque. Solo se crea el widget macho en la línea de apertura.

### 2. Overlay visual — PROBLEMA: solo se calcula UNA VEZ
En `refreshImageWidgets()` (líneas 1751-1769) se inyecta un `div.slideblock-overlay` dentro del widget macho con `position: absolute` calculado una sola vez.

**PROBLEMA:** El overlay NO se actualiza cuando:
- Se hace scroll en el editor
- Se edita el contenido del bloque
- Se agregan/quitan líneas

Consecuencia: el usuario ve solo el span con los controles (grip, menú, ayuda), porque el overlay no cubre visualmente las líneas del bloque.

## Causa raíz del problema visual

El `span` del widget (`slideblock-widget-mtp`) es **inline** por defecto (`<span>`). Un overlay con `position: absolute` necesita un ancestro con `position: relative` para posicionarse correctamente. El span está inline, así que el overlay no tiene referencia de posicionamiento.

## Solución requerida

Convertir el `<span>` del widget macho en un contenedor con `display: inline-block` (o `display: inline-flex`) y `position: relative`, de modo que el overlay absoluto se posicione respecto a ese ancestro.

Además, el overlay necesita recalcularse en cada scroll del editor.

## Síntoma en el DOM (actual)

```html
<div style="position: relative;">
  <pre class="CodeMirror-line">:::slides</pre>
  <div class="CodeMirror-linewidget">…widget macho…</div>
</div>
<!-- Las imágenes y el cierre son HERMANAS, no hijas del contenedor -->
<pre class="CodeMirror-line">![img1](…)</pre>
<pre class="CodeMirror-line">![img2](…)</pre>
<pre class="CodeMirror-line">:::</pre>
```

## Causa raíz

CodeMirror administra su propio árbol DOM. No se pueden mover los `<pre class="CodeMirror-line">` dentro de un contenedor personalizado porque CodeMirror reconstruye su DOM internamente y revierte cualquier re-parenting.

## Solución actual parcial (sin wrapper DOM)

1. Flag `insideBlock` en `refreshImageWidgets()`:
   - Detecta `:::slides` / `:::popup:gallery` y activa el flag.
   - Mientras `insideBlock` esté activo, salta la creación de widgets individuales por imagen/video/YouTube.
   - Al encontrar `:::` desactiva el flag.
2. Solo se crea el widget del bloque (macho) en la línea de apertura.
3. Fuera del bloque, todo funciona exactamente igual que antes.

## DOM deseado (no implementable por limitación de CodeMirror)

```html
<div class="widget-container">
  <pre class="CodeMirror-line">:::slides</pre>
  <div class="CodeMirror-linewidget">…widget macho…</div>
  <pre class="CodeMirror-line">![img1](…)</pre>
  <pre class="CodeMirror-line">![img2](…)</pre>
  <pre class="CodeMirror-line">:::</pre>
</div>
```

## Limitación técnica

CodeMirror controla el árbol de líneas. Cualquier manipulación externa con `appendChild` / `insertBefore` sobre los elementos `<pre>` es revertida en el próximo tick. Por tanto, el DOM **no puede** agrupar todas las líneas del bloque como hijas de un mismo contenedor.

## Selector `.widget-container` disponible

Se agrega la clase `widget-container` al `<span>` del widget macho del slide y al `editorWrapper` durante el arrastre. Esto permite apuntar con CSS/JS a cualquier widget sin depender de clases específicas.

```html
<span class="img-line-widget mtp-branded slideblock-widget-mtp widget-container" ...>
```

## Garantía: no regresión para imágenes/video sueltos

Cuando `insideBlock` es `null` (fuera de cualquier bloque `:::slides`/`:::popup:gallery`), `refreshImageWidgets()` sigue asignando widgets individuales a:
- Imágenes markdown `![alt](url)`.
- Videos locales `<video src="...">`.
- Referencias YouTube `[youtube:ID]`.

Las funciones que crean esos widgets (`createImageWidget`, `createLocalVideoWidget`, `createYouTubeWidget`) no se modifican, por lo que el comportamiento existente se mantiene intacto.

## Archivos modificados

- `backend/blog/static/blog/js/blog_editor/index.js` → `refreshImageWidgets()` (flag `insideBlock` + skip de líneas dentro del bloque).
- `backend/blog/static/blog/js/blog_editor/index.js` → `createSlideBlockWidget()` (clase `widget-container` en el widget macho).
- `backend/blog/static/blog/js/blog_editor/index.js` → `startBlockDrag()` (clase `widget-container` en `editorWrapper`).

## Hallazgo crítico y solución aplicada

### Problema detectado

- En **`index.js`**, `createSlideBlockWidget()` aplicaba **estilos inline** (`widget.style.display = 'inline-block'`, `widget.style.position = 'relative'`) en las líneas 1435-1436.
- La **clase CSS `.widget-container` NO existía** en `blog_editor.css`, lo que rompía la separación de responsabilidades (estilos en CSS, no inline).
- Sin la clase CSS, el overlay `.slideblock-overlay` no tenía ancestro posicionado correctamente y quedaba mal ubicado.

### Solución aplicada

1. **Se eliminaron los estilos inline** de `createSlideBlockWidget()` (líneas 1435-1436).
2. **Se agregó la clase CSS faltante** en `blog_editor.css`:
   ```css
   .slideblock-widget-mtp.widget-container {
       display: inline-block;
       position: relative;
   }
   ```
3. Ahora la clase `.widget-container` es la **fuente de verdad** para el posicionamiento del overlay.

---

## Estado actual (2026-06-26)

### ✅ Implementado en CÓDIGO (pendiente validación visual)

1. **Flag `insideBlock`** — Funciona correctamente
   - Detecta apertura de `:::slides` / `:::popup:gallery` (línea 1588-1596)
   - Activa/desactiva el flag y salta líneas internas (línea 1654-1657)
   - Fuera del bloque, todo funciona igual que antes

2. **Widget macho con posición** — Implementado
   - Clase `widget-container` agregada (línea 1430)
   - `display: inline-block` + `position: relative` aplicados (líneas 1435-1436)
   - Esto permite que el overlay absoluto se posicione correctamente

3. **Overlay inyectado** — Implementado
   - En `refreshImageWidgets()` se crea `div.slideblock-overlay` (líneas 1754-1772)
   - Se calcula `top` y `height` una vez usando `cm.charCoords()`
   - El overlay existe como hijo del widget macho

4. **Recálculo en scroll** — Implementado
   - Listener `cm.on('scroll')` con debounce 16ms (líneas 1778-1784)
   - Llama a `updateBlockOverlays()` que recalcula posiciones (líneas 1787-1808)
   - Usa `charCoords()` y `getScrollInfo()` para coordenadas actualizadas

5. **Arrastre de bloques** — Implementado previamente
   - `startBlockDrag()` arrastra bloque completo
   - Limpieza en `cleanupBlockDragState()`

### ❌ PENDIENTE: Validación visual en navegador

**Lo que falta probar:**
1. **CSS**: Verificar que `.slideblock-overlay` tenga los estilos correctos (borde azul, fondo semitransparente, `pointer-events: none`)
2. **Visual**: ¿El overlay cubre TODO el bloque (línea apertura + imágenes + cierre)?
3. **Scroll**: ¿El overlay se reposiciona al hacer scroll?
4. **Interacción**: ¿El overlay no interfiere con clicks (pointer-events: none)?
5. **Fuera del bloque**: ¿Las imágenes siguen mostrando widgets individuales?

### 🔍 Si algo no funciona, diagnosticar

1. Inspeccionar el widget macho: ¿tiene clases `slideblock-widget-mtp widget-container`?
2. Buscar `.slideblock-overlay` dentro del widget: ¿existe?
3. Verificar estilos CSS aplicados al overlay y al contenedor
4. Consola: ¿errores en `updateBlockOverlays()`?

### Nota técnica — Clase `.widget-container`

El `<span>` del widget tiene inline `style="display:inline-block; position:relative"` como fallback, pero la clase `.widget-container` en CSS es la fuente de verdad. Sin esta clase, el overlay no tiene ancestro con `position: relative` válido y queda mal posicionado.
