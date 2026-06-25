// ======================================================
// HU-20-D: Image Selector - módulo extraído
// ======================================================

// ======================================================
// HU-022 Fase 0: Validación jQuery (solo diagnóstico)
// ======================================================
console.log('✅ [image-selector.js] jQuery disponible:', typeof jQuery !== 'undefined');

console.log('[blog_editor][image-selector] modulo cargado');

function detectImageContext() {
    console.log('[blog_editor][image-selector] detectImageContext iniciado');
    if (!easyMDE) return { mode: 'normal', startLine: null };
    
    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    const cursor = doc.getCursor();
    const currentLine = cursor.line;
    
    let mode = 'normal';
    let startLine = null;
    
    for (let i = currentLine; i >= 0; i--) {
        const lineText = doc.getLine(i) || '';
        const trimmed = lineText.trim();
        
        if (/^:::\s*slides\s*$/.test(trimmed)) {
            mode = 'slides';
            startLine = i;
            break;
        }
        if (/^:::\s*popup:gallery\s*$/.test(trimmed)) {
            mode = 'popup:gallery';
            startLine = i;
            break;
        }
        if (/^:::\s*$/.test(trimmed)) {
            break;
        }
        if (/^:::/.test(trimmed) && !/^:::\s*(slides|popup:gallery)\s*$/.test(trimmed)) {
            break;
        }
    }
    
    console.log('[blog_editor][image-selector] detectImageContext finalizado', { mode, startLine });
    return { mode, startLine };
}

function openImageSelectorModal() {
    console.log('[blog_editor][image-selector] openImageSelectorModal iniciado');
    if (!easyMDE) return;
    
    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    window._imageSelectorCursor = doc.getCursor();
    
    const modeInfo = detectImageContext();
    window.selectedImageMode = modeInfo.mode;
    
    const badge = document.getElementById('selector-mode-badge');
    const fieldsWrapper = document.getElementById('selector-fields-wrapper');
    
    if (badge) {
        if (modeInfo.mode === 'normal') {
            badge.textContent = '📝 Artículo normal';
            badge.className = 'badge bg-info ms-2 selector-mode-badge';
        } else if (modeInfo.mode === 'slides') {
            badge.textContent = '📊 Dentro de :::slides';
            badge.className = 'badge bg-warning ms-2 selector-mode-badge';
        } else if (modeInfo.mode === 'popup:gallery') {
            badge.textContent = '🖼️ Dentro de :::popup:gallery';
            badge.className = 'badge bg-primary ms-2 selector-mode-badge';
        }
    }
    
    if (fieldsWrapper) {
        if (modeInfo.mode === 'slides' || modeInfo.mode === 'popup:gallery') {
            fieldsWrapper.classList.remove('d-none');
        } else {
            fieldsWrapper.classList.add('d-none');
        }
    }
    
    const titleInput = document.getElementById('selector-title');
    const descInput = document.getElementById('selector-description');
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    
    const grid = document.getElementById('selector-existing-images');
    const emptyState = document.getElementById('selector-empty-state');
    if (grid) {
        grid.innerHTML = '';
        
        if (uploadedFiles.length === 0) {
            if (emptyState) emptyState.classList.remove('d-none');
        } else {
            if (emptyState) emptyState.classList.add('d-none');
            
            uploadedFiles.forEach(file => {
                const item = document.createElement('div');
                item.className = 'selector-thumb-item';
                item.dataset.filename = file.filename;
                
                const img = document.createElement('img');
                img.className = 'selector-thumb';
                const imgSrc = file.url || `/media/blog_editor_temp/${document.body.dataset.userId}/${file.filename}`;
                img.src = encodeURI(imgSrc);
                img.alt = file.filename;
                img.loading = 'lazy';
                
                img.onerror = function() {
                    console.warn('[img-sel] Error cargando imagen existente:', imgSrc);
                    this.src = `/static/blog/images/no-image.png`;
                };
                
                img.onload = function() {
                    console.log('[img-sel] Imagen cargada OK:', imgSrc);
                };
                
                const name = document.createElement('div');
                name.className = 'uploaded-filename';
                name.textContent = file.filename;
                name.style.fontSize = '0.65rem';
                name.style.padding = '4px';
                
                item.appendChild(img);
                item.appendChild(name);
                
                item.addEventListener('click', function() {
                    grid.querySelectorAll('.selector-thumb-item').forEach(el => {
                        el.classList.remove('is-selected');
                    });
                    this.classList.add('is-selected');
                    
                    window.selectedImageFilename = file.filename;
                    const selectBtn = document.getElementById('selector-select-btn');
                    if (selectBtn) selectBtn.disabled = false;
                });
                
                grid.appendChild(item);
            });
        }
    }
    
    window.imageSelectorOpen = true;
    window.selectedImageFilename = null;
    
    $('#imageSelectorModal').modal('show');
    console.log('[blog_editor][image-selector] Modal mostrado. uploadedFiles.length:', uploadedFiles.length);
    
    if (modeInfo.mode === 'slides' || modeInfo.mode === 'popup:gallery') {
        setTimeout(() => {
            if (titleInput) titleInput.focus();
        }, 300);
    }
    console.log('[blog_editor][image-selector] openImageSelectorModal finalizado');
}

function insertImageInEditor(filename, title, description, mode) {
    console.log('[blog_editor][image-selector] insertImageInEditor iniciado', { filename, mode });
    if (!easyMDE || !filename) return;
    
    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    
    let markdown;
    if (mode === 'slides' || mode === 'popup:gallery') {
        const titleText = (title || 'Título').trim();
        const descText = (description || 'Descripción').trim();
        markdown = `![${titleText}|${descText}](./${filename})\n`;
    } else {
        markdown = `![${filename}](./${filename})\n`;
    }
    
    const cursor = window._imageSelectorCursor || doc.getCursor();
    doc.replaceRange(markdown, cursor);
    
    window.imageSelectorOpen = false;
    window.selectedImageFilename = null;
    window.selectedImageMode = null;
    window._imageSelectorCursor = null;
    
    setTimeout(refreshImageWidgets, 100);
    cm.focus();
    console.log('[blog_editor][image-selector] insertImageInEditor finalizado');
}

// ======================================================
// Handler para el botón de subida desde PC en el modal
// ======================================================
function initUploadButton() {
    console.log('[blog_editor][image-selector] initUploadButton iniciado');
    const uploadBtn = document.getElementById('selector-upload-btn');
    if (!uploadBtn) return;
    
    uploadBtn.removeEventListener('click', handleUploadClick);
    uploadBtn.addEventListener('click', handleUploadClick);
    console.log('[blog_editor][image-selector] initUploadButton finalizado');
}

function handleUploadClick() {
    console.log('[blog_editor][image-selector] click en selector-upload-btn');
    
    let fileInput = document.getElementById('selector-file-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'selector-file-input';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        console.log('[img-sel] input CREADO por primera vez');
    } else {
        console.log('[img-sel] input YA EXISTIA, reutilizando');
    }
    
    // Remover event listeners previos para evitar duplicados
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    newFileInput.addEventListener('change', function() {
        console.log('[img-sel] file input CAMBIADO. Archivos:', this.files);
        if (this.files && this.files.length > 0) {
            const file = this.files[0];
            console.log('[img-sel] Upload archivo:', file.name, 'tipo:', file.type);
            try {
                console.log('[img-sel] Antes de llamar uploadFileToSelectorServer');
                uploadFileToSelectorServer(file);
                console.log('[img-sel] Despues de llamar uploadFileToSelectorServer');
            } catch (e) {
                console.error('[img-sel] ERROR en llamada:', e);
            }
        }
    });
    
    newFileInput.value = '';
    newFileInput.click();
}

/**
 * Añade una imagen al grid del modal selector
 * @param {Object} data - Datos del archivo subido {filename, url, type}
 */
function addImageToSelectorGrid(data) {
    console.log('[img-sel] addImageToSelectorGrid INICIO', data);
    const grid = document.getElementById('selector-existing-images');
    const emptyState = document.getElementById('selector-empty-state');
    console.log('[img-sel] grid exists:', !!grid, 'emptyState exists:', !!emptyState);
    
    if (!grid) {
        console.error('[img-sel] grid NO ENCONTRADO - abortando');
        return;
    }
    
    // Ocultar estado vacío
    if (emptyState) emptyState.classList.add('d-none');
    
    // Limpiar selección previa
    grid.querySelectorAll('.selector-thumb-item').forEach(el => {
        el.classList.remove('is-selected');
    });
    
    // Preferir la URL del backend; fallback a la ruta interna del temp folder
    const userId = document.body.dataset.userId || '0';
    const tempUrl = data.url || `/media/blog_editor_temp/${userId}/${data.filename}`;
    console.log('[img-sel] tempUrl:', tempUrl);
    
    // Crear item del grid
    const item = document.createElement('div');
    item.className = 'selector-thumb-item';
    item.dataset.filename = data.filename;
    console.log('[img-sel] item creado');
    
    // Imagen con manejo de errores mejorado
    const img = document.createElement('img');
    img.className = 'selector-thumb';
    const imgSrc = encodeURI(tempUrl);
    console.log('[img-sel] Asignando img.src:', imgSrc);
    img.src = imgSrc;
    img.alt = data.filename;
    img.loading = 'lazy';
    
    img.onerror = function() {
        console.warn('[img-sel] Error cargando imagen desde:', imgSrc, '-> reintentando ruta local:', tempUrl);
        // Intentar rutas alternativas
        const slug = document.getElementById('edit-slug')?.value || '';
        const alternatives = [
            `/static/blog/images/no-image.png`,
            `/static/images/no-image.png`
        ];
        
        let tried = 0;
        function tryNext() {
            if (tried >= alternatives.length) return;
            img.src = alternatives[tried];
            tried++;
        }
        
        img.onerror = tryNext;
        tryNext();
    };
    
    img.onload = function() {
        console.log('[img-sel] Imagen cargada exitosamente en el grid');
    };
    
    // Nombre del archivo
    const name = document.createElement('div');
    name.className = 'uploaded-filename';
    name.textContent = data.filename;
    name.style.fontSize = '0.65rem';
    name.style.padding = '4px';
    
    item.appendChild(img);
    item.appendChild(name);
    console.log('[img-sel] item completo, añadiendo al grid...');
    
    // Click handler
    item.addEventListener('click', function() {
        grid.querySelectorAll('.selector-thumb-item').forEach(el => {
            el.classList.remove('is-selected');
        });
        this.classList.add('is-selected');
        
        window.selectedImageFilename = data.filename;
        const selectBtn = document.getElementById('selector-select-btn');
        if (selectBtn) selectBtn.disabled = false;
    });
    
    grid.appendChild(item);
    console.log('[img-sel] item APLICADO al grid. Hijos totales:', grid.children.length);
    console.log('[img-sel] Grid HTML:', grid.innerHTML.substring(0, 200));
    
    // Auto-seleccionar la imagen recién subida
    window.selectedImageFilename = data.filename;
    const selectBtn = document.getElementById('selector-select-btn');
    if (selectBtn) selectBtn.disabled = false;
    
    // Scroll al nuevo item
    setTimeout(() => {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    return item;
}

async function uploadFileToSelectorServer(file) {
    console.log('[blog_editor][image-selector] uploadFileToSelectorServer iniciado', file.name);
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadBtn = document.getElementById('selector-upload-btn');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Subiendo...';
    }
    
    try {
        console.log('[img-sel] Enviando fetch a /blog/api/upload-file/');
        const response = await fetch('/blog/api/upload-file/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        });
        
        console.log('[img-sel] Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[img-sel] Archivo subido exitosamente:', data);
        
        // Actualizar array global
        uploadedFiles.push(data);
        
        // Solo renderizar en el grid del modal si está abierto
        console.log('[img-sel] window.imageSelectorOpen:', window.imageSelectorOpen);
        if (window.imageSelectorOpen) {
            console.log('[img-sel] Llamando a addImageToSelectorGrid...');
            setTimeout(() => addImageToSelectorGrid(data), 300);
        } else {
            // Si el modal no está abierto, renderizar solo en el grid principal
            console.log('[img-sel] Modal NO abierto, renderizando en grid principal');
            renderUploadedFile(data);
        }
        
    } catch (error) {
        console.error('[blog_editor][image-selector] Error en upload:', error);
        alert('Error al subir imagen: ' + error.message);
    } finally {
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i> Subir imagen desde PC';
        }
        
        const fileInput = document.getElementById('selector-file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

// ======================================================
// Registrar click handler del botón "Seleccionar" del modal
// ======================================================
function initImageSelector() {
    console.log('[blog_editor][image-selector] initImageSelector iniciado');
    const selectBtn = document.getElementById('selector-select-btn');
    if (selectBtn) {
        selectBtn.removeEventListener('click', handleSelectClick);
        selectBtn.addEventListener('click', handleSelectClick);
    }
    console.log('[blog_editor][image-selector] initImageSelector finalizado');
}

function handleSelectClick() {
    console.log('[blog_editor][image-selector] click en selector-select-btn');
    const filename = window.selectedImageFilename;
    if (!filename) return;

    const title = document.getElementById('selector-title')?.value || '';
    const description = document.getElementById('selector-description')?.value || '';
    const mode = window.selectedImageMode || 'normal';

    // Asegurar que la imagen esté en uploadedFiles y tener el objeto listo
    let fileData = uploadedFiles.find(f => f.filename === filename);
    if (!fileData) {
        fileData = {
            filename: filename,
            url: `/media/blog_editor_temp/${document.body.dataset.userId || '0'}/${filename}`,
            type: 'image'
        };
        uploadedFiles.push(fileData);
        console.log('[img-sel] Imagen agregada a uploadedFiles para el grid principal');
    }

    // Insertar markdown en el editor
    insertImageInEditor(filename, title, description, mode);
    
    // Refrescar el grid principal: miniatura + widgets MTP
    console.log('[img-sel] Refrescando grid principal de imágenes...');
    setTimeout(() => {
        renderUploadedFile(fileData);
        refreshImageWidgets();
        console.log('[img-sel] Grid principal actualizado');
    }, 250);
    
    $('#imageSelectorModal').modal('hide');
}

// ======================================================
// Inicializar cuando el DOM esté listo
// ======================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initImageSelector();
        initUploadButton();
    });
} else {
    initImageSelector();
    initUploadButton();
}

// Exponer funciones globalmente
window.detectImageContext = detectImageContext;
window.openImageSelectorModal = openImageSelectorModal;
window.insertImageInEditor = insertImageInEditor;
window.initImageSelector = initImageSelector;
window.initUploadButton = initUploadButton;

window.refreshImageWidgets = refreshImageWidgets;
window.renderUploadedFile = renderUploadedFile;
