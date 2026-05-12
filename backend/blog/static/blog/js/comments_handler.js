/**
 * Comments Handler - Centralized logic for comments
 * Includes: scroll infinite, comment submission, reply forms
 * Isolated from blog_detail.js
 */

// ===== Función para insertar skeleton pendiente con ID único =====
function insertSkeletonPending(container, commentId) {
    var skId = 'sk-pending-' + commentId;
    if (document.getElementById(skId)) return;
    container.insertAdjacentHTML('afterbegin',
        '<div id="' + skId + '" class="sk-comment" data-pending-id="' + commentId + '">'
        + '<div class="sk-comment-avatar"></div>'
        + '<div class="sk-comment-body">'
        + '<div class="sk-line sk-line-short"></div>'
        + '<div class="sk-line sk-line-medium"></div>'
        + '<div class="sk-line sk-line-long"></div>'
        + '<div class="sk-comment-actions">'
        + '<div class="sk-line sk-line-btn"></div>'
        + '<div class="sk-line sk-line-btn"></div>'
        + '</div>'
        + '<div class="sk-pending-msg">'
        + '<span class="sk-pending-icon">⏳</span>'
        + '<span class="sk-pending-text">Comentario pendiente de aprobación. Aparecerá una vez revisado.</span>'
        + '</div>'
        + '</div></div>'
    );
}

// ===== Gestionar lista de IDs pendientes en localStorage =====
function addPendingId(commentId) {
    try {
        var ids = JSON.parse(localStorage.getItem('jd_pending_ids') || '[]');
        if (!ids.includes(commentId)) ids.push(commentId);
        localStorage.setItem('jd_pending_ids', JSON.stringify(ids));
    } catch(e) {}
}

function removePendingId(commentId) {
    try {
        var ids = JSON.parse(localStorage.getItem('jd_pending_ids') || '[]');
        var filtered = ids.filter(function(id) { return id !== commentId; });
        localStorage.setItem('jd_pending_ids', JSON.stringify(filtered));
    } catch(e) {}
}

function getPendingIds() {
    try { return JSON.parse(localStorage.getItem('jd_pending_ids') || '[]'); }
    catch(e) { return []; }
}

// ===== Restaurar skeletons según IDs pendientes =====
function restoreSkeletonPending() {
    var pendingIds = getPendingIds();
    if (pendingIds.length === 0) return;

    var list = document.getElementById('comments-list');
    if (!list) return;

    // Obtener IDs de comentarios ya aprobados visibles en la página
    var approvedIds = [];
    list.querySelectorAll('.jd-comment').forEach(function(el) {
        // Buscar el data-comment-id en el contenedor de reacciones
        var reactions = el.querySelector('.comment-reactions');
        if (reactions) approvedIds.push(parseInt(reactions.dataset.commentId, 10));
    });

    // Por cada ID pendiente, si NO está en la lista de aprobados → mostrar skeleton
    var remaining = [];
    pendingIds.forEach(function(id) {
        if (approvedIds.indexOf(parseInt(id, 10)) === -1) {
            remaining.push(id);
            insertSkeletonPending(list, id);
        }
    });

    // Actualizar localStorage solo con los que siguen pendientes
    localStorage.setItem('jd_pending_ids', JSON.stringify(remaining));
}

// ===== MAIN COMMENT FORM SUBMIT (definido fuera de DOMContentLoaded para disponibilidad inmediata) =====
window.submitMainCommentForm = async function(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Enviando...';

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error ' + response.status);

        var data;
        try {
            data = await response.json();
        } catch (jsonError) {
            if (response.status === 403) throw new Error('Error de seguridad CSRF. Por favor recarga la página.');
            if (response.status === 500) throw new Error('Error interno en el servidor.');
            throw new Error('Error ' + response.status + ': Ha ocurrido un problema');
        }

        if (!data.success) throw new Error('Error en el servidor');

        if (typeof $ !== 'undefined' && $.toast) {
            $.toast({
                heading: 'Comentario enviado!',
                text: 'Tu comentario esta pendiente de aprobacion y sera publicado pronto.',
                icon: 'success',
                position: 'top-right',
                hideAfter: 4500,
                stack: 4,
                bgColor: '#7c3aed',
                loaderBg: '#6366f1'
            });
        } else {
            alert('Comentario enviado! Tu comentario esta pendiente de aprobacion.');
        }

        // Guardar ID del comentario pendiente en localStorage (para persistencia por ID)
        if (data.comment_id) {
            addPendingId(data.comment_id);
            var commentsList = document.getElementById('comments-list');
            if (commentsList) {
                insertSkeletonPending(commentsList, data.comment_id);
            }
        }

        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
        var errorMessage = error.message || 'Ha ocurrido un error al enviar el comentario';
        if (typeof $ !== 'undefined' && $.toast) {
            $.toast({
                heading: 'Error',
                text: errorMessage,
                icon: 'error',
                position: 'top-right',
                hideAfter: 5500,
                stack: 4,
                bgColor: '#dc2626',
                loaderBg: '#f87171'
            });
        } else {
            alert('Error: ' + errorMessage);
        }
    }
};

// Function handler for form onsubmit - retorna false explicitamente para prevenir POST normal
window.handleCommentSubmit = function(e) {
    e.preventDefault();
    if (window.submitMainCommentForm) {
        window.submitMainCommentForm(e.target);
    }
    return false;
};

// ===== DOMContentLoaded: scroll infinite, reply toggles =====
document.addEventListener('DOMContentLoaded', function() {
    var CONFIG = { COMMENTS_PER_PAGE: 3, SCROLL_MARGIN_PX: 150, ANIMATION_DURATION_MS: 280, DEBUG_MODE: false };
    var state = { page: 1, loading: false, hasMore: true, observer: null, commentsList: null, sentinel: null };

    function initializeScrollInfinite() {
        state.commentsList = document.getElementById('comments-list');
        if (!state.commentsList) {
            console.warn('No se encontró #comments-list para scroll infinito');
            return;
        }
        console.log('Inicializando scroll infinito para comentarios');
        createSentinel();
        initializeObserver();
    }

    function createSentinel() {
        state.sentinel = document.createElement('div');
        state.sentinel.id = 'comments-load-sentinel';
        state.sentinel.style.cssText = 'height:1px;width:100%;opacity:0;';
        state.commentsList.appendChild(state.sentinel);
        console.log('Sentinel creado y añadido a #comments-list');
    }

    function initializeObserver() {
        var options = { root: null, rootMargin: '0px 0px ' + CONFIG.SCROLL_MARGIN_PX + 'px 0px', threshold: 0.1 };
        state.observer = new IntersectionObserver(function(entries) {
            var entry = entries[0];
            if (entry.isIntersecting && state.hasMore && !state.loading) {
                console.log('Sentinel en vista, cargando más comentarios...');
                loadMoreComments();
            }
        }, options);
        state.observer.observe(state.sentinel);
        console.log('Observer inicializado para sentinel');
    }

    async function loadMoreComments() {
        if (state.loading || !state.hasMore) return;
        state.loading = true;
        state.page += 1;
        showSkeletonLoader();
        try {
            var url = window.location.pathname + 'comments/load-more/?page=' + state.page;
            console.log('Cargando más comentarios desde:', url);
            var response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'text/html'
                },
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error('Error servidor: ' + response.status);
            state.hasMore = response.headers.get('X-Has-More') === 'true';
            var htmlNuevosComentarios = await response.text();
            hideSkeletonLoader();
            state.sentinel.insertAdjacentHTML('beforebegin', htmlNuevosComentarios);
            animateAppearanceComments();
            // ✅ Inicializar reacciones en los nuevos comentarios cargados
            if (window.Reactions && window.Reactions.loadCommentReactions) {
                state.commentsList.querySelectorAll('.thread-reactions:not([data-reactions-initialized])').forEach(function(container) {
                    var commentId = container.dataset.commentId;
                    if (commentId) {
                        container.setAttribute('data-reactions-initialized', 'true');
                        window.Reactions.loadCommentReactions(commentId, container);
                    }
                });
            }
            console.log('Comentarios cargados. ¿Hay más?:', state.hasMore);
        } catch (error) {
            console.error('Error cargando comentarios:', error);
            hideSkeletonLoader();
            state.page -= 1;
        } finally {
            state.loading = false;
            if (!state.hasMore) finalizeScrollInfinite();
        }
    }

    function showSkeletonLoader() {
        // Evitar duplicados: solo agregar si no existe ya
        if (document.getElementById('comments-loader-wrapper')) {
            console.log('Skeleton loader ya existe, no se agrega otro');
            return;
        }
        var skeletonHtml = '<div id="comments-loader-wrapper" style="animation: fadeIn 200ms ease;"><div class="comment-skeleton"><div class="comment-skeleton-avatar"></div><div class="comment-skeleton-content"><div class="comment-skeleton-line short"></div><div class="comment-skeleton-line medium"></div><div class="comment-skeleton-line long"></div></div></div><div class="comment-skeleton mt-3"><div class="comment-skeleton-avatar"></div><div class="comment-skeleton-content"><div class="comment-skeleton-line short"></div><div class="comment-skeleton-line long"></div></div></div>';
        state.sentinel.insertAdjacentHTML('beforebegin', skeletonHtml);
        console.log('Skeleton loader mostrado para comentarios');
    }

    function finalizeScrollInfinite() {
        if (state.observer) {
            state.observer.disconnect();
            state.observer = null;
        }
        if (state.sentinel) {
            state.sentinel.remove();
            state.sentinel = null;
        }
        console.log('Scroll infinito de comentarios finalizado');
    }

    function hideSkeletonLoader() {
        var loader = document.getElementById('comments-loader-wrapper');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(function() { loader.remove(); }, 200);
        }
    }

    function animateAppearanceComments() {
        var comentariosNuevos = state.commentsList.querySelectorAll('.comment-wrapper:not(.loaded)');
        comentariosNuevos.forEach(function(comentario, indice) {
            setTimeout(function() {
                comentario.classList.add('loaded');
                comentario.style.opacity = '1';
                comentario.style.transform = 'translateY(0)';
            }, indice * 70);
        });
    }

    /**
     * Initialize click handlers for the reply toggle buttons added in the template.
     * Each button has class 'thread-toggle-replies-btn' and a data-comment-id attribute.
     * The corresponding replies wrapper has id 'replies-<comment-id>'.
     * 
     * IMPORTANT: If Alpine.js is present, let it handle the toggle to avoid conflicts.
     * Alpine.js uses x-data="{open:false}" and x-show="open" on the replies wrapper.
     * We only use vanilla JS as fallback when Alpine.js is not available.
     */
    function initReplyToggleButtons() {
        // Check if Alpine.js is available and being used for this functionality
        var isAlpineAvailable = typeof window.Alpine !== 'undefined' || document.querySelector('[x-data]');
        
        if (isAlpineAvailable) {
            console.log('Alpine.js detectado, delegando toggle de respuestas a Alpine.js');
            // Alpine.js will handle the toggle via @click="open = !open" in the template
            // We just need to ensure the button has the correct data attributes
            initializeAlpineToggleButtons();
            return;
        }
        
        // Fallback: Use vanilla JS when Alpine.js is not available
        console.log('Alpine.js no detectado, usando vanilla JS para toggle de respuestas');
        var toggleButtons = document.querySelectorAll('.thread-toggle-replies-btn');
        toggleButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var commentId = btn.getAttribute('data-comment-id');
                var wrapper = document.getElementById('replies-' + commentId);
                if (!wrapper) return;
                var isHidden = wrapper.style.display === 'none' || wrapper.style.display === '';
                wrapper.style.display = isHidden ? 'block' : 'none';
                // Toggle icon direction
                var icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            });
        });
    }

    /**
     * Initialize Alpine.js toggle buttons with proper data attributes.
     * This ensures Alpine.js can properly track and toggle the replies.
     */
    function initializeAlpineToggleButtons() {
        var toggleButtons = document.querySelectorAll('.thread-toggle-replies-btn');
        toggleButtons.forEach(function(btn) {
            // Ensure the button has data-comment-id for Alpine to work with
            if (!btn.hasAttribute('data-comment-id')) {
                var wrapper = btn.nextElementSibling;
                if (wrapper && wrapper.classList.contains('replies-wrapper')) {
                    var wrapperId = wrapper.id;
                    if (wrapperId && wrapperId.startsWith('replies-')) {
                        var commentId = wrapperId.replace('replies-', '');
                        btn.setAttribute('data-comment-id', commentId);
                    }
                }
            }
            // No extra click handler; Alpine will manage toggle via x-data and @click
        });
    }


    // Reply form template (global for Alpine.js)
    // NOTE: Using onclick on button instead of onsubmit on form to work properly with Alpine.js x-html injection
    window.getReplyFormHtml = function(commentId) {
        // Build the reply form HTML with optional pre-filled name/email for authenticated users
        var nameValue = '';
        var emailValue = '';
        if (window.USER_AUTHENTICATED) {
            nameValue = window.USER_NAME ? window.USER_NAME : '';
            emailValue = window.USER_EMAIL ? window.USER_EMAIL : '';
        }
        var html = '<div class="reply-form-container mt-3 ml-5" style="animation: fadeIn 200ms ease;">';
        html += '<form id="reply-form-' + commentId + '" method="POST" action="' + window.location.pathname + 'comment/">';
        html += '<input type="hidden" name="csrfmiddlewaretoken" value="' + document.querySelector('[name=csrfmiddlewaretoken]').value + '">';
        html += '<input type="hidden" name="parent_id" value="' + commentId + '">';
        html += '<input type="hidden" name="website" value="">';
        html += '<div class="form-group"><input type="text" name="name" class="form-control form-control-sm" placeholder="Tu nombre" value="' + nameValue + '" required></div>';
        html += '<div class="form-group"><input type="email" name="email" class="form-control form-control-sm" placeholder="Tu email (opcional)" value="' + emailValue + '"></div>';
        html += '<div class="form-group"><textarea name="content" id="reply-content-' + commentId + '" class="form-control form-control-sm" rows="2" placeholder="Escribe tu respuesta..." required autofocus></textarea></div>';
        html += '<div class="d-flex gap-2"><button type="button" class="btn btn-primary btn-sm" onclick="window.submitReplyForm(' + commentId + ')"><i class="fas fa-paper-plane mr-1"></i> Responder</button>';
        html += '<button type="button" class="btn btn-outline-secondary btn-sm cancel-reply" onclick="var container = this.closest(\'.thread-item, .thread-reply-item\'); if(container && container.__x) { container.__x.$data.replyId = null; } this.closest(\'.reply-form-container\').remove()">Cancelar</button></div>';
        html += '</form></div>';
        return html;
    };

    // Submit reply form (global for Alpine.js)
    window.submitReplyForm = function(commentId) {
        const form = document.querySelector('#reply-form-' + commentId);
        if (!form) {
            console.error('Form not found: #reply-form-' + commentId);
            return;
        }
        
        const submitBtn = form.querySelector('button[type="button"].btn-primary');
        const original = submitBtn.innerHTML;
        
    // Validate that content is not empty
        const contentTextarea = document.getElementById('reply-content-' + commentId);
        console.log('Buscando textarea con ID: reply-content-' + commentId);
        console.log('Textarea encontrado:', contentTextarea);
        if (contentTextarea) {
            console.log('Valor del textarea:', contentTextarea.value);
        }
        if (!contentTextarea) {
            console.error('Textarea no encontrado en el DOM');
        }
        if (!contentTextarea || !contentTextarea.value.trim()) {
            console.log('Validación fallida - mostrando error');
            const errorMsg = 'El contenido de la respuesta no puede estar vacío.';
            if (typeof $ !== 'undefined' && $.toast) {
                $.toast({ heading:'Error', text:errorMsg, icon:'error', position:'top-right', hideAfter:5500 });
            } else {
                alert(errorMsg);
            }
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Enviando...';
        
        fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Error ' + res.status);
            return res.json();
        })
        .then(data => {
            if (!data.success) throw new Error('Error en el servidor');
            if (typeof $ !== 'undefined' && $.toast) {
                $.toast({ heading:'Comentario enviado!', text:'Tu comentario está pendiente de aprobación.', icon:'success', position:'top-right', hideAfter:4500 });
            } else { alert('Comentario enviado!'); }
            window.location.reload();
        })
        .catch(err => {
            submitBtn.disabled = false; submitBtn.innerHTML = original;
            const msg = err.message || 'Error al enviar el comentario';
            if (typeof $ !== 'undefined' && $.toast) {
                $.toast({ heading:'Error', text:msg, icon:'error', position:'top-right', hideAfter:5500 });
            } else { alert('Error: ' + msg); }
        });
    };

    // Restaurar skeleton pendiente desde localStorage (persiste al recargar)
    restoreSkeletonPending();

    // Initialize scroll infinite when DOM is loaded
    initializeScrollInfinite();
    // Initialize toggle for replies collapse/expand
    initReplyToggleButtons();
});