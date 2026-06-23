# HU-20-C-V1-ADD: Arrastrar imágenes insertadas en el editor

## 📋 Metadatos
- **ID:** HU-20-C-V1-ADD
- **Padre:** HU-20-C-V1 (Selector de imágenes existentes) — implementada
- **Dependencias:** HU-20-B (widgets flotantes) — implementada
- **Estado:** Pendiente (solo definición)
- **Prioridad:** Media
- **Tiempo estimado:** 3-4 fases de ~15 min cada una

## 🎯 Objetivo
Extender la funcionalidad de **HU-20-C-V1** para que, una vez que una imagen ha sido insertada en el editor de código (vía el modal selector o la toolbar MTP), el usuario pueda **arrastrar toda la línea de la imagen** a cualquier otra posición del editor, permitiendo reordenar el contenido sin tener que cortar y pegar manualmente. Esto aplica tanto a imágenes insertadas desde el selector modal como desde el botón `data-mtp="image"` de la toolbar.

## ✅ Criterios de aceptación

1. **Arrastrar desde el widget flotante**: El usuario puede hacer clic y mantener presionado sobre el icono ⋮ (tres puntos verticales) del widget flotante de imagen (HU-20-B) y arrastrar la línea completa de la imagen a otra posición del editor.
2. **Arrastrar desde la línea de markdown**: El usuario puede hacer clic y mantener presionado sobre cualquier parte de la línea de markdown de imagen (ej: `![alt](img.png)`) y arrastrarla a otra posición del editor.
3. **Visual feedback durante arrastre**: Mientras se arrastra, se muestra una línea guía o highlight visual que indica dónde se insertará la imagen al soltar.
4. **Posición de inserción inteligente**: Al soltar, la imagen se inserta en la línea más cercana al punto de drop, no en el medio de una línea existente (evita dividir párrafos a menos que sea la intención).
5. **Preserva formato markdown**: La línea completa de imagen (incluyendo formato `![Título|Descripción](filename)` en contexto slides/gallery) se mueve intacta, sin corromper el markdown.
6. **Mantiene el widget flotante**: Después de soltar la imagen en su nueva posición, el widget flotante (⋮) debe reaparecer automáticamente asociado a la nueva línea.
7. **No interfiere con selección de texto**: El arrastre solo se activa cuando el usuario hace clic específicamente en el widget ⋮ o en la línea de imagen con la tecla Shift presionada (evita conflicto con selección normal de texto).
8. **Indicador visual de "arrastrable"**: Las líneas de imagen insertadas deben mostrar un sutil indicador visual (ej: icono de agarre o cursor `grab`) al pasar el cursor sobre ellas, para sugerir que son arrastrables.
9. **Compatibilidad retroactiva**: Las imágenes insertadas antes de implementar esta HU (sin la funcionalidad de arrastre) también deberían ser arrastrables una vez que se recargue el widget (vía `refreshImageWidgets()`).
10. **Operación cancelable**: Si durante el arrastre el usuario presiona `Escape`, la operación se cancela y la imagen vuelve a su posición original sin cambios.

## 🔍 Análisis de reusabilidad

### Componentes que SE REUTILIZAN:

| Componente              | Archivo                         | Por qué se reutiliza                                                                                              |
| ----------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `imageWidgets[]`        | `blog_editor.js` línea ~800     | Ya mapea líneas de imagen a widgets de CodeMirror. Se puede extender para includes metadata de "draggable".       |
| `refreshImageWidgets()` | `blog_editor.js` línea ~1047    | Refresca todos los widgets. Después de arrastrar, se llama para re-posicionar el widget ⋮ en la nueva línea.      |
| `easyMDE.codemirror`    | Varias                          | Instancia de CodeMirror. Se usa `getLine()`, `getCursor()`, `replaceRange()` para detectar y mover líneas.        |
| Widget HTML (⋮)         | `blog_editor.js` línea ~650-780 | Ya genera el DOM del widget con el botón de menú. Se puede añadir el evento de `mousedown` para iniciar arrastre. |
| `MTP_TEMPLATES`         | No aplica                       | No se modifica. Solo se mueve texto existente.                                                                    |

### Componentes que NO se tocan:
- HTML base del template `blog_editor.html` — solo se añaden clases/atributos via JS.
- CSS existente — solo se añaden reglas nuevas con prefijo `.img-drag-`.
- Lógica de inserción de imágenes (HU-20-C-V1) — no se modifica.
- Lógica de eliminación/bloqueo/portada (HU-20-B) — no se modifica.
- FilePond — no interacción directa.

## 🧩 Diagnóstico técnico

### Problema actual
Una vez insertada una imagen en el editor, ubicarla en otro lugar del artículo requiere:
1. Seleccionar manualmente la línea de markdown.
2. Cortar (`Ctrl+X`).
3. Mover el cursor al destino.
4. Pegar (`Ctrl+V`).
Esto es tedioso, especialmente en artículos largos con múltiples imágenes.

### Solución propuesta
Implementar un sistema de **drag & drop nativo** sobre las líneas de imagen en CodeMirror, que:

1. **Detecta líneas de imagen**: Escanea el contenido del editor con regex `/^!\[[^\]]*\]\([^)]+\)\s*$/` para identificar todas las líneas que contienen imágenes insertadas.
2. **Marca las líneas como arrastrables**: Añade clase CSS `.img-line-draggable` a los widgets de CodeMirror asociados a líneas de imagen.
3. **Inicia arrastre desde widget ⋮**: Al hacer `mousedown` en el botón ⋮ del widget, inicia secuencia de arrastre.
4. **Alternativa: Shift+Click en línea**: Si el usuario hace clic en una línea de imagen con `Shift` presionado, también inicia arrastre (para usuarios que prefieren no usar el widget).
5. **Feedback visual durante arrastre**:
   - La línea original se marca con clase `.img-line-dragging` (opacidad reducida).
   - Un "placeholder" o línea guía sigue el cursor verticalmente, indicando la posición de inserción.
6. **Al soltar (mouseup)**:
   - Obtiene la línea destino más cercana en CodeMirror.
   - Extrae el texto completo de la línea de imagen origen.
   - Elimina la línea original del buffer.
   - Inserta el texto en la nueva posición (línea destino o siguiente, según lógica de inserción).
   - Actualiza `imageWidgets[]` para reflejar la nueva línea (limpia widget viejo, llama `refreshImageWidgets()`).
7. **Cancelación con Escape**: Escucha `keydown` durante arrastre; si se presiona `Escape`, cancela operación y restaura estado.

### Diagrama de flujo

```
Usuario presiona mouse sobre widget ⋮ (botón⋮)
    │
    ▼
mousedown en .img-line-menu-btn
    │
    ▼
¿Shift presionado O botón ⋮ clickeado?
    │
    ├──► NO → comportamiento normal (abre dropdown)
    │
    └──► SÍ → iniciar arrastre
            │
            ▼
        Marcar línea origen: .img-line-dragging
        Mostrar placeholder/guía que sigue al cursor
        │
        ▼
        Usuario mueve cursor → placeholder se reposiciona
        │
        ▼
        Usuario suelta mouse (mouseup)
        │
        ▼
        Calcular línea destino más cercana
        │
        ▼
        Extraer texto de línea origen
        Eliminar línea origen
        Insertar texto en línea destino
        │
        ▼
        refreshImageWidgets() → widget ⋮ reaparece en nueva línea
        │
        ▼
        Limpiar clases/estados de arrastre
```

## 📝 Plan de implementación (fases granulares)

### Fase 1: Utilerías de detección de líneas de imagen
**Archivo:** `backend/blog/static/blog/js/blog_editor.js`
- [ ] Añadir función `getImageLines()`:
  - Recorre todo el documento de CodeMirror.
  - Usa regex `/^!\[[^\]]*\]\([^)]+\)\s*$/` para detectar líneas de imagen.
  - Retorna array de `{ lineNumber, text }` para cada línea coincidente.
  - Posición sugerida: después de `detectImageContext()` (si se implementó en HU-20-C-V1) o al final de funciones helper.
- [ ] Añadir función `isImageLine(lineNumber)` que retorna `true` si la línea en ese número es una línea de imagen.
- [ ] Tests: Llamar a `getImageLines()` en consola tras cargar el editor y verificar que detecta correctamente las imágenes insertadas.

### Fase 2: Estilos CSS para indicadores de arrastre
**Archivo:** `backend/blog/static/blog/css/blog_editor.css`
- [ ] Añadir regla `.img-line-draggable`:
  - `cursor: grab;` para indicar que la línea es arrastrable.
  - Pequeño icono de agarre (⋮⋮ o `grip-vertical` de Font Awesome) en el lado izquierdo del widget o como `::before` pseudo-elemento de la línea.
- [ ] Añadir regla `.img-line-dragging`:
  - `opacity: 0.4;` o `background: rgba(13, 110, 253, 0.1);` para indicar que la línea está siendo arrastrada.
- [ ] Añadir regla para placeholder/guía:
  - Línea horizontal azul punteada (`border-top: 2px dashed #0d6efd`) que indica punto de inserción.
  - Clase: `.img-drop-guide`.
- [ ] Asegurar que estos estilos no afecten a otros elementos (usar prefijo `.img-line-`).

### Fase 3: Marcar líneas de imagen como arrastrables al cargar/refrescar widgets
**Archivo:** `backend/blog/static/blog/js/blog_editor.js`
- [ ] Modificar `refreshImageWidgets()` (o crear wrapper `refreshImageWidgetsWithDrag()`):
  - Después de crear/posicionar el widget ⋮ en una línea de imagen, añadir clase `.img-line-draggable` al widget del CodeMirror (accesible via `widget.lineWidget()` o almacenando la referencia).
  - Adjuntar evento `mousedown` al botón ⋮ del widget para iniciar arrastre.
- [ ] Función `markImageLineAsDraggable(lineWidget, lineNumber)`:
  - Añade clase CSS al widget.
  - Almacena `lineNumber` en dataset del widget: `widget.el.dataset.imageLine = lineNumber`.
  - Adjunta `mousedown` listener al botón ⋮.
- [ ] Asegurar que se llame tras cada inserción de imagen (desde HU-20-C-V1).

### Fase 4: Lógica de arrastre (drag & drop)
**Archivo:** `backend/blog/static/blog/js/blog_editor.js`
- [ ] Variables globales de estado de arrastre:
  - `window.imageDragActive = false`
  - `window.imageDragOriginLine = null`
  - `window.imageDragText = ''`
  - `window.imageDragGuideEl = null`
- [ ] Función `startImageDrag(lineNumber, widgetButton)`:
  - Verifica que la línea sea realmente una línea de imagen (`isImageLine(lineNumber)`).
  - Obtiene el texto completo de la línea: `const text = cm.getLine(lineNumber)`.
  - Marca la línea con `.img-line-dragging`.
  - Crea elemento guía (`.img-drop-guide`) y lo posiciona en la línea origen.
  - Añade event listeners全局es: `document.mousemove` (mover guía) y `document.mouseup` (soltar).
  - Añade listener `document.keydown` para Escape (cancelar).
- [ ] Función `moveImageDragGuide(event)`:
  - Calcula la línea más cercana al `event.clientY` usando `cm.coordsChar({ left: 0, top: event.clientY })`.
  - Reposiciona el placeholder guía en esa línea.
  - Si la línea destino es la misma que el origen, ocultar guía o moverla a línea siguiente.
- [ ] Función `endImageDrag(event)`:
  - Obtiene línea destino desde la posición actual de la guía.
  - Si destino != origen:
    - Extrae texto de línea origen.
    - Elimina línea origen: `cm.replaceRange('', { line: originLine, ch: 0 }, { line: originLine + 1, ch: 0 })`.
    - Inserta texto en destino: `cm.replaceRange(text + '\n', { line: destLine, ch: 0 })`.
    - Actualiza `imageWidgets` (limpia widget viejo, llama `refreshImageWidgets()`).
  - Limpia: remueve listeners, elimina guía, remueve clase `.img-line-dragging`, resetea variables globales.
- [ ] Función `cancelImageDrag()`:
  - Restaura estado original: remueve clase `.img-line-dragging`, elimina guía, limpia variables globales.
  - No mueve nada.
- [ ] Integración con Shift+Click:
  - En `setupImageWidget()` o similar, detectar `event.shiftKey` al hacer clic en el área del widget (no en el botón ⋮).
  - Si `Shift` está presionado, prevenir comportamiento default y llamar `startImageDrag()`.

### Fase 5: Integración y limpieza de estados
**Archivo:** `backend/blog/static/blog/js/blog_editor.js`
- [ ] Modificar evento ` Change ` o `update` de CodeMirror (opcional):
  - Si el usuario edita manualmente y modifica una línea de imagen, asegurar que `imageWidgets` se mantenga sincronizado.
  - Si la línea de imagen deja de ser imagen (regex no coincide), limpiar widget.
  - **Opcional**: Si la línea vuelve a ser imagen (ej: recupera formato), re-crear widget.
- [ ] Asegurar que `blurImageWidget()` y `cleanupImageWidget()` limpien también la clase `.img-line-draggable` y remuevan eventos de arrastre.
- [ ] Probar ciclo completo: Insertar imagen → ver widget ⋮ → arrastrar a nueva posición → widget aparece en nueva línea → imagen se mueve en markdown.
- [ ] Verificar que Escape cancela correctamente.
- [ ] Verificar que no se interfiere con:
  - Clic normal en widget ⋮ (abre dropdown).
  - Selección de texto en el editor (solo arrastra con Shift+click o botón ⋮).

## 🧪 Casos de prueba

- [ ] **Caso 1:** Insertar imagen en posición A. Hacer clic en ⋮ y arrastrar a posición B. Verificar que la imagen aparece en B y el widget ⋮ se repositiona.
- [ ] **Caso 2:** Imagen en contexto slides (`![Título|Descripción](img.png)`). Arrastrar a otra posición → se mueve la línea completa con formato intacto.
- [ ] **Caso 3:** Arrastrar imagen al medio de un párrafo → se inserta en línea propia, no rompe el párrafo.
- [ ] **Caso 4:** Arrastre cancelado con Escape → imagen permanece en posición original.
- [ ] **Caso 5:** Shift+Click sobre línea de imagen (sin tocar widget ⋮) → inicia arrastre.
- [ ] **Caso 6:** Clic normal (sin Shift) sobre widget ⋮ → abre dropdown (no arrastra).
- [ ] **Caso 7:** Múltiples imágenes: arrastrar la segunda imagen sobre la primera → se inserta correctamente antes/después sin perder la otra.
- [ ] **Caso 8:** Después de arrastrar, guardar artículo → persistencia correcta en BD.
- [ ] **Caso 9:** Arrastrar imagen fuera de la zona visible del editor (scroll horizontal/vertical) → placeholder se reposiciona correctamente.
- [ ] **Caso 10:** Imagen insertada desde HU-20-C-V1 (modo slides) es arrastrada a modo normal → se mantiene el formato original (no se convierte a formato simple).

## 🔒 Reglas a respetar

1. **No modificar** lógica de inserción de imágenes (HU-20-C-V1) — solo añadir capacidad de mover post-inserción.
2. **No introducir dependencias nuevas** — solo JS nativo + API de CodeMirror ya disponible.
3. **No modificar CSS existente** — solo añadir reglas con prefijo `.img-line-draggable`, `.img-line-dragging`, `.img-drop-guide`.
4. **Usar API pública de CodeMirror**: `getLine()`, `replaceRange()`, `coordsChar()` — no acceder a propiedades internas.
5. **Arrastre opcional por contexto**: En modo `slides` o `gallery`, el arrastre debe permitirse pero preservando el formato `Título|Descripción`.
6. **No interferir con scroll del editor**: Durante arrastre, el scroll puede seguir funcionando si el usuario llega al borde del viewport (comportamiento nativo de CodeMirror).
7. **Cleanup garantizado**: Si se recarga la página o se cierra el editor, no deben quedar event listeners huérfanos.
8. **Mobile no es objetivo primario**: El arrastre se implementa para desktop (mouse). Touch events pueden quedar como `no-op` o con soporte básico futuro.

## 🎨 Consideraciones de UX

- **Icono de agarre**: Añadir un pequeño icono `fa-grip-vertical` a la izquierda del widget ⋮ en líneas de imagen, para sugerir que se puede agarrar.
- **Cursor**: Cambiar a `grab` al pasar sobre el widget ⋮ o la línea de imagen con Shift.
- **Animación**: Transición suave de 150ms en los estilos de `.img-line-dragging` para feedback visual agradable.
- **Tooltip**: Al pasar por el icono de agarre, mostrar tooltip "Arrastrar para mover imagen".

## 📦 Entregables

1. **Funciones JS** (`blog_editor.js`):
   - `getImageLines()`
   - `isImageLine(lineNumber)`
   - `startImageDrag(lineNumber, triggerElement)`
   - `moveImageDragGuide(event)`
   - `endImageDrag(event)`
   - `cancelImageDrag()`
   - Modificación de `refreshImageWidgets()` / `setupImageWidget()` para marcar arrastrables.

2. **Estilos CSS** (`blog_editor.css`):
   - `.img-line-draggable`
   - `.img-line-dragging`
   - `.img-drop-guide`
   - Ajustes de cursor en `.img-line-widget`.

3. **Eventos HTML**:
   - `mousedown` en botón ⋮ → inicia arrastre.
   - `keydown` global → Escape cancela.
   - `mousemove` global → mueve guía.
   - `mouseup` global → finaliza arrastre.

---

> **Nota:** Esta HU es una **extensión** de HU-20-C-V1. No modifica comportamiento de inserción, solo agrega capacidad de reordenamiento post-inserción. Implementación fase por fase según `.clinerules`.