# HU-20-B: Menú contextual flotante para imágenes en el editor

## 📋 Metadatos
- **ID:** HU-20-B
- **Dependencia:** HU-20-A (sistema no-import) — ya implementada
- **Estado:** Pendiente
- **Prioridad:** Media
- **Tiempo estimado:** 3 fases de ~15 min cada una

## 🎯 Objetivo
Añadir un elemento visual (icono con menú desplegable) al final de cada línea de imagen `![filename](./filename)` o video `<video ...>` dentro del editor EasyMDE/CodeMirror, permitiendo en el futuro ejecutar acciones contextuales (bloquear/desbloquear individualmente desde el editor, portada, etc.).

## ✅ Criterios de aceptación

1. Cada línea de imagen/video en el editor muestra un icono flotante al final de la línea.
2. El icono es un botón con un indicador visual (⋮ o ⚙ o similar con Font Awesome).
3. Al hacer clic en el icono, se despliega un menú dropdown con opciones.
4. Por ahora el menú puede tener opciones placeholder ("Acción 1", "Acción 2") sin funcionalidad real.
5. El widget se actualiza dinámicamente al escribir nuevas imágenes (paste/drag/cambio de contenido).
6. El icono no interfiere con la edición normal del texto.
7. El widget desaparece si la línea de imagen es eliminada.

## 🧩 Análisis técnico

### Contexto
EasyMDE utiliza CodeMirror internamente. Las imágenes se representan como texto plano en líneas individuales:
```
![Captura.png](./Captura.png)
<video src="./video.mp4" controls></video>
```

CodeMirror expone `addLineWidget(line, node, options)` que permite insertar elementos DOM **después** de una línea específica del editor. Esto es ideal porque:
- El widget se renderiza fuera del área de texto, como un elemento flotante.
- Se actualiza automáticamente al hacer scroll.
- Podemos estilizarlo con CSS absoluto/relativo.

### Alternativas descartadas
- **Overlay sobre CodeMirror:** Frágil, problemas de scroll y alineación.
- **Gutter markers:** Solo margen izquierdo, no al final de la línea.
- **Post-procesado del HTML preview:** No es el editor en sí.

### Solución elegida
Usar `cm.addLineWidget()` después de cada línea que contenga `![...](...)` o `<video ...>`.

---

## 📝 Plan de implementación

### Fase 1: CSS del widget flotante ✅
**Archivo:** `backend/blog/static/blog/css/blog_editor.css`
- [x] Clase `.img-line-widget` para el contenedor del widget
- [x] Posicionamiento inline-block al final de la línea
- [x] Clase `.img-line-menu-btn` para el botón icono (⋮ tres puntos verticales)
- [x] Clase `.img-line-dropdown` para el menú dropdown
- [x] Clase `.img-line-dropdown-item` para opciones del menú
- [x] Transiciones/efectos hover (opacidad 0.4 → 1 al hover, color azul primary)

### Fase 2: JS — Sistema de widgets en CodeMirror ✅
**Archivo:** `backend/blog/static/blog/js/blog_editor.js`
- [x] Función `refreshImageWidgets()` que escanea línea por línea del editor
- [x] Para cada línea con imagen/video, añade/actualiza un `LineWidget` vía `cm.addLineWidget()`
- [x] Cada widget es un botón con icono Font Awesome `fa-ellipsis-v` (⋮)
- [x] Al hacer clic en el botón, muestra/oculta un menú dropdown inline con clase `.is-open`
- [x] El menú tiene 3 opciones placeholder: "🔒 Bloquear", "⭐ Portada", "🗑️ Eliminar"
- [x] Las opciones del menú no ejecutan acciones reales (solo `console.log`)
- [x] Al cambiar el contenido (evento `change` de CodeMirror), se refrescan los widgets con debounce de 300ms
- [x] Al pegar imágenes (evento `paste`), se refrescan widgets tras 100ms

### Fase 3: Integración y pruebas ✅
- [x] Activar `refreshImageWidgets()` después de inicializar EasyMDE (setTimeout 500ms)
- [x] Activar en cada cambio del editor (`cm.on('change', ...)`)
- [x] Activar después de pegar imágenes (`cm.on('paste', ...)`)
- [x] Se reusan widgets existentes para evitar parpadeo en cambios consecutivos
- [x] Los widgets se limpian automáticamente cuando la línea de imagen es eliminada
- [x] Clic fuera del menú lo cierra automáticamente
- [x] Solo un menú puede estar abierto a la vez

---

## 🔄 Lista de tareas (checklist)

- [x] **Fase 1:** CSS del widget
  - [x] Crear estilos para `.img-line-widget`, `.img-line-menu-btn`, `.img-line-dropdown`
- [x] **Fase 2:** JS — Sistema de widgets
  - [x] Implementar `refreshImageWidgets()` con escaneo de líneas
  - [x] Implementar `createImageWidget(line, filename)` para crear el DOM del widget
  - [x] Implementar toggle del menú dropdown al hacer clic
  - [x] Implementar cierre del menú al hacer clic fuera
  - [x] Vincular al evento `change` de CodeMirror (debounce 300ms)
  - [x] Vincular al paste (100ms)
- [x] **Fase 3:** Integración
  - [x] Llamar `refreshImageWidgets()` en inicialización (setTimeout 500ms)
  - [x] Llamar `refreshImageWidgets()` al cargar artículo existente (automático vía change)
  - [x] Llamar `refreshImageWidgets()` después de upload de FilePond (automático vía change)
  - [x] Reuso de widgets existentes para evitar fugas de memoria
  - [ ] Prueba manual en navegador pendiente
- [x] **Documentación**
  - [x] Esta HU actualizada con estado completado
