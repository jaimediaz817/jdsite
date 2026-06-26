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

No existe estado/flag que permita a `refreshImageWidgets()` reconocer “estoy dentro de un bloque `slides`/`popup:gallery`” y saltar el procesamiento individual de esas líneas.

## Solución propuesta

1. En `refreshImageWidgets()` implementar un **flag `insideBlock`**:
   - Al encontrar la línea de apertura (`:::slides` o `:::popup:gallery`) se activa.
   - Mientras `insideBlock` esté activo, saltar la creación de widgets de imagen individuales.
   - Al encontrar la línea de cierre (`:::`) se desactiva.
2. Asegurar que solo se cree el **widget del bloque** (macho) y que las imágenes queden como contenido interno sin widget propio.
3. Confirmar que videos usa wrapper MTP (ya está resuelto en `video-widget.js`).

### Puntos de código a tocar

- `backend/blog/static/blog/js/blog_editor/index.js` → `refreshImageWidgets()`.
- No requiere cambios de CSS adicionales; el selector `:has()` ya marca el contenedor padre del widget macho.

### Ejemplo de implementación (pseudocódigo)

```js
function refreshImageWidgets() {
    // ...
    var insideBlock = null;

    for (var i = 0; i < totalLines; i++) {
        var trimmed = doc.getLine(i).trim();

        // 1) Abrir bloque
        var isSlideBlock = /^:::\s*slides\s*$/.test(trimmed);
        var isGalleryBlock = /^:::\s*popup:gallery\s*$/.test(trimmed);
        if (isSlideBlock || isGalleryBlock) {
            insideBlock = isSlideBlock ? 'slides' : 'popup:gallery';
            // crear solo el widget del bloque (macho) para la línea i
            createBlockWidget(i, insideBlock);
            continue;
        }

        // 2) Cerrar bloque
        if (/^:::\s*$/.test(trimmed) && insideBlock) {
            insideBlock = null;
            continue;
        }

        // 3) Dentro del bloque → saltar imágenes/video/YouTube
        if (insideBlock) {
            continue;
        }

        // 4) Fuera de bloque → comportamiento actual (widgets individuales)
        if (esImagen(trimmed) || esVideo(trimmed) || esYouTube(trimmed)) {
            crearWidgetIndividual(i, ...);
        }
    }
}
```

### Resultado esperado en el DOM (después del fix)

El objetivo es que el `position: relative` del widget macho envuelva también las líneas de las imágenes; por ejemplo:

```html
<!-- Contenedor PADRE con position: relative que AGRUPA TODO el bloque -->
<div style="position: relative;">
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

**Cambio clave**: para conseguir eso, no basta con saltar la creación de widgets de imagen (`insideBlock`); además hay que **reestructurar el wrapper del bloque** para que las líneas de imágenes se rendericen dentro del mismo contenedor `position: relative` del widget macho. Eso implica modificar la forma en que se crea/posiciona el widget del bloque en `refreshImageWidgets()` (o en `createSlideBlockWidget`).

- Con solo el flag `insideBlock`, las imágenes quedarían como `<pre>` sueltos (sin `CodeMirror-linewidget`), pero **no automáticamente dentro** del `<div style="position: relative;">` del widget macho.
- Por tanto, el fix completo requiere: (1) flag `insideBlock` para no duplicar widgets, y (2) un wrapper de bloque que agrupe visualmente todas las líneas del bloque.

#### Diagnóstico avanzado: ¿por qué NO se puede lograr solo con `insideBlock`?

En CodeMirror, cada línea se renderiza en su propio contenedor `<div>` dentro de `.CodeMirror-code`. Un `CodeMirror-linewidget` está ligado a una línea concreta (vía `addLineWidget`). CodeMirror no soporta nativamente que un solo widget cubra un rango de líneas ni que un contenedor con `position: relative` se “expanda” para agrupar líneas siguientes de forma automática.

Por tanto, las opciones reales son:

1) **Wrapper manual del bloque**: interceptar la inserción del bloque y envolver todas las líneas en un `<div style="position: relative;">` propio. El widget macho se insertaría dentro de ese wrapper. El problema: CodeMirror no está diseñado para que el autor modifique el DOM de líneas de esa forma sin romper el render.

2) **Superposición absoluta**: posicionar el widget macho con `position: absolute` relativo al editor (no a la línea). Mide la altura de las líneas del bloque y redimensiona el widget. Es frágil ante scroll/resize.

3) **CSS con estado compartido**: conservar el widget en la línea de apertura, pero mediante CSS hacer que su contenedor herede/transmita el `position: relative` a un conjunto de líneas consecutivas (ejemplo: marcar la línea de apertura con una clase y usar combinadores para afectar las líneas siguientes hasta el cierre). Sigue necesitando un mecanismo de marcado/rango en el DOM.

Conclusión incluida en el diagnóstico: solo con `insideBlock` no alcanza; el problema de agrupación física de las etiquetas `<pre>` requiere un cambio estructural en el render de CodeMirror o una aproximación por superposición/manipulación del DOM.

### Implicación real del fix

No es suficiente con el flag `insideBlock`; para lograr el HTML anterior, el mecanismo que genera el `position: relative` debe aplicarse sobre **todo el rango de líneas del bloque**, no solo la primera. Eso puede requerir:

- Un wrapper/div adicional que envuelva todas las líneas del bloque, o
- Ajustar la lógica de inserción del widget para que el contenedor con `position: relative` se asocie al bloque completo y no solo a la línea de apertura.

Lo anterior **no altera** el comportamiento de imágenes/video sueltos, porque el flag `insideBlock` solo se activa dentro de bloques `:::slides` / `:::popup:gallery`.

### Garantía: no regresión para imágenes/video sueltos

Cuando `insideBlock` es `null` (es decir, fuera de cualquier bloque `:::slides`/`:::popup:gallery`), `refreshImageWidgets()` sigue asignando widgets individuales a:
- Imágenes markdown `![alt](url)`.
- Videos locales `<video src="...">`.
- Referencias YouTube `[youtube:ID]`.

Este flujo **no cambia**; el salto solo aplica dentro del bloque. Las funciones que crean esos widgets (`createImageWidget`, `createLocalVideoWidget`, `createYouTubeWidget`) no se modifican, por lo que el comportamiento existente se mantiene intacto.

> Estado: problema identificado, fix pendiente de implementar.
