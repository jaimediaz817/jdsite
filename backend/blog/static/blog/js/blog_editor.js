// ======================================================
// HU-011: Blog Editor JavaScript
// EasyMDE + FilePond + auto-save + tiempo de lectura
// ======================================================

const uploadedFiles = [];
const DRAFT_KEY = 'blog_editor_draft';
let userOverride = false;

// Iconos SVG inline (mejor calidad visual y accesibilidad)
const ICON_EYE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3c-3.5 0-6.5 2.3-7.5 5.5C1.5 11.7 4.5 14 8 14s6.5-2.3 7.5-5.5C14.5 5.3 11.5 3 8 3zm0 9c-1.9 0-3.5-1.6-3.5-3.5S6.1 5 8 5s3.5 1.6 3.5 3.5S9.9 12 8 12zm0-5.5C7.2 6.5 6.5 7.2 6.5 8s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/></svg>';
const ICON_EYE_OFF = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5c-1.4 0-2.7.3-3.8.8l1.6 1.6c.7-.2 1.4-.4 2.2-.4 3.5 0 6.5 2.3 7.5 5.5-.3.9-.8 1.7-1.4 2.5l-1.7-1.7zM2 2l1.4 1.4C1.9 4.5.5 6.5 0 8c0 0 1.5 2.7 4.2 4.2l-1.5 1.5 1.4 1.4 12-12L14 2 2 2zm6.4 6.4l1.2 1.2c0 .2-.1.3-.1.5 0 .8.7 1.5 1.5 1.5.2 0 .3 0 .5-.1l1.2 1.2c-.5.2-1.1.3-1.7.3-1.9 0-3.5-1.6-3.5-3.5 0-.6.1-1.2.3-1.7l-.4.6z"/></svg>';
const ICON_TRASH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>';

/**
 * Renderiza una vista previa de un archivo subido (imagen o video).
 * Esta función se utiliza tanto al subir archivos como al restaurar borradores.
 * @param {{filename:string, type:string, hidden?:boolean}} file - Información del archivo.
 */
function renderUploadedFile(file) {
    if (!file || !file.filename) return;
    const userId = document.body.dataset.userId;
    const container = document.getElementById('uploaded-files');
    if (!container) return;
    const fileUrl = `/media/blog_editor_temp/${userId}/${file.filename}`;
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
    wrapper.dataset.filename = file.filename;

    // Controles flotantes (overlay)
    const controls = document.createElement('div');
    controls.className = 'uploaded-controls';

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
    wrapper.appendChild(element);
    container.appendChild(wrapper);
}

/**
 * Elimina la línea markdown del editor EasyMDE que referencia ``filename``.
 * Soporta tanto la sintaxis de imagen ``![alt](./file)`` como la de video
 * ``<video src="./file" ...></video>``. Si el archivo aparece varias veces,
 * elimina todas las ocurrencias.
 * @param {string} filename - Nombre del archivo a quitar del markdown.
 */
function removeMarkdownLineForFile(filename) {
    if (!easyMDE || !filename) return;
    const safe = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 1) Patrón de imagen: ![alt](./<filename>)
    const imgRegex = new RegExp(`^!\\[[^\\]]*\\]\\(\\./${safe}\\)\\s*\\n?`, 'gm');
    // 2) Patrón de video: <video src="./<filename>" ...></video> en una línea
    const videoRegex = new RegExp(`<video[^>]*src=["']\\./${safe}["'][^>]*></video>\\s*\\n?`, 'g');
    let current = easyMDE.value();
    const updated = current
        .replace(imgRegex, '')
        .replace(videoRegex, '')
        // Limpiar líneas en blanco duplicadas que puedan quedar
        .replace(/\n{3,}/g, '\n\n');
    if (updated !== current) {
        easyMDE.value(updated);
    }
}

/**
 * Pide al backend que elimine el archivo físico del directorio temporal.
 * Es un "best effort": si falla, no bloqueamos la eliminación en el DOM.
 * @param {string} filename - Nombre del archivo a eliminar en disco.
 */
function deleteFileOnServer(filename) {
    if (!filename) return Promise.resolve();
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('filename', filename);
    return fetch('/blog/api/upload-file/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: formData,
    }).catch(err => {
        console.warn('No se pudo eliminar el archivo en el servidor:', err);
    });
}

/**
 * Elimina la vista previa, la referencia en memoria, la línea markdown del
 * editor y el archivo físico del servidor.
 * @param {string} filename - Nombre del archivo a eliminar.
 */
async function removeUploadedFile(filename) {
    // 1. Quitar del array uploadedFiles
    const idx = uploadedFiles.findIndex(f => f.filename === filename);
    if (idx !== -1) uploadedFiles.splice(idx, 1);

    // 2. Quitar la línea markdown del editor EasyMDE
    removeMarkdownLineForFile(filename);

    // 3. Quitar del DOM
    const container = document.getElementById('uploaded-files');
    const item = container.querySelector(`.uploaded-item[data-filename="${filename}"]`);
    if (item) container.removeChild(item);

    // 4. Pedir al backend que borre el archivo físico (best-effort)
    await deleteFileOnServer(filename);
}

/**
 * Alterna la visibilidad del elemento multimedia (imagen o video) dentro del preview.
 * @param {string} filename - Nombre del archivo a mostrar/ocultar.
 */
function toggleUploadedFile(filename) {
    const container = document.getElementById('uploaded-files');
    const item = container.querySelector(`.uploaded-item[data-filename="${filename}"]`);
    if (!item) return;
    const isHidden = item.classList.toggle('is-hidden');

    // Actualizar icono y tooltip del botón
    const toggleBtn = item.querySelector('.btn-toggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = isHidden ? ICON_EYE_OFF : ICON_EYE;
        toggleBtn.setAttribute('data-tooltip', isHidden ? 'Mostrar' : 'Ocultar');
        toggleBtn.setAttribute('aria-label', isHidden ? 'Mostrar archivo' : 'Ocultar archivo');
    }

    // Sincronizar estado en uploadedFiles
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
    // Limpiar sintaxis markdown que no es texto leíble
    const cleanText = content
        .replace(/```[\s\S]*?```/g, '')         // bloques de código
        .replace(/`[^`]+`/g, '')                // código inline
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')   // imágenes
        .replace(/\[[^\]]*\]\([^)]+\)/g, (m) => m.split(']')[0].slice(1)) // links (solo texto)
        .replace(/[#*_~>`-]/g, '')              // símbolos markdown
        .replace(/:::.*?:::/gs, '');            // bloques especiales

    const words = cleanText.trim().split(/\s+/).filter(w => w).length;
    return { words, minutes: Math.max(1, Math.round(words / 200)) };
}

// Escuchar cambios en el editor para actualizar tiempo de lectura
easyMDE.codemirror.on('change', () => {
    const content = easyMDE.value();
    const { words, minutes } = calculateReadingTime(content);

    document.getElementById('word-count').textContent = `${words} palabras`;
    document.getElementById('suggested-time').textContent = `${minutes} min`;

    if (!userOverride) {
        document.getElementById('tiempo_lectura').value = minutes;
    }
});

// Si el usuario edita manualmente el tiempo, respetar su valor
document.getElementById('tiempo_lectura').addEventListener('input', () => {
    userOverride = true;
});

// Botón "Aplicar sugerencia" para resetear el override
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
        `<span class="badge bg-primary me-1 mb-1 px-2 py-1">
            ${t}
            <button type="button" class="btn-close btn-close-white ms-1" style="font-size:10px"
                onclick="removeTag('${t}')" aria-label="Eliminar"></button>
        </span>`
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
        // Configuración del endpoint de carga
        process: {
            url: '/blog/api/upload-file/',
            method: 'POST',
            // Nombre del campo que FilePond enviará al backend
            name: 'file',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            onload: (response) => {
                const data = JSON.parse(response);
                uploadedFiles.push(data);

                // Insertar markdown en el editor según el tipo
                const markdown = data.type === 'video'
                    ? `<video src="./${data.filename}" controls></video>`
                    : `![${data.filename}](./${data.filename})`;
                easyMDE.codemirror.replaceSelection(markdown);

                // Mostrar previsualización del archivo subido
                renderUploadedFile(data);

                // Si es la primera imagen, sugerirla como portada
                if (data.type === 'image' && !document.getElementById('meta_title').value) {
                    const msg = document.createElement('div');
                    msg.className = 'alert alert-info mt-2 p-2';
                    msg.textContent = `✅ Imagen "${data.filename}" añadida. Puedes usarla como portada.`;
                    document.getElementById('status-message').appendChild(msg);
                }
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
    labelIdle: 'Arrastra imágenes y videos aquí o haz clic para seleccionar<br>' +
        '<span class="filepond--label-action">(También puedes pegar con Ctrl+V)</span>',
    instantUpload: true,
});

// ======================================================
// 5. Auto-save en localStorage cada 30s
// ======================================================
function collectFormData() {
    return {
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
    };
}

let autosaveTimer = null;
let autosaveCount = 0;

// Cada 30s guardar en localStorage
setInterval(() => {
    try {
        const data = collectFormData();
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));

        // Mostrar toast de auto-save
        const toast = document.getElementById('autosave-toast');
        if (toast) {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        }
        autosaveCount++;
    } catch (e) {
        // localStorage lleno, ignorar
    }
}, 30000);

// ======================================================
// 6. Recuperar borrador al cargar
// ======================================================
window.addEventListener('load', () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
        const data = JSON.parse(draft);
        const hasContent = data.content_md && data.content_md.length > 10;
        const hasTitle = data.title && data.title.length > 3;

        if ((hasContent || hasTitle) && confirm('📝 ¿Recuperar borrador guardado? Se perderá si cancelas.')) {
            // Restaurar campos del formulario
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

            // Restaurar contenido del editor
            easyMDE.value(data.content_md || '');

            // Restaurar archivos subidos y renderizarlos
            if (data.files && data.files.length > 0) {
                data.files.forEach(f => {
                    uploadedFiles.push(f);
                    renderUploadedFile(f);
                });
            }

            // Mostrar estado
            document.getElementById('status-message').innerHTML =
                '<div class="alert alert-info">📋 Borrador recuperado de <strong>localStorage</strong></div>';
        } else {
            // Si no, limpiar el borrador
            localStorage.removeItem(DRAFT_KEY);
        }
    }
});

// ======================================================
// 7. Botón "Guardar y Publicar"
// ======================================================
document.getElementById('btn-save').addEventListener('click', async () => {
    const data = collectFormData();

    // Validar campos requeridos
    if (!data.title.trim()) {
        document.getElementById('status-message').innerHTML =
            '<div class="alert alert-danger">❌ El título es obligatorio</div>';
        document.getElementById('title').focus();
        return;
    }
    if (!data.description.trim()) {
        document.getElementById('status-message').innerHTML =
            '<div class="alert alert-danger">❌ La descripción es obligatoria</div>';
        document.getElementById('description').focus();
        return;
    }
    if (!data.category) {
        document.getElementById('status-message').innerHTML =
            '<div class="alert alert-danger">❌ La categoría es obligatoria</div>';
        document.getElementById('category').focus();
        return;
    }

    // Deshabilitar botón y mostrar estado
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    document.getElementById('status-message').innerHTML = '';

    try {
        const response = await fetch('/blog/api/save-blog/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            // Limpiar borrador local
            localStorage.removeItem(DRAFT_KEY);

            // Mostrar mensaje de éxito
            if (result.published) {
                document.getElementById('status-message').innerHTML =
                    `<div class="alert alert-success">
                        🎉 Artículo publicado exitosamente.
                        <a href="/blog/${result.slug}/" class="alert-link">Ver artículo</a>
                    </div>`;
            } else {
                document.getElementById('status-message').innerHTML =
                    `<div class="alert alert-warning">
                        📝 Borrador guardado. No es visible públicamente hasta que el administrador lo apruebe.
                    </div>`;
            }

            // Scroll al mensaje
            document.getElementById('status-message').scrollIntoView({ behavior: 'smooth' });
        } else {
            document.getElementById('status-message').innerHTML =
                `<div class="alert alert-danger">❌ Error: ${result.error || 'Error desconocido'}</div>`;
        }
    } catch (err) {
        document.getElementById('status-message').innerHTML =
            `<div class="alert alert-danger">❌ Error de conexión: ${err.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = document.querySelector('#btn-save').dataset.originalText ||
            (document.querySelector('body').classList.contains('is_superuser') ?
                '🟢 Guardar y Publicar' : '🟡 Guardar Borrador');
    }
});

// Guardar texto original del botón
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-save');
    btn.dataset.originalText = btn.innerHTML.trim();
});

// ======================================================
// 8. Helper: Obtener CSRF token de cookies
// ======================================================
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

// ======================================================
// 9. Detectar cierre no guardado
// ======================================================
window.addEventListener('beforeunload', (e) => {
    const data = collectFormData();
    if (data.content_md && data.content_md.length > 10) {
        // Guardar automáticamente antes de irse
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de salir?';
    }
});
