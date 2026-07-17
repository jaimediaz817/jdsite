# HU-046: Título 11px + descripción 35 caracteres en grid de 2 columnas (blog_list)

> Fecha: 2026-07-16
> Estado: IMPLEMENTACIÓN
> Depende de: DIAG_TITULO_NO_VISIBLE_BLOG_LIST.md

## Contexto
En el grid de 2 tarjetas por fila (`blog_list.html`), el título del artículo no era
visible porque: (1) la imagen `aspect-ratio:16/11` era muy alta en columna estrecha,
(2) el `.card-body` no tenía `overflow:hidden`, (3) el `.stretched-link` absoluto tapaba
el texto, y (4) el excerpt de 90 chars empujaba el contenido.

## Requerimiento del usuario
- Título del artículo en **~11px** de fuente (antes heredaba `h6` ~16px).
- Descripción (excerpt) de solo **~35 caracteres** en 1 línea (antes 90 chars / 2 líneas).
- Imagen de portada con `aspect-ratio: 16/9` en móvil/tablet (más panorámica, card proporcional).
- El título debe quedar por encima del `stretched-link` (z-index) y el card-body con overflow hidden.

## Cambios
1. `backend/blog/templates/blog/blog_list.html`: `blog_excerpt:90` → `blog_excerpt:35`
2. `backend/blog/static/blog/css/blog_list_fix.css`:
   - `.title-article-content { font-size: 11px !important; line-height: 1.25 !important; }`
   - `.title-article-content a { font-size: 11px !important; position: relative; z-index: 2; }`
   - `.blog-post-content_container { font-size: 10px !important; -webkit-line-clamp: 1; overflow: hidden; }`
   - `.blog-card .card-body { overflow: hidden; }`
   - `@media (max-width: 991px) { .blog-card-image { aspect-ratio: 16/9 !important; } }`

## Verificación
- [ ] Título visible en desktop (grid 3 col) con 11px
- [ ] Título visible en tablet/móvil (grid 2 col) sin cortes
- [ ] Excerpt ~35 chars en 1 línea
- [ ] Click en card lleva al artículo (stretched-link intacto)
- [ ] Card proporcional (no muy alta)