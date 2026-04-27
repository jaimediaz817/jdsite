/**
 * Sistema de Reacciones Blog
 * Optimistic UI, Debounce 300ms, Manejo de errores silencioso
 * Segun especificaciones HU-005.2
 */

(function() {
    let currentSlug = null;
    let debounceTimer = null;

    function init() {
        const container = document.querySelector('.blog-reactions');
        if (!container) return;

        currentSlug = container.dataset.slug;
        if (!currentSlug) return;

        // Cargar estado inicial
        loadReactions();

        // Agregar eventos
        container.addEventListener('click', handleReactionClick);
    }

    async function loadReactions() {
        try {
            const response = await fetch(`/api/blog/${currentSlug}/reactions/`);
            const data = await response.json();
            updateUI(data.counts, data.user_reactions);
        } catch (e) {
            // Fallback silencioso, no mostrar errores al usuario
            console.warn('No se pudieron cargar las reacciones');
        }
    }

    function handleReactionClick(e) {
        const button = e.target.closest('.reaction-button');
        if (!button) return;

        const reactionType = button.dataset.reaction;
        if (!reactionType) return;

        // Cancelar debounce anterior si existe
        clearTimeout(debounceTimer);

        // Optimistic UI: Cambiar estado INMEDIATAMENTE
        const isCurrentlyActive = button.classList.contains('active');
        const newState = !isCurrentlyActive;

        updateButtonState(button, newState);

        // Debounce 300ms
        debounceTimer = setTimeout(() => {
            sendReaction(reactionType, button, isCurrentlyActive);
        }, 300);
    }

    async function sendReaction(reactionType, button, previousState) {
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
            updateButtonState(button, isActive);
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