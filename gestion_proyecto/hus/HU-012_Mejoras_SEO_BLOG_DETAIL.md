# 📋 HU-012: Mejoras SEO en Blog Detail

> **ID:** HU-012
> **Fecha:** 30/05/2026
> **Responsable:** Cline
> **Estado:** 🟡 En Progreso (Fase 1 completada)
> **Tiempo estimado total:** 5 fases (~15 min cada una)
> **Dependencias:** HU-001 (sistema blogs), HU-001.1 (frontmatter completo)

---

## 🚨 INSTRUCCIONES DE DESARROLLO (LEER ANTES DE EMPEZAR)

> ⚠️ **REGLAS DE ORO PARA IMPLEMENTAR ESTA HU:**

### 🟢 1. Una Fase a la Vez
- Esta HU tiene **5 fases** de aproximadamente **15 minutos cada una**
- **NUNCA** implementes más de una fase en una sola sesión
- Cada fase es **independiente** y se puede probar por separado
- Al terminar cada fase: ✅ probar, ✅ confirmar con el usuario, ✅ pasar a la siguiente

### 🟢 2. Sin Dependencias Nuevas Sin Aprobación
- Todo usa funcionalidad nativa de Django (sitemaps, feeds, templates)
- No se requiere `pip install` ni `npm install`
- Si durante el desarrollo se necesita algo adicional, **preguntar primero**

### 🟢 3. Nunca Romper lo Existente
- Todo lo que funciona hoy debe seguir funcionando mañana
- Cualquier modificación debe ser **aditiva**
- **NUNCA** borrar código existente, solo comentar si es estrictamente necesario

### 🟢 4. Flujo de Trabajo Recomendado
```
Cada fase:
1. Leer la fase completa
2. Implementar los cambios
3. Probar manualmente (verificar con Google Rich Results Test)
4. Confirmar con el usuario
5. PASAR A LA SIGUIENTE FASE
```

---

## 🎯 OBJETIVO

Mejorar el posicionamiento SEO del blog mediante:
1. **Fix crítico**: Registrar BlogPostSitemap en urls.py (actualmente no se incluye)
2. **Meta tags Open Graph completos**: category, tags, twitter:site, og:image:alt
3. **Schema.org Breadcrumb**: Structured data + breadcrumb visible
4. **Schema.org enriquecido**: timeToRead, keywords en BlogPosting
5. **Feed RSS/Atom**: Para distribución y syndication
6. **Performance SEO**: Preconnect hints + lazy loading de imágenes

---

## 📊 ESTADO ACTUAL (AUDITORÍA)

### ✅ Lo que YA funciona bien
- `<title>` con meta_title fallback
- `<meta name="description">` con meta_description fallback
- Canonical URL
- Favicon (múltiples tamaños)
- Robots meta tag (index, follow)
- Author meta tag
- Open Graph básico (title, description, type=article, url, image, published_time, modified_time)
- Twitter Card (summary_large_image)
- Schema.org BlogPosting (headline, description, author, publisher, dates, image)
- BlogPostSitemap (definido pero NO registrado)
- robots.txt con sitemap reference

### 🔴 Lo que falla o falta
1. **BlogPostSitemap NO registrado** en `urls.py` → sitemap.xml solo tiene la home
2. **No hay `article:section`** en OG (categoría del post)
3. **No hay `article:tag`** en OG (etiquetas del post)
4. **No hay `article:publisher`** en OG (link a LinkedIn)
5. **No hay `og:image:alt`** (texto alternativo de imagen OG)
6. **No hay `twitter:site`** ni `twitter:creator` (handles de X/Twitter)
7. **No hay Schema.org BreadcrumbList** (migas de pan)
8. **No hay breadcrumb visible** en el template
9. **No hay `timeToRead`** en Schema.org
10. **No hay `keywords`** en Schema.org BlogPosting
11. **No hay preconnect hints** para Google Fonts
12. **No hay feed RSS/Atom**
13. **No hay lazy loading** en imágenes del contenido
14. **No hay artículos relacionados** (enlaces internos)

---

## 🔧 FASES DE IMPLEMENTACIÓN

---

### ⚡ FASE 1: Fix Sitemap + OG Tags Completos
**Tiempo estimado:** 15 min
**Archivos:** `backend/jdsite/urls.py`, `backend/blog/templates/blog/blog_detail.html`

#### 1.1 Registrar BlogPostSitemap en urls.py

**Archivo:** `backend/jdsite/urls.py`

Cambiar:
```python
from django.contrib.sitemaps.views import sitemap
```
Por:
```python
from django.contrib.sitemaps.views import sitemap
from blog.sitemaps import BlogPostSitemap
```

Cambiar:
```python
sitemaps = {
    "static": StaticViewSitemap,
}
```
Por:
```python
sitemaps = {
    "static": StaticViewSitemap,
    "blog": BlogPostSitemap,
}
```

#### 1.2 Agregar OG Tags faltantes al template

**Archivo:** `backend/blog/templates/blog/blog_detail.html`

Después de la línea:
```html
<meta property="article:author" content="https://www.linkedin.com/in/jdiaz817/" />
```

Agregar:
```html
<!-- ✅ OG: Categoría y Tags -->
{% if post.category %}
  <meta property="article:section" content="{{ post.category.name }}" />
{% endif %}
{% for tag in post.tags.all %}
  <meta property="article:tag" content="{{ tag.name }}" />
{% endfor %}
<meta property="article:publisher" content="https://www.linkedin.com/in/jdiaz817/" />
```

Dentro del bloque `{% if post.cover_image %}` de OG, agregar:
```html
<meta property="og:image:alt" content="{{ post.meta_description|default:post.title }}" />
```

#### 1.3 Agregar Twitter Tags faltantes

Después de:
```html
<meta name="twitter:domain" content="jaimediaz.dev" />
```

Agregar:
```html
<meta name="twitter:site" content="@jdiaz817" />
<meta name="twitter:creator" content="@jdiaz817" />
```

#### ✅ Criterios de aceptación Fase 1
- [x] `sitemap.xml` muestra todos los posts publicados (BlogPostSitemap registrado en urls.py)
- [x] OG tags incluyen `article:section`, `article:tag` y `article:publisher`
- [x] Twitter Cards incluyen `twitter:site` y `twitter:creator`
- [x] `og:image:alt` está presente cuando hay cover_image
- [ ] Google Rich Results Test no muestra errores en BlogPosting (pendiente de prueba manual)

---

### ⚡ FASE 2: Schema.org Breadcrumb (Visible + Structured Data)
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/templates/blog/blog_detail.html`

#### 2.1 Agregar BreadcrumbList schema

Agregar antes del cierre de `</head>`:
```html
<!-- ✅ SCHEMA.ORG BREADCRUMB -->
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Inicio",
            "item": "{{ request.scheme }}://{{ request.get_host }}/"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": "{{ request.scheme }}://{{ request.get_host }}{% url 'blog:blog_list' %}"
        }{% if post.category %},
        {
            "@type": "ListItem",
            "position": 3,
            "name": "{{ post.category.name }}",
            "item": "{{ request.scheme }}://{{ request.get_host }}{% url 'blog:blog_list' %}?category={{ post.category.slug }}"
        }{% endif %},
        {
            "@type": "ListItem",
            "position": {% if post.category %}4{% else %}3{% endif %},
            "name": "{{ post.title|escapejs }}"
        }
    ]
}
</script>
```

#### 2.2 Agregar breadcrumb visible

Dentro de `<article>`, antes del `<header class="jd-article-header">`, agregar:
```html
<!-- ✅ BREADCRUMB NAVEGACIÓN -->
<nav aria-label="Breadcrumb" class="jd-breadcrumb">
  <ol class="jd-breadcrumb-list">
    <li class="jd-breadcrumb-item">
      <a href="{% url 'home' %}">Inicio</a>
    </li>
    <li class="jd-breadcrumb-item">
      <a href="{% url 'blog:blog_list' %}">Blog</a>
    </li>
    {% if post.category %}
    <li class="jd-breadcrumb-item">
      <a href="{% url 'blog:blog_list' %}?category={{ post.category.slug }}">{{ post.category.name }}</a>
    </li>
    {% endif %}
    <li class="jd-breadcrumb-item jd-breadcrumb-current" aria-current="page">
      {{ post.title|truncatewords:8 }}
    </li>
  </ol>
</nav>
```

#### 2.3 Agregar estilos del breadcrumb

En `backend/blog/static/blog/css/blog_detail.css`, agregar:
```css
/* ✅ BREADCRUMB */
.jd-breadcrumb {
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
  font-family: 'DM Sans', sans-serif;
}

.jd-breadcrumb-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.jd-breadcrumb-item {
  display: flex;
  align-items: center;
  color: #9ca3af;
}

.jd-breadcrumb-item + .jd-breadcrumb-item::before {
  content: "›";
  margin-right: 0.5rem;
  color: #d1d5db;
}

.jd-breadcrumb-item a {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s;
}

.jd-breadcrumb-item a:hover {
  color: #2563eb;
}

.jd-breadcrumb-current {
  color: #374151;
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

#### ✅ Criterios de aceptación Fase 2
- [x] Breadcrumb visible funciona con HOME > Blog > Categoría > Artículo
- [x] Schema BreadcrumbList agregado al `<head>`
- [x] Enlace a categoría funciona correctamente
- [x] Responsive: breadcrumb se adapta en móvil (flex-wrap + max-width)

---

### ⚡ FASE 3: Schema.org Enriquecido + Reading Time Preciso
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/templates/blog/blog_detail.html`, `backend/blog/templatetags/blog_filters.py`

#### 3.1 Agregar timeToRead y keywords al BlogPosting schema

Dentro del `<script type="application/ld+json">` del BlogPosting, agregar antes de `datePublished`:
```json
"wordCount": "{{ post.content_html|striptags|wordcount }}",
"timeRequired": "PT{{ post.content_html|striptags|wordcount|divisibleby:200|add:"1" }}M",
```

Dentro del schema, agregar después de `mainEntityOfPage`:
```json
"keywords": [{% for tag in post.tags.all %}"{{ tag.name }}"{% if not forloop.last %}, {% endif %}{% endfor %}],
```

#### 3.2 Crear template tag para reading time preciso

**Archivo:** `backend/blog/templatetags/blog_filters.py`

Agregar al final del archivo:
```python
@register.filter
def reading_time(html_content):
    """Calcula tiempo de lectura preciso (200 palabras por minuto)."""
    import re
    text = re.sub(r'<[^>]+>', '', html_content or '')
    words = len(text.split())
    minutes = max(1, round(words / 200))
    return minutes
```

#### 3.3 Actualizar el reading time visible

En `blog_detail.html`, cambiar:
```html
<span>{% widthratio post.content_html|length 1500 1 %} min de lectura</span>
```
Por:
```html
<span>{{ post.content_html|reading_time }} min de lectura</span>
```

#### ✅ Criterios de aceptación Fase 3
- [x] Schema.org BlogPosting incluye `wordCount` y `timeRequired`
- [x] Schema.org BlogPosting incluye `keywords` con las tags
- [x] Reading time visible es más preciso (template tag `reading_time` basado en 200 palabras/min)
- [ ] Google Rich Results Test no muestra errores (pendiente de prueba manual)

---

### ⚡ FASE 4: Feed RSS/Atom + Preconnect Hints
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/views.py` (o crear `backend/blog/feeds.py`), `backend/blog/urls.py`, `backend/blog/templates/blog/blog_detail.html`

#### 4.1 Crear vista de Feed RSS

**Archivo nuevo:** `backend/blog/feeds.py`
```python
from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Atom1Feed
from blog.models import BlogPost


class BlogRSSFeed(Feed):
    title = "Jaime Díaz - Blog"
    link = "/blog/"
    description = "Artículos sobre desarrollo fullstack, integraciones y tecnología."

    def items(self):
        return BlogPost.objects.filter(is_published=True).order_by("-publish_date")[:20]

    def item_title(self, item):
        return item.meta_title or item.title

    def item_description(self, item):
        return item.meta_description or item.description

    def item_link(self, item):
        return item.get_absolute_url()

    def item_pubdate(self, item):
        return item.publish_date

    def item_updateddate(self, item):
        return item.last_modified

    def item_author_name(self, item):
        return "Jaime Díaz"

    def item_author_link(self, item):
        return "https://www.linkedin.com/in/jdiaz817/"

    def item_categories(self, item):
        categories = []
        if item.category:
            categories.append(item.category.name)
        return categories


class BlogAtomFeed(BlogRSSFeed):
    feed_type = Atom1Feed
    subtitle = BlogRSSFeed.description
```

#### 4.2 Registrar URLs de feed

**Archivo:** `backend/blog/urls.py`

Agregar imports y URLs:
```python
from blog.feeds import BlogRSSFeed, BlogAtomFeed
```

Agregar en `urlpatterns`:
```python
path("feed/rss/", BlogRSSFeed(), name="blog_rss"),
path("feed/atom/", BlogAtomFeed(), name="blog_atom"),
```

#### 4.3 Agregar link RSS/Atom en blog_detail.html

En el `<head>`, agregar:
```html
<!-- ✅ FEED RSS/ATOM -->
<link rel="alternate" type="application/rss+xml" title="Blog RSS" href="{% url 'blog:blog_rss' %}" />
<link rel="alternate" type="application/atom+xml" title="Blog Atom" href="{% url 'blog:blog_atom' %}" />
```

#### 4.4 Agregar preconnect hints para Google Fonts

En el `<head>`, ANTES del `<link href="https://fonts.googleapis.com/...">`, agregar:
```html
<!-- ✅ PRECONNECT HINTS -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

#### ✅ Criterios de aceptación Fase 4
- [x] `/blog/feed/rss/` y `/blog/feed/atom/` registrados (feeds.py + urls.py)
- [x] Links RSS/Atom aparecen en el `<head>` del blog_detail
- [x] Preconnect hints para Google Fonts agregados
- [ ] Google Feed Validator no muestra errores (pendiente de prueba manual)

---

### ⚡ FASE 5: Lazy Loading Imágenes + Artículos Relacionados
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/templates/blog/blog_detail.html`, `backend/blog/views.py`, `backend/blog/static/blog/css/blog_detail.css`

> **Decisión de diseño (Opción D - Más Recientes):**
> Los artículos relacionados se seleccionan como los 4 más recientes del blog (sin filtro por categoría/tags). Esto garantiza:
> - **Siempre visible:** Si el blog tiene al menos 1 artículo adicional, la sección se muestra
> - **Mínimo código:** 3 líneas en views.py, sin lógica condicional compleja
> - **Máxima cobertura:** Funciona para artículos sin categoría ni tags
> - **Contenido fresco:** Los artículos más recientes son inherentemente relevantes

#### 5.1 Agregar lazy loading a imágenes del contenido ✅ YA IMPLEMENTADO

#### 5.2 Agregar related_posts al context de la vista

**Archivo:** `backend/blog/views.py`

En `BlogDetailView.get_context_data`, agregar las siguientes líneas DESPUÉS de `context["comment_form"] = CommentForm()`:

```python
# HU-012: Artículos relacionados (4 más recientes, excluyendo el actual)
context["related_posts"] = BlogPost.objects.filter(
    is_published=True
).exclude(id=self.object.id).order_by("-publish_date")[:4]
```

#### 5.3 Renderizar sección de artículos relacionados en el template

**Archivo:** `backend/blog/templates/blog/blog_detail.html`

Agregar DESPUÉS del `<footer class="jd-article-footer">` y ANTES de `<section id="comments">`:

```html
<!-- ═══════════════════════════════════════
     HU-012: ARTÍCULOS RELACIONADOS
═══════════════════════════════════════ -->
{% if related_posts %}
<section class="jd-related-section">
  <h3 class="jd-related-title">
    <i class="fas fa-book-open me-2"></i>Artículos relacionados
  </h3>
  <div class="jd-related-grid">
    {% for rpost in related_posts %}
      <a href="{% url 'blog:blog_detail' rpost.slug %}" class="jd-related-card">
        {% if rpost.cover_image %}
          <div class="jd-related-img" style="background-image: url('{{ rpost.cover_image }}');"></div>
        {% endif %}
        <div class="jd-related-body">
          {% if rpost.category %}
            <span class="jd-related-category">{{ rpost.category.name }}</span>
          {% endif %}
          <h4 class="jd-related-card-title">{{ rpost.title }}</h4>
          <p class="jd-related-desc">{{ rpost.description|default:''|truncatewords:15 }}</p>
        </div>
      </a>
    {% endfor %}
  </div>
</section>
{% endif %}
```

#### 5.4 Estilos profesionales UI/UX de artículos relacionados

**Archivo:** `backend/blog/static/blog/css/blog_detail.css`

Agregar al FINAL del archivo:

```css
/* ✅ HU-012: ARTÍCULOS RELACIONADOS — diseño profesional */
.jd-related-section {
  margin: 3rem 0 2rem;
  padding-top: 2rem;
  border-top: 1.5px solid #f3f4f6;
}

.jd-related-title {
  font-family: 'Syne', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.jd-related-title i {
  color: #6f42c1;
  font-size: 1rem;
}

.jd-related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.jd-related-card {
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  background: #fff;
  transition: box-shadow .25s ease, transform .25s ease, border-color .25s ease;
}

.jd-related-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
  transform: translateY(-3px);
  border-color: #c4b5fd;
  text-decoration: none;
}

.jd-related-img {
  height: 130px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.jd-related-body {
  padding: .85rem 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: .35rem;
}

.jd-related-category {
  font-size: .7rem;
  font-weight: 600;
  color: #6f42c1;
  text-transform: uppercase;
  letter-spacing: .05em;
  display: inline-block;
}

.jd-related-card-title {
  font-family: 'Syne', sans-serif;
  font-size: .95rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.jd-related-desc {
  font-size: .8rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive: 1 columna en móvil pequeño */
@media (max-width: 480px) {
  .jd-related-grid {
    grid-template-columns: 1fr;
  }
  .jd-related-img {
    height: 160px;
  }
}

/* Responsive: altura de imagen reducida en tablet */
@media (max-width: 767px) {
  .jd-related-img {
    height: 110px;
  }
}
```

#### ✅ Criterios de aceptación Fase 5
- [x] Imágenes del contenido tienen `loading="lazy"` y `decoding="async"`
- [x] Imágenes sin alt obtienen el título del post como alternativa
- [ ] Sección "Artículos relacionados" visible al final del artículo (4 más recientes)
- [ ] Cada tarjeta muestra: imagen (si existe), categoría (si existe), título, descripción
- [ ] Hover: elevación sutil (translateY -3px + sombra) + borde morado
- [ ] Título del artículo truncado a 2 líneas con ellipsis
- [ ] Descripción truncada a 2 líneas con ellipsis
- [ ] Responsive: grid se adapta (4→2→1 columna según resolución)
- [ ] Links navegan correctamente al artículo
- [ ] Coherencia visual con el resto del blog_detail (Syne, DM Sans, colores)

---

## 📋 RESUMEN DE FASES

| Fase | Descripción                              | Tiempo | Prioridad |
| ---- | ---------------------------------------- | ------ | --------- |
| 1    | Fix Sitemap + OG Tags completos          | 15 min | 🔴 CRÍTICA |
| 2    | Schema Breadcrumb (visible + structured) | 15 min | 🟡 ALTA    |
| 3    | Schema enriquecido + Reading Time        | 15 min | 🟡 ALTA    |
| 4    | Feed RSS/Atom + Preconnect hints         | 15 min | 🟢 MEDIA   |
| 5    | Lazy Loading + Artículos Relacionados    | 15 min | 🟢 MEDIA   |

**Tiempo total estimado:** ~75 minutos (5 sesiones)

---

## 🔍 CÓMO VALIDAR

### Herramientas de testing SEO:
1. **Google Rich Results Test:** https://search.google.com/test/rich-results
   - Pegar URL del blog detail → verificar BlogPosting + BreadcrumbList
2. **Google Search Console:** https://search.google.com/search-console
   - Monitorear cobertura de sitemap.xml
3. **Facebook Debugger:** https://developers.facebook.com/tools/debug/
   - Pegar URL del blog detail → verificar OG tags y vista previa del enlace compartido
   - **Útil para:** Ver cómo se ve el artículo al compartirlo en Facebook, Messenger, WhatsApp
4. **Twitter Card Validator:** https://cards-dev.twitter.com/validator
   - Verificar Twitter Cards
5. **Feed Validator:** https://validator.w3.org/feed/
   - Verificar RSS/Atom feed

### Vista previa de enlace compartido en redes sociales:

No necesitas hacer deploy para probar cómo se verá un enlace del blog al compartirlo en WhatsApp, Facebook o Twitter. Usa estas herramientas:

| Herramienta                 | URL                                                                       | Qué muestra                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Facebook Debugger**       | https://developers.facebook.com/tools/debug/                              | Preview exacto de cómo se ve el enlace en Facebook y **WhatsApp** (usa OG tags de Facebook). Muestra título, descripción, imagen y corrige caché. |
| **Twitter Card Validator**  | https://cards-dev.twitter.com/validator                                   | Preview del enlace en X/Twitter con tarjeta grande (summary_large_image).                                                                         |
| **LinkedIn Post Inspector** | https://www.linkedin.com/post-inspector/                                  | Preview del enlace en LinkedIn.                                                                                                                   |
| **WhatsApp Web** (manual)   | Enviar el enlace a ti mismo por WhatsApp Web → ver el preview que genera. | Preview real en WhatsApp. Si Facebook Debugger funciona, WhatsApp también.                                                                        |

### Cómo probar sin deploy (desarrollo local):

1. Usa **ngrok** para exponer tu localhost:
   ```bash
   ngrok http 8000
   ```
   Esto genera una URL pública como `https://abc123.ngrok.io` que apunta a tu servidor local.

2. Copia la URL ngrok + la ruta del artículo, ej: `https://abc123.ngrok.io/blog/mi-articulo/`

3. Pega esa URL en Facebook Debugger → verás el preview exacto con título, descripción, imagen OG y categoría.

### Nota importante sobre caché de redes sociales:

Facebook/WhatsApp cachean los OG tags por ~24 horas. Si cambias los meta tags, usa el botón **"Scrape Again"** en Facebook Debugger para forzar la actualización de la caché.

### Para artículos relacionados:

1. Abre cualquier artículo del blog en el navegador
2. Scrollea al final → debes ver la sección "Artículos relacionados" con 4 tarjetas
3. Cada tarjeta debe ser clickeable y navegar al artículo correcto
4. Redimensiona la ventana a 480px para verificar responsive (1 columna)
5. Verifica en tablet (~768px) que las tarjetas se acomodan en 2-3 columnas
6. Desktop (≥1024px): 4 tarjetas en fila

---

> 📌 Última actualización: 30/05/2026
> 📌 Aplicable desde HU-012