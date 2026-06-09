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
    const el = document.createElement('div');
    el.className = 'alert alert-dismissible fade show text-white';
    el.style.cssText = 'min-width:280px;box-shadow:0 4px 16px rgba(0,0,0,.12);border-radius:12px;';
    el.style.background = type==='success' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#dc2626)';
    el.innerHTML = msg+'<button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>';
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(()=>el.remove(),4000);
}

document.querySelectorAll('.toggle-switch').forEach(function(t) {
    t.addEventListener('change', function() {
        const slug = this.dataset.slug, cb = this, csrf = getCookie('csrftoken');
        fetch("{% url 'blog:toggle_published' '__SLUG__' %}".replace('__SLUG__', slug), {
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
        fetch("{% url 'blog:change_moderation' '__SLUG__' %}".replace('__SLUG__', slug), {
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

function confirmDelete(btn) {
    deletePostId = btn.dataset.postId;
    deletePostTitle = btn.dataset.postTitle;
    deletePostSlug = btn.dataset.postSlug;
    document.getElementById('deleteModalTitle').textContent = deletePostTitle;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

function executeDelete() {
    if (!deletePostId) return;
    const csrf = getCookie('csrftoken');
    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Eliminando...';

    fetch("{% url 'blog:delete_blog' 0 %}".replace('/0/', '/' + deletePostId + '/'), {
        method: 'POST',
        headers: {'X-CSRFToken': csrf, 'Content-Type': 'application/json'}
    }).then(r => r.json()).then(d => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash me-1"></i>Eliminar permanentemente';

        if (d.success) {
            showToast('🗑️ ' + d.message, 'success');
            // Eliminar la fila de la tabla (el row usa slug como id)
            const row = document.getElementById('row-' + deletePostSlug);
            if (row) row.remove();
        } else {
            showToast('❌ ' + (d.error || 'Error al eliminar'), 'error');
        }
    }).catch(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash me-1"></i>Eliminar permanentemente';
        showToast('❌ Error de red', 'error');
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
});    