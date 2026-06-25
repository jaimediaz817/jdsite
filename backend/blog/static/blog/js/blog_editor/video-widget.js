// HU-20-C: Video Widget – manejo de inserción de videos en el editor
// ======================================================
// Task Progress Checklist (internal):
// - [x] Insertar HTML del mosaico de video de YouTube con borde y botón de menú
// - [x] Implementar manejadores del dropdown (bloquear, eliminar)
// - [x] Añadir estilos CSS para .video-widget (borde, layout)
// - [x] Abrir modal al hacer clic en botón video
// - [x] Validar URL de YouTube y archivos locales
// - [x] Implementar drag-and-drop para videos

// ======================================================
// HU-022 Fase 0: Validación jQuery (solo diagnóstico)
// ======================================================
console.log('✅ [video-widget.js] jQuery disponible:', typeof jQuery !== 'undefined');

console.log('[video-widget] modulo cargado');

// ======================================================
// 1. Abrir el modal de video
// ======================================================
function openVideoModal() {
    console.log('[video-widget] openVideoModal called');
    // Limpiar campos y errores al abrir
    const urlInput = document.getElementById('videoUrlInput');
    const fileInput = document.getElementById('videoFileInput');
    const errorDiv = document.getElementById('videoModalError');
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
    if (errorDiv) {
        errorDiv.classList.add('d-none');
        errorDiv.textContent = '';
    }
    // Mostrar el modal Bootstrap 4
    $('#videoModal').modal('show');
}

// ======================================================
// 2. Parseo de URL de YouTube
// ======================================================
function parseYouTubeUrl(url) {
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;
    const match = url.trim().match(ytRegex);
    if (match && match[1]) {
        return { valid: true, videoId: match[1] };
    }
    return { valid: false, videoId: null };
}

// ======================================================
// 3. Insertar template de video en el editor (patrón unificado MTP)
// ======================================================
function insertVideoTemplate(src, isYouTube) {
    const easyMDE = window.easyMDE || window.top?.easyMDE;
    if (!easyMDE) {
        console.warn('[video-widget] EasyMDE no esta disponible');
        console.warn('[video-widget] window.easyMDE =', typeof window.easyMDE);
        console.warn('[video-widget] Document readyState =', document.readyState);
        return;
    }
    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    const cursor = doc.getCursor();

    let markdownLine = '';
    if (isYouTube) {
        const videoId = src; // src es el videoId
        // Línea markdown de referencia (NO se renderiza como widget final, solo ancla)
        markdownLine = `[youtube:${videoId}]`;
    } else {
        // Video local: línea HTML limpia (sin dropdown ni botones)
        markdownLine = `<video src="${src}" controls></video>`;
    }

    // Insertar SOLO la línea de referencia en el documento.
    // El widget MTP (borde, dropdown, etc.) lo genera refreshImageWidgets().
    doc.replaceRange(markdownLine + '\n', cursor);
    cm.focus();

    // Forzar refresco inmediato de widgets para que aparezca el widget MTP del video
    try {
        if (typeof window.refreshImageWidgets === 'function') {
            window.refreshImageWidgets();
        }
    } catch (e) {
        console.warn('[video-widget] Error al refrescar widgets:', e);
    }

    console.log('[video-widget] Video insertado (linea referencia)', { src, isYouTube });
}

// ======================================================
// 4. Confirmar inserción desde el modal
// ======================================================
function confirmVideoModal() {
    const urlInput = document.getElementById('videoUrlInput');
    const fileInput = document.getElementById('videoFileInput');
    const errorDiv = document.getElementById('videoModalError');

    // Limpiar error previo
    if (errorDiv) {
        errorDiv.classList.add('d-none');
        errorDiv.textContent = '';
    }

    // Validar: al menos uno debe tener contenido
    const urlValue = urlInput ? urlInput.value.trim() : '';
    const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

    if (!urlValue && !hasFile) {
        if (errorDiv) {
            errorDiv.textContent = 'Debes seleccionar un archivo de video o pegar una URL de YouTube.';
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    if (urlValue && hasFile) {
        if (errorDiv) {
            errorDiv.textContent = 'Solo puedes usar una opcion a la vez: archivo local O URL de YouTube.';
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    // Opción 1: Archivo local
    if (hasFile) {
        const file = fileInput.files[0];
        // Validar tipo de video permitido
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        if (!allowedTypes.includes(file.type) && !file.type.startsWith('video/')) {
            if (errorDiv) {
                errorDiv.textContent = 'Formato de video no soportado. Usa MP4, WebM, OGG o QuickTime.';
                errorDiv.classList.remove('d-none');
            }
            return;
        }
        // Construir ruta temporal
        const userId = document.body.dataset.userId || 'unknown';
        const src = `/media/blog_editor_temp/${userId}/${file.name}`;
        insertVideoTemplate(src, false);
        $('#videoModal').modal('hide');
        return;
    }

    // Opción 2: URL de YouTube
    if (urlValue) {
        const parsed = parseYouTubeUrl(urlValue);
        if (!parsed.valid) {
            if (errorDiv) {
                errorDiv.textContent = 'URL de YouTube no valida. Debe ser como: https://www.youtube.com/watch?v=...';
                errorDiv.classList.remove('d-none');
            }
            return;
        }
        insertVideoTemplate(parsed.videoId, true);
        $('#videoModal').modal('hide');
        return;
    }
}

// ======================================================
// 5. Handlers de dropdown del widget video
// ======================================================
function attachVideoWidgetHandlers() {
    // Menu button toggles dropdown (patrón unificado MTP)
    document.querySelectorAll('.video-widget-mtp .img-line-menu-btn').forEach(btn => {
        btn.removeEventListener('click', videoMenuClickHandler);
        btn.addEventListener('click', videoMenuClickHandler);
    });
    // Dropdown actions (patrón unificado MTP)
    document.querySelectorAll('.video-widget-mtp .img-line-dropdown').forEach(dropdown => {
        dropdown.querySelectorAll('.img-line-dropdown-item').forEach(item => {
            item.removeEventListener('click', videoDropdownAction);
            item.addEventListener('click', videoDropdownAction);
        });
    });
}

function videoMenuClickHandler(event) {
    event.stopPropagation();
    const btn = event.currentTarget;
    const widget = btn.closest('.video-widget-mtp');
    if (!widget) return;
    const dropdown = widget.querySelector('.img-line-dropdown');
    if (!dropdown) return;
    // Cerrar otros abiertos
    document.querySelectorAll('.img-line-dropdown.is-open').forEach(d => {
        if (d !== dropdown) d.classList.remove('is-open');
    });
    dropdown.classList.toggle('is-open');
    btn.classList.toggle('is-open');
}

function videoDropdownAction(event) {
    event.stopPropagation();
    const item = event.currentTarget;
    const action = item.dataset.action;
    const widget = item.closest('.video-widget-mtp');
    if (!widget) return;
    const videoId = widget.querySelector('[data-video-id]')?.dataset.videoId || '';
    console.log('[video-widget] Accion', action, 'sobre video', videoId);

    if (action === 'delete') {
        const cm = window.easyMDE?.codemirror;
        if (!cm) return;
        const doc = cm.getDoc();
        const content = doc.getValue();

        // Eliminar la línea de referencia markdown (no el widget, que es un linewidget)
        let newContent = content;
        if (videoId) {
            const ytRegex = new RegExp(`^\\[youtube:${videoId}\\]\\s*\\n?`, 'gm');
            newContent = newContent.replace(ytRegex, '');
        }
        // También eliminar <video src="..."> por si es local
        const videoLocalRegex = /<video src="[^"]*" controls><\/video>\s*\n?/g;
        newContent = newContent.replace(videoLocalRegex, '');

        doc.setValue(newContent);
        cm.focus();

        // Limpiar newlines sobrantes
        setTimeout(() => {
            const updated = doc.getValue().replace(/\n{3,}/g, '\n\n');
            if (updated !== doc.getValue()) doc.setValue(updated);
        }, 0);
    } else if (action === 'block') {
        widget.classList.toggle('video-blocked');
    }

    // Cerrar dropdown
    const dropdown = widget.querySelector('.img-line-dropdown');
    const menuBtn = widget.querySelector('.img-line-menu-btn');
    if (dropdown) dropdown.classList.remove('is-open');
    if (menuBtn) menuBtn.classList.remove('is-open');
}

// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', () => {
    document.querySelectorAll('.img-line-dropdown.is-open').forEach(d => d.classList.remove('is-open'));
    document.querySelectorAll('.img-line-menu-btn.is-open').forEach(b => b.classList.remove('is-open'));
});

// ======================================================
// 6. Drag & drop para archivos de video
// ======================================================
function initVideoDragDrop() {
    // El botón video en la barra MTP acepta arrastre
    const videoBtn = document.querySelector('.mtp-btn[data-mtp="video"]');
    if (!videoBtn) return;

    // Prevenir comportamiento por defecto en todo el documento para videos
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            // Solo interceptar si el archivo es un video
            const files = e.dataTransfer ? e.dataTransfer.files : null;
            if (files && files.length > 0) {
                const hasVideo = Array.from(files).some(f => f.type.startsWith('video/'));
                if (hasVideo) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }, false);
    });

    // Indicador visual al arrastrar sobre el botón
    videoBtn.addEventListener('dragenter', (e) => {
        e.preventDefault();
        videoBtn.classList.add('drag-over');
    });

    videoBtn.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoBtn.classList.add('drag-over');
    });

    videoBtn.addEventListener('dragleave', (e) => {
        e.preventDefault();
        videoBtn.classList.remove('drag-over');
    });

    videoBtn.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        videoBtn.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        // Filtrar solo videos
        const videoFiles = Array.from(files).filter(f => f.type.startsWith('video/'));
        if (videoFiles.length === 0) return;

        // Procesar cada video
        videoFiles.forEach(file => {
            const userId = document.body.dataset.userId || 'unknown';
            const src = `/media/blog_editor_temp/${userId}/${file.name}`;
            insertVideoTemplate(src, false);
        });
    });
}

// ======================================================
// 7. Mostrar modal de ayuda para video
// ======================================================
function openVideoHelpModal() {
    const titleEl = document.getElementById('mtpHelpTitle');
    const descEl = document.getElementById('mtpHelpDesc');
    const usageEl = document.getElementById('mtpHelpUsage');
    const stepsWrap = document.getElementById('mtpHelpStepsWrap');
    const screenshotWrap = document.getElementById('mtpHelpScreenshotWrap');

    if (titleEl) titleEl.textContent = 'Widget de video MTP';
    if (descEl) descEl.textContent = 'Puedes insertar videos locales (MP4, WebM) o videos de YouTube en tu articulo. Los videos locales se suben al servidor y se insertan con la etiqueta <video>. Los videos de YouTube se muestran como un mosaico interactivo con miniatura.';
    if (usageEl) usageEl.innerHTML = 
        '<strong>Insertar video local:</strong><br>' +
        '1. Haz clic en el boton Video de la barra MTP.<br>' +
        '2. Selecciona "Subir archivo de video" y elige un archivo MP4/WebM.<br>' +
        '3. Haz clic en "Insertar".<br><br>' +
        '<strong>Insertar video de YouTube:</strong><br>' +
        '1. Haz clic en el boton Video de la barra MTP.<br>' +
        '2. Pega la URL del video de YouTube en el campo correspondiente.<br>' +
        '3. Haz clic en "Insertar".<br><br>' +
        '<strong>Arrastrar y soltar:</strong><br>' +
        '- Tambien puedes arrastrar archivos de video directamente sobre el boton Video para insertarlos.<br><br>' +
        '<strong>Nota:</strong> El video NO puede ser usado como portada del articulo.';
    if (stepsWrap) stepsWrap.classList.add('d-none');
    if (screenshotWrap) screenshotWrap.classList.add('d-none');

    $('#mtpHelpModal').modal('show');
}

// ======================================================
// 8. Inicialización
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    initVideoDragDrop();

    // Vincular botón "Insertar" del modal
    const insertBtn = document.getElementById('videoInsertBtn');
    if (insertBtn) {
        insertBtn.addEventListener('click', confirmVideoModal);
    }

    // Permitir Enter en campo URL para confirmar
    const urlInput = document.getElementById('videoUrlInput');
    if (urlInput) {
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmVideoModal();
            }
        });
    }

    // Vincular botón de información (?) en la barra MTP
    const infoBtn = document.querySelector('.mtp-video-info-btn');
    if (infoBtn) {
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openVideoHelpModal();
        });
    }
});

// ======================================================
// 9. Exponer funciones globalmente
// ======================================================
window.openVideoModal = openVideoModal;
window.confirmVideoModal = confirmVideoModal;
window.insertVideoTemplate = insertVideoTemplate;
window.attachVideoWidgetHandlers = attachVideoWidgetHandlers;
window.openVideoHelpModal = openVideoHelpModal;



