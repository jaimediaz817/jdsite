# 📋 HU-011: Editor Online de Blog con Guardado como Markdown

> **ID:** HU-011  
> **Fecha:** 30/04/2026  
> **Responsable:** Cline  
> **Estado:** 🔵 Pendiente  
> **Tiempo estimado total:** 8 fases (~20 min cada una)  
> **Dependencias:** HU-001 (sistema blogs), HU-001.1 (frontmatter completo), HU-008 (usuarios OAuth)

---

## 🎯 Objetivo

Crear un editor markdown online que permita a usuarios autenticados escribir artículos del blog desde el navegador, con soporte para pegar imágenes (igual que VS Code), y que al guardar genere **exactamente** la misma estructura de archivos que el flujo manual actual — ejecutando `import_blogs` automáticamente para publicación inmediata, con protecciones anti-spam y moderación por roles.

---

## 🔍 DIAGNÓSTICO TÉCNICO COMPLETO

### 1. Arquitectura Actual del Blog

```
FLUJO ACTUAL (100% local):
                                                    
  Autor en VS Code           GitHub              VPS Producción           Cron Job
  ──────────────────         ────────            ────────────────         ────────
  blogs_source/              git push            git pull                 import_blogs
  ├── YYYY-MM-DD_slug/                           import_blogs             (cada 6h)
  │   ├── blog.md                                (cada 6h cron)
  │   ├── portada.jpg                            ↓
  │   └── diagrama.png                           BlogPost en BD
  ↓                                              ↓
  blog.md + imágenes         ←─── sync ───→      static/blogs/slug/
                                                ├── portada.jpg
                                                └── diagrama.png
```

### 2. Flujo Propuesto con el Editor Online

```
FLUJO NUEVO (editor online):
                                                    
  Autor en Web                   Django Server                  
  ──────────────────             ────────────────              
  blog/editor/                   
  ├── Escribe markdown           POST /api/save-draft/         
  ├── Pega imágenes              POST /api/upload-image/      
  └── Clic "Publicar"            ↓                            
                                 1. Valida hCaptcha
                                 2. Verifica Rate Limit
                                 3. Crea blogs_source/
                                 4. Guarda blog.md
                                 5. Guarda imágenes
                                 6. ✅ Admin: import_blogs inmediato
                                 7. ❌ Otro: Draft + email notificación
```

### 3. Estructura de `blogs_source` (LA FUENTE DE VERDAD)

```
backend/blogs_source/
├── 2026-04-24_por-que-las-integraciones-zoho-fallan/
│   ├── blog.md                    ← Contenido markdown
│   ├── captura_pantalla_1.png     ← Imágenes referenciadas
│   └── diagrama_arq.png
├── 2026-04-26_mejoras_ui_ux_blog_historico/
│   ├── blog.md
│   └── imagen1.png
└── test_blog/
    └── blog.md
```

**Regla de oro:** Cada blog es una carpeta con formato `YYYY-MM-DD_slug/` y dentro un archivo obligatorio `blog.md` + archivos multimedia.

### 4. Formato del `blog.md` (FRONTMATTER OBLIGATORIO)

```markdown
---
title: "Título del artículo"
description: "Descripción corta"
date: 2026-04-24
draft: false
image: "cover.jpg"
author: "Jaime Díaz"
author_email: "jaimeivan0017@gmail.com"
author_provider: "google"
category: "Categoría"
tags: ["tag1", "tag2"]
meta_title: "Título SEO"
meta_description: "Descripción SEO"
---

# Título del artículo

![alt text](imagen_portada.jpg)  ← Primera imagen = portada automática

Contenido del artículo en markdown...

## Sección 2

Más contenido...
```

### 5. Componentes Clave del Sistema

| Componente    | Archivo                                            | Función                                                                                       |
| ------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Modelo        | `backend/blog/models.py`                           | `BlogPost`: slug, title, content_html, source_hash, cover_image, meta_title, meta_description |
| Importador    | `backend/blog/utils/importer/blog_processor.py`    | Convierte MD → HTML, copia imágenes a `static/blogs/<slug>/`, genera slugs, extrae portada    |
| Comando       | `backend/blog/management/commands/import_blogs.py` | Orquesta importación de todos los blogs                                                       |
| URLs          | `backend/blog/urls.py`                             | Rutas: `/blog/` (listado), `/blog/<slug>/` (detalle)                                          |
| Plantilla SEO | `PLANTILLA_ESTANDAR_BLOG_SEO.md`                   | Estructura obligatoria del contenido                                                          |

### 6. Flujo del Importador (`blog_processor.py`)

```
blog.md + imágenes (blogs_source/)
    ↓
read_markdown_file() → extrae frontmatter YAML + contenido MD
    ↓
extract_title() → título desde # o desde nombre de carpeta
    ↓
check_existing_blog() → compara hash para evitar duplicados
    ↓
copy_blog_images() → copia imágenes/vídeos a static/blogs/slug/
    ↓
extract_cover_image() → primera imagen = portada (se elimina del contenido)
    ↓
replace_special_blocks_md() → procesa bloques especiales (:::slides, etc.)
    ↓
convert_markdown_to_html() → MD → HTML con markdown lib
    ↓
process_images() → reescribe rutas de imágenes a /static/blogs/slug/
    ↓
process_videos() → convierte img→video, reescribe tags <video>
    ↓
auto_create_carousels() → carruseles automáticos para imágenes consecutivas
    ↓
save_blog_post() → guarda en BD con todos los campos
```

### 7. Requisitos Críticos de Compatibilidad

Para que el editor online funcione con el importador existente:

1. **Nombre del archivo:** DEBE ser `blog.md`
2. **Carpeta:** DEBE seguir formato `YYYY-MM-DD_slug/`
3. **Imágenes:** DEBEN estar en la misma carpeta del blog
4. **Referencias markdown:** DEBEN usar rutas relativas (`./imagen.png`)
5. **Frontmatter:** DEBE seguir formato YAML estándar
6. **Primera imagen:** Se convierte automáticamente en portada

---

## 📦 Librerías CDN (Sin instalar nada - Zero Dependencias Nuevas)

Para evitar reinventar la rueda, se usarán las siguientes librerías vía CDN:

| Necesidad                            | Librería         | CDN                                                                    | Función                                                         |
| ------------------------------------ | ---------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Editor markdown + toolbar**        | **EasyMDE**      | `https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.js`             | Editor con toolbar (bold, italic, headings, image upload, etc.) |
| **Estilos del editor**               | **EasyMDE CSS**  | `https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css`            | Estilos limpios del editor                                      |
| **Preview en tiempo real**           | **Marked.js**    | `https://cdn.jsdelivr.net/npm/marked/marked.min.js`                    | Renderiza markdown a HTML al instante                           |
| **Sanitización HTML**                | **DOMPurify**    | `https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.4.3/purify.min.js` | Previene XSS en el preview                                      |
| **Upload de imágenes (drag & drop)** | **FilePond**     | `https://unpkg.com/filepond/dist/filepond.min.js`                      | Drag & drop, Ctrl+V, progreso de upload                         |
| **Estilos FilePond**                 | **FilePond CSS** | `https://unpkg.com/filepond/dist/filepond.min.css`                     | Estilos del uploader                                            |

**Ventajas de EasyMDE sobre CodeMirror puro:**
- ✅ Toolbar incluido (negrita, cursiva, headings, listas, imágenes, etc.)
- ✅ Soporte de drag & drop de imágenes built-in
- ✅ Preview side-by-side
- ✅ Autoguardado en localStorage
- ✅ Tamaño pequeño (~50KB minified)

---

## 🧩 Criterios de Aceptación

1. [ ] Existe botón "Quiero escribir un artículo" visible en blog_list (solo para usuarios autenticados)
2. [ ] Al hacer clic, se abre `/blog/editor/` con editor markdown (EasyMDE)
3. [ ] El editor permite escribir en markdown con preview en tiempo real
4. [ ] Se puede pegar imágenes (Ctrl+V) y FilePond las procesa automáticamente
5. [ ] Se puede hacer drag & drop de imágenes
6. [ ] Se puede adjuntar archivos desde botón de upload
7. [ ] El editor genera frontmatter automáticamente (title, slug, date, author, author_email)
8. [ ] Al guardar, se crea carpeta `blogs_source/YYYY-MM-DD_slug/`
9. [ ] El archivo `blog.md` se genera con formato correcto
10. [ ] Las imágenes se guardan en la misma carpeta del blog
11. [ ] Las referencias en markdown usan rutas relativas (`./imagen.png`)
12. [ ] Al publicar, se ejecuta `import_blogs` automáticamente para publicación inmediata
13. [ ] Se muestra preview del artículo antes de publicar
14. [ ] Soporta guardar como borrador (draft=true) y publicar después
15. [ ] Soporta edición de blogs existentes (reescribe blog.md y re-ejecuta import_blogs)
16. [ ] El editor es responsive y funciona en mobile
17. [ ] Auto-save cada 30s en localStorage (no pierde contenido si cierra el navegador)
18. [ ] Validación de tamaño máximo de imágenes (10MB) y formatos permitidos
19. [ ] **Moderación:** Solo admin publica inmediato; otros usuarios crean drafts + notificación
20. [ ] **Anti-spam:** hCaptcha + Rate Limit (1 artículo/24h por usuario no-admin)
21. [ ] **Backup:** Antes de editar un blog existente, se crea backup automático
22. [ ] **Limpieza:** Las imágenes temporales se borran automáticamente después de 24h
23. [ ] **Notificación:** Email al admin cuando un usuario guarda o edita un artículo
24. [ ] **Autoría:** Se guarda `author_email` y `author_provider` en el frontmatter

---

## 📐 Alcance

### ✅ Incluye

- **Backend:** API para guardar blogs como archivos markdown en `blogs_source`
- **Backend:** API para upload de imágenes
- **Backend:** Ejecución automática de `import_blogs` al guardar/publicar
- **Frontend:** Página de editor con **EasyMDE** (CDN) + toolbar completo
- **Frontend:** Preview en tiempo real con **Marked.js** + **DOMPurify**
- **Frontend:** Upload de imágenes con **FilePond** (drag & drop, Ctrl+V, botón)
- **Frontend:** Auto-save en localStorage cada 30s
- **UI:** Botón de acceso desde blog_list.html
- **UI:** Formulario de frontmatter (título, descripción, categoría, tags, SEO)
- **UI:** Modal de confirmación antes de publicar
- **UI:** Checkbox de términos y condiciones
- **Guardado:** Drafts (borradores) y Publicación directa
- **Edición:** Posibilidad de editar blogs existentes (reescritura)
- **Seguridad:** hCaptcha, Rate Limit, backup automático, limpieza de temporales

### ❌ Excluye

- **No** se modifica el modelo `BlogPost`
- **No** se instalan dependencias Python nuevas (todas las librerías son CDN)
- **No** se elimina el flujo manual (ambos flujos coexisten)
- **No** se implementa integración con LinkedIn

---

## 🛠️ Implicaciones Técnicas Detalladas

### 1. Manejo de Imágenes con FilePond (CRÍTICO)

**Solución frontend (EasyMDE + FilePond):**
```javascript
const easyMDE = new EasyMDE({
    element: document.getElementById('editor'),
    uploadImage: true,
    imageUploadEndpoint: '/blog/api/upload-image/',
    imageMaxSize: 10 * 1024 * 1024, // 10MB
    imageAccept: 'image/png, image/jpeg, image/gif, image/webp, image/svg+xml',
    autoDownloadFontAwesome: false,
    spellChecker: false,
    toolbar: ['bold', 'italic', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', 'table', '|', 'preview', 'side-by-side', 'fullscreen', '|', 'guide']
});
```

**Solución backend:**
```python
# POST /blog/api/upload-image/
# multipart/form-data: file=<imagen>, blog_slug=<slug>
# Response: { "url": "./nombre_imagen.png" }

def upload_blog_image(request):
    file = request.FILES['file']
    slug = request.POST.get('blog_slug')
    temp_dir = settings.BLOG_TEMP_UPLOADS / str(request.user.id)
    temp_dir.mkdir(parents=True, exist_ok=True)
    filepath = temp_dir / file.name
    with open(filepath, 'wb+') as f:
        for chunk in file.chunks():
            f.write(chunk)
    return JsonResponse({'url': f'./{file.name}'})
```

### 2. Flujo de Guardado + Moderación por Roles

```python
# POST /blog/api/save-draft/
# Body: { title, content_md, meta, images[], publish: true/false }

from django.core.management import call_command
from django.core.mail import send_mail

def save_blog_draft(request):
    data = json.loads(request.body)
    
    # 1. Verificar Rate Limit (solo si no es admin)
    if not request.user.is_superuser:
        check_rate_limit(request.user)
        verify_hcaptcha(data.get('hcaptcha_token'))
    
    slug = generate_unique_slug(data['title'])
    date_prefix = datetime.now().strftime('%Y-%m-%d')
    folder_name = f"{date_prefix}_{slug}"
    
    # 2. Crear carpeta en blogs_source
    target_dir = settings.BLOGS_SOURCE_DIR / folder_name
    target_dir.mkdir(exist_ok=True)
    
    # 3. Mover imágenes de temp a carpeta final
    temp_dir = settings.BLOG_TEMP_UPLOADS / str(request.user.id)
    for img in data.get('images', []):
        src = temp_dir / img
        if src.exists():
            shutil.move(src, target_dir / img)
    
    # 4. Generar frontmatter con autoría
    author_name = request.user.get_full_name() or request.user.username
    frontmatter = generate_frontmatter(data, author_name, request.user.email)
    
    # 5. Guardar blog.md
    blog_content = f"{frontmatter}\n\n{data['content_md']}"
    (target_dir / 'blog.md').write_text(blog_content)
    
    # 6. ✅ PUBLICACIÓN según rol
    if data.get('publish', False) and request.user.is_superuser:
        call_command('import_blogs')
        return JsonResponse({'slug': slug, 'folder': folder_name, 'published': True, 'status': 'published'})
    elif data.get('publish', False):
        # No-admin: guardar como draft y notificar
        # El frontmatter ya tiene draft: true
        notify_admin_new_blog(request.user, data['title'], slug)
        return JsonResponse({'slug': slug, 'folder': folder_name, 'published': False, 'status': 'pending_review'})
    
    return JsonResponse({'slug': slug, 'folder': folder_name, 'published': False, 'draft': True, 'status': 'draft'})
```

### 3. Slugs Únicos Sin Conflictos

```python
def generate_unique_slug(title):
    """Genera slug único agregando sufijo numérico si existe."""
    base_slug = slugify(title)
    slug = base_slug
    counter = 1
    while list(settings.BLOGS_SOURCE_DIR.glob(f"*_{slug}")):
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug
```

### 4. Backup Automático al Editar

```python
def backup_blog(target_dir):
    """Crea backup del blog.md antes de editarlo."""
    backup_dir = target_dir / ".backups"
    backup_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    source = target_dir / "blog.md"
    if source.exists():
        shutil.copy2(source, backup_dir / f"blog_{timestamp}.md")
```

### 5. Comando de Limpieza de Temporales

```python
# python manage.py cleanup_blog_uploads
# Cron diario: borra archivos temporales > 24h

from django.core.management.base import BaseCommand
import time

class Command(BaseCommand):
    def handle(self, *args, **options):
        temp_base = settings.BLOG_TEMP_UPLOADS
        now = time.time()
        for user_dir in temp_base.iterdir():
            if user_dir.is_dir():
                for f in user_dir.iterdir():
                    if f.is_file() and (now - f.stat().st_mtime) > 86400:
                        f.unlink()
                if not list(user_dir.iterdir()):
                    user_dir.rmdir()
```

### 6. Notificación al Admin + Aprobación con 1 Clic

**Flujo:**
1. Usuario no-admin publica → se guarda como draft
2. Te llega email con enlace de aprobación firmado
3. Haces clic → se ejecuta `import_blogs` → artículo publicado al instante

```python
# POST /blog/api/approve/<token>/
# Al hacer clic en el enlace del email, se ejecuta import_blogs

from django.utils.crypto import constant_time_compare
from django.core.signing import TimestampSigner, SignatureExpired

def approve_blog(request, token):
    """Aprueba un artículo con un solo clic desde el email."""
    try:
        # El token expira en 7 días por seguridad
        signer = TimestampSigner()
        slug = signer.unsign(token, max_age=604800)  # 7 días
    except (SignatureExpired, BadSignature):
        return HttpResponse("Enlace inválido o expirado", status=400)
    
    # Ejecutar import_blogs para publicar
    call_command('import_blogs')
    
    return HttpResponse("""
        <html>
        <head><title>Artículo aprobado</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px;">
            <h1>✅ Artículo publicado</h1>
            <p>El artículo se ha publicado exitosamente.</p>
            <p><a href="https://jaimediaz.dev/blog/{slug}/">Ver artículo</a></p>
        </body>
        </html>
    """.format(slug=slug))


def notify_admin_new_blog(user, title, slug):
    """Email al admin con enlace de aprobación de 1 clic."""
    signer = TimestampSigner()
    token = signer.sign(slug)
    
    subject = f"📝 Nuevo artículo pendiente: {title}"
    message = f"""
    Usuario: {user.get_full_name()} ({user.email})
    Título: {title}
    
    ✅ APROBAR CON 1 CLIC:
    https://jaimediaz.dev/blog/api/approve/{token}/
    
    ✏️ EDITAR ANTES DE APROBAR:
    https://jaimediaz.dev/blog/editor/{slug}/
    
    El enlace de aprobación expira en 7 días.
    """
    send_mail(subject, message, 'noreply@jaimediaz.dev', ['jaimeivan0017@gmail.com'])
```

### 7. Preview en Tiempo Real

```javascript
const previewElement = document.getElementById('preview');
easyMDE.codemirror.on('change', function() {
    const html = marked.parse(easyMDE.value());
    const sanitized = DOMPurify.sanitize(html);
    previewElement.innerHTML = sanitized;
});
```

### 8. Frontmatter Automático

```yaml
---
title: "Título del artículo"
description: ""
date: 2026-04-30
draft: true
image: ""
author: "Nombre del usuario"
author_email: "email@usuario.com"
author_provider: "google"
category: ""
tags: []
meta_title: ""
meta_description: ""
---
```

### 9. Seguridad

- Solo usuarios autenticados (OAuth) pueden acceder al editor
- hCaptcha en formulario de publicación (anti-spam)
- Rate Limit: 1 artículo cada 24h por usuario no-admin
- Validar tipos de archivo en upload (png, jpg, gif, webp, svg, mp4)
- Límite de tamaño: 10MB por imagen, 50MB por vídeo
- Sanitizar nombres de archivo
- DOMPurify sanitiza el preview HTML
- Backup automático antes de editar blogs existentes
- Limpieza automática de archivos temporales > 24h

---

## 🛡️ Protecciones Anti-Problemas (Para que no haya líos)

### 1. Moderación por Roles

```
¿Quién publica?          ¿Qué pasa?
─────────────────────────────────────────────────
TÚ (admin/superuser)     → ¡Publicación inmediata! ✅
                           import_blogs se ejecuta al instante

Otro usuario            → Borrador (draft: true) ⏳
                           Te llega email de notificación
                           Tú apruebas desde el admin de Django
                           Luego ejecutas import_blogs manualmente
```

### 2. Anti-Spam en 3 Capas

- **Capa 1 - hCaptcha:** Verificación en el formulario de publicación
- **Capa 2 - Rate Limit:** Máximo 1 artículo cada 24h por usuario no-admin
- **Capa 3 - Filtro:** DOMPurify elimina HTML malicioso + lista negra de URLs

### 3. Autoría Obligatoria

Cada artículo guarda `author_email` y `author_provider` en el frontmatter para saber siempre quién escribió qué.

### 4. Modal de Confirmación

```
┌─────────────────────────────────────────┐
│  ¿Publicar artículo?                    │
│                                         │
│  Título: "Cómo integrar Zoho con..."   │
│  Esto hará visible el artículo en el   │
│  blog para todos los visitantes.       │
│                                         │
│  [Cancelar]  [Sí, publicar]            │
└─────────────────────────────────────────┘
```

### 5. Checkbox de Términos

```
☐ Acepto que el contenido es original y no infringe derechos de autor
```

---

## 📋 Plan de Implementación

### Fase 1: Backend - API de Guardado con Moderación (20 min)

**Archivos a crear/modificar:**
- `backend/blog/views.py` → `blog_editor_view`, `save_blog_draft_api`
- `backend/blog/urls.py` → `/editor/`, `/api/save-draft/`
- `backend/blog/services.py` → `save_blog_to_source()`, `generate_unique_slug()`, `backup_blog()`

**Pasos:**
1. Crear vista protegida (requiere login) para el editor
2. Crear endpoint POST para guardar el blog
3. Implementar lógica de creación de carpeta + blog.md con slug único
4. Implementar moderación por roles (admin publica, no-admin crea draft)
5. Implementar backup automático antes de editar

### Fase 2: Backend - API de Upload + Limpieza (20 min)

**Archivos a crear/modificar:**
- `backend/blog/views.py` → `upload_blog_image_api`
- `backend/blog/urls.py` → `/api/upload-image/`
- `backend/blog/management/commands/cleanup_blog_uploads.py` → Nuevo comando

**Pasos:**
1. Crear endpoint POST para recibir imágenes (guarda en carpeta temporal)
2. Validar tipo de archivo (png, jpg, gif, webp, svg)
3. Retornar ruta relativa para insertar en markdown
4. Crear comando `python manage.py cleanup_blog_uploads`

### Fase 3: Frontend - Página del Editor con EasyMDE (20 min)

**Archivos a crear:**
- `backend/blog/templates/blog/blog_editor.html` → Template del editor
- `backend/blog/static/blog/css/blog_editor.css` → Estilos del editor
- `backend/blog/static/blog/js/blog_editor.js` → Lógica del editor

**Pasos:**
1. Crear template con layout del editor (sidebar frontmatter + editor + preview)
2. Integrar EasyMDE vía CDN (editor markdown con toolbar)
3. Integrar Marked.js + DOMPurify para preview en tiempo real
4. Agregar formulario de frontmatter (título, descripción, categoría, tags, SEO)

### Fase 4: Frontend - Upload de Imágenes con FilePond (20 min)

**Archivos a modificar:**
- `backend/blog/static/blog/js/blog_editor.js`

**Pasos:**
1. Integrar FilePond vía CDN para drag & drop
2. Conectar FilePond con la API de upload
3. EasyMDE maneja Ctrl+V de imágenes automáticamente
4. Mostrar progreso de upload con FilePond

### Fase 5: Frontend - Botón de Acceso + Anti-Spam (20 min)

**Archivos a modificar:**
- `backend/blog/templates/blog/blog_list.html` → Agregar botón "Quiero escribir"
- `backend/blog/templates/blog/blog_editor.html` → Agregar hCaptcha + términos
- `backend/blog/static/blog/js/blog_editor.js` → Lógica del botón

**Pasos:**
1. Agregar botón visible solo para usuarios autenticados
2. Implementar botón de "Guardar como borrador" y "Publicar"
3. Integrar hCaptcha en el formulario
4. Agregar modal de confirmación antes de publicar
5. Agregar checkbox de términos y condiciones

### Fase 6: Edición de Blogs Existentes (20 min)

**Archivos a modificar:**
- `backend/blog/views.py` → `edit_blog_view`, `update_blog_draft_api`
- `backend/blog/urls.py` → `/editor/<slug:slug>/`
- `backend/blog/static/blog/js/blog_editor.js` → Modo edición vs creación

**Pasos:**
1. Crear endpoint para cargar blog existente en el editor
2. Crear endpoint para actualizar blog existente (con backup automático)
3. Agregar botón "Editar" en blog_detail (solo para autor)

### Fase 7: Auto-save + Notificaciones (20 min)

**Archivos a modificar:**
- `backend/blog/static/blog/js/blog_editor.js`
- `backend/blog/services.py` → `notify_admin_new_blog()`

**Pasos:**
1. Implementar auto-save en localStorage cada 30s
2. Detectar contenido no guardado al cerrar (beforeunload)
3. Mostrar opción de "Recuperar borrador" al abrir el editor
4. Implementar notificación por email al admin

### Fase 8: Testing y Pulido (20 min)

**Pasos:**
1. Probar flujo admin: crear blog → pegar imagen → publicar inmediato
2. Probar flujo usuario no-admin: crear → guarda draft → email notificación
3. Probar hCaptcha + Rate Limit
4. Probar backup y restauración
5. Probar edición de blogs existentes
6. Probar en mobile
7. Verificar límites de tamaño de archivos

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo                                           | Probabilidad | Impacto | Mitigación                                        |
| ------------------------------------------------ | ------------ | ------- | ------------------------------------------------- |
| `call_command('import_blogs')` es lento (2+ seg) | Media        | Medio   | Ejecutar en segundo plano con threading           |
| Imágenes no se guardan correctamente             | Media        | Alto    | FilePond + validación backend de tipos/tamaños    |
| Frontmatter incompatible con importador          | Baja         | Crítico | Usar exactamente el formato de PROC_001           |
| Pérdida de contenido por cierre accidental       | Alta         | Alto    | Auto-save en localStorage cada 30s + beforeunload |
| Editor lento en mobile                           | Media        | Medio   | EasyMDE es ligero (~50KB), lazy loading           |
| Conflictos de nombres de archivo                 | Baja         | Medio   | `generate_unique_slug()` con sufijo numérico      |
| Usuario publica spam                             | Media        | Alto    | hCaptcha + Rate Limit + Moderación por roles      |
| Edición accidental borra contenido               | Baja         | Alto    | Backup automático antes de editar                 |
| Imágenes temporales sin limpiar                  | Alta         | Bajo    | Cron diario `cleanup_blog_uploads`                |
| Responsabilidad legal por contenido de terceros  | Baja         | Alto    | Checkbox de términos + Moderación por roles       |

---

## 📚 Referencias

- **PROC_001:** Procedimiento para escribir blogs
- **PLANTILLA_ESTANDAR_BLOG_SEO:** Estructura SEO obligatoria
- **blog_processor.py:** Importador que debe ser compatible
- **HU-001:** Sistema de blogs markdown base
- **HU-001.1:** Frontmatter completo + imagen portada
- **HU-008:** Sistema de usuarios OAuth (requerido)

---

> 📌 Última actualización: 30/04/2026  
> 📌 Dependencia: HU-008 (usuarios) debe estar completada  
> 📌 Librerías: EasyMDE + Marked.js + DOMPurify + FilePond (todas CDN, 0 pip install)  
> 📌 Protecciones: hCaptcha + Rate Limit + Moderación por roles + Backup automático