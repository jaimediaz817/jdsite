# 📋 HU-011: Editor Online de Blog con Guardado como Markdown

> **ID:** HU-011
> **Fecha:** 30/04/2026
> **Estado:** 🔵 Pendiente
> **Tiempo estimado total:** 3 fases (~20 min cada una, sub-divididas si es necesario)
> **Dependencias:** HU-001, HU-001.1, HU-008, HU-014 (reading_time)

---

## 📌 NOTAS ACLARATORIAS (importante leer antes)

### ✅ Sobre el editor (librería de terceros)
- **EasyMDE es una librería de terceros** que se carga por CDN (`https://cdn.jsdelivr.net/npm/easymde/`).
- **Cero instalaciones** en el proyecto (no requiere `pip install` ni `npm install`).
- Es un wrapper de CodeMirror con toolbar, preview y autoguardado en localStorage ya integrado.
- Si en el futuro se quiere migrar a otro editor (ej. TinyMCE, Quill, EditorJS), solo se cambia el JS y el HTML, el backend no se toca.

### ✅ Sobre el formato del contenido
El autor puede escribir el contenido del artículo en **DOS formatos**, ambos soportados:

1. **Markdown simplificado (por defecto):**
   ```markdown
   # Título del artículo
   ## Sección
   ![alt](./imagen.png)
   **negrita**, *cursiva*, [link](https://ejemplo.com)
   ```

2. **HTML directo (para escritores avanzados):**
   ```html
   <h1>Título del artículo</h1>
   <div class="layout-dos-columnas">
     <p>Columna izquierda</p>
     <p>Columna derecha</p>
   </div>
   <img src="./imagen.png" alt="descripción">
   ```

El mecanismo `import_blogs` se encarga de generar el HTML respectivo a partir del markdown (usando `python-markdown`). Si el autor ya escribió HTML directo, se respeta tal cual. **El editor no necesita distinguir entre ambos formatos** porque Markdown acepta HTML embebido de forma nativa.

### ✅ Sobre las fases
- Cada fase es **independiente** y se prueba por separado.
- Si una fase se vuelve muy larga, se subdivide en `Fase X.A` y `Fase X.B` para no consumir muchos tokens en una sola sesión.
- **Regla de las 2 preguntas**: si en una fase surgen más de 2 preguntas de diseño, se pausa y se subdivide.

---

## 🎯 Objetivo (única cosa que debe hacer)

Un editor markdown online donde el usuario:
1. Escribe markdown (con toolbar)
2. Pega imágenes y videos (Ctrl+V o drag & drop)
3. Hace clic en **"Guardar y Publicar"**
4. El sistema crea automáticamente:
   - Carpeta `blogs_source/YYYY-MM-DD_slug/`
   - Archivo `blog.md` con frontmatter (autor auto, fecha auto, tiempo de lectura mixto)
   - Imágenes y videos en la MISMA carpeta
5. Ejecuta `import_blogs` automáticamente

**Listo. Eso es todo. Nada más.**

---

## 🔧 4 Librerías CDN (cero instalaciones)

| Librería      | Para qué                      |
| ------------- | ----------------------------- |
| **EasyMDE**   | Editor markdown con toolbar   |
| **Marked.js** | Preview en tiempo real        |
| **DOMPurify** | Sanitizar preview             |
| **FilePond**  | Pegar/subir imágenes y videos |

---

## 📂 Archivos

```
backend/blog/
├── templates/blog/blog_editor.html       NUEVO
├── static/blog/js/blog_editor.js         NUEVO
├── static/blog/css/blog_editor.css       NUEVO
├── views.py                              +2 vistas
├── urls.py                               +2 URLs
└── services.py                           save_blog_to_source()
```

**NO se tocan:** `models.py`, `import_blogs.py`, `blog_processor.py`.

---

## ✅ Criterios de Aceptación

1. [ ] Botón "Escribir artículo" en `blog_list.html` (solo autenticados)
2. [ ] Editor EasyMDE con toolbar + preview en tiempo real
3. [ ] Pegar imágenes con Ctrl+V → FilePond las sube
4. [ ] Pegar videos con Ctrl+V → FilePond los sube (mp4, webm, mov)
5. [ ] Drag & drop de imágenes y videos
6. [ ] Formulario de frontmatter: título, descripción, categoría, tags
7. [ ] Autor se rellena automáticamente del usuario autenticado
8. [ ] Fecha se rellena automáticamente (hoy)
9. [ ] Tiempo de lectura: cálculo automático como sugerencia + ajuste manual
10. [ ] Al guardar: crea `blogs_source/YYYY-MM-DD_slug/`
11. [ ] Genera `blog.md` con frontmatter
12. [ ] Imágenes y videos van a la misma carpeta (raíz)
13. [ ] Referencias relativas: `./archivo.ext`
14. [ ] Ejecuta `import_blogs` al guardar
15. [ ] Admin publica inmediato, no-admin crea `draft: true`
16. [ ] Auto-save en localStorage cada 30s
17. [ ] Sanitiza preview con DOMPurify
18. [ ] Responsive (funciona en mobile)
19. [ ] El importador convierte videos a `<video>` automáticamente
20. [ ] La primera imagen subida se asigna como portada

---

## 🧩 Frontmatter que se genera

El editor pre-rellena y/o calcula:

```yaml
---
title: "..."                    # INPUT usuario
description: "..."              # INPUT usuario
date: 2026-06-03                # AUTO (hoy)
draft: false                    # AUTO (true si no-admin)
author: "Jaime Díaz"            # AUTO (request.user)
author_email: "..."             # AUTO (request.user.email)
author_provider: "google"       # AUTO (OAuth)
category: "Tecnología"          # INPUT usuario
tags: ["..."]                   # INPUT usuario (chips)
image: "primera-img.png"        # AUTO (primera imagen subida)
tiempo_lectura: 5               # MIXTO (auto + manual)
meta_title: "..."               # INPUT usuario (sugerir = title)
meta_description: "..."         # INPUT usuario
keywords: "..."                 # INPUT usuario
palabra_clave_principal: "..."  # INPUT usuario
---
```

### 🕐 Tiempo de lectura (cálculo mixto)

**Fórmula JavaScript (estándar 200 ppm):**
```javascript
function calculateReadingTime(content) {
    const cleanText = content
        .replace(/```[\s\S]*?```/g, '')         // bloques de código
        .replace(/`[^`]+`/g, '')                // código inline
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')   // imágenes
        .replace(/\[[^\]]*\]\([^)]+\)/g, m => m.split(']')[0].slice(1)) // links (mantiene texto)
        .replace(/[#*_~>`-]/g, '')              // símbolos markdown
        .replace(/:::.*?:::/gs, '');            // bloques especiales
    
    const words = cleanText.trim().split(/\s+/).filter(w => w).length;
    return { words, minutes: Math.max(1, Math.round(words / 200)) };
}
```

**Comportamiento UX:**
- Mientras el usuario escribe → se calcula y muestra: `"245 palabras → sugerido: 1 min"`
- Si el usuario NO edita el campo → se auto-rellena con el valor sugerido
- Si el usuario edita el campo manualmente → se respeta su valor (no se sobreescribe)
- Botón "Aplicar sugerencia" → vuelve al cálculo automático
- Mínimo: 1 minuto

**HTML del campo:**
```html
<div class="reading-time-field">
    <label>Tiempo de lectura</label>
    <input type="number" id="tiempo_lectura" min="1" value="1">
    <small>
        <span id="word-count">0 palabras</span>
        → sugerido: <strong><span id="suggested-time">1 min</span></strong>
        <button type="button" id="apply-suggestion">Aplicar</button>
    </small>
</div>
```

**JS de control:**
```javascript
let userOverride = false;

easyMDE.codemirror.on('change', () => {
    const content = easyMDE.value();
    const { words, minutes } = calculateReadingTime(content);
    document.getElementById('word-count').textContent = `${words} palabras`;
    document.getElementById('suggested-time').textContent = `${minutes} min`;
    if (!userOverride) {
        document.getElementById('tiempo_lectura').value = minutes;
    }
});

document.getElementById('tiempo_lectura').addEventListener('input', () => {
    userOverride = true;
});

document.getElementById('apply-suggestion').addEventListener('click', () => {
    userOverride = false;
    const { minutes } = calculateReadingTime(easyMDE.value());
    document.getElementById('tiempo_lectura').value = minutes;
});
```

---

## 🚀 3 Fases

### Fase 1: Backend (~20 min)
**Archivos:** `views.py`, `services.py`, `urls.py`

`services.py:save_blog_to_source(data, user)`:
```python
def save_blog_to_source(data, user):
    # 1. Extraer datos
    title = data['title'].strip()
    description = data.get('description', '').strip()
    content_md = data.get('content_md', '')
    category = data.get('category', '').strip()
    tags = data.get('tags', [])
    tiempo_lectura = int(data.get('tiempo_lectura', 1))
    meta_title = data.get('meta_title') or title
    meta_description = data.get('meta_description') or description
    keywords = data.get('keywords', '')
    palabra_clave_principal = data.get('palabra_clave_principal', '')
    files = data.get('files', [])  # [{'filename': 'img.png', 'type': 'image'}] o ya subidos
    is_admin = user.is_superuser
    
    # 2. Generar slug único
    from django.utils.text import slugify
    base_slug = slugify(title)
    slug = base_slug
    counter = 1
    source_dir = Path(settings.BASE_DIR) / "blogs_source"
    while any(source_dir.glob(f"*_{slug}")):
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # 3. Crear carpeta
    from datetime import datetime
    folder_name = f"{datetime.now().strftime('%Y-%m-%d')}_{slug}"
    target_dir = source_dir / folder_name
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # 4. Mover archivos de /media/blog_editor_temp/<user_id>/ a target_dir
    temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(user.id)
    image_filename = ""
    for f in files:
        src = temp_dir / f['filename']
        if src.exists():
            shutil.move(str(src), str(target_dir / f['filename']))
            if f.get('type') == 'image' and not image_filename:
                image_filename = f['filename']
    
    # 5. Auto-rellenar autor
    from allauth.socialaccount.models import SocialAccount
    try:
        provider = user.socialaccount_set.first().provider
    except:
        provider = "local"
    
    # 6. Generar frontmatter
    author_name = user.get_full_name() or user.username
    frontmatter = f"""---
title: "{title}"
description: "{description}"
date: {datetime.now().strftime('%Y-%m-%d')}
draft: {'false' if is_admin else 'true'}
image: "{image_filename}"
author: "{author_name}"
author_email: "{user.email}"
author_provider: "{provider}"
category: "{category}"
tags: {json.dumps(tags, ensure_ascii=False)}
meta_title: "{meta_title}"
meta_description: "{meta_description}"
keywords: "{keywords}"
tiempo_lectura: {tiempo_lectura}
palabra_clave_principal: "{palabra_clave_principal}"
---

# {title}

"""
    
    # 7. Guardar blog.md
    (target_dir / "blog.md").write_text(frontmatter + content_md, encoding='utf-8')
    
    # 8. Ejecutar import_blogs
    from django.core.management import call_command
    call_command('import_blogs')
    
    return {'slug': slug, 'folder': folder_name, 'published': is_admin}
```

`views.py`:
```python
@login_required
@require_POST
def save_blog_api(request):
    if request.content_type == 'application/json':
        data = json.loads(request.body)
    else:
        data = request.POST.dict()
    result = save_blog_to_source(data, request.user)
    return JsonResponse({'status': 'ok', **result})

@login_required
@require_POST
def upload_file_api(request):
    """Sube un archivo a /media/blog_editor_temp/<user_id>/"""
    file = request.FILES.get('file')
    if not file:
        return JsonResponse({'error': 'No file'}, status=400)
    
    # Validar extensión
    valid_ext = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
                 '.mp4', '.webm', '.mov', '.avi')
    if not file.name.lower().endswith(valid_ext):
        return JsonResponse({'error': 'Extensión no permitida'}, status=400)
    
    # Validar tamaño
    max_size = 100 * 1024 * 1024  # 100MB
    if file.size > max_size:
        return JsonResponse({'error': 'Archivo muy grande'}, status=400)
    
    # Guardar
    temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(request.user.id)
    temp_dir.mkdir(parents=True, exist_ok=True)
    filepath = temp_dir / file.name
    with open(filepath, 'wb+') as dest:
        for chunk in file.chunks():
            dest.write(chunk)
    
    ftype = 'video' if file.name.lower().endswith(('.mp4', '.webm', '.mov', '.avi')) else 'image'
    return JsonResponse({
        'filename': file.name,
        'url': f'./{file.name}',
        'type': ftype
    })
```

`urls.py`:
```python
path('api/save-blog/', views.save_blog_api, name='api_save_blog'),
path('api/upload-file/', views.upload_file_api, name='api_upload_file'),
```

---

### Fase 2: Frontend - Editor + FilePond (~20 min)
**Archivos:** `blog_editor.html`, `blog_editor.js`, `blog_editor.css`

`blog_editor.html` (estructura):
```html
{% extends "base.html" %}
{% load static %}

{% block extra_css %}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css">
{% endblock %}

{% block content %}
<div class="blog-editor">
    <!-- Sidebar: Frontmatter -->
    <aside class="editor-sidebar">
        <h3>📝 Cabecera del artículo</h3>
        <form id="frontmatter-form">
            <label>Título *</label>
            <input type="text" id="title" required maxlength="60">
            
            <label>Descripción *</label>
            <textarea id="description" required maxlength="155" rows="2"></textarea>
            
            <label>Categoría *</label>
            <select id="category" required>
                {% for cat in categories %}
                <option value="{{ cat.name }}">{{ cat.name }}</option>
                {% endfor %}
            </select>
            
            <label>Tags (máx 5)</label>
            <div id="tags-container">
                <input type="text" id="tag-input" placeholder="Escribe y presiona Enter">
            </div>
            
            <label>Meta título (SEO)</label>
            <input type="text" id="meta_title" maxlength="55">
            
            <label>Meta descripción (SEO)</label>
            <textarea id="meta_description" maxlength="155" rows="2"></textarea>
            
            <label>Palabra clave principal</label>
            <input type="text" id="palabra_clave_principal">
            
            <label>Keywords (separadas por coma)</label>
            <input type="text" id="keywords">
            
            <!-- Tiempo de lectura mixto -->
            <label>Tiempo de lectura (minutos)</label>
            <input type="number" id="tiempo_lectura" min="1" value="1">
            <small>
                <span id="word-count">0 palabras</span>
                → sugerido: <strong><span id="suggested-time">1 min</span></strong>
                <button type="button" id="apply-suggestion">Aplicar</button>
            </small>
            
            <!-- Info automática (solo lectura) -->
            <fieldset disabled>
                <label>Autor (automático)</label>
                <input type="text" value="{{ user.get_full_name|default:user.username }}">
                <label>Email (automático)</label>
                <input type="email" value="{{ user.email }}">
                <label>Fecha (automática)</label>
                <input type="text" value="{% now 'Y-m-d' %}">
            </fieldset>
        </form>
    </aside>
    
    <!-- Centro: Editor -->
    <main class="editor-main">
        <h2>✍️ Editor Markdown</h2>
        <textarea id="editor"></textarea>
        <small>💡 Tip: Pega imágenes/videos con Ctrl+V o arrástralos aquí</small>
        
        <!-- FilePond (oculto, se activa al paste/drop) -->
        <input type="file" id="filepond" multiple>
        
        <!-- Botón publicar -->
        <div class="editor-actions">
            <button type="button" id="btn-save" class="btn-primary">
                {% if user.is_superuser %}🟢 Guardar y Publicar{% else %}🟡 Guardar Borrador{% endif %}
            </button>
        </div>
        
        <!-- Mensaje de estado -->
        <div id="status-message"></div>
    </main>
</div>
{% endblock %}

{% block extra_js %}
<script src="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.4.3/purify.min.js"></script>
<script src="https://unpkg.com/filepond/dist/filepond.min.js"></script>
<script src="{% static 'blog/js/blog_editor.js' %}"></script>
{% endblock %}
```

`blog_editor.js` (lógica principal):
```javascript
// 1. Inicializar EasyMDE
const easyMDE = new EasyMDE({
    element: document.getElementById('editor'),
    spellChecker: false,
    autoDownloadFontAwesome: false,
    toolbar: ['bold', 'italic', 'heading', '|', 'quote', 'unordered-list', 
              'ordered-list', '|', 'link', 'image', 'table', '|', 
              'preview', 'side-by-side', 'fullscreen', '|', 'guide'],
    previewRender: (plainText) => {
        const html = marked.parse(plainText);
        return DOMPurify.sanitize(html);
    }
});

// 2. Calcular tiempo de lectura
function calculateReadingTime(content) {
    const cleanText = content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/[#*_~>`-]/g, '')
        .replace(/:::.*?:::/gs, '');
    const words = cleanText.trim().split(/\s+/).filter(w => w).length;
    return { words, minutes: Math.max(1, Math.round(words / 200)) };
}

let userOverride = false;
easyMDE.codemirror.on('change', () => {
    const content = easyMDE.value();
    const { words, minutes } = calculateReadingTime(content);
    document.getElementById('word-count').textContent = `${words} palabras`;
    document.getElementById('suggested-time').textContent = `${minutes} min`;
    if (!userOverride) {
        document.getElementById('tiempo_lectura').value = minutes;
    }
});
document.getElementById('tiempo_lectura').addEventListener('input', () => { userOverride = true; });
document.getElementById('apply-suggestion').addEventListener('click', () => {
    userOverride = false;
    const { minutes } = calculateReadingTime(easyMDE.value());
    document.getElementById('tiempo_lectura').value = minutes;
});
```

---

## 🧪 PRUEBA DE ESCRITORIO (simulación paso a paso)

### 📍 ACTO 1: El usuario interactúa con el editor

1. **El usuario abre el navegador** y va a `https://jaimediaz.dev/blog/`
2. **Hace clic en el botón "✍️ Escribir artículo"** (visible porque está autenticado)
3. **Se abre `/blog/editor/`** con EasyMDE cargado y el sidebar de frontmatter pre-rellenado:
   - Autor: "Jaime Díaz" (automático)
   - Email: "jaimeivan0017@gmail.com" (automático)
   - Fecha: 2026-06-03 (automático)
4. **El usuario escribe el título**: "Cómo configurar Django en producción"
5. **El usuario escribe la descripción**: "Aprende a desplegar Django paso a paso"
6. **Selecciona categoría** del dropdown: "Django"
7. **Agrega 3 tags** escribiéndolos y presionando Enter: "django", "deploy", "python"
8. **Pega (Ctrl+V) una imagen PNG** desde su portapapeles
   - FilePond la sube automáticamente a `/blog/api/upload-file/`
   - Al terminar, se inserta `![portada.png](./portada.png)` en el editor
9. **Arrastra (drag & drop) un video MP4** al editor
   - FilePond lo sube automáticamente
   - Se inserta `![demo.mp4](./demo.mp4)` en el editor
10. **Pega otra imagen** (captura.png) que se inserta en otra parte del artículo
11. **Escribe contenido markdown** alrededor de las imágenes
12. **Mira el campo "Tiempo de lectura"** que muestra: `"245 palabras → sugerido: 1 min"`
13. **Ajusta manualmente el tiempo** a 8 minutos (porque tiene un video largo)
14. **Hace clic en el botón "🟢 Guardar y Publicar"**

---

### 📍 ACTO 2: El sistema hace su trabajo (instantáneo, ~2-3 segundos)

15. **El JavaScript** (`blog_editor.js`) recoge todos los datos del formulario
16. **Hace un POST** a `/blog/api/save-blog/` con todos los datos + CSRF token
17. **Django** recibe la petición, valida CSRF y autenticación ✅
18. **Se ejecuta `save_blog_to_source(data, user)`** en `services.py`:
    - Genera el slug: `como-configurar-django-en-produccion`
    - Crea la carpeta: `backend/blogs_source/2026-06-03_como-configurar-django-en-produccion/`
    - Mueve los 3 archivos desde `/media/blog_editor_temp/1/` a esa carpeta
    - Genera el `blog.md` con frontmatter completo (15 campos)
    - **Llama a `call_command('import_blogs')`**
19. **`import_blogs`** se ejecuta y:
    - Detecta la nueva carpeta
    - Copia `portada.png` a `static/blogs/como-configurar-django-en-produccion/portada.png`
    - Copia `captura.png` a `static/blogs/.../captura.png`
    - Copia `demo.mp4` a `static/blogs/.../demo.mp4`
    - Extrae la primera imagen como portada: `cover_image = "/static/blogs/.../portada.png"`
    - Convierte el markdown a HTML
    - **Convierte `![demo.mp4]` a `<video controls>`** (player estilizado)
    - Crea/encuentra la categoría "Django"
    - Crea/encuentra los tags ["django", "deploy", "python"]
    - **Guarda el BlogPost en la BD** con `is_published=True` (porque admin)
    - Limpia blogs huérfanos (sincronía)
20. **El backend responde** con JSON: `{"status": "ok", "slug": "como-configurar-django-en-produccion", "published": true}`
21. **El JavaScript** muestra el mensaje: `"✅ Artículo publicado. Ver artículo"`
22. **Limpia el localStorage** (ya no hay borrador pendiente)

---

### 📍 ACTO 3: El usuario verifica el resultado

23. **El usuario hace clic en "Ver artículo"** → va a `/blog/como-configurar-django-en-produccion/`
24. **Ve su artículo publicado** con:
    - Título: "Cómo configurar Django en producción"
    - Portada: la imagen `portada.png` que subió
    - Contenido renderizado en HTML
    - El video con un player funcional (no como imagen rota)
    - Tags visibles al final
    - Tiempo de lectura: 8 min (lo que él ajustó)
    - Autor: "Jaime Díaz"
25. **También ve el artículo en el listado** `/blog/` junto a los demás

---

### 📍 SI FUERA UN USUARIO NO-ADMIN (escenario alternativo)

- El mismo flujo, PERO en el paso 18, el `draft` se genera como `true`
- En el paso 19, el BlogPost se guarda con `is_published=False`
- En el paso 21, el mensaje es: `"✅ Borrador guardado"`
- En el paso 23, el usuario NO puede ver su artículo en `/blog/`
- El admin (tú) ve el archivo en `blogs_source/YYYY-MM-DD_slug/blog.md` con `draft: true`
- Para aprobarlo, cambias `draft: true` a `draft: false` y ejecutas `python manage.py import_blogs`

---

### ⏱️ TIEMPO TOTAL: ~2-3 segundos desde el clic hasta ver el artículo publicado.
