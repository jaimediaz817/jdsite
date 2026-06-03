# 📋 HU-017: Sidebar Inteligente Unificado + Rutas de Aprendizaje (Nave Nodriza)

> **ID:** HU-017
> **Fecha:** 02/06/2026
> **Responsable:** Cline
> **Estado:** 🔵 Pendiente
> **Tiempo estimado total:** 7 fases (~15-20 min cada una)
> **Dependencias:** HU-015 (conceptos), HU-012 Fase 4 (RSS), HU-014 (reading_time)
> **Template único:** `blog/partials/_sidebar.html` (compartido entre blog_list y blog_detail)

---

## 🚨 INSTRUCCIONES DE DESARROLLO (LEER ANTES DE EMPEZAR)

> ⚠️ **REGLAS DE ORO PARA IMPLEMENTAR ESTA HU:**

### 🟢 1. Una Fase a la Vez (Máximo 20 min por fase)
- Esta HU tiene **6 fases** de aproximadamente **15-20 minutos cada una**
- **NUNCA** implementes más de una fase en una sola sesión
- Cada fase es **independiente** y se puede probar por separado
- Al terminar cada fase: ✅ probar, ✅ confirmar con el usuario, ✅ pasar a la siguiente

### 🟢 2. Sin Dependencias Nuevas Sin Aprobación
- Todo usa funcionalidad nativa de Django + Alpine.js (ya incluido)
- No se requiere `pip install` ni `npm install`
- Si durante el desarrollo se necesita algo adicional, **preguntar primero**

### 🟢 3. Nunca Romper lo Existente
- Todo lo que funciona hoy debe seguir funcionando mañana
- Cualquier modificación debe ser **aditiva**
- **NUNCA** borrar código existente, solo comentar si es estrictamente necesario
- El sidebar actual se conserva, solo se agregan nuevos grupos

### 🟢 4. Layout Dual Sidebar (REGLA DE ORO)
- **Sidebar IZQUIERDO** → Solo filtros de busqueda/navegacion (Categorias, Tags, Archivo, Tiempo lectura, RSS)
- **Sidebar DERECHO** → Funcionalidades core y sofisticadas (Conceptos, Populares, Rutas, Minimap, Bookmarks, Toolbar)

> **CRITERIO:** Si BUSCA/FILTRA → IZQUIERDO. Si es CORE/DESCUBRIMIENTO → DERECHO.
> Algunos grupos son contexto-dependientes (ej: ruta activa solo en blog_detail).

---

## 🎯 OBJETIVO

Crear un **sidebar inteligente y unificado** que funcione tanto en el listado de blogs como en el detalle, transformando la navegación lateral en una herramienta de descubrimiento de contenido profesional.

### Capacidades:
1. **Sidebar único**: Mismo HTML, misma lógica, mismo CSS para blog_list y blog_detail
2. **Filtros activos**: Badges con ✕ que muestran qué filtros están aplicados
3. **Tags populares**: Nube de tags filtrable con tamaño según popularidad
4. **Archivo mensual**: Línea de tiempo por año/mes con contadores
5. **Tiempo de lectura**: Filtro rápido (☕ corto, 📖 medio, 📚 largo)
6. **Más populares**: Top artículos por reacciones
7. **RSS/Atom**: Enlaces a feeds de suscripción
8. **Conceptos clave**: (desde HU-015) Navegación temática
9. **🎯 Rutas de Aprendizaje**: Learning paths visuales con progreso
10. **🗺 Content Minimap**: Mapa visual tipo VS Code del contenido completo (LA JOYA NUEVA)

---

## 📊 DIAGRAMA DE DEPENDENCIAS (NAVE NODRIZA)

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    │   HU-017: SIDEBAR INTELIGENTE       │
                    │         (NAVE NODRIZA)               │
                    │                                     │
                    └─────────────────────────────────────┘
                          │          │         │
          ┌───────────────┘          │         └───────────────┐
          │                          │                         │
          ▼                          ▼                         ▼
┌──────────────────┐   ┌────────────────────┐   ┌──────────────────────┐
│   HU-015         │   │  HU-012 Fase 4     │   │  HU-014              │
│  Conceptos       │   │  RSS/Atom Feeds    │   │  Reading Time        │
│  (Fase 4 HU-017) │   │  (Fase 5 HU-017)  │   │  (Fase 3 HU-017)     │
└──────────────────┘   └────────────────────┘   └──────────────────────┘
```

---

## 🎨 MAQUETA VISUAL DEL SIDEBAR

```
┌──────────────────────────────────────────┐
│  🔍 FILTROS ACTIVOS                       │  ← Fase 1
│  [Categoría: APIs] ✕  [Tag: django] ✕    │
│  [Mes: May 2026] ✕                       │
├──────────────────────────────────────────┤
│  🎯 RUTAS DE APRENDIZAJE                  │  ← Fase 6 (joya)
│                                           │
│  🐍 Aprende Django desde cero             │
│  ✅ 1. Introducción a Django             │
│  ▶ 2. Modelos y DB (estás aquí)          │
│  ⏳ 3. Vistas y URLs                     │
│  ⏳ 4. Templates                         │
│  ⏳ 5. APIs REST                         │
│                                           │
│  🔗 Integraciones Zoho                    │
│  ✅ 1. Zoho CRM API                      │
│  ⏳ 2. OAuth con Zoho                    │
│  ...                                      │
├──────────────────────────────────────────┤
│  📁 CATEGORÍAS                            │  ← Fase 1
│  Todas (12)                               │
│  Integraciones (4) ▶                      │
│  Desarrollo (3)                           │
├──────────────────────────────────────────┤
│  🏷 TAGS POPULARES                        │  ← Fase 2
│  [api] [django] [python] [zoho]           │
│  [frontend] [docker] [testing]            │
├──────────────────────────────────────────┤
│  🧠 CONCEPTOS CLAVE                       │  ← Fase 4 (HU-015)
│  [integraciones] [automatización]         │
│  [backend] [api-rest]                     │
├──────────────────────────────────────────┤
│  📅 ARCHIVO                               │  ← Fase 3
│  ▸ 2026 (10)                             │
│    · Mayo (3)                            │
│    · Abril (5)                           │
│    · Marzo (2)                           │
│  ▸ 2025 (4)                              │
│    · Diciembre (2)                       │
├──────────────────────────────────────────┤
│  ⏱ TIEMPO DE LECTURA                     │  ← Fase 3
│  ☕ Rápido <5 min (4)                     │
│  📖 Medio 5-10 min (6)                   │
│  📚 Largo >10 min (2)                    │
├──────────────────────────────────────────┤
│  🔥 MÁS POPULARES                         │  ← Fase 5
│  1. Cómo integrar Zoho CRM               │
│  2. Django REST Framework guide          │
│  3. Buenas prácticas APIs                │
│  4. Automatización con Webhooks          │
├──────────────────────────────────────────┤
│  📡 SUSCRÍBETE                            │  ← Fase 5
│  [RSS Feed]  [Atom Feed]                 │
└──────────────────────────────────────────┘
```

---

## 🔧 FASES DE IMPLEMENTACIÓN

---

### ⚡ FASE 1: Filtros Activos + Categorías con Contadores
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/templates/blog/partials/_sidebar.html`, `backend/blog/views.py`, `backend/blog/static/blog/css/blog_sidebar.css`

#### 1.1 Template filter personalizado para remover parámetros GET
No existe un filtro nativo en Django. En `blog_filters.py`:
```python
@register.simple_tag
def remove_param(request, param):
    """Retorna la query string actual sin el parámetro especificado."""
    query = request.GET.copy()
    query.pop(param, None)
    return query.urlencode()
```

#### 1.2 Agregar sección de filtros activos en _sidebar.html

**Archivo:** `backend/blog/templates/blog/partials/_sidebar.html`

Reemplazar TODO el contenido del sidebar con la nueva estructura (se irá construyendo fase a fase). Para Fase 1:

```html
{% comment %}
Partial template for the blog sidebar (smart filters).
Shared between blog_list.html and blog_detail.html
{% endcomment %}
{% load blog_filters %}

<!-- 🔍 FILTROS ACTIVOS -->
{% if request.GET.category or request.GET.tag or request.GET.month or request.GET.q %}
<div class="jd-af-section">
  <div class="jd-af-header">
    <i class="fas fa-filter"></i>
    <span>Filtros activos</span>
  </div>
  <div class="jd-af-list">
    {% if request.GET.category %}
    <span class="jd-af-badge">
      📁 {{ request.GET.category }}
      <a href="?{% remove_param request 'category' %}" class="jd-af-remove" title="Quitar filtro de categoría">✕</a>
    </span>
    {% endif %}
    {% if request.GET.tag %}
    <span class="jd-af-badge">
      🏷 {{ request.GET.tag }}
      <a href="?{% remove_param request 'tag' %}" class="jd-af-remove" title="Quitar filtro de tag">✕</a>
    </span>
    {% endif %}
    {% if request.GET.month %}
    <span class="jd-af-badge">
      📅 {{ request.GET.month }}
      <a href="?{% remove_param request 'month' %}" class="jd-af-remove" title="Quitar filtro de fecha">✕</a>
    </span>
    {% endif %}
    {% if request.GET.q %}
    <span class="jd-af-badge">
      🔍 "{{ request.GET.q|truncatechars:20 }}"
      <a href="?{% remove_param request 'q' %}" class="jd-af-remove" title="Quitar búsqueda">✕</a>
    </span>
    {% endif %}
  </div>
  <a href="?" class="jd-af-clear">Limpiar todo</a>
</div>
{% endif %}

<!-- 📁 CATEGORÍAS -->
<div x-data="{ open: true }" class="sidebar-menu">
  <h2 class="sidebar-title" @click="open = !open" role="button" tabindex="0">
    📁 Categorías
    <i class="fas fa-chevron-down arrow" :class="{'rotate-180': open}" style="float: right;"></i>
  </h2>
  <ul class="category-list" x-show="open" x-collapse x-transition>
    <li class="category-item {% if not request.GET.category %}active{% endif %}">
      <a href="?" class="category-link">Todas las categorías</a>
    </li>
    {% for cat in categories %}
    <li class="category-item {% if request.GET.category == cat.slug %}active{% endif %}">
      <a href="?category={{ cat.slug }}" class="category-link">
        {{ cat.name }}
        <span class="category-count">({{ cat.posts_count }})</span>
      </a>
    </li>
    {% endfor %}
  </ul>
</div>
```

#### 1.3 Pasar contadores de posts por categoría

**Archivo:** `backend/blog/views.py`

En `BlogListView.get_context_data`, reemplazar:
```python
context["categories"] = Category.objects.all()
```
Por:
```python
from django.db.models import Count
context["categories"] = Category.objects.filter(
    is_active=True
).annotate(
    posts_count=Count("posts", filter=Q(posts__is_published=True))
).filter(posts_count__gt=0).order_by("name")
```

#### 1.4 Estilos para filtros activos

**Archivo:** `backend/blog/static/blog/css/blog_sidebar.css`

Agregar al final:
```css
/* ═══════════════════════════════════════
   HU-017: FILTROS ACTIVOS
   ═══════════════════════════════════════ */
.jd-af-section {
  background: #f0f4ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 1rem;
}

.jd-af-header {
  font-family: 'Syne', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1d4ed8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.jd-af-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.jd-af-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 100px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  color: #1e40af;
}

.jd-af-remove {
  color: #ef4444;
  text-decoration: none;
  font-size: 0.7rem;
  margin-left: 2px;
  font-weight: 700;
}

.jd-af-remove:hover {
  color: #dc2626;
}

.jd-af-clear {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  color: #6b7280;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.jd-af-clear:hover {
  color: #ef4444;
}

/* Contador de posts en categorías */
.category-count {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 400;
}
```

#### ✅ Criterios de aceptación Fase 1
- [ ] Filtros activos se muestran con badges y botón ✕ para quitar cada uno
- [ ] Categorías muestran contador de posts: `Integraciones (4)`
- [ ] "Limpiar todo" quita todos los filtros
- [ ] Responsive: filtros activos se ven bien en móvil

---

### ⚡ FASE 2: Tags Populares (Nube de Tags)
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/views.py`, `backend/blog/templates/blog/partials/_sidebar.html`, `backend/blog/static/blog/css/blog_sidebar.css`, `backend/blog/templatetags/blog_filters.py`

#### 2.1 Pasar tags al contexto

**Archivo:** `backend/blog/views.py`

En `BlogListView.get_context_data`, agregar:
```python
from django.db.models import Count

# Tags populares (más usados)
context["sidebar_tags"] = Tag.objects.filter(
    is_active=True,
    posts__is_published=True
).annotate(
    post_count=Count("posts")
).filter(post_count__gt=0).order_by("-post_count")[:20]
```

#### 2.2 Template filter para tamaño de fuente en nube

**Archivo:** `backend/blog/templatetags/blog_filters.py`

```python
@register.filter
def tag_cloud_size(count):
    """Devuelve clase de tamaño para nube de tags según popularidad."""
    if count >= 4:
        return "jd-tag-cloud-xl"
    elif count >= 3:
        return "jd-tag-cloud-lg"
    elif count >= 2:
        return "jd-tag-cloud-md"
    else:
        return "jd-tag-cloud-sm"
```

#### 2.3 Agregar sección en sidebar

**Archivo:** `backend/blog/templates/blog/partials/_sidebar.html`

Después del bloque de Categorías, agregar:

```html
<!-- 🏷 TAGS POPULARES -->
{% if sidebar_tags %}
<div x-data="{ open_tags: true }" class="sidebar-menu">
  <h2 class="sidebar-title" @click="open_tags = !open_tags" role="button" tabindex="0">
    🏷 Tags populares
    <i class="fas fa-chevron-down arrow" :class="{'rotate-180': open_tags}" style="float: right;"></i>
  </h2>
  <div class="jd-tag-cloud" x-show="open_tags" x-collapse x-transition>
    {% for tag in sidebar_tags %}
    <a href="?tag={{ tag.slug }}"
       class="jd-tag-cloud-item {{ tag.post_count|tag_cloud_size }}{% if request.GET.tag == tag.slug %} active{% endif %}"
       title="{{ tag.post_count }} artículo{{ tag.post_count|pluralize:'s' }}">
      {{ tag.name }}
    </a>
    {% endfor %}
  </div>
</div>
{% endif %}
```

#### 2.4 Estilos de nube de tags

**Archivo:** `backend/blog/static/blog/css/blog_sidebar.css`

```css
/* ═══════════════════════════════════════
   HU-017: TAG CLOUD
   ═══════════════════════════════════════ */
.jd-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
}

.jd-tag-cloud-item {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 100px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  color: #6b7280;
  font-family: 'DM Sans', sans-serif;
  text-decoration: none;
  transition: all 0.2s ease;
  line-height: 1.3;
}

.jd-tag-cloud-item:hover {
  background: #f0e6ff;
  border-color: #c4a8f5;
  color: #6f42c1;
  transform: translateY(-1px);
}

.jd-tag-cloud-item.active {
  background: #6f42c1;
  border-color: #6f42c1;
  color: #fff;
}

/* Tamaños según popularidad */
.jd-tag-cloud-sm { font-size: 0.7rem; }
.jd-tag-cloud-md { font-size: 0.78rem; font-weight: 500; }
.jd-tag-cloud-lg { font-size: 0.85rem; font-weight: 600; }
.jd-tag-cloud-xl { font-size: 0.95rem; font-weight: 700; }
```

#### 2.5 Agregar filtro por tag en el queryset

**Archivo:** `backend/blog/views.py`

En `BlogListView.get_queryset`, después del filtro por `category_slug`:
```python
tag_slug = self.request.GET.get("tag")
if tag_slug:
    qs = qs.filter(tags__slug=tag_slug)
```

#### ✅ Criterios de aceptación Fase 2
- [ ] Tags se muestran en nube con tamaños variables según popularidad
- [ ] Al hacer clic en un tag, se filtra el listado
- [ ] El tag activo se resalta visualmente
- [ ] Al menos 20 tags más populares se muestran

---

### ⚡ FASE 3: Archivo Mensual + Tiempo de Lectura
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/views.py`, `backend/blog/templates/blog/partials/_sidebar.html`, `blog_detail.html` (para pasar contexto)

#### 3.1 Query de archivo mensual

**Archivo:** `backend/blog/views.py`

En `BlogListView.get_context_data`:
```python
from django.db.models.functions import TruncMonth

# Archivo mensual
archive_dates = BlogPost.objects.filter(
    is_published=True
).annotate(
    month=TruncMonth("publish_date")
).values("month").annotate(
    count=Count("id")
).order_by("-month")

# Agrupar por año para el acordeón
archive_by_year = {}
for entry in archive_dates:
    year = entry["month"].year
    if year not in archive_by_year:
        archive_by_year[year] = []
    archive_by_year[year].append({
        "month": entry["month"],
        "label": entry["month"].strftime("%B"),
        "count": entry["count"]
    })

context["archive_by_year"] = dict(sorted(archive_by_year.items(), reverse=True))
```

Para BlogDetailView, pasar el mismo contexto (la data es la misma, no depende del post actual).

#### 3.2 Agregar secciones en sidebar

**Archivo:** `backend/blog/templates/blog/partials/_sidebar.html`

```html
<!-- 📅 ARCHIVO -->
{% if archive_by_year %}
<div x-data="{ open_arch: true }" class="sidebar-menu">
  <h2 class="sidebar-title" @click="open_arch = !open_arch" role="button" tabindex="0">
    📅 Archivo
    <i class="fas fa-chevron-down arrow" :class="{'rotate-180': open_arch}" style="float: right;"></i>
  </h2>
  <div class="jd-archive" x-show="open_arch" x-collapse x-transition>
    {% for year, months in archive_by_year.items %}
    <div x-data="{ open_year: false }" class="jd-archive-year">
      <button @click="open_year = !open_year" class="jd-archive-year-btn">
        {{ year }}
        <span class="jd-archive-count">{{ months|length }}</span>
        <i class="fas fa-chevron-down jd-archive-chevron" :class="{'rotate-180': open_year}"></i>
      </button>
      <div class="jd-archive-months" x-show="open_year" x-collapse>
        {% for m in months %}
        <a href="?month={{ m.month|date:'Y-m' }}"
           class="jd-archive-month{% if request.GET.month == m.month|date:'Y-m' %} active{% endif %}">
          {{ m.label }}
          <span class="jd-archive-count">{{ m.count }}</span>
        </a>
        {% endfor %}
      </div>
    </div>
    {% endfor %}
  </div>
</div>
{% endif %}
```

#### 3.3 Tiempo de lectura en sidebar

**Archivo:** `backend/blog/templates/blog/partials/_sidebar.html`

```html
<!-- ⏱ TIEMPO DE LECTURA -->
{% if reading_time_filters %}
<div x-data="{ open_time: true }" class="sidebar-menu">
  <h2 class="sidebar-title" @click="open_time = !open_time" role="button" tabindex="0">
    ⏱ Tiempo de lectura
    <i class="fas fa-chevron-down arrow" :class="{'rotate-180': open_time}" style="float: right;"></i>
  </h2>
  <div class="jd-reading-time" x-show="open_time" x-collapse x-transition>
    <a href="?reading=short" class="jd-rt-item{% if request.GET.reading == 'short' %} active{% endif %}">
      <span class="jd-rt-icon">☕</span>
      <span class="jd-rt-label">Rápido <5 min</span>
      <span class="jd-rt-count">{{ reading_time_filters.short }}</span>
    </a>
    <a href="?reading=medium" class="jd-rt-item{% if request.GET.reading == 'medium' %} active{% endif %}">
      <span class="jd-rt-icon">📖</span>
      <span class="jd-rt-label">Medio 5-10 min</span>
      <span class="jd-rt-count">{{ reading_time_filters.medium }}</span>
    </a>
    <a href="?reading=long" class="jd-rt-item{% if request.GET.reading == 'long' %} active{% endif %}">
      <span class="jd-rt-icon">📚</span>
      <span class="jd-rt-label">Largo >10 min</span>
      <span class="jd-rt-count">{{ reading_time_filters.long }}</span>
    </a>
  </div>
</div>
{% endif %}
```

#### 3.4 Pasar counts de reading time

En `BlogListView.get_context_data`:
```python
from django.db.models import Q, Count

context["reading_time_filters"] = {
    "short": BlogPost.objects.filter(is_published=True, reading_time__lte=5).count(),
    "medium": BlogPost.objects.filter(is_published=True, reading_time__gt=5, reading_time__lte=10).count(),
    "long": BlogPost.objects.filter(is_published=True, reading_time__gt=10).count(),
}
```

#### 3.5 Filtro en queryset por reading time

En `BlogListView.get_queryset`:
```python
reading_mode = self.request.GET.get("reading")
if reading_mode == "short":
    qs = qs.filter(reading_time__lte=5)
elif reading_mode == "medium":
    qs = qs.filter(reading_time__gt=5, reading_time__lte=10)
elif reading_mode == "long":
    qs = qs.filter(reading_time__gt=10)
```

#### ✅ Criterios de aceptación Fase 3
- [ ] Archivo mensual muestra años expandibles con meses
- [ ] Cada mes tiene contador de artículos
- [ ] Filtro por tiempo de lectura funciona (short/medium/long)
- [ ] Contadores de reading time son precisos

---

### ⚡ FASE 4: Conceptos Clave (Sidebar DERECHO — funcionalidad core)
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/templates/blog/partials/_sidebar_right.html`, `backend/blog/views.py`

> ⚠️ **Requiere HU-015 implementada** (modelo Concept existente en DB)
> **NOTA:** Conceptos va en el DERECHO porque es funcionalidad core de descubrimiento temático, NO un filtro.

#### 4.1 Pasar conceptos al contexto

En `BlogListView.get_context_data` (para el sidebar derecho):
```python
# Conceptos clave (desde HU-015)
context["sidebar_concepts"] = Concept.objects.filter(
    is_active=True,
    posts__is_published=True
).annotate(
    post_count=Count("posts")
).filter(post_count__gt=0).order_by("-post_count")[:15]
```

#### 4.2 Agregar sección en _sidebar_right.html

```html
<!-- 🧠 CONCEPTOS CLAVE -->
{% if sidebar_concepts %}
<div x-data="{ open_conc: true }" class="sidebar-menu">
  <h2 class="sidebar-title" @click="open_conc = !open_conc" role="button" tabindex="0">
    🧠 Conceptos clave
    <i class="fas fa-chevron-down arrow" :class="{'rotate-180': open_conc}" style="float: right;"></i>
  </h2>
  <div class="jd-tag-cloud" x-show="open_conc" x-collapse x-transition>
    {% for concept in sidebar_concepts %}
    <a href="?concept={{ concept.slug }}"
       class="jd-concept-sidebar-item{% if request.GET.concept == concept.slug %} active{% endif %}">
      {{ concept.name }}
    </a>
    {% endfor %}
  </div>
</div>
{% endif %}
```

#### ✅ Criterios de aceptación Fase 4
- [ ] Conceptos se muestran en sidebar (si HU-015 implementada)
- [ ] Al hacer clic, filtra el listado
- [ ] Si HU-015 no está, la sección simplemente no aparece

---

### ⚡ FASE 5: RSS Feed (Sidebar IZQUIERDO — filtro)
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/views.py`, `backend/blog/templates/blog/partials/_sidebar_left.html`

> **NOTA:** RSS es un filtro de suscripcion (IZQUIERDO). Los "Mas Populares" son funcionalidad CORE (DERECHO), pero ya estan contemplados en Fase 1 como parte de la seccion de descubrimiento.

#### 5.1 Query de posts más populares

En `BlogListView.get_context_data`:
```python
# Más populares (top 5 por reacciones)
from reactions.services import get_top_reacted_posts
popular_slugs = get_top_reacted_posts(limit=5)  # Devuelve slugs
if popular_slugs:
    context["popular_posts"] = BlogPost.objects.filter(
        slug__in=popular_slugs,
        is_published=True
    )
else:
    # Fallback: más recientes si no hay reacciones
    context["popular_posts"] = BlogPost.objects.filter(
        is_published=True
    ).order_by("-publish_date")[:5]
```

#### 5.2 Secciones en sidebar

```html
<!-- 🔥 MÁS POPULARES -->
{% if popular_posts %}
<div x-data="{ open_pop: true }" class="sidebar-menu">
  <h2 class="sidebar-title" @click="open_pop = !open_pop" role="button" tabindex="0">
    🔥 Más populares
    <i class="fas fa-chevron-down arrow" :class="{'rotate-180': open_pop}" style="float: right;"></i>
  </h2>
  <div class="jd-popular-list" x-show="open_pop" x-collapse x-transition>
    {% for ppost in popular_posts %}
    <a href="{{ ppost.get_absolute_url }}" class="jd-popular-item">
      <span class="jd-popular-rank">{{ forloop.counter }}</span>
      <div class="jd-popular-info">
        <span class="jd-popular-title">{{ ppost.title|truncatechars:40 }}</span>
        <span class="jd-popular-meta">
          {{ ppost.publish_date|date:"d M Y" }} · {{ ppost.reading_time|default:"5" }} min
        </span>
      </div>
    </a>
    {% endfor %}
  </div>
</div>
{% endif %}

<!-- 📡 SUSCRÍBETE -->
<div x-data="{ open_rss: true }" class="sidebar-menu">
  <h2 class="sidebar-title" @click="open_rss = !open_rss" role="button" tabindex="0">
    📡 Suscríbete
    <i class="fas fa-chevron-down arrow" :class="{'rotate-180': open_rss}" style="float: right;"></i>
  </h2>
  <div class="jd-rss-links" x-show="open_rss" x-collapse x-transition>
    <a href="{% url 'blog:blog_rss' %}" class="jd-rss-link" target="_blank" rel="noopener">
      <i class="fas fa-rss" style="color: #ee802f;"></i>
      RSS Feed
    </a>
    <a href="{% url 'blog:blog_atom' %}" class="jd-rss-link" target="_blank" rel="noopener">
      <i class="fas fa-atom" style="color: #6f42c1;"></i>
      Atom Feed
    </a>
  </div>
</div>
```

#### 5.3 Estilos

```css
/* 🔥 POPULARES */
.jd-popular-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.jd-popular-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.15s;
}

.jd-popular-item:hover {
  background: #f3f4f6;
  text-decoration: none;
}

.jd-popular-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #6f42c1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.jd-popular-info {
  flex: 1;
  min-width: 0;
}

.jd-popular-title {
  display: block;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.3;
}

.jd-popular-meta {
  display: block;
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 2px;
}

/* 📡 RSS */
.jd-rss-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.jd-rss-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
  transition: background 0.15s;
  border: 1px solid #e5e7eb;
}

.jd-rss-link:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  text-decoration: none;
}

.jd-rss-link i {
  font-size: 1rem;
}
```

#### ✅ Criterios de aceptación Fase 5
- [ ] Top 5 populares se muestran con ranking numérico
- [ ] RSS y Atom links funcionan
- [ ] Si no hay reacciones, fallback a más recientes

---

### ⚡ FASE 6: 🎯 Rutas de Aprendizaje (Learning Paths)
**Tiempo estimado:** 20 min
**Archivos:** `backend/blog/templates/blog/partials/_sidebar.html`, `backend/blog/templates/blog/blog_detail.html`, `backend/blog/views.py`, `backend/blog/static/blog/css/blog_sidebar.css`, `backend/blog/static/blog/css/blog_detail.css`

#### 6.1 Frontmatter en los .md

Cada artículo de una ruta lleva en su frontmatter:
```yaml
---
ruta_aprendizaje: "aprende-django"         # ID de la ruta
orden_ruta: 3                              # Posición en la secuencia
titulo_ruta: "🐍 Aprende Django desde cero" # Título visible de la ruta
```

#### 6.2 Modelo (sin migración, se usa campo JSON o CharField)

No se requiere nuevo modelo. Los datos se leen del frontmatter. Pero para consultas eficientes, agregar campo en BlogPost:

```python
# HU-017: Ruta de aprendizaje
ruta_id = models.CharField(
    max_length=100, blank=True, null=True,
    db_index=True,
    help_text="ID de la ruta de aprendizaje (learning path)"
)
ruta_order = models.PositiveIntegerField(
    blank=True, null=True,
    help_text="Orden dentro de la ruta"
)
ruta_title = models.CharField(
    max_length=200, blank=True, null=True,
    help_text="Título visible de la ruta"
)
```

> ⚠️ Requiere migración: `python manage.py makemigrations blog && python manage.py migrate blog`

#### 6.3 Contexto en BlogDetailView

```python
# 🎯 HU-017: Ruta de aprendizaje
if self.object.ruta_id:
    ruta_posts = BlogPost.objects.filter(
        is_published=True,
        ruta_id=self.object.ruta_id
    ).order_by("ruta_order")
    
    current_index = None
    for i, rp in enumerate(ruta_posts):
        if rp.id == self.object.id:
            current_index = i
            break
    
    context["ruta_posts"] = ruta_posts
    context["ruta_current_index"] = current_index
    context["ruta_title"] = self.object.ruta_title
    context["ruta_prev_post"] = ruta_posts[current_index - 1] if current_index and current_index > 0 else None
    context["ruta_next_post"] = ruta_posts[current_index + 1] if current_index is not None and current_index < len(ruta_posts) - 1 else None
```

#### 6.4 Sección en sidebar (blog_detail)

```html
<!-- 🎯 RUTAS DE APRENDIZAJE -->
{% if ruta_posts %}
<div class="sidebar-menu jd-learning-path">
  <h2 class="sidebar-title jd-lp-title">
    {{ ruta_title }}
  </h2>
  <div class="jd-lp-list">
    {% for rpost in ruta_posts %}
    <a href="{{ rpost.get_absolute_url }}"
       class="jd-lp-item
              {% if rpost.id == post.id %}jd-lp-current{% endif %}
              {% if forloop.counter0 < ruta_current_index %}jd-lp-done{% endif %}
              {% if forloop.counter0 > ruta_current_index %}jd-lp-pending{% endif %}">
      <span class="jd-lp-status">
        {% if forloop.counter0 < ruta_current_index %}
          ✅
        {% elif rpost.id == post.id %}
          ▶
        {% else %}
          {{ forloop.counter }}
        {% endif %}
      </span>
      <span class="jd-lp-text">{{ rpost.title|truncatechars:35 }}</span>
    </a>
    {% endfor %}
  </div>
</div>
{% endif %}
```

#### 6.5 Barra de progreso en blog_detail (encima del contenido)

```html
<!-- 🎯 BARRA DE PROGRESO DE RUTA -->
{% if ruta_posts %}
<div class="jd-lp-progress-bar">
  <div class="jd-lp-progress-header">
    <span class="jd-lp-progress-label">
      <i class="fas fa-map-signs"></i>
      {{ ruta_title }}
    </span>
    <span class="jd-lp-progress-counter">{{ ruta_current_index|add:1 }} de {{ ruta_posts|length }}</span>
  </div>
  <div class="jd-lp-steps">
    {% for rpost in ruta_posts %}
    <div class="jd-lp-step
                {% if forloop.counter0 < ruta_current_index %}jd-step-done{% endif %}
                {% if rpost.id == post.id %}jd-step-current{% endif %}
                {% if forloop.counter0 > ruta_current_index %}jd-step-pending{% endif %}">
      <div class="jd-step-dot">
        {% if forloop.counter0 < ruta_current_index %}
          <i class="fas fa-check"></i>
        {% elif rpost.id == post.id %}
          <i class="fas fa-circle"></i>
        {% else %}
          {{ forloop.counter }}
        {% endif %}
      </div>
    </div>
    {% endfor %}
  </div>
  <div class="jd-lp-nav">
    {% if ruta_prev_post %}
      <a href="{{ ruta_prev_post.get_absolute_url }}" class="jd-lp-nav-btn">
        <i class="fas fa-arrow-left"></i> Anterior
      </a>
    {% else %}
      <span></span>
    {% endif %}
    <span class="jd-lp-nav-label">Artículo {{ ruta_current_index|add:1 }}</span>
    {% if ruta_next_post %}
      <a href="{{ ruta_next_post.get_absolute_url }}" class="jd-lp-nav-btn">
        Siguiente <i class="fas fa-arrow-right"></i>
      </a>
    {% else %}
      <span></span>
    {% endif %}
  </div>
</div>
{% endif %}
```

#### 6.6 Estilos de las rutas

**Archivo:** `backend/blog/static/blog/css/blog_sidebar.css`

```css
/* ═══════════════════════════════════════
   HU-017: RUTAS DE APRENDIZAJE
   ═══════════════════════════════════════ */
.jd-learning-path {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 10px 12px;
}

.jd-lp-title {
  font-size: 0.85rem !important;
  color: #166534 !important;
  margin-bottom: 8px !important;
}

.jd-lp-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.jd-lp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  text-decoration: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  transition: all 0.15s;
}

.jd-lp-done {
  color: #16a34a;
  background: transparent;
}

.jd-lp-done:hover {
  background: #f0fdf4;
}

.jd-lp-current {
  background: #166534;
  color: #fff;
  font-weight: 600;
}

.jd-lp-current:hover {
  background: #15803d;
}

.jd-lp-pending {
  color: #6b7280;
}

.jd-lp-pending:hover {
  background: #f9fafb;
  color: #374151;
}

.jd-lp-status {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.jd-lp-current .jd-lp-status {
  background: rgba(255,255,255,0.2);
}

.jd-lp-done .jd-lp-status {
  background: #dcfce7;
}

.jd-lp-pending .jd-lp-status {
  background: #f3f4f6;
}

.jd-lp-text {
  line-height: 1.2;
}
```

**Archivo:** `backend/blog/static/blog/css/blog_detail.css`

```css
/* ═══════════════════════════════════════
   HU-017: BARRA DE PROGRESO RUTAS
   ═══════════════════════════════════════ */
.jd-lp-progress-bar {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
}

.jd-lp-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.jd-lp-progress-label {
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #166534;
  display: flex;
  align-items: center;
  gap: 8px;
}

.jd-lp-progress-counter {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: #16a34a;
  font-weight: 600;
}

.jd-lp-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
}

.jd-lp-steps::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #d1d5db;
  transform: translateY(-50%);
  z-index: 0;
}

.jd-lp-step {
  position: relative;
  z-index: 1;
  background: #fff;
  border-radius: 50%;
  padding: 2px;
}

.jd-step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
}

.jd-step-done .jd-step-dot {
  background: #16a34a;
  color: #fff;
}

.jd-step-current .jd-step-dot {
  background: #166534;
  color: #fff;
  box-shadow: 0 0 0 4px #bbf7d0;
  animation: jd-lp-pulse 2s infinite;
}

.jd-step-pending .jd-step-dot {
  background: #e5e7eb;
  color: #9ca3af;
}

@keyframes jd-lp-pulse {
  0%, 100% { box-shadow: 0 0 0 4px #bbf7d0; }
  50% { box-shadow: 0 0 0 8px rgba(22, 101, 52, 0.2); }
}

.jd-lp-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.jd-lp-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 100px;
  background: #166534;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
  border: none;
  cursor: pointer;
}

.jd-lp-nav-btn:hover {
  background: #15803d;
  color: #fff;
  text-decoration: none;
}

.jd-lp-nav-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  color: #6b7280;
  font-weight: 500;
}
```

#### 6.7 Importar ruta desde frontmatter

**Archivo:** `backend/blog/utils/importer/blog_processor.py`

Dentro del procesamiento de frontmatter:
```python
# 🎯 HU-017: Ruta de aprendizaje
post.ruta_id = frontmatter.get("ruta_aprendizaje", None)
post.ruta_order = frontmatter.get("orden_ruta", None)
post.ruta_title = frontmatter.get("titulo_ruta", None)
```

#### ✅ Criterios de aceptación Fase 6
- [ ] Artículos con `ruta_aprendizaje` en frontmatter se agrupan en learning paths
- [ ] En blog_detail, la barra de progreso muestra todos los pasos
- [ ] La barra indica: ✅ completado, ▶ actual, ⏳ pendiente
- [ ] Botones "Anterior" y "Siguiente" navegan dentro de la ruta
- [ ] En sidebar, la ruta se muestra con el mismo estado visual
- [ ] Al completar una ruta, se ve visualmente el logro

---

### ⚡ FASE 7: 🗺 Content Minimap — LA JOYA NUEVA
**Tiempo estimado:** 20 min
**Archivos:** `backend/blog/templates/blog/blog_detail.html`, `backend/blog/static/blog/js/blog_detail.js`, `backend/blog/static/blog/css/blog_detail.css`

> **Inspirado en:** El minimap de VS Code / Sublime Text pero orientado a contenido de conocimiento.

#### 7.1 ¿Qué es el Content Minimap?

Un **mapa visual en miniatura** del artículo completo que se renderiza como una barra lateral derecha (o flotante). Muestra:

- **Bloques de texto** → líneas finas grises
- **Imágenes** → bloques coloridos (miniatura real o placeholder)
- **Videos/Slides** → bloques morados con ▶
- **Código** → bloques oscuros
- **Listas** → puntos alineados
- **Headers/H2** → etiquetas con título abreviado
- **Tu posición actual** → highlight semitransparente

Al hacer **click en cualquier zona del minimap**, se hace **scroll suave** a esa porción exacta del artículo.

```
┌─ MINIMAP ──────────────────┐
│                            │
│ ══════════════════ (H1)   │
│ ───────────────────        │
│ ───────────────────        │
│ ───────────────────        │
│ ═══ H2: Introducción      │
│ ───────────────────        │
│ ───────────────────        │
│ ┌──────────────────┐       │
│ │  🖼 imagen        │       │
│ │  (miniatura real) │       │
│ └──────────────────┘       │
│ ═══ H2: Modelos           │
│ ───────────────────        │
│ ┌──────────────────┐       │
│ │  ▶ video/youtube  │       │
│ └──────────────────┘       │
│ ┌──────────────────┐       │
│ │  {} código        │       │
│ │  (bloque oscuro)  │       │
│ └──────────────────┘       │
│ ═══ H2: Conclusión        │
│ ───────────────────        │
│ ───────────────────        │
│                            │
│ ════════════════════(TÚ)  │
│                            │
│ ┌──────────────────┐       │
│ │  🖼 imagen        │       │
│ └──────────────────┘       │
│ ═══ H2: Referencias       │
│ ───────────────────        │
│                            │
└────────────────────────────┘
```

#### 7.2 Posicionamiento

| Opción                        | Descripción                                         | Recomendación                          |
| ----------------------------- | --------------------------------------------------- | -------------------------------------- |
| **A) Barra lateral derecha**  | Sticky, similar a TOC sidebar pero del lado derecho | ✅ **Recomendado** — no compite con TOC |
| **B) Floating overlay**       | Se muestra al lado del scroll, se oculta con hover  | Bueno para móvil                       |
| **C) Dentro del TOC sidebar** | Agregar minimap debajo de la tabla de contenidos    | Más compacto                           |

**Recomendación:** Opción A — barra lateral derecha fija (sticky), solo en desktop (>1024px). En móvil, se activa como overlay al hacer scroll.

#### 7.3 Cómo se construye (SIN modelos nuevos)

El minimap se construye **enteramente en JavaScript** analizando el DOM de `.blog-content`:

```javascript
// ═══════════════════════════════════════════════
// HU-017 FASE 7: CONTENT MINIMAP
// ═══════════════════════════════════════════════

(function() {
    'use strict';

    const MINIMAP_WIDTH = 120;  // px
    const MINIMAP_HEIGHT_FACTOR = 0.3; // 30% del alto del contenido

    function buildMinimap() {
        const content = document.querySelector('.blog-content');
        if (!content) return;

        // Crear contenedor del minimap
        const minimap = document.createElement('div');
        minimap.className = 'jd-minimap';
        minimap.setAttribute('role', 'navigation');
        minimap.setAttribute('aria-label', 'Mapa del artículo');

        // Obtener todos los hijos directos del contenido
        const children = Array.from(content.children);
        const contentHeight = content.offsetHeight;
        const minimapScale = (contentHeight * MINIMAP_HEIGHT_FACTOR) / contentHeight;

        children.forEach((child) => {
            const block = createBlock(child, minimapScale, content);
            if (block) minimap.appendChild(block);
        });

        // Agregar indicador de posición actual
        const viewportIndicator = document.createElement('div');
        viewportIndicator.className = 'jd-minimap-viewport';
        minimap.appendChild(viewportIndicator);

        // Posicionar el minimap
        const wrapper = document.querySelector('.blog-detail-minimap-wrapper');
        if (wrapper) wrapper.appendChild(minimap);

        // Eventos
        setupMinimapScroll(minimap, content);
        updateViewportIndicator(minimap, content);
    }

    function createBlock(element, scale, content) {
        const tag = element.tagName.toLowerCase();
        const block = document.createElement('div');
        const height = Math.max(2, element.offsetHeight * scale);

        // Determinar tipo de contenido
        if (tag.match(/^h[1-6]$/)) {
            block.className = 'jd-minimap-block jd-mm-heading';
            block.style.height = `${height + 2}px`;
            block.title = element.textContent.trim().substring(0, 50);
        } else if (element.querySelector('img')) {
            block.className = 'jd-minimap-block jd-mm-image';
            block.style.height = `${Math.max(8, height)}px`;
            // Miniatura real si la imagen tiene src
            const img = element.querySelector('img');
            if (img && img.src) {
                block.style.backgroundImage = `url(${img.src})`;
                block.style.backgroundSize = 'cover';
                block.style.backgroundPosition = 'center';
            }
        } else if (element.querySelector('video, iframe, .youtube-mosaic')) {
            block.className = 'jd-minimap-block jd-mm-video';
            block.style.height = `${Math.max(8, height)}px`;
        } else if (element.querySelector('pre, code')) {
            block.className = 'jd-minimap-block jd-mm-code';
            block.style.height = `${height}px`;
        } else if (tag === 'ul' || tag === 'ol') {
            block.className = 'jd-minimap-block jd-mm-list';
            block.style.height = `${height}px`;
        } else if (tag === 'blockquote') {
            block.className = 'jd-minimap-block jd-mm-quote';
            block.style.height = `${height}px`;
        } else if (tag === 'p' || tag === 'div') {
            block.className = 'jd-minimap-block jd-mm-text';
            block.style.height = `${height}px`;
        } else {
            return null; // Ignorar elementos vacíos
        }

        // Click para navegar
        block.addEventListener('click', function() {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Flash visual
            element.style.transition = 'background 0.5s ease';
            element.style.background = 'rgba(111, 66, 193, 0.08)';
            setTimeout(() => { element.style.background = ''; }, 1500);
        });

        return block;
    }

    function setupMinimapScroll(minimap, content) {
        // Sincronizar viewport indicator con scroll del usuario
        window.addEventListener('scroll', function() {
            updateViewportIndicator(minimap, content);
        }, { passive: true });
    }

    function updateViewportIndicator(minimap, content) {
        const indicator = minimap.querySelector('.jd-minimap-viewport');
        if (!indicator) return;

        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        const contentTop = content.offsetTop;
        const contentHeight = content.offsetHeight;
        const minimapHeight = minimap.offsetHeight;

        const startRatio = Math.max(0, (scrollTop - contentTop) / contentHeight);
        const endRatio = Math.min(1, (scrollTop - contentTop + viewportHeight) / contentHeight);

        indicator.style.top = `${startRatio * minimapHeight}px`;
        indicator.style.height = `${Math.max(10, (endRatio - startRatio) * minimapHeight)}px`;
    }

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildMinimap);
    } else {
        buildMinimap();
    }
})();
```

#### 7.4 Template HTML

**Archivo:** `backend/blog/templates/blog/blog_detail.html`

Dentro del `<div class="col-12 col-lg-12 col-xl-12">`, después del contenido del artículo, agregar el wrapper del minimap:

```html
<!-- 🗺 HU-017: Content Minimap wrapper (se llena via JS) -->
<div class="blog-detail-minimap-wrapper"></div>
```

#### 7.5 CSS del Minimap

```css
/* ═══════════════════════════════════════
   HU-017: CONTENT MINIMAP
   ═══════════════════════════════════════ */
.blog-detail-minimap-wrapper {
    position: fixed;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 99998;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.jd-minimap {
    width: 100px;
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-height: 60vh;
    overflow: hidden;
    position: relative;
    cursor: crosshair;
    transition: box-shadow 0.2s ease;
}

.jd-minimap:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

/* Bloques del minimap */
.jd-minimap-block {
    width: 100%;
    border-radius: 2px;
    transition: opacity 0.15s ease;
    cursor: pointer;
    min-height: 2px;
}

.jd-minimap-block:hover {
    opacity: 0.8;
    transform: scaleY(1.2);
}

/* Tipos de bloque */
.jd-mm-text {
    background: #d1d5db;
    height: 3px;
}

.jd-mm-heading {
    background: #6f42c1;
    height: 5px;
    margin-top: 2px;
}

.jd-mm-image {
    background: #93c5fd;
    border: 1px solid #60a5fa;
    min-height: 12px;
    background-size: cover;
    background-position: center;
}

.jd-mm-video {
    background: linear-gradient(135deg, #c084fc, #a855f7);
    min-height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.jd-mm-video::after {
    content: '▶';
    font-size: 8px;
    color: #fff;
}

.jd-mm-code {
    background: #1f2937;
    height: 8px;
    border: 1px solid #374151;
}

.jd-mm-list {
    background: #d1d5db;
    height: 4px;
    border-left: 2px solid #6f42c1;
    padding-left: 2px;
}

.jd-mm-quote {
    background: #c4b5fd;
    border-left: 3px solid #6f42c1;
    height: 6px;
}

/* Indicador de posición actual (viewport) */
.jd-minimap-viewport {
    position: absolute;
    left: 0;
    width: 100%;
    background: rgba(111, 66, 193, 0.15);
    border: 2px solid rgba(111, 66, 193, 0.4);
    border-radius: 3px;
    transition: top 0.15s ease, height 0.15s ease;
    pointer-events: none;
    z-index: 5;
}

/* Tooltip del minimap */
.jd-minimap-tooltip {
    position: absolute;
    right: 105%;
    top: 50%;
    transform: translateY(-50%);
    background: #1f2937;
    color: #e5e7eb;
    padding: 4px 10px;
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 10;
}

.jd-minimap:hover .jd-minimap-tooltip {
    opacity: 1;
}

/* Responsive: ocultar en móvil */
@media (max-width: 1024px) {
    .blog-detail-minimap-wrapper {
        display: none;
    }
}

/* Modo lectura oscuro */
html[data-reading-mode="dark"] .jd-minimap {
    background: #1e293b;
    border-color: #334155;
}

html[data-reading-mode="dark"] .jd-mm-text {
    background: #475569;
}

html[data-reading-mode="dark"] .jd-mm-image {
    border-color: #60a5fa;
}

html[data-reading-mode="dark"] .jd-minimap-viewport {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.5);
}

html[data-reading-mode="dark"] .jd-minimap-tooltip {
    background: #475569;
    color: #e5e7eb;
}
```

#### 7.6 Características avanzadas del Minimap

| Característica                 | Descripción                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Hover preview**              | Al pasar el mouse sobre un bloque, se muestra tooltip con el título del heading o tipo de contenido |
| **Viewport indicator**         | Rectángulo semitransparente que muestra qué parte del artículo estás viendo                         |
| **Click to scroll**            | Click en cualquier bloque → scroll suave a esa zona                                                 |
| **Flash highlight**            | Al hacer click, el bloque destino se ilumina brevemente (0.5s)                                      |
| **Drag viewport**              | Opcional: arrastrar el viewport indicator para scrollear                                            |
| **Miniatura real de imágenes** | Las imágenes reales se muestran como miniatura en el minimap                                        |
| **Colores por tipo**           | Morado=heading, azul=imagen, violeta=video, oscuro=código, gris=texto                               |
| **Modo lectura**               | Se adapta a oscuro/sepia                                                                            |
| **Responsive**                 | Solo en desktop (>1024px). En móvil se oculta                                                       |

#### 7.7 ¿Qué más podemos agregar? (Ideas no implementadas inicialmente)

| Idea                               | Descripción                                                                                             | Viabilidad        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------- |
| **Highlights del minimap**         | Si HU-016 está implementada, los fragmentos destacados aparecen como marcadores amarillos en el minimap | 🟢 Fácil           |
| **Ruta de aprendizaje en minimap** | Si el artículo es parte de una ruta (Fase 6), se muestran indicadores de progreso                       | 🟢 Fácil           |
| **Barra de progreso de lectura**   | Línea vertical que avanza a medida que lees (ya existe como `reading-progress-fill`)                    | ✅ Ya implementada |
| **Conteo de elementos**            | Badge con el número de imágenes, videos, bloques de código                                              | 🟡 Medio           |
| **Toggle minimap**                 | Botón para mostrar/ocultar el minimap (para no distraer)                                                | 🟢 Fácil           |
| **Keyboard navigation**            | Flechas para navegar entre bloques del minimap                                                          | 🟡 Medio           |

#### ✅ Criterios de aceptación Fase 7
- [ ] El minimap se renderiza automáticamente analizando el DOM de `.blog-content`
- [ ] Bloques de texto se muestran como líneas grises
- [ ] Imágenes se muestran como miniatura real (o placeholder azul)
- [ ] Videos se muestran como bloques violetas con ▶
- [ ] Código se muestra como bloques oscuros
- [ ] Headers se muestran como líneas moradas más gruesas
- [ ] Click en cualquier bloque hace scroll suave a esa zona
- [ ] Indicador de viewport muestra la posición actual
- [ ] Hover muestra tooltip con información
- [ ] Flash highlight al hacer click
- [ ] Solo visible en desktop (>1024px)
- [ ] Se adapta a modo lectura oscuro/sepia

---

## 📋 RESUMEN DE FASES

| Fase  | Descripción                                 | Tiempo | Prioridad | Dependencias         |
| ----- | ------------------------------------------- | ------ | --------- | -------------------- |
| **1** | Filtros activos + Categorías con contadores | 15 min | 🔴 CRÍTICA | Ninguna              |
| **2** | Tags populares (nube filtrable)             | 15 min | 🔴 CRÍTICA | Ninguna              |
| **3** | Archivo mensual + Tiempo lectura            | 15 min | 🟡 ALTA    | HU-014               |
| **4** | Conceptos clave (Sidebar DERECHO)           | 15 min | 🟡 ALTA    | HU-015               |
| **5** | RSS Feed (Sidebar IZQUIERDO)                | 15 min | 🟢 MEDIA   | HU-012 F4            |
| **6** | 🎯 Rutas de Aprendizaje (progreso visual)    | 20 min | 🟡 ALTA    | Fase 1-2 completadas |
| **7** | 🗺 Content Minimap (tipo VS Code)            | 20 min | 🔥 JOYA    | Ninguna              |

**Tiempo total estimado:** ~115 minutos (7 sesiones)

---

## 🔗 ÁRBOL DE DEPENDENCIAS DEL SIDEBAR

```
HU-017 (Nave Nodriza)
├── Depende de:
│   ├── HU-015 → Conceptos (Fase 4)
│   ├── HU-012 F4 → RSS Feeds (Fase 5)
│   └── HU-014 → Reading Time field (Fase 3)
│
├── Componentes internos (sin dependencias externas):
│   ├── Fase 1: Filtros activos + Categorías
│   ├── Fase 2: Tags populares
│   ├── Fase 3: Archivo mensual (usa publish_date)
│   ├── Fase 5: Más populares (usa reacciones existentes)
│   └── Fase 6: Rutas de aprendizaje (frontmatter + campos nuevos)
```

> 📌 **Última actualización:** 02/06/2026
> 📌 **Aplicable desde HU-017**
> 📌 **Sidebar único** para `blog_list.html` y `blog_detail.html`