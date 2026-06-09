# HU-017: Mejora del flujo de borradores en el editor

## 🎯 Objetivo
Rediseñar el mecanismo de guardado y recuperación de borradores del editor online eliminando diálogos nativos del navegador (`confirm()`, `beforeunload`) y reemplazándolos con notificaciones personalizadas (toast Bootstrap) que den confianza al usuario.

---

## 🔍 Diagnóstico del estado actual

### 📂 Archivos involucrados
| Archivo                                            | Rol                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `backend/blog/static/blog/js/blog_editor.js`       | Lógica completa del editor frontend                                   |
| `backend/blog/templates/blog/blog_editor.html`     | Template con el marcado HTML                                          |
| `backend/blog/static/blog/css/blog_editor.css`     | Estilos del editor                                                    |
| `backend/blog/services.py`                         | Backend `save_blog_to_source()`                                       |
| `backend/blog/views.py`                            | Vistas `blog_editor_view()`, `save_blog_api()`, `get_blog_for_edit()` |
| `backend/blog/management/commands/import_blogs.py` | Comando `save_blog_post()` que crea/actualiza en BD                   |

### 🔄 Flujo actual de borradores

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUARIO ESCRIBE EN EL EDITOR                        │
│    - Cada 30 segundos → auto-save a localStorage        │
│    - Clave: 'blog_editor_draft'                          │
│    - Guarda: title, description, category, tags,         │
│      meta, content_md, files[], cover_filename           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. USUARIO CIERRA / RECARGA                            │
│    - beforeunload: guarda en localStorage + muestra     │
│      cuadro nativo del navegador                        │
│      "¿Tienes cambios sin guardar?"                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. USUARIO VUELVE AL EDITOR                            │
│    - onload: detecta draft en localStorage              │
│    - Muestra confirm() NATIVO:                          │
│      "¿Recuperar borrador guardado?"                    │
│    - Si acepta → restaura todo                          │
│    - Si rechaza → borra localStorage                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 4. USUARIO HACE CLICK EN "GUARDAR BORRADOR"            │
│    - POST /blog/api/save-blog/                          │
│    - services.py → save_blog_to_source()                │
│    - Escribe blog.md en blogs_source/                   │
│    - Ejecuta import_blogs → update_or_create en BD      │
│    - is_published = False → approval_token generado     │
│    - isSaved = true (desactiva beforeunload)            │
│    - Limpia localStorage                                │
└─────────────────────────────────────────────────────────┘
```

### ❌ Problemas identificados

| #   | Problema                                                       | Impacto                                                                                                               |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | **`confirm()` nativo** (línea 424)                             | Diálogo feo, no personalizable, rompe UX                                                                              |
| 2   | **`beforeunload` nativo** (línea 515-523)                      | Mensaje genérico del navegador, no podemos controlar texto                                                            |
| 3   | **Toast de auto-save pobre** (líneas 166-168 HTML, 410-414 JS) | Desaparece en 2s, fácil de ignorar, no da feedback de "qué se guardó"                                                 |
| 4   | **Sin distinción borrador local vs pendiente servidor**        | Confusión conceptual. Un "borrador" en localStorage NO es lo mismo que un artículo "pendiente de moderación" en la BD |
| 5   | **Sin botón "Descartar borrador" visible**                     | El usuario no tiene forma consciente de eliminar el draft                                                             |
| 6   | **Sin indicador persistente de "hay borrador local"**          | El usuario no sabe que existe un draft hasta que recarga la página                                                    |
| 7   | **Sin fecha/hora del último auto-save**                        | El usuario no sabe qué tan reciente es el draft                                                                       |

### 📝 Terminología a clarificar

```
BORRADOR LOCAL (localStorage)
  ↓  Datos no persistidos en el servidor
  ↓  Se pierden si se limpia localStorage / otro navegador
  ↓  Máximo: último auto-guardado (cada 30s)

ARTÍCULO PENDIENTE (BD - is_published=False, moderation_status="pending")
  ↓  Persistido en servidor (blog.md + BD)
  ↓  Visible en dashboard de moderación
  ↓  Tiene approval_token para aprobación vía email
  ↓  NO visible al público
  ↓  Se diferencia de BORRADOR LOCAL en que el usuario hizo clic en "Guardar"
```

---

## 📋 Plan de implementación

### Fase 1: Reemplazar `confirm()` y `beforeunload` con modal Bootstrap ✅
**Archivos:** `blog_editor.js`, `blog_editor.html`

- [ ] 1.1 Crear modal Bootstrap personalizado para "¿Recuperar borrador guardado?"
  - Título: "📝 Borrador local encontrado"
  - Cuerpo: "Tienes un borrador guardado localmente hace X minutos. ¿Deseas recuperarlo?"
  - Botones: "Recuperar" (primary) | "Descartar" (danger) | "Cancelar" (secondary)
  - Mostrar metadatos: fecha del draft, palabras, categoría si tiene
- [ ] 1.2 Reemplazar `beforeunload` con:
  - Auto-guardado forzado en `beforeunload` (seguir guardando en localStorage)
  - En lugar del diálogo nativo, mostrar un modal si hay cambios sin guardar
  - **IMPORTANTE**: `beforeunload` no se puede evitar completamente, pero podemos minimizar su uso guardando siempre en localStorage antes de la salida
- [ ] 1.3 Agregar indicador persistente en la UI de "📝 Hay borrador local" con badge visible

### Fase 2: Toast de auto-save mejorado ✅
**Archivos:** `blog_editor.html`, `blog_editor.js`, `blog_editor.css`

- [ ] 2.1 Toast persistente con:
  - Icono: 💾 cuando guarda, ✅ cuando ya está guardado
  - Texto dinámico: "Borrador guardado — hace 2 minutos"
  - Botón "Descartar borrador" dentro del toast
  - Auto-ocultarse a los 5 segundos pero con opción de mantenerlo visible
- [ ] 2.2 Agregar timestamp del último auto-save en el toast
- [ ] 2.3 Animación de entrada/salida suave (CSS transitions)

### Fase 3: Diferenciar visualmente borrador local vs pendiente ✅
**Archivos:** `blog_editor.js`, `blog_editor.html`

- [ ] 3.1 Badge en la interfaz que indique:
  - 🔵 "Borrador local" (nunca guardado en servidor)
  - 🟡 "Pendiente de aprobación" (guardado en servidor, esperando moderación)
  - 🟢 "Publicado" (visible al público)
- [ ] 3.2 Al cargar un artículo existente para editar, mostrar su estado real:
  - Si `moderation_status` es "pending" → badge amarillo
  - Si `is_published` es true → badge verde
  - Si no hay artículo → badge azul "Nuevo artículo"
- [ ] 3.3 Botón "Descartar borrador visible" → con confirmación modal

### Fase 4: Mejoras de usabilidad ✅
**Archivos:** `blog_editor.js`, `blog_editor.css`

- [ ] 4.1 Cambiar el auto-save de 30s a 15s (más capacidad de respuesta)
- [ ] 4.2 Forzar auto-save también:
  - Al perder el foco de la ventana (`visibilitychange`)
  - Al hacer clic en "Cancelar"
  - Al cambiar de pestaña
- [ ] 4.3 Agregar contador de palabras en el toast de auto-save
- [ ] 4.4 En el modal de recuperación, mostrar resumen del contenido del draft

### Fase 5 (opcional): Sincronización con sessionStorage ✅
- [ ] 5.1 Si el usuario está logueado, considerar guardar también en sessionStorage como backup
- [ ] 5.2 En futura iteración: endpoint para guardar draft en servidor como "borrador temporal" (no artículo completo, solo datos del formulario)

---

## 🧩 Dependencias entre fases

```
Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4 ──► Fase 5
  (modal)    (toast)     (badges)    (15s)      (backup)
```

Cada fase es independiente y puede implementarse sin esperar a las demás, pero el orden propuesto maximiza el impacto UX temprano.

---

## 📏 Criterios de aceptación

1. ✅ No hay diálogos nativos `confirm()` ni `beforeunload` visibles al usuario
2. ✅ Al recargar la página con un draft, se muestra modal Bootstrap en lugar de `confirm()`
3. ✅ El toast de auto-save muestra timestamp + resumen del contenido
4. ✅ El usuario puede descartar el borrador desde la UI (no solo aceptando/rechazando un diálogo)
5. ✅ Hay un badge visible que indica "Borrador local" cuando hay datos no guardados en servidor
6. ✅ Al editar un artículo existente, se muestra su estado real (pendiente/publicado)
7. ✅ El auto-save ocurre cada 15s (o en eventos clave)
8. ✅ La experiencia se siente fluida, moderna y da confianza al usuario

---

## ⏱ Estimación de tiempo por fase

| Fase      | Tiempo estimado | Riesgo                            |
| --------- | --------------- | --------------------------------- |
| Fase 1    | 45 min          | 🟢 Bajo (solo JS + HTML + CSS)     |
| Fase 2    | 30 min          | 🟢 Bajo                            |
| Fase 3    | 20 min          | 🟢 Bajo                            |
| Fase 4    | 15 min          | 🟢 Bajo                            |
| Fase 5    | 30 min          | 🟡 Medio (requiere nuevo endpoint) |
| **Total** | **~2h 20min**   |                                   |

---

## 📎 Referencias

- Código actual: `backend/blog/static/blog/js/blog_editor.js` (líneas 406-523)
- Template: `backend/blog/templates/blog/blog_editor.html` (líneas 158-168)
- Vista backend guardado: `backend/blog/services.py` → `save_blog_to_source()`
- Vista backend carga edición: `backend/blog/views.py` → `get_blog_for_edit()`

---

## ✅ Checklist resumen de tareas

### Completado (sesiones anteriores)
- [x] Fix `created_at` → migración `0017`, script correctivo ejecutado (30 posts corregidos)
- [x] HU-017 creada con diagnóstico completo del flujo de borradores
- [x] Identificados los 7 problemas del editor (confirm nativo, beforeunload, toast, etc.)

### ✅ Completado en esta implementación (08/06/2026)

#### Fase 1: Modal Bootstrap reemplazando `confirm()` y `beforeunload`
- [x] 1.1 Modal Bootstrap personalizado "📝 Borrador local encontrado" con:
  - Antigüedad del draft, título, palabras, categoría
  - Botones: Recuperar (primary) | Descartar (danger) | Cancelar (secondary)
- [x] 1.2 `beforeunload` modificado: guarda en localStorage sin `preventDefault()` ni diálogo nativo
- [x] 1.3 Indicador persistente "📝 Hay borrador local" con badge visible + botón Descartar

#### Fase 2: Toast de auto-save mejorado
- [x] 2.1 Toast dark con header, timestamp, texto dinámico, botón "Descartar borrador"
- [x] 2.2 Timestamp del último auto-save (hora local HH:MM)
- [x] 2.3 Animación CSS `toastSlideIn` (slide desde derecha)

#### Fase 3: Badges de estado visual
- [x] 3.1 Badge con clases: 🔵 "Nuevo artículo" / 🔵 "Borrador local" / 🟡 "Pendiente de aprobación" / 🟢 "Publicado"
- [x] 3.2 Al cargar artículo existente, se actualiza badge según `is_published` + `moderation_status`
- [x] 3.3 Botón "Descartar borrador" visible con confirmación modal

#### Fase 4: Mejoras de usabilidad
- [x] 4.1 Auto-save reducido de 30s → 15s
- [x] 4.2 Auto-save forzado en `visibilitychange` + clic "Cancelar"
- [x] 4.3 Contador de palabras en el toast de auto-save
- [x] 4.4 Resumen del contenido del draft en el modal de recuperación

#### Backend
- [x] `get_blog_for_edit()` devuelve `is_published` y `moderation_status` en JSON
- [x] `python manage.py check` sin errores (solo warnings pre-existentes de allauth)

### 🔲 Pendiente / Opcional
- [ ] Fase 5: sessionStorage backup + endpoint opcional de draft en servidor
- [ ] Probar flujo completo en navegador: crear borrador → recargar → recuperar → guardar → moderar → publicar
- [ ] Revisar y ajustar intervalo de tiempo sugerido en el toast según feedback

---

**Estado:** ✅ Implementado (Fases 1-4 completadas, Fase 5 opcional pendiente)
**Creado:** 08/06/2026
**Implementado:** 08/06/2026
**Historia de Usuario:** HU-017
**Archivos modificados:**
- `backend/blog/templates/blog/blog_editor.html` — modal, toast, badges, indicador
- `backend/blog/static/blog/js/blog_editor.js` — toda la lógica nueva
- `backend/blog/static/blog/css/blog_editor.css` — estilos de badges, toast, modales, indicador
- `backend/blog/views.py` — `is_published` + `moderation_status` en API
