# HU-20_C_V1: Widget de Slides de Imágenes en el Editor

> **Estado:** Pendiente de aprobación  
> **Fecha:** 2026-06-23  
> **Módulo:** Blog Editor (MTP Toolbar)  
> **Arquitectura:** JS vanilla + Bootstrap 4 + EasyMDE (sin dependencias nuevas)

---

## 1. Objetivo

Agregar un **widget MTP unificado** que permita al usuario **crear slides de imágenes** (`:::slides`) o **galerías popup** (`:::popup:gallery`) dentro del artículo. Ambos comparten la misma estructura, y se diferencian solo por el tipo de bloque. Cada imagen del slide/gallery tiene título y descripción opcionales, y se seleccionan múltiples imágenes desde un selector multi-select con upload integrado.

---

## 2. Necesidad de negocio (por qué / para qué / qué gana el usuario)

- **Qué gana el usuario/cliente:** Puede armar carrouseles/secuencias visuales (`:::slides`) o galerías popup (`:::popup:gallery`) desde un solo lugar, sin recordar sintaxis ni escribir markdown a mano. Cada imagen puede tener su propio título/descripción.
- **Qué gana el producto:** Unifica dos formatos muy similares en una sola UI, reduciendo duplicación de features y mantenimiento. El editor sigue creciendo como herramienta de contenido enriquecido.
- **Qué problema resuelve:** Hoy crear `:::slides` o `:::popup:gallery` requiere recordar la sintaxis exacta, escribir `![Título|Desc](ruta)` por cada imagen y respetar su apertura/cierre. Con este widget se hace en pocos clics desde la barra MTP, y el usuario elige dinámicamente qué tipo de bloque insertar.

---

## 3. Criterios de aceptación

### 3.1 Modal unificado (Slides / Popup Gallery)

- Al clicar el botón **Slides** en la MTP Toolbar se abre un **modal dedicado** (similar al selector de imágenes o al de video).
- El modal contiene:
  - **Toggle superior** con dos opciones: **📊 Slides** y **🖼️ Popup Gallery**. Cambiar el toggle actualiza el badge de modo, los placeholders/help texts y el tipo de bloque a insertar.
  - Badge de modo dinámico (ej: `📊 Dentro de :::slides` o `🖼️ Dentro de :::popup:gallery` o `📝 Artículo normal` si no hay bloque activo).
  - **Campos de título/descripción por cada imagen seleccionada** (lista dinámica a la derecha o debajo del grid).
  - Grid de imágenes existentes igual al selector actual, **pero con posibilidad de multi-selección** (click para seleccionar múltiples; las seleccionadas se marcan con `.is-selected`).
  - Botón **Subir imagen desde PC** reutilizando el endpoint `/blog/api/upload-file/`.
  - Botón **Crear [tipo]** (dinámico: “Crear slide” o “Crear gallery”) que genera el bloque correspondiente con todas las imágenes seleccionadas.
- Si el cursor está dentro de un bloque `:::slides` o `:::popup:gallery` existente, el modal lo reconoce y presetea el toggle + badge (misma lógica que `detectImageContext` en image-selector).

### 3.2 Inserción en el editor

- Al confirmar, se inserta en el cursor el bloque **válido y bien formado** según el modo elegido:
  - **Slides:**
    ```markdown
    :::slides
    ![Título 1|Descripción 1](./img-1.png)
    ![Título 2|Descripción 2](./img-2.png)
    :::
    ```
  - **Popup Gallery:**
    ```markdown
    :::popup:gallery
    ![Título 1|Descripción 1](./img-1.png)
    ![Título 2|Descripción 2](./img-2.png)
    :::
    ```
- **Cada imagen debe tener SIEMPRE título y descripción** (aunque sean defaults como "Sin título" / "Sin descripción"), porque ambos bloques lo requieren para parseo correcto en el frontend.

### 3.3 Widget MTP en el editor (dropdown)

- Cada línea `![...](...)` dentro del bloque **recibe el widget MTP estándar**: grip, menú (⋮), ayuda (?), igual que en los widgets de imagen existentes.
- El dropdown del widget **NO debe mostrar la opción "Marcar como portada"** (solo tiene sentido para la imagen de portada del artículo).
- El dropdown solo debe tener:
  - **Bloquear en artículo** (toggle `:::no-import:::` por imagen).
  - **Eliminar [tipo]** (dinámico: "Eliminar slide" o "Eliminar gallery"): elimina **todo el bloque** `:::slides ... :::` o `:::popup:gallery ... :::` del editor, no solo la línea individual.
- El widget debe verse igual que los otros: borde de color, botones inline, grip para drag-and-drop.

### 3.4 Reutilización y arquitectura

- **Se crea un nuevo archivo** `backend/blog/static/blog/js/blog_editor/slide-widget.js`.
- Reutiliza todo lo posible:
  - `uploadedFiles` (array global de index.js).
  - `renderUploadedFile()` y helpers.
  - Endpoint `/blog/api/upload-file/`.
  - Clases CSS base de `.img-line-widget`.
  - `detectImageContext()` de `image-selector.js` para saber si ya estamos dentro de un bloque `:::slides` o `:::popup:gallery`.
- **No** reimplementa FilePond ni subida duplicada.

---

## 4. Pasos de implementación

### Fase 1: Crear el módulo `slide-widget.js`

1. Crear archivo nuevo en `backend/blog/static/blog/js/blog_editor/slide-widget.js`.
2. Definir funciones:
   - `openGalleryModal()`: abre el modal HTML unificado (agregarlo en `blog_editor.html`) y presetea el modo (slides o popup:gallery) según el contexto actual.
   - `buildGalleryBlock(mode, images)`: recibe `mode` (`'slides'` o `'popup:gallery'`) y array de `{filename, title, description}`, devuelve la string markdown correspondiente.
   - `insertGalleryInEditor(mode, blockText)`: inserta el bloque en el cursor actual y llama a `refreshImageWidgets()`.
   - `initGalleryToolbar()`: bindea el botón **Slides** de la MTP a `openGalleryModal()` preseteando modo `'slides'` por defecto.
3. Implementar multi-selección en el grid del modal (click-to-toggle con clase `.is-selected`).
4. El toggle del modal intercambia entre modo `slides` y `popup:gallery`; cambia el badge, el placeholder de help text y la etiqueta del botón de inserción.

### Fase 2: Agregar el modal unificado en `blog_editor.html`

1. Agregar un nuevo modal `#galleryModal` después del `#videoModal`.
2. Estructura:
   - **Header** con badge de modo dinámico y botón cerrar.
   - **Toggle superior**: dos botones/radio «📊 Slides» y «🖼️ Popup Gallery» (estilo pills o segmented control). Un solo selector activo a la vez.
   - **Cuerpo**: mismo layout que `imageSelectorModal`, pero:
     - Grid de miniaturas con multi-selección (click toggles `.is-selected`).
     - Panel lateral o sección inferior con lista de filas dinámicas: una por imagen seleccionada, cada una con inputs `Título` y `Descripción`.
   - **Footer**: botón **Cancelar** y botón **Crear [modo]** (texto dinámico).

### Fase 3: Integrar en `index.js` y `blog_editor.html`

1. En `blog_editor.html`, agregar/asegurar el botón en la MTP Toolbar (ya existe `data-mtp="slides"`). Vincularlo a `openGalleryModal()`:
   ```html
   <button type="button" class="mtp-btn" data-mtp="slides" data-tip="Slides / Gallery">
     <i class="fas fa-layer-group"></i>
   </button>
   ```
2. Cargar `slide-widget.js` en el HTML **después** de `index.js`:
   ```html
   <script src="{% static 'blog/js/blog_editor/slide-widget.js' %}"></script>
   ```
3. En `refreshImageWidgets()` de `index.js` **no** se agrega lógica nueva; ya detecta `^!\[.*?\]\(.*?\)$` y aplica el widget MTP genérico a cualquier línea de imagen, sin importar el bloque padre.

### Fase 4: Ajustar `video-widget.js` y estilos (si aplica)

- Verificar que no haya conflicto entre handlers de dropdown del video y del nuevo gallery/slide widget (delegación por clase genérica `.img-line-dropdown`).
- El gallery/slide widget usa `img-line-widget mtp-branded` (sin `video-widget-mtp`).

### Fase 5: Pruebas

1. Abrir editor, clicar **Slides** en MTP → se abre modal.
2. Seleccionar 2-3 imágenes, asignar título/desc a cada una → **Crear slide**.
3. Verificar que el bloque se inserte correctamente y que cada línea tenga widget MTP con grip + menú (⋮) + ayuda (?).
4. Verificar que el dropdown **solo tenga**: Bloquear + Eliminar (sin portada).
5. Eliminar slide → debe borrar todo el bloque `:::slides ... :::`.
6. Bloquear una imagen del slide → se envuelve en `:::no-import:::` correctamente (reutiliza `toggleUploadedFile` existente).

---

## 5. Alcance exógeno (sin modificar)

- **Backend:** No se tocan vistas ni endpoints. El bloque `:::slides` se guarda como markdown crudo en `content_md`.
- **Parser de frontend:** No se modifica el parser del blog público (ya existe y funciona con el formato `![Título|Desc](ruta)` dentro de `:::slides`).
- **FilePond / upload:** Se reutiliza lógica existente.

---

## 6. Riesgos y mitigaciones

| Riesgo                                                                                                                 | Mitigación                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Duplicación de handlers entre video y slide widget                                                                     | Compartir clase genérica `.img-line-dropdown` y reutilizar `videoMenuClickHandler` renombrándolo a `genericMenuClickHandler`.              |
| `refreshImageWidgets()` crea widgets tipo imagen estándar para slides, pero el usuario espera comportamiento de bloque | Aceptado: el bloque `:::slides` se edita línea a línea con el mismo widget imagen; solo el dropdown cambia (sin portada, eliminar bloque). |
| Título/descripción vacíos generan `![]()                                                                               | ()` inválido                                                                                                                               | Defaults forzados: `"Sin título"` / `"Sin descripción"`. |

---

## 7. Entregables

1. **Archivo nuevo:** `backend/blog/static/blog/js/blog_editor/slide-widget.js`.
2. **Modificación:** `backend/blog/templates/blog/blog_editor.html` (agregar modal unificado `#galleryModal` y script include).
3. **Modificación:** `backend/blog/static/blog/js/blog_editor/index.js` (solo vincular botón MTP a `openGalleryModal`, sin reimplementar lógica).
4. (Opcional) Ajuste CSS menor en `blog_editor.css` para el toggle pills del modal.
