/**
 * ✨ JAVASCRIPT ESPECIFICO BLOG DETAIL
 * Archivo separado responsablemente
 * 
 * Todas las funcionalidades originales mantenidas 100% intactas
 * Ningun cambio en logica, solo organizacion de codigo
 */

// ✨ Inicializacion componente Carrusel Full Width
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.blog-carousel-container .swiper')) {
        new Swiper('.blog-carousel-container .swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            centeredSlides: true,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                },
                1024: {
                    slidesPerView: 3,
                }
            }
        });
    }
});

// ✅ VISOR DE IMAGENES POPUP MODAL
window.openGalleryPopup = function(element) {
    
    const images = element.querySelector('.gallery-images').value.split('|');
    let currentIndex = 0;
    
    // Crear modal HTML directamente
    const modal = document.createElement('div');
    modal.className = 'gallery-modal position-fixed top-0 left-0 w-100 h-100 d-flex align-items-center justify-content-center';
    modal.style.zIndex = '999999999';
    modal.style.background = 'rgba(0,0,0,0.92)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 150ms ease';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    
    modal.innerHTML = `
<button class="gallery-modal-close" onclick="this.parentElement.remove()">
    <i class="fas fa-times"></i>
</button>
<button class="gallery-modal-nav prev" onclick="prevImage()">
    <i class="fas fa-chevron-left"></i>
</button>
<button class="gallery-modal-nav next" onclick="nextImage()">
    <i class="fas fa-chevron-right"></i>
</button>
<div class="gallery-modal-image-wrapper">
    <img id="gallery-modal-img" src="${images[0]}" alt="">
</div>
<div class="gallery-modal-counter">${currentIndex+1} / ${images.length}</div>
`;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.style.opacity = '1', 10);
    
    window.prevImage = function() {
        currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        document.getElementById('gallery-modal-img').src = images[currentIndex];
        modal.querySelector('.gallery-modal-counter').textContent = `${currentIndex+1} / ${images.length}`;
    }
    
    window.nextImage = function() {
        currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        document.getElementById('gallery-modal-img').src = images[currentIndex];
        modal.querySelector('.gallery-modal-counter').textContent = `${currentIndex+1} / ${images.length}`;
    }
    
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    }
    
    document.onkeydown = function(e) {
        if (e.key === 'Escape') modal.remove();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    }
}

// ✅ DEFINITIVAMENTE, FORZADO AL MAXIMO
console.log('✅ Iniciando barra progreso');

window.onscroll = function() {
    let scrol = window.pageYOffset || document.documentElement.scrollTop;
    let altoTotal = document.body.scrollHeight - window.innerHeight;
    
    // ✅ Proteccion contra division por cero y valores invalidos
    if (altoTotal <= 0) altoTotal = 1;
    let porcentaje = Math.min(100, Math.max(0, (scrol / altoTotal) * 100));
    
    // Aplicar valor final
    document.querySelector('.reading-progress-fill').style.width = porcentaje + '%';

    // Barra flotante reacciones
    let barraFlotante = document.querySelector('.floating-reaction-bar');
    if (porcentaje > 12 && porcentaje < 82) {
        barraFlotante.classList.add('visible');
    } else {
        barraFlotante.classList.remove('visible');
    }
};

// EJECUTAR INMEDIATAMENTE
setTimeout(function(){
    window.onscroll();
}, 100);

// EJECUTAR TAMBIEN AL CARGAR LA PAGINA PARA MOSTRAR BARRA DERECHA
document.addEventListener('DOMContentLoaded', function() {
    const floatRightNav = document.querySelector('.floating-right-nav');
    if (floatRightNav) {
        // Forzar visibilidad inicial al cargar
        let scrol = window.pageYOffset || document.documentElement.scrollTop;
        let altoTotal = document.body.scrollHeight - window.innerHeight;
        
        if (altoTotal <= 0) altoTotal = 1;
        let porcentaje = Math.min(100, Math.max(0, (scrol / altoTotal) * 100));

        if (porcentaje > 12 && porcentaje < 82) {
            floatRightNav.classList.add('visible');
        }
    }
});


// ✅ Sistema de Zoom automatico para TODAS las imagenes del blog
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('image-zoom-modal');
    const modalImg = document.getElementById('image-zoom-content');
    
    // Agregar evento click a TODAS las imagenes del contenido
    document.querySelectorAll('.blog-content img').forEach(img => {
        img.addEventListener('click', () => {
            modalImg.src = img.src;
            modal.showModal();
    });
});


// ✨ BOTONES COMPARTIR
document.addEventListener('DOMContentLoaded', function() {
    
    // ✅ Boton Copiar Enlace - SOLUCION DEFINITIVA
    const copyLinkBtn = document.querySelector('.copy-link-btn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const originalText = this.innerHTML;
            const url = window.location.href;

            // ✅ Metodo 1: API Clipboard oficial
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(url);
                    mostrarExito(this, originalText);
                    return;
                }
            } catch (err) {
                console.log('Clipboard API fallo, usando fallback');
            }

            // ✅ Metodo 2: Fallback 100% compatible con TODOS los navegadores
            try {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const exitoso = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (exitoso) {
                    mostrarExito(this, originalText);
                } else {
                    throw new Error('Fallo execCommand');
                }
                
            } catch (err) {
                // ✅ Ultimo recurso: mostrar enlace al usuario para que copie manualmente
                prompt('Copia este enlace manualmente:', url);
            }
        });
    }

    function mostrarExito(boton, textoOriginal) {
        boton.innerHTML = '<i class="fas fa-check mr-1"></i> Enlace copiado!';
        boton.classList.remove('btn-outline-secondary');
        boton.classList.add('btn-success');
        
        setTimeout(() => {
            boton.innerHTML = textoOriginal;
            boton.classList.remove('btn-success');
            boton.classList.add('btn-outline-secondary');
        }, 2200);
    }

    // ✅ Los botones LinkedIn, Twitter y Correo ya funcionan nativamente con los enlaces que tienes
    // Estan correctamente implementados usando los esquemas oficiales de cada plataforma
    // No necesitan Javascript adicional, se abren en ventana nueva automaticamente


    // ✅ Boton Comentarios Barra Flotante - Scroll Suave FORZADO
    const commentsFloatBtn = document.querySelector('.floating-reaction-bar a[href="#comments"]');
    if (commentsFloatBtn) {
        commentsFloatBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const commentsSection = document.getElementById('comments');
            if (commentsSection) {
                // Scroll smooth nativo con velocidad adecuada
                window.scrollTo({
                    top: commentsSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    }

    // ✅ Boton Comentar Barra Derecha Flotante
    const commentFloatBtn = document.querySelector('.float-nav-btn.comment-btn');
    if (commentFloatBtn) {
        commentFloatBtn.addEventListener('click', function() {
            const commentsSection = document.getElementById('comments');
            if (commentsSection) {
                window.scrollTo({
                    top: commentsSection.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // ✅ Ademas de scrollear, hacer focus automatico en el textarea del comentario
                setTimeout(() => {
                    const textarea = document.querySelector('textarea[name="content"]');
                    if (textarea) {
                        textarea.focus();
                    }
                }, 600);
            }
        });
    }

    // ✅ Mostrar/Ocultar barra derecha flotante segun scroll
    const floatRightNav = document.querySelector('.floating-right-nav');
    if (floatRightNav) {
        // ✅ Mostrar inmediatamente al cargar
        floatRightNav.classList.add('visible');
        
        window.addEventListener('scroll', function() {
            floatRightNav.classList.add('visible');
        });
    }
});
    
    // Cerrar modal al hacer click fuera o escape
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.close();
    });
});


// ✨ SISTEMA DE RESPUESTAS A COMENTARIOS ESTILO FACEBOOK + UX LOADER
document.addEventListener('DOMContentLoaded', function() {

    // ✅ Funcion generica para manejar envio de cualquier formulario de comentario
    function setupCommentForm(formElement) {
        formElement.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalContent = submitBtn.innerHTML;
            
            // ✅ Mostrar loader, deshabilitar boton
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Enviando...`;

            fetch(this.action, {
                method: 'POST',
                body: new FormData(this),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Validacion fallida');
                }
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    throw new Error('Error en el servidor');
                }
                
                // Agregar skeleton loader inmediatamente
                const skeletonHtml = `
                <div class="comment-skeleton">
                    <div class="comment-skeleton-avatar"></div>
                    <div class="comment-skeleton-content">
                        <div class="comment-skeleton-line short"></div>
                        <div class="comment-skeleton-line medium"></div>
                        <div class="comment-skeleton-line long"></div>
                    </div>
                </div>
                `;
                
                // ✅ Mostrar mensaje success
                const successMsg = document.createElement('div');
                successMsg.className = 'alert alert-success mt-3 d-flex justify-content-between align-items-center';
                successMsg.style.animation = 'fadeIn 200ms ease';
                successMsg.innerHTML = `
                    <div>
                        <i class="fas fa-check-circle mr-2"></i> 
                        <strong>Comentario enviado!</strong> Tu comentario esta pendiente de aprobacion y sera publicado pronto.
                    </div>
                    <button type="button" class="close ml-3" onclick="this.parentElement.remove()" aria-label="Cerrar">
                        <span aria-hidden="true">&times;</span>
                    </button>
                `;
                
                // Insertar skeleton y reemplazar formulario
                this.insertAdjacentHTML('afterend', skeletonHtml);
                this.replaceWith(successMsg);
                
                // ✅ Desplazarse suavemente al mensaje
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            .catch(error => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
                
                // ✅ Mostrar error elegantemente en lugar de alert
                const errorMsg = document.createElement('div');
                errorMsg.className = 'alert alert-danger mt-3 d-flex justify-content-between align-items-center';
                errorMsg.style.animation = 'fadeIn 200ms ease';
                errorMsg.innerHTML = `
                    <div>
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        <strong>Error!</strong> El comentario debe tener al menos 10 caracteres.
                    </div>
                    <button type="button" class="close ml-3" onclick="this.parentElement.remove()" aria-label="Cerrar">
                        <span aria-hidden="true">&times;</span>
                    </button>
                `;
                
                // Insertar mensaje de error debajo del boton
                submitBtn.insertAdjacentElement('afterend', errorMsg);
                
                // Auto eliminar despues de 5 segundos
                setTimeout(() => {
                    if (errorMsg.parentElement) {
                        errorMsg.remove();
                    }
                }, 5000);
            });
        });
    }

    // ✅ Aplicar al formulario principal
    const mainForm = document.querySelector('form[method="POST"]:not(.reply-form-container form)');
    if (mainForm) setupCommentForm(mainForm);

    // ✅ Plantilla mini formulario de respuesta
    function getReplyFormHtml(commentId) {
        return `
        <div class="reply-form-container mt-3 ml-5" style="animation: fadeIn 200ms ease;">
            <form method="POST" action="${window.location.pathname}">
                <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
                <input type="hidden" name="parent_id" value="${commentId}">
                <input type="text" name="website" style="display:none;">
                
                <div class="form-group">
                    <input type="text" name="name" class="form-control form-control-sm" placeholder="Tu nombre" required>
                </div>

                <div class="form-group">
                    <input type="email" name="email" class="form-control form-control-sm" placeholder="Tu email (opcional)">
                </div>
                
                <div class="form-group">
                    <textarea name="content" class="form-control form-control-sm" rows="2" placeholder="Escribe tu respuesta..." required autofocus></textarea>
                </div>
                
                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary btn-sm">
                        <i class="fas fa-paper-plane mr-1"></i> Responder
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm cancel-reply">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
        `;
    }

    // ✅ Evento click boton Responder
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            
            // Cerrar todos los demas formularios abiertos
            document.querySelectorAll('.reply-form-container').forEach(f => f.remove());
            
            const commentId = this.getAttribute('data-comment-id');
            const commentItem = this.closest('.comment-item');
            
            // Insertar formulario directamente debajo del comentario
            commentItem.insertAdjacentHTML('beforeend', getReplyFormHtml(commentId));
            
            const replyForm = commentItem.querySelector('.reply-form-container form');
            setupCommentForm(replyForm);
            
            // Focus automatico en el textarea
            commentItem.querySelector('textarea[name="content"]').focus();
            
            // Evento cancelar
            commentItem.querySelector('.cancel-reply').addEventListener('click', function() {
                this.closest('.reply-form-container').remove();
            });
        });
    });
});