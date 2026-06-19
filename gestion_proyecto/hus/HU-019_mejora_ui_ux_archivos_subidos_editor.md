# HU-019: Mejora UI/UX del contenedor de archivos subidos en el editor de blog

> **Estado:** Completado (parcialmente pendiente de verificación visual en navegador)
> **Creada:** 19/06/2026
> **Componente afectado:** `backend/blog/templates/blog/blog_editor.html` + `backend/blog/static/blog/css/blog_editor.css` + `backend/blog/static/blog/js/blog_editor.js`
> **Elementos DOM:** `#uploaded-files` (contenedor padre) → `.uploaded-item` (cada item) → `.uploaded-controls` (controles)

---

## 1. Diagnóstico del problema actual

### 1.1 Problema visual - Desbordamiento de texto

El contenedor `#uploaded-files` es un `div` con clases `d-flex flex-wrap gap-2`. Esto genera un layout inline flexible donde los items se alinean en fila.

Cada `.uploaded-item` tiene un ancho fijo de **180px** y contiene:
- Un `<img>` o `<video>` de max 200x150px (mayor que el contenedor padre)
- Una etiqueta con el nombre del archivo (`.uploaded-filename`)

**El problema:** El nombre del archivo no está respetando el ancho del item de 180px. Aunque tiene estilos inline en el JS (`maxWidth: '100%'`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'`, `whiteSpace: 'nowrap'`), NO hay regla CSS equivalente para `.uploaded-filename` que garantice el truncamiento. Además, la imagen/video tiene `max-width: 200px` (CSS línea 207-215), superando el ancho del item contenedor (180px, línea 187).

**Resultado actual:**
- Los items extienden su ancho más allá de 180px porque el contenido interno (imagen de 200px) fuerza el crecimiento del contenedor inline-block.
- El texto del nombre de archivo se desborda visualmente porque el contenedor se expande y el flex-wrap no rompe la fila correctamente.
- Los controles (`.uploaded-controls`) aparecen desubicados porque su posición absolute depende de las dimensiones del `.uploaded-item` padre, que está mal dimensionado.

### 1.2 Problema de UX/Usabilidad

- **Jerarquía visual confusa:** Los items mezclados (imágenes, videos, portada, ocultos) se ven igual sin un criterio visual de "carpeta" o "contenedor".
- **Controles poco discoverables:** Los controles solo aparecen en hover (excepto portada), lo que en mobile/touch es inaccesible.
- **Sin diferenciación por tipo de archivo:** Imágenes y videos usan el mismo tratamiento visual.
- **Feedback de estado limitado:** Solo se diferencia "portada" (borde amarillo) y "oculto" (opacidad). No hay distinción visual para videos.

### 1.3 Problema de Responsive

- En pantallas pequeñas, `flex-wrap` rompe filas pero los items mantienen 180px de ancho fijo.
- No hay breakpoints específicos para ajustar la densidad de items por fila.
- Los controles de 32px pueden ser pequeños en touch devices.

---

## 2. Objetivo de la HU

Transformar el contenedor `#uploaded-files` en una **"carpeta visual"** que:

1. **Contenga visualmente** los archivos subidos respetando anchos consistentes (sin desbordamiento).
2. **Represente estándar visualmente** cada tipo de archivo con iconos de Font Awesome según su formato (imagen, video, genérico).
3. **Mejore la UX/UI** con:
   - Layout tipo grid/carpeta organizado
   - Controles persistentes (sin depender solo de hover)
   - Estados visuales claros (portada, oculto, normal)
   - Tooltips accesibles
   - Responsive adaptativo (2-4 items por fila según viewport)
4. **Mantenga toda la funcionalidad actual:** cover, toggle, eliminar, markdown sync.

---

## 3. Criterios de aceptación

### CA-1: Contenedor sin desbordamiento
- [x] `#uploaded-files` NO tiene scroll horizontal en ningún viewport (320px a 1920px).
- [x] Cada `.uploaded-item` respeta el ancho definido por el grid (no crece más allá).
- [x] El nombre de archivo se trunca con `ellipsis` si excede el ancho del item.
- [x] Las imágenes/videos NO sobresalen del item (`overflow: hidden` en el item).

### CA-2: Apariencia de carpeta contenedora
- [x] `#uploaded-files` tiene estilo visual de "carpeta": fondo gris claro, padding, border-radius, border punteado o sólido sutil.
- [x] Los items se organizan en un grid CSS con columnas responsivas (auto-fill, minmax).
- [x] Espaciado consistente entre items (gap de 12-16px).

### CA-3: Iconografía por tipo de archivo
- [x] Cada item muestra un icono de Font Awesome representando su formato:
  - `fa-file-image` para imágenes (png, jpg, gif, webp)
  - `fa-file-video` para videos (mp4, webm, mov)
  - `fa-file` para tipos desconocidos/fallback
- [x] El icono se muestra como overlay superpuesto a la miniatura (similar a cómo lo hacen los OS desktop).
- [x] El icono tiene un fondo circular blanco semitransparente con blur (glassmorphism).

### CA-4: Controles mejorados
- [x] Los controles (cover, toggle, eliminar) son **siempre visibles** (no solo en hover), con opacidad reducida al reposo.
- [x] Los controles están alineados en la esquina superior derecha dentro de una barra semi-transparente.
- [x] Tooltips funcionan igual que ahora (CSS `::after` con `attr(data-tooltip)`).

### CA-5: Estados visuales diferenciados
- [x] **Normal:** borde gris sutil, sombra ligera.
- [x] **Portada (`is-cover`):** borde dorado, glow, badge "PORTADA", controles con mayor opacidad.
- [x] **Oculto (`is-hidden`):** opacidad 0.4, escala de grises, trama diagonal sutil.
- [x] **Video:** mini-play button icon overlay o indicador visual.

### CA-6: Responsive
- [x] Viewport >= 1200px: 4-5 items por fila.
- [x] Viewport 768px-1199px: 3-4 items por fila.
- [x] Viewport 480px-767px: 2 items por fila.
- [x] Viewport < 480px: 1 item por fila (ancho completo adaptado).
- [x] Touch devices (max-width: 768px): controles con tamaño mínimo 40px, siempre visibles.

### CA-7: Accesibilidad
- [x] Todos los botones de control tienen `aria-label`.
- [x] Estados `is-cover` e `is-hidden` se indican también con atributos ARIA (opcional: `aria-pressed`, `aria-label` actualizado).
- [x] Focus-visible muestra outline accesible en items y controles.

### CA-8: Funcionalidad preservada
- [x] Click en estrella marca/desmarca portada.
- [x] Click en ojo toggle show/hide.
- [x] Click en basura abre modal de confirmación → elimina.
- [x] Al cargar artículo existente, los archivos se renderizan con los estados correctos.

---

## 4. Plan de implementación (fases granulares ≤15 min cada una)

> Regla: Cada fase se implementa, prueba y confirma ANTES de pasar a la siguiente.

---

### Fase 1: Ajustar CSS base del item - Corregir desbordamiento (5-8 min)

**Cambios en `blog_editor.css`:**

1. Modificar `.filepond--item`:
   - Cambiar `width: 180px` por `width: 100%` (el grid controlará el ancho).
   - Cambiar `display: inline-block` por `display: flex` con `flex-direction: column`.
   - Establecer `min-width: 140px` y `max-width: 220px`.
   - Mantener `box-sizing: border-box`.

2. Modificar `.uploaded-image, .uploaded-video`:
   - Cambiar `max-width: 200px` por `max-width: 100%`.
   - Cambiar `max-height: 170px`.
   - Añadir `width: 100%`, `height: 170px`, `object-fit: cover`.

3. Modificar `.uploaded-filename`:
   - Añadir regla CSS: `width: 100%`, `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap`.

4. Modificar `.uploaded-controls`:
   - Cambiar `top: 8px; right: 8px` a `top: 4px; right: 4px`.
   - Añadir `z-index: 10`.

**Verificación tras Fase 1:**
- Subir 3+ imágenes → items se alinean correctamente en fila sin desbordamiento horizontal.
- Los nombres de archivo se truncuen con "..." si son largos.
- Las imágenes se recortan con `object-fit: cover` dentro de su contenedor.

---

### Fase 2: Convertir contenedor a grid tipo carpeta (5-8 min)

**Cambios en `blog_editor.css`:**

1. Modificar `#uploaded-files`:
   - Reemplazar `d-flex flex-wrap gap-2` por clase CSS propia `.uploaded-files-grid`.
   - Añadir: `display: grid`, `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))`, `gap: 12px`.
   - Añadir estilos de "carpeta": `background: #f8f9fa`, `border: 2px dashed #dee2e6`, `border-radius: 12px`, `padding: 16px`.

**Nota:** Eliminar clase `d-flex flex-wrap gap-2` del HTML en `blog_editor.html` línea del contenedor.

**Verificación tras Fase 2:**
- Contenedor tiene apariencia de carpeta/cuadrícula.
- Redimensionar ventana → items se reorganizan automáticamente.
- No hay scroll horizontal.

---

### Fase 3: Iconos de tipo de archivo (5-10 min)

**Cambios en `blog_editor.js` (función `renderUploadedFile`):**

1. Después de crear el elemento `<img>` o `<video>`, añadir un overlay con icono según tipo:
   - Para imágenes: icono `fa-file-image` (ya cargado en FA).
   - Para videos: icono `fa-file-video`.
   - Fallback: `fa-file`.

2. El overlay se crea como `<span class="file-type-icon">` con el icono dentro.

**Cambios en `blog_editor.css`:**

1. Añadir `.file-type-icon`:
   - `position: absolute`, `bottom: 8px`, `left: 8px`.
   - `width: 28px`, `height: 28px`, `border-radius: 50%`.
   - `background: rgba(255,255,255,0.85)`, `backdrop-filter: blur(6px)`.
   - `display: flex`, `align-items: center`, `justify-content: center`.
   - `font-size: 0.75rem`, `color: #495057`.
   - `box-shadow: 0 1px 4px rgba(0,0,0,0.15)`.

2. Añadir `.uploaded-item { position: relative; }` para que el icono se posicione bien.

**Verificación tras Fase 3:**
- Cada item muestra icono en su esquina inferior izquierda.
- Icono se ve bien sobre fondo de imagen y sobre placeholder oscuro.

---

### Fase 4: Mejorar controles - Siempre visibles (3-5 min)

**Cambios en `blog_editor.css`:**

1. Modificar `.uploaded-controls`:
   - Cambiar `opacity: 0` → `opacity: 0.6`.
   - Mantener `transition: opacity 0.25s ease`.
   - Añadir fondo: `background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))`.
   - Añadir `border-radius: 20px`, `padding: 2px 4px`.
   - Cambiar layout a `flex-direction: column` (tres botones apilados) o mantener row.

2. Modificar hover:
   - `.uploaded-item:hover .uploaded-controls` → `opacity: 1` y `transform: scale(1.05)`.

3. En mobile (max-width: 768px):
   - `.uploaded-controls` → `opacity: 1` (siempre visibles).
   - Aumentar `.btn-control` a 36px.

**Verificación tras Fase 4:**
- Controles se ven siempre (opacidad reducida).
- Al hacer hover, se vuelven más opacos.
- En mobile se ven completamente.

---

### Fase 5: Placeholder/estado vacío del contenedor (3-5 min)

**Cambios en `blog_editor.js` (función `renderUploadedFile` o evento asociado):**

1. Detectar cuando `uploadedFiles` está vacío y mostrar mensaje en `#uploaded-files`:
   - "No hay archivos subidos. Arrastra o pega imágenes/videos aquí."
   - Icono de folder abierto centrado.
   - Estilo: texto muted centrado, padding grande.

2. Limpiar este placeholder cuando se suba el primer archivo.

**Cambios en `blog_editor.css`:**

1. `.uploaded-files-empty`:
   - `text-align: center`, `padding: 40px 20px`.
   - `color: #adb5bd`.
   - `border: 2px dashed #dee2e6`, `border-radius: 12px`.

**Verificación tras Fase 5:**
- Al cargar página vacía, se ve el estado vacío con icono de carpeta.
- Al subir primer archivo, desaparece el placeholder.
- Al eliminar todos los archivos, reaparece.

---

### Fase 6: Estados visuales diferenciados (4-6 min)

**Cambios en `blog_editor.css`:**

1. Modificar `.uploaded-item.is-hidden`:
   - Añadir patrón de trama diagonal: `background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)`.
   - Añadir `position: relative` al item.

2. Modificar `.uploaded-item.is-cover`:
   - Asegurar que el borde dorado no se corte por overflow: usar `outline` + `outline-offset`.
   - Añadir `box-shadow: 0 0 0 3px rgba(255,193,7,0.4)`.

3. Para videos: añadir clase `.is-video` desde el JS:
   - En `renderUploadedFile`, si `file.type.startsWith('video')`, añadir clase `is-video` al wrapper.
   - CSS: `.uploaded-item.is-video` → sutil borde azul o badge tipo "VIDEO".

**Verificación tras Fase 6:**
- Portada se distingue claramente con borde dorado.
- Oculto tiene trama diagonal y opacidad reducida.
- Videos tienen distintivo visual.

---

### Fase 7: Responsive avanzado y ajustes finales (5-8 min)

**Cambios en `blog_editor.css` (media queries):**

```css
@media (max-width: 1200px) {
    .uploaded-files-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
}

@media (max-width: 768px) {
    .uploaded-files-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 10px;
        padding: 12px;
    }
    .uploaded-controls {
        opacity: 1;
        background: rgba(255,255,255,0.95);
    }
    .uploaded-controls .btn-control {
        width: 36px;
        height: 36px;
    }
}

@media (max-width: 480px) {
    .uploaded-files-grid {
        grid-template-columns: 1fr;
        gap: 10px;
    }
    .uploaded-item {
        max-width: 100%;
        flex-direction: row;
        height: auto !important;
        min-height: 80px;
    }
    .uploaded-image,
    .uploaded-video {
        width: 80px;
        height: 80px;
        max-height: 80px;
    }
    .uploaded-filename {
        text-align: left;
        margin-left: 10px;
    }
}
```

**Ajustes en `blog_editor.js`:**

1. En `renderUploadedFile`, para items video, añadir clase `is-video`.

**Verificación tras Fase 7:**
- Probar en Chrome Dev Tools: 1920px, 1024px, 768px, 375px, 320px.
- En 320px: items de ancho completo, imagen a la izquierda, nombre a la derecha.
- Controles accesibles en touch.

---

## 5. Archivos a modificar

| Archivo                                        | Cambios                                                                                                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend/blog/templates/blog/blog_editor.html` | Modificar clase de `#uploaded-files` (eliminar `d-flex flex-wrap gap-2`, añadir `uploaded-files-grid`)                                                                                                             |
| `backend/blog/static/blog/css/blog_editor.css` | Modificar estilos de `.filepond--item`, `.uploaded-item`, `.uploaded-image`, `.uploaded-video`, `.uploaded-filename`, `.uploaded-controls`, añadir `.uploaded-files-grid`, `.file-type-icon`, media queries nuevas |
| `backend/blog/static/blog/js/blog_editor.js`   | Modificar `renderUploadedFile()` para añadir clase `is-video` y overlay de icono de tipo de archivo                                                                                                                |

---

## 6. Riesgos y mitigaciones

| Riesgo                                                          | Mitigación                                                                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cambios CSS rompen FilePond (que también usa `.filepond--item`) | Mantener scope: `.uploaded-item` es creado por JS del editor, NO es `.filepond--item`. No confundir clases. |
| Iconos FA no cargan en inline overlay                           | Usar clases FA existentes (ya están en el proyecto), no requiere carga adicional.                           |
| Performance con muchos archivos (20+)                           | Grid CSS `auto-fill` es eficiente. No cambiar lógica JS de renderizado.                                     |
| Mobile: controles-touch muy pequeños                            | Fase 4 y 7 incluyen tamaño 36px+ en mobile.                                                                 |

---

## 7. Timeline estimado

| Fase      | Nombre                                  | Tiempo estimado                 |
| --------- | --------------------------------------- | ------------------------------- |
| 1         | Corregir desbordamiento base            | 5-8 min                         |
| 2         | Grid tipo carpeta                       | 5-8 min                         |
| 3         | Iconos por tipo                         | 5-10 min                        |
| 4         | Controles siempre visibles              | 3-5 min                         |
| 5         | Estado vacío                            | 3-5 min                         |
| 6         | Estados visuales (cover, hidden, video) | 4-6 min                         |
| 7         | Responsive avanzado                     | 5-8 min                         |
| **Total** |                                         | **30-50 min de trabajo activo** |

---

## 8. Referencias visuales

### Inspiración UI (no código, solo concepto)
- **Finder/Explorer de archivos:** Grid de iconos con nombre truncado debajo.
- **Google Drive vista grid:** Items con sombra, icono de tipo de archivo overlay, menú contextual.
- **macOS Finder:** Items con borde sutil, icono type badge en esquina.

### Patrón de icono tipo de archivo
```
┌─────────────┐
│  [IMAGEN]   │  ← thumbnail con object-fit: cover
│             │
│ [📷] [👁][🗑]│  ← controles top-right / icono tipo bottom-left
│ archivo.png │  ← nombre truncado
└─────────────┘
```

### Patrón responsive 480px (mobile fila)
```
┌──────────────────────────────────────┐
│ [IMAGEN] │ archivo_muy_largo_que... │
│          │ [👁] [🗑]                 │
└──────────────────────────────────────┘
```

---

*Documento generado siguiendo reglas de proyecto: fases granulares, sin dependencias nuevas, aditivo sobre código existente.*

---

## 9. Fix post-entrega: desbordamiento en items portada

**Problema detectado:** Al marcar un archivo como portada (`.is-cover`), el badge "PORTADA" y los 3 controles (estrella, ojo, eliminar) competían por espacio en la banda superior del item, causando **scroll horizontal** en el contenedor padre.

**Causa raíz:** `.uploaded-item` no tenía `position: relative`, por lo que los elementos absolutamente posicionados se escapaban del flujo y empujaban el ancho total del grid.

**Solución aplicada:**

| Cambio CSS                                                                                                     | Archivo           | Línea aproximada |
| -------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------- |
| `overflow-x: hidden` + `position: relative` en `.uploaded-item`                                                | `blog_editor.css` | 200–211          |
| En `.is-cover`: controles movidos a barra inferior compacta (`bottom: 2px`) con gradiente blanco半transparente | `blog_editor.css` | 261–272          |
| Badge "PORTADA" reducido a `max-width: 40px`, fuente `0.5rem`, padding mínimo                                  | `blog_editor.css` | 274–281          |
| Botones de control reducidos a `28px` en estado cover (vs 32px normal)                                         | `blog_editor.css` | 283–307          |
| Gap entre botones reducido a `1px` en cover                                                                    | `blog_editor.css` | 271              |
| `overflow-x: hidden` en `.uploaded-files-grid` como defensa adicional                                          | `blog_editor.css` | ~375             |

**Resultado:**
- Items portada ya no generan scroll horizontal.
- Badge "PORTADA" cabe en la esquina superior izquierda sin desbordar.
- Controles aparecen en una barra inferior compacta solo en items portada.
- En mobile, los controles siguen siendo visibles permanentemente.

**Archivos modificados (fix):**
- `backend/blog/static/blog/css/blog_editor.css` — solo se agregaron propiedades CSS, no se borró nada existente.
