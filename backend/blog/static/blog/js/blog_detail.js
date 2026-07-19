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

// Exponer funciones del carrusel globalmente para uso desde onclick en el HTML
window.prevSlide = prevSlide;
window.nextSlide = nextSlide;
window.goToSlide = goToSlide;

function initSlides() {
    var container = getSlidesContainer();
    if (!container) return;
    if (container.dataset.slidesInitialized) return;
    container.dataset.slidesInitialized = 'true';
    var slides = getSlides();
    if (slides.length) setActiveSlide(0);

    // Navegación táctil (swipe) y por clic en zonas izquierda/derecha
    var startX = 0, startY = 0;
    container.addEventListener('touchstart', function(e) {
        startX = e.changedTouches[0].screenX;
        startY = e.changedTouches[0].screenY;
    }, { passive: true });
    container.addEventListener('touchend', function(e) {
        var dx = e.changedTouches[0].screenX - startX;
        var dy = e.changedTouches[0].screenY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            if (dx < 0) nextSlide(); else prevSlide();
        }
    }, { passive: true });

    function onContainerClick(e) {
        var target = e.target;
        if (target.closest('a, button, .slide-caption, .gallery-images, input, textarea, select')) return;
        if (target.closest('.popup-gallery-container, [onclick*="openGalleryPopup"]')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (window.galleryModalOpen) return;

        var rect = container.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        if (x < 0.35) { e.preventDefault(); prevSlide(); }
        else if (x > 0.65) { e.preventDefault(); nextSlide(); }
    }
    container._jdClickHandler = onContainerClick;
    container.addEventListener('click', onContainerClick);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlides);
} else {
    initSlides();
}

// Back to top button functionality
// Back to top button functionality
document.addEventListener('DOMContentLoaded', function() {
    var backBtn = document.getElementById('back-to-top');
    if (!backBtn) return;
    // Show/hide on scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backBtn.classList.add('show');
        } else {
            backBtn.classList.remove('show');
        }
    });

    // Smooth progressive scroll
    backBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const startPosition = window.scrollY;
        const duration = 800;
        const startTime = performance.now();
        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }
        function scrollStep(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            window.scrollTo(
                0,
                startPosition * (1 - easedProgress)
            );
            if (progress < 1) {
                requestAnimationFrame(scrollStep);
            }
        }
        requestAnimationFrame(scrollStep);
    });
});

// ===== GALLERY POPUP =====
window.openGalleryPopup = function(element) {
    window.galleryModalOpen = true;
    disableSlides(true);
    closeLightboxIfOpen();

    if (element) {
        element.setAttribute('aria-expanded', 'true');
    }

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
    modal.onclick = function(e) {
        if (e.target === modal) { modal.remove(); window.galleryModalOpen = false; disableSlides(false); }
    };
    document.onkeydown = function(e) {
        if (e.key === 'Escape') { modal.remove(); window.galleryModalOpen = false; disableSlides(false); }
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    };
    // Asegurar cierre de bandera aunque se cierre por botón interno
    window.addEventListener('gallery-popup-closed', function() { window.galleryModalOpen = false; disableSlides(false); });

    // Cierre robusto desde botón interno del modal
    var closeBtn = modal.querySelector('.gallery-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.remove();
            window.galleryModalOpen = false;
            disableSlides(false);
        });
    }
};

function disableSlides(disabled) {
    var container = getSlidesContainer();
    if (!container || !container._jdClickHandler) return;
    if (disabled) {
        container.classList.add('gallery-open');
        container.removeEventListener('click', container._jdClickHandler);
    } else {
        container.classList.remove('gallery-open');
        container.addEventListener('click', container._jdClickHandler);
    }
}

function closeLightboxIfOpen() {
    var modal = document.getElementById('image-zoom-modal');
    if (!modal) return;
    try { modal.close(); } catch (e) { modal.style.display = ''; }
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.dispatchEvent(new Event('gallery-popup-closed'));
}

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

// ===== IMAGE LAZY LOADING & OPTIMIZATION =====
// (Movido desde inline script en template - ver blog_detail.html líneas 338-350)
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.blog-content img').forEach(function(img) {
        // Lazy loading nativo
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        // Decoding async para mejor rendimiento
        if (!img.hasAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
        }
        // Alt text fallback (en caso de que el backend no lo provea)
        if (!img.hasAttribute('alt') || img.alt === '') {
            img.setAttribute('alt', window.BLOG_TITLE || 'Imagen del artículo');
        }
    });
});

// ===== IMAGE ZOOM ===== (Consolidado en LIGHTBOX MEJORAS - ver abajo)

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
        // Get CSRF token from the form
        const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'same-origin',
            headers: { 
                'X-Requested-With': 'XMLHttpRequest', 
                'Accept': 'application/json',
                'X-CSRFToken': csrfToken
            }
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

// Submit reply form - AJAX POST, muestra skeleton, NO recarga pagina
window.submitReplyForm = function(commentId) {
    var form = document.getElementById('frm-' + commentId);
    if (!form) { console.error('Form not found'); return false; }
    var btn = document.getElementById('reply-submit-btn-' + commentId);
    if (!btn) return false;
    var orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Enviando...';

    // Get CSRF token from the form
    const csrfTokenReply = form.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    fetch(form.action, { 
        method: 'POST', 
        body: new FormData(form), 
        credentials: 'same-origin', 
        headers: { 
            'X-Requested-With': 'XMLHttpRequest', 
            'Accept': 'application/json',
            'X-CSRFToken': csrfTokenReply
        } 
    })
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

            var pendingHtml = `
                <div class="jd-pending-reply mt-2">
                    <div class="sk-comment-content">
                        <div class="sk-comment-avatar"></div>
                        <div class="sk-comment-body">
                            <div class="sk-line"></div>
                            <div class="sk-line"></div>
                        </div>
                        <span>
                            <i class="fas fa-clock mr-1"></i> Pendiente
                        </span>
                    </div>
                </div>                
            `;


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

// ===== MODO LECTURA (Alpine Component) =====
// Exponer globalmente para que x-data="readingMode()" funcione sin depender del evento alpine:init
window.readingMode = function() {
    return {
        mode: localStorage.getItem('jd-reading-mode') || 'normal',
        init: function() {
            this.applyMode(this.mode);
        },
        toggle: function() {
            var modes = ['normal', 'sepia', 'dark'];
            var idx = modes.indexOf(this.mode);
            this.mode = modes[(idx + 1) % modes.length];
            this.applyMode(this.mode);
            localStorage.setItem('jd-reading-mode', this.mode);
        },
        applyMode: function(mode) {
            document.documentElement.setAttribute('data-reading-mode', mode);
        },
        // Icono usando FontAwesome: devuelve el HTML del icono
        getIcon: function() {
            var icons = {
                normal: '<i class="fas fa-sun"></i>',
                sepia: '<i class="fas fa-book"></i>',
                dark: '<i class="fas fa-moon"></i>'
            };
            return icons[this.mode] || '';
        },
        getLabel: function() {
            var labels = { normal: 'Normal', sepia: 'Sepia', dark: 'Oscuro' };
            return labels[this.mode] || 'Normal';
        }
    };
};


// ===== BLOG IMAGE GRID (mosaico de imagenes individuales sueltas) =====
// Detecta <p> consecutivos que contienen solo un <img> y los agrupa en grid.
// NO afecta slides, popup gallery, ni carruseles.
document.addEventListener("DOMContentLoaded", function() {
    var content = document.querySelector(".blog-content");
    if (!content) return;

    var children = Array.from(content.children);
    var buffer = [];
    var SPECIAL_CONTAINERS = ".slides-container, .popup-gallery-container, .blog-carousel-container";

    function isSoloImageParagraph(el) {
        if (el.tagName !== "P") return false;
        if (el.closest(SPECIAL_CONTAINERS)) return false;
        var imgs = el.querySelectorAll("img");
        if (imgs.length !== 1) return false;
        var text = "";
        for (var k = 0; k < el.childNodes.length; k++) {
            var node = el.childNodes[k];
            if (node.nodeType === 3) text += node.textContent;
        }
        if (text.trim() !== "") return false;
        return true;
    }

    function flushGrid() {
        if (buffer.length === 0) return;
        if (buffer.length === 1) {
            var singleImg = buffer[0].querySelector("img");
            if (singleImg) {
                singleImg.classList.add("blog-content-img");
                singleImg.style.cursor = "pointer";
                singleImg.dataset.blogImg = "single";
            }
            buffer = [];
            return;
        }
        var grid = document.createElement("div");
        grid.className = "blog-image-grid";
        grid.dataset.count = buffer.length;
        buffer.forEach(function(p) {
            var img = p.querySelector("img");
            if (!img) return;
            var figure = document.createElement("figure");
            figure.className = "blog-image-grid-item";
            p.parentNode.replaceChild(figure, p);
            figure.appendChild(img);
            grid.appendChild(figure);
        });
        var refNode = content.children[0] || null;
        content.insertBefore(grid, refNode);
        buffer = [];
    }

    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (isSoloImageParagraph(child)) {
            buffer.push(child);
        } else {
            flushGrid();
        }
    }
    flushGrid();
});


// ===== LIGHTBOX MEJORAS (Fase 3 - animaciones y loading) =====
document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("image-zoom-modal");
    if (!modal) return;

    var modalImg = document.getElementById("image-zoom-content");
    var closeBtn = modal.querySelector(".modal-lightbox-close");
    var prevBtn = modal.querySelector(".modal-lightbox-prev");
    var nextBtn = modal.querySelector(".modal-lightbox-next");
    var counter = modal.querySelector(".modal-lightbox-counter");
    var spinner = modal.querySelector(".modal-lightbox-spinner");
    var currentImages = [];
    var currentIndex = 0;
    var isOpen = false;
    var savedScrollY = 0;

function openLightbox(images, index) {
        currentImages = images;
        currentIndex = index;
        savedScrollY = window.scrollY;
        showImage(index);
        try { modal.showModal(); } catch (e) { modal.style.display = "flex"; }
        isOpen = true;
        updateNavButtons();
        updateCounter();
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = "-" + savedScrollY + "px";
        document.body.style.width = "100%";
    }

    function showImage(index) {
        if (!currentImages[index]) return;
        if (spinner) spinner.classList.add("show");
        modalImg.classList.add("loading");
        modalImg.src = currentImages[index].src;
        modalImg.alt = currentImages[index].alt || "";
    }

    modalImg.addEventListener("load", function() {
        if (spinner) spinner.classList.remove("show");
        modalImg.classList.remove("loading");
    });
    modalImg.addEventListener("error", function() {
        if (spinner) spinner.classList.remove("show");
        modalImg.classList.remove("loading");
    });

    function updateNavButtons() {
        if (currentImages.length <= 1) {
            if (prevBtn) prevBtn.style.display = "none";
            if (nextBtn) nextBtn.style.display = "none";
        } else {
            if (prevBtn) { prevBtn.style.display = ""; prevBtn.classList.toggle("hidden", currentIndex === 0); }
            if (nextBtn) { nextBtn.style.display = ""; nextBtn.classList.toggle("hidden", currentIndex === currentImages.length - 1); }
        }
    }

    function updateCounter() {
        if (!counter) return;
        if (currentImages.length > 1) {
            counter.textContent = (currentIndex + 1) + " / " + currentImages.length;
            counter.style.display = "block";
        } else {
            counter.style.display = "none";
        }
    }

function closeLightbox() {
        try { modal.close(); } catch (e) { modal.style.display = ""; }
        isOpen = false;
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, savedScrollY);
        currentImages = [];
    }

    function navigate(direction) {
        var newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= currentImages.length) return;
        currentIndex = newIndex;
        showImage(currentIndex);
        updateNavButtons();
        updateCounter();
    }

    document.addEventListener("click", function(e) {
        var img = e.target.closest(".blog-image-grid-item img, img[data-blog-img='single']");
        if (!img) return;
        if (img.closest(".popup-gallery-container, .gallery-preview")) return;
        if (window.galleryModalOpen) return;
        e.preventDefault();
        
        // Obtener TODAS las imágenes del artículo (excluyendo slides, popup gallery, etc)
        var allImages = Array.from(document.querySelectorAll(".blog-content img"))
            .filter(function(i) {
                return !i.closest(".slides-container, .popup-gallery-container, .gallery-preview");
            });
        
        var index = allImages.indexOf(img);
        openLightbox(allImages, index);
    });

    // Delegación + listeners directos para máxima robustez en <dialog>
    // Delegación + listeners directos para máxima robustez en <dialog>
    modal.addEventListener("click", function(e) {
        var target = e.target;
        console.log('🔍 Click en modal:', target.className, target.tagName);
        if (target.closest(".modal-lightbox-close")) {
            console.log('🔴 Click en close button');
            e.preventDefault(); e.stopPropagation(); closeLightbox();
        } else if (target.closest(".modal-lightbox-prev")) {
            console.log('◀️ Click en prev button, currentIndex:', currentIndex);
            e.preventDefault(); e.stopPropagation(); navigate(-1);
        } else if (target.closest(".modal-lightbox-next")) {
            console.log('▶️ Click en next button, currentIndex:', currentIndex, 'total:', currentImages.length);
            e.preventDefault(); e.stopPropagation(); navigate(1);
        } else if (target === modal || target.classList.contains("modal-lightbox-wrapper")) {
            closeLightbox();
        }
    });

    if (closeBtn) closeBtn.addEventListener("click", function(e) { console.log('🔴 closeBtn direct click'); e.preventDefault(); e.stopPropagation(); closeLightbox(); });
    if (prevBtn) prevBtn.addEventListener("click", function(e) { console.log('◀️ prevBtn direct click'); e.preventDefault(); e.stopPropagation(); navigate(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function(e) { console.log('▶️ nextBtn direct click'); e.preventDefault(); e.stopPropagation(); navigate(1); });

    document.addEventListener("keydown", function(e) {
        if (!isOpen) return;
        if (e.key === "ArrowLeft") { e.preventDefault(); navigate(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); navigate(1); }
        if (e.key === "Escape") closeLightbox();
    });
});
