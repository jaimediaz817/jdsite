---
title: "Plantilla Completa — Todas las Variantes del Blog"
description: "Referencia maestra con todos los formatos, componentes HTML y features disponibles en el sistema de blogs."
category: "UI/UX"
cover_image: "/static/blogs/blog_template_completo/cover.png"
tags: ["plantilla", "referencia", "tutorial", "markdown"]
---

# 🎨 Plantilla Completa del Blog — Referencia Maestra

> Este artículo es una **guía de referencia** que contiene TODOS los formatos y componentes disponibles en el sistema de blogs. Usa este archivo como plantilla al escribir nuevos artículos.

---

## 📋 1. ENCABEZADOS (H1 a H6)

El sistema soporta todos los niveles de encabezado de Markdown:

# H1 — Encabezado principal (solo uno por artículo)
## H2 — Secciones principales
### H3 — Subsecciones
#### H4 — Detalles
##### H5 — Menos importante
###### H6 — Mínimo

---

## 📝 2. TEXTO FORMATEADO

**Negrita** con `**doble asterisco**`

*Cursiva* con `*asterisco único*`

~~Tachado~~ con `~~doble tilda~~`

**_Combinación negrita + cursiva_**

---

## 📋 3. LISTAS

### Lista desordenada
- Primer elemento
- Segundo elemento
  - Subelemento A
  - Subelemento B
    - Sub-subelemento

### Lista ordenada
1. Paso uno
2. Paso dos
3. Paso tres
   1. Subpaso
   2. Subpaso

### Lista de tareas (checklist)
- [x] Tarea completada
- [x] Otra tarea hecha
- [ ] Tarea pendiente

---

## 💬 4. BLOQUES DE CÓDIGO

### Código inline
Usa `backticks` para código inline como `variable = valor` o `print("hello")`.

### Bloque de código con lenguaje (syntax highlighting)
```python
def calcular_tiempo_lectura(contenido):
    """Calcula el tiempo de lectura basado en palabras."""
    import re
    texto_limpio = re.sub(r'<[^>]+>', '', contenido)
    palabras = len(texto_limpio.split())
    minutos = max(1, round(palabras / 200))
    return minutos
```

```javascript
// Función para copiar código al portapapeles
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.closest('pre').querySelector('code').textContent);
        btn.textContent = '¡Copiado!';
        setTimeout(() => btn.textContent = 'Copiar', 2000);
    });
});
```

```html
<!-- Componente HTML personalizado -->
<div class="mi-componente">
    <h2>Título del componente</h2>
    <p>Contenido dinámico</p>
</div>
```

```css
/* Estilos del componente */
.mi-componente {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    border-radius: 12px;
}
```

```bash
# Comandos de terminal
python manage.py migrate
python manage.py createsuperuser
npm install
```

---

## 🔗 5. ENLACES E IMÁGENES

### Enlaces
[Enlace externo a Google](https://www.google.com)

[Enlace a otro artículo del blog](/blog/mi-articulo/)

### Imágenes
Las imágenes se cargan automáticamente con **zoom al hacer click** (lightbox nativo).

![Descripción de la imagen](/static/blogs/ejemplo/imagen-ejemplo.png)

> **Tip:** Las imágenes dentro de slides NO tienen zoom. El zoom es solo para imágenes dentro del contenido.

---

## 📊 6. TABLAS

| Característica   | Estado         | Prioridad |
| ---------------- | -------------- | --------- |
| Markdown básico  | ✅ Implementado | 🔴 Alta    |
| Slides           | ✅ Implementado | 🟡 Media   |
| Gallery popup    | ✅ Implementado | 🟡 Media   |
| Videos embebidos | ✅ Implementado | 🟢 Baja    |

### Tabla con alineación
| Izquierda |  Centro  | Derecha |
| :-------- | :------: | ------: |
| Texto     | Centrado |  123.45 |

---

## 💡 7. BLOQUES DE INFORMACIÓN (Callouts)

### Callout de Éxito
<div class="callout-success callout-icon">
✅ <strong>Operación exitosa:</strong> El archivo se ha guardado correctamente en la base de datos.
</div>

### Callout de Error
<div class="callout-danger callout-icon">
❌ <strong>Error:</strong> No se pudo conectar con el servidor. Verifica tu conexión a internet.
</div>

### Callout de Advertencia
<div class="highlight-box highlight-box-warning">
⚠️ <strong>Importante:</strong> Esta acción no se puede deshacer. Asegúrate de tener un backup antes de continuar.
</div>

### Callout de Información
<div class="highlight-box highlight-box-info">
ℹ️ <strong>Dato curioso:</strong> Django fue creado en 2003 por Adrian Holovaty y Simon Willison como parte del periódico Lawrence Journal-World.
</div>

### Callout de Éxito con highlight-box
<div class="highlight-box highlight-box-success">
✅ <strong>Checklist completado:</strong> Todas las pruebas pasaron correctamente.
</div>

---

## 🏷️ 8. BADGES INLINE

<span class="badge-tech">Django</span>
<span class="badge-tech">Python</span>
<span class="badge-tech">JavaScript</span>
<span class="badge-success">Production Ready</span>
<span class="badge-warning">Beta</span>
<span class="badge-danger">Deprecated</span>

---

## 📐 9. GRID LAYOUTS

### Grid de 2 columnas
<div class="blog-grid-2">
<div class="blog-grid-card">
<h4>卡片 1</h4>
<p>Contenido de la primera tarjeta</p>
</div>
<div class="blog-grid-card">
<h4>卡片 2</h4>
<p>Contenido de la segunda tarjeta</p>
</div>
</div>

### Grid de 3 columnas
<div class="blog-grid-3">
<div class="blog-grid-card">
<h4>卡片 A</h4>
<p>Primera opción</p>
</div>
<div class="blog-grid-card">
<h4>卡片 B</h4>
<p>Segunda opción</p>
</div>
<div class="blog-grid-card">
<h4>卡片 C</h4>
<p>Tercera opción</p>
</div>
</div>

### Grid de 4 columnas
<div class="blog-grid-4">
<div class="blog-grid-card">
<h4>1</h4>
<p>Primero</p>
</div>
<div class="blog-grid-card">
<h4>2</h4>
<p>Segundo</p>
</div>
<div class="blog-grid-card">
<h4>3</h4>
<p>Tercero</p>
</div>
<div class="blog-grid-card">
<h4>4</h4>
<p>Cuarto</p>
</div>
</div>

---

## 🎬 10. SLIDES (Carrusel de imágenes)

Los slides se crean con el bloque especial `:::slides`. Cada slide tiene imagen + caption.

```
:::slides
![Descripción 1](/static/blogs/ejemplo/slide1.png) ||| Título 1 ||| Descripción del primer slide
![Descripción 2](/static/blogs/ejemplo/slide2.png) ||| Título 2 ||| Descripción del segundo slide
![Descripción 3](/static/blogs/ejemplo/slide3.png) ||| Título 3 ||| Descripción del tercer slide
:::
```

**Formato:** `![alt](url) ||| título ||| descripción`

- Navegación con flechas izquierda/derecha
- Puntos indicadores
- Contador (1/3, 2/3, 3/3)
- Responsive: en móvil imagen arriba, caption abajo

---

## 🖼️ 11. GALLERY POPUP (Galería de imágenes)

La galería popup se crea con un contenedor HTML específico:

```html
<div class="popup-gallery-container">
    <div class="gallery-preview" onclick="openGalleryPopup(this)">
        <img src="/static/blogs/ejemplo/gallery-preview.png" alt="Vista previa">
        <div class="gallery-badge"><i class="fas fa-images"></i> 3 fotos</div>
    </div>
    <input type="hidden" class="gallery-images" value="/static/blogs/ejemplo/img1.png|||/static/blogs/ejemplo/img2.png|||/static/blogs/ejemplo/img3.png">
    <input type="hidden" class="gallery-titles" value="Título 1|||Título 2|||Título 3">
    <input type="hidden" class="gallery-descriptions" value="Descripción 1|||Descripción 2|||Descripción 3">
</div>
```

- Click en la preview abre el popup
- Navegación con flechas y teclado (← → Escape)
- Contador de imágenes
- Título y descripción de cada imagen

---

## 🎥 12. VIDEO DEL BLOG (HTML5)

```html
<div class="blog-video-container">
    <div class="blog-video-wrapper">
        <video class="blog-video-player" controls>
            <source src="/static/blogs/ejemplo/video.mp4" type="video/mp4">
            Tu navegador no soporta videos.
        </video>
    </div>
    <div class="blog-video-caption">
        <span class="blog-video-title">Título del video</span>
    </div>
</div>
```

---

## 📺 13. MOSAICO DE VIDEO YOUTUBE

### Versión completa
<div class="youtube-mosaic" onclick="window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')">
    <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg" alt="Miniatura del video">
    <div class="play-overlay">
        <i class="fas fa-play play-icon"></i>
    </div>
    <div class="caption">Título del video de YouTube</div>
</div>

### Versión compacta
<div class="youtube-mosaic compact" onclick="window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')">
    <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg" alt="Miniatura">
    <div class="play-overlay">
        <i class="fas fa-play play-icon"></i>
    </div>
</div>

---

## 📐 14. LAYOUT VISUAL (Decoradores)

### Línea vertical completa
<div class="vl-full">
<p>Este párrafo tiene una línea vertical decorativa a la izquierda que se extiende toda su altura.</p>
</div>

### Línea vertical limitada
<div class="vl-limited">
<p>Bloque con línea vertical de altura fija.</p>
</div>

### Bloque resaltado con barra vertical
<div class="vl-highlight">
<p>Este bloque tiene una barra vertical morada a la izquierda y fondo gris sutil.</p>
</div>

### Punto decorativo
<span class="vl-bullet">Texto con punto decorativo morado al inicio.</span>

---

## 🧩 15. FLEX UTILITIES

<div class="flex-row">
<div class="blog-grid-card"><strong>Elemento 1</strong><br>En fila horizontal</div>
<div class="blog-grid-card"><strong>Elemento 2</strong><br>Mismo nivel</div>
<div class="blog-grid-card"><strong>Elemento 3</strong><br>Flex: 1</div>
</div>

<div class="flex-col">
<div class="blog-grid-card"><strong>Elemento A</strong><br>Vertical</div>
<div class="blog-grid-card"><strong>Elemento B</strong><br>Vertical</div>
</div>

---

## 🎭 16. MODOS DE LECTURA

El blog tiene 3 modos de lectura (botón flotante en la esquina inferior derecha):

| Modo       | Descripción                                          |
| ---------- | ---------------------------------------------------- |
| **Normal** | Blanco puro, colores estándar                        |
| **Sépia**  | Fondo crema suave, ideal para leer en la noche       |
| **Oscuro** | Fondo azul oscuro, texto claro, reduce fatiga visual |

Los modos afectan todo el contenido del artículo incluyendo imágenes, código y blockquotes.

---

## 📱 17. RESPONSIVE (Comportamiento en móvil)

- **Imágenes:** Se escalan al 100% del ancho
- **Grids:** 2 columnas → 1 columna en móvil
- **Slides:** Imagen arriba, caption abajo (vertical)
- **Badges:** Se envuelven automáticamente
- **Tablas:** Scroll horizontal con `table-responsive`
- **Galería:** Popup se adapta al viewport
- **Videos:** Responsive con aspect-ratio 16:9

---

## 🔧 18. HTML CRUDO DENTRO DEL MARKDOWN

El blog permite HTML directo en el markdown. Ejemplos:

### Acordeón con Alpine.js
<details>
<summary>Click para expandir</summary>
<p>Contenido oculto que se muestra al hacer click.</p>
</details>

### Div con estilo inline
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
    <h3 style="color: white; margin: 0;">Call-to-Action</h3>
    <p style="margin: 0.5rem 0 0;">Esto es un HTML puro con estilos inline.</p>
</div>

### Tabla de contenido automática
```html
<div id="toc"></div>
<script>
document.addEventListener('DOMContentLoaded', function() {
    var toc = document.getElementById('toc');
    var headings = document.querySelectorAll('.blog-content h2');
    headings.forEach(function(h, i) {
        var li = document.createElement('li');
        li.innerHTML = '<a href="#' + h.id + '">' + h.textContent + '</a>';
        toc.appendChild(li);
    });
});
</script>
```

### Imagen con enlace
```html
<a href="https://www.ejemplo.com" target="_blank">
    <img src="/static/blogs/ejemplo/imagen-con-link.png" alt="Click para ir al sitio">
</a>
```

### Nota / Advertencia con icono
```html
<div style="display: flex; gap: 12px; align-items: flex-start; padding: 1rem; background: #f0f4ff; border-left: 4px solid #6f42c1; border-radius: 0 8px 8px 0; margin: 1.5rem 0;">
    <span style="font-size: 1.5rem;">💡</span>
    <div>
        <strong style="color: #6f42c1;">Tip Pro:</strong> Puedes combinar HTML con Markdown dentro de los bloques HTML.
    </div>
</div>
```

---

## 📊 19. COMPARACIÓN DE FORMATOS

| Formato        | Sintaxis       | Ejemplo                       |
| -------------- | -------------- | ----------------------------- |
| Negrita        | `**texto**`    | **texto**                     |
| Cursiva        | `*texto*`      | *texto*                       |
| Tachado        | `~~texto~~`    | ~~texto~~                     |
| Código inline  | `` `código` `` | `código`                      |
| Enlace         | `[texto](url)` | [ejemplo](https://google.com) |
| Imagen         | `![alt](url)`  | (se renderiza)                |
| H1             | `# Título`     | (encabezado grande)           |
| H2             | `## Título`    | (sección)                     |
| Lista          | `- item`       | (lista desordenada)           |
| Lista numerada | `1. item`      | (lista ordenada)              |
| Blockquote     | `> texto`      | (cita)                        |
| Tabla          | `              | col                           | ` | (tabla) |
| HR             | `---`          | (línea horizontal)            |

---

## 🔍 20. SEO Y META CAMPOS

### Frontmatter mínimo requerido
```yaml
---
title: "Título del artículo"
description: "Descripción para SEO (150-160 caracteres)"
---
```

### Frontmatter completo (todos los campos disponibles)
```yaml
---
title: "Título del artículo"
description: "Descripción para SEO y redes sociales"
category: "Backend"                    # Categoría del artículo
cover_image: "/static/blogs/slug/imagen.png"  # Imagen para OG (1200x630px)
tags: ["django", "python", "backend"]  # Etiquetas para SEO
meta_title: "Título personalizado para Google"  # Override del title
meta_description: "Descripción personalizada para Google"  # Override de description
reading_time: 5                        # Override del tiempo de lectura calculado
draft: false                           # true = no se muestra en la lista
---