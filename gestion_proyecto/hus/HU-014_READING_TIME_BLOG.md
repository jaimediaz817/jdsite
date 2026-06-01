# 📋 HU-014: Tiempo de Lectura en Blogs (reading_time)
> **ID:** HU-014
> **Fecha:** 01/06/2026
> **Responsable:** Cline
> **Estado:** 🔄 EN PROGRESO
> **Tiempo estimado total:** 55 min (6 fases granulares)
> **Padre:** HU-001.1 (Completar Frontmatter Blog) — extiende y corrige omisión
> **Diagnóstico de referencia:** `gestion_proyecto/diagnosticos/diagnostico_reading_time_blog.md`

---

## 🎯 Objetivo

Cerrar el hueco histórico en el sistema de blogs que **ignora el tiempo de lectura** del frontmatter markdown, mostrando siempre "5 min" como fallback en los cards del listado.

**Lo que se logrará:**

1. ✅ El campo `tiempo_lectura` (o `reading_time`) del frontmatter se guardará en la BD
2. ✅ Cada blog mostrará su tiempo de lectura REAL en el card del listado
3. ✅ El campo se podrá omitir sin romper la UI (cae al fallback "5 min" actual)
4. ✅ La BD queda limpia y consistente con el frontmatter (fuente de verdad)
5. ✅ La HU-001.1 queda actualizada para incluir este campo en la lista oficial
6. ✅ Documentación operativa (PLANTILLA y PROC) refleja el nuevo estándar

---

## 📌 Contexto y causa raíz

**Resumen del diagnóstico completo:** `gestion_proyecto/diagnosticos/diagnostico_reading_time_blog.md`

El template `blog_list.html` muestra siempre "5 min" porque:

```
📄 blog.md  →  ⚙️ parser  →  ⚙️ comando  →  🗄️ modelo  →  🎨 template
   ✅ SÍ         ✅ SÍ          ❌ NO            ❌ NO EXISTE    🟡 parche
   tiene         parsea         lo guarda        el campo       con |default:5
```

El comando `import_blogs` SÍ recibe el `frontmatter` (dict con `tiempo_lectura: 8`) pero la función `save_blog_post` no extrae ese campo ni lo asigna al `BlogPost`. Y el modelo `BlogPost` carece del campo. El template compensa con `|default:"5"`.

**Precedente exitoso:** La migración `0006_blogpost_cover_image.py` añadió el campo `cover_image` al modelo siguiendo el mismo patrón que usaremos para `reading_time`.

---

## ✅ Criterios de aceptación

### CA-1: Modelo de datos

- [ ] El modelo `BlogPost` tiene un nuevo campo `reading_time` (PositiveIntegerField, null=True, blank=True)
- [ ] Existe la migración `0009_blogpost_reading_time.py` generada por Django
- [ ] La migración es **aditiva y reversible** (no afecta datos existentes)

### CA-2: Comando de importación

- [ ] El comando `import_blogs` lee el campo `tiempo_lectura` (español) o `reading_time` (inglés) del frontmatter
- [ ] Si el valor existe y es un entero válido, se guarda en `BlogPost.reading_time`
- [ ] Si el valor existe pero NO es un entero válido, se muestra WARNING y se omite (no se rompe)
- [ ] Si el valor NO existe, se deja `NULL` en la BD (el template usa el fallback "5")
- [ ] El comando sigue siendo **idempotente**: re-ejecutarlo N veces no duplica ni rompe

### CA-3: Datos en producción

- [ ] Tras re-ejecutar `import_blogs`, el blog de Zoho tiene `reading_time = 8` en la BD
- [ ] El blog de UI/UX (sin campo en frontmatter) tiene `reading_time = NULL`
- [ ] El blog de test_format (sin campo en frontmatter) tiene `reading_time = NULL`

### CA-4: Visualización

- [ ] El card del blog de Zoho muestra **"8 min"** en `/blog/`
- [ ] Los demás blogs siguen mostrando **"5 min"** (fallback, sin regresión)
- [ ] La UI no se rompe en ningún caso (con valor, sin valor, valor inválido)

### CA-5: Documentación actualizada

- [ ] HU-001.1 incluye `reading_time` en su lista oficial de campos soportados
- [ ] `gestion_proyecto/procedimientos/PLANTILLA_ESTANDAR_BLOG_SEO.md` muestra el campo en el YAML de ejemplo
- [ ] `gestion_proyecto/procedimientos/PROC_001_escribir_blog.md` menciona el campo en la lista oficial

### CA-6: Garantías técnicas

- [ ] Cero dependencias nuevas (solo Django nativo)
- [ ] Cero cambios en código existente que funcione (todo es ADITIVO)
- [ ] Cero riesgo de pérdida de datos (migración nullable)
- [ ] El comando `import_blogs` no se rompe con valores ausentes o malformados
- [ ] La migración es reversible con `migrate blog 0008`

---

## 🎯 Decisiones de diseño (validadas)

| Decisión                             | Elección                                            | Justificación                                                             |
| ------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------- |
| Nombre del campo en el frontmatter   | **Aceptar AMBOS** `reading_time` y `tiempo_lectura` | Retrocompatibilidad con el blog de Zoho que ya tiene `tiempo_lectura: 8`  |
| Nombre del campo en el modelo        | `reading_time` (inglés)                             | Coherencia con el resto del modelo (slug, title, content_html, etc.)      |
| Tipo de dato                         | `PositiveIntegerField(null=True, blank=True)`       | Solo números positivos en minutos, opcional                               |
| Comportamiento del template (Fase 4) | **Opción A: mantener `\|default:"5"`**              | No introduce lógica nueva; el "5" es un fallback explícito y documentado  |
| Manejo de valor inválido             | WARNING + omitir (no romper)                        | Defensive programming, alineado con el principio "no romper lo existente" |
| Nombre de la migración               | `0009_blogpost_reading_time.py`                     | Django la nombra automáticamente siguiendo la convención                  |

> 🟡 **Mejora futura (no en esta HU):** Calcular el tiempo de lectura automáticamente desde `len(content_html)//1500` cuando `reading_time` es NULL. Esto puede ser una HU aparte (HU-015) para no mezclar responsabilidades.

---

## 📦 Fases de implementación granular (≤15 min cada una)

| Fase  | Tarea                                                                                | Tiempo | Estado |
| ----- | ------------------------------------------------------------------------------------ | ------ | ------ |
| **0** | Crear este documento HU-014 (ESTAMOS AQUÍ)                                           | 5 min  | ✅      |
| **1** | Añadir campo `reading_time` al modelo + crear migración 0009 + aplicar               | 10 min | ⬜      |
| **2** | Modificar `save_blog_post` para leer `tiempo_lectura`/`reading_time` del frontmatter | 15 min | ⬜      |
| **3** | Re-ejecutar `python manage.py import_blogs` para popular la BD                       | 5 min  | ⬜      |
| **4** | Verificar visualmente en `/blog/` y limpiar `\|default:"5"` si es necesario          | 5 min  | ⬜      |
| **5** | Actualizar HU-001.1, PLANTILLA_ESTANDAR y PROC_001 con el nuevo campo                | 10 min | ⬜      |
| **6** | Validación final integral + commit                                                   | 5 min  | ⬜      |

**Total:** ~55 min, ejecutado en 6 sesiones de confirmación independientes.

---

## 🛠️ Especificación técnica por fase

### 📌 FASE 1: Modelo + Migración (10 min)

**Archivo:** `backend/blog/models.py`

Añadir después de `cover_image` (al final de los campos de `BlogPost`):

```python
reading_time = models.PositiveIntegerField(
    null=True,
    blank=True,
    help_text="Tiempo de lectura en minutos, leido del frontmatter 'tiempo_lectura' o 'reading_time'.",
)
```

**Comandos:**

```bash
source .venv/Scripts/activate
cd backend
python manage.py makemigrations blog
# Resultado esperado: Migrations for 'blog':
#   blog/migrations/0009_blogpost_reading_time.py
#     - Add field reading_time to blogpost
python manage.py migrate blog
# Resultado esperado: Applying blog.0009_blogpost_reading_time... OK
python manage.py check
# Resultado esperado: System check identified no issues (0 silenced).
```

**Verificación opcional:**

```bash
python manage.py shell -c "from blog.models import BlogPost; print(BlogPost._meta.get_field('reading_time').get_internal_type())"
# Resultado esperado: PositiveIntegerField
```

---

### 📌 FASE 2: Comando `import_blogs` (15 min)

**Archivo:** `backend/blog/management/commands/import_blogs.py`

**Localizar el método `save_blog_post`** (la implementación real está en el `Command`, líneas ~1000-1100 según el archivo). El `BlogProcessor.save_blog_post` ya delega a `self.command.save_blog_post`, así que solo se modifica en el `Command`.

**Modificación: dentro de `save_blog_post`, justo antes del `obj.save()` final:**

```python
# ✅ HU-014: Leer tiempo de lectura del frontmatter
# Acepta 'tiempo_lectura' (español, retrocompatible) o 'reading_time' (inglés)
reading_time_raw = frontmatter.get("reading_time") or frontmatter.get("tiempo_lectura")
if reading_time_raw:
    try:
        obj.reading_time = int(str(reading_time_raw).strip())
    except (ValueError, TypeError):
        self.stdout.write(self.style.WARNING(
            f"⚠️  Tiempo de lectura inválido en '{title}': {reading_time_raw!r}. Se omite."
        ))
```

**⚠️ IMPORTANTE — Localización exacta del cambio:**

El método `save_blog_post` está en `import_blogs.py` (no en `blog_processor.py`, que delega). Hay que leer ese método primero para ubicar la línea exacta donde está el `obj.save()` y el `update_fields`. **Se debe añadir el bloque de código DESPUÉS de todas las asignaciones de campos pero ANTES del `obj.save()`**.

**Comportamiento esperado:**

| Frontmatter                          | Resultado en BD                                  |
| ------------------------------------ | ------------------------------------------------ |
| `tiempo_lectura: 8`                  | `reading_time = 8`                               |
| `reading_time: 12`                   | `reading_time = 12`                              |
| `tiempo_lectura: "8"` (con comillas) | `reading_time = 8` (el parser ya quita comillas) |
| `tiempo_lectura: abc` (inválido)     | `reading_time = NULL` + WARNING en consola       |
| Sin campo                            | `reading_time = NULL`                            |

---

### 📌 FASE 3: Re-importar blogs (5 min)

**Comando:**

```bash
source .venv/Scripts/activate
cd backend
python manage.py import_blogs
```

**Verificación en BD:**

```bash
python manage.py shell -c "from blog.models import BlogPost; [print(f'{p.slug}: {p.reading_time} min') for p in BlogPost.objects.all()]"
```

**Salida esperada (ejemplo):**

```
por-que-las-integraciones-zoho-fallan: 8 min
mejoras-ui-ux-blog-historico: None min
test-format: None min
test-blog: None min
```

---

### 📌 FASE 4: Verificación visual (5 min)

1. **Levantar el server:**

   ```bash
   python manage.py runserver
   ```

2. **Abrir en el navegador:** `http://localhost:8000/blog/`

3. **Verificar:**
   - Card del blog de Zoho: **"8 min"** ✅
   - Cards de los demás blogs: **"5 min"** (fallback) ✅ — sin regresión

4. **Decisión:** si la UI muestra correctamente los valores y el "5 min" en los blogs sin el campo se ve bien, esta fase se da por completada. Si se quisiera reemplazar el "5 min" por algo más inteligente, se haría en una **HU-015** aparte.

**Archivos del template que muestran el campo (NO se modifican en esta fase):**

- `backend/blog/templates/blog/blog_list.html` (línea ~197)
- `backend/blog/templates/blog/partials/_post_grid.html` (línea ~47)

> 🟡 El `|default:"5"` se mantiene intencionalmente. Es un valor de fallback documentado y predecible.

---

### 📌 FASE 5: Documentación (10 min)

**5.1 Actualizar HU-001.1:**

Archivo: `gestion_proyecto/hus/HU-001.1_COMPLETAR_FRONTMATTER_BLOG.md`

Añadir a la lista de campos soportados (después de `meta_description`):

```markdown
- [x] `reading_time` (o `tiempo_lectura`) → se guarda como `BlogPost.reading_time` (nullable)
```

**5.2 Actualizar PLANTILLA_ESTANDAR_BLOG_SEO.md:**

Archivo: `gestion_proyecto/procedimientos/PLANTILLA_ESTANDAR_BLOG_SEO.md`

Añadir al YAML de ejemplo:

```yaml
reading_time: 8   # tiempo de lectura aproximado en minutos (opcional)
```

**5.3 Actualizar PROC_001_escribir_blog.md:**

Archivo: `gestion_proyecto/procedimientos/PROC_001_escribir_blog.md`

Añadir `reading_time` a la lista oficial de campos del frontmatter.

---

### 📌 FASE 6: Validación final + commit (5 min)

**Checklist final:**

- [ ] `python manage.py check` sin errores
- [ ] `python manage.py import_blogs` ejecutado, sin errores
- [ ] Blog de Zoho muestra "8 min" en `/blog/`
- [ ] Otros blogs siguen mostrando "5 min"
- [ ] Migración `0009_blogpost_reading_time.py` existe
- [ ] Documentación actualizada (HU-001.1, PLANTILLA, PROC)
- [ ] Sin cambios en código que funcionaba antes

**Commit sugerido:**

```bash
git add -A
git commit -m "feat(blog): HU-014 tiempo de lectura en blogs

- Añadir campo reading_time al modelo BlogPost (nullable)
- Crear migración 0009_blogpost_reading_time
- Modificar import_blogs para leer 'tiempo_lectura' o 'reading_time' del frontmatter
- Actualizar HU-001.1, PLANTILLA_ESTANDAR y PROC_001
- Mantener '|default:5' en templates como fallback explicito
- Refs: diagnostico_reading_time_blog.md"
```

---

## 🛡️ Plan de rollback

Si algo sale mal en cualquier fase:

| Fase      | Reversión                                                                         |
| --------- | --------------------------------------------------------------------------------- |
| FASE 1    | `python manage.py migrate blog 0008` (deshace la migración, sin pérdida de datos) |
| FASE 2    | Revertir el cambio en `import_blogs.py` con `git checkout`                        |
| FASE 3    | Re-ejecutar `import_blogs` con el código revertido (limpia los datos)             |
| FASES 4-6 | Revertir con `git checkout` (cambios solo en docs/templates)                      |

**Pérdida de datos:** NINGUNA. Todos los campos son nullable, ningún blog existente tiene valor que se pueda perder.

---

## 📊 Métricas de éxito

| Métrica                                  | Antes              | Después (esperado)                  |
| ---------------------------------------- | ------------------ | ----------------------------------- |
| Blogs con `reading_time` real en BD      | 0 / 3              | 1 / 3 (Zoho)                        |
| Blogs con "5 min" falso en UI            | 3 / 3              | 2 / 3 (los que no tienen el campo)  |
| Precisión del tiempo de lectura mostrado | 0%                 | 100% (en los blogs que lo declaran) |
| Campos del frontmatter ignorados         | 1 (tiempo_lectura) | 0                                   |
| HUs con documentación inconsistente      | 1 (HU-001.1)       | 0                                   |

---

## 🔗 Referencias

- 📄 Diagnóstico completo: `gestion_proyecto/diagnosticos/diagnostico_reading_time_blog.md`
- 📋 HU padre: `gestion_proyecto/hus/HU-001.1_COMPLETAR_FRONTMATTER_BLOG.md`
- 📋 HU original: `gestion_proyecto/hus/HU-001_blog_markdown_django.md`
- 📝 Estándar SEO: `gestion_proyecto/procedimientos/PLANTILLA_ESTANDAR_BLOG_SEO.md`
- 📝 Procedimiento: `gestion_proyecto/procedimientos/PROC_001_escribir_blog.md`
- 🛠️ Modelo: `backend/blog/models.py` (clase `BlogPost`)
- 🛠️ Comando: `backend/blog/management/commands/import_blogs.py`
- 🛠️ Parser: `backend/blog/utils/importer/markdown_utils.py`
- 🎨 Templates afectados: `backend/blog/templates/blog/blog_list.html`, `backend/blog/templates/blog/partials/_post_grid.html`
- 📜 Precedente: `backend/blog/migrations/0006_blogpost_cover_image.py`

---

## 📝 Historial de cambios

| Fecha      | Versión | Cambio                                              | Autor |
| ---------- | ------- | --------------------------------------------------- | ----- |
| 01/06/2026 | 1.0     | Creación inicial de la HU-014 basada en diagnóstico | Cline |

---

> 🟡 **Esperando confirmación del usuario para iniciar la Fase 1 (modelo + migración).**
