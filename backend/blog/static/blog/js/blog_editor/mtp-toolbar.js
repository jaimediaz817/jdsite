// ======================================================
// HU-20-D: MTP Toolbar - módulo extraído
// ======================================================
// NOTE: Las funciones de selector de imágenes (detectImageContext,
// openImageSelectorModal, insertImageInEditor) se encuentran en el
// módulo externo "image-selector.js" y se exponen globalmente vía
// window. Este archivo asume que dicho módulo ya está cargado antes
// de usar la acción "image" del toolbar.
console.log('[blog_editor][mtp-toolbar] modulo cargado');

const MTP_TEMPLATES = {
    'cover-image': 'image: "nombre-de-imagen.png"\n',
    'image': '![Texto alternativo](ruta-de-la-imagen.png)\n',
    'video': '<video src="nombre-del-video.mp4" controls></video>\n',
    'slides':
`:::slides
![Título de imagen 1|Descripción](imagen-1.png)
![Título de imagen 2|Descripción](imagen-2.png)
:::

`,
    'callout-info':
`:::callout:info
**Info**: Texto informativo aquí.
:::

`,
    'callout-warning':
`:::callout:warning
**Advertencia**: Texto de advertencia aquí.
:::

`,
    'callout-tip':
`:::callout:tip
**Consejo**: Texto del consejo aquí.
:::

`,
    'pullquote':
`:::pullquote
"Texto de la cita destacada aquí."
:::

`,
    'codefile':
`:::codefile:archivo.py
def ejemplo():
    print("Hola MTP")
:::

`,
    'popup-gallery':
`:::popup:gallery
![Título imagen 1|Descripción](imagen-1.png)
![Título imagen 2|Descripción](imagen-2.png)
:::

`,
    'vl-highlight':
`[vl]: highlight Texto destacado aquí.

`,
    'separator': '\n---\n\n',
};

function insertMtpTemplate(action) {
    console.log('[blog_editor][mtp-toolbar] insertMtpTemplate iniciado', { action });
    if (!easyMDE) {
        console.warn('[blog_editor][mtp-toolbar] easyMDE no disponible');
        return;
    }

    if (action === 'minimize') {
        console.log('[blog_editor][mtp-toolbar] accion minimize');
        if (window.innerWidth <= 992) return;
        const toolbar = document.getElementById('mtpToolbar');
        const toggleBtn = document.getElementById('mtpToggleBtn');
        if (!toolbar) return;
        const isMinimized = toolbar.classList.toggle('minimized');
        if (toggleBtn) {
            toggleBtn.style.display = isMinimized ? 'flex' : 'none';
        }
        try {
            localStorage.setItem('mtp_toolbar_minimized', isMinimized ? 'true' : 'false');
        } catch (e) { /* ignore */ }
        console.log('[blog_editor][mtp-toolbar] minimize finalizado', { isMinimized });
        return;
    }

    if (action === 'image') {
        console.log('[blog_editor][mtp-toolbar] accion image -> selector');
        if (typeof openImageSelectorModal === 'function') {
            openImageSelectorModal();
        }
        console.log('[blog_editor][mtp-toolbar] insertMtpTemplate finalizado', { action });
        return;
    }

    if (action === 'video') {
        console.log('[blog_editor][mtp-toolbar] accion video -> modal');
        if (typeof window.openVideoModal === 'function') {
            window.openVideoModal();
        } else {
            console.warn('[blog_editor][mtp-toolbar] openVideoModal no disponible, usando template estatico');
        }
        console.log('[blog_editor][mtp-toolbar] insertMtpTemplate finalizado', { action });
        return;
    }

    const template = MTP_TEMPLATES[action];
    if (!template) {
        console.warn(`[blog_editor][mtp-toolbar] Template desconocido: ${action}`);
        return;
    }

    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    const cursor = doc.getCursor();

    doc.replaceRange(template, cursor);

    const newCursor = { line: cursor.line, ch: cursor.ch };
    doc.setCursor(newCursor);
    cm.focus();

    const btn = document.querySelector(`.mtp-btn[data-mtp="${action}"]`);
    if (btn) {
        btn.style.transition = 'background 0s';
        btn.style.background = 'rgba(13, 110, 253, 0.20)';
        setTimeout(() => {
            btn.style.background = '';
            btn.style.transition = '';
        }, 200);
    }
    console.log('[blog_editor][mtp-toolbar] insertMtpTemplate finalizado', { action });
}

function openWidgetHelpModal(type) {
    console.log('[blog_editor][mtp-toolbar] openWidgetHelpModal iniciado', { type });
    type = type || 'image-widget';
    var title = '';
    var desc = '';
    var usage = '';
    if (type === 'image-widget') {
        title = 'Widget de imagen MTP';
        desc = 'Este widget aparece automáticamente al lado de cada línea de imagen o video en el editor. Sirve para gestionar archivos multimedia directamente desde el editor sin tener que ir al grid de archivos subidos.';
        usage = 'El menú <strong>⋮</strong> tiene estas opciones:<br><br>' +
            '• <strong>Bloquear/Desbloquear en artículo</strong> — Oculta la imagen en el artículo final sin borrarla del editor. Útil para imágenes temporales o borradores.<br>' +
            '• <strong>Marcar como portada</strong> — Define esta imagen como la imagen principal del artículo (portada).<br>' +
            '• <strong>Eliminar archivo</strong> — Borra la imagen permanentemente del servidor y del editor.<br><br>' +
            'El contorno azul y el sello <strong>MTP</strong> indican que es un widget gestionado por el sistema Mark to Post.';
    } else {
        title = 'Ayuda';
        desc = 'Contenido de ayuda para: ' + type;
        usage = 'Instrucciones próximamente.';
    }
    const titleEl = document.getElementById('mtpHelpTitle');
    const descEl = document.getElementById('mtpHelpDesc');
    const usageEl = document.getElementById('mtpHelpUsage');
    const stepsWrap = document.getElementById('mtpHelpStepsWrap');
    const screenshotWrap = document.getElementById('mtpHelpScreenshotWrap');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (usageEl) usageEl.innerHTML = usage;
    if (stepsWrap) stepsWrap.classList.add('d-none');
    if (screenshotWrap) screenshotWrap.classList.add('d-none');

    $('#mtpHelpModal').modal('show');
    console.log('[blog_editor][mtp-toolbar] openWidgetHelpModal finalizado', { type });
}

function initMtpToolbar() {
    console.log('[blog_editor][mtp-toolbar] initMtpToolbar iniciado');
    const toolbar = document.getElementById('mtpToolbar');
    if (!toolbar) {
        console.warn('[blog_editor][mtp-toolbar] #mtpToolbar no encontrado');
        return;
    }

    const migratedBtns = toolbar.querySelectorAll('.mtp-btn[data-mtp="image"], .mtp-btn[data-mtp="video"]');
    migratedBtns.forEach(function(btn) {
        btn.classList.add('mtp-migrated');
    });

    const allBtns = toolbar.querySelectorAll('.mtp-btn');
    // Respect the global production flag. In development we set window.MTP_PRODUCTION = false
    // before importing this module, so only the image and minimize buttons stay enabled.
    // In development (MTP_PRODUCTION = false) we want to disable all buttons except image and minimize.
    // In production (MTP_PRODUCTION = true) the toolbar should be fully functional.
    // Desactivar todos los botones excepto "image" y "minimize".
    // Esto garantiza que en el entorno de desarrollo solo esos dos estén activos.
    allBtns.forEach(function(btn) {
        const action = btn.dataset.mtp;
        // Mantener 'image', 'minimize' y 'video' habilitados
        if (action !== 'image' && action !== 'minimize' && action !== 'video') {
            // Añadir clase visual y atributo disabled para impedir interacción
            btn.classList.add('mtp-disabled');
            btn.setAttribute('disabled', 'disabled');
        } else {
            // Asegurarse de que los botones permitidos no tengan el atributo disabled
            btn.removeAttribute('disabled');
            btn.classList.remove('mtp-disabled');
        }
    });

    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.mtp-btn');
        if (!btn) return;
        if (btn.classList.contains('mtp-disabled')) {
            e.preventDefault();
            return;
        }
        const action = btn.dataset.mtp;
        if (action) {
            e.preventDefault();
            insertMtpTemplate(action);
        }
    });

    const toggleBtn = document.getElementById('mtpToggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const toolbarEl = document.getElementById('mtpToolbar');
            if (toolbarEl) {
                toolbarEl.classList.remove('minimized');
                toggleBtn.style.display = 'none';
                localStorage.setItem('mtp_toolbar_minimized', 'false');
            }
        });
    }

    if (window.innerWidth <= 992) {
        const toolbarEl = document.getElementById('mtpToolbar');
        const toggleBtnEl = document.getElementById('mtpToggleBtn');
        if (toolbarEl) toolbarEl.classList.remove('minimized');
        if (toggleBtnEl) toggleBtnEl.style.display = 'none';
        localStorage.setItem('mtp_toolbar_minimized', 'false');
    } else {
        try {
            const minimized = localStorage.getItem('mtp_toolbar_minimized');
            if (minimized === 'true') {
                const toolbarEl = document.getElementById('mtpToolbar');
                const toggleBtnEl = document.getElementById('mtpToggleBtn');
                if (toolbarEl) toolbarEl.classList.add('minimized');
                if (toggleBtnEl) toggleBtnEl.style.display = 'flex';
            }
        } catch (e) { /* ignore */ }
    }
    console.log('[blog_editor][mtp-toolbar] initMtpToolbar finalizado');
}

export { MTP_TEMPLATES, insertMtpTemplate, openWidgetHelpModal, initMtpToolbar };