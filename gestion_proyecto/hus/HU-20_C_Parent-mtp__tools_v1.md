# HU-20-C-Parent: Botón Help/Info para widgets MTP en el editor

## 📋 Metadatos
- **ID:** HU-20-C-Parent
- **Dependencias:** HU-20-B (widgets flotantes) — implementada, HU-20-B.5 (estilo widget) — implementada
- **Estado:** Pendiente (solo definición)
- **Prioridad:** Media
- **Tiempo estimado:** 2 fases de ~15 min cada una

---

## 🎯 Objetivo

Añadir un **botón redondo `?`** en cada widget de imagen MTP que se incrusta en el editor CodeMirror. El botón va justo al lado del botón `⋮` (menú de opciones), dentro del contenedor `.img-line-widget`. Al hacer clic (o hover en desktop), abre un modal explicativo con: qué es ese widget, para qué sirve y cómo se usa.

**Ubicación exacta del botón:**

```
En el editor, línea de imagen:
┌──────────────────────────────────────────────────────────────┐
│  ![](imagen.jpg)    [⋮] [?]   ← dentro de .img-line-widget │
└──────────────────────────────────────────────────────────────┘
                          ↑    ↑
                    menú opciones   botón ayuda (NUEVO)
```

El modal `#mtpHelpModal` es **único y reutilizable** para todos los widgets (ya existe en `blog_editor.html`).

---

## ✅ Cómo funciona

1. **El botón `?` se crea** dentro de `createImageWidget()`, al lado del `⋮`.
2. **Al hacer clic en `?`**, se abre el modal `#mtpHelpModal` con contenido explicativo del widget MTP.
3. **Desktop:** hover → modal tras 500ms. Click → inmediato.
4. **Mobile:** solo click (no hay hover).
5. **El modal ya existe** (HU-20-C-Parent fase anterior), solo se reutiliza.

---

## 🔧 Implementación

### Archivos a modificar

| Archivo           | Cambio                                                                      |
| ----------------- | --------------------------------------------------------------------------- |
| `blog_editor.js`  | Añadir botón `?` en `createImageWidget()` + función `openWidgetHelpModal()` |
| `blog_editor.css` | Estilos para el botón `?` dentro del widget                                 |

### Nada más. El modal HTML (`#mtpHelpModal`) ya está en `blog_editor.html`.

---

### Fase 1: JS — Añadir botón `?` en createImageWidget()

En `createImageWidget()`, después de crear el botón `⋮` y antes del dropdown, añadir:

```javascript
// Botón de ayuda (?)
const helpBtn = document.createElement('button');
helpBtn.type = 'button';
helpBtn.className = 'img-line-help-btn';
helpBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
helpBtn.title = '¿Cómo funciona este widget MTP?';
helpBtn.setAttribute('aria-label', 'Ayuda del widget MTP');

helpBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    openWidgetHelpModal();
});

// Hover (desktop) → abre modal tras 500ms
var hoverTimer = null;
helpBtn.addEventListener('mouseenter', function() {
    if (window.innerWidth < 768) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function() { openWidgetHelpModal(); }, 500);
});
helpBtn.addEventListener('mouseleave', function() {
    clearTimeout(hoverTimer);
});

widget.insertBefore(helpBtn, dropdown);
```

Y la función `openWidgetHelpModal()` que puebla el modal con contenido fijo sobre el widget:

```javascript
function openWidgetHelpModal() {
    document.getElementById('mtpHelpTitle').textContent = 'Widget de imagen MTP';
    document.getElementById('mtpHelpDesc').textContent = 'Este widget aparece automáticamente al lado de cada línea de imagen o video en el editor. Sirve para gestionar archivos multimedia directamente desde el editor sin tener que ir al grid de archivos subidos.';
    document.getElementById('mtpHelpUsage').innerHTML = 
        'El menú <strong>⋮</strong> tiene estas opciones:<br><br>' +
        '• <strong>Bloquear/Desbloquear en artículo</strong> — Oculta la imagen en el artículo final sin borrarla del editor. Útil para imágenes temporales o borradores.<br>' +
        '• <strong>Marcar como portada</strong> — Define esta imagen como la imagen principal del artículo (portada).<br>' +
        '• <strong>Eliminar archivo</strong> — Borra la imagen permanentemente del servidor y del editor.<br><br>' +
        'El contorno azul y el sello <strong>MTP</strong> indican que es un widget gestionado por el sistema Mark to Post.';
    
    // Ocultar pasos y screenshot (no aplican aquí)
    document.getElementById('mtpHelpStepsWrap').classList.add('d-none');
    document.getElementById('mtpHelpScreenshotWrap').classList.add('d-none');
    
    $('#mtpHelpModal').modal('show');
}
```

### Fase 2: CSS — Estilos del botón `?` en el widget

```css
/* Botón de ayuda en widget de imagen MTP */
.img-line-help-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 22px !important;
    height: 22px !important;
    padding: 0 !important;
    border: 1px solid rgba(13, 110, 253, 0.2) !important;
    border-radius: 50% !important;
    background: #fff !important;
    color: #0d6efd !important;
    cursor: pointer !important;
    opacity: 0.45 !important;
    transition: opacity 0.2s ease, transform 0.2s ease !important;
    font-size: 10px !important;
    line-height: 1 !important;
    margin-left: 4px !important;
    vertical-align: middle !important;
}
.img-line-help-btn:hover,
.img-line-help-btn:focus {
    opacity: 1 !important;
    transform: scale(1.1) !important;
    background: #e8f0fe !important;
    border-color: #0d6efd !important;
    outline: none !important;
}
.img-line-help-btn i {
    font-size: 10px !important;
    pointer-events: none !important;
}
```

---

## 🧪 Casos de prueba

- **Caso 1:** Insertar imagen en el editor → aparece el widget con `[⋮] [?]`
- **Caso 2:** Clic en `?` → modal se abre con: "Widget de imagen MTP", descripción, cómo se usa
- **Caso 3:** Hover en `?` (desktop) → modal tras 500ms
- **Caso 4:** Cerrar modal con ×, Escape, backdrop, "Entendido"
- **Caso 5:** Mobile → solo click, no hover
- **Caso 6:** El botón `?` no interfiere con el menú `⋮`
- **Caso 7:** El botón `?` no se duplica al refrescar widgets

---

## 🔒 Reglas

1. **No modificar** el modal `#mtpHelpModal` que ya existe en el HTML.
2. **No modificar** la lógica del menú `⋮` (bloquear, portada, eliminar).
3. **El botón `?` solo aparece en widgets de imagen** (no en otros elementos).
4. **Usar clases con prefijo `.img-line-help-`** para evitar colisiones CSS.
5. **No usar `data-bs-*`** ni `btn-close`.