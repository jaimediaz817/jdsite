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

## 🔍 Análisis de reusabilidad (sin modificar código existente)

### Componentes que SE REUTILIZAN tal cual:

| Componente                     | Archivo                           | Por qué se reutiliza                                                                                                                                                                  |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uploadedFiles` (array global) | `blog_editor.js` línea 14         | Ya contiene todas las imágenes subidas en la sesión. Al cargar artículo, se pobla con `existing_files` del backend (líneas 1696-1716).                                                |
| `renderUploadedFile(file)`     | `blog_editor.js` línea 158        | Función auxiliar que renderiza una vista previa de archivo. Se puede invocar desde el modal si se necesita mostrar thumbnails.                                                        |
| `refreshImageWidgets()`        | `blog_editor.js` línea 1047       | Refresca los widgets flotantes de HU-20-B. **Se llama DESPUÉS de insertar la imagen** para que aparezca el dropdown.                                                                  |
| `getCookie('csrftoken')`       | `blog_editor.js` línea 1569       | Para headers CSRF en upload.                                                                                                                                                          |
| `easyMDE` + `cm` (CodeMirror)  | `blog_editor.js` líneas 623, 643  | Instancia del editor. Se usa `easyMDE.value()`, `cm.getCursor()`, `cm.getDoc()` para detectar contexto e insertar texto.                                                              |
| FilePond config                | `blog_editor.js` líneas 1216-1252 | Ya configurado para subir a `/blog/api/upload-file/`. El modal puede **activar el input FilePond existente** (`#filepond`) en lugar de crear uno nuevo.                               |
| Modales Bootstrap 4 existentes | `blog_editor.html` líneas 187-278 | Patrón de modal ya establecido (`.modal.fade`, `.modal-dialog`, `.modal-content`) con clases `.close` (NO `btn-close`, Bootstrap 4).                                                  |
| `insertMtpTemplate(action)`    | `blog_editor.js` línea 1802       | Función dispatch actual del toolbar. Habrá que **interceptar** el action `'image'` antes de llegar a `MTP_TEMPLATES['image']`.                                                        |
| `MTP_TEMPLATES['image']`       | `blog_editor.js` línea 1744       | Template base actual: `'![Texto alternativo](ruta-de-la-imagen.png)\n'`. **No se modifica**, se deja como fallback, pero la rama `'image'` en `insertMtpTemplate` se desvía al modal. |

### Componentes que NO se tocan:
- HTML del template `blog_editor.html` — solo se **añade** un nuevo modal, no se modifica estructura existente.
- CSS existente — se puede añadir estilos mínimos para el modal selector en `blog_editor.css`.
- `upload-file` endpoint backend — ya existe y funciona.
- `get-blog/<slug>/` endpoint — ya retorna `existing_files`.
- Sistema `:::no-import:::` — independiente, no afectado.
- Widgets HU-20-B — no se modifica su lógica, solo se invoca `refreshImageWidgets()` desde el nuevo flujo.

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

1. Detecta el **contexto del cursor** en el editor:
   - Obtiene la línea actual y líneas anteriores en el buffer.
   - Busca hacia arriba si estamos dentro de un bloque `:::slides` o `:::popup:gallery`.
   - Extrae el modo: `'normal'`, `'slides'` o `'popup:gallery'`.
   - Si estamos en slides/gallery, extrae también si hay contenido de título/descripción existente en la línea actual (formato `![Título|Descripción](...)`).

2. Abre un modal HTML nuevo (`#imageSelectorModal`) con:
   - **Badge superior** con modo detectado: 📝 Normal | 📊 Slides | 🖼️ Galería popup.
   - Sección "Imágenes existentes": grid de thumbnails generados desde `uploadedFiles`.
   - Sección inputs título/descripción: **visibles y habilitadas solo si el modo es `slides` o `popup:gallery`**. Separador `|` visible entre ambos campos.
   - Botón "Cargar desde PC": activa `document.getElementById('filepond').click()`.

3. Al hacer clic en una imagen existente:
   - Cierra el modal.
   - Obtiene `filename` del elemento clickeado.
   - Si modo es slides/gallery, lee valores de título y descripción.
   - Llama a `insertImageInEditor(filename, title, description, mode)`.

4. Al completar upload de FilePond (`onload`):
   - Si el modal selector está abierto, capturar el `filename` del archivo recién subido.
   - Cerrar modal.
   - Llamar a `insertImageInEditor(filename, '', '', mode)` con el modo detectado al abrir el modal.

5. `insertImageInEditor(filename, title, description, mode)`:
   - Construye el texto a insertar:
     - `mode === 'normal'`: `![${filename}](./${filename})\n`
     - `mode === 'slides'` o `'popup:gallery'`: `![${title || 'Título'}|${description || 'Descripción'}](./${filename})\n`
   - Inserta en la posición del cursor de EasyMDE.
   - Llama `refreshImageWidgets()` tras 100ms para que HU-20-B pinte el icono ⋮.

6. Función auxiliar `detectImageContext()`:
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

### Fase 1: HTML del modal selector
**Archivo:** `backend/blog/templates/blog/blog_editor.html`
- [ ] Añadir nuevo modal `#imageSelectorModal` después del modal de vista previa de imagen.
- [ ] Estructura:
  - Header con título y badge de contexto (`#selector-mode-badge`).
  - Cuerpo con:
    - Input título (`#selector-title`) — oculto por defecto.
    - Textarea descripción (`#selector-description`) — oculto por defecto.
    - Grid de thumbnails (`#selector-existing-images`) para imágenes existentes.
    - Botón "Cargar desde PC" (`#selector-upload-btn`).
  - Footer con botones Cancelar y Seleccionar (este último se activa al hacer clic en una imagen existente).
- [ ] Usar clases Bootstrap 4 (`.close`, `&times;`) — respetando reglas del `.clinerules`.

### Fase 2: Estilos mínimos del modal
**Archivo:** `backend/blog/static/blog/css/blog_editor.css`
- [ ] Estilos para grid de thumbnails (`.selector-thumb-grid`, `.selector-thumb-item`, `.selector-thumb`).
- [ ] Estilos para badge de contexto (`.selector-mode-badge`).
- [ ] Estados hover/focus accesibles en thumbnails (borde azul, sombra sutil).
- [ ] Asegurar z-index superior a otros elementos.
- [ ] Estilos para input título y textarea descripción cuando están visibles.

### Fase 3: Interceptar botón imagen y agregar lógica del modal
**Archivo:** `backend/blog/static/blog/js/blog_editor.js`
- [ ] Implementar `detectImageContext()`:
  - Obtiene cursor actual (`cm.getDoc().getCursor()`).
  - Recorre líneas hacia arriba buscando `:::slides` o `:::popup:gallery`.
  - Retorna `{ mode, startLine }`.
- [ ] Modificar `insertMtpTemplate()`: cuando `action === 'image'`, llamar a `openImageSelectorModal()` en lugar de insertar template.
- [ ] Implementar `openImageSelectorModal()`:
  - Llama a `detectImageContext()`.
  - Actualiza badge superior según modo.
  - Muestra/oculta inputs título/descripción según modo.
  - Puebla grid con `uploadedFiles` (reutilizando lógica de renderizado de thumbnails pequeños).
  - Si no hay archivos, muestra estado vacío.
  - Abre modal vía `$('#imageSelectorModal').modal('show')`.
  - Guarda el modo detectado en variable temporal para usarlo al insertar.
- [ ] Implementar `insertImageInEditor(filename, title, description, mode)`:
  - Construye texto markdown según modo.
  - Inserta en cursor actual.
  - Llama `refreshImageWidgets()` tras 100ms.
- [ ] Conectar evento click en FilePond (`onload`):
  - Ya se captura `data.filename` en el `onload` actual (línea 1224).
  - Si el modal selector está abierto, guardar archivo en estado temporal, cerrar modal, e insertar imagen (con modo guardado).
- [ ] Asegurar que al cerrar modal (Cancelar, backdrop) se limpien inputs y se cierre sin efectos secundarios.

---

## 🧪 Casos de prueba (checklist manual)

- [ ] **Caso 1:** Artículo nuevo sin imágenes, cursor normal. Clic en botón imagen → modal abre. Badge: "📝 Artículo normal". Grid vacío. Inputs título/descripción ocultos. Clic en "Cargar desde PC" → FilePond activo → subir imagen → se inserta `![filename](./filename)\n` + aparece widget ⋮.
- [ ] **Caso 2:** Artículo con 3 imágenes existentes, cursor normal. Clic en botón imagen → modal muestra 3 thumbnails. Badge normal. Clic en uno → se inserta markdown simple + widget ⋮ aparece.
- [ ] **Caso 3:** Cursor dentro de `:::slides`. Clic en botón imagen → modal abre. Badge: "📊 Dentro de :::slides". Inputs título y descripción visibles y habilitados. Grid con imágenes. Clic en imagen → se inserta `![Título|Descripción](filename)\n` + widget ⋮ aparece. Valores de inputs vacíos → usan placeholders.
- [ ] **Caso 4:** Cursor dentro de `:::popup:gallery`. Igual que Caso 3 pero badge: "🖼️ Dentro de :::popup:gallery".
- [ ] **Caso 5:** Dentro de slides, modal abierto, se sube imagen nueva con FilePond → modal se cierra solo → imagen se inserta con formato slides (usa inputs actuales del modal) + widget ⋮ aparece.
- [ ] **Caso 6:** Modal abierto, usuario hace clic fuera (backdrop) o Cancelar → modal se cierra sin cambios, no se inserta nada.
- [ ] **Caso 7:** Dentro de slides con imagen que ya tenía título/descripción previos. Al abrir modal, los inputs deberían reflejar esos valores extraídos (si se implementa la extracción). Si no, al menos se inserta con valores por defecto.

---

## 🔒 Reglas a respetar

1. **No modificar** `MTP_TEMPLATES['image']` — se deja como está para posible fallback.
2. **No modificar** la lógica de upload de FilePond — se reutiliza tal cual (no modificar javascript). ni modificar CSS, solo agreguemos reglas css relativas a esta HU
3. **No introducir dependencias nuevas** — solo HTML/CSS/JS nativo + Bootstrap 4 ya cargado.
4. **No usar `data-bs-*` attributes** para abrir/cerrar el modal — se instancia vía jQuery como los demás modales (`$('#modal').modal('show')`).
5. **No usar `btn-close`** — usar `.close` con `&times;` (Bootstrap 4).
6. **No eliminar funcionalidad previa** — solo interceptar, no reemplazar.
7. **La detección de contexto** debe buscar hacia arriba de forma segura: no romper si no encuentra bloques slides/gallery.

---

> **Nota para implementación:** Esta HU es SOLO definición. No se implementará en esta etapa. Cuando se apruebe, se procede fase por fase siguiendo las reglas de `.clinerules` (fases ≤15 min, probar cada una, no más de una cosa a la vez).