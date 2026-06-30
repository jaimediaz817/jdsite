# HU-022 Implementación: Refactorización de blog_detail.js a jQuery

> **Tipo**: Historia de usuario de implementación / refactor  
> **Estado**: 📋 Planificada  
> **Creada**: 29/06/2026  
> **Archivo objetivo**: `backend/blog/static/blog/js/blog_detail.js`  
> **Prerequisito**: HU-022_analisis_refactor_js_blog_editor_jquery.md (diagnóstico completado)  
> **Alcance**: Solo este archivo. No se modifican templates HTML, vistas ni modelos.

---

## 🎯 Objetivo de implementación

Reducir la complejidad y el tamaño de `blog_detail.js` migrando patrones DOM repetitivos a jQuery 3.2.1 (ya disponible), **sin alterar el comportamiento actual**.

**Metas medibles**:
- Reducir ≈ **25-30%** las líneas de código (de ~270 a ~190)  
- Eliminar templates HTML concatenados como strings (`+ '<div>' + ...`)  
- Eliminar funciones globales innecesarias (`window.prevImage`, `window.nextImage`)  
- Convertir eventos inline (`onclick="..."`) en event binding jQuery  
- Centralizar lógica repetida (toasts) sin introducir dependencias nuevas  
- Mantener 100% la funcionalidad: carrusel, zoom, galería, comentarios, progreso, back-to-top, compartir, modo lectura

---

## ⚠️ Reglas inquebrantables

1. **No modificar lógica de negocio**: el parseo de galería (`split('|||')`), el cálculo de porcentaje de scroll, la lógica AJAX de comentarios y el smooth scroll con RAF se mantienen intactos.  
2. **No romper lo existente**: cada fase debe ser testeable de forma aislada. Si algo falla, se revierte ese bloque y se ajusta antes de continuar.  
3. **No introducir dependencias**: solo jQuery 3.2.1 (ya cargado). No npm, no CDNs nuevos, no librerías.  
4. **Fases granulares**: ninguna fase supera los 15-20 minutos de trabajo efectivo.  
5. **Commit por fase**: cada fase completada se commitea con mensaje claro.  
6. **No mezclar refactor con features**: si aparece un bug o idea durante la migración, se anota para una HU aparte y se continúa con el plan actual.  
7. **Backup antes de empezar**: se crea `blog_detail_backup_antes_refactor.js` para restaurar en segundos.

---

## 🧱 Estado actual diagnosticado (resumen)

### Problemas a resolver

| # | Problema | Líneas aprox. | Impacto |
|---|---|---|---|
| 1 | Templates HTML concatenados (gallery popup, reply form) | ~85 | Alto: errores de sintaxis, XSS risk, mantenibilidad nula |
| 2 | Eventos inline (`onclick`) exponiendo funciones globales | ~30 | Alto: acoplamiento frágil, funciones globales innecesarias |
| 3 | Creación DOM con `createElement` + `appendChild` | ~40 | Medio: verbose, propenso a errores de className/style |
| 4 | Toasts repetidos (success/error) en 3 lugares | ~45 | Bajo: duplicación de lógica de presentación |
| 5 | `window.onscroll` global (sobrescribe otros handlers) | ~35 | Medio: riesgo de conflictos con otros scripts |
| 6 | `document.onkeydown` global en gallery | ~8 | Bajo: mismo riesgo de sobrescritura |

### Ahorro estimado total

**~126 líneas (≈50%)** concentradas en templates y eliminación de boilerplate DOM.

---

## 🗺️ Mapa de zonas a intervenir

```
blog_detail.js  (270 líneas)
├── Carrusel               → ✳ No se toca (lógica simple, funcional)
├── Back to top            → ✳ No se toca (RAF + CSS, funcional)
├── Gallery popup          → 🔄 Fase 2 (template + eventos + DOM)
├── Progress bar           → 🔄 Fase 4 (scroll handler namespaced)
├── Image zoom             → ✳ No se toca (showModal nativo, funcional)
├── Share buttons          → ✳ No se toca (solo listeners simples)
├── Submit main comment    → 🔄 Fase 1 y 4 (toast helper + fetch intacto)
├── Reply form HTML        → 🔄 Fase 3 (template jQuery builder)
├── Submit reply           → 🔄 Fase 1 y 4 (toast helper + fetch intacto)
└── Reading mode (Alpine)  → ✳ No se toca (window.readingMode)
```

**Leyenda**:
- ✳ **No se toca**: funciona correctamente, bajo riesgo de mejora marginal.  
- 🔄 **Se migra**: alta duplicación, templates frágiles o eventos globales.

---

## 🚀 Fases de implementación

---

### Fase 1: Scaffolding + helper de toasts (bajo riesgo)  
**Duración estimada**: 10 minutos  
**Objetivo**: Sentar bases sin cambiar comportamiento visible.

#### Pasos

1. **1.1** Crear `blog_detail_backup_antes_refactor.js` copiando el archivo actual.  
2. **1.2** Agregar al inicio de `blog_detail.js` un `console.log` de validación jQuery:
   ```javascript
   console.log('[blog_detail] jQuery disponible:', typeof jQuery !== 'undefined');
   if (typeof jQuery !== 'undefined') {
       console.log('[blog_detail] jQuery version:', jQuery.fn.jquery);
   }
   ```
3. **1.3** Crear helper `showJDToast(heading, message, icon)` **antes** de cualquier función que lo use:
   ```javascript
   function showJDToast(heading, message, icon) {
       if (typeof $ !== 'undefined' && $.toast) {
           $.toast({
               heading: heading,
               text: message,
               icon: icon,
               position: 'top-right',
               hideAfter: 4500,
               stack: 4,
               bgColor: icon === 'success' ? '#7c3aed' : '#dc2626',
               loaderBg: icon === 'success' ? '#6366f1' : '#f87171'
           });
       } else {
           alert(message);
       }
   }
   ```
4. **1.4** Reemplazar en `submitMainCommentForm` los 2 bloques de toast (éxito y error) por llamadas a `showJDToast(...)`.  
5. **1.5** Reemplazar en `submitReplyForm` los 2 bloques de toast por llamadas a `showJDToast(...)`.  

#### Criterios de aceptación Fase 1

- [ ] Al cargar un blog post, la consola muestra `[blog_detail] jQuery disponible: true`  
- [ ] Los toasts de éxito y error se ven idénticos a antes  
- [ ] Si `$.toast` falla, el fallback a `alert()` sigue funcionando  
- [ ] No se modificaron rutas, URLs, lógica AJAX ni validaciones  
- [ ] Commit realizado con mensaje: `refactor(blog_detail): scaffolding jQuery + helper toasts`

---

### Fase 2: Migrar gallery popup a jQuery builder (riesgo medio)  
**Duración estimada**: 15 minutos  
**Objetivo**: Eliminar template string concatenado, onclick inline y funciones globales `prevImage`/`nextImage`.

#### Pasos

1. **2.1** Reescribir `openGalleryPopup(element)` cambiando la creación del modal:
   - De: `document.createElement('div')`, `className = ...`, `document.body.appendChild(modal)`  
   - A: `$('<div>', { class: 'gallery-modal ...', css: { ... } }).appendTo('body')`  

2. **2.2** Reescribir la construcción del HTML interno del modal:
   - De: `modal.innerHTML = '<button ...>' + '<button ...>' + ...`  
   - A: builders jQuery: `var $close = $('<button>', { class: 'gallery-modal-close' }).append('<i class="fas fa-times"></i>');`  
   - Armar la estructura con `.append()` encadenados o variables intermedias.  

3. **2.3** Eliminar `onclick` del template:
   - De: `'<button class="gallery-modal-close" onclick="this.parentElement.remove()">'`  
   - A: `'<button class="gallery-modal-close"><i class="fas fa-times"></i></button>'`  
   - Luego en JS: `$closeBtn.on('click', function() { $modal.remove(); });`  

4. **2.4** Eliminar funciones globales `window.prevImage` y `window.nextImage`, reemplazándolas por closures internas:
   ```javascript
   // ANTES
   window.prevImage = function() { currentIndex = ...; updateImage(); };
   window.nextImage = function() { currentIndex = ...; updateImage(); };
   
   // DESPUÉS
   function prevImage() { currentIndex = ...; updateImage(); }
   $modal.on('click', '.gallery-modal-nav.prev', prevImage);
   ```

5. **2.5** Migrar `updateImage()` para usar selectores jQuery:
   - De: `document.getElementById('gallery-modal-img').src = ...`  
   - A: `$('#gallery-modal-img').attr('src', images[currentIndex]);`  
   - De: `document.getElementById('gallery-modal-title').textContent = ...`  
   - A: `$('#gallery-modal-title').text(titles[currentIndex]);`  

6. **2.6** Migrar keyboard handler:
   - De: `document.onkeydown = function(e) { ... }`  
   - A: `$(document).on('keydown.galleryPopup', function(e) { ... });`  
   - Agregar cleanup al cerrar: `$(document).off('keydown.galleryPopup');`  

7. **2.7** Migrar modal overlay click:
   - De: `modal.onclick = function(e) { if (e.target === modal) modal.remove(); };`
   - A: `$modal.on('click', function(e) { if (e.target === $modal[0]) $modal.remove(); });`  

#### Criterios de aceptación Fase 2

- [ ] Galería popup abre igual que antes (mismo tamaño, mismo z-index, misma transición)  
- [ ] Navegación con clicks (prev/next) funciona  
- [ ] Navegación con teclado (flechas izquierda/derecha, Escape) funciona  
- [ ] Click fuera del modal lo cierra  
- [ ] No quedan expuestas `window.prevImage` ni `window.nextImage`  
- [ ] No hay `onclick` inline en el HTML generado (inspeccionar en DevTools)  
- [ ] Commit realizado con mensaje: `refactor(blog_detail): migrar gallery popup a jQuery`

---

### Fase 3: Migrar reply form a jQuery builder (riesgo medio)  
**Duración estimada**: 15 minutos  
**Objetivo**: Eliminar el template HTML de 60 líneas concatenado en `getReplyFormHtml`.

#### Pasos

1. **3.1** Reescribir `getReplyFormHtml(commentId)`:  
   - De: retorno de string con `+ '<div>' + ...`  
   - A: construir el formulario con `$('<form>', { ... }).append(...)`.  
2. **3.2** Mantener `esc()` o usar `$('<div>').text(v).html()` para escapar valores.  
3. **3.3** Reemplazar el botón Cancelar inline por binding jQuery limpio.  
4. **3.4** El método devuelve un elemento jQuery listo para insertar.  

#### Criterios de aceptación Fase 3

- [ ] Reply form idéntico visualmente  
- [ ] Submit AJAX funciona igual  
- [ ] Cancelar oculta el form sin recargar  
- [ ] No hay `onclick` inline  
- [ ] Commit: `refactor(blog_detail): migrar reply form a jQuery builder`

---

### Fase 4: Scroll handler namespaced (riesgo bajo)  
**Duración estimada**: 10 minutos  

1. **4.1** Migrar `window.onscroll` a `$(window).on('scroll.readingProgress', ...)`.  
2. **4.2** Migrar keyboard handler de gallery si aplica.  
3. **4.3** Confirmar ausencia de `window.onscroll` y `document.onkeydown`.  

#### Criterios de aceptación Fase 4

- [ ] Progreso, back-to-top y barra flotante funcionan igual  
- [ ] No se rompe otro scroll scripting en la página  
- [ ] Commit: `refactor(blog_detail): scroll handler namespaced`

---

### Fase 5: Limpieza final (riesgo bajo)  
**Duración estimada**: 10 minutos  

1. **5.1** Eliminar funciones globales sobrantes.  
2. **5.2** Verificar ausencia de concatenaciones HTML con `+ '...' +`.  
3. **5.3** Prueba integral manual de todas las zonas intervenidas.  
4. **5.4** Diff contra backup y borrado del backup.  

#### Criterios de aceptación Fase 5

- [ ] Cero funciones globales innecesarias  
- [ ] Cero templates concatenados  
- [ ] Cero handlers globales  
- [ ] Checklist manual completo aprobado  
- [ ] Commit: `refactor(blog_detail): limpieza final`

---

## 📊 Métricas de éxito

| Métrica | Antes | Después esperado |
| --- | --- | --- |
| Líneas totales | ~270 | ~190 |
| Templates inline | ~85 | 0 |
| Funciones globales innecesarias | 2 | 0 |
| Handlers globales | 2 | 0 |
| Dependencias nuevas | 0 | 0 |
| Funcionalidades rotas | 0 | 0 |

---

## 🧪 Estrategia de testing

### Antes de cada fase

- Confirmar que la consola no trae errores nuevos y que el flujo principal sigue funcionando.  

### Después de cada fase

- Repetir la validación mínima. Si algo falla, revertir solo esa fase.  

### Prueba final

- Validar en 2 navegadores y en vista responsive.  
- Confirmar que no hay errores en consola.  

---

## 🧩 Análisis: Modularización de blog_detail.js

### Contexto

Actualmente todo vive en un solo archivo de 270 líneas. Si mañana necesitas reusar solo el carrusel, la galería o los comentarios en otra página, el monolito se convierte en un problema: diffs gigantes, conflictos de merge, acoplamiento innecesario.

### ¿Vale la pena modularizar?

**Sí, pero no en esta HU.** Esta HU está enfocada en jQueryizar el código. La modularización es una mejora de arquitectura que se beneficia del código limpio resultante. Sin embargo, es útil definir AHORA el patrón para no obstaculizarlo después.

### Mecanismos jQuery para cargar archivos hijos

jQuery ofrece 3 formas de cargar scripts bajo demanda:

| Mecanismo | Uso | Ventaja | Desventaja |
| --- | --- | --- | --- |
| `$.getScript(url)` | Carga y ejecuta un JS externo una sola vez | Simple, built-in | No maneja orden ni dependencias entre archivos |
| `$.ajax({ url, dataType: 'script' })` | Carga con control | Más control (beforeSend, complete) | Igual: no maneja orden ni dependencias |
| `$('<script>', { src: url }).appendTo('head')` | Inyecta tag manualmente | Puedes setear `async`, `defer` | Más verboso, tú controlas ejecución |

**LIMITACIÓN**: Ninguno garantiza orden ni dependencias. Si `galeria.js` necesita que `utils.js` exista, estos mecanismos no lo aseguran.

### Patrón recomendado: Namespace + plugins jQuery

En un proyecto Django sin bundler, el enfoque más robusto es:

```javascript
// blog_detail.js mantiene el núcleo
window.BlogDetail = {
    init: function() {
        this.Carrusel.init();
        this.Gallery.init();
        this.Comments.init();
        this.Progress.init();
    }
};
```

```javascript
// blog_detail-gallery.js (archivo separado, plugin jQuery)
(function($) {
    'use strict';
    
    $.fn.blogGalleryPopup = function(options) {
        var settings = $.extend({ selector: '.gallery-images' }, options);
        
        return this.each(function() {
            var $trigger = $(this);
            $trigger.on('click', function() {
                var raw = $(settings.selector).val();
                // Lógica de galería aquí (ya jQueryizada en Fase 2)
            });
        });
    };
    
    // Registrar módulo en el namespace global
    if (typeof window.BlogDetail !== 'undefined') {
        window.BlogDetail.Gallery = {
            init: function() {
                $('[data-gallery-trigger]').blogGalleryPopup();
            }
        };
    }
    
})(jQuery);
```

**Ventajas**:
- Cada archivo es un plugin jQuery autocontenido (`$.fn.nombrePlugin`)
- Se cargan en el template como `<script>` estáticos (no `$.getScript` dinámico)
- `window.BlogDetail.init()` orquesta la inicialización
- Si una página no necesita galería, simplemente no carga ese archivo
- Los plugins son reutilizables en cualquier página

### Orden de carga en template Django

```html
<!-- post_detail.html -->

<!-- Capa base: jQuery (ya existe en el proyecto) -->
<script src="{% static 'js/jquery-plugins/jquery-3.2.1.min.js' %}"></script>

<!-- Core: orquestador -->
<script src="{% static 'blog/js/blog_detail.js' %}"></script>

<!-- Módulos opcionales: solo si la página los necesita -->
{% if post.tiene_galeria %}
<script src="{% static 'blog/js/blog_detail-gallery.js' %}"></script>
{% endif %}

{% if post.tiene_comentarios %}
<script src="{% static 'blog/js/blog_detail-comments.js' %}"></script>
{% endif %}

<script>
    $(function() {
        if (typeof BlogDetail !== 'undefined') {
            BlogDetail.init();
        }
    });
</script>
```

### Ejemplo de arquitectura futura (después del refactor)

```
blog/static/blog/js/
├── blog_detail.js              → Core: namespace BlogDetail, init()
├── blog_detail-carrusel.js     → Plugin $.fn.blogCarrusel
├── blog_detail-gallery.js      → Plugin $.fn.blogGalleryPopup
├── blog_detail-progress.js     → Plugin $.fn.blogReadingProgress
└── blog_detail-comments.js     → Plugin $.fn.blogComments
```

Cada hijo:
- Es un plugin jQuery autocontenido
- Se auto-registra en `window.BlogDetail.Nombre`
- No depende de otros hijos (solo jQuery + `window.BlogDetail`)
- Puede cargarse condicionalmente desde el template

### ¿Cuándo SÍ dividir, cuándo NO?

| Escenario | Acción |
| --- | --- |
| **Esta HU** (refactor jQuery) | NO dividir. Mantener archivo único para no añadir riesgo. |
| **Después del refactor**, si se necesita reusar carrusel en otra página | Crear `blog_detail-carrusel.js` como plugin jQuery |
| **Si crece a +500 líneas** | Evaluar división por dominios funcionales |
| **Si varios devs trabajan en paralelo** | Sí dividir: cada developer su módulo |
| **Si no hay reuso previsto** | No dividir. 200 líneas es mantenible. |

### Conclusión

**Sí se puede y se debería modularizar en el futuro**, usando:
- `$.fn.pluginName` para encapsular cada feature
- `window.BlogDetail.init()` como orquestador
- `<script>` tags declarativas en el template (no `$.getScript` dinámico)

**Pero NO se hace en esta HU** porque:
1. El archivo tiene solo 270 líneas
2. No hay evidencia de reuso entre páginas todavía
3. Añadiría riesgo a una HU cuyo objetivo es reducir complejidad

**Esta decisión se registra para una próxima HU de arquitectura.**  

---

## ⚡ Decisiones técnicas

- jQuery 3.2.1 ya está cargado en el proyecto y cumple con `.clinerules`.  
- Carrusel, back-to-top, zoom y share quedan en Vanilla porque el beneficio de migrarlos no compensa el riesgo.  
- Si jQuery no estuviera disponible, se cancela la migración.

---

## 📋 Checklist de aprobación

- [ ] jQuery confirmado en la página objetivo  
- [ ] Backup creado  
- [ ] Scope aceptado por el equipo  
- [ ] Tiempo asignado: ~50 minutos  
- [ ] Sin tests automáticos rotos conocidos  

---

HU definida el 29/06/2026 — lista para ejecutar fase por fase
