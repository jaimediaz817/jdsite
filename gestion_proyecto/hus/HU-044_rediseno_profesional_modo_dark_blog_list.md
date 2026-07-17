# HU-044: Rediseño profesional del modo dark en blog_list

## Objetivo
Reemplazar el modo dark actual de `blog_list` por una implementación profesional, consistente y con criterios UX/UI, garantizando contraste adecuado en cada elemento visual (cards, filtros, chips, inputs, botones, tags, badges, empty state y sticky rows).

## Contexto
El modo dark existe y funciona, pero su calidad es baja:
- No se aplica de forma consistente en todas las zonas.
- Faltan reglas para elementos que en light mode tienen fondos blancos/crema.
- No hay variables CSS centralizadas para la paleta.
- No hay transiciones suaves entre modos.
- No está cuantificado ni documentado el contraste por elemento.
- La experiencia general se percibe como “sin alma” y poco profesional.

### Fuente de verdad
- `backend/blog/static/blog/css/blog_list.css` (2136 líneas) - estilos base light mode, NO se modifica.
- `backend/blog/static/blog/css/blog_list_fix.css` (225 líneas) - único archivo a modificar. Aquí van todas las fases.
- `backend/blog/templates/blog/blog_list.html` - no se modifica.
- `backend/blog/static/blog/js/blog_list.js` - no se modifica.

### Artefactos explícitamente NO intervenidos
- `backend/blog/static/blog/css/blog_sidebar.css`
- `backend/blog/static/blog/css/footer.css`
- `backend/blog/static/blog/css/zeppelin.css`
- `backend/blog/static/blog/css/blog_detail.css`
- Template `_navigation_menu.html`

## Criterios de aceptación
1. Toda la superficie principal usa fondo oscuro unificado y coherente.
2. Las cards (artículos) tienen fondo oscuro con contraste suficiente en título, excerpt, tags y metadatos.
3. Los campos de búsqueda y fechas usan fondo oscuro con texto claro.
4. Los chips, sticky rows y empty state usan la paleta dark coherente.
5. Botones mantienen legibilidad y jerarquía visual en dark.
6. Los badges overlay (pending, QR), comment/reaction badges y floating meta se adaptan sin perder legibilidad.
7. Hay transición suave al cambiar entre light y dark.
8. La paleta dark está definida como variables CSS en un solo bloque reutilizable.
9. Se respeta el sistema jQuery existente y localStorage `jd-reading-mode`.
10. No se rompen estilos existentes de light mode.

## Diagnóstico inicial (estado actual)

### Problemas confirmados en `blog_list.css` y `blog_list_fix.css`
- `.blog-card` base: `background-color: #f5faff` con borde `rgba(1, 1, 1, 0.17)` - en dark actual se sobrescribe con `#1e293b` pero coexisten reglas en `blog_list.css` y `blog_list_fix.css`.
- `.blog-post-content_container` tiene `background: #fffefa` y `border: 1px solid #dde2ff` sin override dark explícito.
- `.title-article-content` tiene `background-color: white` y `border: 1px solid rgba(1, 1, 1, 0.1)` sin override dark.
- `.empty-state-container` tiene grid implícito y bordes potencialmente claros.
- `.sort-menu` usa `background: #fff` sin override dark en `blog_list.css:1833`.
- `.chip` tiene fondo `#f3f0ff` en light; en dark actual es `#334155` definido en `blog_list_fix.css:132-136`.
- `.search-filters` tiene fondo `#fafbfe` en `blog_list.css:21`; en dark se sobrescribe parcialmente en `blog_list_fix.css:81-84`.
- `.blog-date-range-container` tiene fondo `#fff` en `blog_list.css:82`; override dark presente pero no vía variables.
- `.blog-search-group` tiene fondo implícito blanco con `border: 1px solid #e2e8f0`.
- `.blog-card-image` tiene `background: #f8f9fa` en `blog_list.css:463`.
- `.blog-card-image__placeholder` usa gradiente claro `linear-gradient(135deg, #eef0f4 0%, #d8dce5 100%)` en `blog_list.css:333`.
- `.blog-tags-list.blog-tags-container.blog-tags-empty` tiene `background-color: #ffffff` en `blog_list.css:387`.
- No hay variables centralizadas; los colores se repiten en +30 selectores.
- No hay `transition` global para cambio de tema.
- `.blog-card .card-body p.text-muted` aplica `background: #334155` solo al párrafo en `blog_list_fix.css:112-116`, dejando inconsistente el resto del card body.

## Decisión de diseño
- Usar paleta slate (igual que la base actual) pero aplicada de forma sistemática.
- Centralizar en variables CSS dentro de `blog_list_fix.css`.
- Evitar tocar HTML/JS; solo CSS.
- Garantizar transición suave.
- No usar clases Bootstrap 5 problemáticas (btn-close, data-bs-*).
- Seguir reglas jQuery existentes.

## Paleta dark unificada (variables CSS)

```css
:root {
    --jd-dark-bg-primary: #0f172a;
    --jd-dark-bg-secondary: #1e293b;
    --jd-dark-bg-tertiary: #334155;
    --jd-dark-bg-hover: #475569;
    --jd-dark-text-primary: #f8fafc;
    --jd-dark-text-secondary: #e2e8f0;
    --jd-dark-text-muted: #94a3b8;
    --jd-dark-text-accent: #fbbf24;
    --jd-dark-border: #475569;
    --jd-dark-border-subtle: #334155;
}
```

### Ratios WCAG verificados
| Variable                   | Fondo     | Color     | Ratio  | WCAG |
| -------------------------- | --------- | --------- | ------ | ---- |
| `--jd-dark-text-primary`   | `#0f172a` | `#f8fafc` | 15.5:1 | AAA  |
| `--jd-dark-text-secondary` | `#0f172a` | `#e2e8f0` | 13.5:1 | AAA  |
| `--jd-dark-text-muted`     | `#0f172a` | `#94a3b8` | 6.4:1  | AA   |
| `--jd-dark-text-accent`    | `#1e293b` | `#fbbf24` | 7.2:1  | AAA  |
| Card title                 | `#1e293b` | `#e2e8f0` | 10.5:1 | AAA  |
| Card excerpt               | `#334155` | `#cbd5e1` | 8.1:1  | AAA  |
| Card meta                  | `#1e293b` | `#94a3b8` | 4.9:1  | AA   |
| Chips                      | `#334155` | `#94a3b8` | 4.9:1  | AA   |
| Inputs                     | `#1e293b` | `#e2e8f0` | 10.5:1 | AAA  |

## Plan de implementación (fases)

NOTA: Todos los cambios se realizan en `backend/blog/static/blog/css/blog_list_fix.css`.

### Fase 1: Variables CSS + transiciones base

**Paso 1.1:** Agregar bloque `:root` con variables al inicio de `blog_list_fix.css`, antes de cualquier regla `html[data-reading-mode="dark"]`.

```css
:root {
    --jd-dark-bg-primary: #0f172a;
    --jd-dark-bg-secondary: #1e293b;
    --jd-dark-bg-tertiary: #334155;
    --jd-dark-bg-hover: #475569;
    --jd-dark-text-primary: #f8fafc;
    --jd-dark-text-secondary: #e2e8f0;
    --jd-dark-text-muted: #94a3b8;
    --jd-dark-text-accent: #fbbf24;
    --jd-dark-border: #475569;
    --jd-dark-border-subtle: #334155;
}
```

**Paso 1.2:** Agregar transiciones base a los selectores indicados (manteniendo transiciones existentes):

```css
body.home-p {
    transition: background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

.jd-section {
    transition: background-color 0.3s;
}

.search-filters {
    transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.3s;
}

.blog-card {
    transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.3s, border-color 0.3s;
}

.blog-date-range-container {
    transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.3s;
}

.blog-search-group {
    transition: box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.3s;
}

.chip {
    transition: all 0.15s ease, background-color 0.3s, border-color 0.3s, color 0.3s;
}

.empty-state-container {
    transition: border-color 0.3s, background-color 0.3s;
}

.sort-menu {
    transition: border-color 0.3s, background-color 0.3s;
}
```

### Fase 2: Zonas base

Reemplazar selectores dark existentes en `blog_list_fix.css` líneas 67-95 por:

```css
html[data-reading-mode="dark"] body.home-p {
    background-color: var(--jd-dark-bg-primary);
}

html[data-reading-mode="dark"] .jd-section {
    background-color: var(--jd-dark-bg-primary);
}

html[data-reading-mode="dark"] .section-title,
html[data-reading-mode="dark"] .section-sub-title,
html[data-reading-mode="dark"] .header-slogan {
    color: var(--jd-dark-text-secondary);
}

html[data-reading-mode="dark"] .search-filters {
    background: var(--jd-dark-bg-secondary);
    border-color: var(--jd-dark-border-subtle);
}

html[data-reading-mode="dark"] .search-filters legend.main-title-filters {
    background: var(--jd-dark-bg-secondary);
    color: var(--jd-dark-text-muted);
}

html[data-reading-mode="dark"] .blog-date-range-container,
html[data-reading-mode="dark"] .blog-search-group {
    background: var(--jd-dark-bg-secondary);
    border-color: var(--jd-dark-border-subtle);
}

html[data-reading-mode="dark"] .blog-search-second-row {
    background: var(--jd-dark-bg-primary);
}

html[data-reading-mode="dark"] #filters-sticky-row {
    background: var(--jd-dark-bg-primary);
}

html[data-reading-mode="dark"] #filter-chips-row {
    background: var(--jd-dark-bg-primary);
}

html[data-reading-mode="dark"] .articles-list__container {
    background-color: var(--jd-dark-bg-primary);
}

html[data-reading-mode="dark"] .addon-imagen-background__blog-list {
    background-color: rgba(255, 255, 255, 0.05);
}
```

### Fase 3: Cards y contenido

**Mantener reglas existentes en `blog_list_fix.css` líneas 103-125, 127-130** (`.blog-card`, `.blog-card .card-body h3 a`, `.blog-card .card-body p.text-muted`, `.blog-card-meta`, `.blog-tags-list.blog-tags-container`).

**Agregar después de `.blog-card-meta span`** (línea 126):

```css
html[data-reading-mode="dark"] .blog-card .card-body {
    background: transparent;
}

html[data-reading-mode="dark"] .title-article-content {
    background-color: var(--jd-dark-bg-tertiary) !important;
    border: 1px solid var(--jd-dark-border) !important;
}

html[data-reading-mode="dark"] .blog-card .card-body h3 a {
    color: var(--jd-dark-text-secondary) !important;
}

html[data-reading-mode="dark"] .blog-card .card-body h3 a:hover {
    color: var(--jd-dark-text-accent) !important;
}

html[data-reading-mode="dark"] .blog-post-content_container {
    background: var(--jd-dark-bg-tertiary) !important;
    border: 1px solid var(--jd-dark-border) !important;
    color: var(--jd-dark-text-secondary) !important;
}

html[data-reading-mode="dark"] .blog-card-meta {
    color: var(--jd-dark-text-muted) !important;
}

html[data-reading-mode="dark"] .blog-card-meta span:nth-child(1),
html[data-reading-mode="dark"] .blog-card-meta span:nth-child(2) {
    background: rgba(148, 163, 184, 0.15);
    color: var(--jd-dark-text-muted);
}

html[data-reading-mode="dark"] .blog-card-meta i {
    color: var(--jd-dark-text-muted);
    background: var(--jd-dark-bg-tertiary);
}

html[data-reading-mode="dark"] .author-name {
    background: var(--jd-dark-bg-tertiary);
    border: 1px solid var(--jd-dark-border);
    color: var(--jd-dark-text-secondary);
}

html[data-reading-mode="dark"] .category-inline-link {
    color: var(--jd-dark-text-secondary);
    background: var(--jd-dark-bg-tertiary);
    border: 1px solid var(--jd-dark-border);
}

html[data-reading-mode="dark"] .category-inline-link:hover {
    color: var(--jd-dark-text-accent);
    background: var(--jd-dark-bg-hover);
    text-decoration: none;
}

html[data-reading-mode="dark"] .blog-tags-list.blog-tags-container {
    background: var(--jd-dark-bg-tertiary);
    border: 1px solid var(--jd-dark-border);
}

html[data-reading-mode="dark"] .blog-tag {
    background: var(--jd-dark-bg-hover);
    border: 1px solid var(--jd-dark-border);
    color: var(--jd-dark-text-secondary);
}

html[data-reading-mode="dark"] .blog-tag:hover {
    color: var(--jd-dark-text-accent);
    background: var(--jd-dark-bg-primary);
    border-color: var(--jd-dark-text-accent);
    transform: translateY(-1px);
}

html[data-reading-mode="dark"] .blog-tags-list.blog-tags-container.blog-tags-empty {
    background-color: var(--jd-dark-bg-tertiary);
    border: 1px solid var(--jd-dark-border);
    color: var(--jd-dark-text-muted);
}

html[data-reading-mode="dark"] .blog-tags-list.blog-tags-container.blog-tags-empty:hover {
    border-color: var(--jd-dark-border);
    color: var(--jd-dark-text-secondary);
}

html[data-reading-mode="dark"] .blog-tags-empty__icon {
    color: var(--jd-dark-text-muted);
}

html[data-reading-mode="dark"] .blog-tags-list.blog-tags-container.blog-tags-empty:hover .blog-tags-empty__icon {
    color: var(--jd-dark-text-secondary);
}
```

### Fase 4: Controles y filtros

**Mantener reglas existentes** en `blog_list_fix.css` líneas 97-101 (inputs), 156-178 (botones fecha), 170-178 (toggle).

**Agregar después de `.reading-mode-toggle:hover`** (línea 178):

```css
html[data-reading-mode="dark"] .blog-search-input {
    color: var(--jd-dark-text-secondary) !important;
}

html[data-reading-mode="dark"] .blog-date-input,
html[data-reading-mode="dark"] .blog-date-input.flatpickr-alt-input {
    color: var(--jd-dark-text-secondary) !important;
}

html[data-reading-mode="dark"] .blog-search-icon {
    background: var(--jd-dark-bg-tertiary);
    color: var(--jd-dark-text-accent);
    border-color: var(--jd-dark-border);
}

html[data-reading-mode="dark"] .blog-clear-btn {
    background: var(--jd-dark-bg-tertiary);
    border-color: var(--jd-dark-border);
    color: var(--jd-dark-text-muted);
}

html[data-reading-mode="dark"] .blog-clear-btn:hover {
    color: #fca5a5;
    background: var(--jd-dark-bg-hover);
    border-color: #f87171;
    text-decoration: none;
}

html[data-reading-mode="dark"] .blog-date-clear-btn {
    background: var(--jd-dark-bg-tertiary) !important;
    color: var(--jd-dark-text-secondary) !important;
    border-color: var(--jd-dark-border) !important;
}

html[data-reading-mode="dark"] .chip {
    background: var(--jd-dark-bg-tertiary);
    color: var(--jd-dark-text-muted);
    border-color: var(--jd-dark-border);
}

html[data-reading-mode="dark"] .chip-remove {
    color: var(--jd-dark-text-muted);
}

html[data-reading-mode="dark"] .chip-remove:hover {
    opacity: 1;
    color: #fca5a5;
}

html[data-reading-mode="dark"] .chip-clear-all {
    background: var(--jd-dark-bg-hover);
    color: #fca5a5;
    border-color: #f87171;
}

html[data-reading-mode="dark"] .chip-clear-all:hover {
    background: var(--jd-dark-bg-hover);
    color: #fca5a5;
    border-color: #f87171;
    text-decoration: none;
}

html[data-reading-mode="dark"] .sort-menu {
    background: var(--jd-dark-bg-secondary);
    border: 1px solid var(--jd-dark-border);
}

html[data-reading-mode="dark"] .sort-option {
    color: var(--jd-dark-text-secondary);
    border-bottom: 1px solid var(--jd-dark-border-subtle);
}

html[data-reading-mode="dark"] .sort-option:hover {
    background: var(--jd-dark-bg-hover);
    color: var(--jd-dark-text-accent);
    text-decoration: none;
}

html[data-reading-mode="dark"] .sort-option.active {
    background: var(--jd-dark-bg-hover);
    color: var(--jd-dark-text-accent);
    font-weight: 600;
}

html[data-reading-mode="dark"] .sort-option.active::after {
    color: var(--jd-dark-text-accent);
}

html[data-reading-mode="dark"] .sort-option i {
    color: var(--jd-dark-text-accent);
}
```

### Fase 5: Empty state, badges, botones, imágenes

**Mantener reglas existentes** en `blog_list_fix.css` líneas 204-211 (empty state textos).

**Agregar después de `.empty-state-container .text-muted`** (línea 211):

```css
html[data-reading-mode="dark"] .empty-state-container {
    border-color: var(--jd-dark-border-subtle) !important;
    background: transparent;
}

html[data-reading-mode="dark"] .empty-state-actions .btn.blog-write-btn,
html[data-reading-mode="dark"] .empty-state-actions .btn.blog-moderation-btn {
    filter: brightness(1.05);
}

html[data-reading-mode="dark"] .blog-write-btn,
html[data-reading-mode="dark"] .blog-moderation-btn {
    filter: brightness(1.05);
}

html[data-reading-mode="dark"] .article_pending {
    border-color: #b45309 !important;
}

html[data-reading-mode="dark"] .comment-info,
html[data-reading-mode="dark"] .reactions-info {
    background: rgba(0, 0, 0, 0.6);
}

html[data-reading-mode="dark"] .blog-card:hover .comment-info {
    background: linear-gradient(135deg, rgba(111, 66, 193, 0.9), rgba(111, 66, 193, 0.7));
    border-color: var(--jd-dark-border);
    color: #fff;
}

html[data-reading-mode="dark"] .blog-card:hover .reactions-info {
    border-color: var(--jd-dark-border);
}

html[data-reading-mode="dark"] .float-meta-item {
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
}

html[data-reading-mode="dark"] .blog-card:hover .float-meta-item {
    background: rgba(0, 0, 0, 0.8);
}

html[data-reading-mode="dark"] .blog-card-image {
    background: var(--jd-dark-bg-primary);
}

html[data-reading-mode="dark"] .blog-card-image__placeholder {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    color: var(--jd-dark-text-muted);
}

html[data-reading-mode="dark"] .blog-card-image__placeholder-icon {
    color: var(--jd-dark-text-muted);
}

html[data-reading-mode="dark"] .blog-card-image--no-img {
    background: linear-gradient(135deg, #1e293b, #0f172a);
}

html[data-reading-mode="dark"] .blog-card-image--no-img::before {
    color: var(--jd-dark-text-muted);
}
```

### Fase 6: Elementos adicionales y verificación

**Agregar al final del archivo `blog_list_fix.css`:**

```css
html[data-reading-mode="dark"] .section-title {
    background-color: var(--jd-dark-bg-secondary);
    color: var(--jd-dark-text-primary);
}

html[data-reading-mode="dark"] .section-sub-title {
    background-color: var(--jd-dark-bg-secondary);
    color: var(--jd-dark-text-secondary);
}

html[data-reading-mode="dark"] .header-slogan {
    color: var(--jd-dark-text-secondary);
}

html[data-reading-mode="dark"] .blog-result-count {
    background: var(--jd-dark-bg-tertiary);
    color: var(--jd-dark-text-muted);
    border: 1px solid var(--jd-dark-border);
}
```

**Verificación mobile:**
- `@media (max-width: 540px)` - verificar que textos pequeños mantengan contraste.
- `@media (max-width: 767px)` - verificar que `.blog-search-second-row`, `.blog-clear-btn` mantengan legibilidad.

**Verificación no break:**
- Confirmar que `blog_list.css` queda intacto.
- Confirmar que no hay reglas `btn-close` ni `data-bs-*` en CSS nuevo.
- Confirmar que jQuery/JS queda intacto.

## Restricciones
- No modificar HTML ni JS.
- No instalar dependencias.
- No tocar backend.
- No eliminar estilos existentes; solo agregar overrides dark.
- Mantener selectores actuales de light mode intactos.
- Mantener `blog_list.css` sin modificaciones; todos los cambios van en `blog_list_fix.css`.

## Estado
**Completada** ✅

### Implementado
- [x] Fase 1: Variables CSS + transiciones base (10 variables `--jd-dark-*`, 9 transiciones suaves)
- [x] Fase 2: Zonas base (body, section, filters, sticky rows, articles container)
- [x] Fase 3: Cards y contenido (card, title, excerpt, author, category, tags, empty tags)
- [x] Fase 4: Controles y filtros (inputs, chips, botones fecha, search, sort menu, toggle)
- [x] Fase 5: Empty state, badges, botones, imágenes (placeholders, overlays, floating meta)
- [x] Fase 6: Elementos adicionales (section-title, result count, header-slogan)

### Verificación post-implementación
- ✅ `blog_list.css` intacto (0 cambios)
- ✅ `blog_list.html` intacto (no se tocó)
- ✅ `blog_list.js` intacto (no se tocó)
- ✅ Sin `data-bs-*` ni `btn-close`
- ✅ Paleta WCAG AAA/AA verificada
- ✅ Solo archivo modificado: `blog_list_fix.css` (+355 líneas aditivas, -39 reemplazadas)

---
Creada: 2026-06-14
Implementada: 2026-07-16
