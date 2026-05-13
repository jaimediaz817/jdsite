/**
 * Comments Handler - Centralized logic for comments
 * Includes: scroll infinite, comment submission, reply forms
 * Isolated from blog_detail.js
 */

// ===== Función para insertar skeleton pendiente con ID único =====
function insertSkeletonPending(container, commentId) {
    var skId = 'sk-pending-' + commentId;
    if (document.getElementById(skId)) return;

    // El skeleton debe tener data-comment-id para que sea reconocido como comentario visible
    // en restoreSkeletonPending() y no sea eliminado automáticamente
    container.insertAdjacentHTML('afterbegin',
        '<div id="' + skId + '" class="jd-comment sk-pending-comment" ' +
        'data-comment-id="' + commentId + '" ' +
        'style="opacity:1 !important; visibility:visible !important;">' +
        '<div class="jd-comment-avatar sk-comment-avatar"></div>' +
        '<div class="jd-comment-body">' +
        '<div class="jd-comment-bubble">' +
        '<div class="jd-comment-meta">' +
        '<div class="sk-line sk-line-short jd-skeleton-line"></div>' +
        '<div class="sk-line sk-line-medium jd-skeleton-line"></div>' +
        '<div class="sk-line sk-line-long jd-skeleton-line"></div>' +
        '</div>' +
        '<div class="jd-comment-actions">' +
        '<div class="sk-line sk-line-btn jd-skeleton-line"></div>' +
        '<div class="sk-line sk-line-btn jd-skeleton-line"></div>' +
        '</div>' +
        '<div class="sk-pending-msg">' +
        '<span class="sk-pending-icon">⏳</span>' +
        '<span class="sk-pending-text">Comentario pendiente de aprobación. Aparecerá una vez revisado.</span>' +
        '</div>' +
        '</div></div></div>'
    );
    console.log('✅ Skeleton creado para ID pendiente:', commentId);
}

// ===== Gestionar lista de IDs pendientes en localStorage =====
function addPendingId(commentId) {
    try {
        var ids = JSON.parse(localStorage.getItem('jd_pending_ids') || '[]');
        if (!ids.includes(commentId)) ids.push(commentId);
        localStorage.setItem('jd_pending_ids', JSON.stringify(ids));
        console.log('✅ ID', commentId, 'añadido a pending_ids. Total:', ids.length);
        console.log('📋 localStorage actualizado:', localStorage.getItem('jd_pending_ids'));
    } catch(e) {
        console.error('❌ Error al guardar pending_id:', e);
    }
}

function removePendingId(commentId) {
    try {
        var ids = JSON.parse(localStorage.getItem('jd_pending_ids') || '[]');
        var filtered = ids.filter(function(id) { return id !== commentId; });
        localStorage.setItem('jd_pending_ids', JSON.stringify(filtered));
        console.log('❌ ID', commentId, 'removido de pending_ids. Total:', filtered.length);
        console.log('📋 localStorage actualizado:', localStorage.getItem('jd_pending_ids'));
    } catch(e) {
        console.error('❌ Error al remover pending_id:', e);
    }
}

function getPendingIds() {
    try {
        var ids = JSON.parse(localStorage.getItem('jd_pending_ids') || '[]');
        console.log('📋 pending_ids recuperados del localStorage:', ids);
        console.log('📋 Valor crudo de localStorage:', localStorage.getItem('jd_pending_ids'));
        return ids;
    }
    catch(e) {
        console.error('⚠️ Error al leer pending_ids del localStorage:', e);
        return [];
    }
}

    // ===== Restaurar skeletons según IDs pendientes =====
    function restoreSkeletonPending() {
        console.log('🔄 Iniciando restoreSkeletonPending()...');

        var pendingIds = getPendingIds();
        console.log('📋 pendingIds recuperados:', pendingIds);

        if (pendingIds.length === 0) {
            console.log('❌ No hay pendingIds - saliendo de restoreSkeletonPending');
            return;
        }

        var list = document.getElementById('comments-list');
        if (!list) {
            console.error('❌ No se encontró #comments-list en el DOM');
            return;
        }

        console.log('🔍 Buscando comentarios visibles en el DOM...');

        // Obtener IDs de comentarios visibles en la página
        var visibleComments = {};

        list.querySelectorAll('[data-comment-id]').forEach(function(el) {
            var commentId = parseInt(el.getAttribute('data-comment-id'), 10);
            var jdComment = el.closest('.jd-comment');
            if (jdComment) {
                visibleComments[commentId] = {
                    element: jdComment,
                    hasReactions: jdComment.querySelector('.comment-reactions') !== null,
                    isRejected: jdComment.querySelector('.badge-danger') !== null ||
                               (jdComment.querySelector('[class*="badge"]') !== null &&
                                jdComment.querySelector('[class*="badge"]').textContent.toLowerCase().includes('rechazado'))
                };
            }
        });

        console.log('📊 Comentarios visibles encontrados:', Object.keys(visibleComments));

        // Procesar IDs pendientes - detectar estados reales
        var remainingPendings = [];

        pendingIds.forEach(function(id) {
            var idNum = parseInt(id, 10);
            var commentState = visibleComments[idNum];
            var skeletonEl = document.getElementById('sk-pending-' + idNum);
            var commentEl = commentState ? commentState.element : null;

            console.log('🔎 Procesando ID:', idNum, '| Estado:', commentState ? 'visible' : 'no visible',
                       '| Skeleton existe:', skeletonEl !== null,
                       '| HTML existe:', commentEl !== null);

            // Caso 1: Comentario ya aprobado en backend (tiene reactions en HTML)
            if (commentState && commentState.hasReactions) {
                console.log("🔵 STATUS: APPROVED -> Comentario ID", idNum, "ya aprobado, removemos skeleton");
                removePendingId(id);

                // Remover skeleton si existe
                if (skeletonEl) skeletonEl.remove();
                return;
            }

            // Caso 2: Comentario rechazado en backend (badge-danger o texto "rechazado")
            if (commentState && commentState.isRejected) {
                console.log("🔴 STATUS: REJECTED -> Comentario ID", idNum, "fue rechazado, removemos permanentemente");
                removePendingId(id);

                // Remover skeleton y comentario visible
                if (skeletonEl) skeletonEl.remove();
                if (commentEl) commentEl.remove();
                return;
            }

            // Caso 3: Comentario no visible en HTML (backend lo aceptó/rechazó y ya no está)
            if (!commentState && skeletonEl) {
                console.log("⚪ Comentario ID", idNum, "no encontrado en HTML. Eliminando skeleton de localStorage");
                removePendingId(id);
                skeletonEl.remove();
                return;
            }

            // Caso 4: Comentario sigue pendiente en localStorage y existe en HTML
            if (commentState && !commentState.hasReactions && !commentState.isRejected) {
                console.log("⏳ STATUS: PENDING -> Comentario ID", idNum, "sigue pendiente, manteniendo skeleton");
                remainingPendings.push(id);
            }

            // Caso 5: Comentario pendiente en localStorage pero NO existe en HTML (puede ser nuevo)
            if (!commentState && !skeletonEl) {
                console.log("⚠️ Comentario ID", idNum, "no encontrado en HTML pero no tiene skeleton. Insertando skeleton...");
                insertSkeletonPending(list, id);
                remainingPendings.push(id);
            }

            // Caso 6: Comentario pendiente en localStorage pero no tenemos información del backend
            if (!commentState && skeletonEl) {
                console.log("⚠️ Comentario ID", idNum, "pendiente pero no tenemos información del backend. Verificando estado...");
                checkCommentStatus(idNum, skeletonEl, list, remainingPendings);
            }
        });

        console.log('💾 Guardando remainingPendings:', remainingPendings);
        localStorage.setItem('jd_pending_ids', JSON.stringify(remainingPendings));
        console.log('✅ restoreSkeletonPending() completado');
    }

    // ===== Función para verificar el estado de un comentario con el backend =====
    function checkCommentStatus(commentId, skeletonEl, list, remainingPendings) {
        console.log("🔍 Verificando estado del comentario ID", commentId, "con el backend...");

        // Obtener la URL del blog actual
        var currentUrl = window.location.pathname;
        var blogSlug = currentUrl.split('/').filter(Boolean).pop();

        // Construir la URL para verificar el estado del comentario
        var checkUrl = `/blog/${blogSlug}/comment/${commentId}/status/`;

        // Verificar si la ruta existe antes de hacer la petición
        fetch(checkUrl, {
            method: 'HEAD',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                // Si obtenemos 404, significa que la ruta no existe
                if (response.status === 404) {
                    console.log("⚠️ Ruta no encontrada para verificar estado del comentario. Usando ruta alternativa...");
                    // Intentar con la ruta completa
                    checkUrl = `/blog/${blogSlug}/comment/${commentId}/status/`;
                    return fetch(checkUrl, {
                        method: 'GET',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Accept': 'application/json'
                        },
                        credentials: 'same-origin'
                    });
                }
                throw new Error('Error al verificar estado del comentario: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("📋 Estado del comentario ID", commentId, ":", data.status);

            if (data.status === "approved") {
                console.log("🔵 STATUS: APPROVED -> Comentario ID", commentId, "aprobado, removemos skeleton");
                removePendingId(commentId);
                if (skeletonEl) skeletonEl.remove();
            }
            else if (data.status === "rejected") {
                console.log("🔴 STATUS: REJECTED -> Comentario ID", commentId, "rechazado, removemos permanentemente");
                removePendingId(commentId);
                if (skeletonEl) skeletonEl.remove();
            }
            else {
                console.log("⏳ STATUS: PENDING -> Comentario ID", commentId, "sigue pendiente, manteniendo skeleton");
                remainingPendings.push(commentId);
            }
        })
        .catch(error => {
            console.error("❌ Error al verificar estado del comentario ID", commentId, ":", error);
            // Si hay error, mantenemos el skeleton por seguridad
            remainingPendings.push(commentId);
        });
    }

// ===== MAIN COMMENT FORM SUBMIT =====
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

        // Guardar ID del comentario pendiente en localStorage y mostrar skeleton
        if (data.comment_id) {
            console.log('🎯 Respuesta del backend:', data);
            addPendingId(data.comment_id);  // Registrar ID como pendiente
            var commentsList = document.getElementById('comments-list');
            if (commentsList) {
                insertSkeletonPending(commentsList, data.comment_id);  // Mostrar skeleton inmediatamente
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
    var CONFIG = { COMMENTS_PER_PAGE: 10, SCROLL_MARGIN_PX: 150, ANIMATION_DURATION_MS: 280, DEBUG_MODE: false };
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
                state.commentsList.querySelectorAll('.comment-reactions:not([data-reactions-initialized]), .thread-reactions:not([data-reactions-initialized])').forEach(function(container) {
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
        var comentariosNuevos = state.commentsList.querySelectorAll('.jd-comment:not(.loaded)');
        comentariosNuevos.forEach(function(comentario, indice) {
            setTimeout(function() {
                comentario.classList.add('loaded');
                comentario.style.opacity = '1';
                comentario.style.transform = 'translateY(0)';
            }, indice * 70);
        });
    }

    /** * Initialize click handlers for the reply toggle buttons added in the template. */
    function initReplyToggleButtons() {
        var isAlpineAvailable = typeof window.Alpine !== 'undefined' || document.querySelector('[x-data]');
        if (isAlpineAvailable) {
            console.log('Alpine.js detectado, delegando toggle de respuestas a Alpine.js');
            initializeAlpineToggleButtons();
            return;
        }
        console.log('Alpine.js no detectado, usando vanilla JS para toggle de respuestas');
        var toggleButtons = document.querySelectorAll('.thread-toggle-replies-btn');
        toggleButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var commentId = btn.getAttribute('data-comment-id');
                var wrapper = document.getElementById('replies-' + commentId);
                if (!wrapper) return;
                var isHidden = wrapper.style.display === 'none' || wrapper.style.display === '';
                wrapper.style.display = isHidden ? 'block' : 'none';
                var icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            });
        });
    }

    function initializeAlpineToggleButtons() {
        var toggleButtons = document.querySelectorAll('.thread-toggle-replies-btn');
        toggleButtons.forEach(function(btn) {
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
        });
    }

    // Reply form template (global for Alpine.js)
    window.getReplyFormHtml = function(commentId) {
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

    window.submitReplyForm = function(commentId) {
        const form = document.querySelector('#reply-form-' + commentId);
        if (!form) {
            console.error('Form not found: #reply-form-' + commentId);
            return;
        }
        const submitBtn = form.querySelector('button[type="button"].btn-primary');
        const original = submitBtn.innerHTML;
        const contentTextarea = document.getElementById('reply-content-' + commentId);
        if (!contentTextarea) {
            const errorMsg = 'El contenido de la respuesta no puede estar vacío.';
            if (typeof $ !== 'undefined' && $.toast) {
                $.toast({ heading: 'Error', text: errorMsg, icon: 'error', position: 'top-right', hideAfter: 5500 });
            } else {
                alert(errorMsg);
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = original;
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
                $.toast({ heading: 'Comentario enviado!', text: 'Tu comentario está pendiente de aprobación.', icon: 'success', position: 'top-right', hideAfter: 4500 });
            } else {
                alert('Comentario enviado!');
            }
            window.location.reload();
        })
        .catch(err => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = original;
            var msg = err.message || 'Error al enviar el comentario';
            if (typeof $ !== 'undefined' && $.toast) {
                $.toast({ heading: 'Error', text: msg, icon: 'error', position: 'top-right', hideAfter: 5500 });
            } else {
                alert('Error: ' + msg);
            }
        });
    };

    // Restaurar skeleton pendiente desde localStorage
    // 🔥 IMPORTANTE: Llamar restoreSkeletonPending() DESPUÉS de inicializar el scroll infinito
    // para que los skeletons se inserten en el DOM correctamente
    // También después de tener el HTML completo cargado, por lo que usamos un timeout mayor
    setTimeout(restoreSkeletonPending, 300);

    // Initialize scroll infinito when DOM is loaded
    initializeScrollInfinite();

    // Initialize toggle for replies collapse/expand
    initReplyToggleButtons();

    // Verificar localStorage en consola
    console.log('🔍 Estado actual de localStorage:');
    console.log('pending_ids:', localStorage.getItem('jd_pending_ids'));
    console.log('📋 Verificando si hay skeletons pendientes en el DOM...');

    // Verificar localStorage y restaurar skeletons en segundo plano después del DOM
    setTimeout(function() {
        var pendingIds = getPendingIds();
        if (pendingIds.length > 0) {
            pendingIds.forEach(function(id) {
                var skId = 'sk-pending-' + id;
                var skEl = document.getElementById(skId);
                console.log('ID', id, 'skeleton existe:', skEl !== null);
                if (skEl) {
                    console.log('✅ Skeleton encontrado en DOM para ID:', id);
                } else {
                    // Solo intentar insertar si todavía está pendiente
                    console.log('⚠️ Skeleton NO encontrado en DOM para ID:', id, '- insertando ahora...');
                    var list = document.getElementById('comments-list');
                    if (list) {
                        insertSkeletonPending(list, id);
                    }
                }
            });
        } else {
            console.log('❌ No hay pending_ids en localStorage - no se pueden restaurar skeletons');
        }
    }, 400); // Démora extra para asegurar que el DOM esté completamente actualizado
});