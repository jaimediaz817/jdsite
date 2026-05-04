/**
 * Sistema de Reacciones Blog y Comentarios
 * Optimistic UI, Debounce 300ms, Manejo de errores silencioso
 * Segun especificaciones HU-005.2 y HU-005.4
 */

(function() {
    let debounceTimer = null;

    function init() {
        initBlogReactions();
        initCommentReactions();
    }

    function initBlogReactions() {
        const containers = document.querySelectorAll('.blog-reactions');
        if (containers.length === 0) return;

        const firstContainer = containers[0];
        const currentSlug = firstContainer.dataset.slug;
        if (!currentSlug) return;

        loadReactions(currentSlug);

        containers.forEach(function(container) {
            container.addEventListener('click', function(e) {
                handleReactionClick(e, 'blog', currentSlug);
            });
        });
    }

    function initCommentReactions() {
        const containers = document.querySelectorAll('.comment-reactions');
        if (containers.length === 0) return;

        containers.forEach(function(container) {
            const commentId = container.dataset.commentId;
            if (!commentId) return;

            fetch('/api/comment/' + commentId + '/reactions/')
                .then(function(res) {
                    if (!res.ok) throw new Error('Network response was not ok');
                    return res.json();
                })
                .then(function(data) {
                    var userReactions = Array.isArray(data.user_reactions) ? data.user_reactions : [];
                    updateCommentUI(container, data.counts || {}, userReactions);
                })
                .catch(function() {
                    updateCommentUI(container, {}, []);
                });

            container.addEventListener('click', function(e) {
                handleReactionClick(e, 'comment', commentId);
            });
        });
    }

    async function loadReactions(currentSlug) {
        try {
            const response = await fetch('/api/blog/' + currentSlug + '/reactions/');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            const userReactions = Array.isArray(data.user_reactions) ? data.user_reactions : [];
            updateBlogUI(data.counts || {}, userReactions);
        } catch (e) {
            console.warn('No se pudieron cargar las reacciones del articulo');
            updateBlogUI({}, []);
        }
    }

    function handleReactionClick(e, type, identifier) {
        const button = e.target.closest('.reaction-button');
        if (!button) return;

        const reactionType = button.dataset.reaction;
        if (!reactionType) return;

        // ✅ VALIDAR AUTENTICACIÓN PARA REACCIONES A COMENTARIOS
        if (type === 'comment' && !window.USER_AUTHENTICATED) {
            if (typeof $ !== 'undefined' && $.toast) {
                $.toast({
                    heading: 'Inicia sesión',
                    text: 'Debes iniciar sesión para reaccionar a comentarios.',
                    icon: 'warning',
                    position: 'top-right',
                    hideAfter: 4000,
                    stack: 4,
                    bgColor: '#f59e0b',
                    loaderBg: '#fbbf24'
                });
            } else {
                alert('Debes iniciar sesión para reaccionar a comentarios.');
            }
            return;
        }

        clearTimeout(debounceTimer);

        const isCurrentlyActive = button.classList.contains('active');
        const newState = !isCurrentlyActive;

        if (type === 'blog') {
            document.querySelectorAll('.blog-reactions .reaction-button').forEach(function(btn) {
                if (btn.dataset.reaction === reactionType) {
                    updateButtonState(btn, newState);
                } else {
                    updateButtonState(btn, false);
                }
                void btn.offsetWidth;
            });
        } else {
            const container = button.closest('.comment-reactions');
            container.querySelectorAll('.reaction-button').forEach(function(btn) {
                if (btn.dataset.reaction === reactionType) {
                    updateButtonState(btn, newState);
                } else {
                    updateButtonState(btn, false);
                }
                void btn.offsetWidth;
            });
        }

        debounceTimer = setTimeout(function() {
            sendReaction(reactionType, button, isCurrentlyActive, type, identifier);
        }, 300);
    }

    async function sendReaction(reactionType, button, previousState, type, identifier) {
        try {
            let url;
            if (type === 'blog') {
                url = '/api/blog/' + identifier + '/reactions/toggle/';
            } else {
                url = '/api/comment/' + identifier + '/reactions/toggle/';
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reaction_type: reactionType })
            });

            if (!response.ok) throw new Error('Error en la peticion');

            // No actualizamos la UI aqui porque el Optimistic UI ya lo hizo
            // Solo revertimos si hay error
            const data = await response.json();
            
            // Si el backend devuelve conteos actualizados, los actualizamos
            if (data.counts) {
                if (type === 'blog') {
                    document.querySelectorAll('.blog-reactions .reaction-button').forEach(function(btn) {
                        const t = btn.dataset.reaction;
                        btn.querySelector('.count').textContent = (data.counts[t] || 0);
                    });
                } else {
                    const container = button.closest('.comment-reactions');
                    container.querySelectorAll('.reaction-button').forEach(function(btn) {
                        const t = btn.dataset.reaction;
                        btn.querySelector('.count').textContent = (data.counts[t] || 0);
                    });
                }
            }

        } catch (e) {
            updateButtonState(button, previousState);
            console.warn('No se pudo guardar la reaccion');
        }
    }

    function updateBlogUI(counts, userActive) {
        const activeReactions = Array.isArray(userActive) ? userActive : [];
        document.querySelectorAll('.blog-reactions .reaction-button').forEach(function(button) {
            const type = button.dataset.reaction;
            const count = (counts && counts[type]) || 0;
            const isActive = activeReactions.includes(type);

            button.querySelector('.count').textContent = count;

            if (isActive) {
                button.classList.add('active');
                setIconSolid(button, true);
            } else {
                button.classList.remove('active');
                setIconSolid(button, false);
            }
            void button.offsetWidth;
        });
    }

    function updateCommentUI(container, counts, userActive) {
        const activeReactions = Array.isArray(userActive) ? userActive : [];
        container.querySelectorAll('.reaction-button').forEach(function(button) {
            const type = button.dataset.reaction;
            const count = (counts && counts[type]) || 0;
            const isActive = activeReactions.includes(type);

            button.querySelector('.count').textContent = count;

            if (isActive) {
                button.classList.add('active');
                setIconSolid(button, true);
            } else {
                button.classList.remove('active');
                setIconSolid(button, false);
            }
            void button.offsetWidth;
        });
    }

    function setIconSolid(button, solid) {
        const icon = button.querySelector('i');
        if (!icon) return;

        let iconType = null;
        if (icon.classList.contains('fa-thumbs-up')) iconType = 'thumbs-up';
        else if (icon.classList.contains('fa-lightbulb')) iconType = 'lightbulb';
        else if (icon.classList.contains('fa-heart')) iconType = 'heart';
        else if (icon.classList.contains('fa-fire')) iconType = 'fire';

        if (!iconType) return;

        icon.classList.remove('far', 'fas');

        if (solid) {
            icon.classList.add('fas');
        } else {
            if (iconType === 'thumbs-up' || iconType === 'lightbulb') {
                icon.classList.add('far');
            } else {
                icon.classList.add('fas');
            }
        }
    }

    function updateButtonState(button, active) {
        if (active) {
            button.classList.add('active');
            setIconSolid(button, true);
        } else {
            button.classList.remove('active');
            setIconSolid(button, false);
        }
        void button.offsetWidth;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();