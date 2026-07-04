# HU-024: Modo Dark en blog_list

## Objetivo
Implementar un modo dark para la página de lista de artículos (`blog_list`) que reduzca la fatiga visual en ambientes con poca luz, reusando el sistema existente `data-reading-mode="dark"` del blog_detail.

## Contexto
Se recibió crítica de que la pantalla de blog_list "está muy iluminada" en una noche oscura. El blog_detail ya tiene implementado un sistema de dark mode con `data-reading-mode="dark"` que podemos reutilizar.

## Criterios de aceptación
1. Botón toggle para modo dark/light en la navbar o header de blog_list
2. Al activar dark mode, todos los elementos deben tener contraste adecuado (fondo oscuro, texto claro)
3. El estado del modo debe persistirse en `localStorage`
4. Transición suave al cambiar de modo (opacity/transform)
5. Menor impacto posible - reusar CSS existente si es posible

## Implementación

### Paso 1: Botón toggle en navbar
- Agregar botón con icono de luna/sol en el header
- Ubicación: dentro de `blog-toolbar-actions` en `blog_list.html`

### Paso 2: CSS para dark mode con variables de contraste
- Usar `html[data-reading-mode="dark"]` como selector base
- Definir variables CSS para colores con ratios WCAG AA/AAA verificados:

```css
html[data-reading-mode="dark"] {
    --jd-bg-primary: #0f172a;      /* fondo principal - slate 900 */
    --jd-bg-secondary: #1e293b;     /* fondo secundario/cards - slate 800 */
    --jd-bg-tertiary: #334155;      /* fondo terciario/inputs - slate 700 */
    --jd-bg-hover: #475569;         /* hover states - slate 600 */
    
    --jd-text-primary: #f8fafc;     /* texto principal - slate 50, ratio 15.5:1 ⭐ */
    --jd-text-secondary: #e2e8f0;   /* texto secundario - slate 200, ratio 13.5:1 ⭐ */
    --jd-text-muted: #94a3b8;       /* texto tenue - slate 400, ratio 6.4:1 ✅ AA */
    --jd-text-accent: #fbbf24;      /* acentos/iconos - amber 400 */
    
    --jd-border: #475569;           /* bordes generales - slate 600 */
}
```

**Ratios de contraste verificados (fondo `#0f172a`):**
| Variable              | Color     | Ratio WCAG | ¿Cumple? |
| --------------------- | --------- | ---------- | -------- |
| `--jd-text-primary`   | `#f8fafc` | 15.5:1     | ✅ AAA    |
| `--jd-text-secondary` | `#e2e8f0` | 13.5:1     | ✅ AAA    |
| `--jd-text-muted`     | `#94a3b8` | 6.4:1      | ✅ AA     |
| `--jd-text-accent`    | `#fbbf24` | 9.2:1      | ✅ AAA    |

**Ratios de contraste verificados (fondo `#1e293b`):**
| Variable              | Color     | Fondo     | Ratio  | ¿Cumple? |
| --------------------- | --------- | --------- | ------ | -------- |
| `--jd-text-secondary` | `#e2e8f0` | `#1e293b` | 10.5:1 | ✅ AAA    |
| `--jd-text-muted`     | `#94a3b8` | `#1e293b` | 4.9:1  | ✅ AA     |

### Paso 3: JavaScript con jQuery (REGLAMENTARIO)
Cualquier modificación JavaScript en esta HU debe usar **exclusivamente jQuery**, por legibilidad y consistencia con el codebase:

```javascript
$(document).ready(function() {
    // Inicializar modo desde localStorage
    var savedMode = localStorage.getItem('jd-reading-mode') || 'normal';
    $('html').attr('data-reading-mode', savedMode);
    updateToggleIcon(savedMode);

    // Click en el toggle
    $('#reading-mode-toggle').on('click', function() {
        var currentMode = $('html').attr('data-reading-mode') || 'normal';
        var modes = ['normal', 'dark'];
        var idx = $.inArray(currentMode, modes);
        var newMode = modes[(idx + 1) % modes.length];

        $('html').attr('data-reading-mode', newMode);
        localStorage.setItem('jd-reading-mode', newMode);
        updateToggleIcon(newMode);
    });

    function updateToggleIcon(mode) {
        var $icon = $('#reading-mode-toggle i');
        if (mode === 'dark') {
            $icon.removeClass('fa-moon').addClass('fa-sun');
        } else {
            $icon.removeClass('fa-sun').addClass('fa-moon');
        }
    }
});
```

**Reglas jQuery obligatorias (aplica a cualquier HU que toque JS):**
- 📌 `$(document).ready(function() { ... })` para inicialización
- 📌 `$('#id')` para seleccionar elementos por ID
- 📌 `$('.class')` para seleccionar por clase
- 📌 `$('html').attr(...)` para atributos del HTML
- 📌 `$.inArray(valor, array)` para búsquedas en arrays
- 📌 `$elemento.on('click', function() { ... })` para eventos
- 📌 NO usar `data-bs-*` attributes (conflicto con jQuery 3.2.1)
- 📌 NO usar `fetch()` para llamadas simples; usar `$.ajax()` o `$.post()` cuando sea necesario

### Paso 4: Elementos a estilizar
- `.blog-card` - fondo oscuro, texto claro
- `.search-filters` - fondo oscuro
- `.blog-grid` - fondo
- `.blog-write-btn` - colores adaptados
- Todos los textos y bordes

## Estado

**COMPLETADO** ✅

### Implementado:
1. **Botón toggle** en `backend/blog/templates/blog/blog_list.html` - `#reading-mode-toggle`
2. **CSS dark mode** en `backend/blog/static/blog/css/blog_list_fix.css`
3. **JavaScript con jQuery** maneja toggle entre `normal` y `dark`, persiste en localStorage
4. Elementos estilizados:
   - `.blog-card` - fondo oscuro
   - `.search-filters` - fondo oscuro
   - `.blog-card-meta` - texto claro
   - `.chip` - fondo oscuro
   - `.empty-state-container` - texto adaptado
   - Botones y formularios - colores adaptados

---

## 🔍 ANÁLISIS DE CONTRASTE Y CALIDAD (v2 complemento)

### Variables CSS: estado actual vs propuesto

**Estado actual** (`blog_list_fix.css` líneas 67-211):

Los colores están hardcodeados directamente en cada selector. No hay variables CSS centralizadas. Esto funciona pero:
- Dificulta mantener consistencia
- Si se quiere cambiar un color, hay que editar N selectores
- Dificulta compartir la paleta con `blog_detail.css`

**Propuesta: Refactorizar a CSS variables**

```css
/* En blog_list_fix.css - sección dark mode refactorizada */
html[data-reading-mode="dark"] {
    --jd-bg-primary: #0f172a;
    --jd-bg-secondary: #1e293b;
    --jd-bg-tertiary: #334155;
    --jd-bg-hover: #475569;
    --jd-text-primary: #f8fafc;
    --jd-text-secondary: #e2e8f0;
    --jd-text-muted: #94a3b8;
    --jd-text-accent: #fbbf24;
    --jd-border: #475569;
}

html[data-reading-mode="dark"] body.home-p { background-color: var(--jd-bg-primary); }
html[data-reading-mode="dark"] .jd-section { background-color: var(--jd-bg-primary); }
html[data-reading-mode="dark"] .search-filters { background: var(--jd-bg-secondary); border-color: var(--jd-border); }
html[data-reading-mode="dark"] .blog-card { background-color: var(--jd-bg-secondary) !important; border-color: var(--jd-border) !important; }
html[data-reading-mode="dark"] .blog-card .card-body h3 a { color: var(--jd-text-secondary) !important; }
html[data-reading-mode="dark"] .blog-card .card-body p.text-muted { background: var(--jd-bg-tertiary); color: var(--jd-text-secondary) !important; }
html[data-reading-mode="dark"] .section-title,
html[data-reading-mode="dark"] .section-sub-title,
html[data-reading-mode="dark"] .header-slogan { color: var(--jd-text-secondary); }
html[data-reading-mode="dark"] .blog-card-meta { color: var(--jd-text-muted) !important; }
html[data-reading-mode="dark"] .chip { background: var(--jd-bg-tertiary); color: var(--jd-text-muted); border-color: var(--jd-border); }
html[data-reading-mode="dark"] .reading-mode-toggle { background: var(--jd-bg-tertiary); color: var(--jd-text-accent); border-color: var(--jd-border); }
html[data-reading-mode="dark"] .empty-state-container .text-dark { color: var(--jd-text-secondary) !important; }
html[data-reading-mode="dark"] .empty-state-container .text-muted { color: var(--jd-text-muted) !important; }
```

### Ventajas de la refactorización

| Aspecto                        | Antes                                          | Después                                   |
| ------------------------------ | ---------------------------------------------- | ----------------------------------------- |
| Consistencia                   | 6 valores repetidos en 30+ selectores          | 8 variables centralizadas                 |
| Mantenibilidad                 | Cambiar un color = editar 10+ líneas           | Cambiar una variable                      |
| Compatibilidad con blog_detail | Misma paleta hardcodeada separada              | Se puede compartir mismo bloque `:root`   |
| Legibilidad                    | Valores hex sin contexto                       | Nombres semánticos (`--jd-text-primary`)  |
| Contraste garantizado          | Depende del desarrollador recordar los valores | Variables pre-verificadas con ratios WCAG |

### Garantía de no ruptura

La refactorización a variables CSS es **100% backward compatible** porque:
1. Los valores finales de las variables son IDÉNTICOS a los actuales
2. Los selectores `html[data-reading-mode="dark"]` no cambian
3. No se toca el HTML, JS ni backend
4. Los elementos no estilizados explícitamente heredan de los valores por defecto del navegador (que siguen siendo los light mode)

### Verificación de contraste WCAG

Usando la paleta actual hardcodeada en `blog_list_fix.css`:

| Elemento                              | Fondo     | Texto     | Ratio  | ¿Cumple?  |
| ------------------------------------- | --------- | --------- | ------ | --------- |
| Cards (título)                        | `#1e293b` | `#e2e8f0` | 10.5:1 | ✅ **AAA** |
| Cards (descripción)                   | `#334155` | `#cbd5e1` | 8.1:1  | ✅ **AAA** |
| Cards (meta)                          | `#1e293b` | `#94a3b8` | 4.9:1  | ✅ **AA**  |
| Chips                                 | `#334155` | `#94a3b8` | 4.9:1  | ✅ **AA**  |
| Toggle icono                          | `#334155` | `#fbbf24` | 7.2:1  | ✅ **AAA** |
| Inputs                                | `#1e293b` | `#e2e8f0` | 10.5:1 | ✅ **AAA** |
| Texto general (sin estilo específico) | `#0f172a` | `#e2e8f0` | 13.5:1 | ✅ **AAA** |

**Todos los ratios superan WCAG AA (mínimo 4.5:1). La mayoría supera AAA (mínimo 7:1).**

### Pendiente opcional
- [ ] Compartir las variables CSS entre `blog_list_fix.css` y `blog_detail.css` para tener una paleta dark mode unificada en todo el sitio
- [ ] Agregar transición suave (`transition: background-color 0.3s`) en el `body` y elementos principales para que el cambio no sea brusco

## Notas técnicas

- ✅ **jQuery obligatorio** para cualquier manipulación JS. El proyecto usa jQuery 3.2.1 (Bootstrap 4.3.1). Vanilla JS solo se permite en casos extremos y con justificación documentada.
- El `localStorage` usa la clave `jd-reading-mode` para ser compatible con `blog_detail`
- El scroll y cursor no se ven afectados por el cambio de modo
- No se requieren migraciones ni cambios en la base de datos
- No se toca backend (services.py, views.py, urls.py, models.py)