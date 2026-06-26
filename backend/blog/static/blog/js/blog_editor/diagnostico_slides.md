# DIAGNOSTICO: Slides — contenedor y widgets internos

## Problema actual

`refreshImageWidgets()` solo distingue la **línea de apertura** del bloque (`:::slides`), pero las **líneas internas** (imágenes markdown) entran en el branch de imágenes y reciben su propio widget. Resultado: además del widget del bloque, cada imagen tiene un widget individual fuera del contenedor `position: relative` del widget macho.

### Síntoma en el DOM

```html
<div style="position: relative;">
  <pre class="CodeMirror-line">:::slides</pre>
  <div class="CodeMirror-linewidget">…widget macho…</div>
</div>
<!-- Líneas siguientes quedan como hermanos, sin envolver -->
<pre class="CodeMirror-line">![img1](…)</pre>
<pre class="CodeMirror-line">![img2](…)</pre>
```

### Causa raíz

No existe estado/flag que permita a `refreshImageWidgets()` reconocer "estoy dentro de un bloque `slides`/`popup:gallery`" y saltar el procesamiento individual de esas líneas.

## Solución implementada

1. En `refreshImageWidgets()` se implementó un **flag `insideBlock`**:
   - Al encontrar la línea de apertura (`:::slides` o `:::popup:gallery`) se activa.
   - Mientras `insideBlock` esté activo, saltar la creación de widgets de imagen individuales.
   - Al encontrar la línea de cierre (`:::`) se desactiva.
2. Se asegura que solo se cree el **widget del bloque** (macho) y que las imágenes queden como contenido interno sin widget propio.
3. Se crea un **wrapper fluido** `.slideblock-wrapper` que envuelve la línea de apertura, las imágenes y la línea de cierre.
4. El widget macho se inserta dentro de ese wrapper mediante `addLineWidget`.

### Identificador de envoltorio

Todos los divs envoltorio de widgets ahora incluyen la clase `.widget-container`:

```html
<div class="slideblock-wrapper widget-container" style="position: relative;">
  <pre class="CodeMirror-line">:::slides</pre>
  <div class="CodeMirror-linewidget">…widget macho…</div>

  <pre class="CodeMirror-line">![img1](…)</pre>
  <pre class="CodeMirror-line">![img2](…)</pre>

  <pre class="CodeMirror-line">:::</pre>
</div>
```

Esto permite usar el selector `.widget-container` para apuntar a cualquier contenedor de widget (slides, gallery, o el wrapper del CodeMirror durante arrastres) sin depender de estilos inline como `position: relative`.

### Puntos de código modificados

- `backend/blog/static/blog/js/blog_editor/index.js` → `refreshImageWidgets()`.
- `backend/blog/static/blog/js/blog_editor/index.js` → `startBlockDrag()`.
- `backend/blog/static/blog/css/blog_editor.css` → regla `.slideblock-wrapper { position: relative; }`.

### Resultado esperado en el DOM

```html
<!-- Contenedor PADRE con position: relative y clase .widget-container que AGRUPA TODO el bloque -->
<div class="slideblock-wrapper widget-container" style="position: relative;">
  <pre class="CodeMirror-line">:::slides</pre>
  <div class="CodeMirror-linewidget">
    <span class="img-line-widget mtp-branded slideblock-widget-mtp" id="slideblock-widget-26" data-line="2" data-block-type="slides">
      <!-- grip, menú, ayuda, dropdown -->
    </span>
  </div>

  <!-- Imágenes como líneas internas del mismo contenedor -->
  <pre class="CodeMirror-line">![bbb|bbb](./captura_de_pantalla_2025-10-27_174411_a5637f58.png)</pre>
  <pre class="CodeMirror-line">![bbb|bbb bbb](./captura_de_pantalla_2025-11-06_154412_a8cd8338.png)</pre>
  <pre class="CodeMirror-line">![bbb|bbb bbb bbb](./img_20260501_181947_474178e1.jpg)</pre>

  <pre class="CodeMirror-line">:::</pre>
</div>
```

### Garantía: no regresión para imágenes/video sueltos

Cuando `insideBlock` es `null` (es decir, fuera de cualquier bloque `:::slides`/`:::popup:gallery`), `refreshImageWidgets()` sigue asignando widgets individuales a:
- Imágenes markdown `![alt](url)`.
- Videos locales `<video src="...">`.
- Referencias YouTube `[youtube:ID]`.

Este flujo **no cambia**; el salto solo aplica dentro del bloque. Las funciones que crean esos widgets (`createImageWidget`, `createLocalVideoWidget`, `createYouTubeWidget`) no se modifican, por lo que el comportamiento existente se mantiene intacto.

> Estado: implementado.