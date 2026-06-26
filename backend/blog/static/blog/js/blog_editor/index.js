// ======================================================
// HU-011 + HU-017: Blog Editor JavaScript
// EasyMDE + FilePond + auto-save + mejoras borradores
// ======================================================
// Task progress updated below.
/*
   TODO LIST (progress tracking)
   - [x] Verificar que la expresión regular elimina solo la imagen solicitada
   - [x] Implementar borrado completo de recursos desde el Editor (frontend + backend)
   - [x] Probar la eliminación en el navegador y validar que los contadores y markdown se actualiza
   - [ ] Documentar la nueva funcionalidad en la HU correspondiente
*/

// ======================================================
// HU-022 Fase 0: Validación jQuery (solo diagnóstico)
// ======================================================
console.log('✅ [index.js] jQuery disponible:', typeof jQuery !== 'undefined');

const uploadedFiles = [];
// Nombre del archivo que se está a punto de eliminar (usado por el modal de confirmación)
let pendingDeleteFilename = null;
let isSaved = false; // controla si el artículo ya se guardó para evitar la alerta de salida
const DRAFT_KEY = 'blog_editor_draft';
let userOverride = false;
let lastAutoSaveTime = null;
let autoSaveTimer = null;

// ======================================================
// HU-20-C-V1: Selector de imágenes existentes
// ======================================================
window.imageSelectorOpen = false;
window.selectedImageFilename = null;
window.selectedImageMode = null;

// FASE 5 HU-019: Referencia al contenedor para estado vacío (se resuelve en renderUploadedFile)
let uploadedFilesContainer = null;
// Iconos SVG inline (mejor calidad visual y accesibilidad)
// Use Font Awesome icons for clearer toggle state (eye / eye-slash)
const ICON_EYE = '<i class="fas fa-eye"></i>';
const ICON_EYE_OFF = '<i class="fas fa-eye-slash"></i>';
const ICON_TRASH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>';
const ICON_STAR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/></svg>';
const ICON_STAR_FILLED = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>';

// ======================================================
// Funciones helper: Toast profesional (transiciones CSS)
// ======================================================
function showAutoSaveToast(title, detail) {
    const toastEl = document.getElementById('autosave-toast');
    if (!toastEl) return;
    const titleEl = toastEl.querySelector('.autosave-toast-title');
    const detailEl = document.getElementById('autosave-toast-detail');
    const timeEl = document.getElementById('autosave-toast-time');
    const progressBar = document.getElementById('autosave-progress-bar');
    if (titleEl) titleEl.innerHTML = title;
    if (detailEl) detailEl.textContent = detail || '—';
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    // Reiniciar barra de progreso
    if (progressBar) {
        progressBar.style.animation = 'none';
        progressBar.offsetHeight; // Reflow
        progressBar.style.animation = '';
    }
    // Limpiar timers previos
    clearTimeout(toastEl._hideTimer);
    clearTimeout(toastEl._closeTimer);
    // Quitar estado hiding si existe
    toastEl.classList.remove('hiding');
    // Mostrar toast con transición CSS
    toastEl.classList.add('show');
    // Auto-ocultar a los 5 segundos
    toastEl._hideTimer = setTimeout(() => {
        hideAutoSaveToast(toastEl);
    }, 5000);
}

function hideAutoSaveToast(toastEl) {
    if (!toastEl) toastEl = document.getElementById('autosave-toast');
    if (!toastEl || !toastEl.classList.contains('show')) return;
    toastEl.classList.add('hiding');
    clearTimeout(toastEl._closeTimer);
    toastEl._closeTimer = setTimeout(() => {
        toastEl.classList.remove('show', 'hiding');
    }, 250);
}

// Cerrar toast manualmente con el botón ×
document.addEventListener('DOMContentLoaded', function () {
    const closeBtn = document.getElementById('autosave-toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            const toastEl = document.getElementById('autosave-toast');
            hideAutoSaveToast(toastEl);
        });
    }
});

function formatTimeAgo(date) {
    if (!date) return 'hace unos momentos';
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return 'hace menos de un minuto';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} horas`;
    return `hace ${Math.floor(diff / 86400)} días`;
}

// ======================================================
// Funciones helper: Draft indicator
// ======================================================
function updateDraftIndicator(show) {
    const indicator = document.getElementById('draft-indicator');
    if (!indicator) return;
    if (show) {
        indicator.classList.remove('d-none');
    } else {
        indicator.classList.add('d-none');
    }
}

function updateStatusBadge(state) {
    const badge = document.getElementById('status-badge');
    if (!badge) return;
    // states: 'new', 'draft_local', 'pending', 'published'
    const config = {
        'new': { text: '🔵 Nuevo artículo', class: 'Artikel-badge-new' },
        'draft_local': { text: '🔵 Borrador local', class: 'Artikel-badge-local' },
        'pending': { text: '🟡 Pendiente de aprobación', class: 'Artikel-badge-pending' },
        'published': { text: '🟢 Publicado', class: 'Artikel-badge-published' },
    };
    const c = config[state] || config['new'];
    badge.textContent = c.text;
    badge.className = 'badge ' + c.class;
}

function getWordCount(text) {
    const cleanText = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/\[[^\]]*\]\([^)]+\)/g, (m) => m.split(']')[0].slice(1))
        .replace(/[#*_~>`-]/g, '')
        .replace(/:::.*?:::/gs, '');
    return cleanText.trim().split(/\s+/).filter(w => w).length;
}

function getDraftAge() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data._timestamp || null;
    } catch (e) {
        return null;
    }
}

// =================================================
// F Unctions de archivos (render, cover, toggle, remove)
// ======================================================

/**
 * Renderiza una vista previa de un archivo subido (imagen o video).
 * Si el archivo es una imagen y tiene ``is_cover: true`` se marca como portada.
 * @param {{filename:string, type:string, hidden?:boolean, is_cover?:boolean}} file
 */
function renderUploadedFile(file) {
    console.log('Renderizando archivo subido:', file);
    if (!file || !file.filename) return;
    const container = uploadedFilesContainer || document.getElementById('uploaded-files');
    if (!container) {
        console.warn('[renderUploadedFile] Contenedor uploaded-files no encontrado');
        return;
    }
    uploadedFilesContainer = container;

    // FASE 5 HU-019: Ocultar estado vacío si existe
    const emptyState = container.querySelector('.uploaded-files-empty');
    if (emptyState) emptyState.remove();
    // Intentamos cargar la imagen/video desde la ruta temporal (media) y, si falla, desde la ruta definitiva en static/blogs/<slug>/
    const tempUrl = file.url || `/media/blog_editor_temp/${document.body.dataset.userId}/${file.filename}`;
    let element;
    if (file.type && file.type.startsWith('video')) {
        element = document.createElement('video');
        element.setAttribute('src', tempUrl);
        element.setAttribute('controls', '');
        element.className = 'uploaded-video';
    } else {
        element = document.createElement('img');
        element.setAttribute('src', tempUrl);
        element.setAttribute('alt', file.filename);
        element.className = 'uploaded-image';
    }
    // Fallback: si la carga falla (por ejemplo, el archivo ya fue movido a la carpeta definitiva), intentamos la ruta estática basada en el slug del artículo.
    element.onerror = function () {
        // Evitamos bucles infinitos marcando que ya intentamos el fallback.
        if (this.dataset.tried) return;
        this.dataset.tried = '1';
        // 1️⃣ Intentar ruta genérica bajo /static/blogs/ (por si el archivo está allí sin slug)
        const genericFallback = `/static/blogs/${file.filename}`;
        this.setAttribute('src', genericFallback);
        // 2️⃣ Si falla, intentar con slug bajo /static/blogs/
        this.onerror = function () {
            if (this.dataset.triedSlug) return;
            this.dataset.triedSlug = '1';
            const slug = document.getElementById('edit-slug').value || '';
            if (slug) {
                const slugFallback = `/static/blogs/${slug}/${file.filename}`;
                this.setAttribute('src', slugFallback);
            }
        };
        // 3️⃣ Si aún falla, intentar la ruta de media donde se guardan los blogs fuente
        this.onerror = function () {
            if (this.dataset.triedMedia) return;
            this.dataset.triedMedia = '1';
            const slug = document.getElementById('edit-slug').value || '';
            if (slug) {
                const mediaFallback = `/static/blogs_source/${slug}/${file.filename}`;
                this.setAttribute('src', mediaFallback);
            }
        };
    };
    const wrapper = document.createElement('div');
    wrapper.className = 'uploaded-item';
    // Estado de visibilidad: si está oculto (envuelto en no-import) usamos .is-hidden, de lo contrario .is-visible
    if (file.hidden) {
        wrapper.classList.add('is-hidden');
    } else {
        wrapper.classList.add('is-visible');
    }
    if (file.is_cover) wrapper.classList.add('is-cover');
    if (file.type && file.type.startsWith('video')) wrapper.classList.add('is-video');
    wrapper.dataset.filename = file.filename;
    wrapper.dataset.cover = file.is_cover ? 'true' : 'false';

    // Controles flotantes (overlay)
    const controls = document.createElement('div');
    controls.className = 'uploaded-controls';

    // Botón marcar como portada (solo imágenes)
    if (file.type === 'image') {
        const coverBtn = document.createElement('button');
        coverBtn.type = 'button';
        coverBtn.className = 'btn-control btn-cover';
        if (file.is_cover) coverBtn.classList.add('is-active');
        coverBtn.setAttribute('data-tooltip', file.is_cover ? 'Es la portada' : 'Usar como portada');
        coverBtn.setAttribute('aria-label', file.is_cover ? 'Es la portada del artículo' : 'Marcar como portada');
        coverBtn.innerHTML = file.is_cover ? ICON_STAR_FILLED : ICON_STAR;
        coverBtn.onclick = () => setAsCover(file.filename);
        controls.appendChild(coverBtn);
    }

    // Botón vista previa (solo imágenes)
    if (file.type !== 'video') {
        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'btn-control btn-preview';
        previewBtn.setAttribute('data-tooltip', 'Vista previa');
        previewBtn.setAttribute('aria-label', 'Ver vista previa');
        previewBtn.innerHTML = ICON_EYE;
        previewBtn.onclick = () => showImagePreview(file.filename, tempUrl);
        controls.appendChild(previewBtn);
    }

    // Botón toggle (ver/ocultar) — para ocultar en el markdown
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn-control btn-toggle';
    toggleBtn.setAttribute('data-tooltip', file.hidden ? 'Mostrar en editor' : 'Ocultar en editor');
    toggleBtn.setAttribute('aria-label', file.hidden ? 'Mostrar archivo en editor' : 'Ocultar archivo en editor');
    // Use eye icons: eye when visible, eye-off when hidden
    toggleBtn.innerHTML = file.hidden ? ICON_EYE_OFF : ICON_EYE;
    toggleBtn.onclick = () => toggleUploadedFile(file.filename);
    toggleBtn.style.fontSize = '0.8rem';

    // Botón eliminar
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-control btn-remove';
    removeBtn.setAttribute('data-tooltip', 'Eliminar');
    removeBtn.setAttribute('aria-label', 'Eliminar archivo');
    removeBtn.innerHTML = ICON_TRASH;
    // Open confirmation modal before actual deletion
    removeBtn.onclick = () => confirmDeleteFile(file.filename);

    controls.appendChild(toggleBtn);
    controls.appendChild(removeBtn);

    wrapper.appendChild(controls);

    // FASE 3 HU-019: Icono de tipo de archivo overlay
    const typeIcon = document.createElement('span');
    typeIcon.className = 'file-type-icon';
    if (file.type === 'video') {
        typeIcon.innerHTML = '<i class="fas fa-file-video"></i>';
    } else {
        typeIcon.innerHTML = '<i class="fas fa-file-image"></i>';
    }
    wrapper.appendChild(typeIcon);

    // Badge "PORTADA"
    if (file.is_cover) {
        const badge = document.createElement('span');
        badge.className = 'cover-badge';
        badge.innerHTML = '\u2605 PORTADA';
        wrapper.appendChild(badge);
    }

    wrapper.appendChild(element);

    // Nombre del archivo debajo
    const fileName = document.createElement('div');
    fileName.className = 'uploaded-filename text-muted small text-center mt-1';
    fileName.textContent = file.filename;
    fileName.style.fontSize = '0.75rem';
    fileName.style.overflow = 'hidden';
    fileName.style.textOverflow = 'ellipsis';
    fileName.style.whiteSpace = 'nowrap';
    fileName.style.maxWidth = '100%';
    wrapper.appendChild(fileName);

    // FASE 1 HU-019: Limitar ancho del wrapper para evitar desbordamiento
    wrapper.style.maxWidth = '220px';
    wrapper.style.minWidth = '140px';
    wrapper.style.flexShrink = '0';

    // Si el archivo está oculto, añadir badge visual de bloqueo
    if (file.hidden) {
        const blockedBadge = document.createElement('span');
        blockedBadge.className = 'blocked-badge';
        blockedBadge.textContent = 'BLOQUEADO';
        wrapper.appendChild(blockedBadge);
    }

    container.appendChild(wrapper);
}

// FASE 5 HU-019: Mostrar estado vacío del contenedor
function showUploadedFilesEmpty() {
    const container = uploadedFilesContainer;
    if (!container) return;
    if (container.querySelector('.uploaded-files-empty')) return;

    const empty = document.createElement('div');
    empty.className = 'uploaded-files-empty';
    empty.innerHTML = `
        <i class="fas fa-folder-open"></i>
        <p>No hay archivos subidos. Arrastra o pega imágenes/videos aquí.</p>
    `;
    container.appendChild(empty);
}

/**
 * Marca una imagen como portada. Solo una imagen puede ser portada a la vez.
 * @param {string} filename
 */
function setAsCover(filename) {
    if (!filename) return;

    uploadedFiles.forEach(f => { f.is_cover = false; });
    const target = uploadedFiles.find(f => f.filename === filename);
    if (target) target.is_cover = true;

    const container = document.getElementById('uploaded-files');
    if (container) {
        const items = container.querySelectorAll('.uploaded-item');
        items.forEach(item => {
            const itemFilename = item.dataset.filename;
            const coverBtn = item.querySelector('.btn-cover');
            const isNowCover = (itemFilename === filename);

            if (isNowCover) {
                item.classList.add('is-cover');
                item.dataset.cover = 'true';
            } else {
                item.classList.remove('is-cover');
                item.dataset.cover = 'false';
            }

            if (coverBtn) {
                coverBtn.classList.toggle('is-active', isNowCover);
                coverBtn.innerHTML = isNowCover ? ICON_STAR_FILLED : ICON_STAR;
                coverBtn.setAttribute('data-tooltip', isNowCover ? 'Es la portada' : 'Usar como portada');
                coverBtn.setAttribute('aria-label', isNowCover ? 'Es la portada del artículo' : 'Marcar como portada');
            }

            const existingBadge = item.querySelector('.cover-badge');
            if (isNowCover && !existingBadge) {
                const badge = document.createElement('span');
                badge.className = 'cover-badge';
                badge.innerHTML = '\u2605 PORTADA';
                item.insertBefore(badge, item.querySelector('img, video'));
            } else if (!isNowCover && existingBadge) {
                existingBadge.remove();
            }
        });
    }

    const status = document.getElementById('status-message');
    if (status) {
        const info = document.createElement('div');
        info.className = 'alert alert-info mt-2 p-2';
        info.innerHTML = `<i class="fas fa-star text-warning"></i> <strong>${filename}</strong> marcada como portada del artículo.`;
        status.appendChild(info);
    }

    // Actualizar el campo oculto del formulario para que el backend reciba la portada
    const coverInput = document.getElementById('cover_image');
    if (coverInput) {
        coverInput.value = filename;
    }
}

/** Devuelve el nombre del archivo marcado como portada o string vacío. */
function getCoverFilename() {
    const found = uploadedFiles.find(f => f.is_cover);
    return found ? found.filename : '';
}

function removeMarkdownLineForFile(filename) {
    if (!easyMDE || !filename) return;
    const safe = filename.replace(/[.*+?^${}()[\]\\|]/g, '\\$&');
    // Acepta rutas con o sin "./" y también dentro de bloques ::slides
    const imgRegex = new RegExp(`^!\\[[^\\]]*\\]\\((\\.?\\/?)${safe}\\)\\s*\\n?`, 'gm');
    const videoRegex = new RegExp(`<video[^>]*src=["']\\.?\\/?${safe}["'][^>]*></video>\\s*\\n?`, 'g');
    let current = easyMDE.value();
    const updated = current
        .replace(imgRegex, '')
        .replace(videoRegex, '')
        .replace(/\n{3,}/g, '\n\n');
    if (updated !== current) {
        // Remove any stray end tags that might remain if the start tag was not matched
        const cleaned = updated.replace(/^\s*:::final-no-import:::\s*$/gm, '');
        easyMDE.value(cleaned);
    }
}

/* The deleteFileOnServer function is defined earlier in this file with proper handling of the
 * DELETE_FILE_URL endpoint and folder information. The older implementation that posted to
 * '/blog/api/upload-file/' has been removed to avoid conflicts. */

/** Elimina vista previa, referencia, línea markdown y archivo físico. */
async function removeUploadedFile(filename) {
    const idx = uploadedFiles.findIndex(f => f.filename === filename);
    if (idx !== -1) uploadedFiles.splice(idx, 1);
    removeMarkdownLineForFile(filename);
    const container = document.getElementById('uploaded-files');
    const item = container.querySelector(`.uploaded-item[data-filename="${filename}"]`);
    if (item) container.removeChild(item);
    await deleteFileOnServer(filename);
}

/**
 * Alterna la visibilidad del archivo multimedia en el editor y en el HTML final.
 * Al ocultar: envuelve TODAS las referencias a la imagen con :::no-import:::
 * Al mostrar: elimina las etiquetas :::no-import::: / :::final-no-import:::
 * Si la imagen es la única en un ::slides:: / ::popup:gallery::, el bloque completo se oculta.
 */
function toggleUploadedFile(filename) {
    const container = document.getElementById('uploaded-files');
    const item = container.querySelector(`.uploaded-item[data-filename="${filename}"]`);
    if (!item) return;
    const currentlyHidden = item.classList.contains('is-hidden');
    // Toggle hidden state
    const nowHidden = !currentlyHidden;
    // Apply visibility classes
    item.classList.toggle('is-hidden', nowHidden);
    if (nowHidden) {
        item.classList.remove('is-visible');
    } else {
        item.classList.add('is-visible');
    }
    const toggleBtn = item.querySelector('.btn-toggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = nowHidden ? ICON_EYE_OFF : ICON_EYE;
        toggleBtn.setAttribute('data-tooltip', nowHidden ? 'Mostrar en editor' : 'Ocultar en editor');
        toggleBtn.setAttribute('aria-label', nowHidden ? 'Mostrar archivo' : 'Ocultar archivo');
        // Añadir clase activa para reflejar visualmente el estado oculto
        toggleBtn.classList.toggle('is-active', nowHidden);
    }
    const f = uploadedFiles.find(f => f.filename === filename);
    if (f) f.hidden = nowHidden;

    // Gestionar badge de bloqueo visual
    const existingBadge = item.querySelector('.blocked-badge');
    if (nowHidden) {
        if (!existingBadge) {
            const blockedBadge = document.createElement('span');
            blockedBadge.className = 'blocked-badge';
            blockedBadge.textContent = 'BLOQUEADO';
            item.appendChild(blockedBadge);
        }
    } else {
        if (existingBadge) existingBadge.remove();
    }

    if (!easyMDE) return;

    // Escapar nombre de archivo para regex
    const safe = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let current = easyMDE.value();

    // Use the actual hidden state (nowHidden) to decide the operation
    if (nowHidden) {
        // ============================================================
        // OCULTAR: Envolver todas las referencias a la imagen en :::no-import:::
        // ============================================================
        
        // Paso 1: Eliminar cualquier envoltura no-import existente para esta imagen
        // (para evitar anidamiento si ya estaba bloqueada)
        const cleanRegex = new RegExp(
            '\\s*:::no-import:::\\s*\\n([\\s\\S]*?' + safe + '[\\s\\S]*?)\\n\\s*:::final-no-import:::\\s*',
            'gm'
        );
        let cleaned = current.replace(cleanRegex, '$1');
        
        // Paso 2: Buscar todas las líneas de la imagen (ya sin etiquetas)
        const imgLineRegex = new RegExp(
            '(^[ \\t]*!\\[[^\\]]*\\]\\((?:\\/?|\\.\\/?)' + safe + '\\)[^\\n]*\\n?)' +
            '|(<video[^>]*src=[\'"]\\.?\\/?' + safe + '[\'"][^>]*><\\/video>\\n?)',
            'gm'
        );
        let match;
        let result = cleaned;
        const matches = [];
        while ((match = imgLineRegex.exec(cleaned)) !== null) {
            // Evitar duplicados: si el match está dentro de una envoltura ya procesada, lo saltamos
            const alreadyWrapped = matches.some(m => 
                m.index <= match.index && m.index + m.length >= match.index + match[0].length
            );
            if (!alreadyWrapped) {
                matches.push({ index: match.index, length: match[0].length });
            }
        }
        // Procesar de atrás hacia adelante para no romper índices
        for (let i = matches.length; i--;) {
            const m = matches[i];
            const before = result.substring(0, m.index);
            const line = result.substring(m.index, m.index + m.length);
            const after = result.substring(m.index + m.length);

            // Analizar contexto: ¿está dentro de un bloque ::slides:: o ::popup:gallery::?
            const textBefore = before;
            const slidesMatch = textBefore.match(/:::\s*(slides|popup:gallery)\s*\n(.*?)$/s);
            if (slidesMatch) {
                const blockContent = slidesMatch[2] || '';
                // Contar cuántas imágenes hay en el bloque
                const imgCount = (blockContent.match(/!\[.*?\]\(.*?\)/g) || []).length;
                const isOnlyImage = imgCount <= 1;
                if (isOnlyImage) {
                    // El bloque completo se envuelve
                    const blockRegex = /(:::slides\s*\n[\s\S]*?\n:::)|(:::popup:gallery\s*\n[\s\S]*?\n:::)/g;
                    result = result.replace(blockRegex, (fullBlock) => {
                        if (fullBlock.includes(filename)) {
                            return ':::no-import:::\n' + fullBlock + '\n:::final-no-import:::';
                        }
                        return fullBlock;
                    });
                    continue;
                }
            }

            // Envoltura simple de la línea individual
            const trimmedLine = line.replace(/\n$/, '');
            const wrapped = ':::no-import:::\n' + trimmedLine + '\n:::final-no-import:::';
            // Preservar el newline original después de la línea
            const trailingNewline = line.endsWith('\n') ? '\n' : '';
            result = before + wrapped + trailingNewline + after;
        }

        easyMDE.value(result);

    } else {
        // ============================================================
        // MOSTRAR: Eliminar TODAS las envolturas :::no-import::: que contengan este filename
        // ============================================================
        current = easyMDE.value();
        
        // Eliminar bloques no-import que contengan el filename (individuales o de slides completos)
        // Procesamos cada match individualmente para evitar interferencias entre reemplazos
        const noImportBlockRegex = /:::no-import:::\s*\n([\s\S]*?):::final-no-import:::/gm;
        let resultParts = [];
        let lastIdx = 0;
        let match;
        while ((match = noImportBlockRegex.exec(current)) !== null) {
            // Agregar texto antes de este bloque
            resultParts.push(current.substring(lastIdx, match.index));
            if (match[1].includes(filename)) {
                // Este bloque contiene el archivo → devolver solo el contenido (desbloquear)
                resultParts.push(match[1]);
            } else {
                // Este bloque NO contiene el archivo → mantenerlo intacto
                resultParts.push(match[0]);
            }
            lastIdx = match.index + match[0].length;
        }
        // Agregar el resto del texto después del último match
        resultParts.push(current.substring(lastIdx));
        let updated = resultParts.join('');
        
        // Paso 2: Limpiar etiquetas huérfanas solo si hay desbalance (cierres sin apertura o viceversa)
        const openCount = (updated.match(/:::no-import:::/g) || []).length;
        const closeCount = (updated.match(/:::final-no-import:::/g) || []).length;
        if (openCount !== closeCount) {
            updated = updated.replace(/^\s*:::final-no-import:::\s*$/gm, '');
            updated = updated.replace(/^\s*:::no-import:::\s*$/gm, '');
        }
        
        // Paso 3: Limpiar múltiples newlines seguidos
        updated = updated.replace(/\n{3,}/g, '\n\n');

        easyMDE.value(updated);
    }
}

// ======================================================
// Función: Vista previa de imagen en modal
// ======================================================
function showImagePreview(filename, url) {
    const modal = document.getElementById('imagePreviewModal');
    if (!modal) return;
    const img = document.getElementById('preview-modal-img');
    const nameEl = document.getElementById('preview-modal-filename');
    if (img) {
        img.src = url || '';
        img.alt = filename || 'Vista previa';
    }
    if (nameEl) nameEl.textContent = filename || '—';
    // Mostrar modal Bootstrap 4 con jQuery
    $('#imagePreviewModal').modal('show');
}

// ======================================================
// 1. Inicializar EasyMDE
// ======================================================
const easyMDE = new EasyMDE({
    element: document.getElementById('editor'),
    spellChecker: false,
    autoDownloadFontAwesome: false,
    toolbar: [
        'bold', 'italic', 'heading', '|',
        'quote', 'unordered-list', 'ordered-list', '|',
        'link', 'image', 'table', '|',
        'preview', 'side-by-side', 'fullscreen', '|', 'guide'
    ],
    previewRender: (plainText) => {
        const html = marked.parse(plainText);
        return DOMPurify.sanitize(html);
    },
    placeholder: '# Escribe tu artículo aquí...\n\nPega imágenes y videos con Ctrl+V o arrástralos.'
});

window.easyMDE = easyMDE;
window.refreshImageWidgets = refreshImageWidgets;
window.renderUploadedFile = renderUploadedFile;

// ======================================================
// 1b. Asegurar que cada imagen/video insertado (paste/drag) quede en su propia línea
// ======================================================
const cm = easyMDE.codemirror;

cm.on('paste', (cmInstance, event) => {
    const text = event.clipboardData.getData('text/plain') || '';
    if (!text) return;
    const lines = text.split('\n');
    let modified = false;
    const newLines = lines.map(line => {
        const trimmed = line.trim();
        const isImage = /^!\[.*?\]\(.*?\)$/.test(trimmed);
        const isVideo = /^<video[^>]*src=.*><\/video>$/.test(trimmed);
        if (isImage || isVideo) {
            modified = true;
            const cursor = cmInstance.getCursor();
            const currentLine = cmInstance.getLine(cursor.line) || '';
            const charBefore = currentLine.substring(0, cursor.ch);
            const needPrevNewline = charBefore.length > 0 && !charBefore.endsWith('\n');
            return (needPrevNewline ? '\n' : '') + trimmed;
        }
        return trimmed;
    });
    if (modified) {
        event.preventDefault();
        const cursor = cmInstance.getCursor();
        cmInstance.replaceSelection(newLines.join('\n'));
        // Ajustar cursor al final del texto insertado
        const insertedLines = newLines.length;
        const newLine = cursor.line + insertedLines;
        const newCh = cmInstance.getLine(newLine)?.length || 0;
        cmInstance.setCursor({ line: newLine, ch: newCh });
    }
});

cm.on('drop', (cmInstance, event) => {
    if (event.dataTransfer.files.length > 0) {
        event.preventDefault();
        // Guardar estado y reprogramar sincronización en múltiples frames
        // para que se ejecute DESPUÉS de que FilePond inserte el markdown
        // y el navegador complete todos los reflows.
        window._pendingDropFix = {
            cursor: cmInstance.getCursor(),
            scroll: cmInstance.getScrollInfo(),
            frame: 0,
        };
        scheduleDropFix();
    }
});

function scheduleDropFix() {
    if (!window._pendingDropFix) return;
    window._pendingDropFix.frame++;
    // Ejecutar en requestAnimationFrame para sincronizar con el paint del navegador
    requestAnimationFrame(function() {
        if (!window._pendingDropFix) return;
        const fix = window._pendingDropFix;
        // Solo ejecutar después de 2 frames (asegura que FilePond ya insertó)
        if (fix.frame >= 2) {
            setTimeout(function() {
                try {
                    const cm = easyMDE.codemirror;
                    const cursor = fix.cursor;
                    // Forzar scroll y refresh MÚLTIPLES veces para eliminar desfase
                    cm.scrollIntoView(cursor, 50);
                    cm.refresh();
                    cm.setCursor(cursor);
                    // Segundo refresh para confirmar
                    setTimeout(function() {
                        try {
                            cm.scrollIntoView(cursor, 50);
                            cm.refresh();
                            cm.setCursor(cursor);
                        } catch (e) { /* ignore */ }
                    }, 50);
                } catch (e) {
                    console.warn('[blog_editor] Error en fix post-drop:', e);
                }
                window._pendingDropFix = null;
            }, 0);
        } else {
            // Seguir esperando frames
            scheduleDropFix();
        }
    });
}

// ======================================================
// FIX CARRETA DESFASADA (v2)
// Re-sincronizar scroll y posición del cursor después de
// cada cambio, para eliminar el desfase visual del caret
// cuando hay widgets de imagen insertados.
// ======================================================
(function() {
    let syncTimer = null;
    cm.on('change', function() {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(function() {
            try {
                const c = cm.getCursor();
                const s = cm.getScrollInfo();
                if (s.top > 0 || s.left > 0) {
                    cm.scrollIntoView(c, 50);
                    cm.refresh();
                    cm.setCursor(c);
                }
            } catch (e) { /* ignore */ }
        }, 50);
    });
})();

// ======================================================
// 1c. HU-20-B: Widget flotante con menú por línea de imagen/video
// ======================================================

// Almacén de widgets activos (lineNumber -> {widget, node, menuOpen, widgetId})
let imageWidgets = {};
// Almacén de bloques slide/gallery (línea de apertura -> {element, lineWidget, endLine})
let blockWidgets = {};
let imageWidgetCleanup = null;
// Contador para IDs únicos de widgets
let widgetIdCounter = 0;

/**
 * Crea el DOM del widget MTP para una referencia de video de YouTube [youtube:ID].
 * Muestra un mosaico con miniatura y play button. Abre el video en nueva pestaña al hacer clic.
 * @param {number} lineNumber
 * @param {string} videoId
 * @returns {{ widgetElement: HTMLElement, widgetId: string }}
 */
function createYouTubeWidget(lineNumber, videoId) {
    const widgetId = 'img-widget-' + (++widgetIdCounter);
    const widget = document.createElement('span');
    widget.className = 'img-line-widget mtp-branded video-widget-mtp';
    widget.id = widgetId;
    widget.dataset.line = lineNumber;
    widget.dataset.videoId = videoId;

    // Contenedor principal del widget (layout horizontal: thumbnail + controles)
    const body = document.createElement('div');
    body.className = 'youtube-widget-body';

    // Miniaturilla con overlay de play
    const mosaic = document.createElement('div');
    mosaic.className = 'youtube-mosaic';
    mosaic.style.cursor = 'pointer';
    mosaic.setAttribute('role', 'button');
    mosaic.setAttribute('aria-label', 'Abrir video en YouTube');
    mosaic.setAttribute('title', 'Abrir video en YouTube');

    const img = document.createElement('img');
    img.src = 'https://img.youtube.com/vi/' + videoId + '/0.jpg';
    img.alt = 'Miniatura del video';
    img.loading = 'lazy';
    img.style.cssText = 'width:160px; height:90px; object-fit:cover; border-radius:4px; display:block;';

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.25); border-radius:4px;';
    overlay.innerHTML = '<i class="fas fa-play" style="font-size:28px; color:#fff; opacity:0.9;"></i>';

    mosaic.appendChild(img);
    mosaic.appendChild(overlay);

    mosaic.addEventListener('click', function() {
        const url = 'https://www.youtube.com/watch?v=' + videoId;
        window.open(url, '_blank', 'noopener,noreferrer');
    });

    body.appendChild(mosaic);

    // Contenedor de controles a la derecha (siempre visibles)
    const controls = document.createElement('div');
    controls.className = 'youtube-widget-controls';

    // Grip
    const gripBtn = document.createElement('button');
    gripBtn.type = 'button';
    gripBtn.className = 'img-line-grip-btn';
    gripBtn.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    gripBtn.setAttribute('aria-label', 'Arrastrar video');
    gripBtn.setAttribute('title', 'Arrastrar para mover');

    // Menú
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'img-line-menu-btn';
    btn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    btn.setAttribute('aria-label', 'Opciones de video');
    btn.setAttribute('title', 'Opciones');

    // Ayuda
    const helpBtn = document.createElement('button');
    helpBtn.type = 'button';
    helpBtn.className = 'img-line-help-btn';
    helpBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
    helpBtn.setAttribute('aria-label', 'Ayuda del widget MTP');
    helpBtn.setAttribute('title', '¿Cómo funciona este widget MTP?');
    helpBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (typeof openWidgetHelpModal === 'function') openWidgetHelpModal('youtube-widget');
    });

    controls.appendChild(gripBtn);
    controls.appendChild(btn);
    controls.appendChild(helpBtn);
    body.appendChild(controls);

    // Dropdown (sin portada ni bloqueo, solo eliminar)
    const dropdown = document.createElement('div');
    dropdown.className = 'img-line-dropdown';
    dropdown.innerHTML = [
        '<div class="img-line-dropdown-divider"></div>',
        '<button type="button" class="img-line-dropdown-item" data-action="delete">',
        '  <i class="fas fa-trash-alt"></i> Eliminar video',
        '</button>',
    ].join('\n');

    widget.appendChild(body);
    widget.appendChild(dropdown);

    // Toggle del menú (mismo patrón MTP)
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.toggle('is-open');
        btn.classList.toggle('is-open', isOpen);
        if (isOpen) {
            if (dropdown.parentElement !== document.body) document.body.appendChild(dropdown);
            var btnRect = btn.getBoundingClientRect();
            dropdown.style.top = (btnRect.bottom + 4) + 'px';
            dropdown.style.bottom = 'auto';
            dropdown.style.left = btnRect.left + 'px';
            dropdown.style.right = 'auto';
            dropdown.style.position = 'fixed';
            dropdown.style.zIndex = '99999';
        } else {
            if (dropdown.parentElement === document.body && widget.contains(dropdown) === false) widget.appendChild(dropdown);
            dropdown.style.position = ''; dropdown.style.top = ''; dropdown.style.bottom = ''; dropdown.style.left = ''; dropdown.style.right = ''; dropdown.style.zIndex = '';
        }
        document.querySelectorAll('.img-line-dropdown.is-open').forEach(function(d) {
            if (d !== dropdown) { d.classList.remove('is-open'); var parentBtn = d.parentElement ? d.parentElement.querySelector('.img-line-menu-btn') : null; if (parentBtn) parentBtn.classList.remove('is-open'); if (d.parentElement === document.body) d.style.position = ''; }
        });
    });

    gripBtn.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        startImageDrag(lineNumber, gripBtn);
    });

    // Acciones del dropdown (solo delete para YouTube)
    dropdown.querySelectorAll('.img-line-dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            var action = this.dataset.action;
            if (action === 'delete') {
                // Solo eliminar la línea [youtube:ID] del documento (NO borra el archivo físico)
                const cm = window.easyMDE ? window.easyMDE.codemirror : null;
                if (!cm) return;
                const doc = cm.getDoc();
                const content = doc.getValue();
                const ytRegex = new RegExp('^\\[youtube:' + videoId + '\\]\\s*\\n?', 'gm');
                const cleaned = content.replace(ytRegex, '').replace(/\n{3,}/g, '\n\n');
                doc.setValue(cleaned);
                // Limpiar widget del CodeMirror
                cleanupImageWidget(lineNumber);
                cm.focus();
            }
            dropdown.classList.remove('is-open');
            btn.classList.remove('is-open');
        });
    });

    return { widgetElement: widget, widgetId: widgetId };
}

/**
 * Crea el DOM del widget para un video local (etiqueta <video src="...">).
 * El widget comparte la estructura MTP con los de imagen, pero incluye la
 * clase `video-widget-mtp` para aplicar estilos específicos de video.
 * @param {number} lineNumber - Número de línea en CodeMirror donde está la etiqueta <video>.
 * @param {string} filename - Nombre del archivo de video (sin ruta).
 * @returns {{ widgetElement: HTMLElement, widgetId: string }}
 */
function createLocalVideoWidget(lineNumber, filename) {
    const widgetId = 'img-widget-' + (++widgetIdCounter);
    const widget = document.createElement('span');
    // Clase base + marca de video
    widget.className = 'img-line-widget mtp-branded video-widget-mtp';
    widget.id = widgetId;
    widget.dataset.line = lineNumber;
    widget.dataset.filename = filename;

    // Grip (arrastrar)
    const gripBtn = document.createElement('button');
    gripBtn.type = 'button';
    gripBtn.className = 'img-line-grip-btn';
    gripBtn.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    gripBtn.setAttribute('aria-label', 'Arrastrar video');
    gripBtn.setAttribute('title', 'Arrastrar para mover');

    // Menú (⋮)
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'img-line-menu-btn';
    btn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    btn.setAttribute('aria-label', 'Opciones de video');
    btn.setAttribute('title', 'Opciones');

    // Ayuda (?)
    const helpBtn = document.createElement('button');
    helpBtn.type = 'button';
    helpBtn.className = 'img-line-help-btn';
    helpBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
    helpBtn.setAttribute('aria-label', 'Ayuda del widget MTP');
    helpBtn.setAttribute('title', '¿Cómo funciona este widget MTP?');
    helpBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (typeof openWidgetHelpModal === 'function') openWidgetHelpModal('video-widget');
    });

    // Dropdown (solo eliminar)
    const dropdown = document.createElement('div');
    dropdown.className = 'img-line-dropdown';
    dropdown.innerHTML = [
        '<div class="img-line-dropdown-divider"></div>',
        '<button type="button" class="img-line-dropdown-item" data-action="delete">',
        '  <i class="fas fa-trash-alt"></i> Eliminar video',
        '</button>',
    ].join('\n');

    // Ensamblar widget
    widget.appendChild(gripBtn);
    widget.appendChild(btn);
    widget.appendChild(helpBtn);
    widget.appendChild(dropdown);

    return { widgetElement: widget, widgetId: widgetId };
}

/**
 * Crea el DOM del widget para una línea de imagen/video.
 * @param {number} lineNumber - Número de línea en CodeMirror
 * @param {string} filename - Nombre del archivo extraído de la línea
 * @returns {HTMLElement} El elemento widget
 */
function createImageWidget(lineNumber, filename) {
    // Generar ID único para este widget
    const widgetId = 'img-widget-' + (++widgetIdCounter);
    const widget = document.createElement('span');
    widget.className = 'img-line-widget mtp-branded';
    widget.id = widgetId;
    widget.dataset.line = lineNumber;
    widget.dataset.filename = filename;

    // Área de agarre (grip) para iniciar arrastre
    const gripBtn = document.createElement('button');
    gripBtn.type = 'button';
    gripBtn.className = 'img-line-grip-btn';
    gripBtn.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    gripBtn.setAttribute('aria-label', 'Arrastrar imagen');
    gripBtn.setAttribute('title', 'Arrastrar para mover');

    // Botón del menú (⋮ tres puntos verticales)
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'img-line-menu-btn';
    btn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    btn.setAttribute('aria-label', 'Opciones de imagen');
    btn.setAttribute('title', 'Opciones');

    // HU-20-C-Parent: Botón de ayuda (?) al lado del menú
    const helpBtn = document.createElement('button');
    helpBtn.type = 'button';
    helpBtn.className = 'img-line-help-btn';
    helpBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
    helpBtn.setAttribute('aria-label', 'Ayuda del widget MTP');
    helpBtn.setAttribute('title', '¿Cómo funciona este widget MTP?');

    // Reutilizable: el tipo de ayuda se define por data-mtp-help-type
    // Tipos existentes: 'image-widget', y se pueden añadir más
    const helpType = btn.dataset.mtpHelpType || 'image-widget';

    helpBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openWidgetHelpModal(helpType);
    });

    // Hover (desktop) → abre modal tras 500ms
    var hoverTimer = null;
    // helpBtn.addEventListener('mouseenter', function() {
    //     if (window.innerWidth < 768) return;
    //     clearTimeout(hoverTimer);
    //     hoverTimer = setTimeout(function() { openWidgetHelpModal(helpType); }, 500);
    // });
    // helpBtn.addEventListener('mouseleave', function() {
    //     clearTimeout(hoverTimer);
    // });

    // Dropdown del menú
    const dropdown = document.createElement('div');
    dropdown.className = 'img-line-dropdown';
    dropdown.innerHTML = [
        '<button type="button" class="img-line-dropdown-item" data-action="block">',
        '  <i class="fas fa-eye-slash block-icon"></i>',
        '  <span class="block-text">Bloquear en artículo</span>',
        '</button>',
        '<button type="button" class="img-line-dropdown-item cover-dropdown-item" data-action="cover">',
        '  <i class="fas fa-star cover-icon"></i>',
        '  <span class="cover-text">Marcar como portada</span>',
        '</button>',
        '<div class="img-line-dropdown-divider"></div>',
        '<button type="button" class="img-line-dropdown-item" data-action="delete">',
        '  <i class="fas fa-trash-alt"></i> Eliminar archivo',
        '</button>',
    ].join('\n');

    widget.appendChild(gripBtn);
    widget.appendChild(btn);
    widget.appendChild(helpBtn);
    widget.appendChild(dropdown);

    // Toggle del menú (manual, sin Popper.js)
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.toggle('is-open');
        btn.classList.toggle('is-open', isOpen);
        
        if (isOpen) {
            // Actualizar el texto del botón de bloqueo según el estado actual del archivo
            updateBlockButtonState(filename);
            // Actualizar el texto del botón de portada según el estado actual
            updateCoverButtonState(filename);
            
            // Mover a body para escapar de stacking contexts (CodeMirror, widget padre)
            if (dropdown.parentElement !== document.body) {
                document.body.appendChild(dropdown);
            }
            // Calcular posición con getBoundingClientRect del botón
            var btnRect = btn.getBoundingClientRect();
            var dropdownHeight = 160;
            var spaceBelow = window.innerHeight - btnRect.bottom;
            var spaceAbove = btnRect.top;
            
            if (spaceBelow >= dropdownHeight) {
                dropdown.style.top = (btnRect.bottom + 4) + 'px';
                dropdown.style.bottom = 'auto';
            } else if (spaceAbove >= dropdownHeight) {
                dropdown.style.top = 'auto';
                dropdown.style.bottom = (window.innerHeight - btnRect.top + 4) + 'px';
            } else {
                dropdown.style.top = (btnRect.bottom + 4) + 'px';
                dropdown.style.bottom = 'auto';
            }
            dropdown.style.left = btnRect.left + 'px';
            dropdown.style.right = 'auto';
            dropdown.style.position = 'fixed';
            dropdown.style.zIndex = '99999';
        } else {
            // Devolver al widget y limpiar estilos
            if (dropdown.parentElement === document.body && widget.contains(dropdown) === false) {
                widget.appendChild(dropdown);
            }
            dropdown.style.position = '';
            dropdown.style.top = '';
            dropdown.style.bottom = '';
            dropdown.style.left = '';
            dropdown.style.right = '';
            dropdown.style.zIndex = '';
        }
        
        // Cerrar otros menús abiertos primero
        document.querySelectorAll('.img-line-dropdown.is-open').forEach(function(d) {
            if (d !== dropdown) {
                d.classList.remove('is-open');
                var parentBtn = d.parentElement ? d.parentElement.querySelector('.img-line-menu-btn') : null;
                if (parentBtn) parentBtn.classList.remove('is-open');
                // Devolver dropdown huérfano a su widget si corresponde
                if (d.parentElement === document.body && d.contains(widget) === false) {
                    // Encontrar el widget padre original via data-line
                    var line = d.closest('.img-line-widget') || d.previousElementSibling;
                    if (line && line.classList.contains('img-line-widget')) {
                        line.appendChild(d);
                    }
                }
                d.style.position = '';
                d.style.top = '';
                d.style.bottom = '';
                d.style.left = '';
                d.style.right = '';
                d.style.zIndex = '';
            }
        });
    });

    // Cerrar al hacer clic fuera
    setTimeout(function() {
        if (!imageWidgetCleanup) {
            imageWidgetCleanup = function(ev) {
                if (!ev.target.closest('.img-line-widget')) {
                    document.querySelectorAll('.img-line-dropdown.is-open').forEach(function(d) {
                        d.classList.remove('is-open');
                        var parentBtn = d.parentElement ? d.parentElement.querySelector('.img-line-menu-btn') : null;
                        if (parentBtn) parentBtn.classList.remove('is-open');
                    });
                }
            };
            document.addEventListener('click', imageWidgetCleanup);
        }
    }, 0);

    // Arrastre desde el icono de agarre (no interfiere con el botón ⋮)
    gripBtn.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return; // solo click izquierdo
        startImageDrag(lineNumber, gripBtn);
    });

    // Acciones reales del menú de línea de imagen
    dropdown.querySelectorAll('.img-line-dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            var action = this.dataset.action;
            console.log('[HU-20-B] Acción:', action, 'para', filename);
            
            if (action === 'delete') {
                // Solo eliminar la línea markdown del editor (NO borra el archivo físico ni lo deslista)
                // Cancelar timer de refresh pendiente para evitar recrear el widget que estamos eliminando
                if (window._imgWidgetTimer) {
                    clearTimeout(window._imgWidgetTimer);
                    window._imgWidgetTimer = null;
                }
                deleteImageLineFromEditor(lineNumber, filename);
                // Refrescar widgets después de eliminar la línea para que el resto se reorganicen
                setTimeout(refreshImageWidgets, 50);
                // Limpiar widget del CodeMirror
                cleanupImageWidget(lineNumber);
                // Mostrar feedback sutil
                showStatusMessage('Referencia eliminada del editor: ' + filename, 'info');
            } else if (action === 'block') {
                toggleUploadedFile(filename);
                // Actualizar el texto del botón después de cambiar el estado
                updateBlockButtonState(filename);
            } else if (action === 'cover') {
                setAsCover(filename);
                // Guardar automáticamente después de marcar como portada
                setTimeout(function() {
                    var saveBtn = document.getElementById('btn-save');
                    if (saveBtn) saveBtn.click();
                }, 300);
            }
            
            dropdown.classList.remove('is-open');
            btn.classList.remove('is-open');
        });
    });

    // Retornar el widget junto con su ID para poder rastrearlo
    return { widgetElement: widget, widgetId: widgetId };
}

/**
 * Actualiza el texto y icono del botón de bloqueo/desbloqueo según el estado actual del archivo.
 * @param {string} filename - Nombre del archivo
 */
function updateBlockButtonState(filename) {
    if (!filename) return;
    
    // Buscar el archivo en el array para ver si está oculto
    const file = uploadedFiles.find(f => f.filename === filename);
    const isHidden = file ? file.hidden : false;
    
    // Buscar todos los botones de bloqueo en los dropdowns
    const blockButtons = document.querySelectorAll('.img-line-dropdown-item[data-action="block"]');
    blockButtons.forEach(function(button) {
        // Verificar si este botón pertenece al widget del archivo actual
        const widget = button.closest('.img-line-widget');
        if (!widget) return;
        
        const widgetFilename = widget.dataset.filename;
        if (widgetFilename !== filename) return;
        
        // Actualizar icono y texto
        const icon = button.querySelector('.block-icon');
        const text = button.querySelector('.block-text');
        
        if (isHidden) {
            // Está bloqueado → mostrar "Desbloquear" con ojo abierto
            if (icon) {
                icon.className = 'fas fa-eye block-icon';
            }
            if (text) {
                text.textContent = 'Desbloquear en artículo';
            }
        } else {
            // No está bloqueado → mostrar "Bloquear" con ojo cerrado
            if (icon) {
                icon.className = 'fas fa-eye-slash block-icon';
            }
            if (text) {
                text.textContent = 'Bloquear en artículo';
            }
        }
    });
}

/**
 * Actualiza el texto y icono del botón de portada según el estado actual del archivo.
 * @param {string} filename - Nombre del archivo
 */
function updateCoverButtonState(filename) {
    if (!filename) return;
    
    // Buscar el archivo en el array para ver si es portada
    const file = uploadedFiles.find(f => f.filename === filename);
    const isCover = file ? file.is_cover : false;
    
    // Buscar todos los botones de portada en los dropdowns
    const coverButtons = document.querySelectorAll('.cover-dropdown-item[data-action="cover"]');
    coverButtons.forEach(function(button) {
        // Verificar si este botón pertenece al widget del archivo actual
        const widget = button.closest('.img-line-widget');
        if (!widget) return;
        
        const widgetFilename = widget.dataset.filename;
        if (widgetFilename !== filename) return;
        
        // Actualizar icono y texto
        const icon = button.querySelector('.cover-icon');
        const text = button.querySelector('.cover-text');
        
        if (isCover) {
            // Es la portada → mostrar "Quitar como portada" con icono sólido
            if (icon) {
                icon.className = 'fas fa-star cover-icon';
            }
            if (text) {
                text.textContent = 'Quitar como imagen de portada';
            }
        } else {
            // No es portada → mostrar "Marcar como portada" con icono vacío
            if (icon) {
                icon.className = 'far fa-star cover-icon';
            }
            if (text) {
                text.textContent = 'Marcar como portada';
            }
        }
    });
}

/**
 * Elimina la línea de imagen/video del editor en la posición indicada.
 * @param {number} lineNumber - Número de línea en CodeMirror
 * @param {string} filename - Nombre del archivo a eliminar
 *
 * NOTA: La lógica de eliminación de markdown está unificada en
 * removeMarkdownLineForFile(filename) para evitar duplicación.
 * Si esta función falla, revertir a la implementación original comentada abajo.
 */
function deleteImageLineFromEditor(lineNumber, filename) {
    if (!easyMDE || typeof lineNumber !== 'number') return;
    const doc = easyMDE.codemirror.getDoc();
    
    // Buscar la línea que realmente contiene este filename / referencia
    function isTargetLine(text) {
        const t = text.trim();
        return t.includes(filename) && (t.startsWith('![') || t.startsWith('<video') || t.startsWith('[youtube:'));
    }
    
    let targetLine = -1;
    // 1) Buscar cerca del lineNumber (±5 líneas)
    const startNear = Math.max(0, lineNumber - 5);
    const endNear = Math.min(doc.lineCount() - 1, lineNumber + 5);
    for (let i = startNear; i <= endNear; i++) {
        const t = (doc.getLine(i) || '').trim();
        if (isTargetLine(t)) { targetLine = i; break; }
    }
    
    // 2) Si no se encontró cerca, buscar la primera ocurrencia en todo el documento
    if (targetLine === -1) {
        const lines = doc.getValue().split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (isTargetLine(lines[i])) { targetLine = i; break; }
        }
    }
    
    if (targetLine === -1) return;
    
    // Eliminar la línea objetivo y también la siguiente si está vacía
    const nextLine = doc.getLine(targetLine + 1) || '';
    const lineEnd = nextLine.trim() === '' ? targetLine + 2 : targetLine + 1;
    doc.replaceRange('', { line: targetLine, ch: 0 }, { line: lineEnd, ch: 0 });
    
    // Limpiar newlines sobrantes
    const current = doc.getValue();
    const cleaned = current.replace(/\n{3,}/g, '\n\n');
    if (cleaned !== current) {
        doc.setValue(cleaned);
    }
}

/**
 * Limpia un widget de imagen del CodeMirror por número de línea.
 * @param {number} lineNumber - Número de línea
 */
function cleanupImageWidget(lineNumber) {
    const entry = imageWidgets[lineNumber];
    if (!entry) return;
    
    // Eliminar el elemento del DOM por ID si existe
    if (entry.widgetId) {
        const widgetEl = document.getElementById(entry.widgetId);
        if (widgetEl && widgetEl.parentElement) {
            widgetEl.parentElement.removeChild(widgetEl);
            console.log('[HU-20-B] Widget DOM eliminado:', entry.widgetId);
        }
    } else if (entry.node && entry.node.parentElement) {
        // Fallback: eliminar por referencia al nodo
        entry.node.parentElement.removeChild(entry.node);
    }
    
    // Limpiar el widget de CodeMirror
    if (entry.widget) {
        try {
            entry.widget.clear();
            console.log('[HU-20-B] Widget CodeMirror limpiado en linea', lineNumber);
        } catch(e) { 
            console.warn('[HU-20-B] Error al limpiar widget:', e);
        }
    }
    
    delete imageWidgets[lineNumber];
}

/**
 * Elimina la vista previa del grid de archivos subidos.
 * @param {string} filename - Nombre del archivo
 */
function removeUploadedFilePreview(filename) {
    const container = document.getElementById('uploaded-files');
    if (!container) return;
    const item = container.querySelector('.uploaded-item[data-filename="' + filename + '"]');
    if (item) item.remove();
    // Mostrar estado vacío si no quedan archivos
    const remaining = container.querySelectorAll('.uploaded-item');
    if (remaining.length === 0) {
        showUploadedFilesEmpty();
    }
}

/**
 * Muestra un mensaje de estado temporal.
 * @param {string} msg - Texto del mensaje
 * @param {string} type - Tipo: 'info', 'success', 'danger'
 */
function showStatusMessage(msg, type) {
    const el = document.getElementById('status-message');
    if (!el) return;
    const alertClass = type === 'success' ? 'alert-success' : type === 'danger' ? 'alert-danger' : 'alert-info';
    const html = '<div class="alert ' + alertClass + ' alert-dismissible fade show" role="alert">' + msg + '<button type="button" class="close" data-dismiss="alert" aria-label="Cerrar"><span aria-hidden="true">&times;</span></button></div>';
    el.innerHTML = html;
}

/**
 * Crea el widget MTP-branded para una línea de apertura de bloque :::slides o :::popup:gallery.
 * @param {number} lineNumber - Número de línea en CodeMirror donde está el :::
 * @param {string} blockType - 'slides' | 'popup:gallery'
 * @returns {{ widgetElement: HTMLElement, widgetId: string }}
 */
function createSlideBlockWidget(lineNumber, blockType) {
    const widgetId = 'slideblock-widget-' + (++widgetIdCounter);
    const widget = document.createElement('span');
    widget.className = 'img-line-widget mtp-branded slideblock-widget-mtp';
    widget.id = widgetId;
    widget.dataset.line = lineNumber;
    widget.dataset.blockType = blockType;

    // Grip
    const gripBtn = document.createElement('button');
    gripBtn.type = 'button';
    gripBtn.className = 'img-line-grip-btn';
    gripBtn.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    gripBtn.setAttribute('aria-label', 'Arrastrar bloque');
    gripBtn.setAttribute('title', 'Arrastrar para mover');

    // Menú ⋮
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'img-line-menu-btn';
    btn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    btn.setAttribute('aria-label', 'Opciones del bloque');
    btn.setAttribute('title', 'Opciones');

    // Ayuda (?)
    const helpBtn = document.createElement('button');
    helpBtn.type = 'button';
    helpBtn.className = 'img-line-help-btn';
    helpBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
    helpBtn.setAttribute('aria-label', 'Ayuda del widget MTP');
    helpBtn.setAttribute('title', '¿Cómo funciona este widget MTP?');
    helpBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (typeof openWidgetHelpModal === 'function') {
            openWidgetHelpModal('slide-widget');
        }
    });

    // Label del bloque
    const label = document.createElement('span');
    label.className = 'slideblock-label';
    label.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin-left:4px;font-size:12px;color:#666;';
    const icon = document.createElement('i');
    icon.className = blockType === 'slides' ? 'fas fa-images' : 'fas fa-layer-group';
    label.appendChild(icon);
    label.appendChild(document.createTextNode(blockType === 'slides' ? ' Slide' : ' Popup Gallery'));

    const dropdown = document.createElement('div');
    dropdown.className = 'img-line-dropdown';
    dropdown.innerHTML = [
        '<div class="img-line-dropdown-divider"></div>',
        '<button type="button" class="img-line-dropdown-item" data-action="delete">',
        '  <i class="fas fa-trash-alt"></i> Eliminar bloque',
        '</button>',
    ].join('\n');

    widget.appendChild(gripBtn);
    widget.appendChild(btn);
    widget.appendChild(helpBtn);
    widget.appendChild(label);
    widget.appendChild(dropdown);

    // Toggle menú
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.toggle('is-open');
        btn.classList.toggle('is-open', isOpen);
        if (isOpen) {
            if (dropdown.parentElement !== document.body) document.body.appendChild(dropdown);
            var btnRect = btn.getBoundingClientRect();
            dropdown.style.top = (btnRect.bottom + 4) + 'px';
            dropdown.style.bottom = 'auto';
            dropdown.style.left = btnRect.left + 'px';
            dropdown.style.right = 'auto';
            dropdown.style.position = 'fixed';
            dropdown.style.zIndex = '99999';
        } else {
            if (dropdown.parentElement === document.body && widget.contains(dropdown) === false) widget.appendChild(dropdown);
            dropdown.style.position = ''; dropdown.style.top = ''; dropdown.style.bottom = ''; dropdown.style.left = ''; dropdown.style.right = ''; dropdown.style.zIndex = '';
        }
        document.querySelectorAll('.img-line-dropdown.is-open').forEach(function(d) {
            if (d !== dropdown) { d.classList.remove('is-open'); var parentBtn = d.parentElement ? d.parentElement.querySelector('.img-line-menu-btn') : null; if (parentBtn) parentBtn.classList.remove('is-open'); if (d.parentElement === document.body) d.style.position = ''; }
        });
    });

    // Arrastre
    // Iniciar arrastre del bloque completo
    gripBtn.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        startBlockDrag(lineNumber);
    });

    // Acción delete: eliminar todo el bloque ::: ... :::
    dropdown.querySelectorAll('.img-line-dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            var action = this.dataset.action;
            if (action === 'delete') {
                deleteSlideBlock(lineNumber);
            }
            dropdown.classList.remove('is-open');
            btn.classList.remove('is-open');
        });
    });

    return { widgetElement: widget, widgetId: widgetId };
}

/**
 * Elimina un bloque :::slides / :::popup:gallery completo desde la línea de apertura hasta su cierre :::.
 * @param {number} startLine - Línea de apertura del bloque :::
 */
function deleteSlideBlock(startLine) {
    if (!easyMDE || typeof startLine !== 'number') return;
    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    const lineCount = doc.lineCount();
    let endLine = startLine;
    // Buscar el cierre ::: después de la apertura
    for (let i = startLine + 1; i < lineCount; i++) {
        const text = doc.getLine(i) || '';
        if (text.trim() === ':::') {
            endLine = i;
            break;
        }
    }
    doc.replaceRange('', { line: startLine, ch: 0 }, { line: endLine + 1, ch: 0 });
    const current = doc.getValue();
    const cleaned = current.replace(/\n{3,}/g, '\n\n');
    if (cleaned !== current) doc.setValue(cleaned);
    cleanupImageWidget(startLine);
    setTimeout(refreshImageWidgets, 50);
    cm.focus();
}

/**
 * Refresca todos los widgets de imagen en el editor.
 * Escanea línea por línea y añade/actualiza widgets donde haya imágenes.
 */
function refreshImageWidgets() {
    if (!easyMDE || !cm) {
        console.warn('[HU-20-B] easyMDE o cm no disponibles');
        return;
    }

    var doc = cm.getDoc();
    var totalLines = doc.lineCount();
    console.log('[HU-20-B] refreshImageWidgets: lineas totales =', totalLines);
    var newImageWidgets = {};
    var newBlockWidgets = {};
    var foundImages = 0;
    var insideBlock = null;

    for (var i = 0; i < totalLines; i++) {
        var lineText = doc.getLine(i) || '';
        var trimmed = lineText.trim();

        // Detectar apertura de bloque :::slides / :::popup:gallery
        var isSlideBlock = /^:::\s*slides\s*$/.test(trimmed);
        var isGalleryBlock = /^:::\s*popup:gallery\s*$/.test(trimmed);
        var isBlockOpen = isSlideBlock || isGalleryBlock;
        // Detectar cierre de bloque especial
        var isBlockEnd = /^:::\s*$/.test(trimmed);

        // Rastrear estado de bloque para omitir contenido interno
        if (isBlockOpen) {
            insideBlock = isSlideBlock ? 'slides' : 'popup:gallery';
        } else if (isBlockEnd && insideBlock) {
            insideBlock = null;
        }

        // Detectar imagen markdown, video HTML local, o referencia YouTube [youtube:ID]
        var isImage = /^!\[.*?\]\(.*?\)$/.test(trimmed);
        var isVideo = /^<video\b[^>]*src=.*><\/video>$/.test(trimmed);
        var isYouTube = /^\[youtube:[A-Za-z0-9_-]{11}\]$/.test(trimmed);

        // -------------------------------------------------
        // Solo procesar la línea de apertura como widget de bloque
        // -------------------------------------------------
        if (isBlockOpen) {
            foundImages++;
            var blockType = isSlideBlock ? 'slides' : 'popup:gallery';
            console.log('[HU-20-B] Linea', i, 'deteccion bloque:', blockType);

            if (blockWidgets[i]) {
                newBlockWidgets[i] = blockWidgets[i];
                delete blockWidgets[i];
            } else {
                try {
                    var lineHandle = doc.getLineHandle(i);
                    var widgetData = createSlideBlockWidget(i, blockType);
                    var widgetNode = widgetData.widgetElement;
                    widgetNode.classList.add('slideblock-widget-mtp');

                    var lineWidget = cm.addLineWidget(lineHandle, widgetNode, {
                        position: 'after',
                        coverGutter: false,
                        noHScroll: true
                    });

                    var widgetEntry = {
                        widget: lineWidget,
                        node: widgetNode,
                        menuOpen: false,
                        widgetId: widgetData.widgetId,
                        type: 'slideblock',
                        ref: blockType
                    };
                    newBlockWidgets[i] = widgetEntry;
                } catch (e) {
                    console.warn('[HU-20-B] Error al añadir widget bloque', i, e);
                }
            }
            continue;
        }

        // Si estamos dentro de un bloque, saltar líneas individuales
        if (insideBlock) {
            continue;
        }

        // -------------------------------------------------
        // Imágenes, videos y YouTube (solo fuera de bloques)
        // -------------------------------------------------
        if (isImage || isVideo || isYouTube) {
            foundImages++;
            console.log('[HU-20-B] Linea', i, 'deteccion:', trimmed.substring(0, 60));

            var filename = '';
            var videoId = '';
            if (isImage) {
                var match = trimmed.match(/\]\(\.?\/?(.*?)\)/);
                if (match) filename = match[1];
            } else if (isVideo) {
                var match = trimmed.match(/src=["']\.?\/?(.*?)["']/);
                if (match) filename = match[1];
            } else if (isYouTube) {
                var match = trimmed.match(/\[youtube:([A-Za-z0-9_-]{11})\]/);
                if (match) videoId = match[1];
            }

            if (!filename && !videoId) continue;

            if (imageWidgets[i]) {
                newImageWidgets[i] = imageWidgets[i];
                delete imageWidgets[i];
                console.log('[HU-20-B] Reusando widget en linea', i);
            } else {
                try {
                    var lineHandle = doc.getLineHandle(i);
                    let widgetData;
                    if (isYouTube && videoId) {
                        widgetData = createYouTubeWidget(i, videoId);
                    } else if (isVideo) {
                        widgetData = createLocalVideoWidget(i, filename);
                    } else {
                        widgetData = createImageWidget(i, filename);
                    }
                    var widgetNode = widgetData.widgetElement;
                    if (isYouTube) widgetNode.classList.add('video-widget-mtp');

                    var lineWidget = cm.addLineWidget(lineHandle, widgetNode, {
                        position: 'after',
                        coverGutter: false,
                        noHScroll: true
                    });

                    var widgetEntry = {
                        widget: lineWidget,
                        node: widgetNode,
                        menuOpen: false,
                        widgetId: widgetData.widgetId,
                        type: isYouTube ? 'youtube' : (isVideo ? 'video' : 'image'),
                        ref: videoId || filename
                    };
                    newImageWidgets[i] = widgetEntry;
                    // marcar draggable
                    try {
                        widgetNode.classList.add('img-line-draggable');
                        const menuBtn = widgetNode.querySelector('.img-line-menu-btn');
                        if (menuBtn) {
                            menuBtn.addEventListener('mousedown', function(e) {
                                if (e.button !== 0) return;
                                startImageDrag(i, this);
                            });
                        }
                    } catch (err) { console.warn('Error marcando draggable linea', i, err); }
                } catch (e) {
                    console.warn('[HU-20-B] Error al añadir widget linea', i, e);
                }
            }
        }
    }

    console.log('[HU-20-B] Total imagenes detectadas:', foundImages);

    // Limpiar widgets de líneas que ya no existen (imágenes)
    Object.keys(imageWidgets).forEach(function(lineNum) {
        var existing = imageWidgets[lineNum];
        if (existing && existing.widget) {
            try { existing.widget.clear(); } catch (e) { /* ignore */ }
        }
    });
    // Limpiar bloques que ya no existen
    Object.keys(blockWidgets).forEach(function(lineNum) {
        var existing = blockWidgets[lineNum];
        if (existing && existing.widget) {
            try { existing.widget.clear(); } catch (e) { /* ignore */ }
        }
    });

    imageWidgets = newImageWidgets;
    blockWidgets = newBlockWidgets;
    console.log('[HU-20-B] Estado final de image widgets:', Object.keys(imageWidgets));
    console.log('[HU-20-B] Estado final de block widgets:', Object.keys(blockWidgets));
}

// Refrescar widgets al cambiar el contenido del editor
// (consolidado en un solo handler para evitar condiciones de carrera)
cm.off('change', window._changeHandler); // Remover handler previo si existe
window._changeHandler = function() {
    const cursor = cm.getCursor();
    const scroll = cm.getScrollInfo();
    // Debounce para no refrescar en cada pulsación de tecla
    if (window._imgWidgetTimer) clearTimeout(window._imgWidgetTimer);
    window._imgWidgetTimer = setTimeout(() => {
        refreshImageWidgets();
        // Restaurar cursor y scroll para evitar el desfase visual
        try {
            cm.setCursor(cursor);
            cm.scrollTo(scroll.left, scroll.top);
            // Re-sincronización adicional post-refresco
            setTimeout(function() {
                try {
                    const c = cm.getCursor();
                    cm.scrollIntoView(c, 50);
                    cm.refresh();
                    cm.setCursor(c);
                } catch (e) { /* ignore */ }
            }, 100);
        } catch (e) { /* ignore */ }
    }, 300);
};
cm.on('change', window._changeHandler);


// Refrescar después de pegar imágenes
var _origPasteHandler = cm._handlers && cm._handlers.paste;
cm.on('paste', function() {
    setTimeout(refreshImageWidgets, 100);
});


// ======================================================
// 2. Calcular tiempo de lectura (fórmula 200 ppm)
// ======================================================
function calculateReadingTime(content) {
    const cleanText = content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/\[[^\]]*\]\([^)]+\)/g, (m) => m.split(']')[0].slice(1))
        .replace(/[#*_~>`-]/g, '')              // símbolos markdown
        .replace(/:::.*?:::/gs, '');            // bloques especiales

    const words = cleanText.trim().split(/\s+/).filter(w => w).length;
    return { words, minutes: Math.max(1, Math.round(words / 200)) };
}

easyMDE.codemirror.on('change', () => {
    const content = easyMDE.value();
    const { words, minutes } = calculateReadingTime(content);
    document.getElementById('word-count').textContent = `${words} palabras`;
    document.getElementById('suggested-time').textContent = `${minutes} min`;
    if (!userOverride) {
        document.getElementById('tiempo_lectura').value = minutes;
    }
});

document.getElementById('tiempo_lectura').addEventListener('input', () => {
    userOverride = true;
});

document.getElementById('apply-suggestion').addEventListener('click', () => {
    userOverride = false;
    const { minutes } = calculateReadingTime(easyMDE.value());
    document.getElementById('tiempo_lectura').value = minutes;
});

// ======================================================
// 3. Tags (sistema de chips)
// ======================================================
const tagsList = document.getElementById('tags-list');
const tagInput = document.getElementById('tag-input');
let tags = [];

tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tag = tagInput.value.trim().toLowerCase();
        if (tag && tags.length < 5 && !tags.includes(tag)) {
            tags.push(tag);
            renderTags();
        }
        tagInput.value = '';
    }
});

function renderTags() {
    // tagsList.innerHTML = tags.map(t =>
    //     `<span class="badge bg-primary me-1 mb-1 px-2 py-1">${t}<button type="button" class="btn-close btn-close-white ms-1" style="font-size:10px" onclick="removeTag('${t}')" aria-label="Eliminar"></button></span>`
    // ).join('');

    tagsList.innerHTML = tags.map(tag => `
        <span class="badge bg-primary me-1 mb-1">
            ${tag}
            <button
                type="button"
                class="btn-close btn-close-white ms-1"
                style="font-size: 10px;"
                onclick="removeTag('${tag}')"
                aria-label="Eliminar">
            </button>
        </span>
    `).join('');

}

function removeTag(tag) {
    tags = tags.filter(t => t !== tag);
    renderTags();
}

// ======================================================
// 4. FilePond - Upload de imágenes y videos
// ======================================================
const pond = FilePond.create(document.getElementById('filepond'), {
    server: {
        process: {
            url: '/blog/api/upload-file/',
            method: 'POST',
            name: 'file',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
    onload: (response) => {
        const data = JSON.parse(response);
        uploadedFiles.push(data);
        
        // HU-20-C-V1: Si el selector está abierto, NO insertar automáticamente en el editor
        if (window.imageSelectorOpen) {
            // Solo renderizar en el grid de archivos subidos
            renderUploadedFile(data);
            // Cerrar modal selector e insertar usando el flujo del selector
            $('#imageSelectorModal').modal('hide');
            // Obtener modo guardado
            const mode = window.selectedImageMode || 'normal';
            const title = document.getElementById('selector-title')?.value || '';
            const desc = document.getElementById('selector-description')?.value || '';
            // Insertar en el editor usando la posición guardada
            insertImageInEditor(data.filename, title, desc, mode);
            return JSON.stringify(data);
        }
        
        // Comportamiento normal: insertar en el editor inmediatamente
        const cm = easyMDE.codemirror;
        const doc = cm.getDoc();
        const cursor = doc.getCursor();
        const line = doc.getLine(cursor.line) || '';
        const charBefore = line.substring(0, cursor.ch);
        const needsPrevNewline = charBefore.length > 0 && !charBefore.endsWith('\n');
        const prefix = needsPrevNewline ? '\n' : '';
        const markdown = (data.type === 'video'
            ? `<video src="./${data.filename}" controls></video>`
            : `![${data.filename}](./${data.filename})`) + '\n';
        doc.replaceSelection(prefix + markdown);
        renderUploadedFile(data);
        return JSON.stringify(data);
    }
        },
        revert: null,
    },
    allowMultiple: true,
});
// HU-20-C-V1: Selector de imágenes existente ha sido extraído a "image-selector.js".
// Las funciones detectImageContext, openImageSelectorModal, insertImageInEditor y los
// manejadores de eventos del modal ahora se encuentran en ese módulo y se exponen
// globalmente. Este bloque se ha eliminado para evitar duplicación.
window.imageSelectorOpen = false;
window.selectedImageFilename = null;
// No limpiar _imageSelectorCursor aquí porque si se cerró sin seleccionar,
// el cursor debe seguir donde estaba

// ======================================================
// 5. collectFormData + auto-save + restore
// ======================================================
function collectFormData() {
    // Determina la categoría según el estado del checkbox
    const useNew = document.getElementById('category-toggle-new')?.checked;
    const category = useNew
        ? (document.getElementById('new_category')?.value?.trim() || '')
        : (document.getElementById('category')?.value?.trim() || '');
    return {
        slug: document.getElementById('edit-slug').value,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        category: category,
        tags: tags,
        meta_title: document.getElementById('meta_title').value,
        meta_description: document.getElementById('meta_description').value,
        palabra_clave_principal: document.getElementById('palabra_clave_principal').value,
        keywords: document.getElementById('keywords').value,
        tiempo_lectura: document.getElementById('tiempo_lectura').value,
        content_md: easyMDE.value(),
        files: uploadedFiles,
        cover_filename: getCoverFilename(),
        _timestamp: Date.now(), // Para calcular antigüedad del draft
    };
}

function performAutoSave() {
    try {
        const data = collectFormData();
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        lastAutoSaveTime = Date.now();

        // Mostrar toast mejorado
        const words = getWordCount(data.content_md || '');
        const detail = data.title
            ? `"${data.title.substring(0, 40)}${data.title.length > 40 ? '...' : ''}" — ${words} palabras`
            : `${words} palabras — sin título aún`;
        showAutoSaveToast('💾 Borrador guardado', detail);

        // Actualizar indicador de borrador local
        const hasContent = data.content_md && data.content_md.length > 10;
        const hasTitle = data.title && data.title.length > 3;
        if (hasContent || hasTitle) {
            updateDraftIndicator(true);
            updateStatusBadge('draft_local');
        }
    } catch (e) {
        console.warn('Error en auto-save:', e);
    }
}

// Auto-save cada 15 segundos (HU-017 Fase 4)
autoSaveTimer = setInterval(performAutoSave, 15000);

// ======================================================
// 5b. Modal de recuperación de borrador (reemplaza confirm())
// ======================================================
function showDraftRecoveryModal(draftData) {
    const modalEl = document.getElementById('draftRecoveryModal');
    if (!modalEl) return;

    // Calcular antigüedad
    const age = draftData._timestamp || null;
    document.getElementById('draft-age').textContent = formatTimeAgo(age);

    // Mostrar resumen
    const words = getWordCount(draftData.content_md || '');
    document.getElementById('draft-title-display').textContent = draftData.title || '—';
    document.getElementById('draft-words-display').textContent = words;
    document.getElementById('draft-category-display').textContent = draftData.category || '—';

    // Configurar botones
    const recoverBtn = document.getElementById('modal-recover-draft');
    const discardBtn = document.getElementById('modal-discard-draft');

    // Limpiar listeners previos clonando y reemplazando
    const newRecoverBtn = recoverBtn.cloneNode(true);
    recoverBtn.parentNode.replaceChild(newRecoverBtn, recoverBtn);
    const newDiscardBtn = discardBtn.cloneNode(true);
    discardBtn.parentNode.replaceChild(newDiscardBtn, discardBtn);

    newRecoverBtn.addEventListener('click', () => {
        restoreDraft(draftData);
        // BS4: cerrar modal vía jQuery
        $('#draftRecoveryModal').modal('hide');
    });

    newDiscardBtn.addEventListener('click', () => {
        discardDraft();
        // BS4: cerrar modal vía jQuery
        $('#draftRecoveryModal').modal('hide');
    });

    // Mostrar modal BS4 con backdrop static
    $('#draftRecoveryModal').modal({ backdrop: 'static', keyboard: false });
}

/**
 * Muestra el modal de confirmación para eliminar un archivo.
 * @param {string} filename Nombre del archivo a eliminar.
 */
function confirmDeleteFile(filename) {
    pendingDeleteFilename = filename;
    // Actualizar título del modal con el nombre del archivo
    const titleEl = document.getElementById('deleteFileModalTitle');
    if (titleEl) titleEl.textContent = filename;
    // Mostrar modal usando Bootstrap 4 (jQuery)
    $('#deleteFileModal').modal('show');
}

/**
 * Ejecuta la eliminación del archivo después de la confirmación del usuario.
 * Llama a la lógica existente removeUploadedFile que elimina la vista previa,
 * la línea markdown y envía la petición al backend.
 */
function executeDeleteFile() {
    if (!pendingDeleteFilename) return;
    // Ocultar modal antes de iniciar la operación
    $('#deleteFileModal').modal('hide');
    // Utilizar la función ya definida que maneja la eliminación completa
    removeUploadedFile(pendingDeleteFilename);
    pendingDeleteFilename = null;
}

function restoreDraft(data) {
    // Si el borrador incluye slug (artículo ya creado previamente), lo asignamos para que el fallback de imágenes funcione.
    if (data.slug) {
        document.getElementById('edit-slug').value = data.slug;
    }
    document.getElementById('title').value = data.title || '';
    document.getElementById('description').value = data.description || '';
    // Manejar categoría: si coincide con una opción existente, usar select; de lo contrario, activar checkbox y usar input libre
    const catSelect = document.getElementById('category');
    const catInput = document.getElementById('new_category');
    const catToggle = document.getElementById('category-toggle-new');
    const existingOption = Array.from(catSelect.options).some(opt => opt.value === data.category);
    if (existingOption) {
        catSelect.value = data.category;
        if (catToggle) catToggle.checked = false;
        if (catInput) {
            catInput.value = '';
            document.getElementById('new-category-wrapper').classList.add('d-none');
        }
    } else if (data.category) {
        // No coincide, usar nuevo campo
        if (catToggle) catToggle.checked = true;
        if (catInput) {
            catInput.value = data.category;
            document.getElementById('new-category-wrapper').classList.remove('d-none');
        }
        catSelect.value = '';
    } else {
        // Sin categoría
        catSelect.value = '';
        if (catToggle) catToggle.checked = false;
        if (catInput) {
            catInput.value = '';
            document.getElementById('new-category-wrapper').classList.add('d-none');
        }
    }
    tags = data.tags || [];
    renderTags();
    document.getElementById('meta_title').value = data.meta_title || '';
    document.getElementById('meta_description').value = data.meta_description || '';
    document.getElementById('palabra_clave_principal').value = data.palabra_clave_principal || '';
    document.getElementById('keywords').value = data.keywords || '';
    document.getElementById('tiempo_lectura').value = data.tiempo_lectura || 1;
    easyMDE.value(data.content_md || '');
    if (data.files && data.files.length > 0) {
        data.files.forEach(f => {
            uploadedFiles.push(f);
            renderUploadedFile(f);
        });
    }
    document.getElementById('status-message').innerHTML =
        '<div class="alert alert-info alert-dismissible fade show" role="alert">📝 Borrador recuperado de localStorage<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
    updateDraftIndicator(true);
    updateStatusBadge('draft_local');
}

function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    updateDraftIndicator(false);
    // Si no hay artículo cargado, volver a estado 'new'
    const slug = document.getElementById('edit-slug').value;
    if (!slug) {
        updateStatusBadge('new');
    }
    document.getElementById('status-message').innerHTML =
        '<div class="alert alert-secondary alert-dismissible fade show" role="alert">🗑️ Borrador local descartado<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
}

// ======================================================
// 5c. Al cargar la página: detectar draft y mostrar modal
// ======================================================
window.addEventListener('load', () => {
    // FASE 5 HU-019: Mostrar estado vacío si no hay archivos
    if (uploadedFiles.length === 0) {
        showUploadedFilesEmpty();
    }

    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft) {
        // Verificar si hay artículo cargado para actualizar badge
        const slug = document.getElementById('edit-slug').value;
        if (!slug) {
            updateDraftIndicator(false);
            updateStatusBadge('new');
        }
        return;
    }
    let data;
    try {
        data = JSON.parse(draft);
    } catch (e) {
        localStorage.removeItem(DRAFT_KEY);
        return;
    }
    const hasContent = data.content_md && data.content_md.length > 10;
    const hasTitle = data.title && data.title.length > 3;
    if (!hasContent && !hasTitle) {
        localStorage.removeItem(DRAFT_KEY);
        updateDraftIndicator(false);
        return;
    }

    // Mostrar modal de recuperación
    showDraftRecoveryModal(data);
});

// ======================================================
// 6. Botón "Guardar"
// ======================================================
document.getElementById('btn-save').addEventListener('click', async () => {
    const data = collectFormData();
    if (!data.title.trim()) {
        document.getElementById('status-message').innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert">El título es obligatorio<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
        return;
    }
    if (!data.description.trim()) {
        document.getElementById('status-message').innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert">La descripción es obligatoria<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
        return;
    }
    if (!data.category) {
        document.getElementById('status-message').innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert">La categoría es obligatoria<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
        return;
    }
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    document.getElementById('status-message').innerHTML = '';
    try {
        const response = await fetch('/blog/api/save-blog/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        console.log('🐛 [DEBUG] save response =', result);
        if (response.ok) {
            // Guardado exitoso → marcamos como guardado para que no aparezca la alerta de salida
            isSaved = true;
            localStorage.removeItem(DRAFT_KEY);
            updateDraftIndicator(false);
            if (result.published) {
                document.getElementById('status-message').innerHTML = `<div class="alert alert-process-editor__container alert-success alert-dismissible fade show" role="alert">Artículo publicado. <a href="/blog/${result.slug}/" class="alert-process-editor alert-link">Ver artículo</a><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>`;
                updateStatusBadge('published');
            } else {
                document.getElementById('status-message').innerHTML = '<div class="alert alert-process-editor__container alert-warning alert-dismissible fade show" role="alert">Borrador guardado. Pendiente de aprobación. <a href="/blog/" class="alert-process-editor alert-link"><i class="fas fa-list"></i> Ver lista de artículos</a><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
                updateStatusBadge('pending');
            }
        } else {
            document.getElementById('status-message').innerHTML = `<div class="alert alert-process-editor__container alert-danger alert-dismissible fade show" role="alert">Error: ${result.error || 'Error desconocido'}<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>`;
        }
    } catch (err) {
        document.getElementById('status-message').innerHTML = `<div class="alert alert-process-editor__container alert-danger alert-dismissible fade show" role="alert">Error de conexión: ${err.message}<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = document.querySelector('#btn-save').dataset.originalText || 'Guardar';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-save');
    if (btn) btn.dataset.originalText = btn.innerHTML.trim();
    // Inicializar comportamiento del toggle de categoría nueva
    const catToggle = document.getElementById('category-toggle-new');
    const catSelectWrapper = document.getElementById('category-select-wrapper');
    const catSelect = document.getElementById('category');
    const newCatWrapper = document.getElementById('new-category-wrapper');
    const newCatInput = document.getElementById('new_category');
    if (catToggle && catSelectWrapper && catSelect && newCatWrapper && newCatInput) {
        const updateVisibility = () => {
            if (catToggle.checked) {
                // Mostrar input libre, ocultar select
                catSelectWrapper.classList.add('d-none');
                newCatWrapper.classList.remove('d-none');
                catSelect.value = '';
            } else {
                // Mostrar select, ocultar input
                catSelectWrapper.classList.remove('d-none');
                newCatWrapper.classList.add('d-none');
                newCatInput.value = '';
            }
        };
        // Ejecutar al cargar y al cambiar
        updateVisibility();
        catToggle.addEventListener('change', updateVisibility);
    }
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

/**
 * Envía la petición al backend para eliminar físicamente el archivo.
 * Utiliza la constante global `DELETE_FILE_URL` que se define en la plantilla
 * `blog_editor.html`. Se envía el nombre del archivo y, si está disponible, el
 * slug de la carpeta del artículo (campo oculto `edit-slug`).
 */
function deleteFileOnServer(filename) {
    if (!filename) return Promise.resolve();
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('filename', filename);
    // El slug (folder) puede estar vacío al crear un nuevo artículo; en ese
    // caso el backend lo ignora.
    const folder = document.getElementById('edit-slug')?.value;
    if (folder) formData.append('folder', folder);
    return fetch(DELETE_FILE_URL, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData,
    }).catch(err => {
        console.warn('Error al eliminar archivo en el servidor:', err);
    });
}

// ======================================================
// beforeunload: guardar en localStorage, sin diálogo nativo
// ======================================================
window.addEventListener('beforeunload', (e) => {
    const data = collectFormData();
    if (!isSaved && data.content_md && data.content_md.length > 10) {
        // Siempre guardar en localStorage antes de salir
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        // No llamamos a e.preventDefault() ni e.returnValue
        // para evitar el diálogo nativo del navegador
    }
});

// ======================================================
// Eventos adicionales de auto-save (HU-017 Fase 4)
// ======================================================

// Al perder visibilidad de la pestaña
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        performAutoSave();
    }
});

// Al hacer clic en Cancelar (forzar auto-save antes de salir)
document.querySelector('.editor-btn-cancel')?.addEventListener('click', (e) => {
    performAutoSave();
    // La navegación la maneja el onclick del HTML
});

// ======================================================
// Botón "Descartar borrador" en el indicador y toast
// ======================================================

// Botón en el indicador del sidebar
document.getElementById('btn-discard-draft')?.addEventListener('click', () => {
    $('#confirmDiscardModal').modal('show');
});

// Botón en el toast
document.getElementById('toast-discard-draft')?.addEventListener('click', () => {
    $('#confirmDiscardModal').modal('show');
});

// Confirmación de descarte
document.getElementById('confirm-discard-btn')?.addEventListener('click', () => {
    discardDraft();
    $('#confirmDiscardModal').modal('hide');
});

// ======================================================
// 7. Modo Edición: cargar artículo existente
// ======================================================
(async function loadExistingArticle() {
    // Reiniciar el estado de archivos para evitar duplicados al cargar un artículo
    uploadedFiles.length = 0;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let editSlug = '';
    if (pathParts.length >= 3 && pathParts[0] === 'blog' && pathParts[1] === 'editor') {
        editSlug = pathParts[2];
    }
    if (!editSlug) return;
    localStorage.removeItem(DRAFT_KEY);
    updateDraftIndicator(false);
    document.getElementById('edit-slug').value = editSlug;
    try {
        const response = await fetch(`/blog/api/get-blog/${editSlug}/`);
        if (!response.ok) throw new Error('Artículo no encontrado');
        const data = await response.json();
        const fm = data.frontmatter;
        document.getElementById('title').value = fm.title || '';
        document.getElementById('description').value = fm.description || '';
        document.getElementById('category').value = fm.category || '';
        tags = fm.tags || [];
        renderTags();
        document.getElementById('meta_title').value = fm.meta_title || '';
        document.getElementById('meta_description').value = fm.meta_description || '';
        document.getElementById('palabra_clave_principal').value = fm.palabra_clave_principal || '';
        document.getElementById('keywords').value = fm.keywords || '';
        document.getElementById('tiempo_lectura').value = fm.tiempo_lectura || 1;
        easyMDE.value(data.content_md || '');
        // 🐛 DEBUG temporal: mostrar lo que llega del backend
        console.log('🐛 [DEBUG] data.frontmatter =', data.frontmatter);
        console.log('🐛 [DEBUG] fm.cover_image =', fm.cover_image);
        console.log('🐛 [DEBUG] fm.image =', fm.image);
        console.log('🐛 [DEBUG] data.existing_files =', data.existing_files);

        // Actualizar badge según estado del artículo
        if (data.is_published) {
            updateStatusBadge('published');
        } else if (data.moderation_status === 'pending') {
            updateStatusBadge('pending');
        } else {
            updateStatusBadge('new');
        }

        // Procesar archivos existentes del artículo
        if (data.existing_files && data.existing_files.length > 0) {
            let resolvedCoverName = '';
            const coverRaw = fm.cover_image || fm.image || '';
            const coverName = coverRaw ? coverRaw.split('/').pop() : '';
            data.existing_files.forEach(file => {
                const isCover = file.filename === coverName;
                file.is_cover = isCover;
                if (isCover) resolvedCoverName = file.filename;
                // Deteccion: si el archivo está envuelto en bloques :::no-import:::
                const hiddenPattern = new RegExp(`:::no-import:::[\\s\\S]*?${file.filename}[\\s\\S]*?:::final-no-import:::`, 'i');
                file.hidden = hiddenPattern.test(data.content_md);
                console.log('🐛 [DEBUG] file =', file.filename, 'isCover =', isCover, 'hidden =', file.hidden);
                uploadedFiles.push(file);
                renderUploadedFile(file);
            });
            // Asegurar que la portada quede marcada visualmente
            if (resolvedCoverName && typeof setAsCover === 'function') {
                setAsCover(resolvedCoverName);
            }
        } else {
            console.warn('🐛 [DEBUG] data.existing_files está vacío o es null');
        }
        // Sincronizar el campo de portada con la imagen marcada
        const coverInput = document.getElementById('cover_image');
        if (coverInput) {
            const currentCover = getCoverFilename();
            coverInput.value = currentCover;
        }
        document.title = `Editando: ${fm.title || editSlug} | Editor Blog`;
        document.getElementById('status-message').innerHTML = '<div class="alert alert-success alert-dismissible fade show" role="alert">Artículo cargado. Cambios se guardan en la misma carpeta.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
        
        // Forzar refresco de widgets de imagen/video para que el artículo cargado
        // muestre sus widgets MTP (incluyendo [youtube:ID]) nada más abrir el editor.
        try { refreshImageWidgets(); } catch (e) { /* ignore */ }
    } catch (err) {
        console.error('Error cargando artículo:', err);
        document.getElementById('status-message').innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert">Error al cargar artículo: ${err.message}<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>`;
    }
})();

// ======================================================
// HU-20-C-V1: Funciones auxiliares del selector de imágenes
// ======================================================


function detectImageContext() {
    if (!easyMDE) return { mode: 'normal', startLine: null };
    
    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    const cursor = doc.getCursor();
    const currentLine = cursor.line;
    
    // Buscar hacia arriba desde la línea actual
    let mode = 'normal';
    let startLine = null;
    
    for (let i = currentLine; i >= 0; i--) {
        const lineText = doc.getLine(i) || '';
        const trimmed = lineText.trim();
        
        // Detectar bloques de apertura
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
        // Detectar cierre de bloques
        if (/^:::\s*$/.test(trimmed)) {
            // Encontramos un cierre genérico, salir (ya no estamos dentro del bloque)
            break;
        }
        // Si encontramos cualquier otro bloque especial, también salimos
        if (/^:::/.test(trimmed) && !/^:::\s*(slides|popup:gallery)\s*$/.test(trimmed)) {
            break;
        }
    }
    
    return { mode, startLine };
}

// ======================================================
// FASE 1 HU-20-C-V1-ADD: Utilidades de detección de líneas de imagen
// ======================================================

/** Regex para detectar una línea de imagen (modo normal o slides/gallery). */
function getImageLineRegex() {
    // Acepta: ![texto](ruta), ![texto|desc](ruta) y variantes con ./ o ruta relativa
    return /^!\[[^\]]*\]\([^)]+\)\s*$/;
}

/** Retorna { lineNumber, text } para cada línea de imagen en el documento. */
function getImageLines() {
    const cm = easyMDE ? easyMDE.codemirror : null;
    if (!cm) return [];
    const doc = cm.getDoc();
    const total = doc.lineCount();
    const result = [];
    const regex = getImageLineRegex();
    for (let i = 0; i < total; i++) {
        const text = doc.getLine(i) || '';
        if (regex.test(text.trim())) {
            result.push({ lineNumber: i, text });
        }
    }
    return result;
}

/** true si la línea indicada es una línea de imagen. */
function isImageLine(lineNumber) {
    const cm = easyMDE ? easyMDE.codemirror : null;
    if (!cm) return false;
    const text = cm.getDoc().getLine(lineNumber) || '';
    return getImageLineRegex().test(text.trim());
}

// ======================================================
// FASE 4 HU-20-C-V1-ADD: Drag & drop de líneas de imagen
// ======================================================

window.imageDragActive = false;
window.imageDragOriginLine = null;
window.imageDragText = '';
window.imageDragGuideEl = null;

function startImageDrag(lineNumber, triggerElement) {
    const cm = easyMDE ? easyMDE.codemirror : null;
    if (!cm) return;

    const widgetEntry = imageWidgets[lineNumber];
    const isYouTube = widgetEntry && widgetEntry.type === 'youtube';
    if (!isImageLine(lineNumber) && !isYouTube) return;

    const text = cm.getDoc().getLine(lineNumber) || '';
    if (!text) return;

    window.imageDragActive = true;
    window.imageDragOriginLine = lineNumber;
    window.imageDragText = text;

    // Marcar línea origen (por vía del widget, no del handle interno)
    if (widgetEntry && widgetEntry.node) {
        widgetEntry.node.classList.add('img-line-dragging');
    }

    // Crear marcador de línea completo (placeholder profesional) LIMITADO al área del editor
    const guide = document.createElement('div');
    guide.className = 'CodeMirror-lines img-drop-guide';
    // IMPORTANTE: Agregar como hijo del wrapper del CodeMirror para que se posicione SOLO dentro del editor
    const editorWrapper = cm.getWrapperElement();
    editorWrapper.style.position = 'relative'; // Asegurar que el wrapper sea el contexto de posición
    guide.style.cssText = 'position:absolute;left:0;right:0;height:24px;pointer-events:none;z-index:9999;background:rgba(59,130,246,0.15);border-top:2px solid #3b82f6;border-bottom:2px solid #3b82f6;box-shadow:0 0 12px 3px rgba(59,130,246,0.4);animation:imgDropGuidePulse 1.5s ease-in-out infinite;';
    window.imageDragGuideEl = guide;
    editorWrapper.appendChild(guide);
    
    // Animación CSS keyframes via JS (evita agregar CSS)
    if (!window._imgDropGuideStylesInjected) {
        const styleEl = document.createElement('style');
        styleEl.id = 'img-drop-guide-styles';
        styleEl.textContent = '@keyframes imgDropGuidePulse{0%,100%{background:rgba(59,130,246,0.1);box-shadow:0 0 16px 4px rgba(59,130,246,0.5);}50%{background:rgba(59,130,246,0.2);box-shadow:0 0 20px 6px rgba(59,130,246,0.7);}}';
        document.head.appendChild(styleEl);
        window._imgDropGuideStylesInjected = true;
    }

    // Listeners globales
    document.addEventListener('mousemove', moveImageDragGuide);
    document.addEventListener('mouseup', endImageDrag);
    document.addEventListener('keydown', cancelImageDragOnEscape);
}

function moveImageDragGuide(event) {
    if (!window.imageDragActive) return;
    const cm = easyMDE ? easyMDE.codemirror : null;
    if (!cm) return;

    const pos = cm.coordsChar({ left: 0, top: event.clientY });
    const lineInfo = cm.charCoords(pos, 'page');
    const top = lineInfo.top;
    const editorRect = cm.getWrapperElement().getBoundingClientRect();

    if (window.imageDragGuideEl) {
        // Solo mostrar si el mouse está DENTRO del área del editor
        if (event.clientY >= editorRect.top && event.clientY <= editorRect.bottom) {
            // Posicionar relativo al wrapper del editor (NO a toda la pantalla)
            const relativeTop = top - editorRect.top + cm.getScrollInfo().top - 12;
            window.imageDragGuideEl.style.top = relativeTop + 'px';
            window.imageDragGuideEl.style.display = 'block';
            window.imageDragGuideEl.style.transform = 'none';
        } else {
            // Ocultar si el mouse está fuera del editor
            window.imageDragGuideEl.style.display = 'none';
        }
    }
}

function endImageDrag(event) {
    if (!window.imageDragActive) return;
    const cm = easyMDE ? easyMDE.codemirror : null;

    // Guardar valores en variables locales ANTES de cleanup
    const origin = window.imageDragOriginLine;
    const text = window.imageDragText;

    cleanupImageDragState();

    if (!cm) return;

    try {
        const pos = cm.coordsChar({ left: 0, top: event.clientY });
    let destLine = Math.min(pos.line, cm.getDoc().lineCount() - 1);

        if (destLine !== origin && text) {
            // Eliminar línea origen primero y recalcular destino según reindexado
            cm.getDoc().replaceRange('', {
                line: origin,
                ch: 0
            }, {
                line: origin + 1,
                ch: 0
            });

            let adjusted = destLine;
            if (destLine > origin) {
                adjusted = Math.max(0, destLine - 1);
            }
            const maxLine = cm.getDoc().lineCount() - 1;
            adjusted = Math.min(adjusted, maxLine);

            // Reinsertar en destino corregido (línea 0..N, ch 0)
            cm.getDoc().replaceRange(text + '\n', {
                line: adjusted,
                ch: 0
            });

            // Refrescar widgets tras mover
            setTimeout(refreshImageWidgets, 100);
        }
    } catch (e) {
        console.warn('[HU-20-C-V1-ADD] Error en endImageDrag:', e);
    }
}

function cancelImageDragOnEscape(event) {
    if (!window.imageDragActive) return;
    if (event.key === 'Escape') {
        cleanupImageDragState();
    }
}

function cleanupImageDragState() {
    document.removeEventListener('mousemove', moveImageDragGuide);
    document.removeEventListener('mouseup', endImageDrag);
    document.removeEventListener('keydown', cancelImageDragOnEscape);

    if (window.imageDragGuideEl && window.imageDragGuideEl.parentElement) {
        window.imageDragGuideEl.parentElement.removeChild(window.imageDragGuideEl);
        window.imageDragGuideEl = null;
    }

    // Limpiar clase .img-line-dragging desde el widget asociado
    const cm = easyMDE ? easyMDE.codemirror : null;
    if (cm && typeof window.imageDragOriginLine === 'number') {
        try {
            const entry = imageWidgets[window.imageDragOriginLine];
            if (entry && entry.node && entry.node.classList) {
                entry.node.classList.remove('img-line-dragging');
            }
        } catch (e) { /* ignore */ }
    }

    window.imageDragActive = false;
    window.imageDragOriginLine = null;
    window.imageDragText = '';
}

// -------------------------------------------------
// Bloque de arrastre para ::slides / ::popup:gallery
// -------------------------------------------------

// Estado global del arrastre de bloques
window.blockDragActive = false;
window.blockDragStartLine = null;
window.blockDragEndLine = null;
window.blockDragTextLines = null;
window.blockDragGuideEl = null;

/**
 * Inicia el arrastre de un bloque completo (:::slides o :::popup:gallery).
 * Detecta automáticamente la línea de cierre ":::" y guarda el contenido.
 * @param {number} startLine - Línea donde comienza el bloque (línea con ":::slides" o ":::popup:gallery").
 */
function startBlockDrag(startLine) {
    const cm = easyMDE ? easyMDE.codemirror : null;
    if (!cm) return;

    const doc = cm.getDoc();
    const totalLines = doc.lineCount();
    let endLine = startLine;
    // Buscar la línea de cierre ":::"
    for (let i = startLine + 1; i < totalLines; i++) {
        const txt = (doc.getLine(i) || '').trim();
        if (txt === ':::') {
            endLine = i;
            break;
        }
    }

    const lines = [];
    for (let i = startLine; i <= endLine; i++) {
        lines.push(doc.getLine(i));
    }

    window.blockDragActive = true;
    window.blockDragStartLine = startLine;
    window.blockDragEndLine = endLine;
    window.blockDragTextLines = lines;

    // Marcar visualmente el widget del bloque origen (similar a imágenes)
    const entry = imageWidgets[startLine];
    if (entry && entry.node) {
        entry.node.classList.add('img-line-dragging');
    }

    // Crear guía visual dentro del editor (similar a la de imágenes)
    // Reutilizamos la variable global `cm` ya declarada al inicio del archivo.
    // No redeclaramos con `const` para evitar colisión de identificadores.
    const cmInstance = easyMDE ? easyMDE.codemirror : null;
    if (!cmInstance) return;

    const editorWrapper = cmInstance.getWrapperElement();
    editorWrapper.style.position = 'relative';

    const guide = document.createElement('div');
    guide.className = 'CodeMirror-lines img-drop-guide';
    guide.style.cssText = 'position:absolute;left:0;right:0;height:24px;pointer-events:none;z-index:9999;background:rgba(59,130,246,0.15);border-top:2px solid #3b82f6;border-bottom:2px solid #3b82f6;box-shadow:0 0 12px 3px rgba(59,130,246,0.4);animation:imgDropGuidePulse 1.5s ease-in-out infinite;';
    window.blockDragGuideEl = guide;
    editorWrapper.appendChild(guide);

    // Animación CSS keyframes (solo una vez)
    if (!window._imgDropGuideStylesInjected) {
        const styleEl = document.createElement('style');
        styleEl.id = 'img-drop-guide-styles';
        styleEl.textContent = '@keyframes imgDropGuidePulse{0%,100%{background:rgba(59,130,246,0.1);box-shadow:0 0 16px 4px rgba(59,130,246,0.5);}50%{background:rgba(59,130,246,0.2);box-shadow:0 0 20px 6px rgba(59,130,246,0.7);}}';
        document.head.appendChild(styleEl);
        window._imgDropGuideStylesInjected = true;
    }

    // Listeners globales para movimiento y finalización
    document.addEventListener('mousemove', moveBlockDragGuide);
    document.addEventListener('mouseup', endBlockDrag);
    document.addEventListener('keydown', cancelBlockDragOnEscape);
}

function moveBlockDragGuide(event) {
    if (!window.blockDragActive) return;
    const cm = easyMDE ? easyMDE.codemirror : null;
    if (!cm) return;
    const editorRect = cm.getWrapperElement().getBoundingClientRect();
    if (event.clientY < editorRect.top || event.clientY > editorRect.bottom) {
        if (window.blockDragGuideEl) window.blockDragGuideEl.style.display = 'none';
        return;
    }
    const pos = cm.coordsChar({ left: 0, top: event.clientY });
    const lineInfo = cm.charCoords(pos, 'page');
    const top = lineInfo.top;
    const relativeTop = top - editorRect.top + cm.getScrollInfo().top - 12;
    if (window.blockDragGuideEl) {
        window.blockDragGuideEl.style.top = relativeTop + 'px';
        window.blockDragGuideEl.style.display = 'block';
    }
}

function endBlockDrag(event) {
    if (!window.blockDragActive) return;
    const cm = easyMDE ? easyMDE.codemirror : null;
    if (!cm) return;

    // Guardar valores críticos ANTES del cleanup
    const origin = window.blockDragStartLine;
    const endLine = window.blockDragEndLine;
    const lines = window.blockDragTextLines || [];
    const text = lines.join('\n');

    // Limpiar estado UI y referencias
    cleanupBlockDragState();

    if (!text || typeof origin !== 'number') return;

    try {
        const pos = cm.coordsChar({ left: 0, top: event.clientY });
    let destLine = Math.min(pos.line, cm.getDoc().lineCount() - 1);

        if (destLine !== origin) {
            // Eliminar bloque original
            cm.getDoc().replaceRange('', { line: origin, ch: 0 }, { line: (endLine || origin) + 1, ch: 0 });
            // Ajustar destino según desplazamiento de líneas
            if (destLine > origin) destLine = Math.max(0, destLine - ((endLine || origin) - origin + 1));
            // Reinsertar bloque en nueva ubicación
            cm.getDoc().replaceRange(text + '\n', { line: destLine, ch: 0 });
            // Refrescar widgets tras mover
            setTimeout(refreshImageWidgets, 100);
        }
    } catch (e) {
        console.warn('[HU-20-B] Error en endBlockDrag:', e);
    }
}

function cancelBlockDragOnEscape(event) {
    if (!window.blockDragActive) return;
    if (event.key === 'Escape') {
        cleanupBlockDragState();
    }
}

function cleanupBlockDragState() {
    document.removeEventListener('mousemove', moveBlockDragGuide);
    document.removeEventListener('mouseup', endBlockDrag);
    document.removeEventListener('keydown', cancelBlockDragOnEscape);
    if (window.blockDragGuideEl && window.blockDragGuideEl.parentElement) {
        window.blockDragGuideEl.parentElement.removeChild(window.blockDragGuideEl);
        window.blockDragGuideEl = null;
    }
    // Limpiar widget del bloque original desde CodeMirror + DOM y quitar referencias
    const cm = easyMDE ? easyMDE.codemirror : null;
    if (cm && typeof window.blockDragStartLine === 'number') {
        const startLine = window.blockDragStartLine;
        // Limpiar blockWidgets
        const blockEntry = blockWidgets[startLine];
        if (blockEntry) {
            if (blockEntry.widget) {
                try { blockEntry.widget.clear(); } catch (e) { /* ignore */ }
            }
            if (blockEntry.node && blockEntry.node.parentElement) {
                try { blockEntry.node.parentElement.removeChild(blockEntry.node); } catch (e) { /* ignore */ }
            }
            delete blockWidgets[startLine];
        }
        // Limpiar imageWidgets y clase dragging
        const imgEntry = imageWidgets[startLine];
        if (imgEntry && imgEntry.node) {
            imgEntry.node.classList.remove('img-line-dragging');
        }
        delete imageWidgets[startLine];
    }
    window.blockDragActive = false;
    window.blockDragStartLine = null;
    window.blockDragEndLine = null;
    window.blockDragTextLines = null;
}

function openImageSelectorModal() {
    if (!easyMDE) return;
    
    // Guardar la posición del cursor antes de abrir el modal
    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    window._imageSelectorCursor = doc.getCursor();
    
    const modeInfo = detectImageContext();
    window.selectedImageMode = modeInfo.mode;
    
    // Actualizar badge del modo
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
    
    // Mostrar/ocultar campos título/descripción según modo
    if (fieldsWrapper) {
        if (modeInfo.mode === 'slides' || modeInfo.mode === 'popup:gallery') {
            fieldsWrapper.classList.remove('d-none');
        } else {
            fieldsWrapper.classList.add('d-none');
        }
    }
    
    // Limpiar inputs
    const titleInput = document.getElementById('selector-title');
    const descInput = document.getElementById('selector-description');
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    
    // Poblar grid de imágenes existentes
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
                
                // Imagen thumbnail
                const img = document.createElement('img');
                img.className = 'selector-thumb';
                img.src = file.url || `/media/blog_editor_temp/${document.body.dataset.userId}/${file.filename}`;
                img.alt = file.filename;
                img.loading = 'lazy';
                
                // Fallback si falla la carga
                img.onerror = function() {
                    this.src = `/static/blog/images/no-image.png`;
                };
                
                // Nombre del archivo
                const name = document.createElement('div');
                name.className = 'uploaded-filename';
                name.textContent = file.filename;
                name.style.fontSize = '0.65rem';
                name.style.padding = '4px';
                
                item.appendChild(img);
                item.appendChild(name);
                
                // Click handler: seleccionar imagen
                item.addEventListener('click', function() {
                    // Remover clase selected de otros items
                    grid.querySelectorAll('.selector-thumb-item').forEach(el => {
                        el.classList.remove('is-selected');
                    });
                    // Marcar este como seleccionado
                    this.classList.add('is-selected');
                    
                    // Guardar filename seleccionado y habilitar botón
                    window.selectedImageFilename = file.filename;
                    const selectBtn = document.getElementById('selector-select-btn');
                    if (selectBtn) selectBtn.disabled = false;
                });
                
                grid.appendChild(item);
            });
        }
    }
    
    // Resetear estado
    window.imageSelectorOpen = true;
    window.selectedImageFilename = null;
    
    // Abrir modal
    $('#imageSelectorModal').modal('show');
    
    // Focus en primer campo visible si hay título/descripción
    if (modeInfo.mode === 'slides' || modeInfo.mode === 'popup:gallery') {
        setTimeout(() => {
            if (titleInput) titleInput.focus();
        }, 300);
    }
}


function insertImageInEditor(filename, title, description, mode) {
    if (!easyMDE || !filename) return;
    
    // Restaurar cursor al lugar original antes de abrir el modal
    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    
    // Reconstruir el texto markdown según el modo
    let markdown;
    if (mode === 'slides' || mode === 'popup:gallery') {
        const titleText = (title || 'Título').trim();
        const descText = (description || 'Descripción').trim();
        markdown = `![${titleText}|${descText}](./${filename})\n`;
    } else {
        markdown = `![${filename}](./${filename})\n`;
    }
    
    // Insertar en la posición guardada o en el cursor actual
    const cursor = window._imageSelectorCursor || doc.getCursor();
    doc.replaceRange(markdown, cursor);
    
    // Limpiar estado del selector
    window.imageSelectorOpen = false;
    window.selectedImageFilename = null;
    window.selectedImageMode = null;
    window._imageSelectorCursor = null;
    
    // Refrescar widgets de imagen para que aparezca el menú ⋮
    setTimeout(refreshImageWidgets, 100);
    
    // Focus de vuelta en el editor
    cm.focus();
}


// ======================================================
// HU-20-D: MTP Toolbar - delegación al módulo externo
// ======================================================
console.log('[blog_editor][index] mtp-toolbar delegado a modulo externo');

let MTP_TEMPLATES = null;
let insertMtpTemplate = null;
let openWidgetHelpModal = null;
let initMtpToolbar = null;

try {
    if (typeof window !== 'undefined') {
      const init = async () => {
        try {
      // Importar el módulo MTP Toolbar usando ruta relativa, ya que este archivo
      // se sirve como recurso estático y no pasa por el motor de plantillas de Django.
      // Forzar modo de desarrollo: desactivar la bandera de producción antes de cargar.
      window.MTP_PRODUCTION = false;
      const mod = await import('./mtp-toolbar.js');
          // Exponer funciones y variables globales
          window.MTP_TEMPLATES = mod.MTP_TEMPLATES;
          window.insertMtpTemplate = mod.insertMtpTemplate;
          window.openWidgetHelpModal = mod.openWidgetHelpModal;
          window.initMtpToolbar = mod.initMtpToolbar;
          // Preservar variables legacy
          MTP_TEMPLATES = mod.MTP_TEMPLATES;
          insertMtpTemplate = mod.insertMtpTemplate;
          openWidgetHelpModal = mod.openWidgetHelpModal;
          // Inicializar la barra de herramientas MTP después de cargar el módulo
          if (typeof window.initMtpToolbar === 'function') {
              try {
                  window.initMtpToolbar();
              } catch (e) {
                  console.warn('[blog_editor][index] Error al inicializar MTP Toolbar:', e);
              }
          }
        } catch (e) {
          console.warn('[blog_editor][index] No se pudo cargar mtp-toolbar.js:', e);
        }
      };
      init();
    }
} catch (e) {
  // Si la importación dinámica no es soportada, el código legacy queda en index.js como fallback
}




















