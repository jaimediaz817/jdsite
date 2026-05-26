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

// Toggle sidebar visibility on mobile devices
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.absolute-sidebar');
    const toggleButtons = document.querySelectorAll('.sidebar-toggle, .sidebar-float-toggle, .sidebar-header-toggle');
    if (sidebar && toggleButtons.length) {
        console.log('Sidebar toggle buttons initialized'); // Debug log
        toggleButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                sidebar.classList.toggle('open');
                console.log('Sidebar toggled, open state:', sidebar.classList.contains('open'));
            });
        });
    } else {
        console.warn('Sidebar element or toggle buttons not found');
    }
});