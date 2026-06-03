# 📋 HU-015: Mapa de Conocimiento — Conceptos Clave y Navegación Temática

> **ID:** HU-015
> **Fecha:** 02/06/2026
> **Responsable:** Cline
> **Estado:** 🔵 Pendiente
> **Tiempo estimado total:** 5 fases (~15 min cada una)
> **Dependencias:** HU-001 (sistema blogs), HU-001.1 (frontmatter completo), HU-014 (reading_time)

---

## 🚨 INSTRUCCIONES DE DESARROLLO (LEER ANTES DE EMPEZAR)

> ⚠️ **REGLAS DE ORO PARA IMPLEMENTAR ESTA HU:**

### 🟢 1. Una Fase a la Vez
- Esta HU tiene **5 fases** de aproximadamente **15 minutos cada una**
- **NUNCA** implementes más de una fase en una sola sesión
- Cada fase es **independiente** y se puede probar por separado
- Al terminar cada fase: ✅ probar, ✅ confirmar con el usuario, ✅ pasar a la siguiente

### 🟢 2. Sin Dependencias Nuevas Sin Aprobación
- Todo usa funcionalidad nativa de Django
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
3. Probar manualmente
4. Confirmar con el usuario
5. PASAR A LA SIGUIENTE FASE
```

---

## 🎯 OBJETIVO

Transformar el blog de artículos sueltos a una **base de conocimiento interconectada** mediante:

1. **Modelo `Concept`**: Entidad que representa conceptos/tópicos clave extraídos del frontmatter
2. **Extracción en importación**: Leer `conceptos_clave` del frontmatter `.md` y crear relaciones M2M
3. **Visualización en blog detail**: Badges de conceptos clickeables + nube temática
4. **Artículos relacionados por concepto**: No solo por categoría, sino por conceptos compartidos
5. **(Opcional) Mapa visual**: Navegación temática entre artículos que comparten conceptos

### Valor diferencial
| Aspecto           | Impacto                                            |
| ----------------- | -------------------------------------------------- |
| UX                | ⭐⭐⭐⭐⭐ Navegación temática orgánica entre artículos |
| SEO               | ⭐⭐⭐⭐ Topic clusters, internal linking contextual   |
| Autoridad topical | ⭐⭐⭐⭐⭐ Señal de profundidad temática para Google    |
| Retención         | ⭐⭐⭐⭐ El usuario descubre más contenido relacionado |

---

## 📊 ESTADO ACTUAL

### ✅ Lo que YA funciona
- Sistema de blogs con importación desde Markdown (HU-001)
- Frontmatter completo con campos estándar (HU-001.1)
- Categorías (modelo `Category`) — agrupación por área general
- Tags (modelo `Tag`) — etiquetado libre
- Artículos relacionados por misma categoría (se añadió en HU-012 Fase 5)

### 🔴 Lo que falta
1. **No hay modelo `Concept`** para representar tópicos específicos del contenido
2. **No hay campo `conceptos_clave`** en el frontmatter estándar
3. **No se extraen conceptos** durante la importación de blogs
4. **No hay visualización** de conceptos en el blog detail
5. **No hay artículos relacionados por concepto** (solo por categoría)

---

## 🔧 FASES DE IMPLEMENTACIÓN

---

### ⚡ FASE 1: Modelo Concept + Migración
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/models.py`

#### 1.1 Crear modelo Concept

**Archivo:** `backend/blog/models.py`

Agregar ANTES de la clase `BlogPost`:

```python
class Concept(models.Model):
    """
    Conceptos/tópicos clave extraídos del frontmatter de los artículos.
    Permite relacionar artículos por temas específicos, no solo por categoría.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    description = models.TextField(
        blank=True, null=True,
        help_text="Descripción opcional del concepto"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Concepto"
        verbose_name_plural = "Conceptos"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
```

#### 1.2 Agregar relación M2M en BlogPost

Dentro de `BlogPost`, después del campo `tags` (línea 74), agregar:

```python
    concepts = models.ManyToManyField(
        Concept, blank=True, related_name="posts"
    )
```

#### 1.3 Crear y aplicar migración

```bash
source .venv/Scripts/activate
cd backend
python manage.py makemigrations blog
python manage.py migrate blog
```

#### ✅ Criterios de aceptación Fase 1
- [ ] Modelo `Concept` existe con campos `name`, `slug`, `description`, `is_active`
- [ ] `BlogPost.concepts` es M2M con `Concept`
- [ ] Migración se aplica sin errores
- [ ] Admin de Django permite ver/crear Concepts

---

### ⚡ FASE 2: Frontmatter + Extracción en Importación
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/utils/importer/blog_processor.py`, `gestion_proyecto/procedimientos/PLANTILLA_ESTANDAR_BLOG_SEO.md`

#### 2.1 Actualizar frontmatter estándar

En cada archivo `.md` de blog, se usará el campo:
```yaml
---
conceptos_clave:
  - integraciones
  - zoho
  - api-rest
  - automatizacion
---
```

#### 2.2 Extraer conceptos durante importación

**Archivo:** `backend/blog/utils/importer/blog_processor.py`

Dentro de la función/método que procesa el frontmatter, después de procesar `tags`, agregar:

```python
# ✅ HU-015: Procesar conceptos_clave del frontmatter
concept_names = frontmatter.get("conceptos_clave", []) or []
if isinstance(concept_names, str):
    concept_names = [c.strip() for c in concept_names.split(",") if c.strip()]

concept_objects = []
for cname in concept_names:
    cname = cname.strip().lower()
    if cname:
        concept_obj, _ = Concept.objects.get_or_create(
            name=cname,
            defaults={"slug": slugify(cname)}
        )
        concept_objects.append(concept_obj)

if concept_objects:
    post.concepts.set(concept_objects)
else:
    post.concepts.clear()
```

> ⚠️ **Importante:** Asegurar `from blog.models import Concept` al inicio del archivo.

#### 2.3 Actualizar PLANTILLA_ESTANDAR

**Archivo:** `gestion_proyecto/procedimientos/PLANTILLA_ESTANDAR_BLOG_SEO.md`

Agregar en la sección de frontmatter:
```yaml
# 🆕 HU-015: Conceptos clave para mapa de conocimiento
conceptos_clave:
  - concepto-1
  - concepto-2
  - concepto-3
```

#### ✅ Criterios de aceptación Fase 2
- [ ] Al reimportar un blog con `conceptos_clave` en frontmatter, los conceptos se crean en DB
- [ ] La relación M2M se establece correctamente
- [ ] Blogs sin `conceptos_clave` no se rompen (campo opcional)
- [ ] Los conceptos existentes se reutilizan (get_or_create) entre artículos

---

### ⚡ FASE 3: Visualización en Blog Detail
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/templates/blog/blog_detail.html`, `backend/blog/static/blog/css/blog_detail.css`

#### 3.1 Agregar sección "Conceptos Clave"

**Archivo:** `backend/blog/templates/blog/blog_detail.html`

Después de la sección de Tags (después de `</div>` del `jd-tags-row`, aproximadamente línea 229) y ANTES del `jd-header-rule`, agregar:

```html
<!-- ✅ HU-015: CONCEPTOS CLAVE -->
{% if post.concepts.all %}
<div class="jd-concepts-section">
  <div class="jd-concepts-label">
    <i class="fas fa-brain"></i>
    <span>Explorar por tema</span>
  </div>
  <div class="jd-concepts-cloud">
    {% for concept in post.concepts.all %}
      <a href="{% url 'blog:blog_list' %}?concept={{ concept.slug }}"
         class="jd-concept-badge"
         title="Ver artículos sobre {{ concept.name }}">
        {{ concept.name }}
      </a>
    {% endfor %}
  </div>
</div>
{% endif %}
```

#### 3.2 Agregar estilos CSS

**Archivo:** `backend/blog/static/blog/css/blog_detail.css`

Agregar al final:

```css
/* ✅ HU-015: CONCEPTOS CLAVE / MAPA DE CONOCIMIENTO */
.jd-concepts-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  background: #f8f6ff;
  border: 1px solid #ede9fe;
  border-radius: 12px;
  flex-wrap: wrap;
}

.jd-concepts-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6f42c1;
  white-space: nowrap;
  padding-top: 2px;
}

.jd-concepts-label i {
  font-size: 0.9rem;
}

.jd-concepts-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.jd-concept-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 100px;
  background: #fff;
  border: 1.5px solid #ddd6fe;
  color: #5b21b6;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  letter-spacing: 0.01em;
}

.jd-concept-badge:hover {
  background: #6f42c1;
  border-color: #6f42c1;
  color: #fff;
  text-decoration: none;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(111, 66, 193, 0.25);
}

/* Modo lectura oscuro */
html[data-reading-mode="dark"] .jd-concepts-section {
  background: #1e1b4b;
  border-color: #3730a3;
}

html[data-reading-mode="dark"] .jd-concepts-label {
  color: #a5b4fc;
}

html[data-reading-mode="dark"] .jd-concept-badge {
  background: rgba(255, 255, 255, 0.05);
  border-color: #4f46e5;
  color: #c7d2fe;
}

html[data-reading-mode="dark"] .jd-concept-badge:hover {
  background: #4f46e5;
  color: #fff;
}

/* Modo lectura sepia */
html[data-reading-mode="sepia"] .jd-concepts-section {
  background: #fdf6ee;
  border-color: #e8dcc8;
}

html[data-reading-mode="sepia"] .jd-concepts-label {
  color: #8b5e3c;
}

html[data-reading-mode="sepia"] .jd-concept-badge {
  background: #fff;
  border-color: #d4a373;
  color: #6b4d2e;
}

html[data-reading-mode="sepia"] .jd-concept-badge:hover {
  background: #d4a373;
  color: #fff;
}
```

#### 3.3 Actualizar vista para filtrar por concepto

**Archivo:** `backend/blog/views.py`

En `BlogListView.get_queryset`, después del filtro por `category_slug`, agregar:

```python
concept_slug = self.request.GET.get("concept")
if concept_slug:
    qs = qs.filter(concepts__slug=concept_slug)
```

Y en `get_context_data`, pasar el concepto activo:
```python
context["active_concept"] = self.request.GET.get("concept", "")
```

> ⚠️ **Nota:** Esto permite que al hacer clic en un concepto, se filtre el listado de blogs mostrando solo los que comparten ese concepto.

#### ✅ Criterios de aceptación Fase 3
- [ ] Los conceptos clave se muestran como badges en el blog detail
- [ ] Los badges tienen color y hover consistentes con el tema
- [ ] Al hacer clic en un badge, se filtra el listado por ese concepto
- [ ] Funciona correctamente en modo lectura (oscuro, sepia)
- [ ] Responsive: los badges se adaptan a móvil

---

### ⚡ FASE 4: Artículos Relacionados por Concepto
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/views.py`, `backend/blog/templates/blog/blog_detail.html`

#### 4.1 Actualizar BlogDetailView

**Archivo:** `backend/blog/views.py`

En `BlogDetailView.get_context_data`, después de la lógica de `related_posts` (si se implementó en HU-012) o al final, agregar:

```python
# ✅ HU-015: Artículos relacionados por conceptos compartidos
post_concepts = self.object.concepts.all()
if post_concepts.exists():
    concept_related = BlogPost.objects.filter(
        is_published=True,
        concepts__in=post_concepts
    ).exclude(id=self.object.id).distinct().order_by("-publish_date")[:6]
    context["concept_related_posts"] = concept_related
else:
    context["concept_related_posts"] = BlogPost.objects.none()
```

> ⚠️ **Nota:** Si ya existe `related_posts` (por categoría, HU-012 Fase 5), esta nueva variable `concept_related_posts` es complementaria, no sustitutiva. Se muestran AMBAS secciones si hay resultados.

#### 4.2 Renderizar en template

**Archivo:** `backend/blog/templates/blog/blog_detail.html`

Después de la sección de artículos relacionados (por categoría) y ANTES de la sección de comentarios, agregar:

```html
<!-- ═══════════════════════════════════════
     ARTÍCULOS RELACIONADOS POR CONCEPTO (HU-015)
═══════════════════════════════════════ -->
{% if concept_related_posts %}
<section class="jd-related-section jd-concept-related">
  <h3 class="jd-related-title">
    <i class="fas fa-project-diagram mr-2"></i>Mismo tema, diferente perspectiva
  </h3>
  <p class="jd-concept-related-sub">
    Artículos que comparten conceptos clave con este:
    {% for concept in post.concepts.all %}
      <span class="jd-concept-inline">{{ concept.name }}</span>{% if not forloop.last %}, {% endif %}
    {% endfor %}
  </p>
  <div class="jd-related-grid">
    {% for rpost in concept_related_posts %}
      <a href="{% url 'blog:blog_detail' rpost.slug %}" class="jd-related-card">
        {% if rpost.cover_image %}
          <div class="jd-related-img" style="background-image: url('{{ rpost.cover_image }}');"></div>
        {% endif %}
        <div class="jd-related-body">
          {% if rpost.category %}
            <span class="jd-related-category">{{ rpost.category.name }}</span>
          {% endif %}
          <h4 class="jd-related-card-title">{{ rpost.title }}</h4>
          <p class="jd-related-desc">{{ rpost.description|truncatewords:15 }}</p>
          <!-- Conceptos compartidos -->
          <div class="jd-related-concepts">
            {% for c in rpost.concepts.all|slice:":3" %}
              {% if c in post.concepts.all %}
                <span class="jd-related-concept-tag">{{ c.name }}</span>
              {% endif %}
            {% endfor %}
          </div>
        </div>
      </a>
    {% endfor %}
  </div>
</section>
{% endif %}
```

#### 4.3 Estilos adicionales

En `blog_detail.css`, agregar:

```css
/* ✅ HU-015: RELACIONADOS POR CONCEPTO */
.jd-concept-related {
  border-top-color: #ddd6fe;
}

.jd-concept-related-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.jd-concept-inline {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 100px;
  background: #f0e6ff;
  color: #6f42c1;
  font-size: 0.75rem;
  font-weight: 600;
}

.jd-related-concepts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 0.5rem;
}

.jd-related-concept-tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 100px;
  background: #f3f0ff;
  color: #7c3aed;
  border: 1px solid #ede9fe;
}

html[data-reading-mode="dark"] .jd-related-concept-tag {
  background: #1e1b4b;
  color: #a5b4fc;
  border-color: #3730a3;
}

html[data-reading-mode="sepia"] .jd-related-concept-tag {
  background: #fdf6ee;
  color: #8b5e3c;
  border-color: #e8dcc8;
}
```

#### ✅ Criterios de aceptación Fase 4
- [ ] Se muestran hasta 6 artículos que comparten conceptos
- [ ] Los conceptos compartidos se muestran como tags en cada tarjeta
- [ ] No se duplican artículos ya mostrados en "relacionados por categoría"
- [ ] La sección es responsive
- [ ] Funciona correctamente aunque el artículo no tenga conceptos (no se muestra)

---

### ⚡ FASE 5: (Opcional) Nube de Conceptos en Blog List + Mapa Visual
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/templates/blog/blog_list.html`, `backend/blog/static/blog/css/blog_list.css`

#### 5.1 Agregar nube de conceptos en sidebar o header del listado

**Archivo:** `backend/blog/templates/blog/blog_list.html`

Agregar una sección que muestre los conceptos más usados como navegación temática:

```html
<!-- ✅ HU-015: NUBE DE CONCEPTOS -->
{% if all_concepts %}
<div class="jd-concept-cloud-section">
  <h4 class="jd-concept-cloud-title">
    <i class="fas fa-brain mr-2"></i>Explorar por tema
  </h4>
  <div class="jd-concept-cloud">
    {% for concept in all_concepts %}
      <a href="{% url 'blog:blog_list' %}?concept={{ concept.slug }}"
         class="jd-concept-cloud-item{% if active_concept == concept.slug %} active{% endif %}"
         style="font-size: {{ concept.posts.count|concept_font_size }};">
        {{ concept.name }}
      </a>
    {% endfor %}
  </div>
</div>
{% endif %}
```

> ⚠️ **Nota:** El filtro `concept_font_size` es opcional y puede implementarse como template filter que devuelva un tamaño de fuente proporcional a la cantidad de artículos.

#### 5.2 Template filter para tamaño de fuente

**Archivo:** `backend/blog/templatetags/blog_filters.py`

```python
@register.filter
def concept_font_size(count):
    """Devuelve un tamaño de fuente para la nube de conceptos (0.75rem - 1.5rem)."""
    if count >= 5:
        return "1.3rem"
    elif count >= 3:
        return "1.1rem"
    elif count >= 2:
        return "0.95rem"
    else:
        return "0.8rem"
```

#### 5.3 Pasar contexto en BlogListView

En `BlogListView.get_context_data`, agregar:

```python
from django.db.models import Count
# Obtener conceptos con conteo de posts, ordenados por popularidad
context["all_concepts"] = Concept.objects.filter(
    is_active=True,
    posts__is_published=True
).annotate(
    post_count=Count("posts")
).filter(
    post_count__gt=0
).order_by("-post_count")
```

#### ✅ Criterios de aceptación Fase 5
- [ ] La nube de conceptos aparece en el listado de blogs
- [ ] Los conceptos más usados se ven más grandes
- [ ] Al hacer clic en un concepto, se filtra el listado
- [ ] El concepto activo se resalta visualmente
- [ ] Responsive: se adapta a móvil

---

## 📋 RESUMEN DE FASES

| Fase | Descripción                             | Tiempo | Prioridad |
| ---- | --------------------------------------- | ------ | --------- |
| 1    | Modelo Concept + migración              | 15 min | 🔴 CRÍTICA |
| 2    | Frontmatter + extracción en importación | 15 min | 🔴 CRÍTICA |
| 3    | Visualización en Blog Detail            | 15 min | 🟡 ALTA    |
| 4    | Artículos relacionados por concepto     | 15 min | 🟡 ALTA    |
| 5    | Nube de conceptos en Blog List          | 15 min | 🟢 MEDIA   |

**Tiempo total estimado:** ~75 minutos (5 sesiones)

---

## 🔗 RELACIÓN CON OTRAS HUs

| HU            | Relación                                                    |
| ------------- | ----------------------------------------------------------- |
| HU-001        | Base del sistema de blogs. La importación debe extenderse   |
| HU-001.1      | Frontmatter estándar. Se agrega campo `conceptos_clave`     |
| HU-012 Fase 5 | Artículos relacionados. HU-015 los complementa por concepto |
| HU-014        | Menciona HU-015 como mejora futura en su documentación      |

---

## 🏁 NOTAS DE DISEÑO

1. **Concept ≠ Tag**: Tags son etiquetado libre del contenido. Concepts son tópicos estructurados que permiten navegación temática. Un artículo puede tener tags como "django", "python", "api" y conceptos como "integraciones", "automatización", "backend".

2. **Fuente de verdad**: Los conceptos se definen en el frontmatter del `.md`, no en DB. La DB es solo cache.

3. **Reimportación segura**: Al reimportar un blog, los conceptos se actualizan. Los conceptos existentes se reutilizan entre artículos via `get_or_create`.

4. **Backward compatibility**: Blogs sin `conceptos_clave` funcionan sin cambios. La sección simplemente no se muestra.

> 📌 **Diagnóstico de referencia:** `gestion_proyecto/diagnosticos/diagnostico_HU012_SEO_BLOG_DETAIL.md` (sección de mapa de conocimiento)
> 📌 **Última actualización:** 02/06/2026
> 📌 **Aplicable desde HU-015**