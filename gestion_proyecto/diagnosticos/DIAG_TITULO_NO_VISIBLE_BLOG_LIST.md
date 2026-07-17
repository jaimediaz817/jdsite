# DIAGNÓSTICO: Título del artículo no visible en blog_list (grid 2 columnas)

> Fecha: 2026-07-16
> Alcance: `backend/blog/templates/blog/blog_list.html` + `backend/blog/static/blog/css/blog_list.css` + `blog_list_fix.css`
> Síntoma reportado: "En el grid de 2 tarjetas por fila solo se ve la imagen de portada, NO el título."

---

## 1. ¿EL TÍTULO ESTÁ EN EL HTML? → SÍ

En `blog_list.html` (línea ~lógica del card-body) el título SÍ existe:

```html
<h3 class="title-article-content h6 mb-1 font-weight-bold" style="line-height: 1.3;">
    <a href="{{ post.get_absolute_url }}" class="text-dark text-decoration-none article-link" title="{{ post.title }}">
        {{ post.title|truncatechars:38 }}
    </a>
</h3>
```

Y el excerpt (descripción) también:

```html
{% with post|blog_excerpt:90 as excerpt %}
<p class="blog-post-content_container text-muted mb-1 small" style="flex-grow: 0; -webkit-line-clamp: 2;">
    {{ excerpt }}
</p>
```

**Conclusión**: El problema NO es que falte el título en el template. Es de **CSS / layout**.

---

## 2. ¿EL GRID DE 2 COLUMNAS EXISTE? → SÍ

En `blog_list.css` ya hay definciones de grid responsive:

```css
.blog-grid {
    display: grid;
    /* ... */
}
@media (max-width: 540px)  { .blog-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 991px) { .blog-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 1199px){ .blog-grid { grid-template-columns: repeat(3, 1fr); } }
```

El grid de 2 columnas funciona. El issue es lo que pasa DENTRO de cada card al estrecharse.

---

## 3. CAUSA RAÍZ (por qué el título "desaparece")

### 3.1 Imagen ocupa demasiado alto
```css
.blog-card-image {
    aspect-ratio: 16/11;   /* imagen GRANDE en card estrecha */
    overflow: hidden;
}
```
En una columna estrecha (50% del ancho), `aspect-ratio: 16/11` hace la imagen muy alto verticalmente.

### 3.2 card-body sin control de altura/overflow
El `.card-body` tiene `p-1 p-md-2` (padding mínimo) y apila:
1. Autor + Categoría (línea 1)
2. **Título** (línea 2)
3. Excerpt de 90 chars → 2 líneas (líneas 3-4)
4. Tags (línea 5)
5. Botones Editar/Moderar (línea 6, si autenticado)

Como la card crece según contenido y NO tiene `overflow: hidden` ni `max-height`, el contenido se desborda.

### 3.3 stretched-link tapa el texto
```html
<a href="{{ post.get_absolute_url }}" class="stretched-link" aria-label="..."></a>
```
El `.stretched-link` es `position: absolute` y cubre TODA la card. Si el texto del título no tiene `position: relative; z-index: 2`, el enlace absoluto queda POR ENCIMA y el título se ve "tapado" (aunque técnicamente está ahí, no recibe hover ni se ve claro si hay fondo).

### 3.4 excerpt de 90 caracteres es demasiado largo para 2 columnas
90 chars en una columna estrecha = 2-3 líneas que empujan el resto. El usuario quiere solo ~35.

---

## 4. REQUERIMIENTO NUEVO DEL USUARIO

| Elemento                            | Estado actual                                                  | Deseado                     |
| ----------------------------------- | -------------------------------------------------------------- | --------------------------- |
| Título (`h3.title-article-content`) | `font-size` heredado de `h6` (~1rem/16px) + `truncatechars:38` | **~11px** de fuente         |
| Descripción (excerpt)               | `blog_excerpt:90` + `-webkit-line-clamp: 2`                    | **~35 caracteres** visibles |

---

## 5. PLAN DE IMPLEMENTACIÓN (FASE ÚNICA, ADITIVA)

### 5.1 CSS — `blog_list.css` o `blog_list_fix.css`
```css
/* Título más compacto */
.title-article-content {
    font-size: 11px !important;
    line-height: 1.25 !important;
}
.title-article-content a {
    font-size: 11px !important;
    position: relative;
    z-index: 2;            /* que quede por encima del stretched-link */
}

/* Excerpt compacto */
.blog-post-content_container {
    font-size: 10px !important;
    -webkit-line-clamp: 1 !important;   /* 1 línea corta */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Card-body no debe desbordar */
.blog-card .card-body {
    overflow: hidden;
}
```

### 5.2 Template — `blog_list.html`
```django
{% with post|blog_excerpt:35 as excerpt %}   {# 90 → 35 #}
```

### 5.3 Por qué no rompe lo existente
- Solo se añaden/sobrescribre reglas con `!important` en clases ya existentes.
- El grid de 2/3 columnas se mantiene.
- El `stretched-link` sigue funcionando (el título solo gana `z-index` para visibilidad, no se bloquea el click).

---

## 6. CHECKLIST DE VERIFICACIÓN POST-IMPLEMENTACIÓN
- [ ] Título visible en desktop (grid 3 col) con 11px
- [ ] Título visible en tablet/móvil (grid 2 col) sin cortes
- [ ] Excerpt muestra ~35 chars en 1 línea
- [ ] Click en card sigue llevando al artículo (stretched-link intacto)
- [ ] En modo dark el título sigue legible

---

## 7. NOTA SOBRE PRODUCCIÓN
Tras el cambio en CSS hay que correr `collectstatic` en la VPS para refrescar `staticfiles/`.