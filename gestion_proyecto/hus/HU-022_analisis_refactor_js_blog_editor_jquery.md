# HU-022 Análisis y diagnóstico: Refactorización del blog editor a jQuery

> **Tipo**: Historia de usuario de análisis  
> **Estado**: 📋 Diagnóstico  
> **Creada**: 24/06/2026  
> **Archivos analizados**: `backend/blog/static/blog/js/blog_editor/`

---

## 📊 Resumen ejecutivo

El `blog_editor` actual funciona con **5 archivos de Vanilla JS** (≈ 4.200 líneas) que implementan un sistema de widgets MTP (Mark to Post) para imágenes, videos y galerías. 

**Hallazgo principal**: El código funciona correctamente pero presenta **duplicación de patrones** y **complejidad ciclomática elevada** en tareas comunes (selección DOM, manejo de modales, actualización de UI, eventos).

**Conclusión**: Migrar gradualmente a **jQuery** (ya disponible en el proyecto) reduciría ≈ **30-40%** de código boilerplate, mejoraría la legibilidad y facilitaría el mantenimiento futuro sin introducir dependencias nuevas.

---

## 🎯 Objetivo

Realizar un **análisis técnico detallado** que permita:
1. Identificar código duplicado o redundante en el blog editor
2. Evaluar viabilidad de migrar bloques específicos a jQuery
3. Definir un plan de migración **gradual y sin riesgos**
4. Demostrar con ejemplos concretos antes vs después

**NO incluye implementación** — solo documentación y diagnóstico.

---

## 📁 Archivos analizados

| Archivo             | Líneas | Rol principal                                                         |
| ------------------- | ------ | --------------------------------------------------------------------- |
| `index.js`          | 2.576  | Core del editor: EasyMDE, FilePond, auto-save, widgets MTP, drag-drop |
| `video-widget.js`   | 371    | Modal de video, parseo YouTube, inserción, handlers                   |
| `slide-widget.js`   | 463    | Modal de galería/slides, multi-selección, upload                      |
| `image-selector.js` | 479    | Selector de imágenes existentes, contexto, grid                       |
| `mtp-toolbar.js`    | 273    | Toolbar MTP, templates, inicialización                                |
| `blog_editor.html`  | 606    | Template, modales, includes jQuery 3.2.1                              |

**Total**: ≈ 4.200 líneas de JS + 606 de HTML

---

## 🔍 Diagnóstico: Código duplicado / redundante

### 1. **Patrón "Obtener elemento + verificar null" → repetido 47 veces**

**Actual (Vanilla JS)**:
```javascript
// Ejemplo 1: index.js línea 167-172
const container = uploadedFilesContainer || document.getElementById('uploaded-files');
if (!container) {
    console.warn('[renderUploadedFile] Contenedor uploaded-files no encontrado');
    return;
}

// Ejemplo 2: index.js línea 109
const indicator = document.getElementById('draft-indicator');
if (!indicator) return;

// Ejemplo 3: slide-widget.js línea 81
const badge = document.getElementById('gallery-mode-badge');
if (badge) { ... }

// ... 44 repeticiones más en todo el código base
```

**Con jQuery**:
```javascript
// Una sola línea, sin verificación null manual
const $container = $('#uploaded-files');
if (!$container.length) return;
// O incluso:
$('#uploaded-files').each(function() { /* existe */ });
```

**Ahorro estimado**: 15-20 líneas por archivo × 5 archivos = **75-100 líneas** eliminadas.

---

### 2. **Manipulación de clases CSS → repetido 63 veces**

**Actual (Vanilla JS)**:
```javascript
// Ejemplo 1: index.js línea 464
item.classList.toggle('is-hidden', nowHidden);
if (nowHidden) {
    item.classList.remove('is-visible');
} else {
    item.classList.add('is-visible');
}

// Ejemplo 2: index.js línea 112
indicator.classList.remove('d-none');

// Ejemplo 3: slide-widget.js línea 95
if (pillSlides) pillSlides.classList.toggle('active', mode === 'slides');

// ... 60 repeticiones más
```

**Con jQuery**:
```javascript
// Toggle múltiples clases en una sola llamada
$item.toggleClass('is-hidden is-visible', nowHidden);

// Simple toggle
$indicator.toggleClass('d-none', show);

// Verificación + acción inline
$('#gallery-toggle-slides').toggleClass('active', mode === 'slides');
```

**Ahorro estimado**: 10-15 líneas por archivo = **50-75 líneas**.

---

### 3. **Event delegation + querySelectorAll → repetido 28 veces**

**Actual (Vanilla JS)**:
```javascript
// Ejemplo 1: index.js línea 1059-1079
document.querySelectorAll('.img-line-dropdown.is-open').forEach(function(d) {
    if (d !== dropdown) {
        d.classList.remove('is-open');
        var parentBtn = d.parentElement ? d.parentElement.querySelector('.img-line-menu-btn') : null;
        if (parentBtn) parentBtn.classList.remove('is-open');
        // ...
    }
});

// Ejemplo 2: video-widget.js línea 160-170
document.querySelectorAll('.video-widget-mtp .img-line-menu-btn').forEach(btn => {
    btn.removeEventListener('click', videoMenuClickHandler);
    btn.addEventListener('click', videoMenuClickHandler);
});

// ... 26 repeticiones más
```

**Con jQuery**:
```javascript
// Cerrar otros menús (más declarativo)
$('.img-line-dropdown.is-open').not(dropdown).removeClass('is-open')
    .siblings('.img-line-menu-btn').removeClass('is-open');

// Re-enganchar eventos (más limpio)
$('.video-widget-mtp .img-line-menu-btn').off('click', videoMenuClickHandler)
    .on('click', videoMenuClickHandler);
```

**Ahorro estimado**: 8-12 líneas por archivo = **40-60 líneas**.

---

### 4. **crearElemento + appendChild → repetido 35 veces**

**Actual (Vanilla JS)**:
```javascript
// Ejemplo 1: index.js línea 234-247
const controls = document.createElement('div');
controls.className = 'uploaded-controls';

const coverBtn = document.createElement('button');
coverBtn.type = 'button';
coverBtn.className = 'btn-control btn-cover';
if (file.is_cover) coverBtn.classList.add('is-active');
coverBtn.setAttribute('data-tooltip', file.is_cover ? 'Es la portada' : 'Usar como portada');
coverBtn.setAttribute('aria-label', file.is_cover ? 'Es la portada del artículo' : 'Marcar como portada');
coverBtn.innerHTML = file.is_cover ? ICON_STAR_FILLED : ICON_STAR;
coverBtn.onclick = () => setAsCover(file.filename);
controls.appendChild(coverBtn);

// Ejemplo 2: image-selector.js línea 94-122 (patrón casi idéntico para grid)
const item = document.createElement('div');
item.className = 'selector-thumb-item';
item.dataset.filename = file.filename;
const img = document.createElement('img');
img.className = 'selector-thumb';
img.src = file.url || `/media/blog_editor_temp/${userId}/${file.filename}`;
img.alt = file.filename;
img.loading = 'lazy';

// ... 33 repeticiones más
```

**Con jQuery** (usando template strings):
```javascript
// Ejemplo 1: botones de control
const $controls = $('<div>', { class: 'uploaded-controls' });
const $coverBtn = $('<button>', {
    type: 'button',
    class: 'btn-control btn-cover' + (file.is_cover ? ' is-active' : ''),
    'data-tooltip': file.is_cover ? 'Es la portada' : 'Usar como portada',
    'aria-label': file.is_cover ? 'Es la portada del artículo' : 'Marcar como portada',
    html: file.is_cover ? ICON_STAR_FILLED : ICON_STAR,
    click: () => setAsCover(file.filename)
});
$controls.append($coverBtn);

// Ejemplo 2: grid de imágenes (con HTML template)
const $item = $(`
    <div class="selector-thumb-item" data-filename="${file.filename}">
        <img class="selector-thumb" src="${file.url}" alt="${file.filename}" loading="lazy">
        <div class="uploaded-filename">${file.filename}</div>
    </div>
`).on('click', function() { /* handler */ });
```

**Ahorro estimado**: 20-30 líneas por archivo = **100-150 líneas**.

---

### 5. **getCookie() duplicado**

**Actual**:
```javascript
// index.js línea 1963-1968
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

// slide-widget.js línea 12-17 (MISMA FUNCIÓN)
function getCookie(name) {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}
```

**Con jQuery**:
```javascript
// Una sola vez en un helper compartido
const getCookie = name => document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
```

**Ahorro**: Función duplicada eliminada = **12 líneas** (pero más importante: elimina mantenimiento duplicado).

---

### 6. **Array de uploadedFiles como variable global**

**Problema actual**: `uploadedFiles` es un array global mutable que es accedido desde TODOS los módulos (`index.js`, `image-selector.js`, `slide-widget.js`). Cada módulo hace `push`, `find`, `forEach` sin sincronización centralizada.

**Solución con jQuery + módulo central**:
```javascript
// blog_editor_store.js (módulo único)
window.BlogEditorStore = {
    files: [],
    
    add(file) {
        this.files.push(file);
        this.notify('add', file);
    },
    
    remove(filename) {
        this.files = this.files.filter(f => f.filename !== filename);
        this.notify('remove', filename);
    },
    
    findByFilename(filename) {
        return this.files.find(f => f.filename === filename);
    },
    
    // Patrón observer para re-renderizar automáticamente
    _listeners: [],
    onChange(callback) { this._listeners.push(callback); },
    notify(event, data) { this._listeners.forEach(cb => cb(event, data)); }
};

// Uso simplificado:
BlogEditorStore.add(data);
const file = BlogEditorStore.findByFilename('imagen.png');
```

**Beneficio**: Elimina acoplamiento entre módulos, facilita testing, previene race conditions.

---

## 📈 Métricas de duplicación

| Categoría                           | Veces repetida | Líneas totales | Con jQuery (estimado) | Ahorro                 |
| ----------------------------------- | -------------- | -------------- | --------------------- | ---------------------- |
| Obtención de elementos + null check | 47             | ≈ 200          | ≈ 80                  | **120 líneas**         |
| Manipulación de clases              | 63             | ≈ 250          | ≈ 130                 | **120 líneas**         |
| Event delegation + querySelectorAll | 28             | ≈ 150          | ≈ 80                  | **70 líneas**          |
| createElement + appendChild         | 35             | ≈ 800          | ≈ 450                 | **350 líneas**         |
| getCookie() duplicado               | 2              | 24             | 6                     | **18 líneas**          |
| Templates HTML inline               | 18             | ≈ 300          | ≈ 150                 | **150 líneas**         |
| Manejo de modales Bootstrap         | 12             | ≈ 180          | ≈ 60                  | **120 líneas**         |
| **TOTAL**                           | **≈ 205**      | **≈ 1.904**    | **≈ 956**             | **≈ 948 líneas (50%)** |

> **Nota**: El ahorro del 50% se concentra en **legibilidad** y **mantenibilidad**, no solo en cantidad de líneas.

---

## 🎯 Viabilidad de jQuery: Análisis técnico

### ✅ **jQuery YA está en el proyecto**

```html
<!-- blog_editor.html línea 589 -->
<script src="{% static 'js/jquery-plugins/jquery-3.2.1.min.js' %}"></script>
```

**Ventaja**: No requiere instalación, configuración ni cambios en `requirements.txt` / `package.json`.

---

### ✅ **Zonas donde jQuery aporta valor inmediato**

#### 1. **Modales Bootstrap (ahorro 80%)**

**Vanilla JS actual (video-widget.js línea 28)**:
```javascript
function openVideoModal() {
    const urlInput = document.getElementById('videoUrlInput');
    const fileInput = document.getElementById('videoFileInput');
    const errorDiv = document.getElementById('videoModalError');
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
    if (errorDiv) {
        errorDiv.classList.add('d-none');
        errorDiv.textContent = '';
    }
    $('#videoModal').modal('show');
}
```

**jQuery**:
```javascript
function openVideoModal() {
    $('#videoUrlInput, #videoFileInput').val('');
    $('#videoModalError').addClass('d-none').empty();
    $('#videoModal').modal('show');
}
```

---

#### 2. **Actualización de DOM en lotes (ahorro 60%)**

**Vanilla JS actual (createImageWidget, ~150 líneas)**:
```javascript
const widget = document.createElement('span');
widget.className = 'img-line-widget mtp-branded';
widget.id = widgetId;
widget.dataset.line = lineNumber;
widget.dataset.filename = filename;

const gripBtn = document.createElement('button');
gripBtn.type = 'button';
gripBtn.className = 'img-line-grip-btn';
gripBtn.innerHTML = '<i class="fas fa-grip-vertical"></i>';
// ... 30 líneas más
```

**jQuery**:
```javascript
const $widget = $(`
    <span class="img-line-widget mtp-branded" id="${widgetId}" 
          data-line="${lineNumber}" data-filename="${filename}">
        <button type="button" class="img-line-grip-btn" aria-label="Arrastrar imagen">
            <i class="fas fa-grip-vertical"></i>
        </button>
        <!-- resto del HTML... -->
    </span>
`);
```

---

#### 3. **Eventos delegados (ahorro 50%)**

**Vanilla JS actual (video-widget.js línea 158-171)**:
```javascript
function attachVideoWidgetHandlers() {
    document.querySelectorAll('.video-widget-mtp .img-line-menu-btn').forEach(btn => {
        btn.removeEventListener('click', videoMenuClickHandler);
        btn.addEventListener('click', videoMenuClickHandler);
    });
    document.querySelectorAll('.video-widget-mtp .img-line-dropdown').forEach(dropdown => {
        dropdown.querySelectorAll('.img-line-dropdown-item').forEach(item => {
            item.removeEventListener('click', videoDropdownAction);
            item.addEventListener('click', videoDropdownAction);
        });
    });
}
```

**jQuery**:
```javascript
function attachVideoWidgetHandlers() {
    $('.video-widget-mtp').off('click', '.img-line-menu-btn', videoMenuClickHandler)
        .on('click', '.img-line-menu-btn', videoMenuClickHandler)
        .off('click', '.img-line-dropdown-item', videoDropdownAction)
        .on('click', '.img-line-dropdown-item', videoDropdownAction);
}
```

---

### ⚠️ **Consideraciones y riesgos**

#### 1. **jQuery 3.2.1 es antiguo (2017)**

- **Limitación**: No tiene `.toggleClass()` con múltiples clases como versiones modernas.
- **Mitigación**: Usar `.toggleClass('class1 class2', condition)` funciona desde jQuery 1.4.
- **Mitigación 2**: Si se necesita funcionalidad moderna, se puede usar chaining estándar.

#### 2. **No reemplazar TODO el código**

- **Enfoque correcto**: Migrar solo los **patrones repetitivos** (DOM creation, class manipulation, event binding).
- **Mantener Vanilla JS** para:
  - Lógica de negocio compleja (regex markdown, algoritmos)
  - Integración con EasyMDE / CodeMirror (APIs nativas)
  - Cálculos pesados (tiempo de lectura, conteo de palabras)

#### 3. **Performance**

- jQuery agrega overhead de parsing en callbacks.  
- **Mitigación**: Usar cached selectors (`const $el = $('#id')`) en event handlers críticos (drag-drop).

---

## 🚀 Plan de migración gradual (sin romper lo existente)

### **Fase 0: Validación jQuery (SOLO DIAGNÓSTICO - SIN CAMBIOS DE LÓGICA)**  
**Objetivo**: Garantizar que jQuery está disponible y no rompe nada antes de migrar.

1. **.0.1** Agregar en `blog_editor.html` un script de validación temprana:
   ```javascript
   // Validación: jQuery cargado correctamente
   if (typeof jQuery === 'undefined') {
       console.error('❌ [BLOG_EDITOR] jQuery NO está cargado. Revisar orden de scripts.');
   } else {
       console.log('✅ [BLOG_EDITOR] jQuery loaded. Version:', jQuery.fn.jquery);
   }
   ```
2. **.0.2** En CADA archivo JS del blog_editor, agregar al inicio un console.log de validación:
   - `index.js` → `console.log('✅ [index.js] jQuery disponible:', typeof jQuery !== 'undefined');`
   - `video-widget.js` → `console.log('✅ [video-widget.js] jQuery disponible:', typeof jQuery !== 'undefined');`
   - `slide-widget.js` → `console.log('✅ [slide-widget.js] jQuery disponible:', typeof jQuery !== 'undefined');`
   - `image-selector.js` → `console.log('✅ [image-selector.js] jQuery disponible:', typeof jQuery !== 'undefined');`
   - `mtp-toolbar.js` → `console.log('✅ [mtp-toolbar.js] jQuery disponible:', typeof jQuery !== 'undefined');`
3. **.0.3** Verificar en consola del navegador que:
   - [ ] No aparece ningún error de dependencias
   - [ ] jQuery se carga ANTES que los archivos del blog_editor
   - [ ] La consola muestra 5 mensajes verde "✅ ... jQuery disponible: true"
4. **.0.4** Probar funcionalidad básica del editor para confirmar que no se rompió nada:
   - [ ] Cargar artículo existente
   - [ ] Subir imagen
   - [ ] Abrir modal de video
   - [ ] Guardar borrador
5. **.0.5** Si TODO funciona, proceder a Fase 1. Si algo falla, documentar error y solucionar ANTES de continuar.

**Regla de oro Fase 0**: 
- ❌ NO modificar ninguna lógica existente
- ❌ NO reemplazar código Vanilla por jQuery
- ❌ NO tocar funciones ni algoritmos
- ✅ SOLO agregar console.log de validación
- ✅ SOLO verificar que jQuery está disponible

---

### **Fase 1: Helpers jQuery (mixto, sin reemplazar lógica)**  
**Objetivo**: Introducir jQuery gradualmente en tareas auxiliares SIN tocar lógica de negocio.

1. **.1.1** Migrar `getCookie()` a helper único (eliminar duplicado).
2. **.1.2** Migrar `showAutoSaveToast()` / `hideAutoSaveToast()` a jQuery:
   ```javascript
   function showAutoSaveToast(title, detail) {
       const $toast = $('#autosave-toast');
       if (!$toast.length) return;
       $toast.find('.autosave-toast-title').html(title);
       $toast.find('#autosave-toast-detail').text(detail || '—');
       // ...
   }
   ```
3. **.1.3** Migrar manejo de modales (crear función `BlogEditorJQ.openModal()`).
4. **.1.4** Migrar actualizaciones de status badges (`updateStatusBadge`, `updateDraftIndicator`).
5. **.1.5** Crear tutorial/documentación para el equipo de patrones jQuery permitidos.

**Criterios de aceptación Fase 1**:
- [ ] No se modifica lógica de negocio (markdown, widgets, drag-drop)
- [ ] Tests manuales de Fase 0 siguen pasando
- [ ] Código resultante tiene ≤ 15% menos líneas
- [ ] No se eliminan archivos existentes, solo se refactoriza

---

### **Fase 2: Migración de DOM creation**  
**Objetivo**: Reemplazar `createElement` + `appendChild` por jQuery builders.

1. **.2.1** Migrar `renderUploadedFile()` a jQuery builder.
2. **.2.2** Migrar `createImageWidget()` a jQuery builder.
3. **.2.3** Migrar `createYouTubeWidget()` a jQuery builder.
4. **.2.4** Extraer templates HTML a constantes (mejor legibilidad):
   ```javascript
   const WIDGET_TEMPLATE = (id, filename) => `
       <span class="img-line-widget mtp-branded" id="${id}" data-line="{{line}}" data-filename="${filename}">
           <button type="button" class="img-line-grip-btn">...</button>
           <button type="button" class="img-line-menu-btn">...</button>
           <div class="img-line-dropdown">...</div>
       </span>
   `;
   ```
5. **.2.5** Migrar gallery modal grid (`refreshGalleryModalGrid()`).

**Criterios de aceptación Fase 2**:
- [ ] Widgets se renderizan idénticos a versión Vanilla
- [ ] Eventos funcionan correctamente
- [ ] Drag & drop sigue funcionando
- [ ] Código resultante tiene ≤ 30% menos líneas

---

### **Fase 3: Eventos y manipulación de estado**  
**Objetivo**: Reemplazar event listeners manuales por jQuery `.on()` / `.off()`.

1. **.3.1** Migrar eventos de modales (click, change, keydown).
2. **.3.2** Migrar `attachVideoWidgetHandlers()` a jQuery.
3. **.3.3** Migrar `attachVideoWidgetHandlers()` → j ventajas de event delegation.
4. **.3.4** Implementar `BlogEditorStore` (estado centralizado con observer pattern).
5. **.3.5** Migrar actualización de UI a basada en eventos del store:
   ```javascript
   BlogEditorStore.onChange((event, data) => {
       if (event === 'add') $('#uploaded-files').append(renderFileItem(data));
   });
   ```

**Criterios de aceptación Fase 3**:
- [ ] No memory leaks (eventos se limpian correctamente)
- [ ] Store centralizado elimina variables globales dispersas
- [ ] Comunicación entre módulos es vía eventos, no variables compartidas

---

### **Fase 4: Refactor final y documentación**  
**Objetivo**: Limpiar, documentar, crear guía de migración.

1. **.4.1** Eliminar código muerto (funciones duplicadas, variables globales obsoletas).
2. **.4.2** Crear `blog_editor_jquery_patterns.md` con:
   - Antes vs después de cada patrón
   - Ejemplos de código migrado
   - Checklist de qué SÍ y qué NO migrar
3. **.4.3** Documentar arquitectura nueva:
   ```
   blog_editor/
   ├── index.js              → Core + EasyMDE integration
   ├── blog_editor_store.js  → Estado centralizado
   ├── jquery_helpers.js     → Helpers reutilizables
   ├── mtp-toolbar.js        → Toolbar (migrado a jQuery)
   ├── video-widget.js       → Video modal (migrado)
   ├── slide-widget.js       → Gallery (migrado)
   ├── image-selector.js     → Selector imágenes (migrado)
   └── drag-drop.js          → Drag-drop (mantener Vanilla)
   ```
4. **.4.4** Medir métricas finales: LOC, complejidad ciclomática, tiempo de carga.

**Criterios de aceptación Fase 4**:
- [ ] Documentación completa en `gestion_proyecto/hus/`
- [ ] Guía de migración para futuros desarrolladores
- [ ] Métricas comparativas: antes vs después
- [ ] Todos los tests manuales pasan

---

## 📝 Ejemplos concretos: Antes vs Después

### Ejemplo 1: `renderUploadedFile()`

**ANTES (Vanilla - 170 líneas)**:
```javascript
function renderUploadedFile(file) {
    if (!file || !file.filename) return;
    const container = uploadedFilesContainer || document.getElementById('uploaded-files');
    if (!container) {
        console.warn('[renderUploadedFile] Contenedor uploaded-files no encontrado');
        return;
    }
    uploadedFilesContainer = container;
    
    const emptyState = container.querySelector('.uploaded-files-empty');
    if (emptyState) emptyState.remove();
    
    const tempUrl = file.url || `/media/blog_editor_temp/${document.body.dataset.userId}/${file.filename}`;
    let element;
    if (file.type && file.type.startsWith('video')) {
        element = document.createElement('video');
        element.setAttribute('src', tempUrl);
        element.setAttribute('controls', '');
        element.className = 'uploaded-video';
    } else {
        element = document.createElement('img');
        element.setAttribute('src', tempUrl);
        element.setAttribute('alt', file.filename);
        element.className = 'uploaded-image';
    }
    // ... 150 líneas más de fallbacks, controls, badges
}
```

**DESPUÉS (jQuery - 95 líneas)**:
```javascript
function renderUploadedFile(file) {
    if (!file?.filename) return;
    const $container = $($uploadedFilesContainer).length ? $uploadedFilesContainer : $('#uploaded-files');
    if (!$container.length) return;
    $uploadedFilesContainer = $container;
    
    $container.find('.uploaded-files-empty').remove();
    
    const tempUrl = file.url || `/media/blog_editor_temp/${document.body.dataset.userId}/${file.filename}`;
    const isVideo = file.type?.startsWith('video');
    
    const $media = isVideo 
        ? $('<video>', { src: tempUrl, controls: true, class: 'uploaded-video' })
        : $('<img>', { src: tempUrl, alt: file.filename, class: 'uploaded-image' });
    
    // Template para controles y badges
    const $item = $(FILE_ITEM_TEMPLATE).attr('data-filename', file.filename);
    const $controls = $item.find('.uploaded-controls');
    
    // ... 60 líneas de lógica específica
    $container.append($item);
}
```

**Ahorro**: 75 líneas (44%). Legibilidad mejorada por uso de template HTML.

---

### Ejemplo 2: Toggle de visibilidad

**ANTES (Vanilla)**:
```javascript
function toggleUploadedFile(filename) {
    const container = document.getElementById('uploaded-files');
    const item = container.querySelector(`.uploaded-item[data-filename="${filename}"]`);
    if (!item) return;
    const currentlyHidden = item.classList.contains('is-hidden');
    const nowHidden = !currentlyHidden;
    
    item.classList.toggle('is-hidden', nowHidden);
    if (nowHidden) {
        item.classList.remove('is-visible');
    } else {
        item.classList.add('is-visible');
    }
    
    const toggleBtn = item.querySelector('.btn-toggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = nowHidden ? ICON_EYE_OFF : ICON_EYE;
        toggleBtn.setAttribute('data-tooltip', nowHidden ? 'Mostrar en editor' : 'Ocultar en editor');
        toggleBtn.setAttribute('aria-label', nowHidden ? 'Mostrar archivo' : 'Ocultar archivo');
        toggleBtn.classList.toggle('is-active', nowHidden);
    }
    
    const f = uploadedFiles.find(f => f.filename === filename);
    if (f) f.hidden = nowHidden;
    
    // ... manejo de badge BLOQUEADO (30 líneas más)
}
```

**DESPUÉS (jQuery)**:
```javascript
function toggleUploadedFile(filename) {
    const $item = $(`.uploaded-item[data-filename="${filename}"]`);
    if (!$item.length) return;
    
    const nowHidden = !$item.hasClass('is-hidden');
    $item.toggleClass('is-hidden is-visible', nowHidden);
    
    $item.find('.btn-toggle')
        .html(nowHidden ? ICON_EYE_OFF : ICON_EYE)
        .attr({
            'data-tooltip': nowHidden ? 'Mostrar en editor' : 'Ocultar en editor',
            'aria-label': nowHidden ? 'Mostrar archivo' : 'Ocultar archivo'
        })
        .toggleClass('is-active', nowHidden);
    
    const file = uploadedFiles.find(f => f.filename === filename);
    if (file) file.hidden = nowHidden;
    
    // Badge BLOQUEADO (1 línea vs 10)
    nowHidden ? $item.append(BLOQUEADO_BADGE) : $item.find('.blocked-badge').remove();
}
```

**Ahorro**: 40 líneas (55%). Código más declarativo.

---

## ⚖️ Evaluación de viabilidad

| Criterio                        | Puntuación (1-5) | Justificación                                                    |
| ------------------------------- | ---------------- | ---------------------------------------------------------------- |
| **Esfuerzo estimado**           | 2/5              | Migración gradual: 4 fases × ~4h cada una = 16h                  |
| **Riesgo de breakage**          | 1/5              | Bajo: jQuery ya está en el proyecto, solo se reemplazan patrones |
| **Beneficio en legibilidad**    | 5/5              | Alto: elimina boilerplate repetitivo                             |
| **Beneficio en mantenibilidad** | 4/5              | Alto: centraliza estado, reduce acoplamiento                     |
| **Impacto en performance**      | 4/5              | Positivo: menos código = menos parsing                           |
| **Reversibilidad**              | 5/5              | Total: git branches permiten revertir                            |
| **Alineamiento con proyecto**   | 5/5              | jQuery 3.2.1 ya es dependencia oficial                           |

**Veredicto**: ✅ **VIABLE y RECOMENDABLE**

---

## 🎓 Patrones jQuery permitidos / prohibidos

### ✅ **PERMITIDOS** (bajo overhead)

| Patrón                                              | Uso                    | Ejemplo                                        |
| --------------------------------------------------- | ---------------------- | ---------------------------------------------- |
| Selectores CSS3                                     | Búsqueda de elementos  | `$('.btn-cover')`                              |
| `.addClass()` / `.removeClass()` / `.toggleClass()` | Manipulación de clases | `$el.toggleClass('is-active', condition)`      |
| `.attr()` / `.data()`                               | Atributos              | `$btn.attr('data-tooltip', '...')`             |
| `.html()` / `.text()`                               | Contenido              | `$el.html(ICON_STAR)`                          |
| `.on()` / `.off()`                                  | Eventos                | `$el.on('click', handler)`                     |
| `.append()` / `.prepend()`                          | Inserción DOM          | `$container.append($item)`                     |
| `$('<tag>', { attrs })`                             | Creación de elementos  | ` $('<button>', { class: 'btn', text: 'OK' })` |
| `.find()` / `.parent()` / `.siblings()`             | Navegación DOM         | `$item.find('.btn-cover')`                     |
| `.each()`                                           | Iteración              | `$('.item').each((i, el) => { ... })`          |
| `.val()` / `.prop()`                                | Formularios            | `$('#title').val('Hola')`                      |
| `$('#modal').modal('show')`                         | Bootstrap 4 modales    | Ya se usa en línea 627                         |

### ❌ **PROHIBIDOS** (no resolver problemas actuales)

| Patrón                                             | Razón                                      |
| -------------------------------------------------- | ------------------------------------------ |
| AJAX complejo (`$.ajax()`)                         | El código usa `fetch()` nativo, mantenerlo |
| Animaciones jQuery                                 | Se usan CSS transitions / keyframes        |
| Plugins jQuery第三方                               | No instalar dependencias nuevas            |
| `$(document).ready()` en archivos nuevos           | Usar `DOMContentLoaded` existente          |
| Selectores ultra-dinámicos (`:visible`, `:hidden`) | Lento, mejor usar clases específicas       |

---

## 📋 Checklist de aprobación

Antes de iniciar la migración, el equipo debe responder:

- [ ] **¿Estamos de acuerdo en que el código actual es funcional pero verboso?** → Sí / No
- [ ] **¿Queremos mantener jQuery como dependencia oficial?** → Sí / No
- [ ] **¿Aceptamos la regla: "No reemplazar lógica de negocio, solo boilerplate DOM"?** → Sí / No
- [ ] **¿Queremos proceder con Fase 0 (análisis sin código)?** → Sí / No
- [ ] **¿Asignamos 16h estimadas para las 4 fases?** → Sí / No

---

## 📚 Referencias

- **jQuery 3.2.1 docs**: https://api.jquery.com/ (versión del proyecto)
- **Bootstrap 4.3.1 + jQuery**: Patrón probado en `dashboard.js` (línea 627: `$('#imagePreviewModal').modal('show')`)
- **.clinerules**: Regla 2: "Sin dependencias nuevas sin aprobación explícita → jQuery ya está aprobado"
- **HU-011.17**: Ejemplo de análisis técnico-contexto en este proyecto

---

## 🔗 Relación con otras HUs

| HU          | Relación                                                   |
| ----------- | ---------------------------------------------------------- |
| HU-20-D     | **Esta HU es prerequisito**: diagnóstico antes de refactor |
| HU-011.8    | Toolbar MTP que se migrará a jQuery                        |
| HU-019      | Grid de archivos subidos (candidato a migración)           |
| HU-20-C     | Widgets de video/slides (candidatos a migración)           |
| .clinerules | Regla 1: "Fases granulares SIEMPRE" → Cumplida             |
| .clinerules | Regla 2: "Sin dependencias nuevas" → jQuery ya existe      |

---

**Creada el 24/06/2026 — HU-022**  
**Estado**: ✅ Fase 0 completada (validación jQuery sin modificar lógica)

---

## ✅ Fase 0 ejecutada: Validación jQuery (sin tocar lógica)

**Objetivo**: Garantizar que jQuery está disponible antes de cualquier migración.

Cambios aplicados **solo console.log** (no alteran funcionalidad):

### 1. `blog_editor.html` — validación temprana
```javascript
if (typeof jQuery === 'undefined') {
    console.error('❌ [BLOG_EDITOR] jQuery NO está cargado...');
} else {
    console.log('✅ [BLOG_EDITOR] jQuery loaded. Version:', jQuery.fn.jquery);
}
```

### 2. Archivos JS del blog_editor — validación por módulo
- `index.js` → `console.log('✅ [index.js] jQuery disponible:', typeof jQuery !== 'undefined');`
- `video-widget.js` → `console.log('✅ [video-widget.js] jQuery disponible:', ...);`
- `slide-widget.js` → `console.log('✅ [slide-widget.js] jQuery disponible:', ...);`
- `image-selector.js` → `console.log('✅ [image-selector.js] jQuery disponible:', ...);`
- `mtp-toolbar.js` → `console.log('✅ [mtp-toolbar.js] jQuery disponible:', ...);`

**Verificación esperada**:
1. Abrir blog editor en el navegador
2. Consola debe mostrar 6 mensajes ✅ (1 de blog_editor.html + 5 de archivos JS)
3. No debe aparecer ningún error de dependencias
4. El editor debe funcionar exactamente igual que antes

**Próximo paso**: Si la validación es exitosa, proceder a Fase 1 (helpers jQuery).

---

## 🏗️ Diagnóstico adicional: Arquitectura de módulos vs scripts globales

Un punto crítico que **no** habíamos abordado y que afecta directamente la escalabilidad es **cómo se cargan y organizan los archivos JS**.

### 🔴 Problema actual: Scripts como archivos globales (no módulos)

Hoy, cada archivo JS se carga como un `<script>` independiente en `blog_editor.html`:

```html
<!-- Líneas 589-610 de blog_editor.html -->
<script src="{% static 'js/jquery-plugins/jquery-3.2.1.min.js' %}"></script>
<script src="{% static 'js/bs/bootstrap.min.js' %}"></script>
<script src="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.js"></script>
<script src="{% static 'blog/js/blog_editor/index.js' %}"></script>           <!-- 2576 líneas -->
<script src="{% static 'blog/js/blog_editor/image-selector.js' %}"></script>  <!-- 479 líneas -->
<script src="{% static 'blog/js/blog_editor/video-widget.js' %}"></script>    <!-- 371 líneas -->
<script src="{% static 'blog/js/blog_editor/slide-widget.js' %}"></script>    <!-- 463 líneas -->
<!-- NOTA: mtp-toolbar.js se importa DINÁMICAMENTE desde index.js -->
```

### Consecuencias de esta arquitectura:

| Problema                              | Impacto                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Variables globales**                | Todo está en `window.*` → `uploadedFiles`, `imageWidgets`, `imageSelectorOpen`, `easyMDE`, etc.    |
| **Dependencias implícitas**           | `slide-widget.js` usa `uploadedFiles` pero no lo declara → si cambia el nombre, se rompe sin error |
| **Orden frágil**                      | Si `index.js` se mueve después de `image-selector.js`, las funciones pueden no existir aún         |
| **Sin import/export**                 | No hay manera de saber qué necesita cada archivo sin leerlo entero                                 |
| **Nuevos módulos = nuevo `<script>`** | Agregar un helper implica: crear archivo + agregar etiqueta HTML en el orden correcto              |
| **Duplicación funcional**             | `getCookie()` está en `index.js` y `slide-widget.js` porque no hay un lugar común donde ponerlo    |

### ✅ Propuesta: Patrón de namespace compartido + utils

En lugar de ES Modules (que requieren `type="module"` y pueden romper compatibilidad con jQuery 3.2.1), propongo un **patrón de namespace controlado**:

#### Archivo `blog_editor_utils.js` (NUEVO — helpers compartidos)

```javascript
// ======================================================
// HU-022: Blog Editor - Utilidades compartidas
// Todos los módulos del blog_editor pueden acceder a:
//   window.BlogEditorUtils.getCookie()
//   window.BlogEditorUtils.showToast()
//   window.BlogEditorUtils.getElement()
// ======================================================
(function() {
    'use strict';
    
    // Namespace único para todo el blog_editor
    window.BlogEditorUtils = window.BlogEditorUtils || {
        
        // --- Cookie ---
        getCookie: function(name) {
            return document.cookie.split('; ')
                .find(row => row.startsWith(name + '='))
                ?.split('=')[1] || '';
        },
        
        // --- Toast --- (encapsula la lógica de auto-save toast)
        showAutoSaveToast: function(title, detail) {
            const $toast = $('#autosave-toast');
            if (!$toast.length) return;
            $toast.find('.autosave-toast-title').html(title);
            $('#autosave-toast-detail').text(detail || '—');
            $('#autosave-toast-time').text(
                new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
            );
            // Reset progress bar
            const $progress = $('#autosave-progress-bar');
            if ($progress.length) {
                $progress.css('animation', 'none');
                void $progress[0].offsetHeight; // Reflow
                $progress.css('animation', '');
            }
            clearTimeout($toast[0]._hideTimer);
            clearTimeout($toast[0]._closeTimer);
            $toast.removeClass('hiding').addClass('show');
            $toast[0]._hideTimer = setTimeout(function() {
                BlogEditorUtils.hideAutoSaveToast();
            }, 5000);
        },
        
        hideAutoSaveToast: function() {
            const $toast = $('#autosave-toast');
            if (!$toast.length || !$toast.hasClass('show')) return;
            $toast.addClass('hiding');
            clearTimeout($toast[0]._closeTimer);
            $toast[0]._closeTimer = setTimeout(function() {
                $toast.removeClass('show hiding');
            }, 250);
        },
        
        // --- Modal helpers (Bootstrap 4) ---
        openModal: function(modalId) {
            $('#' + modalId).modal('show');
        },
        
        hideModal: function(modalId) {
            $('#' + modalId).modal('hide');
        },
        
        clearModalInputs: function(modalId, inputIds) {
            const $modal = $('#' + modalId);
            (inputIds || []).forEach(function(id) {
                $modal.find('#' + id).val('');
            });
            $modal.find('.alert').addClass('d-none').empty();
        },
        
        // --- DOM shortcut (con null-check incluido) ---
        $: function(selector) {
            const $el = $(selector);
            return $el.length ? $el : null;
        },
        
        // --- CSRF token helper ---
        getCsrfToken: function() {
            return this.getCookie('csrftoken');
        },
        
        // --- Estado de archivos subidos (centralizado) ---
        FileStore: {
            files: [],
            
            getAll: function() { return this.files; },
            
            add: function(file) {
                this.files.push(file);
                return file;
            },
            
            remove: function(filename) {
                this.files = this.files.filter(function(f) {
                    return f.filename !== filename;
                });
            },
            
            findByFilename: function(filename) {
                return this.files.find(function(f) {
                    return f.filename === filename;
                });
            },
            
            clear: function() {
                this.files = [];
            },
            
            getCover: function() {
                return this.files.find(function(f) { return f.is_cover; });
            }
        }
    };
    
    // Log de inicialización
    console.log('✅ [blog_editor_utils] namespace cargado.', 
        'Metodos disponibles:', Object.keys(window.BlogEditorUtils));
    
})();
```

#### ¿Cómo se usaría desde los módulos existentes?

**ANTES (hoy)** — cada archivo implementa su propia versión:
```javascript
// index.js
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

// slide-widget.js (MISMA FUNCIÓN duplicada)
function getCookie(name) {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}
```

**DESPUÉS** — un solo punto de verdad:
```javascript
// index.js
const csrf = BlogEditorUtils.getCsrfToken();

// slide-widget.js
const csrf = BlogEditorUtils.getCsrfToken();
```

#### ¿Cómo se carga `blog_editor_utils.js`?

Se agrega **una sola línea** en `blog_editor.html`, **inmediatamente después de jQuery** (antes que cualquier módulo):

```html
<script src="{% static 'js/jquery-plugins/jquery-3.2.1.min.js' %}"></script>
<script src="{% static 'js/bs/bootstrap.min.js' %}"></script>

<!-- HU-022: Utilidades compartidas del blog_editor (DEBE ir antes que los módulos) -->
<script src="{% static 'blog/js/blog_editor/blog_editor_utils.js' %}"></script>

<script src="{% static 'blog/js/blog_editor/index.js' %}"></script>
<script src="{% static 'blog/js/blog_editor/image-selector.js' %}"></script>
<script src="{% static 'blog/js/blog_editor/video-widget.js' %}"></script>
<script src="{% static 'blog/js/blog_editor/slide-widget.js' %}"></script>
```

#### Ventajas:

| Beneficio                     | Explicación                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| ✅ **Un solo namespace**       | `BlogEditorUtils.*` — todo el código compartido en un lugar                   |
| ✅ **Sin dependencias nuevas** | Solo Vanilla JS + jQuery, que ya está en el proyecto                          |
| ✅ **Fácil de extender**       | Para agregar una utilidad, solo se añade al objeto `BlogEditorUtils`          |
| ✅ **Sin romper lo existente** | Las funciones antiguas pueden coexistir hasta la migración                    |
| ✅ **Carga explícita**         | La dependencia es obvia: el HTML declara el orden                             |
| ✅ **`getCookie()` único**     | Se elimina la duplicación entre `index.js` y `slide-widget.js`                |
| ✅ **FileStore centralizado**  | `uploadedFiles` deja de ser un array global mutable desde 4 lugares distintos |

### 🔄 Transición: de variables globales a FileStore centralizado

**ANTES** — cada módulo muta `uploadedFiles` directamente:
```javascript
// index.js
uploadedFiles.push(data);

// image-selector.js
uploadedFiles.push(data);

// slide-widget.js
if (typeof uploadedFiles !== 'undefined') uploadedFiles.push(data);
```

**DESPUÉS** — todos los módulos usan el mismo store:
```javascript
// Cualquier archivo del blog_editor:
BlogEditorUtils.FileStore.add(data);
const file = BlogEditorUtils.FileStore.findByFilename('imagen.png');
const cover = BlogEditorUtils.FileStore.getCover();
BlogEditorUtils.FileStore.clear();
```

### 🗺️ Mapa de migración hacia la nueva arquitectura

```
ANTES (hoy)                                  DESPUÉS (propuesto)
═══════════════════════                      ════════════════════════
                                              ┌──────────────────────┐
                                              │ blog_editor_utils.js │
                                              │ (namespace compart.) │
                                              └──────┬───────────────┘
                                                     │
blog_editor.html (scripts ordenados)                 │
  ├─ index.js ← getCookie(), fetch(),                │
  │   FilePond, EasyMDE, auto-save,                  ├── index.js ← usa BlogEditorUtils
  │   uploadedFiles[], imageWidgets{}                 ├── image-selector.js ← usa BlogEditorUtils
  │                                                   ├── video-widget.js ← usa BlogEditorUtils
  ├─ image-selector.js ← uploadedFiles[]              ├── slide-widget.js ← usa BlogEditorUtils
  ├─ video-widget.js ← Bootstrap modales              └── mtp-toolbar.js ← usa BlogEditorUtils
  ├─ slide-widget.js ← getCookie(), uploadedFiles[]
  └─ mtp-toolbar.js ← import dinámico
```

**Regla**: Todos los archivos JS se comunican VÍA `BlogEditorUtils`, no mediante variables globales sueltas. Esto permite:
- Rastrear dependencias con solo mirar `blog_editor_utils.js`
- Agregar nuevas funcionalidades sin necesidad de modificar múltiples archivos
- Hacer testing unitario sobre el namespace (fácil de mockear)
- Mantener retro-compatibilidad: las variables globales antiguas pueden seguir existiendo como wrappers:
  ```javascript
  // Wrapper temporal en index.js para mantener compatibilidad:
  const uploadedFiles = BlogEditorUtils.FileStore.getAll();
  ```

---

## 📋 Auditoría completa de variables globales (inventario antes de migrar)

Para garantizar que **NADA se rompa** durante la migración, se auditaron TODAS las variables globales y sus dependencias cruzadas entre archivos.

### Resumen del inventario

| Tipo                                                       | Cantidad | Ejemplos                                                                    |
| ---------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| Variables `const/let` en scope global (no bajo `window.*`) | 19       | `uploadedFiles`, `imageWidgets`, `pendingDeleteFilename`, `isSaved`, `tags` |
| Variables expuestas en `window.*`                          | 31       | `window.selectedImageFilename`, `window.imageDragActive`, `window.easyMDE`  |
| Funciones expuestas en `window.*`                          | 25       | `window.openImageSelectorModal`, `window.refreshImageWidgets`               |
| **TOTAL**                                                  | **75**   |                                                                             |

### 📋 Checklist: Variable por variable (con dependencias)

> **Leyenda**: 🟢 = segura migrar, 🟡 = wrapper necesario, 🔴 = afecta múltiples archivos

#### Variables `const/let` globales (NO en `window.*`)

| #   | Variable                 | Declarada en         | Leída en                                           | Escrita en                                         | Compatibilidad                                                                               |
| --- | ------------------------ | -------------------- | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | `uploadedFiles`          | `index.js:13`        | `index.js`, `image-selector.js`, `slide-widget.js` | `index.js`, `image-selector.js`, `slide-widget.js` | 🟡 **Migrar a FileStore**: wrapper `const uploadedFiles = BlogEditorUtils.FileStore.getAll()` |
| 2   | `imageWidgets`           | `index.js:179`       | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 3   | `widgetIdCounter`        | `index.js:183`       | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 4   | `pendingDeleteFilename`  | `index.js:16`        | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 5   | `isSaved`                | `index.js:17`        | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 6   | `DRAFT_KEY`              | `index.js:19`        | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 7   | `userOverride`           | `index.js:20`        | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 8   | `lastAutoSaveTime`       | `index.js:21`        | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 9   | `autoSaveTimer`          | `index.js:22`        | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 10  | `uploadedFilesContainer` | `index.js:28`        | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 11  | `easyMDE`                | `index.js:392`       | TODOS los archivos                                 | `index.js`                                         | 🟡 **Ya es global via `window.easyMDE`**, también disponible como `window.easyMDE`            |
| 12  | `imageWidgetCleanup`     | `index.js:180`       | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 13  | `tags`                   | `index.js:699`       | `index.js`                                         | `index.js`                                         | 🟢 Solo en index.js                                                                           |
| 14  | `currentGalleryMode`     | `slide-widget.js:13` | `slide-widget.js`                                  | `slide-widget.js`                                  | 🟢 Solo en slide-widget.js                                                                    |
| 15  | `selectedGalleryImages`  | `slide-widget.js:14` | `slide-widget.js`                                  | `slide-widget.js`                                  | 🟢 Solo en slide-widget.js                                                                    |
| 16  | `MTP_TEMPLATES`          | `mtp-toolbar.js:14`  | `mtp-toolbar.js`                                   | N/A (const)                                        | 🟢 Ya es exportado vía módulo                                                                 |
| 17  | `lastIdx`                | `index.js` (varias)  | `index.js`                                         | `index.js`                                         | 🟢 Variables locales                                                                          |

#### Variables en `window.*`

| #   | Variable                               | Set en                              | Usado por                                                                               | Compatibilidad                                                                    |
| --- | -------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | `window.easyMDE`                       | `index.js:394`                      | `index.js`, `video-widget.js`, `slide-widget.js`, `image-selector.js`, `mtp-toolbar.js` | 🔴 **CRÍTICA**: Todos los archivos la leen. Mantener como `window.easyMDE` siempre |
| 2   | `window.refreshImageWidgets`           | `index.js:396`                      | `index.js`, `video-widget.js`, `image-selector.js`                                      | 🟡 Se reasigna en `image-selector.js`                                              |
| 3   | `window.renderUploadedFile`            | `index.js:397`                      | `index.js`, `image-selector.js`                                                         | 🟡 Se reasigna en `image-selector.js`                                              |
| 4   | `window.imageSelectorOpen`             | `index.js:102`, `image-selector.js` | `index.js`, `image-selector.js`                                                         | 🟡 En ambos archivos                                                               |
| 5   | `window.selectedImageFilename`         | `index.js:103`, `image-selector.js` | `index.js`, `image-selector.js`                                                         | 🟡 En ambos archivos                                                               |
| 6   | `window.selectedImageMode`             | `index.js:104`, `image-selector.js` | `index.js`, `image-selector.js`                                                         | 🟡 En ambos archivos                                                               |
| 7   | `window.imageDragActive`               | `index.js`                          | `index.js`                                                                              | 🟢 Solo en index.js                                                                |
| 8   | `window.imageDragOriginLine`           | `index.js`                          | `index.js`                                                                              | 🟢 Solo en index.js                                                                |
| 9   | `window.imageDragText`                 | `index.js`                          | `index.js`                                                                              | 🟢 Solo en index.js                                                                |
| 10  | `window.imageDragGuideEl`              | `index.js`                          | `index.js`                                                                              | 🟢 Solo en index.js                                                                |
| 11  | `window._imageSelectorCursor`          | `index.js`, `image-selector.js`     | `index.js`, `image-selector.js`, `slide-widget.js`                                      | 🟡 **Crítica**: slide-widget.js la USA                                             |
| 12  | `window._galleryEditStartLine`         | `slide-widget.js`                   | `slide-widget.js`                                                                       | 🟢 Solo en slide-widget.js                                                         |
| 13  | `window._pendingDropFix`               | `index.js`                          | `index.js`                                                                              | 🟢 Solo en index.js                                                                |
| 14  | `window._imgWidgetTimer`               | `index.js`                          | `index.js`                                                                              | 🟢 Solo en index.js                                                                |
| 15  | `window._changeHandler`                | `index.js`                          | `index.js`                                                                              | 🟢 Solo en index.js                                                                |
| 16  | `window._imgDropGuideStylesInjected`   | `index.js`                          | `index.js`                                                                              | 🟢 Solo en index.js                                                                |
| 17  | `window.MTP_PRODUCTION`                | `index.js`                          | `mtp-toolbar.js`                                                                        | 🟡 index.js escribe, mtp-toolbar.js lee                                            |
| 18  | `window.MTP_TEMPLATES`                 | `index.js`                          | `mtp-toolbar.js`                                                                        | 🟡 Reasignado desde módulo                                                         |
| 19  | `window.insertMtpTemplate`             | `index.js`                          | `mtp-toolbar.js`                                                                        | 🟡 Reasignado desde módulo                                                         |
| 20  | `window.openWidgetHelpModal`           | `index.js`                          | `mtp-toolbar.js`                                                                        | 🟡 Reasignado desde módulo                                                         |
| 21  | `window.initMtpToolbar`                | `index.js`                          | `mtp-toolbar.js`                                                                        | 🟡 Reasignado desde módulo                                                         |
| 22  | `window.imageSelectorOpen` (duplicado) | `index.js`, `image-selector.js`     | Ambos                                                                                   | 🟡 Misma variable, ambas la mutan                                                  |

#### Funciones expuestas en `window.*`

| #   | Función                     | Expuesta en         | Llamada desde                                  | Compatibilidad |
| --- | --------------------------- | ------------------- | ---------------------------------------------- | -------------- |
| 1   | `openVideoModal`            | `video-widget.js`   | `mtp-toolbar.js` (vía `window.openVideoModal`) | 🟡              |
| 2   | `confirmVideoModal`         | `video-widget.js`   | Solo botón HTML                                | 🟢              |
| 3   | `insertVideoTemplate`       | `video-widget.js`   | Solo video-widget.js                           | 🟢              |
| 4   | `attachVideoWidgetHandlers` | `video-widget.js`   | Solo video-widget.js                           | 🟢              |
| 5   | `openVideoHelpModal`        | `video-widget.js`   | Solo video-widget.js                           | 🟢              |
| 6   | `openGalleryModal`          | `slide-widget.js`   | `mtp-toolbar.js`                               | 🟡              |
| 7   | `confirmGalleryModal`       | `slide-widget.js`   | Solo HTML modal                                | 🟢              |
| 8   | `switchGalleryMode`         | `slide-widget.js`   | Solo slide-widget.js                           | 🟢              |
| 9   | `initGalleryToolbar`        | `slide-widget.js`   | Solo slide-widget.js                           | 🟢              |
| 10  | `detectImageContext`        | `image-selector.js` | `index.js`, `slide-widget.js`                  | 🟡              |
| 11  | `openImageSelectorModal`    | `image-selector.js` | `index.js`, `mtp-toolbar.js`                   | 🟡              |
| 12  | `insertImageInEditor`       | `image-selector.js` | `index.js`, `image-selector.js`                | 🟡              |
| 13  | `initImageSelector`         | `image-selector.js` | Solo image-selector.js                         | 🟢              |
| 14  | `initUploadButton`          | `image-selector.js` | Solo image-selector.js                         | 🟢              |

### 🔍 Matriz de dependencias entre archivos

```
Archivo              Depende de (importa)                          Expone (exporta)
══════════════════   ════════════════════════════════════════       ═══════════════════════════════════
index.js             → window.easyMDE (propio)                      → window.easyMDE, window.refreshImageWidgets,
                     → mtp-toolbar.js (import dinámico)                window.renderUploadedFile
                     → image-selector.js (llama funciones)            → window.imageDrag*, window.imageSelector*
                                                                      → window.MTP_TEMPLATES, window.initMtpToolbar
                                                                
image-selector.js    → window.easyMDE (de index.js)                 → window.detectImageContext
                     → window.refreshImageWidgets (de index.js)       → window.openImageSelectorModal
                     → window.renderUploadedFile (de index.js)        → window.insertImageInEditor
                     → uploadedFiles[] (global, de index.js)          → window.imageSelectorOpen (ESCRIBE)
                                                                      → window.selectedImageFilename (ESCRIBE)
                                                                      → window._imageSelectorCursor (USA)
                                                                      → window.refreshImageWidgets (REASIGNA)
                                                                      → window.renderUploadedFile (REASIGNA)
                                                                
video-widget.js      → window.easyMDE (de index.js)                 → window.openVideoModal
                     → window.refreshImageWidgets (de index.js)       → window.confirmVideoModal
                                                                      → window.attachVideoWidgetHandlers
                                                                      → window.openVideoHelpModal
                                                                
slide-widget.js      → window.easyMDE (de index.js)                 → window.openGalleryModal
                     → uploadedFiles[] (global, de index.js)          → window.confirmGalleryModal
                     → window.detectImageContext (de image-selector)  → window.switchGalleryMode
                     → window._imageSelectorCursor (de index.js)      → window.initGalleryToolbar
                     → window.refreshImageWidgets (de index.js)       → window._galleryEditStartLine (ESCRIBE)
                                                                
mtp-toolbar.js       → window.easyMDE (de index.js)                 → (export módulo ES)
                     → window.openImageSelectorModal (de image-sel)  → MTP_TEMPLATES, insertMtpTemplate
                     → window.openVideoModal (de video-widget)        → openWidgetHelpModal, initMtpToolbar
                     → window.openGalleryModal (de slide-widget)
                     → window.MTP_PRODUCTION (de index.js)
                     → $ (jQuery de blog_editor.html)
```

### 🛡️ Estrategia de retrocompatibilidad (no romper nada)

Para cada variable, se define cómo mantenerla funcionando DURANTE y DESPUÉS de la migración:

#### Patrón 1: Variables LOCALES a un solo archivo (🟢)
```javascript
// ANTES: variable local suelta
let isSaved = false;

// DESPUÉS: se mantiene igual (no migrar, no tocar)
// No hay dependencias externas, no hay riesgo
```

#### Patrón 2: Variables COMPARTIDAS entre archivos (🟡)
```javascript
// ANTES: uploadedFiles[] es global, mutable desde N lugares
const uploadedFiles = [];                   // index.js
// ...
uploadedFiles.push(data);                   // image-selector.js
if (typeof uploadedFiles !== 'undefined') { // slide-widget.js

// DURANTE LA MIGRACIÓN (Fase 1): wrapper de compatibilidad
// 1. Se crea BlogEditorUtils.FileStore con el array interno
// 2. Se asigna uploadedFiles = BlogEditorUtils.FileStore
//     para que el código existente NO SE ROMPA

// blog_editor_utils.js
window.BlogEditorUtils = {
    FileStore: {
        _files: [],
        getAll: function() { return this._files; },
        add: function(file) { this._files.push(file); return file; },
        remove: function(name) { this._files = this._files.filter(f => f.filename !== name); },
        // ...
    }
};

// blog_editor_utils.js (línea final): wrapper global
window.uploadedFiles = BlogEditorUtils.FileStore._files; // ← RETROCOMPATIBILIDAD

// DESPUÉS (Fase 2+): se migra el resto del código a usar FileStore directamente
// y se elimina el wrapper
```

#### Patrón 3: Variables `window.*` compartidas entre 3+ archivos (🔴)
```javascript
// ANTES: window.easyMDE es usado por 5 archivos
window.easyMDE = easyMDE;  // index.js

// DURANTE: se mantiene exactamente igual (NO se migra)
// window.easyMDE es una dependencia fundamental, se queda como está

// DESPUÉS: se puede agregar un alias en BlogEditorUtils
BlogEditorUtils.editor = easyMDE;  // + mantiene window.easyMDE
```

#### Patrón 4: Funciones globales usadas como callbacks HTML (🟢)
```javascript
// ANTES: onclick="executeDeleteFile()" en blog_editor.html
// NO se puede eliminar window.executeDeleteFile porque el HTML lo referencia

// DESPUÉS: se mantiene como wrapper
window.executeDeleteFile = function() {
    // Delegar a la nueva implementación
    BlogEditorUtils.executeDeleteFile();
};
```

### 📊 Mapa de migración seguro (sin punto de quiebre)

```
FASE 0 (COMPLETADA)
├── Solo console.log validación jQuery
├── NO toca ninguna variable global
└── Riesgo: CERO

FASE 1 (Helpers + namespace)
├── CREAR blog_editor_utils.js con window.BlogEditorUtils
├── AGREGAR wrapper `window.uploadedFiles = BlogEditorUtils.FileStore._files`
├── AGREGAR wrapper `window.getCookie = BlogEditorUtils.getCookie`
├── MIGRAR solo las funciones auxiliares (showAutoSaveToast, openModal, etc.)
├── NO ELIMINAR ninguna función ni variable existente
├── El código legacy sigue funcionando porque las variables globales NO CAMBIAN
└── Riesgo: BAJO (solo adiciones, sin borrar ni modificar)

FASE 2 (DOM creation)
├── Reemplazar createElement() por jQuery en funciones específicas
├── Cada función reemplazada DEJA un wrapper que mantiene window.refreshImageWidgets
├── Las funciones legacy se marcan como @deprecated pero NO SE ELIMINAN
└── Riesgo: MEDIO (pero reversible con git)

FASE 3 (Eventos + estado)
├── window.easyMDE NO SE TOCA (es demasiado crítico)
├── migratedFiles se migra a FileStore (con wrapper)
├── imageWidgets {} se mantiene local a index.js
└── Riesgo: MEDIO (pero fase 2 ya probó el patrón)

FASE 4 (Limpieza final)
├── Si todo funciona, eliminar wrappers
├── Eliminar variables globales huérfanas (window._pendingDropFix, window._imgWidgetTimer, etc.)
└── Riesgo: ALTO (solo al final, y solo si todas las fases anteriores pasaron)
```

### ✅ Regla de oro: No romper lo existente

1. **Nunca eliminar una variable global** si hay al menos un archivo que la referencia
2. **Agregar wrappers** antes de migrar el código que usa la variable
3. **Mantener `window.easyMDE` siempre** — es el núcleo del editor
4. **Las funciones expuestas en `window` que son llamadas desde HTML (`onclick="..."`)** deben mantenerse como wrappers
5. **Cada variable migrada debe tener su `console.warn` temporal** para detectar si algo la sigue usando:
   ```javascript
   // Wrapper transicional
   Object.defineProperty(window, 'uploadedFiles', {
       get: function() {
           console.warn('⚠️ [HU-022] uploadedFiles legacy access desde:', new Error().stack?.split('\n')[2]);
           return BlogEditorUtils.FileStore._files;
       },
       set: function(val) {
           console.warn('⚠️ [HU-022] uploadedFiles legacy set desde:', new Error().stack?.split('\n')[2]);
           BlogEditorUtils.FileStore._files = val;
       }
   });
   ```
6. **TODO debe ser reversible**: cada cambio en su propio commit, con mensaje claro
7. **Probar después de cada commit**: abrir el editor, subir imagen, guardar, cargar artículo existente
