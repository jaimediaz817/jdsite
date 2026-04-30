/**
 * Sistema de Reacciones Blog y Comentarios
 * Optimistic UI, Debounce 300ms, Manejo de errores silencioso
 * Segun especificaciones HU-005.2 y HU-005.4
 */

(function() {
    let debounceTimer = null;

    function init() {
        // Inicializar reacciones de articulos
        initBlogReactions();
        
        // Inicializar reacciones de comentarios
        initCommentReactions();
    }

    function initBlogReactions() {
        const containers = document.querySelectorAll('.blog-reactions');
        if (containers.length === 0) return;

        // Cargar estado inicial (todos los contenedores comparten el mismo slug)
        const firstContainer = containers[0];
        const currentSlug = firstContainer.dataset.slug;
        if (!currentSlug) return;

        // Cargar estado inicial
        loadReactions(currentSlug);

        // Agregar eventos a TODOS los contenedores
        containers.forEach(container => {
            container.addEventListener('click', (e) => handleReactionClick(e, 'blog', currentSlug));
        });
    }

    function initCommentReactions() {
        const containers = document.querySelectorAll('.comment-reactions');
        if (containers.length === 0) return;

        containers.forEach(container => {
            const commentId = container.dataset.commentId;
            if (!commentId) return;

            // Cargar estado inicial para este comentario
            fetch(`/api/comment/${commentId}/reactions/`)
                .then(res => res.json())
                .then(data => {
                    updateCommentUI(container, data.counts, data.user_reactions);
                })
                .catch(() => {
                    // Fallback silencioso
                });

            // Agregar eventos
            container.addEventListener('click', (e) => handleReactionClick(e, 'comment', commentId));
        });
    }

    async function loadReactions(currentSlug) {
        try {
            const response = await fetch(`/api/blog/${currentSlug}/reactions/`);
            const data = await response.json();
            updateBlogUI(data.counts, data.user_reactions);
        } catch (e) {
            // Fallback silencioso, no mostrar errores al usuario
            console.warn('No se pudieron cargar las reacciones del articulo');
        }
    }

    async function loadCommentReactions(commentId, container) {
        try {
            // Por ahora solo inicializamos en 0, el contador se actualiza en cada click
            // Se puede agregar endpoint de carga masiva cuando sea necesario
            updateCommentUI(container, {}, []);
        } catch (e) {
            console.warn('No se pudieron cargar las reacciones del comentario');
        }
    }

    function handleReactionClick(e, type, identifier) {
        const button = e.target.closest('.reaction-button');
        if (!button) return;

        const reactionType = button.dataset.reaction;
        if (!reactionType) return;

        // Cancelar debounce anterior si existe
        clearTimeout(debounceTimer);

        // Optimistic UI: Cambiar estado INMEDIATAMENTE
        const isCurrentlyActive = button.classList.contains('active');
        const newState = !isCurrentlyActive;

        // Si es una reaccion de articulo: sincronizar todos los botones
        if (type === 'blog') {
            document.querySelectorAll('.blog-reactions .reaction-button').forEach(btn => {
                if (btn.dataset.reaction === reactionType) {
                    // Si es el mismo tipo de reaccion, sincronizar estado en todos los lugares
                    updateButtonState(btn, newState);
                } else {
                    // Todas las demas reacciones se desactivan
                    btn.classList.remove('active');
                }
                void btn.offsetWidth;
            });
        } else {
            // Si es una reaccion de comentario: solo afecta a este comentario
            const container = button.closest('.comment-reactions');
            container.querySelectorAll('.reaction-button').forEach(btn => {
                if (btn.dataset.reaction === reactionType) {
                    updateButtonState(btn, newState);
                } else {
                    btn.classList.remove('active');
                }
                void btn.offsetWidth;
            });
        }

        // Debounce 300ms
        debounceTimer = setTimeout(() => {
            sendReaction(reactionType, button, isCurrentlyActive, type, identifier);
        }, 300);
    }

    async function sendReaction(reactionType, button, previousState, type, identifier) {
        try {
            let url;
            
            if (type === 'blog') {
                url = `/api/blog/${identifier}/reactions/toggle/`;
            } else {
                url = `/api/comment/${identifier}/reactions/toggle/`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reaction_type: reactionType })
            });

            if (!response.ok) {
                throw new Error('Error en la peticion');
            }

            const data = await response.json();
            
            if (type === 'blog') {
                updateBlogUI(data.counts, []);
            } else {
                const container = button.closest('.comment-reactions');
                updateCommentUI(container, data.counts, []);
            }

        } catch (e) {
            // Revertir estado si falla la peticion
            updateButtonState(button, previousState);
            console.warn('No se pudo guardar la reaccion');
        }
    }

    function updateBlogUI(counts, userActive) {
        document.querySelectorAll('.blog-reactions .reaction-button').forEach(button => {
            const type = button.dataset.reaction;
            const count = counts[type] || 0;
            const isActive = userActive.includes(type);

            button.querySelector('.count').textContent = count;
            
            if (isActive) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
            
            // Reset animacion
            void button.offsetWidth;
        });
    }

    function updateCommentUI(container, counts, userActive) {
        container.querySelectorAll('.reaction-button').forEach(button => {
            const type = button.dataset.reaction;
            const count = counts[type] || 0;
            const isActive = userActive.includes(type);

            button.querySelector('.count').textContent = count;
            
            if (isActive) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
            
            // Reset animacion
            void button.offsetWidth;
        });
    }

    function updateButtonState(button, active) {
        if (active) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
            // Remover animacion para que se pueda reproducir nuevamente
            void button.offsetWidth;
        }
    }

    // Iniciar cuando el DOM este listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();