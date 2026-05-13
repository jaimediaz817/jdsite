/***
 * Comments Handler - Centralized logic for comments
 * Includes: scroll infinite, comment submission, reply forms, char counter
 * Vanilla JS only - no Alpine dependency
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

// ===== MAIN COMMENT FORM SUBMIT (con card del comentario real + badge pendiente) =====
function showPendingCardOnSubmit(commentId, name, content) {
    var container = document.getElementById('pending-skeletons-container');
    if (!container) {
        var commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        container = document.createElement('div');
        container.id = 'pending-skeletons-container';
        commentsList.appendChild(container);
    }

    var skId = 'sk-pending-' + commentId;
    if (document.getElementById(skId)) return;

    var initials = getInitials(name);
    var avatarColor = getAvatarColor(commentId);

    var html = '<div id="' + skId + '" class="jd-comment sk-pending-comment loaded" data-comment-id="' + commentId + '">' +
        '<div class="jd-comment-avatar" style="background-color:' + avatarColor + ';">' + initials + '</div>' +
        '<div class="jd-comment-body">' +
            '<div class="jd-comment-bubble">' +
                '<div class="jd-comment-meta">' +
                    '<strong class="jd-comment-name">' + escapeHtml(name) + '</strong>' +
                    '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;font-size:0.7rem;color:#92400e;font-weight:500;">' +
                        '<span style="font-size:0.75rem;">&#9203;</span> Pendiente' +
                    '</span>' +
                    '<time class="jd-comment-date">Ahora</time>' +
                '</div>' +
                '<p class="jd-comment-text">' + escapeHtml(content) + '</p>' +
            '</div>' +
        '</div>' +
    '</div>';

    container.insertAdjacentHTML('beforeend', html);
}

// Save pending comment data to localStorage for restoration after reload
function savePendingData(commentId, data) {
    try {
        var allData = JSON.parse(localStorage.getItem('jd_pending_data') || '{}');
        allData[commentId] = data;
        localStorage.setItem('jd_pending_data', JSON.stringify(allData));
    } catch(e) {
        console.error('Error al guardar pending_data:', e);
    }
}

function getPendingData(commentId) {
    try {
        var allData = JSON.parse(localStorage.getItem('jd_pending_data') || '{}');
        return allData[commentId] || null;
    } catch(e) {
        return null;
    }
}

function removePendingData(commentId) {
    try {
        var allData = JSON.parse(localStorage.getItem('jd_pending_data') || '{}');
        delete allData[commentId];
        localStorage.setItem('jd_pending_data', JSON.stringify(allData));
    } catch(e) {
        console.error('Error al remover pending_data:', e);
    }
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
        // Usar FormData del form pero limpiar website (honeypot) si esta vacio
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
            addPendingId(data.comment_id);
            savePendingData(data.comment_id, {name: userName, content: userContent});
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

            setTimeout(function() {
                window.location.reload();
            }, 800);
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

// ===== REPLY BUTTON TOGGLE =====
function initReplyToggle() {
    document.querySelectorAll('.reply-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = this.dataset.commentId;
            var form = document.getElementById('reply-form-' + id);
            if (!form) return;
            var isOpen = form.style.display !== 'none';
            document.querySelectorAll('.jd-inline-reply').forEach(function(f) {
                f.style.display = 'none';
            });
            if (!isOpen) {
                form.style.display = 'block';
                var textarea = form.querySelector('textarea');
                if (textarea) textarea.focus();
            }
        });
    });
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

// ===== LOCALSTORAGE pending IDs =====
function addPendingId(commentId) {
    try {
        var ids = JSON.parse(localStorage.getItem('jd_pending_ids') || '[]');
        if (!ids.includes(commentId)) ids.push(commentId);
        localStorage.setItem('jd_pending_ids', JSON.stringify(ids));
    } catch(e) {
        console.error('Error al guardar pending_id:', e);
    }
}

function removePendingId(commentId) {
    try {
        var ids = JSON.parse(localStorage.getItem('jd_pending_ids') || '[]');
        var filtered = ids.filter(function(id) { return id !== commentId; });
        localStorage.setItem('jd_pending_ids', JSON.stringify(filtered));
        removePendingData(commentId);
    } catch(e) {
        console.error('Error al remover pending_id:', e);
    }
}

function getPendingIds() {
    try {
        return JSON.parse(localStorage.getItem('jd_pending_ids') || '[]');
    } catch(e) {
        return [];
    }
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
            var htmlNuevosComentarios = await response.text();
            hideSkeletonLoader();
            if (state.sentinel) {
                state.sentinel.insertAdjacentHTML('beforebegin', htmlNuevosComentarios);
            }
            animateAppearanceComments();
            initReplyToggle();
            initToggleReplies();
            if (window.Reactions && window.Reactions.loadCommentReactions) {
                state.commentsList.querySelectorAll('.comment-reactions:not([data-reactions-initialized])').forEach(function(container) {
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
        var html = '<div id="comments-loader-wrapper" style="animation: fadeIn 200ms ease;"><div class="comment-skeleton"><div class="comment-skeleton-avatar"></div><div class="comment-skeleton-content"><div class="comment-skeleton-line short"></div><div class="comment-skeleton-line medium"></div><div class="comment-skeleton-line long"></div></div></div><div class="comment-skeleton mt-3"><div class="comment-skeleton-avatar"></div><div class="comment-skeleton-content"><div class="comment-skeleton-line short"></div><div class="comment-skeleton-line long"></div></div></div></div>';
        if (state.sentinel) state.sentinel.insertAdjacentHTML('beforebegin', html);
    }

    function hideSkeletonLoader() {
        var loader = document.getElementById('comments-loader-wrapper');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(function() { if (loader.parentNode) loader.remove(); }, 200);
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
        document.addEventListener('DOMContentLoaded', initializeScrollInfinite);
    } else {
        initializeScrollInfinite();
    }
})();

// ===== PENDING COMMENTS: mostrar TODOS los pendientes del servidor =====
document.addEventListener('DOMContentLoaded', function() {
    initCharCounter();
    initReplyToggle();
    initToggleReplies();

    setTimeout(function() {
        // 1. Limpiar localStorage de IDs que ya no estan pendientes (SIEMPRE se ejecuta)
        var commentsStatus = (typeof window.COMMENTS_STATUS !== 'undefined') ? window.COMMENTS_STATUS : {};
        var pendingIdsLocal = getPendingIds();
        if (pendingIdsLocal.length > 0) {
            pendingIdsLocal.forEach(function(id) {
                var status = commentsStatus[id];
                if (!status || status === 'approved' || status === 'rejected') {
                    removePendingId(id);
                }
            });
        }

        // 2. Mostrar solo comentarios pendientes del usuario actual (IDs en localStorage)
        var pendingIds = getPendingIds();
        if (pendingIds.length === 0) return;

        var container = document.getElementById('pending-skeletons-container');
        if (!container) {
            var commentsList = document.getElementById('comments-list');
            if (commentsList) {
                container = document.createElement('div');
                container.id = 'pending-skeletons-container';
                commentsList.appendChild(container);
            }
        }
        if (!container) return;

        var pendingComments = (typeof window.PENDING_COMMENTS !== 'undefined') ? window.PENDING_COMMENTS : [];
        pendingComments = pendingComments.filter(function(pc) {
            return pendingIds.indexOf(pc.id) !== -1;
        });
        pendingComments.forEach(function(pc) {
            var skId = 'sk-pending-' + pc.id;
            if (document.getElementById(skId)) return;
            var initials = getInitials(pc.name);
            var avatarColor = getAvatarColor(pc.id);
            var html = '<div id="' + skId + '" class="jd-comment sk-pending-comment loaded" data-comment-id="' + pc.id + '">' +
                '<div class="jd-comment-avatar" style="background-color:' + avatarColor + ';">' + initials + '</div>' +
                '<div class="jd-comment-body">' +
                    '<div class="jd-comment-bubble">' +
                        '<div class="jd-comment-meta">' +
                            '<strong class="jd-comment-name">' + escapeHtml(pc.name) + '</strong>' +
                            '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;font-size:0.7rem;color:#92400e;font-weight:500;">' +
                                '<span style="font-size:0.75rem;">&#9203;</span> Pendiente' +
                            '</span>' +
                            '<time class="jd-comment-date">Pendiente de aprobacion</time>' +
                        '</div>' +
                        '<p class="jd-comment-text">' + escapeHtml(pc.content) + '</p>' +
                    '</div>' +
                '</div>' +
            '</div>';
            container.insertAdjacentHTML('beforeend', html);
        });
    }, 500);
});

function mostrarSkeletonPendiente(id, container) {
    var skId = 'sk-pending-' + id;
    if (document.getElementById(skId)) return;

    var pendingData = getPendingData(id);

    if (pendingData && pendingData.name && pendingData.content) {
        var initials = getInitials(pendingData.name);
        var avatarColor = getAvatarColor(id);
        var html = '<div id="' + skId + '" class="jd-comment sk-pending-comment loaded" data-comment-id="' + id + '">' +
            '<div class="jd-comment-avatar" style="background-color:' + avatarColor + ';">' + initials + '</div>' +
            '<div class="jd-comment-body">' +
                '<div class="jd-comment-bubble">' +
                    '<div class="jd-comment-meta">' +
                        '<strong class="jd-comment-name">' + escapeHtml(pendingData.name) + '</strong>' +
                        '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;font-size:0.7rem;color:#92400e;font-weight:500;">' +
                            '<span style="font-size:0.75rem;">&#9203;</span> Pendiente' +
                        '</span>' +
                        '<time class="jd-comment-date">Ahora</time>' +
                    '</div>' +
                    '<p class="jd-comment-text">' + escapeHtml(pendingData.content) + '</p>' +
                '</div>' +
            '</div>' +
        '</div>';
        container.insertAdjacentHTML('beforeend', html);
    } else {
        var html = '<div id="' + skId + '" class="jd-comment sk-pending-comment" data-comment-id="' + id + '">' +
            '<div class="jd-comment-avatar"><div class="sk-comment-avatar"></div></div>' +
            '<div class="jd-comment-body">' +
                '<div class="jd-comment-bubble">' +
                    '<div class="jd-comment-meta">' +
                        '<div class="sk-line sk-line-short" style="width:35%;height:16px;"></div>' +
                        '<div class="sk-line sk-line-medium" style="width:40%;height:12px;margin-top:4px;"></div>' +
                    '</div>' +
                    '<div style="margin-top:8px;">' +
                        '<div class="sk-line" style="width:90%;height:12px;"></div>' +
                        '<div class="sk-line" style="width:70%;height:12px;margin-top:6px;"></div>' +
                    '</div>' +
                    '<div class="sk-pending-msg" style="display:flex;align-items:center;gap:6px;margin-top:8px;padding:6px 10px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">' +
                        '<span style="font-size:0.9rem;">&#9203;</span>' +
                        '<span style="font-family:DM Sans,sans-serif;font-size:0.75rem;color:#92400e;">Pendiente de aprobacion</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
        container.insertAdjacentHTML('beforeend', html);
    }
}