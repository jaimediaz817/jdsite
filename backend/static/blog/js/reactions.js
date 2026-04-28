/**
 * Sistema de Reacciones Blog
 * Optimistic UI, Debounce 300ms, Manejo de errores silencioso
 * Segun especificaciones HU-005.2
 */

(function() {
    let debounceTimer = null;

    function init() {
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
            container.addEventListener('click', (e) => handleReactionClick(e, currentSlug));
        });
    }

    async function loadReactions(currentSlug) {
        try {
            const response = await fetch(`/api/blog/${currentSlug}/reactions/`);
            const data = await response.json();
            updateUI(data.counts, data.user_reactions);
        } catch (e) {
            // Fallback silencioso, no mostrar errores al usuario
            console.warn('No se pudieron cargar las reacciones');
        }
    }

    function handleReactionClick(e, currentSlug) {
        const button = e.target.closest('.reaction-button');
        if (!button) return;

        const reactionType = button.dataset.reaction;
        if (!reactionType) return;

        // Cancelar debounce anterior si existe
        clearTimeout(debounceTimer);

        // Optimistic UI: Cambiar estado INMEDIATAMENTE
        const isCurrentlyActive = button.classList.contains('active');
        const newState = !isCurrentlyActive;

        // ✅ Desactivar TODAS las demas reacciones en TODOS los contenedores
        document.querySelectorAll('.reaction-button').forEach(btn => {
            if (btn.dataset.reaction === reactionType) {
                // Si es el mismo tipo de reaccion, sincronizar estado en todos los lugares
                updateButtonState(btn, newState);
            } else {
                // Todas las demas reacciones se desactivan
                btn.classList.remove('active');
            }
            void btn.offsetWidth;
        });

        // Debounce 300ms
        debounceTimer = setTimeout(() => {
            sendReaction(reactionType, button, isCurrentlyActive, currentSlug);
        }, 300);
    }

    async function sendReaction(reactionType, button, previousState, currentSlug) {
        try {
            const response = await fetch(`/api/blog/${currentSlug}/reactions/toggle/`, {
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
            updateUI(data.counts, []);

        } catch (e) {
            // Revertir estado si falla la peticion
            updateButtonState(button, previousState);
            console.warn('No se pudo guardar la reaccion');
        }
    }

    function updateUI(counts, userActive) {
        document.querySelectorAll('.reaction-button').forEach(button => {
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