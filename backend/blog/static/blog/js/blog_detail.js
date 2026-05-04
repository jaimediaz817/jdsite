/**
 * Blog Detail - JavaScript
 * Functionalities: Carousel, Zoom, Scroll Infinite, Comments, Share
 */

// ===== CAROUSEL =====
document.addEventListener('DOMContentLoaded', function() {
    var swiperEl = document.querySelector('.blog-carousel-container .swiper');
    if (swiperEl) {
        new Swiper('.blog-carousel-container .swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            centeredSlides: true,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            breakpoints: {
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            }
        });
    }
});

// ===== GALLERY POPUP =====
window.openGalleryPopup = function(element) {
    var images = element.querySelector('.gallery-images').value.split('|');
    var currentIndex = 0;
    var modal = document.createElement('div');
    modal.className = 'gallery-modal position-fixed top-0 left-0 w-100 h-100 d-flex align-items-center justify-content-center';
    modal.style.cssText = 'z-index:999999999;background:rgba(0,0,0,0.92);backdrop-filter:blur(8px);opacity:0;transition:opacity 150ms ease;position:fixed;top:0;left:0;width:100vw;height:100vh;';
    
    modal.innerHTML = '<button class="gallery-modal-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button><button class="gallery-modal-nav prev" onclick="prevImage()"><i class="fas fa-chevron-left"></i></button><button class="gallery-modal-nav next" onclick="nextImage()"><i class="fas fa-chevron-right"></i></button><div class="gallery-modal-image-wrapper"><img id="gallery-modal-img" src="' + images[0] + '" alt=""></div><div class="gallery-modal-counter">1 / ' + images.length + '</div>';
    
    document.body.appendChild(modal);
    setTimeout(function() { modal.style.opacity = '1'; }, 10);
    
    window.prevImage = function() {
        currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        document.getElementById('gallery-modal-img').src = images[currentIndex];
        modal.querySelector('.gallery-modal-counter').textContent = (currentIndex + 1) + ' / ' + images.length;
    };
    
    window.nextImage = function() {
        currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        document.getElementById('gallery-modal-img').src = images[currentIndex];
        modal.querySelector('.gallery-modal-counter').textContent = (currentIndex + 1) + ' / ' + images.length;
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
var progressBar = document.querySelector('.reading-progress-bar');

window.onscroll = function() {
    var scrol = window.pageYOffset || document.documentElement.scrollTop;
    var altoTotal = document.body.scrollHeight - window.innerHeight;
    if (altoTotal <= 0) altoTotal = 1;
    var porcentaje = Math.min(100, Math.max(0, (scrol / altoTotal) * 100));
    
    var progressFill = document.querySelector('.reading-progress-fill');
    if (progressFill) progressFill.style.width = porcentaje + '%';
    
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

setTimeout(function() { if (window.onscroll) window.onscroll(); }, 100);

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

// ===== SCROLL INFINITE COMMENTS =====
document.addEventListener('DOMContentLoaded', function() {
    var CONFIG = {
        COMENTARIOS_POR_PAGINA: 12,
        UMBRAL_CARGA_PX: 150,
        ANIMACION_DURACION_MS: 280,
        DEBUG_MODE: false
    };
    
    var estado = {
        paginaActual: 1,
        cargando: false,
        hayMasComentarios: true,
        observer: null,
        contenedorComentarios: null,
        elementoSentinela: null
    };
    
    function inicializarScrollInfinito() {
        estado.contenedorComentarios = document.getElementById('comments-list');
        if (!estado.contenedorComentarios) return;
        crearElementoSentinela();
        inicializarObserver();
    }
    
    function crearElementoSentinela() {
        estado.elementoSentinela = document.createElement('div');
        estado.elementoSentinela.id = 'comments-load-sentinel';
        estado.elementoSentinela.style.cssText = 'height:1px;width:100%;opacity:0;';
        estado.contenedorComentarios.appendChild(estado.elementoSentinela);
    }
    
    function inicializarObserver() {
        var opcionesObserver = {
            root: null,
            rootMargin: '0px 0px ' + CONFIG.UMBRAL_CARGA_PX + 'px 0px',
            threshold: 0.1
        };
        
        estado.observer = new IntersectionObserver(function(entradas) {
            var entrada = entradas[0];
            if (entrada.isIntersecting && estado.hayMasComentarios && !estado.cargando) {
                cargarMasComentarios();
            }
        }, opcionesObserver);
        
        estado.observer.observe(estado.elementoSentinela);
    }
    
    async function cargarMasComentarios() {
        if (estado.cargando || !estado.hayMasComentarios) return;
        
        estado.cargando = true;
        estado.paginaActual += 1;
        
        mostrarSkeletonLoader();
        
        try {
            var url = window.location.pathname + 'comments/load-more/?page=' + estado.paginaActual;
            var respuesta = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'text/html'
                },
                credentials: 'same-origin'
            });
            
            if (!respuesta.ok) throw new Error('Error servidor: ' + respuesta.status);
            
            estado.hayMasComentarios = respuesta.headers.get('X-Has-More') === 'true';
            var htmlNuevosComentarios = await respuesta.text();
            
            ocultarSkeletonLoader();
            estado.elementoSentinela.insertAdjacentHTML('beforebegin', htmlNuevosComentarios);
            animarAparicionComentarios();
            reInicializarFuncionalidadesNuevosElementos();
            
        } catch (error) {
            console.log('Error cargando comentarios:', error);
            ocultarSkeletonLoader();
            estado.paginaActual -= 1;
        } finally {
            estado.cargando = false;
            if (!estado.hayMasComentarios) finalizarScrollInfinito();
        }
    }
    
    function mostrarSkeletonLoader() {
        var skeletonHtml = '<div id="comments-loader-wrapper" style="animation: fadeIn 200ms ease;"><div class="comment-skeleton"><div class="comment-skeleton-avatar"></div><div class="comment-skeleton-content"><div class="comment-skeleton-line short"></div><div class="comment-skeleton-line medium"></div><div class="comment-skeleton-line long"></div></div></div><div class="comment-skeleton mt-3"><div class="comment-skeleton-avatar"></div><div class="comment-skeleton-content"><div class="comment-skeleton-line short"></div><div class="comment-skeleton-line long"></div></div></div>';
        estado.elementoSentinela.insertAdjacentHTML('beforebegin', skeletonHtml);
    }
    
    function ocultarSkeletonLoader() {
        var loader = document.getElementById('comments-loader-wrapper');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(function() { loader.remove(); }, 200);
        }
    }
    
    function animarAparicionComentarios() {
        var comentariosNuevos = estado.contenedorComentarios.querySelectorAll('.comment-wrapper:not(.loaded)');
        comentariosNuevos.forEach(function(comentario, indice) {
            setTimeout(function() {
                comentario.classList.add('loaded');
                comentario.style.opacity = '1';
                comentario.style.transform = 'translateY(0)';
            }, indice * 70);
        });
    }
    
    function reInicializarFuncionalidadesNuevosElementos() {
        document.querySelectorAll('.reply-btn:not(.initialized)').forEach(function(btn) {
            btn.classList.add('initialized');
            btn.addEventListener('click', function() {
                // ✅ VALIDAR AUTENTICACIÓN
                if (!window.USER_AUTHENTICATED) {
                    if (typeof $ !== 'undefined' && $.toast) {
                        $.toast({
                            heading: 'Inicia sesión',
                            text: 'Debes iniciar sesión para responder comentarios.',
                            icon: 'warning',
                            position: 'top-right',
                            hideAfter: 4000,
                            stack: 4,
                            bgColor: '#f59e0b',
                            loaderBg: '#fbbf24'
                        });
                    } else {
                        alert('Debes iniciar sesión para responder comentarios.');
                    }
                    return;
                }
                
                document.querySelectorAll('.reply-form-container').forEach(function(f) { f.remove(); });
                var commentId = this.getAttribute('data-comment-id');
                var commentItem = this.closest('.comment-wrapper');
                commentItem.insertAdjacentHTML('beforeend', getReplyFormHtml(commentId));
                var replyForm = commentItem.querySelector('.reply-form-container form');
                setupCommentForm(replyForm);
                commentItem.querySelector('textarea[name="content"]').focus();
                commentItem.querySelector('.cancel-reply').addEventListener('click', function() {
                    this.closest('.reply-form-container').remove();
                });
            });
        });
    }
    
    function finalizarScrollInfinito() {
        if (estado.observer) {
            estado.observer.disconnect();
            estado.observer = null;
        }
        if (estado.elementoSentinela) estado.elementoSentinela.remove();
        
        var mensajeFinal = document.createElement('div');
        mensajeFinal.className = 'text-center py-4 mt-3 text-muted';
        mensajeFinal.style.animation = 'fadeIn 400ms ease';
        // Reemplazamos el ícono ASCII por FontAwesome con color morado del blog
        mensajeFinal.innerHTML = '<div class="d-flex align-items-center justify-content-center gap-2"><i class="fas fa-check" style="color:#6f42c1;"></i><span>Has visto todos los comentarios</span></div>';
        estado.contenedorComentarios.appendChild(mensajeFinal);
    }
    
    inicializarScrollInfinito();
});

// ===== SHARE BUTTONS =====
document.addEventListener('DOMContentLoaded', function() {
    var copyLinkBtn = document.querySelector('.copy-link-btn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            var originalText = this.innerHTML;
            var url = window.location.href;
            
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(url);
                    mostrarExito(this, originalText);
                    return;
                }
            } catch (err) {}
            
            try {
                var textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px;opacity:0;';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                var exitoso = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (exitoso) mostrarExito(this, originalText);
                else throw new Error('Fallo execCommand');
            } catch (err) {
                prompt('Copia este enlace manualmente:', url);
            }
        });
    }
    
    function mostrarExito(btn, textoOriginal) {
        btn.innerHTML = '<i class="fas fa-check mr-1"></i> Enlace copiado!';
        btn.classList.remove('btn-outline-secondary');
        btn.classList.add('btn-success');
        setTimeout(function() { 
            btn.innerHTML = textoOriginal;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-secondary');
        }, 2200);
    }
    
    var commentsFloatBtn = document.querySelector('.floating-reaction-bar a[href="#comments"]');
    if (commentsFloatBtn) {
        commentsFloatBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var commentsSection = document.getElementById('comments');
            if (commentsSection) window.scrollTo({ top: commentsSection.offsetTop - 80, behavior: 'smooth' });
        });
    }
    
    var commentFloatBtn = document.querySelector('.float-nav-btn.comment-btn');
    if (commentFloatBtn) {
        commentFloatBtn.addEventListener('click', function() {
            var commentsSection = document.getElementById('comments');
            if (commentsSection) {
                window.scrollTo({ top: commentsSection.offsetTop - 80, behavior: 'smooth' });
                setTimeout(function() { 
                    var textarea = document.querySelector('textarea[name="content"]');
                    if (textarea) textarea.focus();
                }, 600);
            }
        });
    }
    
    var floatRightNav = document.querySelector('.floating-right-nav');
    if (floatRightNav) floatRightNav.classList.add('visible');
});

// ===== COMMENTS - SETUP FORM =====
document.addEventListener('DOMContentLoaded', function() {
    function setupCommentForm(formElement) {
        formElement.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            var submitBtn = this.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            
            var originalContent = submitBtn.innerHTML;
            
            // Show loader on button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Enviando...';
            
            try {
                var response = await fetch(this.action, {
                    method: 'POST',
                    body: new FormData(this),
                    credentials: 'same-origin'
                });
                
                var data;
                try {
                    data = await response.json();
                } catch (jsonError) {
                    if (response.status === 403) throw new Error('Error de seguridad CSRF. Por favor recarga la página.');
                    if (response.status === 500) throw new Error('Error interno en el servidor.');
                    throw new Error('Error ' + response.status + ': Ha ocurrido un problema');
                }
                
                if (!response.ok) {
                    if (data && data.message) throw new Error(data.message);
                    if (data && data.error) throw new Error(data.error);
                    if (data && data.errors) throw new Error(Object.values(data.errors)[0]);
                    throw new Error('Validacion fallida');
                }
                
                if (!data.success) throw new Error('Error en el servidor');
                
                // Toast notification on success
                if (typeof $ !== 'undefined' && $.toast) {
                    $.toast({
                        heading: 'Comentario enviado!',
                        text: 'Tu comentario esta pendiente de aprobacion y sera publicado pronto.',
                        icon: 'success',
                        position: 'top-right',
                        hideAfter: 4500,
                        stack: 4,
                        bgColor: '#7c3aed',
                        loaderBg: '#6366f1'
                    });
                } else {
                    alert('Comentario enviado! Tu comentario esta pendiente de aprobacion.');
                }
                
                // Show skeleton for new comment
                var commentsList = document.getElementById('comments-list');
                if (commentsList) {
                    var skeletonHtml = '<div id="temp-comment-skeleton" class="comment-skeleton" style="animation: fadeIn 300ms ease;">' +
                        '<div class="comment-skeleton-avatar"></div>' +
                        '<div class="comment-skeleton-content">' +
                        '<div class="comment-skeleton-line short"></div>' +
                        '<div class="comment-skeleton-line medium"></div>' +
                        '<div class="comment-skeleton-line long"></div>' +
                        '</div></div>';
                    commentsList.insertAdjacentHTML('afterbegin', skeletonHtml);
                    setTimeout(function() {
                        var skeleton = document.getElementById('temp-comment-skeleton');
                        if (skeleton) {
                            skeleton.style.opacity = '0';
                            setTimeout(function() { skeleton.remove(); }, 300);
                        }
                    }, 3000);
                }
                
                // Remove form
                var formContainer = this.closest('.reply-form-container');
                if (formContainer) formContainer.remove();
                else this.remove();
                
            } catch (error) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
                var errorMessage = error.message || 'Ha ocurrido un error al enviar el comentario';
                
                if (typeof $ !== 'undefined' && $.toast) {
                    $.toast({
                        heading: 'Error',
                        text: errorMessage,
                        icon: 'error',
                        position: 'top-right',
                        hideAfter: 5500,
                        stack: 4,
                        bgColor: '#dc2626',
                        loaderBg: '#f87171'
                    });
                } else {
                    alert('Error: ' + errorMessage);
                }
            }
        });
    }
    
    // Apply to all POST forms
    document.querySelectorAll('form[method="POST"]').forEach(function(form) {
        if (!form.closest('.reply-form-container')) {
            setupCommentForm(form);
        }
    });
    
    // Reply form template
    function getReplyFormHtml(commentId) {
        return '<div class="reply-form-container mt-3 ml-5" style="animation: fadeIn 200ms ease;"><form method="POST" action="' + window.location.pathname + 'comment/">' +
            '<input type="hidden" name="csrfmiddlewaretoken" value="' + document.querySelector('[name=csrfmiddlewaretoken]').value + '">' +
            '<input type="hidden" name="parent_id" value="' + commentId + '">' +
            '<input type="hidden" name="website" value="">' +
            '<div class="form-group"><input type="text" name="name" class="form-control form-control-sm" placeholder="Tu nombre" required></div>' +
            '<div class="form-group"><input type="email" name="email" class="form-control form-control-sm" placeholder="Tu email (opcional)"></div>' +
            '<div class="form-group"><textarea name="content" class="form-control form-control-sm" rows="2" placeholder="Escribe tu respuesta..." required autofocus></textarea></div>' +
            '<div class="d-flex gap-2"><button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane mr-1"></i> Responder</button>' +
            '<button type="button" class="btn btn-outline-secondary btn-sm cancel-reply">Cancelar</button></div></form></div>';
    }
    
    // Reply button click handler
    document.querySelectorAll('.reply-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            // ✅ VALIDAR AUTENTICACIÓN
            if (!window.USER_AUTHENTICATED) {
                if (typeof $ !== 'undefined' && $.toast) {
                    $.toast({
                        heading: 'Inicia sesión',
                        text: 'Debes iniciar sesión para responder comentarios.',
                        icon: 'warning',
                        position: 'top-right',
                        hideAfter: 4000,
                        stack: 4,
                        bgColor: '#f59e0b',
                        loaderBg: '#fbbf24'
                    });
                } else {
                    alert('Debes iniciar sesión para responder comentarios.');
                }
                return;
            }
            
            document.querySelectorAll('.reply-form-container').forEach(function(f) { f.remove(); });
            var commentId = this.getAttribute('data-comment-id');
            var commentItem = this.closest('.comment-wrapper');
            commentItem.insertAdjacentHTML('beforeend', getReplyFormHtml(commentId));
            var replyForm = commentItem.querySelector('.reply-form-container form');
            setupCommentForm(replyForm);
            commentItem.querySelector('textarea[name="content"]').focus();
            commentItem.querySelector('.cancel-reply').addEventListener('click', function() {
                this.closest('.reply-form-container').remove();
            });
        });
    });
});

// ===== QUICK SIGNUP FORM (Modal) =====
document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('quickSignupForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            var submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Registrando...';
            }
            
            try {
                // Enviar el formulario directamente, el token CSRF está incluido en el FormData
                var response = await fetch('/blog/quick-signup/', {
                    method: 'POST',
                    body: new FormData(form),
                    credentials: 'same-origin'
                });
                
                if (!response.ok) throw new Error('Error ' + response.status);
                
                var data = await response.json();
                
                if (data.success) {
                    window.location.href = data.redirect || '/blog/';
                } else {
                    var msgDiv = document.getElementById('signupMessages');
                    var errorMsg = data.error || (data.errors && Object.values(data.errors)[0]) || 'Error en el registro';
                    if (msgDiv) {
                        msgDiv.innerHTML = '<div class="alert alert-danger" style="background: rgba(220,38,38,0.2); border-color: rgba(220,38,38,0.5); color: white;">' + errorMsg + '</div>';
                    }
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Registrarse';
                    }
                }
            } catch (error) {
                var msgDiv = document.getElementById('signupMessages');
                if (msgDiv) {
                    msgDiv.innerHTML = '<div class="alert alert-danger" style="background: rgba(220,38,38,0.2); border-color: rgba(220,38,38,0.5); color: white;">' + error.message + '</div>';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Registrarse';
                }
            }
        });
    }
});
