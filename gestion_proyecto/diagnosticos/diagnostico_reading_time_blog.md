# 🔍 Diagnóstico: Tiempo de Lectura ("5 min") en Cards de Blog

> **ID:** DIAG-READING-TIME
> **Fecha:** 01/06/2026
> **Responsable:** Cline
> **Estado:** ✅ DIAGNOSTICADO — ⏳ PENDIENTE APROBACIÓN DE PLAN
> **Padre:** HU-001.1 (Completar Frontmatter Blog)
> **Origen del reporte:** Inspección manual del template `backend/blog/templates/blog/blog_list.html`

---

## 🎯 Síntoma reportado

> "En `blog_list.html` el tiempo en todos los cards que representan articles tiene asignado '5 min'. ¿Estará hardcodeado?"

**Observación confirmada en el template (línea 197):**

```html
<span><i class="far fa-clock mr-1"></i> {{ post.reading_time|default:"5" }} min</span>
```

Y en el partial `_post_grid.html` (línea 47):

```html
<span><i class="far fa-clock mr-1"></i> {{ post.reading_time|default:"5" }} min</span>
```

---

## 🧭 Cadena causal completa (3 eslabones rotos)

El problema NO es que el "5" esté hardcodeado en la lógica. Es que **un campo del modelo no existe**, y el `|default:"5"` del template es un parche temporal que **enmascara la ausencia del campo**.

```
📄 blog.md (frontmatter)
   │   tiempo_lectura: 8  ← ✅ SÍ se escribe en el markdown
   ▼
⚙️ read_markdown_file (markdown_utils.py)
   │   frontmatter['tiempo_lectura'] = '8'  ← ✅ SÍ se parsea al dict
   ▼
⚙️ BlogProcessor.process_single_blog → save_blog_post
   │   ❌ NO lee 'tiempo_lectura' del dict
   │   ❌ NO lo asigna al BlogPost
   ▼
🗄️ BlogPost (modelo)
   │   ❌ NO TIENE el campo reading_time
   ▼
🎨 Template (blog_list.html / _post_grid.html)
       {{ post.reading_time|default:"5" }}
       └─ Atributo inexistente → string vacío → |default aplica "5"
       Resultado: SIEMPRE "5 min"  🟥
```

---

## 🔬 Hallazgos detallados

### 1. 🟡 Frontmatter (fuente de verdad) — SÍ contiene el campo

**Único blog que lo tiene:** `backend/blogs_source/2026-04-24_por-que-las-integraciones-zoho-fallan/blog.md` (línea 13):

```yaml
---
title: "Por qué las integraciones de Zoho SIEMPRE fallan en el 6to mes"
...
tiempo_lectura: 8
palabra_clave_principal: "integraciones zoho fallan"
---
```

**Inconsistencia detectada:** el campo se llama `tiempo_lectura` (español), mientras el resto del estándar está en inglés:

| Campo              | Idioma | Estado en HU-001.1           |
| ------------------ | ------ | ---------------------------- |
| `title`            | EN     | ✅ Soportado                  |
| `description`      | EN     | ✅ Soportado                  |
| `date`             | EN     | ✅ Soportado                  |
| `draft`            | EN     | ✅ Soportado                  |
| `image`            | EN     | ✅ Soportado                  |
| `author`           | EN     | ✅ Soportado                  |
| `category`         | EN     | ✅ Soportado                  |
| `tags`             | EN     | ✅ Soportado                  |
| `meta_title`       | EN     | ✅ Soportado                  |
| `meta_description` | EN     | ✅ Soportado                  |
| `tiempo_lectura`   | **ES** | ❌ **NO listado en HU-001.1** |

### 2. 🟡 Parser de frontmatter — SÍ lo extrae correctamente

**Archivo:** `backend/blog/utils/importer/markdown_utils.py` (líneas 83-148)

El parser es **genérico**: itera cada línea `key: value` del bloque `---` y lo guarda en el dict `frontmatter`. No discrimina campos. Por lo tanto, `tiempo_lectura: 8` queda como `frontmatter['tiempo_lectura'] = '8'` correctamente.

### 3. 🔴 Comando de importación — IGNORA el campo

**Archivo:** `backend/blog/management/commands/import_blogs.py` (línea 173-181)

```python
obj = self.save_blog_post(
    slug,
    file_hash,
    title,
    html_final,
    category_obj,
    frontmatter,         # ← se pasa el dict completo
    cover_image_path,
)
```

El `frontmatter` SÍ se pasa, pero la función `save_blog_post` (delegada a `BlogProcessor.save_blog_post` → `command.save_blog_post`) **no extrae `tiempo_lectura`** del dict ni lo asigna al objeto BlogPost.

> **Búsqueda exhaustiva en `import_blogs.py` y `blog_processor.py`:** 0 coincidencias de `tiempo_lectura` o `reading_time`.

### 4. 🔴 Modelo `BlogPost` — NO TIENE el campo

**Archivo:** `backend/blog/models.py` (líneas 60-117)

```python
class BlogPost(models.Model):
    slug = models.SlugField(...)
    category = models.ForeignKey(...)
    tags = models.ManyToManyField(...)
    title = models.CharField(...)
    description = models.TextField(...)
    content_html = models.TextField(...)
    publish_date = models.DateTimeField(...)
    last_modified = models.DateTimeField(...)
    is_published = models.BooleanField(...)
    source_hash = models.CharField(...)
    meta_title = models.CharField(...)
    meta_description = models.CharField(...)
    cover_image = models.CharField(...)
    # ❌ NO existe reading_time
```

### 5. 🟡 Templates — Usan `|default:"5"` como parche

**Archivos afectados:**

- `backend/blog/templates/blog/blog_list.html` (línea 197)
- `backend/blog/templates/blog/partials/_post_grid.html` (línea 47)

```html
{{ post.reading_time|default:"5" }} min
```

**¿Por qué "5"?** Probable origen: valor por defecto elegido al desarrollar el listado, sin saber que el campo no estaba en el modelo. Se quedó como valor "razonable" para que la UI no se rompiera.

### 6. 📋 Migraciones — NO existe una para `reading_time`

Migraciones existentes en `backend/blog/migrations/`:

| #    | Archivo                                               | Tema                      |
| ---- | ----------------------------------------------------- | ------------------------- |
| 0001 | `_initial.py`                                         | Tablas base               |
| 0002 | `_alter_blogpost_source_hash.py`                      | Ajuste hash               |
| 0003 | `_category_blogpost_category.py`                      | Categorías                |
| 0004 | `_tag_blogpost_tags.py`                               | Tags                      |
| 0005 | `_blogcomment.py`                                     | Comentarios               |
| 0006 | `_blogpost_cover_image.py`                            | ✅ Precedente: cover_image |
| 0007 | `_blogcomment_editable_until_and_more.py`             | Comentarios editables     |
| 0008 | `_alter_blogcomment_id_alter_blogpost_id_and_more.py` | Alter IDs                 |

> La **0006** es el precedente a seguir: `cover_image` se añadió al modelo en una HU posterior a la inicial. Se haría lo mismo con `reading_time`.

### 7. 📋 HUs relacionadas

| HU                                              | Estado                  | Relación                                                           |
| ----------------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| **HU-001** (Sistema de Blogs desde Markdown)    | ✅ Completa              | Creó la base pero NO contempló tiempo de lectura                   |
| **HU-001.1** (Completar Frontmatter Blog)       | ✅ Completa (24/04/2026) | Dice "completar TODOS los campos" pero **omitió `tiempo_lectura`** |
| **HU-001 refactor** (Refactorizar import_blogs) | 📝 Plan                  | No afecta este tema                                                |

> ⚠️ **HU-001.1 se marcó como "completada" sin haber incluido `tiempo_lectura` en su lista oficial.** Esto es un descuido histórico, no un error de implementación.

---

## 🎯 Causa raíz (resumen ejecutivo)

**El "5 min" no es un valor hardcodeado de negocio.** Es el resultado de **3 capas desconectadas**:

1. 🔴 El modelo `BlogPost` carece del campo `reading_time`
2. 🔴 El comando `import_blogs` + `BlogProcessor` parsea el frontmatter pero nunca usa `tiempo_lectura`
3. 🟡 El template compensa con `|default:"5"` — funciona, pero enmascara el problema

El `|default:"5"` es un **workaround**, no la causa. La causa real es la ausencia del campo en el modelo y el comando.

---

## 💡 Impacto

| Dimensión                 | Impacto                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| **UX**                    | 🟡 Todos los blogs muestran "5 min" — el usuario no distingue entre un post corto y uno largo |
| **SEO**                   | 🟢 Bajo: Google no usa esto para ranking                                                      |
| **Funcionalidad**         | 🟡 El valor real existe en el markdown (8 min en el de Zoho) pero se IGNORA en cada import    |
| **Mantenibilidad**        | 🔴 Si un día se cambia `default:"5"` se rompe la UI sin que el desarrollador entienda por qué |
| **Consistencia de datos** | 🔴 El campo está en el frontmatter de 1 blog pero la BD lo descarta silenciosamente           |

---

## 📋 Plan de acción propuesto (PENDIENTE APROBACIÓN)

> **Filosofía:** Aplicar las reglas de oro — fases granulares (≤15 min), sin dependencias nuevas, aditivo (nunca romper lo existente), documentación primero.

### 📌 Pre-requisito: Crear HU formal

**HU-014: Tiempo de lectura en blogs** (nueva)
- Crear `gestion_proyecto/hus/HU-014_READING_TIME_BLOG.md`
- Basarse en este diagnóstico

---

### 🟢 FASE 1 — Modelo + Migración (≤10 min)

**Objetivo:** Añadir el campo al modelo, sin perder datos existentes.

1. Editar `backend/blog/models.py`:
   ```python
   # En BlogPost, después de cover_image
   reading_time = models.PositiveIntegerField(
       null=True,
       blank=True,
       help_text="Tiempo de lectura en minutos, leido del frontmatter 'tiempo_lectura'",
   )
   ```
2. Activar entorno virtual y crear migración:
   ```bash
   source .venv/Scripts/activate
   cd backend
   python manage.py makemigrations blog
   # Resultado esperado: 0009_blogpost_reading_time.py
   python manage.py migrate blog
   ```
3. **Verificación:** `python manage.py check` sin errores.

> ✅ Migración aditiva (nullable), cero riesgo para datos existentes.

---

### 🟢 FASE 2 — Actualizar `BlogProcessor` + `save_blog_post` (≤15 min)

**Objetivo:** Que el comando lea `tiempo_lectura` del frontmatter y lo guarde en `BlogPost.reading_time`.

1. En `backend/blog/management/commands/import_blogs.py`, dentro de `save_blog_post`, **antes** del `obj.save()`:
   ```python
   # Leer tiempo de lectura (acepta ambos nombres por retrocompatibilidad)
   reading_time_raw = frontmatter.get("reading_time") or frontmatter.get("tiempo_lectura")
   if reading_time_raw:
       try:
           obj.reading_time = int(str(reading_time_raw).strip())
       except (ValueError, TypeError):
           self.stdout.write(self.style.WARNING(
               f"⚠️  Tiempo de lectura inválido en '{title}': {reading_time_raw!r}. Se omite."
           ))
   ```
2. **NO** duplicar lógica en `blog_processor.py` (la fase 2 del refactor mantiene la responsabilidad de `save_blog_post` en el command — coherente con la arquitectura actual).

> ✅ El parser ya entrega el valor. Solo hay que consumirlo.

---

### 🟢 FASE 3 — Re-importar blogs existentes (≤5 min)

**Objetivo:** Que los blogs ya en la BD se actualicen con su tiempo de lectura.

```bash
source .venv/Scripts/activate
cd backend
python manage.py import_blogs
```

**Esperado:**
- Blog de Zoho: `reading_time = 8` (antes NULL → ahora 8)
- Blog de UI/UX: `reading_time = NULL` (no tiene el campo en frontmatter — comportamiento aceptable, se calculará automáticamente en el futuro si se desea)

---

### 🟢 FASE 4 — Ajustar el `|default` del template (≤5 min)

**Objetivo:** Que el fallback sea explícito y semánticamente correcto.

**Decisión de diseño (a confirmar con el usuario):**

| Opción                                       | Plantilla                                                                     | Resultado si reading_time es NULL |
| -------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------- |
| **A** Mantener el "5" como fallback          | `{{ post.reading_time\|default:"5" }} min`                                    | "5 min" (igual que ahora)         |
| **B** Calcular automáticamente desde el HTML | Usar `len(post.content_html)//1500` como fallback                             | "X min" calculado                 |
| **C** Mostrar guion si falta                 | `{% if post.reading_time %}{{ post.reading_time }} min{% else %}—{% endif %}` | "—"                               |

> Mi recomendación: **Opción A** (mantener "5") en esta primera fase, para no romper la UI ni introducir lógica nueva no aprobada. La opción B puede ser una mejora futura (HU aparte).

---

### 🟢 FASE 5 — Documentación y estándar (≤10 min)

**Objetivo:** Que esto no se vuelva a olvidar.

1. Actualizar `gestion_proyecto/hus/HU-001.1_COMPLETAR_FRONTMATTER_BLOG.md`:
   - Añadir `reading_time` (o `tiempo_lectura`) a la lista de campos soportados
2. Actualizar `gestion/procedimientos/PLANTILLA_ESTANDAR_BLOG_SEO.md`:
   - Incluir `reading_time: N` en el YAML de ejemplo
3. Actualizar `gestion_proyecto/procedimientos/PROC_001_escribir_blog.md`:
   - Mencionar el campo en la lista oficial

> ✅ Cierra el ciclo: el campo queda documentado en estándar, procedimientos y HU.

---

### 🟢 FASE 6 — Validación visual (≤5 min)

1. Levantar el server: `python manage.py runserver`
2. Abrir `/blog/` en el navegador
3. **Esperado:**
   - Blog de Zoho: **"8 min"** ✅
   - Blog de UI/UX: "5 min" (fallback) — aceptable en esta primera fase
4. Verificar en la BD: `python manage.py shell -c "from blog.models import BlogPost; print([(p.slug, p.reading_time) for p in BlogPost.objects.all()])"`

---

## 🤔 Decisiones pendientes para el usuario

1. **Nombre del campo en el frontmatter:** ¿mantener `tiempo_lectura` (español) o estandarizar a `reading_time` (inglés) como el resto? El código propuesto acepta ambos por retrocompatibilidad.
2. **Plantilla de UI (Fase 4):** ¿opción A (mantener "5"), B (calcular automáticamente) o C (mostrar "—")?
3. **Alcance:** ¿Implementar las 6 fases completas ahora, o solo hasta alguna fase específica?

---

## ✅ Garantías de la propuesta

- 🔒 **Idempotente:** se puede ejecutar 1 o 1000 veces con el mismo resultado
- ✅ **Aditivo:** no borra ni modifica código existente
- ✅ **Retrocompatible:** blogs sin `reading_time` siguen funcionando (caen al default)
- ✅ **Cero dependencias nuevas:** usa solo Django y herramientas ya instaladas
- ✅ **Reversible:** si algo falla, la migración se puede deshacer con `migrate blog 0008`
- ✅ **Documentado:** se actualiza la HU, el estándar y el procedimiento

---

> 🟡 **Esperando aprobación del usuario antes de implementar.**
