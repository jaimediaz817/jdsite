// ======================================================
// HU-011: Blog Editor JavaScript
// EasyMDE + FilePond + auto-save + tiempo de lectura
// ======================================================

const uploadedFiles = [];
let isSaved = false; // controla si el artículo ya se guardó para evitar la alerta de salida
const DRAFT_KEY = 'blog_editor_draft';
let userOverride = false;

// Iconos SVG inline (mejor calidad visual y accesibilidad)
const ICON_EYE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3c-3.5 0-6.5 2.3-7.5 5.5C1.5 11.7 4.5 14 8 14s6.5-2.3 7.5-5.5C14.5 5.3 11.5 3 8 3zm0 9c-1.9 0-3.5-1.6-3.5-3.5S6.1 5 8 5s3.5 1.6 3.5 3.5S9.9 12 8 12zm0-5.5C7.2 6.5 6.5 7.2 6.5 8s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/></svg>';
const ICON_EYE_OFF = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5c-1.4 0-2.7.3-3.8.8l1.6 1.6c.7-.2 1.4-.4 2.2-.4 3.5 0 6.5 2.3 7.5 5.5-.3.9-.8 1.7-1.4 2.5l-1.7-1.7zM2 2l1.4 1.4C1.9 4.5.5 6.5 0 8c0 0 1.5 2.7 4.2 4.2l-1.5 1.5 1.4 1.4 12-12L14 2 2 2zm6.4 6.4l1.2 1.2c0 .2-.1.3-.1.5 0 .8.7 1.5 1.5 1.5.2 0 .3 0 .5-.1l1.2 1.2c-.5.2-1.1.3-1.7.3-1.9 0-3.5-1.6-3.5-3.5 0-.6.1-1.2.3-1.7l-.4.6z"/></svg>';
const ICON_TRASH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>';
const ICON_STAR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/></svg>';
const ICON_STAR_FILLED = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>';

/**
 * Renderiza una vista previa de un archivo subido (imagen o video).
 * Si el archivo es una imagen y tiene ``is_cover: true`` se marca como portada.
 * @param {{filename:string, type:string, hidden?:boolean, is_cover?:boolean}} file
 */
function renderUploadedFile(file) {
    if (!file || !file.filename) return;
    const container = document.getElementById('uploaded-files');
    if (!container) return;
    const fileUrl = file.url || `/media/blog_editor_temp/${document.body.dataset.userId}/${file.filename}`;
    let element;
    if (file.type && file.type.startsWith('video')) {
        element = document.createElement('video');
        element.setAttribute('src', fileUrl);
        element.setAttribute('controls', '');
        element.className = 'uploaded-video';
    } else {
        element = document.createElement('img');
        element.setAttribute('src', fileUrl);
        element.setAttribute('alt', file.filename);
        element.className = 'uploaded-image';
    }
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

/** Elimina del markdown las referencias a un archivo. */
function removeMarkdownLineForFile(filename) {
    if (!easyMDE || !filename) return;
    const safe = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const imgRegex = new RegExp(`^!\\[[^\\]]*\\]\\(\\./${safe}\\)\\s*\\n?`, 'gm');
    const videoRegex = new RegExp(`<video[^>]*src=["']\\./${safe}["'][^>]*></video>\\s*\\n?`, 'g');
    let current = easyMDE.value();
    const updated = current
        .replace(imgRegex, '')
        .replace(videoRegex, '')
        .replace(/\n{3,}/g, '\n\n');
    if (updated !== current) {
        easyMDE.value(updated);
    }
}

/** Pide al backend borrar el archivo temporal (best-effort). */
function deleteFileOnServer(filename) {
    if (!filename) return Promise.resolve();
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('filename', filename);
    return fetch('/blog/api/upload-file/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData,
    }).catch(err => {
        console.warn('No se pudo eliminar el archivo en el servidor:', err);
    });
}

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
    return {
        slug: document.getElementById('edit-slug').value,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        tags: tags,
        meta_title: document.getElementById('meta_title').value,
        meta_description: document.getElementById('meta_description').value,
        palabra_clave_principal: document.getElementById('palabra_clave_principal').value,
        keywords: document.getElementById('keywords').value,
        tiempo_lectura: document.getElementById('tiempo_lectura').value,
        content_md: easyMDE.value(),
        files: uploadedFiles,
        cover_filename: getCoverFilename(),
    };
}

setInterval(() => {
    try {
        const data = collectFormData();
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        const toast = document.getElementById('autosave-toast');
        if (toast) {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        }
    } catch (e) {}
}, 30000);

window.addEventListener('load', () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft) return;
    const data = JSON.parse(draft);
    const hasContent = data.content_md && data.content_md.length > 10;
    const hasTitle = data.title && data.title.length > 3;
    if (!((hasContent || hasTitle) && confirm('¿Recuperar borrador guardado?'))) {
        localStorage.removeItem(DRAFT_KEY);
        return;
    }
    document.getElementById('title').value = data.title || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('category').value = data.category || '';
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
        '<div class="alert alert-info">Borrador recuperado de localStorage</div>';
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
        if (response.ok) {
            // Guardado exitoso → marcamos como guardado para que no aparezca la alerta de salida
            isSaved = true;
            localStorage.removeItem(DRAFT_KEY);
            if (result.published) {
                document.getElementById('status-message').innerHTML = `<div class="alert alert-success">Artículo publicado. <a href="/blog/${result.slug}/" class="alert-link">Ver artículo</a></div>`;
            } else {
                document.getElementById('status-message').innerHTML = '<div class="alert alert-warning">Borrador guardado. Pendiente de aprobación.</div>';
            }
        } else {
            document.getElementById('status-message').innerHTML = `<div class="alert alert-danger">Error: ${result.error || 'Error desconocido'}</div>`;
        }
    } catch (err) {
        document.getElementById('status-message').innerHTML = `<div class="alert alert-danger">Error de conexión: ${err.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = document.querySelector('#btn-save').dataset.originalText || 'Guardar';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-save');
    if (btn) btn.dataset.originalText = btn.innerHTML.trim();
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

window.addEventListener('beforeunload', (e) => {
    const data = collectFormData();
    // Sólo advertir si hay cambios sin haber guardado ya
    if (!isSaved && data.content_md && data.content_md.length > 10) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar.';
    }
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
        // Si el backend envía archivos existentes, marcamos cuál es la portada
        // según el frontmatter. Compatibilidad con la clave antigua ``image``.
        if (data.existing_files && data.existing_files.length > 0) {
            const coverFromFrontmatter = fm.cover_image || fm.image || '';
            data.existing_files.forEach(file => {
                const isCover = (file.filename === coverFromFrontmatter);
                file.is_cover = isCover;
                // Añadir al arreglo global para que setAsCover funcione
                uploadedFiles.push(file);
                renderUploadedFile(file);
            });
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
