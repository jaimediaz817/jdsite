/**
 * Reactions Handler - Centralized logic for blog and comment reactions
 * Uses Alpine.js where appropriate
 * Isolates all reaction-related code from blog_detail.js
 */
window.Reactions = {
    debounceTimer: null,

    initBlogReactions(slug) {
        this.loadBlogReactions(slug);
    },

    initCommentReactions(commentId, container) {
        this.loadCommentReactions(commentId, container);
    },

    async loadBlogReactions(slug) {
        try {
            const response = await fetch('/api/blog/' + slug + '/reactions/');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            const userReactions = Array.isArray(data.user_reactions) ? data.user_reactions : [];
            this.updateBlogUI(data.counts || {}, userReactions);
        } catch (e) {
            console.warn('No se pudieron cargar las reacciones del artículo');
            this.updateBlogUI({}, []);
        }
    },

    async loadCommentReactions(commentId, container) {
        try {
            const response = await fetch('/api/comment/' + commentId + '/reactions/');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            const userReactions = Array.isArray(data.user_reactions) ? data.user_reactions : [];
            this.updateCommentUI(container, data.counts || {}, userReactions);
        } catch (e) {
            console.warn('No se pudieron cargar las reacciones del comentario');
            this.updateCommentUI(container, {}, []);
        }
    },

    toggleReaction(event, type, identifier) {
        // Debug: log event to console
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('toggleReaction called', { event, type, identifier });
        }

        // Get the button element - handle both direct clicks and Alpine.js events
        let button = null;
        if (event) {
            button = event.currentTarget || event.target;
            // If we got the icon instead of the button, find the button
            if (button && !button.classList.contains('thread-reaction-btn') && !button.classList.contains('reaction-button')) {
                button = button.closest('button');
            }
        }

        if (!button) {
            console.error('No reaction button found for event', event);
            return;
        }

        const reactionType = button.dataset.reaction;
        if (!reactionType) {
            console.error('No reaction type found on button', button);
            return;
        }

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

        clearTimeout(this.debounceTimer);

        const isCurrentlyActive = button.classList.contains('active');
        const newState = !isCurrentlyActive;

        // Optimistic UI update
        if (type === 'blog') {
            document.querySelectorAll('.blog-reactions button.reaction-button').forEach((btn) => {
                if (btn.dataset.reaction === reactionType) {
                    this.updateButtonState(btn, newState);
                } else {
                    this.updateButtonState(btn, false);
                }
                void btn.offsetWidth;
            });
        } else {
            // Support both .comment-reactions and .thread-reactions containers
            const container = button.closest('.comment-reactions, .thread-reactions');
            if (container) {
                container.querySelectorAll('.thread-reaction-btn').forEach((btn) => {
                    if (btn.dataset.reaction === reactionType) {
                        this.updateButtonState(btn, newState);
                    } else {
                        this.updateButtonState(btn, false);
                    }
                    void btn.offsetWidth;
                });
            }
        }

        this.debounceTimer = setTimeout(() => {
            this.sendReaction(reactionType, button, isCurrentlyActive, type, identifier);
        }, 300);
    },

    async sendReaction(reactionType, button, previousState, type, identifier) {
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
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ reaction_type: reactionType })
            });

            if (!response.ok) throw new Error('Error en la petición');

            const data = await response.json();

            // Si el backend devuelve conteos actualizados, los actualizamos
            if (data.counts) {
                if (type === 'blog') {
                    document.querySelectorAll('.blog-reactions button.reaction-button').forEach((btn) => {
                        const t = btn.dataset.reaction;
                        const countEl = btn.querySelector('.count');
                        if (countEl) countEl.textContent = (data.counts[t] || 0);
                    });
                } else {
                    const container = button.closest('.comment-reactions, .thread-reactions');
                    if (container) {
                        container.querySelectorAll('.thread-reaction-btn').forEach((btn) => {
                            const t = btn.dataset.reaction;
                            const countEl = btn.querySelector('.count');
                            if (countEl) countEl.textContent = (data.counts[t] || 0);
                        });
                    }
                }
            }

        } catch (e) {
            // Revert optimistic UI on error
            this.updateButtonState(button, previousState);
            console.warn('No se pudo guardar la reacción');
        }
    },

    getCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]');
        return token ? token.value : '';
    },

    updateBlogUI(counts, userActive) {
        const activeReactions = Array.isArray(userActive) ? userActive : [];
        document.querySelectorAll('.blog-reactions button.reaction-button').forEach((button) => {
            const type = button.dataset.reaction;
            const count = (counts && counts[type]) || 0;
            const isActive = activeReactions.includes(type);

            const countEl = button.querySelector('.count');
            if (countEl) countEl.textContent = count;

            if (isActive) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
            void button.offsetWidth;
        });
    },

    updateCommentUI(container, counts, userActive) {
        const activeReactions = Array.isArray(userActive) ? userActive : [];
        container.querySelectorAll('.thread-reaction-btn').forEach((button) => {
            const type = button.dataset.reaction;
            const count = (counts && counts[type]) || 0;
            const isActive = activeReactions.includes(type);

            const countEl = button.querySelector('.count');
            if (countEl) countEl.textContent = count;

            if (isActive) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
            void button.offsetWidth;
        });
    },

    updateButtonState(button, active) {
        if (active) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
        void button.offsetWidth;
    }
};

// Initialize reactions when DOM is loaded (for elements that are not handled by Alpine yet)
document.addEventListener('DOMContentLoaded', function() {
    // Initialize blog reactions if container exists
    const blogContainer = document.querySelector('.blog-reactions');
    if (blogContainer) {
        const slug = blogContainer.dataset.slug;
        if (slug) {
            window.Reactions.loadBlogReactions(slug);
        }
    }

    // Initialize comment reactions (both .comment-reactions and .thread-reactions)
    document.querySelectorAll('.comment-reactions, .thread-reactions').forEach(function(container) {
        const commentId = container.dataset.commentId;
        if (commentId) {
            window.Reactions.loadCommentReactions(commentId, container);
        }
    });
});