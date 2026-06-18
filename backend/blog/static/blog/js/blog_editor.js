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
let isSaved = false; // controla si el artículo ya se guardó para evitar la alerta de salida
const DRAFT_KEY = 'blog_editor_draft';
let userOverride = false;
let lastAutoSaveTime = null;
let autoSaveTimer = null;

// Iconos SVG inline (mejor calidad visual y accesibilidad)
const ICON_EYE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3c-3.5 0-6.5 2.3-7.5 5.5C1.5 11.7 4.5 14 8 14s6.5-2.3 7.5-5.5C14.5 5.3 11.5 3 8 3zm0 9c-1.9 0-3.5-1.6-3.5-3.5S6.1 5 8 5s3.5 1.6 3.5 3.5S9.9 12 8 12zm0-5.5C7.2 6.5 6.5 7.2 6.5 8s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/></svg>';
const ICON_EYE_OFF = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5c-1.4 0-2.7.3-3.8.8l1.6 1.6c.7-.2 1.4-.4 2.2-.4 3.5 0 6.5 2.3 7.5 5.5-.3.9-.8 1.7-1.4 2.5l-1.7-1.7zM2 2l1.4 1.4C1.9 4.5.5 6.5 0 8c0 0 1.5 2.7 4.2 4.2l-1.5 1.5 1.4 1.4 12-12L14 2 2 2zm6.4 6.4l1.2 1.2c0 .2-.1.3-.1.5 0 .8.7 1.5 1.5 1.5.2 0 .3 0 .5-.1l1.2 1.2c-.5.2-1.1.3-1.7.3-1.9 0-3.5-1.6-3.5-3.5 0-.6.1-1.2.3-1.7l-.4.6z"/></svg>';
const ICON_TRASH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>';
const ICON_STAR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/></svg>';
const ICON_STAR_FILLED = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>';

// ======================================================
// Funciones helper: Toast manual (compatible Bootstrap 4)
// ======================================================
function showAutoSaveToast(title, detail) {
    const toastEl = document.getElementById('autosave-toast');
    if (!toastEl) return;
    const titleEl = toastEl.querySelector('.autosave-toast-title');
    const detailEl = document.getElementById('autosave-toast-detail');
    const timeEl = toastEl.querySelector('.autosave-toast-time');
    if (titleEl) titleEl.innerHTML = title;
    if (detailEl) detailEl.textContent = detail || '—';
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    // Mostrar toast manualmente con clase 'show' (compatible BS4)
    toastEl.classList.add('show');
    toastEl.style.display = 'block';
    // Auto-ocultar a los 5 segundos
    clearTimeout(toastEl._hideTimer);
    toastEl._hideTimer = setTimeout(() => {
        toastEl.classList.remove('show');
        toastEl.style.display = 'none';
    }, 5000);
}

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

// ======================================================
// F Unctions de archivos (render, cover, toggle, remove)
// ======================================================

/**
 * Renderiza una vista previa de un archivo subido (imagen o video).
 * Si el archivo es una imagen y tiene ``is_cover: true`` se marca como portada.
 * @param {{filename:string, type:string, hidden?:boolean, is_cover?:boolean}} file
 */
function renderUploadedFile(file) {
    if (!file || !file.filename) return;
    const container = document.getElementById('uploaded-files');
    if (!container) return;
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
    if (file.hidden) wrapper.classList.add('is-hidden');
    if (file.is_cover) wrapper.classList.add('is-cover');
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

    // Botón toggle (ver/ocultar)
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn-control btn-toggle';
    toggleBtn.setAttribute('data-tooltip', file.hidden ? 'Mostrar' : 'Ocultar');
    toggleBtn.setAttribute('aria-label', file.hidden ? 'Mostrar archivo' : 'Ocultar archivo');
    toggleBtn.innerHTML = file.hidden ? ICON_EYE_OFF : ICON_EYE;
    toggleBtn.onclick = () => toggleUploadedFile(file.filename);

    // Botón eliminar
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-control btn-remove';
    removeBtn.setAttribute('data-tooltip', 'Eliminar');
    removeBtn.setAttribute('aria-label', 'Eliminar archivo');
    removeBtn.innerHTML = ICON_TRASH;
    removeBtn.onclick = () => removeUploadedFile(file.filename);

    controls.appendChild(toggleBtn);
    controls.appendChild(removeBtn);

    wrapper.appendChild(controls);

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

    container.appendChild(wrapper);
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
        easyMDE.value(updated);
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

/** Alterna la visibilidad del archivo multimedia. */
function toggleUploadedFile(filename) {
    const container = document.getElementById('uploaded-files');
    const item = container.querySelector(`.uploaded-item[data-filename="${filename}"]`);
    if (!item) return;
    const isHidden = item.classList.toggle('is-hidden');
    const toggleBtn = item.querySelector('.btn-toggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = isHidden ? ICON_EYE_OFF : ICON_EYE;
        toggleBtn.setAttribute('data-tooltip', isHidden ? 'Mostrar' : 'Ocultar');
        toggleBtn.setAttribute('aria-label', isHidden ? 'Mostrar archivo' : 'Ocultar archivo');
    }
    const f = uploadedFiles.find(f => f.filename === filename);
    if (f) f.hidden = isHidden;
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
                const markdown = data.type === 'video'
                    ? `<video src="./${data.filename}" controls></video>`
                    : `![${data.filename}](./${data.filename})`;
                easyMDE.codemirror.replaceSelection(markdown);
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
        '<div class="alert alert-info">📝 Borrador recuperado de localStorage</div>';
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
        '<div class="alert alert-secondary">🗑️ Borrador local descartado</div>';
}

// ======================================================
// 5c. Al cargar la página: detectar draft y mostrar modal
// ======================================================
window.addEventListener('load', () => {
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
        document.getElementById('status-message').innerHTML = '<div class="alert alert-danger">El título es obligatorio</div>';
        return;
    }
    if (!data.description.trim()) {
        document.getElementById('status-message').innerHTML = '<div class="alert alert-danger">La descripción es obligatoria</div>';
        return;
    }
    if (!data.category) {
        document.getElementById('status-message').innerHTML = '<div class="alert alert-danger">La categoría es obligatoria</div>';
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
                document.getElementById('status-message').innerHTML = `<div class="alert alert-process-editor__container alert-success">Artículo publicado. <a href="/blog/${result.slug}/" class="alert-process-editor alert-link">Ver artículo</a></div>`;
                updateStatusBadge('published');
            } else {
                document.getElementById('status-message').innerHTML = '<div class="alert alert-process-editor__container alert-warning">Borrador guardado. Pendiente de aprobación. <a href="/blog/" class="alert-process-editor alert-link"><i class="fas fa-list"></i> Ver lista de artículos</a></div>';
                updateStatusBadge('pending');
            }
        } else {
            document.getElementById('status-message').innerHTML = `<div class="alert alert-process-editor__container alert-danger">Error: ${result.error || 'Error desconocido'}</div>`;
        }
    } catch (err) {
        document.getElementById('status-message').innerHTML = `<div class="alert alert-process-editor__container alert-danger">Error de conexión: ${err.message}</div>`;
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

        // Si el backend envía archivos existentes, marcamos cuál es la portada
        // según el frontmatter. Compatibilidad con la clave antigua ``image``.
        if (data.existing_files && data.existing_files.length > 0) {
            // El frontmatter puede traer la portada como:
            //   - ruta completa: "/static/blogs/<slug>/<filename>"
            //   - solo el nombre: "<filename>"
            //   - ruta Markdown: "./<filename>"
            // Extraemos solo el nombre del archivo para comparar de forma
            // robusta.
            const coverRaw = fm.cover_image || fm.image || '';
            const coverName = coverRaw ? coverRaw.split('/').pop() : '';
            console.log('🐛 [DEBUG] coverRaw =', coverRaw);
            console.log('🐛 [DEBUG] coverName =', coverName);
            let resolvedCoverName = '';
            data.existing_files.forEach(file => {
                const isCover = (file.filename === coverName);
                file.is_cover = isCover;
                if (isCover) resolvedCoverName = file.filename;
                console.log('🐛 [DEBUG] file =', file.filename, 'isCover =', isCover);
                // Añadir al arreglo global para que setAsCover funcione
                uploadedFiles.push(file);
                renderUploadedFile(file);
            });
            // ✅ Garantizar que la estrella aparezca rellena aunque haya
            // edge cases (mayúsculas, espacios, etc.). Llamamos a
            // setAsCover que es la función canónica que aplica todas
            // las clases CSS y actualiza el campo oculto.
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
        document.getElementById('status-message').innerHTML = '<div class="alert alert-success">Artículo cargado. Cambios se guardan en la misma carpeta.</div>';
    } catch (err) {
        console.error('Error cargando artículo:', err);
        document.getElementById('status-message').innerHTML = `<div class="alert alert-danger">Error al cargar artículo: ${err.message}</div>`;
    }
})();

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

    // Delegación de eventos: un solo listener para todos los botones
    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.mtp-btn');
        if (!btn) return;
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
