# 📋 HU-016: Fragmentos Destacados y Anotaciones en Blog Detail

> **ID:** HU-016
> **Fecha:** 02/06/2026
> **Responsable:** Cline
> **Estado:** 🔵 Pendiente
> **Tiempo estimado total:** 4 fases (~15-20 min cada una)
> **Dependencias:** HU-001 (sistema blogs), HU-005.3 (comentarios), HU-010 (modo lectura)

---

## 🚨 INSTRUCCIONES DE DESARROLLO (LEER ANTES DE EMPEZAR)

> ⚠️ **REGLAS DE ORO PARA IMPLEMENTAR ESTA HU:**

### 🟢 1. Una Fase a la Vez
- Esta HU tiene **4 fases** de aproximadamente **15-20 minutos cada una**
- **NUNCA** implementes más de una fase en una sola sesión
- Cada fase es **independiente** y se puede probar por separado
- Al terminar cada fase: ✅ probar, ✅ confirmar con el usuario, ✅ pasar a la siguiente

### 🟢 2. Sin Dependencias Nuevas Sin Aprobación
- Todo usa funcionalidad nativa del navegador + Django
- No se requiere `pip install` ni `npm install`
- Si durante el desarrollo se necesita algo adicional, **preguntar primero**

### 🟢 3. Nunca Romper lo Existente
- Todo lo que funciona hoy debe seguir funcionando mañana
- Cualquier modificación debe ser **aditiva**
- **NUNCA** borrar código existente, solo comentar si es estrictamente necesario

### 🟢 4. Persistencia Local (sin backend)
- Los highlights viven en `localStorage` del navegador
- No requieren login, no requieren base de datos
- Cada usuario ve SUS propios highlights
- Los highlights se comparten entre visitas al mismo artículo

---

## 🎯 OBJETIVO

Permitir al lector **marcar fragmentos importantes** del contenido del blog y **navegar rápidamente** entre ellos mediante un segundo header de atajos.

### Capacidades:
1. **Seleccionar texto** → aparece tooltip para destacarlo
2. **Highlight visual** → el fragmento se resalta con fondo amarillo suave
3. **Barra de atajos** → segundo header flotante con lista de fragmentos destacados
4. **Scroll a fragmento** → click en atajo → scroll suave exacto al fragmento
5. **Anotaciones** → opción de agregar comentario personal al fragmento
6. **Compatibilidad con imágenes/video** → marcar cerca de medios visuales

### Valor diferencial
| Aspecto        | Impacto                                               |
| -------------- | ----------------------------------------------------- |
| UX             | ⭐⭐⭐⭐⭐ El lector personaliza su experiencia de lectura |
| Retención      | ⭐⭐⭐⭐ Vuelve a fragmentos clave fácilmente             |
| Diferenciación | ⭐⭐⭐⭐⭐ Feature único que pocos blogs tienen            |
| Sin backend    | ⭐⭐⭐⭐⭐ 0 impacto en DB, 0 migraciones                  |

---

## 📊 ESTADO ACTUAL

### ✅ Lo que YA funciona
- Blog detail con contenido renderizado (`blog_detail.html`)
- Sistema de comentarios (HU-005.3)
- Modo lectura con tabla de contenidos (HU-010)
- Tags y conceptos en el header del artículo

### 🔴 Lo que falta
1. **No hay sistema de highlights** para que el lector marque texto
2. **No hay barra de atajos** (segundo header) con fragmentos destacados
3. **No hay anotaciones** vinculadas a fragmentos específicos
4. **No hay scroll inteligente** a porciones exactas del texto
5. **No hay tooltip contextual** al seleccionar texto

---

## 🔧 FASES DE IMPLEMENTACIÓN

---

### ⚡ FASE 1: Sistema de Highlights al Seleccionar Texto + localStorage
**Tiempo estimado:** 20 min
**Archivos:** `backend/blog/static/blog/js/blog_detail.js`, `backend/blog/static/blog/css/blog_detail.css`

#### 1.1 JS: Detectar selección y mostrar tooltip

**Archivo:** `backend/blog/static/blog/js/blog_detail.js`

Agregar al final del archivo:

```javascript
// ═══════════════════════════════════════════════════════════════
// HU-016: FRAGMENTOS DESTACADOS
// ═══════════════════════════════════════════════════════════════

(function() {
    'use strict';

    const STORAGE_KEY = 'jd_highlights_' + (window.BLOG_SLUG || 'unknown');
    let highlights = [];

    // ── Cargar highlights desde localStorage ──
    function loadHighlights() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            highlights = stored ? JSON.parse(stored) : [];
        } catch(e) {
            highlights = [];
        }
        return highlights;
    }

    // ── Guardar highlights en localStorage ──
    function saveHighlights() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
        } catch(e) {
            console.warn('⚠️ HU-016: No se pudo guardar en localStorage', e);
        }
    }

    // ── Generar ID único para el fragmento ──
    function generateFragmentId(text) {
        const clean = text.trim().substring(0, 40).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const timestamp = Date.now().toString(36);
        return `jd-frag-${clean}-${timestamp}`;
    }

    // ── Crear highlight visual en el DOM ──
    function applyHighlight(fragment) {
        if (fragment.element) return; // Ya aplicado

        const text = fragment.text;
        const contentDiv = document.querySelector('.blog-content');
        if (!contentDiv) return;

        // Buscar el texto en el contenido
        const walker = document.createTreeWalker(contentDiv, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            const idx = node.textContent.indexOf(text);
            if (idx !== -1) {
                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + text.length);

                const span = document.createElement('span');
                span.className = 'jd-highlight';
                span.dataset.fragmentId = fragment.id;
                if (fragment.note) {
                    span.title = fragment.note;
                }

                // Si hay anotación, agregar indicador
                if (fragment.note) {
                    const noteIcon = document.createElement('span');
                    noteIcon.className = 'jd-highlight-note-icon';
                    noteIcon.innerHTML = '💬';
                    span.appendChild(noteIcon);
                }

                range.surroundContents(span);
                fragment.element = span;
                fragment.nodePath = getNodePath(span);
                break;
            }
        }
    }

    // ── Obtener ruta XPath-like para re-aplicar highlights ──
    function getNodePath(element) {
        let path = [];
        let node = element;
        while (node && node !== document.querySelector('.blog-content')) {
            let index = 0;
            let sibling = node.previousSibling;
            while (sibling) {
                if (sibling.nodeType === 1 && sibling.nodeName === node.nodeName) {
                    index++;
                }
                sibling = sibling.previousSibling;
            }
            path.unshift({
                tag: node.nodeName,
                index: index
            });
            node = node.parentNode;
        }
        return path;
    }

    // ── Renderizar todos los highlights guardados ──
    function renderHighlights() {
        // Limpiar highlights previos del DOM
        document.querySelectorAll('.jd-highlight').forEach(el => {
            const parent = el.parentNode;
            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
            parent.normalize();
        });

        loadHighlights();
        highlights.forEach(h => applyHighlight(h));
    }

    // ── Tooltip flotante al seleccionar texto ──
    function showHighlightTooltip(event) {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (!text || text.length < 10 || text.length > 500) return;

        // Mostrar tooltip
        removeTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'jd-highlight-tooltip';
        tooltip.innerHTML = `
            <button class="jd-ht-btn jd-ht-highlight" title="Destacar fragmento">
                <i class="fas fa-highlighter"></i> Destacar
            </button>
            <button class="jd-ht-btn jd-ht-note" title="Destacar con nota">
                <i class="fas fa-pen"></i> + Nota
            </button>
        `;

        const rect = selection.getRangeAt(0).getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 + 'px';
        tooltip.style.top = rect.top - 10 + 'px';
        document.body.appendChild(tooltip);

        // Posicionar centrado
        tooltip.style.transform = 'translate(-50%, -100%)';

        // Botón destacar
        tooltip.querySelector('.jd-ht-highlight').addEventListener('click', function() {
            addHighlight(text, '');
            removeTooltip();
            selection.removeAllRanges();
        });

        // Botón destacar con nota
        tooltip.querySelector('.jd-ht-note').addEventListener('click', function() {
            const note = prompt('Agrega una anotación personal (opcional):');
            if (note !== null) {
                addHighlight(text, note);
            }
            removeTooltip();
            selection.removeAllRanges();
        });
    }

    // ── Agregar un nuevo highlight ──
    function addHighlight(text, note) {
        const fragment = {
            id: generateFragmentId(text),
            text: text,
            note: note || '',
            created_at: new Date().toISOString(),
            element: null,
            nodePath: null
        };

        highlights.push(fragment);
        saveHighlights();
        applyHighlight(fragment);
        updateShortcutBar();
    }

    // ── Eliminar un highlight ──
    function removeHighlight(fragmentId) {
        // Quitar del DOM
        const el = document.querySelector(`.jd-highlight[data-fragment-id="${fragmentId}"]`);
        if (el) {
            const parent = el.parentNode;
            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
            parent.normalize();
        }

        // Quitar del array
        highlights = highlights.filter(h => h.id !== fragmentId);
        saveHighlights();
        updateShortcutBar();
    }

    // ── Tooltip al hacer clic en un highlight existente ──
    function showHighlightActions(event) {
        const highlight = event.target.closest('.jd-highlight');
        if (!highlight) return;

        // Prevenir que el tooltip de selección aparezca
        event.stopPropagation();

        const fragmentId = highlight.dataset.fragmentId;
        const fragment = highlights.find(h => h.id === fragmentId);
        if (!fragment) return;

        // Mostrar acciones
        removeTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'jd-highlight-tooltip jd-ht-actions';
        tooltip.innerHTML = `
            <div class="jd-ht-header">Fragmento destacado</div>
            <div class="jd-ht-text">${fragment.text.substring(0, 80)}${fragment.text.length > 80 ? '...' : ''}</div>
            ${fragment.note ? `<div class="jd-ht-note-text">📝 ${fragment.note}</div>` : ''}
            <button class="jd-ht-btn jd-ht-delete">
                <i class="fas fa-trash-alt"></i> Eliminar
            </button>
        `;

        const rect = highlight.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 + 'px';
        tooltip.style.top = rect.top + 'px';
        document.body.appendChild(tooltip);
        tooltip.style.transform = 'translate(-50%, -100%)';

        tooltip.querySelector('.jd-ht-delete').addEventListener('click', function() {
            removeHighlight(fragmentId);
            removeTooltip();
        });
    }

    // ── Remover tooltip ──
    function removeTooltip() {
        document.querySelectorAll('.jd-highlight-tooltip').forEach(el => el.remove());
    }

    // ── Inicializar ──
    function initHighlights() {
        loadHighlights();
        renderHighlights();
        updateShortcutBar();

        // Evento: seleccionar texto
        document.addEventListener('mouseup', showHighlightTooltip);

        // Evento: clic en highlight existente
        document.querySelector('.blog-content')?.addEventListener('click', showHighlightActions);

        // Evento: hacer clic fuera del tooltip lo cierra
        document.addEventListener('mousedown', function(e) {
            if (!e.target.closest('.jd-highlight-tooltip') && !e.target.closest('.jd-highlight')) {
                removeTooltip();
            }
        });
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHighlights);
    } else {
        initHighlights();
    }

    // Exponer funciones para la barra de atajos (Fase 2)
    window.Highlights = {
        getAll: function() { return highlights; },
        scrollTo: scrollToFragment,
        remove: removeHighlight,
        updateBar: updateShortcutBar
    };

})();
```

#### 1.2 CSS: Estilos de highlights

**Archivo:** `backend/blog/static/blog/css/blog_detail.css`

Agregar al final:

```css
/* ═══════════════════════════════════════
   HU-016: FRAGMENTOS DESTACADOS
   ═══════════════════════════════════════ */

/* ── Highlight visual ── */
.jd-highlight {
    background: linear-gradient(180deg, transparent 60%, #fef08a 60%);
    cursor: pointer;
    transition: background 0.3s ease;
    border-radius: 2px;
    padding: 0 2px;
    position: relative;
}

.jd-highlight:hover {
    background: linear-gradient(180deg, transparent 40%, #fde047 40%);
}

/* ── Highlight con nota ── */
.jd-highlight-note-icon {
    font-size: 0.7rem;
    margin-left: 2px;
    display: inline-block;
    vertical-align: super;
}

/* ── Tooltip flotante ── */
.jd-highlight-tooltip {
    position: fixed;
    z-index: 999999;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    display: flex;
    gap: 4px;
    align-items: center;
    animation: jd-ht-enter 150ms ease both;
    pointer-events: auto;
}

@keyframes jd-ht-enter {
    from {
        opacity: 0;
        transform: translate(-50%, -80%);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -100%);
    }
}

.jd-ht-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.15s ease;
    white-space: nowrap;
}

.jd-ht-highlight {
    background: #fef3c7;
    color: #92400e;
}

.jd-ht-highlight:hover {
    background: #fde68a;
}

.jd-ht-note {
    background: #ede9fe;
    color: #5b21b6;
}

.jd-ht-note:hover {
    background: #ddd6fe;
}

.jd-ht-delete {
    background: #fee2e2;
    color: #b91c1c;
}

.jd-ht-delete:hover {
    background: #fecaca;
}

/* ── Tooltip de acciones (al hacer clic en highlight) ── */
.jd-ht-actions {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 14px;
    min-width: 200px;
    max-width: 300px;
}

.jd-ht-header {
    font-family: 'Syne', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.jd-ht-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.4;
    margin-bottom: 6px;
    font-style: italic;
}

.jd-ht-note-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    color: #5b21b6;
    background: #f5f3ff;
    padding: 4px 8px;
    border-radius: 6px;
    margin-bottom: 6px;
    line-height: 1.3;
}
```

#### ✅ Criterios de aceptación Fase 1
- [ ] Al seleccionar texto >10 chars aparece toolflotante
- [ ] Al hacer clic "Destacar", el texto se resalta
- [ ] Al hacer clic "+ Nota", se pide una nota y se guarda
- [ ] Los highlights persisten al recargar la página (localStorage)
- [ ] Al hacer clic en un highlight existente, aparece menú con opción eliminar

---

### ⚡ FASE 2: Barra de Atajos (Segundo Header) + Scroll a Fragmento
**Tiempo estimado:** 20 min
**Archivos:** `backend/blog/templates/blog/blog_detail.html`, `backend/blog/static/blog/css/blog_detail.css`, `backend/blog/static/blog/js/blog_detail.js`

#### 2.1 Template: Segundo header de atajos

**Archivo:** `backend/blog/templates/blog/blog_detail.html`

Después de la barra flotante derecha (después del `</div>` del `floating-right-nav`, aproximadamente línea 156), agregar:

```html
<!-- ═══════════════════════════════════════
     HU-016: SEGUNDO HEADER - ATAJOS A FRAGMENTOS
═══════════════════════════════════════ -->
<div id="jd-shortcut-bar" class="jd-shortcut-bar" style="display:none;">
  <div class="jd-shortcut-header">
    <i class="fas fa-highlighter"></i>
    <span class="jd-shortcut-title">Fragmentos destacados</span>
    <button id="jd-shortcut-toggle" class="jd-shortcut-toggle" title="Ocultar barra">
      <i class="fas fa-chevron-up"></i>
    </button>
  </div>
  <div id="jd-shortcut-list" class="jd-shortcut-list">
    <!-- Los atajos se renderizan via JS -->
  </div>
  <div class="jd-shortcut-footer">
    <small>Selecciona texto en el artículo para destacarlo</small>
  </div>
</div>
```

#### 2.2 CSS: Estilos de la barra de atajos

**Archivo:** `backend/blog/static/blog/css/blog_detail.css`

Agregar:

```css
/* ── BARRA DE ATAJOS (SEGUNDO HEADER) ── */
.jd-shortcut-bar {
    position: fixed;
    top: 80px;
    right: 1rem;
    width: 280px;
    max-height: 60vh;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 99999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s ease;
    animation: jd-sb-enter 300ms ease both;
}

@keyframes jd-sb-enter {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.jd-shortcut-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border-bottom: 1px solid #fde68a;
    font-family: 'Syne', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: #92400e;
}

.jd-shortcut-header i {
    font-size: 0.9rem;
}

.jd-shortcut-title {
    flex: 1;
}

.jd-shortcut-toggle {
    background: none;
    border: none;
    cursor: pointer;
    color: #92400e;
    font-size: 0.8rem;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 0.15s;
}

.jd-shortcut-toggle:hover {
    background: rgba(255, 255, 255, 0.4);
}

.jd-shortcut-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

/* ── Cada atajo en la lista ── */
.jd-shortcut-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
    font-family: 'DM Sans', sans-serif;
}

.jd-shortcut-item:hover {
    background: #fffbeb;
    border-color: #fde68a;
}

.jd-shortcut-item:active {
    transform: scale(0.98);
}

.jd-shortcut-index {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #6f42c1;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 1px;
}

.jd-shortcut-text {
    flex: 1;
    font-size: 0.78rem;
    color: #374151;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.jd-shortcut-note-badge {
    font-size: 0.65rem;
    padding: 1px 6px;
    border-radius: 100px;
    background: #ede9fe;
    color: #5b21b6;
    font-weight: 600;
    flex-shrink: 0;
    align-self: center;
}

.jd-shortcut-delete {
    background: none;
    border: none;
    color: #d1d5db;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 2px 4px;
    border-radius: 4px;
    transition: all 0.15s;
    flex-shrink: 0;
}

.jd-shortcut-delete:hover {
    color: #dc2626;
    background: #fee2e2;
}

/* ── Footer de la barra ── */
.jd-shortcut-footer {
    padding: 6px 14px;
    border-top: 1px solid #f3f4f6;
    text-align: center;
}

.jd-shortcut-footer small {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.7rem;
    color: #c1c7d0;
}

/* ── Barra colapsada ── */
.jd-shortcut-bar.collapsed .jd-shortcut-list,
.jd-shortcut-bar.collapsed .jd-shortcut-footer {
    display: none;
}

.jd-shortcut-bar.collapsed .jd-shortcut-toggle i {
    transform: rotate(180deg);
}

/* ── Responsive: ocultar en móvil ── */
@media (max-width: 1024px) {
    .jd-shortcut-bar {
        display: none !important;
    }
}
```

#### 2.3 JS: Función para actualizar la barra de atajos

**Archivo:** `backend/blog/static/blog/js/blog_detail.js` (continuación del bloque HU-016)

Agregar después de la función `initHighlights`:

```javascript
// ═══════════════════════════════════════
// BARRA DE ATAJOS
// ═══════════════════════════════════════

function updateShortcutBar() {
    const bar = document.getElementById('jd-shortcut-bar');
    const list = document.getElementById('jd-shortcut-list');
    if (!bar || !list) return;

    loadHighlights();

    if (highlights.length === 0) {
        bar.style.display = 'none';
        return;
    }

    bar.style.display = 'flex';
    list.innerHTML = '';

    highlights.forEach(function(fragment, index) {
        const item = document.createElement('div');
        item.className = 'jd-shortcut-item';
        item.dataset.fragmentId = fragment.id;

        const previewText = fragment.text.substring(0, 100) + (fragment.text.length > 100 ? '...' : '');

        item.innerHTML = `
            <span class="jd-shortcut-index">${index + 1}</span>
            <span class="jd-shortcut-text">${previewText}</span>
            ${fragment.note ? '<span class="jd-shortcut-note-badge">💬</span>' : ''}
            <button class="jd-shortcut-delete" title="Eliminar fragmento">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Click en el item → scroll al fragmento
        item.addEventListener('click', function(e) {
            if (e.target.closest('.jd-shortcut-delete')) return;
            scrollToFragment(fragment.id);
        });

        // Click en eliminar
        item.querySelector('.jd-shortcut-delete').addEventListener('click', function(e) {
            e.stopPropagation();
            removeHighlight(fragment.id);
        });

        list.appendChild(item);
    });
}

// ── Scroll suave a un fragmento ──
function scrollToFragment(fragmentId) {
    const el = document.querySelector(`.jd-highlight[data-fragment-id="${fragmentId}"]`);
    if (!el) return;

    el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
    });

    // Efecto visual: flash sutil
    el.style.transition = 'background 0.5s ease';
    el.style.background = 'linear-gradient(180deg, transparent 40%, #fde047 40%)';
    setTimeout(function() {
        el.style.background = '';
    }, 1500);

    // Cerrar tooltip si está abierto
    removeTooltip();
}

// ── Toggle barra colapsada ──
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('jd-shortcut-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const bar = document.getElementById('jd-shortcut-bar');
            bar.classList.toggle('collapsed');
        });
    }
});
```

**Actualizar** la función `initHighlights` para que llame a `updateShortcutBar()` (ya debe estar al final del init).

#### ✅ Criterios de aceptación Fase 2
- [ ] La barra de atajos aparece en la derecha cuando hay highlights
- [ ] Cada atajo muestra preview del texto + índice numerado
- [ ] Click en atajo → scroll suave al fragmento exacto
- [ ] Botón eliminar en cada atajo
- [ ] Barra colapsable (toggle)
- [ ] En móvil (<1024px) la barra se oculta

---

### ⚡ FASE 3: Anotaciones en Fragmentos + Compatibilidad con Imágenes
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/static/blog/js/blog_detail.js`, `backend/blog/static/blog/css/blog_detail.css`

#### 3.1 JS: Mejorar tooltip de nota

En el tooltip, cuando se selecciona "+ Nota", actualmente usa `prompt()`. Reemplazar por un modal inline más elegante:

```javascript
// En reemplazo del prompt en showHighlightTooltip
// Botón destacar con nota - modal inline
tooltip.querySelector('.jd-ht-note').addEventListener('click', function() {
    removeTooltip();
    selection.removeAllRanges();

    // Crear modal inline para la nota
    const noteModal = document.createElement('div');
    noteModal.className = 'jd-note-modal';
    noteModal.innerHTML = `
        <div class="jd-note-modal-content">
            <div class="jd-note-modal-header">
                <i class="fas fa-pen"></i>
                <span>Agregar anotación</span>
            </div>
            <textarea class="jd-note-textarea" placeholder="¿Qué te pareció interesante de este fragmento?" rows="3" maxlength="500"></textarea>
            <div class="jd-note-modal-actions">
                <button class="jd-note-cancel">Cancelar</button>
                <button class="jd-note-save"><i class="fas fa-check"></i> Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(noteModal);

    const textarea = noteModal.querySelector('.jd-note-textarea');
    textarea.focus();

    noteModal.querySelector('.jd-note-cancel').addEventListener('click', function() {
        noteModal.remove();
    });

    noteModal.querySelector('.jd-note-save').addEventListener('click', function() {
        const note = textarea.value.trim();
        addHighlight(text, note);
        noteModal.remove();
    });
});
```

#### 3.2 CSS del modal de nota

```css
/* ── MODAL DE NOTA PARA FRAGMENTO ── */
.jd-note-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: jd-modal-fade 200ms ease;
}

@keyframes jd-modal-fade {
    from { opacity: 0; }
    to { opacity: 1; }
}

.jd-note-modal-content {
    background: #fff;
    border-radius: 16px;
    padding: 1.5rem;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
    animation: jd-modal-scale 200ms ease;
}

@keyframes jd-modal-scale {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.jd-note-modal-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
}

.jd-note-modal-header i {
    color: #6f42c1;
}

.jd-note-textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    padding: 10px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    color: #374151;
    resize: none;
    outline: none;
    transition: border-color 0.2s;
}

.jd-note-textarea:focus {
    border-color: #c4a8f5;
}

.jd-note-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 1rem;
}

.jd-note-cancel {
    padding: 8px 16px;
    border-radius: 100px;
    border: 1.5px solid #e5e7eb;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    color: #6b7280;
    cursor: pointer;
    transition: background 0.15s;
}

.jd-note-cancel:hover {
    background: #f3f4f6;
}

.jd-note-save {
    padding: 8px 16px;
    border-radius: 100px;
    border: none;
    background: linear-gradient(135deg, #6f42c1, #e84a5f);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;
}

.jd-note-save:hover {
    opacity: 0.9;
}
```

#### 3.3 Compatibilidad con imágenes

El sistema de highlights ya funciona con cualquier texto en `.blog-content`. Para imágenes, el tooltip de selección debería también activarse al seleccionar un caption o texto cercano a una imagen. El sistema actual ya lo hace porque el `mouseup` se dispara sobre `.blog-content`.

Para videos/captions de slides, el highlight funciona igual porque el caption está en texto plano dentro del DOM.

#### ✅ Criterios de aceptación Fase 3
- [ ] Modal de anotación elegante reemplaza al `prompt()`
- [ ] Las anotaciones se guardan con el highlight en localStorage
- [ ] Las anotaciones se muestran en el tooltip de acciones y en la barra de atajos
- [ ] El modal de nota es responsive
- [ ] Se puede cancelar la anotación sin efectos secundarios

---

### ⚡ FASE 4: Estilos + Modo Lectura + Responsive + Pulido
**Tiempo estimado:** 15 min
**Archivos:** `backend/blog/static/blog/css/blog_detail.css`, `backend/blog/static/blog/js/blog_detail.js`

#### 4.1 Estilos para modo lectura oscuro y sepia

**Archivo:** `backend/blog/static/blog/css/blog_detail.css`

Agregar al final de las secciones de modo lectura existentes:

```css
/* ── HU-016: Modo lectura oscuro ── */
html[data-reading-mode="dark"] .jd-highlight {
    background: linear-gradient(180deg, transparent 60%, #854d0e 60%);
}

html[data-reading-mode="dark"] .jd-highlight:hover {
    background: linear-gradient(180deg, transparent 40%, #a16207 40%);
}

html[data-reading-mode="dark"] .jd-shortcut-bar {
    background: #1e293b;
    border-color: #334155;
}

html[data-reading-mode="dark"] .jd-shortcut-header {
    background: linear-gradient(135deg, #451a03, #78350f);
    border-color: #78350f;
    color: #fde68a;
}

html[data-reading-mode="dark"] .jd-shortcut-toggle {
    color: #fde68a;
}

html[data-reading-mode="dark"] .jd-shortcut-item:hover {
    background: #334155;
    border-color: #475569;
}

html[data-reading-mode="dark"] .jd-shortcut-text {
    color: #e2e8f0;
}

html[data-reading-mode="dark"] .jd-shortcut-footer small {
    color: #64748b;
}

html[data-reading-mode="dark"] .jd-note-modal-content {
    background: #1e293b;
    border: 1px solid #334155;
}

html[data-reading-mode="dark"] .jd-note-modal-header {
    color: #e2e8f0;
}

html[data-reading-mode="dark"] .jd-note-textarea {
    background: #0f172a;
    border-color: #334155;
    color: #e2e8f0;
}

html[data-reading-mode="dark"] .jd-highlight-tooltip {
    background: #1e293b;
    border-color: #334155;
}

html[data-reading-mode="dark"] .jd-ht-header {
    color: #e2e8f0;
}

html[data-reading-mode="dark"] .jd-ht-text {
    color: #94a3b8;
}

/* ── HU-016: Modo lectura sepia ── */
html[data-reading-mode="sepia"] .jd-highlight {
    background: linear-gradient(180deg, transparent 60%, #e8d5a3 60%);
}

html[data-reading-mode="sepia"] .jd-highlight:hover {
    background: linear-gradient(180deg, transparent 40%, #d4c08c 40%);
}

html[data-reading-mode="sepia"] .jd-shortcut-bar {
    background: #fdf6ee;
    border-color: #e8dcc8;
}

html[data-reading-mode="sepia"] .jd-shortcut-header {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #8b5e3c;
}

html[data-reading-mode="sepia"] .jd-shortcut-item:hover {
    background: #fff8e7;
    border-color: #d4a373;
}

html[data-reading-mode="sepia"] .jd-shortcut-text {
    color: #5a3d28;
}

html[data-reading-mode="sepia"] .jd-note-modal-content {
    background: #fdf6ee;
    border-color: #e8dcc8;
}

html[data-reading-mode="sepia"] .jd-note-modal-header {
    color: #5a3d28;
}

html[data-reading-mode="sepia"] .jd-note-textarea {
    background: #fff;
    border-color: #d4a373;
}
```

#### 4.2 Limpiar highlights al reimportar contenido (edge case)

En `blog_detail.js`, al inicio de `initHighlights`, verificar si el contenido cambió:

```javascript
// Si el contenido cambió (por ejemplo, reimportación), los highlights antiguos
// podrían apuntar a texto que ya no existe. Se renderizan y los que no 
// encuentren texto simplemente se ignoran.
```

Esto ya está manejado porque `applyHighlight` busca el texto en el DOM y si no lo encuentra, simplemente no aplica el highlight (el fragmento queda huérfano en localStorage pero no rompe nada).

#### 4.3 Tooltip que no interfiera con selección de texto nativa

Asegurar que el tooltip no aparezca si el usuario está seleccionando dentro de inputs, textareas o el formulario de comentarios:

```javascript
// En showHighlightTooltip, agregar al inicio:
function showHighlightTooltip(event) {
    // No activar en inputs, textareas o el formulario de comentarios
    if (event.target.closest('input, textarea, .jd-comment-form-wrapper, .jd-inline-reply')) {
        return;
    }
    // ... resto del código
}
```

#### ✅ Criterios de aceptación Fase 4
- [ ] Highlights y barra de atajos funcionan en modo lectura oscuro
- [ ] Highlights y barra de atajos funcionan en modo lectura sepia
- [ ] Tooltip no interfiere con formularios de comentarios
- [ ] No se rompe nada existente
- [ ] Responsive: en móvil no se muestra la barra (ya manejado)

---

## 📋 RESUMEN DE FASES

| Fase | Descripción                                    | Tiempo | Prioridad |
| ---- | ---------------------------------------------- | ------ | --------- |
| 1    | Sistema de highlights + tooltip + localStorage | 20 min | 🔴 CRÍTICA |
| 2    | Barra de atajos (segundo header) + scroll      | 20 min | 🔴 CRÍTICA |
| 3    | Anotaciones + modal elegante de notas          | 15 min | 🟡 ALTA    |
| 4    | Modo lectura + responsive + pulido             | 15 min | 🟢 MEDIA   |

**Tiempo total estimado:** ~70 minutos (4 sesiones)

---

## 🔗 RELACIÓN CON OTRAS HUs

| HU       | Relación                                                                     |
| -------- | ---------------------------------------------------------------------------- |
| HU-001   | Blog detail base donde se injectan los highlights                            |
| HU-005.3 | Sistema de comentarios. HU-016 NO interfiere con formularios                 |
| HU-010   | Modo lectura. HU-016 se adapta a oscuro/sepia                                |
| HU-015   | Mapa de conceptos. HU-016 es complementario (reader-driven vs author-driven) |

---

## 🏁 NOTAS DE DISEÑO

1. **Sin backend**: Todo vive en `localStorage`. El lector no necesita login. Esto es intencional para mantener la simplicidad.

2. **Fragmentos huérfanos**: Si el contenido cambia y un fragmento ya no existe en el DOM, simplemente no se renderiza. No causa errores.

3. **Límite de highlights**: Por ahora no hay límite, pero localStorage tiene ~5MB. Con fragmentos de ~200 chars cada uno, cabrían ~25,000 fragmentos. Prudente no preocuparse.

4. **Privacidad**: Los highlights son 100% locales. No se envían al servidor. El usuario puede borrarlos cuando quiera.

5. **URL compartible**: No hay fragmentos compartibles entre usuarios (no hay backend). Si se quisiera en el futuro, sería una HU aparte con persistencia en DB.

> 📌 **Última actualización:** 02/06/2026
> 📌 **Aplicable desde HU-016**