// ======================================================
// HU-20_C_V1: Slide / Popup Gallery Widget (modal unificado)
// ======================================================

console.log('[slide-widget] modulo cargado');

let currentGalleryMode = 'slides'; // 'slides' | 'popup:gallery'
let selectedGalleryImages = []; // [{filename, title, description}]

// ======================================================
// Helpers: cookie + upload reutilizando endpoint existente
// ======================================================
function getCookie(name) {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

async function uploadFileToServer(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/blog/api/upload-file/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData,
    });
    if (!res.ok) throw new Error('Error del servidor: ' + res.status);
    return res.json();
}

// ======================================================
// Apertura del modal y preset de modo
// ======================================================
function openGalleryModal(presetMode) {
    if (!easyMDE) return;

    const mode = presetMode || 'slides';
    const ctx = (typeof detectImageContext === 'function') ? detectImageContext() : { mode: 'normal', startLine: null };
    if (ctx.mode === 'slides' || ctx.mode === 'popup:gallery') {
        currentGalleryMode = ctx.mode;
        window._galleryEditStartLine = typeof ctx.startLine === 'number' ? ctx.startLine : undefined;
    } else {
        window._galleryEditStartLine = undefined;
    }

    console.log('[openGalleryModal] mode:', mode, 'ctx.mode:', ctx.mode);
    
    updateGalleryModeUI();
    clearGalleryModalInputs();
    refreshGalleryModalGrid();
    clearGallerySelection();
    renderSelectedGalleryList();
    $('#galleryModal').modal('show');
}

function clearGallerySelection() {
    const grid = document.getElementById('gallery-existing-images');
    if (!grid) return;
    const items = grid.querySelectorAll('.selector-thumb-item.is-selected');
    items.forEach(item => item.classList.remove('is-selected'));
}

// ======================================================
// UI: actualizar textos, badges y toggles según modo
// ======================================================
function updateGalleryModeUI() {
    const mode = currentGalleryMode;

    const badge = document.getElementById('gallery-mode-badge');
    if (badge) {
        badge.textContent = mode === 'slides'
            ? '📊 Dentro de :::slides'
            : '🖼️ Dentro de :::popup:gallery';
        badge.className = mode === 'slides'
            ? 'badge bg-warning ms-2 selector-mode-badge'
            : 'badge bg-primary ms-2 selector-mode-badge';
    }

    // Toggle pills
    const pillSlides = document.getElementById('gallery-toggle-slides');
    const pillGallery = document.getElementById('gallery-toggle-gallery');
    if (pillSlides) pillSlides.classList.toggle('active', mode === 'slides');
    if (pillGallery) pillGallery.classList.toggle('active', mode === 'popup:gallery');

    const createBtn = document.getElementById('gallery-create-btn');
    if (createBtn) {
        createBtn.innerHTML = mode === 'slides'
            ? '<i class="fas fa-check me-1"></i> Crear slide'
            : '<i class="fas fa-check me-1"></i> Crear gallery';
    }
}

// ======================================================
// Limpiar inputs del modal
// ======================================================
function clearGalleryModalInputs() {
    const descInput = document.getElementById('gallery-default-desc');
    if (descInput) descInput.value = '';
}

// ======================================================
// Grid: renderizar miniaturas con multi-selección
// ======================================================
function refreshGalleryModalGrid() {
    const grid = document.getElementById('gallery-existing-images');
    const emptyState = document.getElementById('gallery-empty-state');
    if (!grid) return;

    grid.innerHTML = '';

    const files = (typeof uploadedFiles !== 'undefined') ? uploadedFiles : [];
    console.log('[refreshGalleryModalGrid] files:', files.length);

    if (files.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
    } else {
        if (emptyState) emptyState.classList.add('d-none');

        files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'selector-thumb-item';
            item.dataset.filename = file.filename;

            const isSel = selectedGalleryImages.some(img => img.filename === file.filename);
            if (isSel) item.classList.add('is-selected');

            const img = document.createElement('img');
            img.className = 'selector-thumb';
            const rawSrc = file.url || `/media/blog_editor_temp/${document.body.dataset.userId}/${file.filename}`;
            img.src = encodeURI(rawSrc);
            img.alt = file.filename;
            img.loading = 'lazy';
            img.onerror = function () { this.src = '/static/blog/images/no-image.png'; };

            const name = document.createElement('div');
            name.className = 'uploaded-filename';
            name.textContent = file.filename;
            name.style.fontSize = '0.65rem';
            name.style.padding = '4px';

            item.appendChild(img);
            item.appendChild(name);

            item.addEventListener('click', function () {
                const filename = file.filename;
                const idx = selectedGalleryImages.findIndex(img => img.filename === filename);
                if (idx >= 0) {
                    selectedGalleryImages.splice(idx, 1);
                    this.classList.remove('is-selected');
                } else {
                    selectedGalleryImages.push({
                        filename: filename,
                        title: '',
                        description: '',
                    });
                    this.classList.add('is-selected');
                }
                renderSelectedGalleryList();
            });

            grid.appendChild(item);
        });
    }
}

// ======================================================
// Panel dinámico: una fila de inputs por imagen seleccionada
// ======================================================
function renderSelectedGalleryList() {
    const list = document.getElementById('gallery-selected-list');
    const emptySel = document.getElementById('gallery-no-selection');
    const createBtn = document.getElementById('gallery-create-btn');
    if (!list) return;

    list.innerHTML = '';

    if (selectedGalleryImages.length === 0) {
        if (emptySel) emptySel.classList.remove('d-none');
    } else {
        if (emptySel) emptySel.classList.add('d-none');
    }

    if (createBtn) {
        createBtn.disabled = selectedGalleryImages.length === 0;
    }

    selectedGalleryImages.forEach((img, idx) => {
        const row = document.createElement('div');
        row.className = 'gallery-selected-row mb-2';

        const name = document.createElement('div');
        name.className = 'gallery-selected-filename';
        name.textContent = img.filename;

        const title = document.createElement('input');
        title.type = 'text';
        title.className = 'form-control form-control-sm mb-1';
        title.placeholder = 'Título del slide';
        title.value = img.title || '';
        title.addEventListener('input', function () {
            selectedGalleryImages[idx].title = this.value;
        });

        const desc = document.createElement('textarea');
        desc.className = 'form-control form-control-sm';
        desc.rows = '2';
        desc.placeholder = 'Descripción (accesibilidad / SEO)';
        desc.value = img.description || '';
        desc.addEventListener('input', function () {
            selectedGalleryImages[idx].description = this.value;
        });

        row.appendChild(name);
        row.appendChild(title);
        row.appendChild(desc);
        list.appendChild(row);
    });
}

// ======================================================
// Acción: Crear slide / gallery
// ======================================================
function confirmGalleryModal() {
    const mode = currentGalleryMode;

    console.log('[confirmGalleryModal] mode:', mode, 'selected:', selectedGalleryImages.length);

    if (selectedGalleryImages.length === 0) {
        alert('Selecciona al menos una imagen.');
        return;
    }

    const items = selectedGalleryImages.map(img => ({
        filename: img.filename,
        title: (img.title || '').trim() || 'Sin título',
        description: (img.description || '').trim() || 'Sin descripción',
    }));

    let block =
        mode === 'slides' ? ':::slides\n' : ':::popup:gallery\n';

    items.forEach(img => {
        const encoded = encodeURIComponent(img.filename);
        block += `![${img.title}|${img.description}](./${encoded})\n`;
    });

    block += ':::';

    insertGalleryInEditor(mode, block);
    selectedGalleryImages = [];
    window._galleryEditStartLine = undefined;
    if (document.activeElement) document.activeElement.blur();
    $('#galleryModal').modal('hide');
    setTimeout(function() {
        if (typeof easyMDE !== 'undefined' && easyMDE.codemirror) {
            easyMDE.codemirror.focus();
        }
    }, 200);
}

// ======================================================
// Inserción en el editor
// ======================================================
function insertGalleryInEditor(mode, blockText) {
    if (!easyMDE || !blockText) return;

    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    const cursor = window._imageSelectorCursor || doc.getCursor();

    if (typeof window._galleryEditStartLine === 'number') {
        const startLine = window._galleryEditStartLine;
        let endLine = startLine;
        const lineCount = doc.lineCount();
        for (let i = startLine + 1; i < lineCount; i++) {
            const lineText = doc.getLine(i);
            if (lineText && lineText.trim() === ':::') {
                endLine = i;
                break;
            }
        }
        doc.replaceRange(blockText + '\n', { line: startLine, ch: 0 }, { line: endLine, ch: doc.getLine(endLine).length });
        window._galleryEditStartLine = undefined;
    } else {
        doc.replaceRange(blockText + '\n', cursor);
    }

    if (typeof refreshImageWidgets === 'function') {
        setTimeout(function () { refreshImageWidgets(); }, 100);
    }

    cm.focus();
}

// ======================================================
// Toggle de modo (slides ⇄ gallery)
// ======================================================
function switchGalleryMode(newMode) {
    console.log('[switchGalleryMode] prev:', currentGalleryMode, 'new:', newMode);
    if (newMode !== 'slides' && newMode !== 'popup:gallery') return;
    currentGalleryMode = newMode;
    updateGalleryModeUI();
}

// ======================================================
// Inicialización
// ======================================================
function initGalleryToolbar() {
    const btn = document.querySelector('.mtp-btn[data-mtp="slides"]');
    if (!btn) return;

    btn.removeEventListener('click', handleGalleryToolbarClick);
    btn.addEventListener('click', handleGalleryToolbarClick);
}

function handleGalleryToolbarClick() {
    openGalleryModal('slides');
}

// Vincular controles del modal cuando el DOM esté listo
function bindGalleryModalControls() {
    const createBtn = document.getElementById('gallery-create-btn');
    if (createBtn) {
        createBtn.removeEventListener('click', confirmGalleryModal);
        createBtn.addEventListener('click', confirmGalleryModal);
        console.log('🔧 bindGalleryModalControls: gallery-create-btn binded');
    }

    const pillSlides = document.getElementById('gallery-toggle-slides');
    const pillGallery = document.getElementById('gallery-toggle-gallery');

    console.log('🔧 bindGalleryModalControls: pillSlides=', !!pillSlides, 'pillGallery=', !!pillGallery);

    if (pillSlides) {
        pillSlides.removeEventListener('click', pillsSlidesClick);
        pillSlides.addEventListener('click', pillsSlidesClick);
    }
    if (pillGallery) {
        pillGallery.removeEventListener('click', pillsGalleryClick);
        pillGallery.addEventListener('click', pillsGalleryClick);
    }

    const uploadBtn = document.getElementById('gallery-upload-btn');
    if (uploadBtn) {
        uploadBtn.removeEventListener('click', handleGalleryUploadClick);
        uploadBtn.addEventListener('click', handleGalleryUploadClick);
    }
}

function pillsSlidesClick() {
    console.log('📊 pillsSlidesClick called');
    switchGalleryMode('slides');
}

function pillsGalleryClick() {
    console.log('🖼️ pillsGalleryClick called');
    switchGalleryMode('popup:gallery');
}

function handleGalleryUploadClick() {
    let fileInput = document.getElementById('gallery-file-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'gallery-file-input';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                uploadAndRenderGalleryFile(this.files[0]);
            }
            this.value = '';
        });
    }
    fileInput.click();
}

async function uploadAndRenderGalleryFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const uploadBtn = document.getElementById('gallery-upload-btn');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Subiendo...';
    }

    try {
        const data = await uploadFileToServer(file);
        if (typeof uploadedFiles !== 'undefined') {
            uploadedFiles.push(data);
        }
        if (typeof renderUploadedFile === 'function') {
            renderUploadedFile(data);
        }
        refreshGalleryModalGrid();

        // Auto-seleccionar la imagen recién subida
        if (!selectedGalleryImages.some(img => img.filename === data.filename)) {
            selectedGalleryImages.push({
                filename: data.filename,
                title: '',
                description: '',
            });
        }
        renderSelectedGalleryList();
    } catch (err) {
        console.error('[slide-widget] Error en upload:', err);
        alert('Error al subir imagen: ' + err.message);
    } finally {
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i> Subir imagen desde PC';
        }
    }
}

// ======================================================
// Boot
// ======================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        initGalleryToolbar();
        bindGalleryModalControls();
    });
} else {
    initGalleryToolbar();
    bindGalleryModalControls();
}

// Exponer globalmente
window.openGalleryModal = openGalleryModal;
window.confirmGalleryModal = confirmGalleryModal;
window.switchGalleryMode = switchGalleryMode;
window.initGalleryToolbar = initGalleryToolbar;