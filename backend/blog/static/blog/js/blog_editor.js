// ======================================================
// HU-011 + HU-017: Blog Editor JavaScript
// EasyMDE + FilePond + auto-save + mejoras borradores
// ======================================================
// Task progress updated below.
/*
   TODO LIST (progress tracking)
   - [x] Verificar que la expresión regular elimina solo la imagen solicitada
   - [x] Implementar borrado completo de recursos desde el Editor (frontend + backend)
   - [ ] Probar la eliminación en el navegador y validar que los contadores y markdown se actualizan
   - [ ] Documentar la nueva funcionalidad en la HU correspondiente
*/

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

// FASE 5 HU-019: Referencia al contenedor para estado vacío
const uploadedFilesContainer = document.getElementById('uploaded-files');
console.log('Contenedor de archivos subidos:', uploadedFilesContainer);
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
    const container = uploadedFilesContainer;
    if (!container) return;

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
    const safe = filename.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
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
    // Prevenir que CodeMirror inserte nombres de archivo como texto cuando se arrastran archivos
    if (event.dataTransfer.files.length > 0) {
        event.preventDefault();
    }
});

// ======================================================
// 1c. HU-20-B: Widget flotante con menú por línea de imagen/video
// ======================================================

// Almacén de widgets activos (lineNumber -> {widget, node, menuOpen, widgetId})
let imageWidgets = {};
let imageWidgetCleanup = null;
// Contador para IDs únicos de widgets
let widgetIdCounter = 0;

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
    widget.className = 'img-line-widget';
    widget.id = widgetId;
    widget.dataset.line = lineNumber;
    widget.dataset.filename = filename;

    // Botón del menú (⋮ tres puntos verticales)
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'img-line-menu-btn';
    btn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    btn.setAttribute('aria-label', 'Opciones de imagen');
    btn.setAttribute('title', 'Opciones');

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

    widget.appendChild(btn);
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

    // Acciones reales del menú de línea de imagen
    dropdown.querySelectorAll('.img-line-dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            var action = this.dataset.action;
            console.log('[HU-20-B] Acción:', action, 'para', filename);
            
            if (action === 'delete') {
                // Eliminar línea markdown del editor
                deleteImageLineFromEditor(lineNumber, filename);
                // Limpiar widget del CodeMirror
                cleanupImageWidget(lineNumber);
                // Eliminar vista previa del grid de archivos subidos
                removeUploadedFilePreview(filename);
                // Eliminar del array local
                var idx = uploadedFiles.findIndex(function(f) { return f.filename === filename; });
                if (idx !== -1) uploadedFiles.splice(idx, 1);
                // Eliminar archivo físico del servidor
                deleteFileOnServer(filename);
                // Mostrar feedback sutil
                showStatusMessage('Archivo eliminado: ' + filename, 'info');
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
 */
function deleteImageLineFromEditor(lineNumber, filename) {
    if (!easyMDE || !filename) return;
    const doc = easyMDE.codemirror.getDoc();
    const safe = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const imgRegex = new RegExp(`^!\\[[^\\]]*\\]\\((\\.?\\/?)${safe}\\)\\s*\\n?`, 'gm');
    const videoRegex = new RegExp(`<video[^>]*src=["']\\.?\\/?${safe}["'][^>]*></video>\\s*\\n?`, 'g');
    let current = easyMDE.value();
    const updated = current
        .replace(imgRegex, '')
        .replace(videoRegex, '')
        .replace(/\n{3,}/g, '\n\n');
    if (updated !== current) {
        const cleaned = updated.replace(/^\s*:::final-no-import:::\s*$/gm, '');
        easyMDE.value(cleaned);
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
    var newWidgets = {};
    var foundImages = 0;
    
    for (var i = 0; i < totalLines; i++) {
        var lineText = doc.getLine(i) || '';
        var trimmed = lineText.trim();
        
        // Detectar imagen markdown o video HTML
        var isImage = /^!\[.*?\]\(.*?\)$/.test(trimmed);
        var isVideo = /^<video[^>]*src=.*><\/video>$/.test(trimmed);
        
        if (isImage || isVideo) {
            foundImages++;
            console.log('[HU-20-B] Linea', i, 'deteccion:', trimmed.substring(0, 60));
            
            // Extraer nombre de archivo
            var filename = '';
            if (isImage) {
                var match = trimmed.match(/\]\(\.?\/?(.*?)\)/);
                if (match) filename = match[1];
            } else {
                var match = trimmed.match(/src=["']\.?\/?(.*?)["']/);
                if (match) filename = match[1];
            }
            
            console.log('[HU-20-B] filename extraido:', filename);
            
            if (!filename) continue;
            
            // Si ya existe un widget para esta línea, reusarlo
            if (imageWidgets[i]) {
                newWidgets[i] = imageWidgets[i];
                delete imageWidgets[i];
                console.log('[HU-20-B] Reusando widget en linea', i);
            } else {
                // Crear nuevo widget
                try {
                    var lineHandle = doc.getLineHandle(i);
                    console.log('[HU-20-B] LineHandle para', i, ':', lineHandle);
                    var widgetData = createImageWidget(i, filename);
                    var widgetNode = widgetData.widgetElement;
                    console.log('[HU-20-B] Nodo widget creado:', widgetNode.outerHTML.substring(0, 80));
                    var lineWidget = cm.addLineWidget(lineHandle, widgetNode, {
                        position: 'after',
                        coverGutter: false,
                        noHScroll: true
                    });
                    newWidgets[i] = {
                        widget: lineWidget,
                        node: widgetNode,
                        menuOpen: false,
                        widgetId: widgetData.widgetId
                    };
                    console.log('[HU-20-B] Widget insertado exitosamente en linea', i);
                } catch(e) {
                    console.warn('[HU-20-B] Error al añadir widget linea', i, e);
                }
            }
        }
    }
    
    console.log('[HU-20-B] Total imagenes detectadas:', foundImages);
    
    // Limpiar widgets de líneas que ya no tienen imágenes
    Object.keys(imageWidgets).forEach(function(lineNum) {
        var existing = imageWidgets[lineNum];
        if (existing && existing.widget) {
            try {
                existing.widget.clear();
                console.log('[HU-20-B] Widget limpiado en linea', lineNum);
            } catch(e) { /* ignore */ }
        }
    });
    
    imageWidgets = newWidgets;
    console.log('[HU-20-B] Estado final de widgets:', Object.keys(imageWidgets));
}

// Refrescar widgets al cambiar el contenido del editor
cm.on('change', function() {
    // Debounce para no refrescar en cada pulsación de tecla
    if (window._imgWidgetTimer) clearTimeout(window._imgWidgetTimer);
    window._imgWidgetTimer = setTimeout(refreshImageWidgets, 300);
});

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
    tagsList.innerHTML = tags.map(t =>
        `<span class="badge bg-primary me-1 mb-1 px-2 py-1">${t}<button type="button" class="btn-close btn-close-white ms-1" style="font-size:10px" onclick="removeTag('${t}')" aria-label="Eliminar"></button></span>`
    ).join('');
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
    maxFileSize: '100MB',
    acceptedFileTypes: [
        'image/png', 'image/jpeg', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime'
    ],
    labelIdle: 'Arrastra imágenes y videos aquí o haz clic para seleccionar<br><span class="filepond--label-action">(También puedes pegar con Ctrl+V)</span>',
    instantUpload: true,
});

// Llamada inicial para pintar los widgets HU-20-B cuando carga el editor
setTimeout(refreshImageWidgets, 500);

// ======================================================
// HU-20-C-V1: Event handlers del modal selector
// ======================================================

// Botón "Seleccionar" del modal
document.getElementById('selector-select-btn')?.addEventListener('click', function() {
    if (!window.selectedImageFilename) return;
    const mode = window.selectedImageMode || 'normal';
    const title = document.getElementById('selector-title')?.value || '';
    const desc = document.getElementById('selector-description')?.value || '';
    $('#imageSelectorModal').modal('hide');
    insertImageInEditor(window.selectedImageFilename, title, desc, mode);
});

// Botón "Cargar desde PC" del modal: activa el input FilePond
document.getElementById('selector-upload-btn')?.addEventListener('click', function() {
    // Activar el input file de FilePond
    const filepondEl = document.querySelector('.filepond--browser');
    if (filepondEl) {
        filepondEl.click();
    } else {
        // Fallback: intentar con el input original oculto
        const originalInput = document.getElementById('filepond');
        if (originalInput) originalInput.click();
    }
});

// Limpiar estado al cerrar modal (Cancelar o backdrop)
$('#imageSelectorModal').on('hidden.bs.modal', function() {
    window.imageSelectorOpen = false;
    window.selectedImageFilename = null;
    // No limpiar _imageSelectorCursor aquí porque si se cerró sin seleccionar,
    // el cursor debe seguir donde estaba
});

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
// HU-011.7: Barra de herramientas MTP (Mark to Post)
// Motor de inserción de templates en el editor
// ======================================================

/**
 * Templates MTP para inserción en el editor.
 * Cada template usa {{placeholder}} para marcar dónde queda el cursor.
 */
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

/**
 * Inserta un template MTP en la posición actual del cursor de EasyMDE.
 * @param {string} action - Clave del template en MTP_TEMPLATES
 */
function insertMtpTemplate(action) {
    if (!easyMDE) return;

    if (action === 'minimize') {
        // En mobile la barra siempre se ve: no minimizar
        if (window.innerWidth <= 992) return;
        // Alternar minimizar la barra
        const toolbar = document.getElementById('mtpToolbar');
        const toggleBtn = document.getElementById('mtpToggleBtn');
        if (!toolbar) return;
        const isMinimized = toolbar.classList.toggle('minimized');
        if (toggleBtn) {
            toggleBtn.style.display = isMinimized ? 'flex' : 'none';
        }
        // Guardar preferencia en localStorage
        try {
            localStorage.setItem('mtp_toolbar_minimized', isMinimized ? 'true' : 'false');
        } catch (e) { /* ignore */ }
        return;
    }

    // HU-20-C-V1: Interceptar acción 'image' para abrir el selector de imágenes
    if (action === 'image') {
        openImageSelectorModal();
        return;
    }

    const template = MTP_TEMPLATES[action];
    if (!template) {
        console.warn(`[MTP] Template desconocido: ${action}`);
        return;
    }

    // Insertar en la posición del cursor
    const cm = easyMDE.codemirror;
    const doc = cm.getDoc();
    const cursor = doc.getCursor();

    doc.replaceRange(template, cursor);

    // Mover el cursor al inicio del template insertado
    // (para que el usuario empiece a escribir inmediatamente)
    const newCursor = {
        line: cursor.line,
        ch: cursor.ch,
    };
    doc.setCursor(newCursor);

    // Focus en el editor
    cm.focus();

    // Feedback visual sutil: destello en el botón
    const btn = document.querySelector(`.mtp-btn[data-mtp="${action}"]`);
    if (btn) {
        btn.style.transition = 'background 0s';
        btn.style.background = 'rgba(13, 110, 253, 0.20)';
        setTimeout(() => {
            btn.style.background = '';
            btn.style.transition = '';
        }, 200);
    }
}

/**
 * Inicializa los event listeners de la barra MTP.
 */
function initMtpToolbar() {
    const toolbar = document.getElementById('mtpToolbar');
    if (!toolbar) return;

    // HU-20-C-V1: Marcar botón imagen como migrado y bloquear los demás
    const imageBtns = toolbar.querySelectorAll('.mtp-btn[data-mtp="image"]');
    imageBtns.forEach(function(btn) {
        btn.classList.add('mtp-migrated');
    });
    // Bloquear visualmente los botones NO migrados
    const allBtns = toolbar.querySelectorAll('.mtp-btn');
    const MTP_PRODUCTION = window.MTP_PRODUCTION !== undefined ? window.MTP_PRODUCTION : true;
    allBtns.forEach(function(btn) {
        if (btn.dataset.mtp !== 'image') {
            if (MTP_PRODUCTION) {
                btn.classList.add('mtp-disabled');
            }
        }
    });

    // Delegación de eventos: un solo listener para todos los botones
    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.mtp-btn');
        if (!btn) return;
        // Si el botón está bloqueado (mtp-disabled), no hacer nada
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

    // Botón toggle para restaurar la barra minimizada
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

    // En mobile la barra siempre se ve: si estaba minimizada, restaurar
    if (window.innerWidth <= 992) {
        const toolbarEl = document.getElementById('mtpToolbar');
        const toggleBtnEl = document.getElementById('mtpToggleBtn');
        if (toolbarEl) toolbarEl.classList.remove('minimized');
        if (toggleBtnEl) toggleBtnEl.style.display = 'none';
        localStorage.setItem('mtp_toolbar_minimized', 'false');
    } else {
        // Desktop: restaurar estado minimizado desde localStorage
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
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMtpToolbar);
} else {
    initMtpToolbar();
}