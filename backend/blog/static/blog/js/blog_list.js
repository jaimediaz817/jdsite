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

// =============================================
// HU-17.19: Toggle sort menu (ordenamiento)
// =============================================
(function() {
    var sortBtn = document.getElementById('toggle-sort-menu');
    var sortMenu = document.getElementById('sort-menu');
    if (!sortBtn || !sortMenu) return;

    sortBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var isOpen = sortMenu.style.display !== 'none';
        if (isOpen) {
            sortMenu.style.display = 'none';
            sortBtn.setAttribute('aria-expanded', 'false');
        } else {
            sortMenu.style.display = 'block';
            sortBtn.setAttribute('aria-expanded', 'true');
        }
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!sortBtn.contains(e.target) && !sortMenu.contains(e.target)) {
            sortMenu.style.display = 'none';
            sortBtn.setAttribute('aria-expanded', 'false');
        }
    });
})();

// Manejo manual (sin data-bs-toggle)
(function() {
    var toggleBtn = document.getElementById('toggle-advanced-filters');
    var collapseEl = document.getElementById('advanced-filters-collapse');
    if (!toggleBtn || !collapseEl) return;

    function updateToggleText(isExpanded) {
        if (isExpanded) {
            toggleBtn.innerHTML = '<i class="fas fa-times me-1 mr-1"></i><span id="toggle-advanced-text">Cerrar filtros</span>';
            toggleBtn.setAttribute('aria-expanded', 'true');
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-cog me-1 mr-1"></i><span id="toggle-advanced-text">Filtros avanzados</span>';
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }

    toggleBtn.addEventListener('click', function() {
        var isExpanded = collapseEl.classList.contains('show');
        if (isExpanded) {
            collapseEl.classList.remove('show');
            updateToggleText(false);
        } else {
            collapseEl.classList.add('show');
            updateToggleText(true);
        }
    });

    if (collapseEl.classList.contains('show')) {
        updateToggleText(true);
    }
})();

// =============================================
// HU-17.19: Mejoras al buscador #blog-search-input
// =============================================
(function() {
    var searchInput = document.getElementById('blog-search-input');
    if (!searchInput) return;

    var form = searchInput.closest('form');
    var debounceTimer;

    // 1. Botón X para limpiar
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn-clear-search';
    clearBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
    clearBtn.title = 'Limpiar búsqueda';
    clearBtn.setAttribute('aria-label', 'Limpiar búsqueda');

    var inputGroup = searchInput.closest('.input-group');
    if (inputGroup) {
        inputGroup.appendChild(clearBtn);
    }

    function toggleClearBtn() {
        clearBtn.style.display = searchInput.value.trim() ? 'block' : 'none';
    }
    toggleClearBtn();
    searchInput.addEventListener('input', toggleClearBtn);

    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        toggleClearBtn();
        searchInput.focus();
        var url = new URL(window.location.href);
        url.searchParams.delete('q');
        url.searchParams.delete('page');
        window.location.href = url.toString();
    });

    // 2. Búsqueda en vivo con debounce (500ms)
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        var val = this.value.trim();
        debounceTimer = setTimeout(function() {
            if (val.length >= 2 || val.length === 0) {
                form.submit();
            }
        }, 500);
    });

    // 3. Atajo Escape
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchInput.value = '';
            toggleClearBtn();
            searchInput.blur();
        }
    });
})();

// =============================================
// HU-17.19: Sticky observer para sombra
// =============================================
(function() {
    var stickyRow = document.getElementById('filters-sticky-row');
    var chipsRow = document.getElementById('filter-chips-row');

    if (stickyRow) {
        var observer = new IntersectionObserver(
            function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) {
                        stickyRow.classList.add('is-sticky');
                    } else {
                        stickyRow.classList.remove('is-sticky');
                    }
                });
            },
            { threshold: 0 }
        );
        // Observar el siguiente elemento después del sticky
        var nextEl = stickyRow.nextElementSibling;
        if (nextEl) observer.observe(nextEl);
    }

    if (chipsRow) {
        var observer2 = new IntersectionObserver(
            function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) {
                        chipsRow.classList.add('is-sticky');
                    } else {
                        chipsRow.classList.remove('is-sticky');
                    }
                });
            },
            { threshold: 0 }
        );
        var nextEl2 = chipsRow.nextElementSibling;
        if (nextEl2) observer2.observe(nextEl2);
    }
})();

// =============================================
// HU-031: Interceptar clicks en artículos no accesibles
// Muestra toast y evita navegación a 404
// =============================================
(function() {
    // Interceptor global para clicks en artículos
    var pendingRedirect = null;

    document.addEventListener('click', function(e) {
        var link = e.target.closest('a.article-link, a.stretched-link, .title-article-content a');
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href || !href.match(/^\/blog\/[^/]+\/?$/)) return;

        var slug = href.split('/blog/')[1].replace(/\/$/, '');

        // Cancelar cualquier redirección pendiente previa
        if (pendingRedirect) {
            clearTimeout(pendingRedirect);
            pendingRedirect = null;
        }

        // Prevenir navegación inmediata
        e.preventDefault();
        e.stopPropagation();

        // Verificar accesibilidad vía AJAX
        fetch('/blog/api/post-can-view/' + slug + '/')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.can_view) {
                    // Navegar normalmente después de verificar
                    window.location.href = href;
                } else if (data.exists) {
                    // Mostrar toast premium y permanecer en blog_list
                    var msg = 'Este artículo no está disponible.<br><small>Estado: <em>' + (data.reason || 'Pendiente de aprobación') + '</em></small>';
                    window.showBlogToast(msg, 'warning');
                } else {
                    // Artículo no existe, mostrar toast premium de error
                    var msg = '<strong>@"' + slug + '"</strong> no fue encontrado. El artículo puede haber sido eliminado o la URL es incorrecta.';
                    window.showBlogToast(msg, 'danger');
                }
            })
            .catch(function() {
                // En caso de error, permitir navegación normal
                console.warn('No se pudo verificar disponibilidad del artículo:', slug);
                window.location.href = href;
            });
    });
})();
