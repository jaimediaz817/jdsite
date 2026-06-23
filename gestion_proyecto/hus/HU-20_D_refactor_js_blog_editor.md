# HU-20-D: Refactor JS Blog Editor - Estructura modular

**Fecha:** 2026-06-22  
**Estado:** � En progreso  
**Objetivo:** Reorganizar el JavaScript del editor de blog para evitar crecimiento descontrolado y facilitar mantenibilidad mediante separación de responsabilidades.

---

## 🎯 Objetivo

Mover el archivo monolítico `blog_editor.js` a una estructura de carpetas modular y crear archivos JS separados para fragmentos funcionales desacoplados, manteniendo todo el comportamiento existente intacto.

---

## 📊 Diagnóstico actual

**Ubicación actual:**
- Ruta: `backend/blog/static/blog/js/blog_editor.js`
- Líneas: ~1000+ líneas en un solo archivo
- Referenciado en: `backend/blog/templates/blog/blog_editor.html` (línea 490)

### Fragmentos identificados por dominio funcional

1. **Utilidades y constantes** (~50 líneas)
   - Iconos SVG
   - Helpers: `showAutoSaveToast`, `hideAutoSaveToast`, `formatTimeAgo`, `getWordCount`
   - Estado global: `uploadedFiles`, `easyMDE`, `imageWidgets`

2. **Gestión de archivos subidos** (~300 líneas)
   - `renderUploadedFile()` - Renderizado de previews
   - `setAsCover()` - Marcar portada
   - `toggleUploadedFile()` - Mostrar/ocultar
   - `removeUploadedFile()` - Eliminación completa
   - `showUploadedFilesEmpty()` - Estado vacío

3. **Widgets de imagen en editor** (~250 líneas)
   - `createImageWidget()` - Creación del widget DOM
   - `updateBlockButtonState()` - Actualizar UI bloqueo
   - `updateCoverButtonState()` - Actualizar UI portada
   - `refreshImageWidgets()` - Refresco completo
   - Drag & drop: `startImageDrag()`, `moveImageDragGuide()`, `endImageDrag()`

4. **Selector de imágenes existentes** (~150 líneas)
   - `openImageSelectorModal()` - Apertura y población
   - `insertImageInEditor()` - Inserción contextual
   - `detectImageContext()` - Detección de modo (normal/slides/gallery)

5. **Barra de herramientas MTP** (~200 líneas)
   - `MTP_TEMPLATES` - Definición de templates
   - `insertMtpTemplate()` - Motor de inserción
   - `initMtpToolbar()` - Inicialización y eventos
   - `openWidgetHelpModal()` - Sistema de ayuda

6. **Auto-save y borradores** (~150 líneas)
   - `performAutoSave()` - Guardado en localStorage
   - `restoreDraft()` - Recuperación
   - `showDraftRecoveryModal()` - Modal de confirmación

7. **Inicialización y eventos globales** (~100 líneas)
   - EasyMDE setup
   - FilePond config
   - Eventos DOM (paste, drop, change, beforeunload)

---

## 🏗️ Arquitectura propuesta

```
backend/blog/static/blog/js/blog_editor/
├── index.js                    # Entry point: orquesta imports y expone API pública
├── config.js                   # Constantes, iconos, configuración global
├── utils.js                    # Helpers generales (toast, timeAgo, wordCount)
├── draft-manager.js            # Auto-save, borradores, recovery modal
├── file-manager.js             # Gestión completa de archivos subidos
├── image-widgets.js            # Sistema de widgets en CodeMirror + drag&drop
├── image-selector.js           # Modal selector de imágenes existentes
├── mtp-toolbar.js              # Barra de herramientas Mark to Post
├── form-manager.js             # Tags, categorías, collectFormData
└── editor-init.js              # EasyMDE, FilePond, event listeners globales
```

---
### ✅ Criterios de aceptación (actualizado)

#### Fase 1: Reorganización estructural (completada)
- [x] Crear carpeta `backend/blog/static/blog/js/blog_editor/`
- [x] Mover `blog_editor.js` → `blog_editor/index.js`
- [x] Actualizar referencia en template: `{% static 'blog/js/blog_editor/index.js' %}`
- [x] Todo comportamiento existente funciona idéntico (no‑breaking changes)
- [x] Sin dependencias nuevas (solo ES6 modules nativo)

#### Fase 2: Desacoplamiento progresivo (pendiente)
1. **Utils + Config** – crear `utils.js` y `config.js` con los iconos y helpers actuales.
2. **Draft Manager** – extraer lógica de auto‑save y borradores a `draft-manager.js`.
3. **Form Manager** – separar gestión de tags, categorías y recolección de datos a `form-manager.js`.
4. **File Manager** – mover toda la lógica de archivos subidos (render, cover, toggle, delete) a `file-manager.js`.
5. **Image Widgets** – aislar widgets de CodeMirror y drag‑and‑drop en `image-widgets.js`.
6. **Image Selector** – modularizar el modal selector en `image-selector.js` (ya existe pero aún depende de código monolítico).
7. **MTP Toolbar** – refactorizar la barra de herramientas a `mtp-toolbar.js` (ya existe pero necesita importaciones limpias).
8. **Editor Init** – crear `editor-init.js` que orqueste la carga de los módulos anteriores.

#### Fase 3: Integración del widget de video (parcialmente implementada)
- Se creó `backend/blog/static/blog/js/blog_editor/video-widget.js` con la función `insertVideoTemplate()` y lógica de drag‑and‑drop para videos.
- La HU **HU‑20‑C‑V1** describe la UI/UX del video y ya está actualizada.
- Falta integrar `video-widget.js` en la nueva arquitectura modular (importarlo desde `mtp-toolbar.js` y exponer su API).

#### Próximos pasos concretos
- [ ] Implementar `utils.js` y `config.js` (≈20 min).
- [ ] Refactorizar `index.js` para que solo importe y re‑exporte los módulos creados.
- [ ] Actualizar los imports en `mtp-toolbar.js` y `image-selector.js` para usar la nueva estructura.
- [ ] Añadir logs de inicio/fin según el protocolo de logging (sección “🧪 Protocolo de logging”).
- [ ] Ejecutar la checklist de verificación de no‑regresión (pasos 1‑5) antes de avanzar a la fase 2.
- [x] Sin dependencias nuevas (solo ES6 modules nativo)

### Fase 2: Desacoplamiento progresivo
Cada fragmento se extrae en su archivo manteniendo:
- Mismas funciones públicas (misma firma)
- Mismo alcance de variables (globales preservadas en `window` donde corresponda)
- Mismo orden de ejecución

Priorización sugerida:
1. **Utils + Config** → `utils.js`, `config.js` (sin dependencias)
2. **Draft Manager** → `draft-manager.js` (bajo acoplamiento)
3. **Form Manager** → `form-manager.js` (tags, categorías)
4. **File Manager** → `file-manager.js` (depende de utils)
5. **Image Widgets** → `image-widgets.js` (depende de file-manager)
6. **Image Selector** → `image-selector.js` (depende de file-manager + widgets)
7. **MTP Toolbar** → `mtp-toolbar.js` (depende de image-selector)
8. **Editor Init** → `editor-init.js` (orquesta todo)

---

## ⚠️ Consideraciones técnicas

### Variables globales preservadas
Algunas variables deben seguir siendo globales por dependencias externas:
- `window.imageSelectorOpen`
- `window.selectedImageFilename`
- `window.imageDragActive`
- `DELETE_FILE_URL` (definido en template)

### Event listeners
Los eventos en `document` y `window` deben registrarse una sola vez, idealmente durante init.

### Orden de carga
Los módulos deben cargarse en orden de dependencias. Usar imports dinámicos para evitar ciclos.

### Referencias DOM
Las referencias a elementos del template (`document.getElementById`) se mantienen en los módulos que las usan, sin necesidad de centralizarlas.

---

## 📋 Plan de implementación por fases

### ✅ Fase 1: Movimiento estructural (SIN refactor)
- Crear carpeta destino
- Mover archivo manteniendo nombre interno `index.js`
- Actualizar template
- Verificar que todo funciona igual

### 🔄 Fase 2: Extraer utils y config (20 min)
- Crear `config.js` (iconos, constantes)
- Crear `utils.js` (helpers)
- Actualizar `index.js` para importar y re-exportar
- Probar toasts, formateo

### 🔄 Fase 3: Extraer draft-manager (20 min)
- Mover todo código de auto-save/borradores a `draft-manager.js`
- Exportar funciones: `performAutoSave`, `restoreDraft`, `discardDraft`
- Actualizar `index.js`
- Probar guardado automático y modal de recuperación

### 🔄 Fase 4: Extraer form-manager (20 min)
- Tags y categorías
- `collectFormData`
- Eventos de tiempo de lectura

### 🔄 Fase 5: Extraer file-manager (30 min)
- Toda la lógica de archivos subidos
- Upload, render, cover, toggle, delete

### 🔄 Fase 6: Extraer image-widgets (30 min)
- Widgets CodeMirror
- Drag & drop
- Actualización de estados

### 🔄 Fase 7: Extraer image-selector (20 min)
- Modal selector
- Contexto detección
- Inserción en editor

### 🔄 Fase 8: Extraer mtp-toolbar (20 min)
- Templates MTP
- Inicialización toolbar
- Help modals

### 🔄 Fase 9: Extraer editor-init (20 min)
- EasyMDE init
- FilePond init
- Eventos globales change/paste/drop

---

## 🧪 Estrategia de pruebas

1. **Humo**: Verificar que carga la página del editor
2. **Funcional**: Probar cada feature extraída:
   - Subir imagen → preview aparece
   - Marcar portada → badge se actualiza
   - Ocultar imagen → se envuelve en `:::no-import:::`
   - Guardar → toast aparece
   - Borrador recovery → modal funciona
   - Barra MTP → insertar templates
   - Drag & drop → imagen se mueve
3. **Regresión**: Verificar que NO se rompe nada existente

---

## 📦 Dependencias externas confirmadas

- EasyMDE (CDN)
- FilePond (CDN)
- Marked.js + DOMPurify (CDN)
- jQuery 3.2.1 (static local)
- Bootstrap 4.3.1 (static local)
- Font Awesome (static local)

**NO se instalarán dependencias nuevas**. Solo ES6 modules nativo.

---

## ✅ Verificación de no regresión (Fase 1)

Para esta fase de movimiento estructural se garantiza:
- No se editó ninguna línea de lógica del JS.
- Solo cambió la ubicación física del archivo y la referencia en el template.
- Las variables/funciones globales conservan el mismo nombre.
- Los eventos registrados (`DOMContentLoaded`, `load`, `beforeunload`, etc.) siguen ejecutándose en el mismo orden.
- No se introducen dependencias nuevas.

**Checklist de validación (obligatorio antes de continuar con Fase 2):**
1. [ ] Acceder a la página del editor y confirmar que carga sin errores JS.
2. [ ] Verificar en DevTools (Console) que NO aparecen errores 404 para `/blog/js/blog_editor/index.js`.
3. [ ] Confirmar que EasyMDE y FilePond se inicializan correctamente.
4. [ ] Probar subir una imagen y ver que aparece en el grid y en el editor.
5. [ ] Probar guardar y ver el toast de auto-save.

**Esta fase se aprueba únicamente tras confirmar manualmente el paso 1.**

---

## 🧪 Protocolo de logging para fases de extracción

En cada HU derivada de extracción (`utils`, `draft-manager`, etc.) se exigirá:
- Un log de **inicio** y **fin** por función/archivo, por ejemplo:
  - `console.log('[blog_editor][utils] showAutoSaveToast iniciado');`
  - `console.log('[blog_editor][utils] showAutoSaveToast finalizado');`
- En funciones async: log antes y después del `await` de fetch/Procesamiento.
- En event listeners: log al registrar y log al ejecutar el handler.
- Esto permite confirmar que cada fragmento se ejecuta exactamente como antes, sin tocar código que no le corresponde.

**Ejemplo mínimo obligatorio por archivo:**

```javascript
// utils.js
console.log('[blog_editor][utils] modulo cargado');
export function showAutoSaveToast(title, detail) {
  console.log('[blog_editor][utils] showAutoSaveToast iniciado', { title, detail });
  // ... lógica existente ...
  console.log('[blog_editor][utils] showAutoSaveToast finalizado');
}
```

---

## 🔒 Bloqueo entre fases (actualizado)

**Fase 1 → Fase 2:**
Se avanza a la extracción de `utils.js` y `config.js` una vez se haya completado la checklist de verificación de no‑regresión (pasos 1‑5) y se haya confirmado que el widget de video funciona dentro del monolito.

## 📌 Estado actual (resumen)

- **Estructura de carpetas** creada y `index.js` movido.
- **Referencia en la plantilla** actualizada y funciona.
- **Widget de video** (`video-widget.js`) está presente y documentado en HU‑20‑C‑V1, pero aún no está integrado en la arquitectura modular.
- **`index.js`** sigue conteniendo ~2400 líneas; la fragmentación aún no se ha iniciado.
- **Pruebas manuales** de carga, auto‑save y subida de imágenes siguen pasando.

---

## 🔍 Hallazgos adicionales en index.js (Análisis 2026-06-23)

### 🔴 DUPLICACIÓN REAL (3 funciones definidas 2 veces)

| Función                   | Línea 1       | Línea 2       | Impacto                                                                                            |
| ------------------------- | ------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `getImageLineRegex()`     | 1967 (FASE 1) | 2154 (FASE 4) | La segunda redefinición **sobrescribe** a la primera, pero al ser idéntica no hay cambio funcional |
| `getImageLines()`         | 1973 (FASE 1) | 2160 (FASE 4) | Idem                                                                                               |
| `isImageLine(lineNumber)` | 1990 (FASE 1) | 2177 (FASE 4) | Idem                                                                                               |

**Riesgo de eliminación: CERO** — Eliminar las ocurrencias de FASE 4 no cambia el comportamiento, ya que las de FASE 1 se definieron primero y son idénticas.

### 🟡 DUPLICACIÓN FUNCIONAL (misma lógica, distinto nombre)

| Función A                             | Línea | Función B                                         | Línea | Diferencia                                   |
| ------------------------------------- | ----- | ------------------------------------------------- | ----- | -------------------------------------------- |
| `removeMarkdownLineForFile(filename)` | 414   | `deleteImageLineFromEditor(lineNumber, filename)` | 1084  | `lineNumber` se recibe pero **nunca se usa** |

Ambas hacen exactamente lo mismo:
1. Escapan el filename con `safe = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
2. Crean `imgRegex` y `videoRegex`
3. Reemplazan en `easyMDE.value()` con `.replace(imgRegex, '')` y `.replace(videoRegex, '')`
4. Limpian con `updated.replace(/^\s*:::final-no-import:::\s*$/gm, '')`

**Riesgo de unificación: CERO** — Basta con que `deleteImageLineFromEditor` llame internamente a `removeMarkdownLineForFile(filename)`.

### 🟠 NO EXTRAÍDO A PESAR DE HABERSE DECLARADO

El comentario en línea **1431-1434** dice textualmente:
> *"HU-20-C-V1: Selector de imágenes existente ha sido extraído a 'image-selector.js'. Las funciones detectImageContext, openImageSelectorModal, insertImageInEditor y los manejadores de eventos del modal ahora se encuentran en ese módulo"*

**Pero NO es cierto.** Las 3 funciones siguen en `index.js`:
- `detectImageContext()` → Línea **1921**
- `openImageSelectorModal()` → Línea **2185**
- `insertImageInEditor()` → Línea **2302**

Además, `image-selector.js` existe físicamente pero está huérfano (no se importa desde ningún lado porque las funciones nunca se movieron allí).

### 🟣 3 HANDLERS DISTINTOS PARA EL MISMO EVENTO `change`

| Handler          | Línea     | Propósito                                          |
| ---------------- | --------- | -------------------------------------------------- |
| A (IIFE)         | 741-757   | Sincronizar cursor y scroll después de cada cambio |
| B (con debounce) | 1268-1292 | Refrescar widgets de imagen con 300ms de delay     |
| C (inline)       | 1318-1326 | Calcular tiempo de lectura y contador de palabras  |

Los 3 conviven en el mismo evento `change`. El Handler B ejecuta `cm.off('change', window._changeHandler)` que **no interfiere** con los otros porque usa su propia referencia. Sin embargo, tener 3 handlers separados hace el código más difícil de seguir y depurar.

**Riesgo de consolidación: ALTO** — Se recomienda NO tocar esto.

---

## 📋 Plan de acción para limpieza inmediata (pre-Fase 2)

Antes de iniciar la extracción de módulos (Fase 2), se propone una **Fase 1.5** de limpieza con cambios 100% seguros:

### Paso 1: Eliminar funciones duplicadas en FASE 4 (riesgo CERO)
- **Archivo:** `index.js` líneas 2153-2182
- **Eliminar:** `getImageLineRegex()`, `getImageLines()`, `isImageLine()`
- **Motivo:** Son redefiniciones idénticas a las de FASE 1 (líneas 1967-1995)

### Paso 2: Unificar `deleteImageLineFromEditor` → `removeMarkdownLineForFile` (riesgo CERO)
- **Archivo:** `index.js` línea 1084-1099
- **Cambio:** Reescribir `deleteImageLineFromEditor` para que llame a `removeMarkdownLineForFile(filename)` y haga solo `cleanupImageWidget(lineNumber)`
- **Motivo:** La lógica de eliminar líneas markdown está duplicada; `lineNumber` no se usa en la versión actual

### Paso 3: Verificar el estado real de `image-selector.js` (riesgo BAJO)
- **Acción:** Leer `image-selector.js` para confirmar si tiene código o está vacío
- **Decisión post-lectura:** Si está vacío, se marca como pendiente para Fase 2. Si tiene código, se elimina el comentario engañoso.

---

## ⏭️ Próximo paso concreto

1. ✅ Leer y actualizar esta HU con hallazgos (completado)
2. ⬜ Aprobar plan de acción por el usuario
3. ⬜ Ejecutar Paso 1: eliminar duplicados FASE 4
4. ⬜ Ejecutar Paso 2: unificar funciones de eliminación
5. ⬜ Ejecutar Paso 3: verificar image-selector.js
6. ⬜ Probar en navegador (checklist de no-regresión)
7. ⬜ Continuar con Fase 2 del plan original (extraer utils.js y config.js)

---

## 📦 Dependencias externas confirmadas

- EasyMDE (CDN)
- FilePond (CDN)
- Marked.js + DOMPurify (CDN)
- jQuery 3.2.1 (static local)
- Bootstrap 4.3.1 (static local)
- Font Awesome (static local)

**NO se instalarán dependencias nuevas**. Solo ES6 modules nativo.
