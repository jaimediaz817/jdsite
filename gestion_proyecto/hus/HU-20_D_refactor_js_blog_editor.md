# HU-20-D: Refactor JS Blog Editor - Estructura modular

**Fecha:** 2026-06-22  
**Estado:** 📋 Planificación  
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

## 🎯 Criterios de aceptación

### Fase 1: Reorganización estructural
- [x] Crear carpeta `backend/blog/static/blog/js/blog_editor/`
- [x] Mover `blog_editor.js` → `blog_editor/index.js`
- [x] Actualizar referencia en template: `{% static 'blog/js/blog_editor/index.js' %}`
- [x] Todo comportamiento existente funciona idéntico (no-breaking changes)
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

## 🔒 Bloqueo entre fases

**Fase 1 → Fase 2:**
Solo se avanza a extraer `utils.js` / `config.js` después de validar el checklist de no-regresión anterior.

## 🔄 Decisión: Solo diagnóstico y planificación

**Esta HU solo define:**
- La estructura de carpetas objetivo
- Los fragmentos a desacoplar
- El orden de extracción
- Los criterios de aceptación

**NO implementa el desacoplamiento aún.**  
La implementación se hará en fases separadas, una por HU derivada.

---

**Próxima HU sugerida:** HU-20-D.1 → Fase 1: Movimiento estructural (cambiar ruta del archivo)
