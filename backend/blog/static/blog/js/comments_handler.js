/**
 * Comments Handler - Centralized logic for comments
 * Includes: scroll infinite, comment submission, reply forms
 * Isolated from blog_detail.js
 */
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

            var commentsList = document.getElementById('comments-list');
            if (commentsList) {
                var skeletonHtml = '<div id="temp-comment-skeleton" style="animation: fadeIn 300ms ease;"><div class="comment-skeleton"><div class="comment-skeleton-avatar"></div><div class="comment-skeleton-content"><div class="comment-skeleton-line short"></div><div class="comment-skeleton-line medium"></div><div class="comment-skeleton-line long"></div></div></div>';
                commentsList.insertAdjacentHTML('afterbegin', skeletonHtml);
                setTimeout(function() {
                    var skeleton = document.getElementById('temp-comment-skeleton');
                    if (skeleton) {
                        skeleton.style.opacity = '0';
                        setTimeout(function() { skeleton.remove(); }, 300);
                    }
                }, 3000);
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

    // Function handler for Alpine.js
    window.handleCommentSubmit = function(e) {
        e.preventDefault();
        if (window.submitMainCommentForm) {
            window.submitMainCommentForm(e.target);
        }
    };

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

    // Initialize scroll infinite when DOM is loaded
    initializeScrollInfinite();
});