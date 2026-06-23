# HU-20-C-V1: Selector de imágenes existentes al insertar desde tools flotante

## 📋 Metadatos
- **ID:** HU-20-C-V1
- **Dependencias:** HU-20-A (sistema no-import) — implementada, HU-20-B (widgets flotantes) — implementada
- **Estado:** Pendiente (solo definición)
- **Prioridad:** Media-Alta
- **Tiempo estimado:** 3 fases de ~15 min cada una

## 🎯 Objetivo
Modificar el comportamiento del botón `data-mtp="image"` de la barra de herramientas flotante MTP para que, en lugar de insertar un template base estático (`![Texto alternativo](ruta-de-la-imagen.png)`), abra un **popup/modal simple** que permita:
1. **Detectar el contexto del cursor**: Si está dentro de `:::slides` o `:::popup:gallery`, informar al usuario y habilitar campos extra de título y descripción.
2. **Seleccionar una imagen existente** del artículo (del array `uploadedFiles` que ya existe en memoria).
3. **Cargar una imagen nueva** desde el PC (reutilizando el flujo completo de FilePond).
4. Una vez seleccionada o cargada, **insertar la imagen en el editor** con su línea markdown correspondiente (simple o con formato `![Título|Descripción](filename)` según el contexto) **y** mostrar el widget flotante (el dropdown de opciones de HU-20-B) asociado a esa línea.
5. **Marcar visualmente el botón como migrado**: Añadir la etiqueta "MTP" (10px, color azul) en la esquina superior izquierda del botón para indicar que ha sido acogido bajo el sistema Mark to Post.
6. **Bloquear visualmente los botones no migrados**: Todos los botones de la barra `#mtpToolbar` que todavia no han sido migrados bajo el sistema MTP deben aparecer visualmente bloqueados (opacidad reducida, cursor `not-allowed`, filtro gris) para evitar que se usen en producción hasta que se implementen sus respectivas HUs.

## ✅ Criterios de aceptación

1. Al hacer clic en el botón `data-mtp="image"` de la barra MTP, **NO** se inserta el template base estático.
2. En su lugar, se abre un **modal Bootstrap 4** con:
   - **Badge superior** que indica el contexto detectado: "📝 Artículo normal", "📊 Dentro de :::slides" o "🖼️ Dentro de :::popup:gallery".
   - Grid/lista de **imágenes existentes** (`uploadedFiles`) para seleccionar.
   - Botón **"Cargar nueva imagen"** que activa el input FilePond existente.
   - Cuando el contexto es `slides` o `popup:gallery`, se muestran **input de título** y **textarea de descripción** con el formato `Título|Descripción` listo para usarse.
3. Al **seleccionar una imagen existente** en contexto normal: se inserta `![filename](./filename)\n`.
4. Al **seleccionar una imagen existente** dentro de slides/gallery: se inserta `![Título|Descripción](filename)\n` usando los valores de los campos título/descripción.
5. Al **cargar una imagen nueva**, pasa por el flujo completo de upload a `/blog/api/upload-file/` y se inserta igual que en los criterios 3 o 4 según contexto.
6. Después de insertar la imagen (sea seleccionada o nueva), el sistema **refresca los widgets de imagen** (`refreshImageWidgets()`) para que aparezca el icono ⋮ con su dropdown en la línea recién insertada.
7. El modal es **simple y limpio**: sin dependencias nuevas, reutiliza el CSS de modales existentes del proyecto (patrón de `imagePreviewModal` y `deleteFileModal`).
8. La UX contempla el caso donde **no hay imágenes existentes**: el modal sigue ofreciendo la opción de cargar desde PC.
9. Los campos de título y descripción solo se muestran y habilitan cuando el cursor está dentro de un bloque `:::slides` o `:::popup:gallery`.
10. **No se interfiere con FilePond normal**: el drag&drop, pegar con Ctrl+V y el botón de "Cargar" del modal comparten el mismo input FilePond, pero cuando el modal selector está abierto, FilePond **no** inserta automáticamente la imagen en el editor (delega esa acción al selector). Al cerrar el modal, FilePond recupera su comportamiento normal.
11. **La posición del cursor se preserva**: al abrir el modal se guarda la posición actual del cursor en CodeMirror. Al insertar la imagen, se restaura esa posición antes de escribir.
12. **Marca visual MTP**: El botón `data-mtp="image"` debe mostrar una etiqueta "MTP" (10px, color azul primario #0d6efd) en la esquina superior izquierda del icono, superpuesta sin romper el diseño del botón. Esta etiqueta indica que el botón ha sido migrado/acogido bajo el sistema Mark to Post.
13. **Botones no migrados bloqueados visualmente**: Los botones de `#mtpToolbar` que **no** son `data-mtp="image"` deben estar visualmente deshabilitados/bloqueados en producción (ej. `opacity: 0.35`, `cursor: not-allowed`, `filter: grayscale(35%)`) hasta que cada uno sea liberado por su respectiva HU. Solo el botón `image` queda interactivo; los demás no responden a clics.

## 🔍 Análisis de reusabilidad (sin modificar código existente)

### Componentes que SE REUTILIZAN tal cual:

| Componente                     | Archivo                           | Por qué se reutiliza                                                                                                                                                                                                    |
| ------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uploadedFiles` (array global) | `blog_editor.js` línea 14         | Ya contiene todas las imágenes subidos en la sesión. Al cargar artículo, se pobla con `existing_files` del backend (líneas 1696-1716).                                                                                  |
| `renderUploadedFile(file)`     | `blog_editor.js` línea 158        | Función auxiliar que renderiza una vista previa de archivo. Se puede invocar desde el modal si se necesita mostrar thumbnails.                                                                                          |
| `refreshImageWidgets()`        | `blog_editor.js` línea 1047       | Refresca los widgets flotantes de HU-20-B. **Se llama DESPUÉS de insertar la imagen** para que aparezca el dropdown.                                                                                                    |
| `getCookie('csrftoken')`       | `blog_editor.js` línea 1569       | Para headers CSRF en upload.                                                                                                                                                                                            |
| `easyMDE` + `cm` (CodeMirror)  | `blog_editor.js` líneas 623, 643  | Instancia del editor. Se usa `easyMDE.value()`, `cm.getCursor()`, `cm.getDoc()` para detectar contexto e insertar texto.                                                                                                |
| FilePond config                | `blog_editor.js` líneas 1216-1252 | Ya configurado para subir a `/blog/api/upload-file/`. El modal puede **activar el input FilePond existente** (`#filepond`) en lugar de crear uno nuevo. **Pero debe coordinar el estado para no duplicar inserciones.** |
| Modales Bootstrap 4 existentes | `blog_editor.html` líneas 187-278 | Patrón de modal ya establecido (`.modal.fade`, `.modal-dialog`, `.modal-content`) con clases `.close` (NO `btn-close`, Bootstrap 4).                                                                                    |
| `insertMtpTemplate(action)`    | `blog_editor.js` línea 1802       | Función dispatch actual del toolbar. Habrá que **interceptar** el action `'image'` antes de llegar a `MTP_TEMPLATES['image']`.                                                                                          |
| `MTP_TEMPLATES['image']`       | `blog_editor.js` línea 1744       | Template base actual: `'![Texto alternativo](ruta-de-la-imagen.png)\n'`. **No se modifica**, se deja como fallback, pero la rama `'image'` en `insertMtpTemplate` se desvía al modal.                                   |

### Componentes que NO se tocan:
- HTML del template `blog_editor.html` — solo se **añade** un nuevo modal, no se modifica estructura existente.
- CSS existente — se puede añadir estilos mínimos para el modal selector en `blog_editor.css`, además de la clase para bloqueo visual de botones no migrados (nuevo selecto con prefijo `.mtp-`).
- `upload-file` endpoint backend — ya existe y funciona.
- `get-blog/<slug>/` endpoint — ya retorna `existing_files`.
- Sistema `:::no-import:::` — independiente, no afectado.
- Widgets HU-20-B — no se modifica su lógica, solo se invoca `refreshImageWidgets()` desde el nuevo flujo.
- FilePond drag&drop y pegar con Ctrl+V — **sigue funcionando igual**; solo se ajusta el comportamiento cuando el modal selector está abierto.

---

## 🧩 Diagnóstico técnico

### Problema actual
Al hacer clic en el botón de cámara (icono `fa-camera` en la barra flotante MTP), `insertMtpTemplate('image')` ejecuta la línea:
```javascript
const template = MTP_TEMPLATES[action];
doc.replaceRange(template, cursor);
```
Esto inserta `![Texto alternativo](ruta-de-la-imagen.png)\n` como texto estático, sin validación ni selección de archivos reales.

### Solución propuesta
Modificar la función `insertMtpTemplate()` para detectar cuando `action === 'image'` y, en lugar de buscar en `MTP_TEMPLATES`, ejecutar una **rama especial** que:

1. Marcar visualmente el botón como migrado: Añadir clase `mtp-migrated` al botón `[data-mtp="image"]` para aplicar estilos diferenciados (icono azul + etiqueta "MTP").
2. Bloquear los demás botones de la barra: Añadir clase `mtp-disabled` a todos los botones de `#mtpToolbar` excepto `[data-mtp="image"]`, para aplicar estilos de opacidad reducida, cursor `not-allowed` y filtro gris. Esta clase **no** se aplica en desarrollo/local a menos que se active explícitamente (ej. flag `MTP_PRODUCTION=true`).
3. Detecta el **contexto del cursor** en el editor:
   - Obtiene la línea actual y líneas anteriores en el buffer.
   - Busca hacia arriba si estamos dentro de un bloque `:::slides` o `:::popup:gallery`.
   - Extrae el modo: `'normal'`, `'slides'` o `'popup:gallery'`.
   - Si estamos en slides/gallery, extrae también si hay contenido de título/descripción existente en la línea actual (formato `![Título|Descripción](...)`).

4. Abre un modal HTML nuevo (`#imageSelectorModal`) con:
   - **Badge superior** con modo detectado: 📝 Normal | 📊 Slides | 🖼️ Galería popup.
   - Sección "Imágenes existentes": grid de thumbnails generados desde `uploadedFiles`.
   - Sección inputs título/descripción: **visibles y habilitadas solo si el modo es `slides` o `popup:gallery`**. Separador `|` visible entre ambos campos.
   - Botón "Cargar desde PC": activa `document.getElementById('filepond').click()`.

5. Al hacer clic en una imagen existente:
   - Cierra el modal.
   - Obtiene `filename` del elemento clickeado.
   - Si modo es slides/gallery, lee valores de título y descripción.
   - Llama a `insertImageInEditor(filename, title, description, mode)`.

6. Al completar upload de FilePond (`onload`):
   - Si el modal selector está abierto, capturar el `filename` del archivo recién subido.
   - Cerrar modal.
   - Llamar a `insertImageInEditor(filename, '', '', mode)` con el modo detectado al abrir el modal.

7. `insertImageInEditor(filename, title, description, mode)`:
   - Construye el texto a insertar:
     - `mode === 'normal'`: `![${filename}](./${filename})\n`
     - `mode === 'slides'` o `'popup:gallery'`: `![${title || 'Título'}|${description || 'Descripción'}](./${filename})\n`
   - Inserta en la posición del cursor de EasyMDE.
   - Llama `refreshImageWidgets()` tras 100ms para que HU-20-B pinte el icono ⋮.

8. Función auxiliar `detectImageContext()`:
   - Recorre líneas hacia arriba desde el cursor hasta encontrar `:::slides` o `:::popup:gallery`.
   - Retorna objeto `{ mode: 'normal'|'slides'|'popup:gallery', lineStart: number|null }`.

### Diagrama de flujo
```
Usuario hace clic en botón imagen (data-mtp="image")
    │
    ▼
insertMtpTemplate('image') detecta acción 'image'
    │
    ▼
detectImageContext() → modo detectado
    │
    ▼
Abre #imageSelectorModal con modo y badge superior
    │
    ├──► Campos título/descripción: visibles si modo = slides/gallery
    │
    ├──► Rama A: Seleccionar existente
    │       Usuario hace clic en thumbnail
    │       │
    │       ▼
    │   insertImageInEditor(filename, title, description, mode)
    │       │
    │       ▼
    │   refreshImageWidgets() → aparece ⋮ con dropdown
    │
    └──► Rama B: Cargar nueva
            Usuario hace clic en "Cargar desde PC"
            │
            ▼
        FilePond process (POST /blog/api/upload-file/)
            │
            ▼
        onload → filename disponible, cerrar modal
            │
            ▼
        insertImageInEditor(filename, '', '', modo_guardado)
            │
            ▼
        refreshImageWidgets() → aparece ⋮ con dropdown
```

---

## 📝 Plan de implementación (fases granulares)

### Fase 1: HTML del modal selector + marca visual MTP en botón
**Archivo:** `backend/blog/templates/blog/blog_editor.html`
- [ ] Añadir nuevo modal `#imageSelectorModal` después del modal de vista previa de imagen.
- [ ] Añadir etiqueta visual "MTP" al botón de imagen existente:
  - Envolver el icono `<i class="fas fa-camera"></i>` en un `<span class="mtp-badge">MTP</span>` (solo para `data-mtp="image"`).
  - La etiqueta se posiciona en la esquina superior izquierda del botón, con `position: absolute` y `font-size: 10px`.
- [ ] Estructura del modal:
  - Header con título y badge de contexto (`#selector-mode-badge`).
  - Cuerpo con:
    - Input título (`#selector-title`) — oculto por defecto.
    - Textarea descripción (`#selector-description`) — oculto por defecto.
    - Grid de thumbnails (`#selector-existing-images`) para imágenes existentes.
    - Botón "Cargar desde PC" (`#selector-upload-btn`).
  - Footer con botones Cancelar y Seleccionar (este último se activa al hacer clic en una imagen existente).
- [ ] Usar clases Bootstrap 4 (`.close`, `&times;`) — respetando reglas del `.clinerules`.

### Fase 2: Estilos mínimos del modal + marca visual MTP + bloqueo de botones no migrados
**Archivo:** `backend/blog/static/blog/css/blog_editor.css`
- [ ] Estilos para grid de thumbnails (`.selector-thumb-grid`, `.selector-thumb-item`, `.selector-thumb`).
- [ ] Estilos para badge de contexto (`.selector-mode-badge`).
- [ ] **Estilos para la marca MTP en botones migrados**:
  - Clase `.mtp-btn.mtp-migrated`: posición `relative` para contener la etiqueta.
  - Clase `.mtp-badge`: `position: absolute; top: 2px; left: 4px; font-size: 10px; color: #0d6efd; font-weight: bold; pointer-events: none; z-index: 10;`.
  - Asegurar que el icono Font Awesome del botón tenga `color: #0d6efd` cuando el botón tenga clase `mtp-migrated`.
  - La etiqueta no debe romper el layout del botón ni causar desbordamiento.
- [ ] **Estilos para bloqueo de botones no migrados**:
  - Clase `.mtp-btn.mtp-disabled`: `opacity: 0.35; cursor: not-allowed; filter: grayscale(35%); pointer-events: none;`.
  - Esta clase se asigna a todos los botones de `#mtpToolbar` excepto `[data-mtp="image"]`.
  - En desarrollo (sin flag) se puede omitir, pero en producción (`MTP_PRODUCTION=true`) se aplica siempre.
- [ ] Estados hover/focus accesibles en thumbnails (borde azul, sombra sutil).
- [ ] Asegurar z-index superior a otros elementos.
- [ ] Estilos para input título y textarea descripción cuando están visibles.

### Fase 3: Interceptar botón imagen y agregar lógica del modal
**Archivo:** `backend/blog/static/blog/js/blog_editor.js`
- [ ] Añadir variable/estado global para indicar que el selector está abierto (ej. `window.imageSelectorOpen = false`), **sin tocar otras variables globales**.
- [ ] Implementar `detectImageContext()`:
  - Obtiene cursor actual (`cm.getDoc().getCursor()`).
  - Recorre líneas hacia arriba buscando `:::slides` o `:::popup:gallery`.
  - Retorna `{ mode, startLine }`.
- [ ] Modificar `insertMtpTemplate()`: cuando `action === 'image'`, guardar posición del cursor (o contexto) y llamar a `openImageSelectorModal()` en lugar de insertar template.
- [ ] Al cargar la página, marcar el botón imagen como migrado: Añadir clase `mtp-migrated` al botón `[data-mtp="image"]` (esto se puede hacer en `initMtpToolbar()`).
- [ ] Al cargar la página, **bloquear visualmente los demás botones**: Añadir clase `mtp-disabled` a todos los botones de `#mtpToolbar` excepto `[data-mtp="image"]`, solo si `MTP_PRODUCTION === true`.
- [ ] Implementar `openImageSelectorModal()`:
  - Llama a `detectImageContext()`.
  - Actualiza badge superior según modo.
  - Muestra/oculta inputs título/descripción según modo.
  - Puebla grid con `uploadedFiles` (reutilizando lógica de renderizado de thumbnails pequeños).
  - Si no hay archivos, muestra estado vacío.
  - Abre modal vía `$('#imageSelectorModal').modal('show')`.
  - Guarda el modo detectado en variable temporal (no global) para usarlo al insertar.
- [ ] Implementar `insertImageInEditor(filename, title, description, mode)`:
  - Construye texto markdown según modo.
  - Restaura la posición del cursor guardada (o recalcula) antes de insertar.
  - Inserta en cursor actual.
  - Llama `refreshImageWidgets()` tras 100ms.
- [ ] Ajustar FilePond `onload` (en la configuración existente):
  - Ya se captura `data.filename` en el `onload` actual (línea 1224).
  - **NUEVO**: Si `window.imageSelectorOpen === true`, **no** ejecutar la inserción automática (ni renderUploadedFile). En su lugar, guardar el filename temporalmente y dejar que el cierre del modal lo inserte.
  - Si `window.imageSelectorOpen === false`, comportamiento original sin cambios.
- [ ] Asegurar que al cerrar modal (Cancelar, backdrop) se limpien inputs, se limpie el estado y se cierre sin efectos secundarios.  
- [ ] Asegurar que al cargar un artículo existente, el modal refleja las imágenes ya existentes (automático, se reusa `uploadedFiles`).

---

## 🧪 Casos de prueba (checklist manual)

- [ ] **Caso 1:** Artículo nuevo sin imágenes, cursor normal. Clic en botón imagen → modal abre. Badge: "📝 Artículo normal". Grid vacío. Inputs título/descripción ocultos. Clic en "Cargar desde PC" → FilePond activo → subir imagen → se inserta `![filename](./filename)\n` + aparece widget ⋮.
- [ ] **Caso 2:** Artículo con 3 imágenes existentes, cursor normal. Clic en botón imagen → modal muestra 3 thumbnails. Badge normal. Clic en uno → se inserta markdown simple + widget ⋮ aparece.
- [ ] **Caso 3:** Cursor dentro de `:::slides`. Clic en botón imagen → modal abre. Badge: "📊 Dentro de :::slides". Inputs título y descripción visibles y habilitados. Grid con imágenes. Clic en imagen → se inserta `![Título|Descripción](filename)\n` + widget ⋮ aparece. Valores de inputs vacíos → usan placeholders.
- [ ] **Caso 4:** Cursor dentro de `:::popup:gallery`. Igual que Caso 3 pero badge: "🖼️ Dentro de :::popup:gallery".
- [ ] **Caso 5:** Dentro de slides, modal abierto, se sube imagen nueva con FilePond → modal se cierra solo → imagen se inserta con formato slides (usa inputs actuales del modal) + widget ⋮ aparece.
- [ ] **Caso 6:** Modal abierto, usuario hace clic fuera (backdrop) o Cancelar → modal se cierra sin cambios, no se inserta nada.
- [ ] **Caso 7:** Dentro de slides con imagen que ya tenía título/descripción previos. Al abrir modal, los inputs deberían reflejar esos valores extraídos (si se implementa la extracción). Si no, al menos se inserta con valores por defecto.
- [ ] **Caso 8:** FilePond drag&drop o pegar imagen con el modal CERRADO → se inserta la imagen normalmente (sin interferencia del selector).  
- [ ] **Caso 9:** Cursor al final de un párrafo normal, clic en botón imagen → selector abre en modo normal → inserta imagen → cursor queda justo después de la imagen insertada, foco en editor.
- [ ] **Caso 10 (marca visual):** Al cargar el editor, el botón de imagen (`data-mtp="image"`) muestra la etiqueta "MTP" de 10px en azul en la esquina superior izquierda, sin romper el diseño del botón.
- [ ] **Caso 11 (bloqueo):** Al cargar el editor en producción (`MTP_PRODUCTION=true`), el botón `data-mtp="image"` está habilitado (opacidad normal, cursor pointer). Los demás botones de `#mtpToolbar` tienen opacidad reducida (0.35), cursor `not-allowed` y filtro gris (35%). Al hacer clic en un botón bloqueado no ocurre nada.

---

## 🔒 Reglas a respetar

1. **No modificar** `MTP_TEMPLATES['image']` — se deja como está para posible fallback.
2. **No modificar la lógica de upload de FilePond** — se reutiliza tal cual, **solo se agrega una bandera condicional** en el `onload` para evitar doble inserción cuando el selector está abierto. No se altera el flujo de drag&drop ni pegado.
3. **No modificar CSS existente** — solo agregar reglas nuevas para el selector (clases con prefijo `.selector-`), para la marca MTP (clases con prefijo `.mtp-`) y para el bloqueo visual de botones no migrados.
4. **No introducir dependencias nuevas** — solo HTML/CSS/JS nativo + Bootstrap 4 ya cargado.
5. **No usar `data-bs-*` attributes** para abrir/cerrar el modal — se instancia vía jQuery como los demás modales (`$('#modal').modal('show')`).
6. **No usar `btn-close`** — usar `.close` con `&times;` (Bootstrap 4).
7. **No eliminar funcionalidad previa** — solo interceptar, no reemplazar.
8. **La detección de contexto** debe buscar hacia arriba de forma segura: no romper si no encuentra bloques slides/gallery.
9. **Preservar el estado del editor**: guardar/restaurar la posición del cursor al interactuar con el modal.
10. **La marca visual MTP** debe ser sutil: tamaño 10px, color azul (#0d6efd), posición absoluta en la esquina superior izquierda del botón, sin desplazar el icono original ni romper el layout.
11. **El bloqueo de botones no migrados** debe ser visible: opacidad 0.35, cursor `not-allowed`, `filter: grayscale(35%)`. Solo el botón `data-mtp="image"` queda interactivo. El resto ignora clics completamente.

---

> **Nota para implementación:** Esta HU es SOLO definición. No se implementará en esta etapa. Cuando se apruebe, se procede fase por fase siguiendo las reglas de `.clinerules` (fases ≤15 min, probar cada una, no más de una cosa a la vez).