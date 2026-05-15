/**
 * Sistema de Reacciones Blog y Comentarios
 * Optimistic UI, Debounce 300ms, Manejo de errores silencioso
 * Refactorizado para usar Alpine.js
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
            this.updateCommentUI(container, {}, []);
        }
    },

    toggleReaction(event, type, identifier) {
        // Debug: log event to console
        console.log('toggleReaction called', { event, type, identifier });
        
        // Get the button element - handle both direct clicks and Alpine.js events
        let button = null;
        if (event) {
            button = event.currentTarget || event.target;
            // If we got the icon instead of the button, find the button
            if (button && !button.classList.contains('reaction-button')) {
                button = button.closest('button.reaction-button');
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
            const container = button.closest('.comment-reactions');
            if (container) {
                container.querySelectorAll('.reaction-button').forEach((btn) => {
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
                        btn.querySelector('.count').textContent = (data.counts[t] || 0);
                    });
                } else {
                    const container = button.closest('.comment-reactions');
                    if (container) {
                        container.querySelectorAll('.reaction-button').forEach((btn) => {
                            const t = btn.dataset.reaction;
                            btn.querySelector('.count').textContent = (data.counts[t] || 0);
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
            // Update icon (solo toggle far/fas si el icono tiene ambas variantes)
            const icon = button.querySelector('i');
            if (icon && !icon.classList.contains('fa-fire')) {
                icon.classList.toggle('far', !isActive);
                icon.classList.toggle('fas', isActive);
            }
            void button.offsetWidth;
        });
    },

    updateCommentUI(container, counts, userActive) {
        const activeReactions = Array.isArray(userActive) ? userActive : [];
        container.querySelectorAll('.reaction-button').forEach((button) => {
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
            // Update icon (solo toggle far/fas si el icono tiene ambas variantes)
            const icon = button.querySelector('i');
            if (icon && !icon.classList.contains('fa-fire')) {
                icon.classList.toggle('far', !isActive);
                icon.classList.toggle('fas', isActive);
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
        const icon = button.querySelector('i');
        if (icon && !icon.classList.contains('fa-fire')) {
            icon.classList.toggle('far', !active);
            icon.classList.toggle('fas', active);
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

    // Initialize comment reactions
    document.querySelectorAll('.comment-reactions').forEach(function(container) {
        const commentId = container.dataset.commentId;
        if (commentId) {
            window.Reactions.loadCommentReactions(commentId, container);
        }
    });
});