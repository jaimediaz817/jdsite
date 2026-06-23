// ======================================================
// HU-20-D: Image Selector - módulo extraído
// ======================================================
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
                img.src = file.url || `/media/blog_editor_temp/${document.body.dataset.userId}/${file.filename}`;
                img.alt = file.filename;
                img.loading = 'lazy';
                
                img.onerror = function() {
                    this.src = `/static/blog/images/no-image.png`;
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
    console.log('[blog_editor][image-selector] insertImageInEditor finalizado', { filename, mode });
}

// Exponer funciones globalmente para que index.js y otros scripts puedan usarlas sin módulos ES.
window.detectImageContext = detectImageContext;
window.openImageSelectorModal = openImageSelectorModal;
window.insertImageInEditor = insertImageInEditor;