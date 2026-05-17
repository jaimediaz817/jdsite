/**
 * Blog Detail - JavaScript
 * Functionalities: Carousel, Zoom, Scroll Infinite, Comments, Share
 */

// ===== CAROUSEL =====
function getSlidesContainer() {
    return document.querySelector('.slides-container');
}

function getSlides() {
    var container = getSlidesContainer();
    return container ? container.querySelectorAll('.slide') : [];
}

function getActiveIndex() {
    var slides = getSlides();
    for (var i = 0; i < slides.length; i++) {
        if (slides[i].classList.contains('active')) return i;
    }
    return 0;
}

function setActiveSlide(index) {
    var slides = getSlides();
    if (!slides.length) return;
    index = (index + slides.length) % slides.length;
    slides.forEach(function(s, i) {
        s.classList.toggle('active', i === index);
    });
    var dots = document.querySelectorAll('.slide-dot');
    dots.forEach(function(d, i) {
        d.classList.toggle('active', i === index);
    });
    var counter = document.querySelector('.slides-counter');
    if (counter) {
        counter.textContent = (index + 1) + ' / ' + slides.length;
    }
}

function prevSlide() { setActiveSlide(getActiveIndex() - 1); }
function nextSlide() { setActiveSlide(getActiveIndex() + 1); }
function goToSlide(dot, idx) { setActiveSlide(idx); }

document.addEventListener('DOMContentLoaded', function() {
    var slides = getSlides();
    if (slides.length) setActiveSlide(0);
});

// ===== GALLERY POPUP =====
window.openGalleryPopup = function(element) {
    var raw = element.querySelector('.gallery-images').value;
    var entries = raw.split('|||');
    var images = [], titles = [], descriptions = [];
    for (var i = 0; i < entries.length; i++) {
        var parts = entries[i].split('||');
        images.push(parts[0]);
        titles.push(parts[1] || '');
        descriptions.push(parts[2] || '');
    }
    var currentIndex = 0;
    var modal = document.createElement('div');
    modal.className = 'gallery-modal position-fixed top-0 left-0 w-100 h-100 d-flex align-items-center justify-content-center';
    modal.style.cssText = 'z-index:999999999;background:rgba(0,0,0,0.92);backdrop-filter:blur(8px);opacity:0;transition:opacity 150ms ease;position:fixed;top:0;left:0;width:100vw;height:100vh;';
    modal.innerHTML = '<button class="gallery-modal-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>' +
        '<button class="gallery-modal-nav prev" onclick="prevImage()"><i class="fas fa-chevron-left"></i></button>' +
        '<button class="gallery-modal-nav next" onclick="nextImage()"><i class="fas fa-chevron-right"></i></button>' +
        '<div class="gallery-modal-image-wrapper"><img id="gallery-modal-img" src="' + images[0] + '">' +
        '<div id="gallery-modal-info"><span id="gallery-modal-title">' + titles[0] + '</span>' +
        '<span id="gallery-modal-desc">' + descriptions[0] + '</span></div></div>' +
        '<div class="gallery-modal-counter">1 / ' + images.length + '</div>';
    
    function updateImage() {
        document.getElementById('gallery-modal-img').src = images[currentIndex];
        var titleEl = document.getElementById('gallery-modal-title');
        var descEl = document.getElementById('gallery-modal-desc');
        titleEl.textContent = titles[currentIndex];
        titleEl.style.display = titles[currentIndex] ? '' : 'none';
        descEl.textContent = descriptions[currentIndex];
        descEl.style.display = descriptions[currentIndex] ? '' : 'none';
        modal.querySelector('.gallery-modal-counter').textContent = (currentIndex + 1) + ' / ' + images.length;
    }
    document.body.appendChild(modal);
    setTimeout(function() { modal.style.opacity = '1'; }, 10);
    window.prevImage = function() {
        currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        updateImage();
    };
    window.nextImage = function() {
        currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        updateImage();
    };
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    document.onkeydown = function(e) {
        if (e.key === 'Escape') modal.remove();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    };
};

// ===== READING PROGRESS BAR =====
console.log('Iniciando barra progreso');
var hideTimeout;
document.addEventListener('DOMContentLoaded', function() {
    var progressBar = document.querySelector('.reading-progress-bar');
    if (!progressBar) { console.warn('No se encontro .reading-progress-bar'); return; }
    console.log('Barra de progreso encontrada');
    window.onscroll = function() {
        var scrol = window.pageYOffset || document.documentElement.scrollTop;
        var altoTotal = document.documentElement.scrollHeight - window.innerHeight;
        if (altoTotal <= 0) altoTotal = 1;
        var porcentaje = Math.min(100, Math.max(0, (scrol / altoTotal) * 100));
        var progressFill = progressBar.querySelector('.reading-progress-fill');
        if (progressFill) {
            progressFill.style.width = porcentaje + '%';
        }
        if (porcentaje > 5) {
            progressBar.classList.add('visible');
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(function() { progressBar.classList.remove('visible'); }, 2000);
        } else {
            progressBar.classList.remove('visible');
        }
        var barraFlotante = document.querySelector('.floating-reaction-bar');
        if (barraFlotante) {
            if (porcentaje > 12 && porcentaje < 82) {
                barraFlotante.classList.add('visible');
            } else {
                barraFlotante.classList.remove('visible');
            }
        }
    };
    if (window.onscroll) window.onscroll();
});

// ===== IMAGE ZOOM =====
document.addEventListener('DOMContentLoaded', function() {
    var modal = document.getElementById('image-zoom-modal');
    var modalImg = document.getElementById('image-zoom-content');
    if (modal && modalImg) {
        document.querySelectorAll('.blog-content img').forEach(function(img) {
            img.addEventListener('click', function() {
                modalImg.src = img.src;
                modal.showModal();
            });
        });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.close(); });
    }
});

// ===== SHARE BUTTONS =====
document.addEventListener('DOMContentLoaded', function() {
    var copyLinkBtn = document.querySelector('.copy-link-btn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async function(e) {
            e.preventDefault(); e.stopPropagation();
            var originalText = this.innerHTML;
            var url = window.location.href;
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(url); mostrarExito(this, originalText); return;
                }
            } catch (err) {}
            try {
                var textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px;opacity:0;';
                document.body.appendChild(textArea);
                textArea.focus(); textArea.select();
                var exitoso = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (exitoso) mostrarExito(this, originalText);
                else throw new Error('Fallo execCommand');
            } catch (err) { prompt('Copia este enlace manualmente:', url); }
        });
    }

    function mostrarExito(btn, textoOriginal) {
        btn.innerHTML = '<i class="fas fa-check mr-1"></i> Enlace copiado!';
        btn.classList.remove('btn-outline-secondary'); btn.classList.add('btn-success');
        setTimeout(function() { btn.innerHTML = textoOriginal; btn.classList.remove('btn-success'); btn.classList.add('btn-outline-secondary'); }, 2200);
    }

    var commentsFloatBtn = document.querySelector('.floating-reaction-bar a[href="#comments"]');
    if (commentsFloatBtn) {
        commentsFloatBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var commentsSection = document.getElementById('comments');
            if (commentsSection) {
                var targetPos = commentsSection.offsetTop - 80;
                window.scrollTo(0, targetPos);
            }
        });
    }

    var commentFloatBtn = document.querySelector('.float-nav-btn.comment-btn');
    if (commentFloatBtn) {
        commentFloatBtn.addEventListener('click', function() {
            var commentsSection = document.getElementById('comments');
            if (commentsSection) {
                var targetPos = commentsSection.offsetTop - 80;
                window.scrollTo(0, targetPos);
                setTimeout(function() { var textarea = document.querySelector('textarea[name="content"]'); if (textarea) textarea.focus(); }, 600);
            }
        });
    }

    var floatRightNav = document.querySelector('.floating-right-nav');
    if (floatRightNav) floatRightNav.classList.add('visible');
});

// ===== COMMENTS - MAIN FORM SUBMIT =====
window.submitMainCommentForm = async function(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Enviando...';
    
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
        });
        if (!response.ok) {
            // Intentar extraer errores de validación del body en 400
            try {
                var errorData = await response.clone().json();
                if (errorData && errorData.errors) {
                    var msgs = [];
                    for (var field in errorData.errors) {
                        if (errorData.errors.hasOwnProperty(field)) {
                            msgs.push(errorData.errors[field].join(' '));
                        }
                    }
                    if (msgs.length) throw new Error(msgs.join(' '));
                }
            } catch (e) {
                if (e.message !== 'Failed to fetch' && !e.message.startsWith('Error')) throw e;
            }
            if (response.status === 403) throw new Error('Error de seguridad CSRF. Por favor recarga la pagina.');
            if (response.status === 500) throw new Error('Error interno en el servidor.');
            throw new Error('Error ' + response.status + ': Ha ocurrido un problema');
        }
        var data;
        try { data = await response.json(); } catch (jsonError) {
            throw new Error('Error al procesar la respuesta del servidor.');
        }
        if (!data.success) throw new Error('Error en el servidor');
        if (typeof $ !== 'undefined' && $.toast) {
            $.toast({ heading: 'Comentario enviado!', text: 'Tu comentario esta pendiente de aprobacion y sera publicado pronto.', icon: 'success', position: 'top-right', hideAfter: 4500, stack: 4, bgColor: '#7c3aed', loaderBg: '#6366f1' });
        } else { alert('Comentario enviado!'); }
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
        var msg = error.message || 'Ha ocurrido un error';
        if (typeof $ !== 'undefined' && $.toast) {
            $.toast({ heading: 'Error', text: msg, icon: 'error', position: 'top-right', hideAfter: 5500, stack: 4, bgColor: '#dc2626', loaderBg: '#f87171' });
        } else { alert('Error: ' + msg); }
    }
};

function handleCommentSubmit(e) {
    e.preventDefault();
    if (window.submitMainCommentForm) window.submitMainCommentForm(e.target);
}

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
    if (window.USER_AUTHENTICATED) {
        n = esc(window.USER_NAME || '');
        e = esc(window.USER_EMAIL || '');
        nr = ' readonly="readonly"';
        er = ' readonly="readonly"';
    }
    return '<div class="reply-form-container mt-3 ml-5" style="animation: fadeIn 200ms ease;">' +
        '<form id="frm-' + commentId + '" method="POST" action="' + window.location.pathname + 'comment/">' +
        '<input type="hidden" name="csrfmiddlewaretoken" value="' + csrf + '">' +
        '<input type="hidden" name="parent_id" value="' + commentId + '">' +
        '<input type="hidden" name="website" value="">' +
        '<div class="form-group"><input type="text" name="name" class="form-control form-control-sm" placeholder="Tu nombre" value="' + n + '" required' + nr + '></div>' +
        '<div class="form-group"><input type="email" name="email" class="form-control form-control-sm" placeholder="Tu email (opcional)" value="' + e + '"' + er + '></div>' +
        '<div class="form-group"><textarea name="content" class="form-control form-control-sm jd-reply-textarea-dynamic" rows="2" maxlength="500" placeholder="Escribe tu respuesta..." required></textarea>' +
        '<div class="d-flex justify-content-between align-items-center mt-1"><small class="text-muted jd-reply-dynamic-count"><span class="jd-reply-dynamic-num">0</span>/500</small></div></div>' +
        '<div class="d-flex gap-2">' +
        '<button type="submit" id="reply-submit-btn-' + commentId + '" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane mr-1"></i> Responder</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" onclick="document.getElementById(\'reply-form-' + commentId + '\').style.display=\'none\'">Cancelar</button>' +
        '</div></form></div>';
};

// Submit reply form - AJAX POST, muestra skeleton, NO recarga pagina
window.submitReplyForm = function(commentId) {
    var form = document.getElementById('frm-' + commentId);
    if (!form) { console.error('Form not found'); return false; }
    var btn = document.getElementById('reply-submit-btn-' + commentId);
    if (!btn) return false;
    var orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Enviando...';

    fetch(form.action, { method: 'POST', body: new FormData(form), credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } })
    .then(function(r) {
        if (!r.ok) {
            // Intentar extraer errores de validación del body en 400
            return r.json().then(function(errorData) {
                if (errorData && errorData.errors) {
                    var msgs = [];
                    for (var field in errorData.errors) {
                        if (errorData.errors.hasOwnProperty(field)) {
                            msgs.push(errorData.errors[field].join(' '));
                        }
                    }
                    if (msgs.length) throw new Error(msgs.join(' '));
                }
                throw new Error('Error ' + r.status + ': Ha ocurrido un problema');
            }).catch(function(e) {
                throw e;
            });
        }
        return r.json();
    })
    .then(function(d) {
        if (!d.success) throw new Error('Error en el servidor');
        if (!d.comment_id) throw new Error('No se obtuvo ID del comentario');
        var inlineReply = document.getElementById('reply-form-' + commentId);
        if (inlineReply) inlineReply.style.display = 'none';
        var commentEl = inlineReply ? inlineReply.closest('.jd-comment') : null;
        if (commentEl) {
            var pendingHtml = '<div class="jd-pending-reply mt-2" style="animation: fadeIn 300ms ease; padding: 10px 14px; background: rgba(124,58,237,0.08); border-left: 3px solid #7c3aed; border-radius: 8px; margin-left: 50px;">' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                '<div class="sk-comment-avatar" style="width:28px;height:28px;min-width:28px;border-radius:50%;background:#e5e7eb;animation:pulse 1.5s ease infinite;"></div>' +
                '<div style="flex:1;"><div class="sk-line" style="height:10px;width:120px;background:#e5e7eb;border-radius:4px;margin-bottom:6px;animation:pulse 1.5s ease infinite;"></div>' +
                '<div class="sk-line" style="height:10px;width:80px;background:#e5e7eb;border-radius:4px;animation:pulse 1.5s ease infinite;"></div></div>' +
                '<span style="font-size:11px;color:#7c3aed;white-space:nowrap;"><i class="fas fa-clock mr-1"></i> Pendiente</span></div></div>';
            var actionsEl = commentEl.querySelector('.jd-comment-actions');
            if (actionsEl) { actionsEl.insertAdjacentHTML('afterend', pendingHtml); }
            else { commentEl.querySelector('.jd-comment-body').insertAdjacentHTML('beforeend', pendingHtml); }
        }
        if (typeof $ !== 'undefined' && $.toast) { $.toast({ heading:'Enviado!', text:'Respuesta pendiente de aprobacion.', icon:'success', position:'top-right', hideAfter:3000 }); }
        form.reset();
        btn.disabled = false;
        btn.innerHTML = orig;
    })
    .catch(function(err) {
        btn.disabled = false; btn.innerHTML = orig;
        var msg = err.message || 'Error';
        if (typeof $ !== 'undefined' && $.toast) { $.toast({ heading:'Error', text:msg, icon:'error', position:'top-right', hideAfter:5500 }); }
        else { alert('Error: ' + msg); }
    });
    return false;
};