/**
 * blog_list.js - Componentes para el listado de blogs
 * Funciones globales usadas por Alpine.js en x-data
 */

// Función global para cargar contadores de reacciones (solo lectura)
function reactionsLoader(slug) {
    return {
        counts: null,
        init() {
            this.loadReactions();
        },
        loadReactions() {
            fetch('/api/blog/' + slug + '/reactions/')
                .then(r => r.json())
                .then(data => {
                    if (data.counts) {
                        this.counts = data.counts;
                    }
                })
                .catch(() => {
                    // Silencioso
                });
        },
        getCount(type) {
            return this.counts ? (this.counts[type] || 0) : 0;
        }
    };
}