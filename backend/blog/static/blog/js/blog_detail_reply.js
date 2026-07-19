// Reply form template - Vanilla JS
window.getReplyFormHtml = function(commentId) {
    function esc(s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(s));
        return d.innerHTML;
    }
    var csrf = (document.querySelector('[name=csrfmiddlewaretoken]') || {}).value || '';
    var n = '', e = '', nr = '', er = '';
    var identLevel = '', prov = '', provUid = '';
    if (window.USER_AUTHENTICATED) {
        n = esc(window.USER_NAME || '');
        e = esc(window.USER_EMAIL || '');
        nr = ' readonly="readonly"';
        er = ' readonly="readonly"';
        // HU-008: Agregar campos de identificación para usuarios autenticados
        identLevel = window.USER_PROVIDER ? 'registered' : 'identified';
        prov = window.USER_PROVIDER || '';
        provUid = window.USER_PROVIDER_UID || '';
    }
    return '<div class="reply-form-container mt-3 ml-5" style="animation: fadeIn 200ms ease;">' +
        '<form id="frm-' + commentId + '" method="POST" action="' + window.location.pathname + 'comment/">' +
        '<input type="hidden" name="csrfmiddlewaretoken" value="' + csrf + '">' +
        '<input type="hidden" name="parent_id" value="' + commentId + '">' +
        '<input type="hidden" name="website" value="">' +
        '<input type="hidden" name="identification_level" value="' + identLevel + '">' +
        '<input type="hidden" name="provider" value="' + prov + '">' +
        '<input type="hidden" name="provider_uid" value="' + provUid + '">' +
        '<div class="form-group"><input type="text" name="name" class="form-control form-control-sm" placeholder="Tu nombre" value="' + n + '" required' + nr + '></div>' +
        '<div class="form-group"><input type="email" name="email" class="form-control form-control-sm" placeholder="Tu email (opcional)" value="' + e + '"' + er + '></div>' +
        '<div class="form-group"><textarea name="content" class="form-control form-control-sm jd-reply-textarea-dynamic" rows="2" maxlength="500" placeholder="Escribe tu respuesta..." required></textarea>' +
        '<div class="d-flex justify-content-between align-items-center mt-1"><small class="text-muted jd-reply-dynamic-count"><span class="jd-reply-dynamic-num">0</span>/500</small></div></div>' +
        '<div class="d-flex gap-2">' +
        '<button type="submit" id="reply-submit-btn-' + commentId + '" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane mr-1"></i> Responder</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" onclick="document.getElementById(\'reply-form-' + commentId + '\').style.display=\'none\'">Cancelar</button>' +
        '</div></form></div>';
};