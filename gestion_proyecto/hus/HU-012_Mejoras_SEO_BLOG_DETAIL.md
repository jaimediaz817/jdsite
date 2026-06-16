# 📋 HU-012: Mejoras SEO en Blog Detail

> **ID:** HU-012
> **Fecha:** 30/05/2026
> **Responsable:** Cline
> **Estado:** 🟢 Completada — 5 fases + mejoras adicionales implementadas
> **Tiempo estimado total:** 5 fases (~15 min cada una)
> **Dependencias:** HU-001 (sistema blogs), HU-001.1 (frontmatter completo)

---

## 🚨 INSTRUCCIONES DE DESARROLLO

### 🟢 1. Una Fase a la Vez
- **NUNCA** implementar más de una fase en una sola sesión
- Cada fase es **independiente** y se puede probar por separado

### 🟢 2. Sin Dependencias Nuevas Sin Aprobación
- Todo usa funcionalidad nativa de Django

### 🟢 3. Nunca Romper lo Existente
- Cualquier modificación debe ser **aditiva**

---

## 🎯 OBJETIVO

Mejorar el posicionamiento SEO del blog mediante:
1. **Fix crítico**: Registrar BlogPostSitemap en urls.py
2. **Meta tags Open Graph completos**: category, tags, twitter:site, og:image:alt
3. **Schema.org Breadcrumb**: Structured data + breadcrumb visible
4. **Schema.org enriquecido**: timeToRead, keywords en BlogPosting
5. **Feed RSS/Atom**: Para distribución y syndication
6. **Performance SEO**: Preconnect hints + lazy loading de imágenes
7. **Fallback OG**: Imagen placeholder cuando no hay cover_image
8. **Compartir WhatsApp**: Botón nativo de WhatsApp
9. **Artículos relacionados inteligentes**: Categoría + tags

---

## ✅ CAMBIOS REALIZADOS (todos los 14 puntos solucionados)

1. **BlogPostSitemap** registrado en `jdsite/urls.py`
2. **`article:section`** en OG (categoría del post)
3. **`article:tag`** en OG (etiquetas del post)
4. **`article:publisher`** en OG (link a LinkedIn)
5. **`og:image:alt`** — texto alternativo de imagen OG
6. **`twitter:site`** y **`twitter:creator`** — handles @jdiaz817
7. **Schema.org BreadcrumbList** en `<head>`
8. **Breadcrumb visible** — Inicio > Blog > Categoría > Artículo
9. **`wordCount`** y **`timeRequired`** en Schema.org BlogPosting
10. **`keywords`** en Schema.org BlogPosting
11. **Preconnect hints** para Google Fonts
12. **Feed RSS/Atom** — `feeds.py` + URLs registradas
13. **Lazy loading** — script que agrega loading="lazy" a imágenes
14. **Artículos relacionados** — Algoritmo inteligente (categoría + tags → categoría → recientes)

---

## 🔧 FASES DE IMPLEMENTACIÓN

### ⚡ FASE 1: Fix Sitemap + OG Tags Completos
**Archivos:** `backend/jdsite/urls.py`, `backend/blog/templates/blog/blog_detail.html`

**Cambios:**
- `BlogPostSitemap` registrado en sitemaps
- `article:section`, `article:tag`, `article:publisher` en OG
- `og:image:alt` en bloque de cover_image
- `twitter:site` y `twitter:creator` agregados

---

### ⚡ FASE 2: Schema.org Breadcrumb (Visible + Structured Data)
**Archivos:** `blog_detail.html`, `blog_detail.css`

**Cambios:**
- BreadcrumbList schema en `<head>` (Inicio → Blog → Categoría → Artículo)
- Breadcrumb visible con clase `.jd-breadcrumb`
- Estilos con flex-wrap responsive

---

### ⚡ FASE 3: Schema.org Enriquecido + Reading Time Preciso
**Archivos:** `blog_detail.html`, `blog_filters.py`

**Cambios:**
- `wordCount` y `timeRequired` en Schema BlogPosting
- `keywords` con tags del post
- Template tag `reading_time` (200 palabras/min)
- Fallback actualizado a `{{ post.content_html|reading_time }}`

---

### ⚡ FASE 4: Feed RSS/Atom + Preconnect Hints
**Archivos:** `blog/feeds.py`, `blog/urls.py`, `blog_detail.html`

**Cambios:**
- `BlogRSSFeed` y `BlogAtomFeed` creados
- URLs `feed/rss/` y `feed/atom/` registradas
- Links RSS/Atom en `<head>`
- Preconnect hints para Google Fonts

---

### ⚡ FASE 5: Lazy Loading + Artículos Relacionados
**Archivos:** `blog_detail.html`, `views.py`, `blog_detail.css`

**Cambios:**
- Script lazy loading (loading="lazy" + decoding="async" + alt fallback)
- Algoritmo inteligente de relación: categoría+tags → categoría → recientes
- Sección "Artículos relacionados" con grid responsive
- Estilos profesionales (hover, truncado 2 líneas, responsive)

---

## ✅ MEJORAS ADICIONALES (post-Fase 5)

### A. Fallback de imagen OG por defecto
Cuando no hay `cover_image` en el frontmatter, se usa `og-social-share.jpg` automáticamente.

### B. Botón "Compartir en WhatsApp"
Botón verde (#25d366) en la sección de compartir, con enlace a `api.whatsapp.com/send`.

### C. Algoritmo inteligente de artículos relacionados
- **Prioridad 1:** Misma categoría + al menos 1 tag en común
- **Prioridad 2:** Misma categoría (si faltan)
- **Prioridad 3:** Los más recientes (si faltan)
- **Límite:** Siempre máximo 4 tarjetas

---

## 📋 RESUMEN DE FASES

| Fase | Descripción                              | Estado       |
| ---- | ---------------------------------------- | ------------ |
| 1    | Fix Sitemap + OG Tags completos          | ✅ Completada |
| 2    | Schema Breadcrumb (visible + structured) | ✅ Completada |
| 3    | Schema enriquecido + Reading Time        | ✅ Completada |
| 4    | Feed RSS/Atom + Preconnect hints         | ✅ Completada |
| 5    | Lazy Loading + Artículos Relacionados    | ✅ Completada |
| +    | Fallback OG + WhatsApp + Algoritmo IA    | ✅ Completada |

---

## 📋 PENDIENTE — Pruebas manuales

| #   | Prueba                            | Herramienta                                                             |
| --- | --------------------------------- | ----------------------------------------------------------------------- |
| 1   | Sitemap                           | `https://jaimediaz.dev/sitemap.xml`                                     |
| 2   | OG Tags + Preview social          | [Facebook Debugger](https://developers.facebook.com/tools/debug/)       |
| 3   | Twitter Cards                     | [Twitter Card Validator](https://cards-dev.twitter.com/validator)       |
| 4   | Schema.org BlogPosting            | [Google Rich Results Test](https://search.google.com/test/rich-results) |
| 5   | Artículos relacionados            | Navegador — verificar 4 tarjetas al final del artículo                  |
| 6   | Artículos relacionados responsive | Redimensionar ventana a 480px → 1 columna                               |
| 7   | Feed RSS/Atom                     | [Feed Validator](https://validator.w3.org/feed/)                        |

---

## 🔍 CÓMO VALIDAR

### Vista previa de enlace compartido en redes sociales:

| Herramienta                 | Qué muestra                                      |
| --------------------------- | ------------------------------------------------ |
| **Facebook Debugger**       | Preview en Facebook y **WhatsApp** (mismo motor) |
| **Twitter Card Validator**  | Preview en X/Twitter                             |
| **LinkedIn Post Inspector** | Preview en LinkedIn                              |
| **WhatsApp Web**            | Preview real (usa Facebook scraper)              |

### Cómo probar sin deploy:
1. `ngrok http 8000` → genera URL pública
2. Pegar URL en Facebook Debugger
3. Click "Scrape Again" para forzar actualización

### Nota sobre caché:
Facebook/WhatsApp cachean OG tags por ~24-48h. Usar "Scrape Again" para actualizar.

---

## 📝 CÓMO DEFINIR cover_image EN EL FRONTMATTER

```yaml
---
title: "Mi artículo"
description: "Descripción SEO"
category: "Backend"
cover_image: "/static/blogs/mi-articulo/imagen.png"  # 1200x630px ideal
tags: ["django", "python"]
---
```

Sin `cover_image` → se usa `og-social-share.jpg` automáticamente.

---

> 📌 Última actualización: 16/06/2026
> 📌 Aplicable desde HU-012

---

## 🔄 FLUJO COMPLETO: Artículos Relacionados (URL → View → Template)

### Diagrama del flujo

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. USUARIO                                                             │
│     Visita: https://jaimediaz.dev/blog/mi-articulo/                     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. DJANGO URL ROUTER                                                   │
│     blog/urls.py:                                                       │
│       path("<slug:slug>/", BlogDetailView.as_view(),                    │
│            name="blog_detail")                                          │
│     → Captura slug="mi-articulo"                                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. BlogDetailView (views.py)                                           │
│     class BlogDetailView(DetailView):                                   │
│       model = BlogPost                                                  │
│       template_name = "blog/blog_detail.html"                           │
│       slug_field = "slug"                                               │
│                                                                         │
│     → get_queryset():                                                   │
│       Filtra BlogPost por slug, is_published=True                       │
│       (o permite borradores al autor/superuser)                         │
│                                                                         │
│     → get_object():                                                     │
│       Busca el BlogPost con slug="mi-articulo"                          │
│       → self.object = BlogPost instance                                 │
│       → self.object.category = ForeignKey(Category)                     │
│       → self.object.tags = ManyToManyField(Tag)                         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. get_context_data() — Construye el contexto para el template         │
│                                                                         │
│  context = {                                                            │
│    "post": self.object,                    ← El artículo actual         │
│    "comment_form": CommentForm(),          ← Formulario de comentarios  │
│    "comments": get_approved_comments(),    ← Comentarios aprobados     │
│                                                                         │
│    ┌──────────────────────────────────────────────────────────────┐     │
│    │ "related_posts": ─── ALGORITMO INTELIGENTE (5.2)            │     │
│    │                                                              │     │
│    │  PASO 1: Misma categoría + al menos 1 tag en común          │     │
│    │    → BlogPost.objects.filter(                                │     │
│    │        is_published=True,                                    │     │
│    │        category=self.object.category,                        │     │
│    │        tags__in=self.object.tags.all()                       │     │
│    │      ).exclude(id=self.object.id)[:4]                        │     │
│    │                                                              │     │
│    │  PASO 2: Misma categoría (si faltan para llegar a 4)        │     │
│    │    → BlogPost.objects.filter(                                │     │
│    │        is_published=True,                                    │     │
│    │        category=self.object.category                         │     │
│    │      ).exclude(id__in=seen_ids)[:4-len]                      │     │
│    │                                                              │     │
│    │  PASO 3: Los más recientes (si faltan)                       │     │
│    │    → BlogPost.objects.filter(is_published=True)              │     │
│    │      .exclude(id__in=seen_ids)[:4-len]                       │     │
│    │                                                              │     │
│    │  Resultado: queryset de BlogPost → se pasa al template       │     │
│    └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│    "comment_count": 5,                                                  │
│    "comments_status_json": {...},                                       │
│    "pending_comments_json": [...]                                       │
│  }                                                                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. TEMPLATE (blog_detail.html)                                         │
│                                                                         │
│  Recibe: context["related_posts"] = queryset de 0 a 4 BlogPost         │
│                                                                         │
│  {% if related_posts %}                                                 │
│    <section class="jd-related-section">                                 │
│      <h3>Artículos relacionados</h3>                                    │
│      <div class="jd-related-grid">                                      │
│        {% for rpost in related_posts %}                                 │
│          <a href="{% url 'blog:blog_detail' rpost.slug %}">            │
│            <div class="jd-related-img" ...></div>                       │
│            <div class="jd-related-body">                                │
│              <span>{{ rpost.category.name }}</span>                     │
│              <h4>{{ rpost.title }}</h4>                                 │
│              <p>{{ rpost.description|truncatewords:15 }}</p>           │
│            </div>                                                       │
│          </a>                                                           │
│        {% endfor %}                                                     │
│      </div>                                                             │
│    </section>                                                           │
│  {% endif %}                                                            │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  6. NAVEGADOR                                                           │
│     Renderiza: 4 tarjetas clickeables al final del artículo            │
│     Grid responsive: 4→2→1 columna según resolución                    │
│     Hover: elevación + borde morado + sombra                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Variables compartidas en el flujo

| Variable                   | Tipo                  | Origen                    | Destino              |
| -------------------------- | --------------------- | ------------------------- | -------------------- |
| `self.object`              | BlogPost              | `get_object()`            | `get_context_data()` |
| `self.object.category`     | ForeignKey(Category)  | Modelo BlogPost           | Filtro de relación   |
| `self.object.tags`         | ManyToManyField(Tag)  | Modelo BlogPost           | Filtro de relación   |
| `context["related_posts"]` | QuerySet(BlogPost)    | `get_context_data()`      | Template             |
| `context["post"]`          | BlogPost              | `get_object()`            | Template             |
| `context["comments"]`      | QuerySet(BlogComment) | `get_approved_comments()` | Template             |

### Servicios utilizados

| Servicio                             | Función                        | Usado en              |
| ------------------------------------ | ------------------------------ | --------------------- |
| `get_approved_comments(slug, limit)` | Devuelve comentarios aprobados | `get_context_data()`  |
| `get_comment_count(slug)`            | Cuenta total de comentarios    | `get_context_data()`  |
| `BlogPost.objects.filter(...)`       | Query Django ORM               | Algoritmo de relación |
| `BlogPost.objects.exclude(...)`      | Excluye el post actual         | Algoritmo de relación |

### Cómo se carga la vista (paso a paso)

```
1. Usuario visita /blog/mi-articulo/
                    │
2. Django busca en blog/urls.py: <slug:slug>/ → BlogDetailView.as_view()
                    │
3. BlogDetailView hereda de DetailView (Django generic view)
                    │
4. Django ejecuta get_queryset() → BlogPost.objects.filter(slug="mi-articulo")
                    │
5. Django ejecuta get_object() → Retorna BlogPost instance
                    │
6. Django ejecuta get_context_data() → Construye el diccionario de contexto
   ├── post = self.object
   ├── comments = get_approved_comments(slug)
   ├── related_posts = algoritmo inteligente (categoría+tags)
   └── comment_count = get_comment_count(slug)
                    │
7. Django renderiza "blog/blog_detail.html" con el contexto
                    │
8. Template Jinja2 procesa: {% if related_posts %} → 4 tarjetas HTML
                    │
9. Navegador muestra el artículo completo + sección de relacionados
```

### Archivos involucrados

```
blog/
├── urls.py              ← URL routing: <slug:slug>/ → BlogDetailView
├── views.py             ← BlogDetailView con get_context_data()
├── models.py            ← BlogPost (category FK, tags M2M)
├── services.py          ← get_approved_comments(), get_comment_count()
├── feeds.py             ← BlogRSSFeed, BlogAtomFeed (Fase 4)
└── templates/blog/
    └── blog_detail.html ← Template con {% for rpost in related_posts %}

blog/static/blog/css/
└── blog_detail.css      ← Estilos .jd-related-*
```

---

## 🔄 FLUJO COMPLETO: Importación de Blogs (import_blogs)

### Diagrama del flujo de importación

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. USUARIO                                                             │
│     Ejecuta: python manage.py import_blogs                              │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. DJANGO MANAGEMENT COMMAND                                           │
│     blog/management/commands/import_blogs.py → Command.handle()         │
│                                                                         │
│     2.1 Limpia __pycache__ automáticamente                              │
│     2.2 Configura directorios:                                          │
│         SOURCE_DIR = BASE_DIR / "blogs_source"                          │
│         STATIC_TARGET = BASE_DIR / "static" / "blogs"                   │
│     2.3 Resetea secuencias de ID (auto-increment)                       │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. BLOG PROCESSOR (utils/importer/blog_processor.py)                   │
│                                                                         │
│     Para CADA carpeta en blogs_source/:                                 │
│                                                                         │
│     3.1 Lee el slug del nombre de carpeta                               │
│         Ej: "2026-04-26_mejoras_ui_ux" → slug="mejoras_ui_ux"          │
│                                                                         │
│     3.2 Lee blog.md usando markdown_utils.read_markdown_file()          │
│         → Contenido raw del archivo                                     │
│                                                                         │
│     3.3 Parsea frontmatter YAML + contenido markdown                    │
│         → Extrae: title, description, category, tags, cover_image,      │
│           meta_title, meta_description, reading_time, etc.              │
│                                                                         │
│     3.4 Convierte markdown → HTML                                       │
│         → Procesa bloques especiales (:::slides, galerías, etc.)        │
│         → Usa markdown library + BeautifulSoup para limpiar             │
│                                                                         │
│     3.5 Calcula hash del archivo (change detection)                     │
│         → Si el hash no cambió → SKIP (no reimportar)                   │
│         → Si el hash cambió → IMPORTAR                                  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. GUARDADO EN BASE DE DATOS                                           │
│                                                                         │
│     4.1 Busca BlogPost existente por slug                               │
│         → Si existe: actualiza campos (title, description, etc.)        │
│         → Si no existe: crea nuevo BlogPost                             │
│                                                                         │
│     4.2 Asigna o crea Category (si hay category en frontmatter)         │
│     4.3 Asigna o crea Tags (ManyToMany)                                 │
│     4.4 Calcula reading_time si no está en frontmatter                  │
│     4.5 Guarda el BlogPost                                              │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. COPIA DE RECURSOS ESTÁTICOS                                         │
│                                                                         │
│     5.1 Copia imágenes y videos de:                                     │
│         blogs_source/<carpeta>/ → static/blogs/<slug>/                  │
│                                                                         │
│     5.2 Archivos copiados:                                              │
│         .png, .jpg, .jpeg, .gif, .webp (imágenes)                       │
│         .mp4, .webm, .mov, .avi (videos)                                │
│         NO copia blog.md ni frontmatter                                 │
│                                                                         │
│     5.3 Archivos eliminados del destino (si ya no existen en origen)    │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  6. LIMPIEZA AUTOMÁTICA                                                 │
│                                                                         │
│     6.1 Compara slugs procesados vs slugs existentes en BD              │
│     6.2 Elimina BlogPost que ya no tienen carpeta en blogs_source       │
│     6.3 Elimina carpetas en static/blogs/ que ya no corresponden        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  7. RESUMEN FINAL                                                       │
│                                                                         │
│     Muestra en consola:                                                 │
│     - Número de blogs importados                                        │
│     - Número de blogs saltados (sin cambios)                            │
│     - Número de blogs eliminados (limpieza)                             │
│     - Errores encontrados (si los hay)                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Estructura de archivos involucrados

```
blogs_source/                          ← ORIGEN: Carpetas de artículos
├── 2026-04-26_mejoras_ui_ux/
│   ├── blog.md                        ← Markdown + frontmatter YAML
│   ├── imagen1.png                    ← Imágenes del artículo
│   └── video.mp4                      ← Videos del artículo
├── 2026-06-06_mi_nuevo_articulo/
│   ├── blog.md
│   └── image-1.png
└── ...

            │ import_blogs.py ejecuta
            ▼

static/blogs/                          ← DESTINO: Recursos estáticos
├── 2026-04-26_mejoras_ui_ux/
│   ├── imagen1.png                    ← Copiado del origen
│   └── video.mp4
└── ...

            │ BlogProcessor crea/actualiza
            ▼

models.py (BlogPost)                   ← BASE DE DATOS
├── slug = "mejoras_ui_ux"
├── title = "Mejoras UI/UX"
├── description = "..."
├── content_html = "<p>...</p>"        ← Convertido de markdown
├── category = Category("UI/UX")
├── tags = [Tag("django"), Tag("python")]
├── cover_image = "/static/blogs/.../imagen1.png"
├── meta_title = "..."
├── meta_description = "..."
└── reading_time = 5
```

### Comandos útiles

```bash
# Importar todos los blogs
python manage.py import_blogs

# Importar blogs con verbose
python manage.py import_blogs --verbosity 2

# Resetear y reimportar (útil para debugging)
python manage.py import_blogs
```

### Flujo completo: Blog.md → Blog en el navegador

```
1. blog.md (frontmatter + markdown)
   │
2. import_blogs.py lee el archivo
   │
3. BlogProcessor parsea frontmatter YAML
   │  → title, description, category, tags, cover_image, etc.
   │
4. BlogProcessor convierte markdown → HTML
   │  → Procesa :::slides, galerías, código, etc.
   │
5. BlogProcessor guarda en BlogPost (BD)
   │  → Crea o actualiza registro
   │  → Asigna Category y Tags
   │
6. Copia imágenes a static/blogs/<slug>/
   │
7. Navegador: /blog/<slug>/
   │
8. Django: BlogDetailView.get_context_data()
   │  → Carga el BlogPost
   │  → Ejecuta algoritmo de relación (categoría + tags)
   │  → Construye contexto completo
   │
9. Template: blog_detail.html renderiza todo
   │  → OG tags con cover_image o fallback
   │  → Breadcrumb visible
   │  → Artículos relacionados
   │
10. Navegador muestra el artículo completo
```
