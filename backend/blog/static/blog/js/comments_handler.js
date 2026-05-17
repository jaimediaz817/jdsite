/***
 * Comments Handler - Centralized logic for comments
 * Includes: scroll infinite, comment submission, reply forms, char counter
 * Uses Alpine.js for reply forms
 */

// ===== CHAR COUNTER =====
function initCharCounter() {
    var textarea = document.querySelector('.jd-textarea-wrapper textarea');
    var charNum = document.getElementById('jd-char-num');
    if (textarea && charNum) {
        textarea.addEventListener('input', function() {
            charNum.textContent = this.value.length;
        });
    }
}

// ===== HTML ESCAPE (via DOM) =====
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ===== COLORS for avatar =====
var AVATAR_COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#db2777','#0891b2','#4f46e5'];

function getInitials(name) {
    return (name && name.length > 0) ? name.charAt(0).toUpperCase() : '?';
}

function getAvatarColor(id) {
    return AVATAR_COLORS[Math.abs(Number(id)) % AVATAR_COLORS.length];
}

// ===== SKELETON HTML REUTILIZABLE =====
function buildSkeletonHTML(skId, commentId, badgeText) {
    var dataAttr = commentId ? (' data-comment-id="' + commentId + '"') : '';
    var html = '' +
        '<div id="' + skId + '" class="sk-comment"' + dataAttr + '>' +
            '<div class="sk-comment-avatar"></div>' +
            '<div class="sk-comment-body">' +
                '<div class="sk-line sk-line-long"></div>' +
                '<div class="sk-line sk-line-medium"></div>' +
                '<div class="sk-line sk-line-short"></div>' +
            '</div>' +
        '</div>' +
        '<div class="sk-pending-msg">' +
            '<i class="fas fa-clock"></i> ' + badgeText +
        '</div>';
    return html;
}

// ===== MAIN COMMENT FORM SUBMIT =====
function showPendingCardOnSubmit(commentId, name, content) {
    var container = document.getElementById('pending-skeletons-container');
    if (!container) {
        var commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        container = document.createElement('div');
        container.id = 'pending-skeletons-container';
        if (commentsList.firstChild) {
            commentsList.insertBefore(container, commentsList.firstChild);
        } else {
            commentsList.appendChild(container);
        }
    }
    var skId = 'sk-pending-' + commentId;
    if (document.getElementById(skId)) return;
    var html = buildSkeletonHTML(skId, commentId, 'Pendiente de aprobaci\u00f3n');
    container.insertAdjacentHTML('afterbegin', html);
}

window.submitMainCommentForm = async function(form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    var originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Enviando...';

    var nameInput = form.querySelector('input[name="name"]');
    var contentTextarea = form.querySelector('textarea[name="content"]');
    var userName = '';
    var userContent = '';

    if (nameInput && nameInput.type !== 'hidden') {
        userName = nameInput.value;
    } else {
        var hiddenName = form.querySelector('input[name="name"][type="hidden"]');
        if (hiddenName) userName = hiddenName.value;
        if (!userName && window.USER_NAME) userName = window.USER_NAME;
        if (!userName && window.USER_AUTHENTICATED) userName = 'Usuario';
    }
    if (contentTextarea) userContent = contentTextarea.value;

    try {
        var formData = new FormData(form);
        var websiteVal = formData.get('website');
        if (websiteVal === '' || websiteVal === null) {
            formData.delete('website');
        }
        var response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            if (response.status === 403) throw new Error('Error de seguridad CSRF. Por favor recarga la pagina.');
            if (response.status === 500) throw new Error('Error interno en el servidor.');
            // Intentar extraer errores de validación del body (ej: content mínimo 10 caracteres)
            try {
                var errorData = await response.json();
                if (errorData && errorData.errors) {
                    var msgs = [];
                    for (var field in errorData.errors) {
                        if (errorData.errors.hasOwnProperty(field)) {
                            msgs.push(errorData.errors[field].join(' '));
                        }
                    }
                    if (msgs.length) throw new Error(msgs.join(' '));
                }
            } catch (e) {
                if (e.message !== 'Failed to fetch' && !e.message.startsWith('Error')) throw e;
            }
            throw new Error('Error ' + response.status + ': Ha ocurrido un problema');
        }
        var data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error('Error al procesar la respuesta del servidor.');
        }
        if (!data.success) throw new Error('Error en el servidor');
        if (data.comment_id) {
            showPendingCardOnSubmit(data.comment_id, userName, userContent);
            form.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
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
            return;
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

window.handleCommentSubmit = function(e) {
    e.preventDefault();
    if (window.submitMainCommentForm) {
        window.submitMainCommentForm(e.target);
    }
    return false;
};

// ===== REPLY BUTTON TOGGLE (event delegation) =====
function initReplyToggle() {
    var commentsList = document.getElementById('comments-list');
    if (!commentsList) return;

    if (commentsList._replyToggleListener) {
        commentsList.removeEventListener('click', commentsList._replyToggleListener);
    }

    commentsList._replyToggleListener = function(e) {
        var btn = e.target.closest('.reply-btn');
        if (!btn) return;
        var id = btn.dataset.commentId;
        if (!id) return;
        var inlineReply = document.getElementById('reply-form-' + id);
        if (!inlineReply) return;
        var isOpen = inlineReply.style.display !== 'none';

        document.querySelectorAll('.jd-inline-reply').forEach(function(f) {
            f.style.display = 'none';
        });

        if (!isOpen) {
            if (typeof window.getReplyFormHtml === 'function') {
                inlineReply.innerHTML = window.getReplyFormHtml(id);
            } else {
                inlineReply.style.display = 'block';
                var textarea = inlineReply.querySelector('textarea');
                if (textarea) textarea.focus();
                return;
            }
            inlineReply.style.display = 'block';

            // Attach submit listener to prevent default form submission
            var form = document.getElementById('frm-' + id);
            if (form && typeof window.submitReplyForm === 'function') {
                // Remove any existing listener to avoid duplicates
                form._submitHandler = form._submitHandler || null;
                if (form._submitHandler) {
                    form.removeEventListener('submit', form._submitHandler);
                }
                form._submitHandler = function(ev) {
                    ev.preventDefault();
                    window.submitReplyForm(id);
                };
                form.addEventListener('submit', form._submitHandler);
            }
            if (typeof Alpine !== 'undefined') {
                Alpine.initTree(inlineReply);
            }
            var newTextarea = inlineReply.querySelector('textarea');
            if (newTextarea) newTextarea.focus();
        }
    };

    commentsList.addEventListener('click', commentsList._replyToggleListener);
}

// ===== TOGGLE REPLIES =====
function initToggleReplies() {
    document.querySelectorAll('.jd-toggle-replies-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var commentEl = this.closest('.jd-comment');
            if (!commentEl) return;
            var repliesEl = commentEl.querySelector('.jd-replies');
            if (!repliesEl) return;
            var icon = this.querySelector('i');
            var span = this.querySelector('span');
            var isOpen = repliesEl.style.display === 'block';
            repliesEl.style.display = isOpen ? 'none' : 'block';
            if (icon) {
                icon.className = 'fas ' + (isOpen ? 'fa-chevron-down' : 'fa-chevron-up');
            }
            if (span) {
                span.textContent = isOpen ? 'Ver' : 'Ocultar';
            }
        });
    });
}

// ===== SCROLL INFINITE =====
(function() {
    var CONFIG = { COMMENTS_PER_PAGE: 10, SCROLL_MARGIN_PX: 150 };
    var state = { page: 1, loading: false, hasMore: true, observer: null, commentsList: null, sentinel: null };

    function initializeScrollInfinite() {
        state.commentsList = document.getElementById('comments-list');
        if (!state.commentsList) return;
        createSentinel();
        initializeObserver();
    }

    function createSentinel() {
        state.sentinel = document.createElement('div');
        state.sentinel.id = 'comments-load-sentinel';
        state.sentinel.style.cssText = 'height:1px;width:100%;opacity:0;';
        state.commentsList.appendChild(state.sentinel);
    }

    function initializeObserver() {
        var options = { root: null, rootMargin: '0px 0px ' + CONFIG.SCROLL_MARGIN_PX + 'px 0px', threshold: 0.1 };
        state.observer = new IntersectionObserver(function(entries) {
            var entry = entries[0];
            if (entry.isIntersecting && state.hasMore && !state.loading) {
                loadMoreComments();
            }
        }, options);
        if (state.sentinel) state.observer.observe(state.sentinel);
    }

    async function loadMoreComments() {
        if (state.loading || !state.hasMore) return;
        state.loading = true;
        state.page += 1;
        showSkeletonLoader();
        try {
            var url = window.location.pathname + 'comments/load-more/?page=' + state.page;
            var response = await fetch(url, {
                method: 'GET',
                headers: {'X-Requested-With': 'XMLHttpRequest', 'Accept': 'text/html'},
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error('Error servidor: ' + response.status);
            state.hasMore = response.headers.get('X-Has-More') === 'true';
            if (!state.hasMore) {
                var endEl = document.querySelector('.jd-comments-end');
                if (endEl) endEl.style.display = 'block';
            }
            var htmlNuevosComentarios = await response.text();
            hideSkeletonLoader();
            if (state.sentinel) {
                state.sentinel.insertAdjacentHTML('beforebegin', htmlNuevosComentarios);
            }
            animateAppearanceComments();
            initReplyToggle();
            initToggleReplies();
            if (window.Reactions && window.Reactions.loadCommentReactions) {
                state.commentsList.querySelectorAll('.comment-reactions:not([data-reactions-initialized]), .thread-reactions:not([data-reactions-initialized])').forEach(function(container) {
                    var commentId = container.dataset.commentId;
                    if (commentId) {
                        container.setAttribute('data-reactions-initialized', 'true');
                        window.Reactions.loadCommentReactions(commentId, container);
                    }
                });
            }
        } catch (error) {
            hideSkeletonLoader();
            state.page -= 1;
        } finally {
            state.loading = false;
            if (!state.hasMore) finalizeScrollInfinite();
        }
    }

    function showSkeletonLoader() {
        if (document.getElementById('comments-loader-wrapper')) return;
        var badgeText = 'Cargando m\u00e1s comentarios...';
        var html = '<div id="comments-loader-wrapper" style="animation: fadeIn 200ms ease;">' +
            buildSkeletonHTML('sk-scroll-1', '', badgeText) +
            '<div class="mt-3">' + buildSkeletonHTML('sk-scroll-2', '', badgeText) + '</div>' +
        '</div>';
        if (state.sentinel) state.sentinel.insertAdjacentHTML('beforebegin', html);
    }

    function hideSkeletonLoader() {
        var loader = document.getElementById('comments-loader-wrapper');
        if (loader) {
            setTimeout(function() {
                loader.style.opacity = '0';
                setTimeout(function() {
                    if (loader.parentNode) loader.remove();
                }, 200);
            }, 1000);
        }
    }

    function animateAppearanceComments() {
        if (!state.commentsList) return;
        state.commentsList.querySelectorAll('.jd-comment:not(.loaded)').forEach(function(el, i) {
            setTimeout(function() {
                el.classList.add('loaded');
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * 70);
        });
    }

    function finalizeScrollInfinite() {
        if (state.observer) { state.observer.disconnect(); state.observer = null; }
        if (state.sentinel) { state.sentinel.remove(); state.sentinel = null; }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeScrollInfinite();
        });
    } else {
        initializeScrollInfinite();
    }
})();

// ===== PENDING COMMENTS =====
document.addEventListener('DOMContentLoaded', function() {
    initCharCounter();
    initReplyToggle();
    initToggleReplies();

    setTimeout(function() {
        var container = document.getElementById('pending-skeletons-container');
        if (!container) {
            var commentsList = document.getElementById('comments-list');
            if (commentsList) {
                container = document.createElement('div');
                container.id = 'pending-skeletons-container';
                if (commentsList.firstChild) {
                    commentsList.insertBefore(container, commentsList.firstChild);
                } else {
                    commentsList.appendChild(container);
                }
            }
        }
        if (!container) return;
        var pendingComments = (typeof window.PENDING_COMMENTS !== 'undefined') ? window.PENDING_COMMENTS : [];
        pendingComments.forEach(function(pc) {
            var skId = 'sk-pending-' + pc.id;
            if (document.getElementById(skId)) return;
            var html = buildSkeletonHTML(skId, pc.id, 'Pendiente de aprobaci\u00f3n');
            container.insertAdjacentHTML('afterbegin', html);
        });
    });
});