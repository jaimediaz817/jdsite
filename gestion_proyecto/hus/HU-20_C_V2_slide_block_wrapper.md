# HU-20_C_V2: Slides — Overlay visual agrupador de bloques

## Estado: IMPLEMENTADO — BLOQUEADO PARA PRÓXIMA EJECUCIÓN

**Fecha:** 2026-06-26  
**Implementación:** Completada en código  
**Próximo paso:** Validación visual sin riesgo de regresión

---

## Objetivo

Lograr que **todo el bloque** `:::slides` o `:::popup:gallery` quede **visualmente agrupado** bajo el widget macho mediante un overlay de fondo semitransparente.

### Restricción técnica (NO negociable)

CodeMirror 5 **administra su propio árbol DOM**. Cualquier intento de mover `<pre class="CodeMirror-line">` fuera de la estructura de CodeMirror es **revertido en el próximo tick**. Por tanto:

- ❌ **Imposible:** Agrupar líneas como hijas de un contenedor personalizado
- ✅ **Factible:** Overlay visual con `position: absolute` calculado dinámicamente

---

## Criterios de aceptación (TODOS deben cumplirse)

### 1. Flag `insideBlock` — SKIP de widgets individuales
- [x] Al detectar `:::slides` o `:::popup:gallery`, se activa el flag `insideBlock`
- [x] Mientras `insideBlock` esté activo, NO se crean widgets individuales para imágenes/videos/YouTube dentro del bloque
- [x] Al encontrar `:::` de cierre, se desactiva el flag
- [x] Fuera de bloques, TODO funciona exactamente igual que antes (imágenes, videos, YouTube tienen sus widgets)

### 2. Widget macho con contexto de posición
- [x] El `<span>` del widget macho tiene `display: inline-block` + `position: relative`
- [x] El overlay con `position: absolute` se posiciona respecto a este ancestro
- [x] Se agrega la clase `widget-container` al widget para selector CSS

### 3. Overlay dinámico recalculado
- [x] En `refreshImageWidgets()` se inyecta `div.slideblock-overlay` dentro del widget macho
- [x] Listener `cm.on('scroll')` llama a `updateBlockOverlays()` con debounce de 16ms (~60fps)
- [x] `updateBlockOverlays()` recalcula `top` y `height` del overlay usando `cm.charCoords()`
- [x] El overlay tiene:
  - Borde izquierdo azul: `3px solid #3b82f6`
  - Fondo semitransparente: `rgba(59, 130, 246, 0.08)`
  - `pointer-events: none` (no interfiere con interacción)

### 4. Arrastre de bloques
- [x] `startBlockDrag()` arrastra el bloque completo (línea apertura + contenido + cierre)
- [x] No se duplican widgets al arrastrar (limpieza en `cleanupBlockDragState()`)
- [x] El `editorWrapper` recibe `position: relative` durante el arrastre

### 5. Botón de ayuda
- [x] El widget macho tiene botón `?` que abre el modal de ayuda
- [x] El modal muestra contenido de `slide-widget` sin errores

---

## Implementación actual (lo que YA está en el código)

### Archivos modificados

1. **`backend/blog/static/blog/js/blog_editor/index.js`**
   - `createSlideBlockWidget()`: widget con `display: inline-block` + `position: relative`
   - `refreshImageWidgets()`: flag `insideBlock` + inyección de overlay
   - `updateBlockOverlays()`: función global que recalcula posiciones
   - Listener `cm.on('scroll')`: llama a `updateBlockOverlays()` con debounce

2. **`backend/blog/static/blog/css/blog_editor.css`**
   - `.slideblock-widget-mtp.widget-container`: `display: inline-block` + `position: relative`
   - `.slideblock-overlay`: overlay con borde azul y fondo semitransparente

---

## Próximos pasos (VALIDACIÓN)

### 1. Verificar en el navegador
Abrir el editor y crear un bloque `:::slides` con 2-3 imágenes. Validar:

- [ ] El widget macho tiene clase `widget-container` y estilos CSS aplicados (display: inline-block + position: relative)
- [ ] El overlay azul cubre TODO el bloque (línea apertura + imágenes + cierre)
- [ ] Al hacer scroll, el overlay se reposiciona correctamente (no se queda "pegado" en una posición)
- [ ] Las imágenes dentro del bloque NO tienen sus propios widgets (no se ven los controles de imagen individuales)
- [ ] Al pasar el mouse por encima del overlay, NO aparece el menú `⋮` de imagen (porque es `pointer-events: none`)
- [ ] El grip (≡) del widget macho permite arrastrar el bloque completo
- [ ] El botón `?` abre el modal de ayuda sin errores
- [ ] Fuera del bloque `:::slides`, las imágenes siguen mostrando su widget individual normalmente

### 2. Casos edge a probar
- [ ] Bloque `:::popup:gallery` (mismo comportamiento que `:::slides`)
- [ ] Múltiples bloques `:::slides` en el mismo artículo
- [ ] Bloque `:::slides` al final del documento (no hay scroll, overlay debe calcularse correctamente)
- [ ] Bloque `:::slides` con 1 sola imagen
- [ ] Bloque `:::slides` con muchas imágenes (requiere scroll vertical)

### 3. Si algo falla, verificar
1. Consola del navegador: ¿hay errores JS?
2. Inspeccionar elemento: ¿el `<span>` del widget tiene `display: inline-block` + `position: relative`?
3. ¿El overlay existe como hijo del widget? (`querySelector('.slideblock-overlay')`)
4. ¿Las coordenadas del overlay son correctas? (comparar con `cm.charCoords()` en consola)

---

## Notas técnicas

### ¿Por qué no agrupar las líneas en un contenedor?
CodeMirror 5 reconstruye su DOM interno en cada cambio. Cualquier manipulación externa (appendChild, insertBefore) sobre los `<pre class="CodeMirror-line">` es revertida en el próximo tick del motor.

### Estrategia adoptada
Overlay visual posicionado absolutamente dentro del widget macho, con recalculado dinámico en scroll. Esto da la **ilusión visual** de agrupación sin violar las restricciones de CodeMirror.

### Limitaciones conocidas
- El overlay es solo visual, no afecta el DOM subyacente
- Si se desplaza el contenido del editor sin hacer scroll (ej: redimensionar ventana), el overlay podría desfasarse hasta el próximo scroll
- El overlay NO cubre el gutter (números de línea) intencionalmente