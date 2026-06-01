# 📋 HU-013: Bloques HTML Especiales y Utilidades de Maquetación para Blog Markdown

> **ID:** HU-013
> **Fecha:** 30/05/2026
> **Responsable:** Cline
> **Estado:** 🔵 Pendiente
> **Tiempo estimado total:** 6 fases (~15 min cada una)
> **Dependencias:** HU-001 (sistema blogs), HU-001.1 (frontmatter completo), HU-005 (contenido)

---

## 🚨 INSTRUCCIONES DE DESARROLLO (LEER ANTES DE EMPEZAR)

> ⚠️ **REGLAS DE ORO PARA IMPLEMENTAR ESTA HU:**

### 🟢 1. Una Fase a la Vez
- Esta HU tiene **6 fases** de aproximadamente **15 minutos cada una**
- **NUNCA** implementes más de una fase en una sola sesión
- Cada fase es **independiente** y se puede probar por separado
- Al terminar cada fase: ✅ probar, ✅ confirmar con el usuario, ✅ pasar a la siguiente

### 🟢 2. Sin Dependencias Nuevas Sin Aprobación
- Todo es CSS nativo + FontAwesome (ya instalado via CDN)
- Solo se modifica `blog_detail.css` y `import_blogs.py`
- Si durante el desarrollo se necesita algo adicional, **preguntar primero**

### 🟢 3. Nunca Romper lo Existente
- Todo lo que funciona hoy debe seguir funcionando mañana
- Cualquier modificación debe ser **aditiva**
- **NUNCA** borrar código existente

### 🟢 4. Flujo de Trabajo Recomendado
```
Cada fase:
1. Leer la fase completa
2. Implementar cambios
3. Reimportar blog de prueba
4. Verificar en navegador
5. Confirmar con el usuario
6. PASAR A LA SIGUIENTE FASE
```

---

## 🎯 OBJETIVO

Crear un sistema completo de bloques especiales y utilidades HTML para que al escribir markdown puedas usar HTML enriquecido con clases CSS predefinidas. Esto incluye:

1. **Documentar** todos los bloques que YA existen pero no están documentados
2. **Agregar utilidades de grid/flex** inexistentes
3. **Agregar callouts faltantes** (danger, success)
4. **Agregar highlight boxes** theme-aware
5. **Agregar badges y tags inline**
6. **Validar HTML** durante la importación y actualizar la documentación

---

## 📊 ESTADO ACTUAL (DIAGNÓSTICO)

### ✅ Bloques que YA existen (pero no están documentados)

| Sintaxis Markdown             | HTML Generado                        | CSS Clase                  | Status     |
| ----------------------------- | ------------------------------------ | -------------------------- | ---------- |
| `:::slides ...:::`            | Slider con caption + navegación      | `.slides-container`        | ✅ Funciona |
| `:::callout:info ...:::`      | Caja azul informativa con icono      | `.callout.callout-info`    | ✅ Funciona |
| `:::callout:warning ...:::`   | Caja amarilla advertencia con icono  | `.callout.callout-warning` | ✅ Funciona |
| `:::callout:tip ...:::`       | Caja verde tip con icono             | `.callout.callout-tip`     | ✅ Funciona |
| `:::popup:gallery ...:::`     | Galería de imágenes popup            | `.popup-gallery-container` | ✅ Funciona |
| `:::carousel ...:::`          | Carrusel Swiper de imágenes          | `.blog-carousel-container` | ✅ Funciona |
| `![video.mp4]` (img to video) | Reproductor de video estilizado      | `.blog-video-container`    | ✅ Funciona |
| `[vl highlight]`              | Bloque con barra vertical izquierda  | `.vl-highlight`            | ✅ Funciona |
| `[vl limited]`                | Bloque con barra vertical (limited)  | `.vl-limited`              | ✅ Funciona |
| `[vl bullet]`                 | Bloque con barra vertical con bullet | `.vl-bullet`               | ✅ Funciona |
| HTML raw `<div class="...">`  | Cualquier HTML se pasa directamente  | Depende de la clase        | ✅ Funciona |

### 🔴 Lo que FALLA o FALTA

1. **No hay documentación** de estos bloques en ninguna parte
2. **No existe `callout-danger`** ni `callout-success` (definidos en pipeline pero sin CSS ni iconos)
3. **No hay utilidades de grid** (2-columnas, 3-columnas)
4. **No hay flex utilities** (flex-row, flex-col, gap)
5. **No hay highlight boxes theme-aware** (que respeten modo lectura oscuro/sepia)
6. **No hay badges/tags inline** (para resaltar texto corto)
7. **No hay validación de HTML** durante importación (si escribes `<div>` sin cerrar, se rompe)
8. **No hay soporte para `:::callout:danger`** y `:::callout:success` en el pipeline (regex solo captura info/warning/tip)
9. **No hay bloque de código con copia** (codefile está comentado)

---

## 🔧 FASES DE IMPLEMENTACIÓN

---

### ⚡ FASE 1: Documentar Bloques Existentes en Plantillas de Autor
**Tiempo estimado:** 15 min
**Archivos:** `PLANTILLA_ESTANDAR_BLOG_SEO.md`, `PROC_001_escribir_blog.md`

#### 1.1 Agregar sección de "Bloques Especiales Disponibles"

En `PLANTILLA_ESTANDAR_BLOG_SEO.md`, agregar al final antes de "Última actualización":

```
---

## 🧱 BLOQUES ESPECIALES DISPONIBLES PARA MAQUETACIÓN

Puedes usar HTML directamente dentro del markdown. Todos los tags HTML se renderizan sin
modificación. Además hay bloques especiales con sintaxis `:::`.

### 📌 CALLOUTS (Cajas informativas con ícono)

| Sintaxis             | Resultado                           | Uso                        |
| -------------------- | ----------------------------------- | -------------------------- |
| `:::callout:info`    | Caja azul con ícono info            | Información general, notas |
| `:::callout:warning` | Caja amarilla con ícono advertencia | Advertencias importantes   |
| `:::callout:tip`     | Caja verde con ícono tip            | Tips, consejos prácticos   |

**Ejemplo:**
```markdown
:::callout:info
Python 3.12 introdujo cambios importantes en el manejo de excepciones.
Asegúrate de actualizar tu código si vienes de versiones anteriores.
:::
```

### 📌 SLIDES (Carrusel de imágenes con caption)
```markdown
:::slides
![Titulo|Descripcion de la imagen](imagen1.jpg)
![Titulo|Descripcion](imagen2.jpg)
:::
```

### 📌 POPUP GALLERY (Galería de imágenes en popup)
```markdown
:::popup:gallery
![Imagen 1](foto1.jpg)
![Imagen 2](foto2.jpg)
:::
```

### 📌 CARRUSEL SWIPER (Carrusel automático)
```markdown
:::carousel
![Imagen](slide1.jpg)
![Imagen](slide2.jpg)
:::
```

### 📌 BLOQUES CON BARRA VERTICAL (`[vl]`)
```markdown
[vl highlight]
Este parrafo aparecera con una barra azul a la izquierda y fondo suave.
[/vl]

[vl limited]
Este parrafo tiene barra naranja, ideal para contenido limitado o importante.
[/vl]

[vl bullet]
Este parrafo tiene un bullet decorativo y barra gris.
[/vl]
```

### 📌 VIDEOS (Markdown a reproductor HTML5 estilizado)
```markdown
![Demostracion del proceso](demo.mp4)
```

### 📌 HTML DIRECTO (Maquetacion libre)
```html
<div style="display: flex; gap: 1rem;">
  <div style="flex: 1;">
    Columna izquierda
  </div>
  <div style="flex: 1;">
    Columna derecha
  </div>
</div>
```
```

#### ✅ Criterios de aceptación Fase 1
- [ ] PLANTILLA_ESTANDAR_BLOG_SEO.md actualizada con sección de bloques especiales
- [ ] PROC_001_escribir_blog.md actualizado con referencia a los bloques

---

### ⚡ FASE 2: Callouts Faltantes (danger + success) + Mejora de Regex
**Tiempo estimado:** 15 min
**Archivos:** `import_blogs.py`, `blog_detail.css`

#### 2.1 Mejorar regex de callouts

En `import_blogs.py`, método `replace_special_blocks_md`, encontrar:

```python
r":::callout:(info|warning|tip)\s*\n(.*?):::"
```

Reemplazar por:

```python
r":::callout:(info|warning|tip|danger|success)\s*\n(.*?):::"
```

Y actualizar el diccionario de íconos en `_replace_callout`:

```python
icons = {
    "info": '<i class="fas fa-circle-info"></i>',
    "warning": '<i class="fas fa-triangle-exclamation"></i>',
    "tip": '<i class="fas fa-lightbulb"></i>',
    "danger": '<i class="fas fa-circle-exclamation"></i>',
    "success": '<i class="fas fa-circle-check"></i>',
}
```

#### 2.2 Agregar CSS para danger y success

En `blog_detail.css`, después de los estilos de callout existentes:

```css
/* CALLOUT DANGER */
.callout-danger {
  background: #fef2f2;
  border-left-color: #dc2626;
}

html[data-reading-mode="dark"] .callout-danger {
  background: #450a0a;
  border-left-color: #ef4444;
}

html[data-reading-mode="sepia"] .callout-danger {
  background: #fef2f2;
  border-left-color: #dc2626;
}

.callout-danger .callout-icon {
  color: #dc2626;
}

/* CALLOUT SUCCESS */
.callout-success {
  background: #f0fdf4;
  border-left-color: #16a34a;
}

html[data-reading-mode="dark"] .callout-success {
  background: #052e16;
  border-left-color: #22c55e;
}

html[data-reading-mode="sepia"] .callout-success {
  background: #f0fdf4;
  border-left-color: #16a34a;
}

.callout-success .callout-icon {
  color: #16a34a;
}
```

#### ✅ Criterios de aceptación Fase 2
- [ ] `:::callout:danger` renderiza caja roja con ícono
- [ ] `:::callout:success` renderiza caja verde con ícono
- [ ] Ambos respetan modo oscuro y sepia

---

### ⚡ FASE 3: Utilidades de Grid (2 y 3 columnas)
**Tiempo estimado:** 15 min
**Archivos:** `blog_detail.css`

En `blog_detail.css`:

```css
/* GRID UTILITIES PARA CONTENIDO */
.blog-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.blog-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.blog-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin: 1.5rem 0;
}

@media (max-width: 768px) {
  .blog-grid-3,
  .blog-grid-4 {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .blog-grid-2,
  .blog-grid-3,
  .blog-grid-4 {
    grid-template-columns: 1fr;
  }
}

.blog-grid-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  transition: box-shadow 0.2s;
}

.blog-grid-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

html[data-reading-mode="dark"] .blog-grid-card {
  background: #1e293b;
  border-color: #334155;
}

html[data-reading-mode="sepia"] .blog-grid-card {
  background: #fefcf5;
  border-color: #e8dcc8;
}
```

#### ✅ Criterios de aceptación Fase 3
- [ ] `<div class="blog-grid-2">` muestra 2 columnas
- [ ] `<div class="blog-grid-3">` muestra 3 columnas
- [ ] Responsive: tablet 2 col, mobile 1 col
- [ ] theme-aware: funciona en dark/sepia mode

---

### ⚡ FASE 4: Highlight Boxes Theme-Aware + Flex Utilities
**Tiempo estimado:** 15 min
**Archivos:** `blog_detail.css`

#### 4.1 Highlight boxes

```css
/* HIGHLIGHT BOXES (theme-aware) */
.highlight-box {
  background: #f0f4ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  position: relative;
}

.highlight-box::before {
  content: "💡";
  position: absolute;
  top: -10px;
  right: 12px;
  font-size: 1.5rem;
}

html[data-reading-mode="dark"] .highlight-box {
  background: #1e3a5f;
  border-color: #3b82f6;
}

html[data-reading-mode="sepia"] .highlight-box {
  background: #fef7e8;
  border-color: #d4a574;
}

.highlight-box-info {
  background: #eff6ff;
  border-color: #93c5fd;
}
.highlight-box-info::before { content: "ℹ️"; }

.highlight-box-warning {
  background: #fffbeb;
  border-color: #fcd34d;
}
.highlight-box-warning::before { content: "⚠️"; }

.highlight-box-success {
  background: #f0fdf4;
  border-color: #86efac;
}
.highlight-box-success::before { content: "✅"; }

html[data-reading-mode="dark"] .highlight-box-info { background: #1e3a5f; border-color: #3b82f6; }
html[data-reading-mode="dark"] .highlight-box-warning { background: #451a03; border-color: #f59e0b; }
html[data-reading-mode="dark"] .highlight-box-success { background: #052e16; border-color: #22c55e; }
```

#### 4.2 Flex utilities

```css
/* FLEX UTILITIES */
.flex-row {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

.flex-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.flex-wrap { flex-wrap: wrap; }

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-3 { flex: 3; }

.gap-sm { gap: 0.5rem; }
.gap-md { gap: 1rem; }
.gap-lg { gap: 1.5rem; }
.gap-xl { gap: 2rem; }

@media (max-width: 480px) {
  .flex-row { flex-direction: column; }
}
```

#### ✅ Criterios de aceptación Fase 4
- [ ] `class="highlight-box"` muestra caja con emoji y borde azul
- [ ] `class="highlight-box highlight-box-warning"` muestra caja amarilla
- [ ] Funciona en dark/sepia mode
- [ ] `class="flex-row"` e flex utilities funcionan

---

### ⚡ FASE 5: Badges/Tags Inline + Botón Copiar Código
**Tiempo estimado:** 15 min
**Archivos:** `blog_detail.css`, `blog_detail.html`

#### 5.1 Badges inline CSS

```css
/* BADGES INLINE */
.badge-tech {
  display: inline-block;
  background: #e0e7ff;
  color: #4338ca;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
  margin: 0.1rem;
}

html[data-reading-mode="dark"] .badge-tech {
  background: #1e3a5f;
  color: #93c5fd;
}

.badge-success {
  display: inline-block;
  background: #dcfce7;
  color: #15803d;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
}

html[data-reading-mode="dark"] .badge-success {
  background: #052e16;
  color: #86efac;
}

.badge-warning {
  display: inline-block;
  background: #fef3c7;
  color: #b45309;
  border-radius: 100px;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
}

html[data-reading-mode="dark"] .badge-warning {
  background: #451a03;
  color: #fbbf24;
}

.badge-danger {
  display: inline-block;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 100px;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
}

html[data-reading-mode="dark"] .badge-danger {
  background: #450a0a;
  color: #fca5a5;
}
```

#### 5.2 Code block con header y botón copiar

En `blog_detail.css`:

```css
/* CODE BLOCK MEJORADO */
.blog-content pre {
  position: relative;
  border-radius: 12px !important;
  margin: 1.5rem 0 !important;
}

.blog-content pre .code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #1e293b;
  color: #94a3b8;
  font-size: 0.8rem;
  border-radius: 12px 12px 0 0;
  font-family: 'DM Sans', sans-serif;
}

html[data-reading-mode="dark"] .blog-content pre .code-header {
  background: #0f172a;
}

.blog-content pre .copy-btn {
  background: none;
  border: 1px solid #475569;
  color: #94a3b8;
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.blog-content pre .copy-btn:hover {
  background: #334155;
  color: #e2e8f0;
}
```

En `blog_detail.html`, antes de `</body>`:

```html
<!-- BOTON COPIAR CODIGO -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.blog-content pre').forEach(function(pre) {
    var header = document.createElement('div');
    header.className = 'code-header';
    var code = pre.querySelector('code');
    var lang = '';
    if (code && code.className) {
      var match = code.className.match(/language-(\w+)/);
      if (match) lang = match[1];
    }
    header.innerHTML = '<span>' + (lang || 'Codigo') + '</span>';
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = '<i class="fas fa-copy"></i> Copiar';
    btn.onclick = function() {
      var text = pre.querySelector('code') ? pre.querySelector('code').innerText : pre.innerText;
      navigator.clipboard.writeText(text).then(function() {
        btn.innerHTML = '<i class="fas fa-check"></i> Copiado';
        setTimeout(function() { btn.innerHTML = '<i class="fas fa-copy"></i> Copiar'; }, 2000);
      });
    };
    header.appendChild(btn);
    pre.insertBefore(header, pre.firstChild);
  });
});
</script>
```

#### ✅ Criterios de aceptación Fase 5
- [ ] `class="badge-tech"` muestra badge estilizado
- [ ] Badges funcionan en dark/sepia mode
- [ ] Bloques de código tienen header con lenguaje + botón copiar
- [ ] Botón copiar funciona y muestra feedback visual "Copiado"

---

### ⚡ FASE 6: Validación HTML + Documentación Final
**Tiempo estimado:** 15 min
**Archivos:** `import_blogs.py`, `EJEMPLO_BLOG_PERFECTO_COMPLETO.md`

#### 6.1 Agregar validación HTML

En `import_blogs.py`, agregar después de `apply_custom_formatting`:

```python
def validate_html_content(self, html_content: str) -> bool:
    """Valida que el HTML generado no tenga errores de sintaxis."""
    soup = BeautifulSoup(html_content, "html.parser")
    # Los tags con error tienen name=None
    errores = 0
    for element in soup.find_all(True):
        if element.name is None:
            errores += 1
    if errores:
        self.stdout.write(
            self.command.style.WARNING(
                f"ADVERTENCIA: {errores} error(es) de sintaxis HTML detectados. "
                f"Esto puede causar problemas de renderizado."
            )
        )
        return False
    return True
```

Y llamarla después de `apply_custom_formatting`:
```python
html_final = self.apply_custom_formatting(processed_html)
self.validate_html_content(html_final)
```

#### 6.2 Agregar ejemplo completo de maquetación

En `EJEMPLO_BLOG_PERFECTO_COMPLETO.md`, agregar sección de ejemplo con:

```
## EJEMPLO DE MAQUETACION CON HTML

```markdown
---
title: "Como usar bloques HTML en el blog"
slug: bloques-html-blog
---

Las integraciones con Zoho pueden fallar por muchas razones.

:::callout:warning
**Importante:** Antes de empezar, asegurate de tener las credenciales correctas.
:::

## Comparativa de herramientas

<div class="blog-grid-2">
  <div class="blog-grid-card">
    <h4>Zoho CRM</h4>
    <p>Ideal para ventas.
    <span class="badge-tech">API v2</span></p>
  </div>
  <div class="blog-grid-card">
    <h4>Zoho Books</h4>
    <p>Contabilidad automatizada.
    <span class="badge-tech">API v3</span></p>
  </div>
</div>

<div class="highlight-box highlight-box-info">
Las claves de API deben rotarse cada 90 dias.
</div>

Tecnologias:
<span class="badge-tech">Python</span>
<span class="badge-tech">Django</span>
<span class="badge-tech">JavaScript</span>
```
```

#### ✅ Criterios de aceptación Fase 6
- [ ] Validación HTML lanza warning cuando hay tags sin cerrar
- [ ] EJEMPLO_BLOG_PERFECTO_COMPLETO.md incluye ejemplo de maquetación

---

## 📋 RESUMEN DE FASES

| Fase | Descripcion                                          | Tiempo | Prioridad |
| ---- | ---------------------------------------------------- | ------ | --------- |
| 1    | Documentar bloques existentes en plantillas de autor | 15 min | ALTA      |
| 2    | Callouts faltantes (danger + success) + regex        | 15 min | ALTA      |
| 3    | Utilidades de Grid (2/3/4 cols)                      | 15 min | ALTA      |
| 4    | Highlight Boxes + Flex Utilities                     | 15 min | MEDIA     |
| 5    | Badges/Tags Inline + Copia codigo                    | 15 min | MEDIA     |
| 6    | Validacion HTML + Documentacion final                | 15 min | MEDIA     |

**Tiempo total estimado:** ~90 minutos (6 sesiones)

---

## EJEMPLO RAPIDO DE USO EN MARKDOWN

Despues de implementar esta HU, en tu blog.md podrias escribir:

```markdown
## Seccion con grid de 2 columnas

<div class="blog-grid-2">
  <div class="blog-grid-card">
    <h3>Ventajas</h3>
    <p>Lista de ventajas aqui...</p>
  </div>
  <div class="blog-grid-card">
    <h3>Desventajas</h3>
    <p>Lista de desventajas aqui...</p>
  </div>
</div>

## Destacar informacion

<div class="highlight-box">
Esto se ve como una caja destacada con emoji,
<strong>theme-aware</strong> (funciona en dark/sepia mode).
</div>

## Tags inline

Tecnologias usadas:
<span class="badge-tech">Python</span>
<span class="badge-tech">Django</span>
<span class="badge-tech">JavaScript</span>
```

---

## COMO VALIDAR

1. **Reimportar blog de prueba**:
```bash
source .venv/Scripts/activate
cd backend
python manage.py import_blogs
```

2. **Verificar visualmente** cada bloque en navegador

3. **Probar modos de lectura** (oscuro, sepia)

4. **Verificar responsive** en mobile (480px y 768px)

---

> Ultima actualizacion: 30/05/2026
> Aplicable desde HU-013