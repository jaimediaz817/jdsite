/*
Task Progress:
- [x] Analyze requirements
- [x] Identify modal handling issue
- [x] Fix bootstrap.Modal.getInstance usage
- [ ] Ensure image counting works
*/
function getCookie(name) {
    let c = null;
    if (document.cookie) {
        document.cookie.split(';').forEach(function(x) {
            const t = x.trim();
            if (t.substring(0, name.length+1) === name+'=') c = decodeURIComponent(t.substring(name.length+1));
        });
    }
    return c;
}
function showToast(msg, type) {
    var container = document.getElementById('toastContainer');
    // Crear elemento toast sin innerHTML para evitar conflictos con Bootstrap
    var toast = document.createElement('div');
    toast.style.cssText = 'min-width:280px;padding:12px 48px 12px 16px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.12);color:#fff;font-size:.875rem;font-weight:500;position:relative;line-height:1.4;margin-bottom:8px;';
    toast.style.background = type === 'success' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#dc2626)';
    // Texto del mensaje como nodo texto (seguro)
    toast.appendChild(document.createTextNode(msg));
    // Botón close construido desde cero con SVG inline blanco
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Cerrar');
    btn.style.cssText = 'position:absolute;top:50%;right:12px;transform:translateY(-50%);width:28px;height:28px;padding:4px;border:none;border-radius:6px;background:rgba(255,255,255,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#fff" viewBox="0 0 16 16"><path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z"/></svg>';
    btn.onmouseenter = function() { this.style.background = 'rgba(255,255,255,0.45)'; };
    btn.onmouseleave = function() { this.style.background = 'rgba(255,255,255,0.25)'; };
    btn.onclick = function() { if (toast.parentNode) toast.parentNode.removeChild(toast); };
    toast.appendChild(btn);
    container.appendChild(toast);
    // Auto-eliminar después de 4 segundos
    setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
}

document.querySelectorAll('.toggle-switch').forEach(function(t) {
    t.addEventListener('change', function() {
        const slug = this.dataset.slug, cb = this, csrf = getCookie('csrftoken');
        fetch('/blog/dashboard/toggle/' + slug + '/', {
            method: 'POST', headers: {'X-CSRFToken':csrf, 'Content-Type':'application/json'}
        }).then(r=>r.json()).then(d=>{
            if (d.success) { showToast('✅ '+(d.is_published?'Publicado':'Despublicado')+' correctamente','success'); document.getElementById('row-'+slug).querySelector('.moderation-select').value=d.moderation_status; }
            else { cb.checked=!cb.checked; showToast('❌ '+d.error,'error'); }
        }).catch(()=>{ cb.checked=!cb.checked; showToast('❌ Error de red','error'); });
    });
});

document.querySelectorAll('.moderation-select').forEach(function(s) {
    s.addEventListener('change', function() {
        const slug = this.dataset.slug, val = this.value, csrf = getCookie('csrftoken');
        fetch('/blog/dashboard/moderate/' + slug + '/', {
            method: 'POST', headers: {'X-CSRFToken':csrf, 'Content-Type':'application/x-www-form-urlencoded'},
            body: 'status='+encodeURIComponent(val)
        }).then(r=>r.json()).then(d=>{
            if (d.success) { showToast('Moderación actualizada','success'); const r=document.getElementById('row-'+slug); if(r) r.querySelector('.toggle-switch').checked=d.is_published; }
            else showToast('❌ '+d.error,'error');
        }).catch(()=>showToast('❌ Error de red','error'));
    });
});

// =============================================
// HU-011.9: Eliminación permanente de artículos
// =============================================
let deletePostId = null;
let deletePostTitle = null;
let deletePostSlug = null;
let deleteModalInstance = null;

function confirmDelete(btn) {
    deletePostId = btn.dataset.postId;
    deletePostTitle = btn.dataset.postTitle;
    deletePostSlug = btn.dataset.postSlug;
    document.getElementById('deleteModalTitle').textContent = deletePostTitle;

    // Usar Bootstrap 5 nativo: crear instancia del modal y mostrar
    var modalEl = document.getElementById('deleteModal');
    if (!deleteModalInstance) {
        deleteModalInstance = new bootstrap.Modal(modalEl);
    }
    deleteModalInstance.show();
}

// Cerrar manualmente el modal desde los botones Cancelar y backdrop
document.addEventListener('DOMContentLoaded', function () {
    var modalEl = document.getElementById('deleteModal');
    if (modalEl) {
        // Forzar cierre manual para cualquier botón con data-bs-dismiss="modal"
        // (tanto el botón X del header como Cancelar del footer),
        // porque data-bs-dismiss nativo no funciona consistentemente
        modalEl.querySelectorAll('[data-bs-dismiss="modal"]').forEach(function(btn) {
            btn.addEventListener('click', function (e) {
                if (deleteModalInstance) {
                    deleteModalInstance.hide();
                }
            });
        });
        // También forzar cierre al hacer clic fuera del modal (backdrop)
        modalEl.addEventListener('hidden.bs.modal', function () {
            // Resetear estado si es necesario
        });
    }
});

function executeDelete() {
    if (!deletePostId) return;
    const csrf = getCookie('csrftoken');
    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Eliminando...';

    // Build URL manually because template tags are not processed in static JS files
    const deleteUrl = `/blog/dashboard/delete/${deletePostId}/`;
    fetch(deleteUrl, {
        method: 'POST',
        headers: {'X-CSRFToken': csrf, 'Content-Type': 'application/json'}
    }).then(r => r.json()).then(d => {
        if (deleteModalInstance) {
            deleteModalInstance.hide();
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash me-1"></i>Eliminar permanentemente';

        if (d.success) {
            showToast('🗑️ ' + d.message, 'success');
            // Eliminar la fila de la tabla (el row usa slug como id)
            const row = document.getElementById('row-' + deletePostSlug);
            if (row) row.remove();
            // NOTE: Actualizar las estadísticas (badges) del dashboard con los valores frescos
            // del backend para que los contadores (Total, Publicados, etc.) se reflejen
            // inmediatamente tras la eliminación sin necesidad de recargar la página.
            if (d.stats) {
                updateDashboardStats(d.stats);
            }
            // NOTE: Si la tabla queda vacía tras eliminar, recargamos la página
            // para mostrar el mensaje "No se encontraron artículos" de forma correcta
            var tbody = document.querySelector('table tbody');
            if (tbody && tbody.querySelectorAll('tr').length === 0) {
                setTimeout(function() { window.location.reload(); }, 800);
            }
        } else {
            showToast('❌ ' + (d.error || 'Error al eliminar'), 'error');
        }
    }).catch(() => {
        if (deleteModalInstance) {
            deleteModalInstance.hide();
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash me-1"></i>Eliminar permanentemente';
        showToast('❌ Error de red', 'error');
    });
}

// NOTE: updateDashboardStats() actualiza los nodos .stat-number del DOM
// con los valores calculados en el backend tras cada eliminación,
// manteniendo los badges sincronizados con la base de datos.
function updateDashboardStats(stats) {
    var statCards = document.querySelectorAll('.stat-card');
    // Mapping: el orden de las tarjetas en el HTML coincide con:
    // [Total, Publicados, Borradores, Pendientes, Aprobados, Rechazados]
    var keys = ['total', 'published', 'drafts', 'pending', 'approved', 'rejected'];
    statCards.forEach(function(card, idx) {
        if (idx < keys.length && stats[keys[idx]] !== undefined) {
            var numEl = card.querySelector('.stat-number');
            if (numEl) numEl.textContent = stats[keys[idx]];
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    var refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            // Recargar la página completa para obtener datos actualizados
            window.location.reload();
        });
    }

    // ── Detectar permission_error en query params y mostrar toast ──
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('permission_error') === 'resources') {
        showToast('🔒 No tienes permisos para acceder a la gestión de recursos. Solo los administradores pueden visualizar esta sección.', 'error');
        // Limpiar el param de la URL para que no se repita al refrescar
        urlParams.delete('permission_error');
        var cleanUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', cleanUrl);
    }
});

// =============================================
// HU-17.18: Autocomplete AJAX de autores
// =============================================
(function() {
    var input = document.getElementById('author-autocomplete-input');
    var suggestionsDiv = document.getElementById('author-suggestions');
    if (!input || !suggestionsDiv) return;

    var debounceTimer;

    input.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        var q = this.value.trim();

        if (q.length < 2) {
            suggestionsDiv.classList.add('d-none');
            return;
        }

        debounceTimer = setTimeout(function() {
            fetch('/blog/api/authors/autocomplete/?q=' + encodeURIComponent(q))
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    if (data.authors.length === 0) {
                        suggestionsDiv.classList.add('d-none');
                        return;
                    }

                    suggestionsDiv.innerHTML = data.authors.map(function(a) {
                        return '<div class="author-suggestion-item" data-username="' + a.username + '" data-display="' + a.display + '">' + a.display + '</div>';
                    }).join('');
                    suggestionsDiv.classList.remove('d-none');

                    Array.from(suggestionsDiv.querySelectorAll('.author-suggestion-item')).forEach(function(item) {
                        item.addEventListener('click', function() {
                            input.value = this.dataset.username;
                            suggestionsDiv.classList.add('d-none');
                            input.closest('form').submit();
                        });
                    });
                })
                .catch(function() {
                    suggestionsDiv.classList.add('d-none');
                });
        }, 300);
    });

    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.classList.add('d-none');
        }
    });
})();

// =============================================
// HU-17.18: Toggle collapse filtros avanzados
// =============================================
// Manejo manual del collapse (sin data-bs-toggle de Bootstrap)
(function() {
    var toggleBtn = document.getElementById('toggle-advanced-filters');
    var collapseEl = document.getElementById('advanced-filters-collapse');
    if (!toggleBtn || !collapseEl) return;

    function updateToggleText(isExpanded) {
        if (isExpanded) {
            toggleBtn.innerHTML = '<i class="fas fa-times me-1"></i><span id="toggle-advanced-text">Cerrar filtros</span>';
            toggleBtn.setAttribute('aria-expanded', 'true');
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-cog me-1"></i><span id="toggle-advanced-text">Filtros avanzados</span>';
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // Click en el botón: toggle manual de la clase 'show'
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

    // Estado inicial
    if (collapseEl.classList.contains('show')) {
        updateToggleText(true);
    }
})();

// =============================================
// HU-17.18: Mejoras al buscador #blog-search-input
// =============================================
(function() {
    var searchInput = document.getElementById('blog-search-input');
    if (!searchInput) return;

    var form = searchInput.closest('form');
    var debounceTimer;

    // 1. Botón X para limpiar — crear dinámicamente
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

    // 3. Atajo Escape → limpiar + cerrar foco
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchInput.value = '';
            toggleClearBtn();
            searchInput.blur();
        }
    });
})();

// ============================================================
// HU-011.17: Gestión de Recursos — Filtros + Eliminar huérfanos
// ============================================================
(function() {
    var resourcesSection = document.getElementById('resources-section');
    if (!resourcesSection) return;

    // Filtros del mapa de compilación
    var filterButtons = document.querySelectorAll('#resource-filters .btn');
    var resourceRows = document.querySelectorAll('#compilation-table .resource-row');

    filterButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterButtons.forEach(function(b) { b.classList.remove('active-filter'); });
            this.classList.add('active-filter');
            var filter = this.dataset.filter;
            resourceRows.forEach(function(row) {
                row.style.display = (filter === 'all' || row.dataset.status === filter) ? '' : 'none';
            });
        });
    });

    // Checkbox "Seleccionar todo"
    var selectAll = document.getElementById('select-all-orphans');
    var orphanCheckboxes = document.querySelectorAll('.orphan-checkbox');
    var deleteBtn = document.getElementById('btn-delete-orphans');

    function updateDeleteBtn() {
        if (!deleteBtn) return;
        var selected = document.querySelectorAll('.orphan-checkbox:checked');
        deleteBtn.disabled = selected.length === 0;
        deleteBtn.innerHTML = '<i class="fas fa-trash me-1"></i>Eliminar (' + selected.length + ') seleccionados';
    }

    if (selectAll) {
        selectAll.addEventListener('change', function() {
            orphanCheckboxes.forEach(function(cb) { cb.checked = selectAll.checked; });
            updateDeleteBtn();
        });
    }

    orphanCheckboxes.forEach(function(cb) {
        cb.addEventListener('change', function() {
            updateDeleteBtn();
            if (selectAll) {
                var allChecked = true;
                orphanCheckboxes.forEach(function(c) { if (!c.checked) allChecked = false; });
                selectAll.checked = allChecked;
                if (!this.checked) selectAll.checked = false;
            }
        });
    });

    // Eliminar huérfanos vía AJAX
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            var selected = document.querySelectorAll('.orphan-checkbox:checked');
            if (selected.length === 0) return;
            if (!confirm('¿Eliminar permanentemente ' + selected.length + ' carpetas huérfanas?\n\nEsta acción no se puede deshacer.')) return;

            var folders = [];
            selected.forEach(function(cb) { folders.push(cb.dataset.folder); });

            var csrf = getCookie('csrftoken');
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Eliminando...';

            fetch('/blog/dashboard/delete-orphan/', {
                method: 'POST',
                headers: { 'X-CSRFToken': csrf, 'Content-Type': 'application/json' },
                body: JSON.stringify({ folders: folders })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    showToast('✅ ' + data.message, 'success');
                    setTimeout(function() { location.reload(); }, 1500);
                } else {
                    showToast('❌ ' + (data.error || 'Error al eliminar'), 'error');
                    deleteBtn.disabled = false;
                    updateDeleteBtn();
                }
            })
            .catch(function(err) {
                showToast('❌ Error de red: ' + err.message, 'error');
                deleteBtn.disabled = false;
                updateDeleteBtn();
            });
        });
    }
})();

// =============================================
// HU-27: Toggle sidebar en móvil
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    var sidebar = document.querySelector('.absolute-sidebar');
    var toggleButtons = document.querySelectorAll('.sidebar-toggle, .sidebar-float-toggle, .sidebar-header-toggle');
    if (sidebar && toggleButtons.length) {
        toggleButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                sidebar.classList.toggle('open');
            });
        });
    }
});

// ============================================================
// Botón "📂 Recursos" — Verificación de permisos (SOLO superadmin)
// Si el usuario NO es superadmin, mostrar toast en lugar de redirigir
// ============================================================
(function() {
    var btnRecursos = document.getElementById('btn-recursos');
    if (!btnRecursos) return;

    btnRecursos.addEventListener('click', function() {
        var isSuperuser = btnRecursos.getAttribute('data-is-superuser') === 'true';
        var resourcesUrl = btnRecursos.getAttribute('data-resources-url');

        if (isSuperuser) {
            // Redirigir al dashboard de recursos
            window.location.href = resourcesUrl;
        } else {
            // Mostrar toast de permisos denegados
            showToast('🔒 No tienes permisos para acceder a la gestión de recursos. Solo los administradores pueden visualizar esta sección.', 'error');
        }
    });
})();
 

// =============================================
// HU-026-B: Guardar email propietario vía AJAX
// [DESACTIVADO - DUPLICADO] Ahora se gestiona desde blog_email_config.html
// =============================================
/*
(function() {
    var btnSave = document.getElementById('btn-save-owner-email');
    if (!btnSave) return;

    btnSave.addEventListener('click', function() {
        var email = document.getElementById('owner-email-input').value.trim();
        var csrf = getCookie('csrftoken');
        var btn = this;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';

        fetch('/blog/dashboard/config/owner-email/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrf,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
            if (data.success) {
                showToast('✅ Email propietario guardado correctamente', 'success');
            } else {
                showToast('❌ ' + (data.error || 'Error al guardar'), 'error');
            }
        })
        .catch(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
            showToast('❌ Error de red', 'error');
        });
    });
})();
*/
