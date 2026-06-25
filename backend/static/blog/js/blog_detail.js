o/**
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

// ✨ BARRA PROGRESO LECTURA HU-005.5
let hideTimeout;
const progressBar = document.querySelector('.reading-progress-bar');

window.onscroll = function() {
    let scrol = window.pageYOffset || document.documentElement.scrollTop;
    let altoTotal = document.body.scrollHeight - window.innerHeight;
    
    // ✅ Proteccion contra division por cero y valores invalidos
    if (altoTotal <= 0) altoTotal = 1;
    let porcentaje = Math.min(100, Math.max(0, (scrol / altoTotal) * 100));
    
    // Aplicar valor final
    document.querySelector('.reading-progress-fill').style.width = porcentaje + '%';

    // ✅ Logica visibilidad barra progreso
    if (porcentaje > 5) {
        progressBar.classList.add('visible');
        
        // Reset timeout para ocultar despues de inactividad
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            progressBar.classList.remove('visible');
        }, 2000);
    } else {
        progressBar.classList.remove('visible');
    }

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
        // La visibilidad ahora se maneja por CSS por defecto
        floatRightNav.classList.add('visible');
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


// ==============================================================
// ✨ HU-005.6 - SCROLL INFINITO COMENTARIOS BLOG
// Implementacion 100% nativa con IntersectionObserver API
// Sin dependencias externas, maximo rendimiento
// ==============================================================
document.addEventListener('DOMContentLoaded', function() {

    // ✅ CONFIGURACION OFICIAL SEGUN HU
    const CONFIG = {
        COMENTARIOS_POR_PAGINA: 12,      // Cantidad optima UX
        UMBRAL_CARGA_PX: 150,            // Cargar cuando queden 150px
        ANIMACION_DURACION_MS: 280,      // Velocidad fadeIn
        DEBUG_MODE: false
    };

    // ✅ Estado interno controlado
    const estado = {
        paginaActual: 1,
        cargando: false,
        hayMasComentarios: true,
        observer: null,
        contenedorComentarios: null,
        elementoSentinela: null
    };

    // ✅ Inicializacion automatica solo si existe la seccion comentarios
    function inicializarScrollInfinito() {
        estado.contenedorComentarios = document.getElementById('comments-list');
        
        // Si no hay comentarios o no existe el contenedor, salir silenciosamente
        if (!estado.contenedorComentarios) {
            logDebug('❌ No se encontro contenedor de comentarios, saliendo');
            return;
        }

        // Crear elemento Sentinela (el que detectamos con IntersectionObserver)
        crearElementoSentinela();

        // Inicializar IntersectionObserver nativo
        inicializarObserver();

        logDebug('✅ Scroll infinito inicializado correctamente');
    }

    /**
     * ✅ Crea el elemento invisible al final de la lista que usamos para detectar scroll
     * Es el patron estandar mundial para scroll infinito
     */
    function crearElementoSentinela() {
        estado.elementoSentinela = document.createElement('div');
        estado.elementoSentinela.id = 'comments-load-sentinel';
        estado.elementoSentinela.style.height = '1px';
        estado.elementoSentinela.style.width = '100%';
        estado.elementoSentinela.style.opacity = '0';
        
        // Insertar al final de la lista de comentarios
        estado.contenedorComentarios.appendChild(estado.elementoSentinela);
    }

    /**
     * ✅ Inicializa IntersectionObserver API
     * 10x mas rapido que escuchar evento scroll directamente
     * No consume CPU ni bateria en mobile
     */
    function inicializarObserver() {
        const opcionesObserver = {
            root: null,             // Observar viewport completo
            rootMargin: `0px 0px ${CONFIG.UMBRAL_CARGA_PX}px 0px`,  // Cargar ANTES de llegar al final
            threshold: 0.1          // Disparar cuando se vea el 10% del sentinela
        };

        estado.observer = new IntersectionObserver(function(entradas) {
            const entrada = entradas[0];

            // Si el sentinela entra en el viewport y podemos cargar
            if (entrada.isIntersecting && estado.hayMasComentarios && !estado.cargando) {
                cargarMasComentarios();
            }

        }, opcionesObserver);

        // Empezar a observar el elemento sentinela
        estado.observer.observe(estado.elementoSentinela);
    }

    /**
     * ✅ Metodo principal que carga mas comentarios via fetch
     * Maneja estados de carga, errores, duplicados, todo
     */
    async function cargarMasComentarios() {
        // ✅ Proteccion anti-duplicado (NO eliminar esto)
        if (estado.cargando || !estado.hayMasComentarios) return;

        estado.cargando = true;
        estado.paginaActual += 1;

        logDebug(`⏳ Cargando pagina ${estado.paginaActual}...`);

        // Mostrar skeleton loader inmediatamente
        mostrarSkeletonLoader();

        try {
            // Construir URL endpoint (mismo slug de la pagina actual)
            const url = `${window.location.pathname}comments/load-more/?page=${estado.paginaActual}`;

            const respuesta = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'text/html'
                },
                credentials: 'same-origin'
            });

            if (!respuesta.ok) {
                throw new Error(`Error servidor: ${respuesta.status}`);
            }

            // Leer cabecera que indica si hay mas comentarios
            estado.hayMasComentarios = respuesta.headers.get('X-Has-More') === 'true';

            // Obtener HTML parcial renderizado desde backend
            const htmlNuevosComentarios = await respuesta.text();

            // Ocultar skeleton
            ocultarSkeletonLoader();

            // Insertar nuevos comentarios antes del sentinela
            estado.elementoSentinela.insertAdjacentHTML('beforebegin', htmlNuevosComentarios);

            // ✅ Animacion fadeIn suave para cada comentario nuevo
            animarAparicionComentarios();

            // ✅ Re-inicializar botones responder, reacciones, etc en nuevos comentarios
            reInicializarFuncionalidadesNuevosElementos();

            logDebug(`✅ Pagina ${estado.paginaActual} cargada exitosamente`);

        } catch (error) {
            logDebug('❌ Error cargando comentarios:', error);
            ocultarSkeletonLoader();
            // En caso de error, retroceder pagina para volver a intentar
            estado.paginaActual -= 1;

        } finally {
            estado.cargando = false;

            // ✅ Si ya no hay mas comentarios, limpiar todo
            if (!estado.hayMasComentarios) {
                finalizarScrollInfinito();
            }
        }
    }

    /**
     * ✅ Muestra el skeleton loader animado mientras carga
     */
    function mostrarSkeletonLoader() {
        const skeletonHtml = `
        <div id="comments-loader-wrapper" style="animation: fadeIn 200ms ease;">
            <div class="comment-skeleton">
                <div class="comment-skeleton-avatar"></div>
                <div class="comment-skeleton-content">
                    <div class="comment-skeleton-line short"></div>
                    <div class="comment-skeleton-line medium"></div>
                    <div class="comment-skeleton-line long"></div>
                </div>
            </div>
            <div class="comment-skeleton mt-3">
                <div class="comment-skeleton-avatar"></div>
                <div class="comment-skeleton-content">
                    <div class="comment-skeleton-line short"></div>
                    <div class="comment-skeleton-line long"></div>
                </div>
            </div>
        </div>
        `;
        estado.elementoSentinela.insertAdjacentHTML('beforebegin', skeletonHtml);
    }

    function ocultarSkeletonLoader() {
        const loader = document.getElementById('comments-loader-wrapper');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 200);
        }
    }

    /**
     * ✅ Animacion suave fadeIn para cada nuevo comentario
     * Evita saltos bruscos en el scroll
     */
    function animarAparicionComentarios() {
        // Seleccionar todos los comentarios que NO tienen aun la animacion
        const comentariosNuevos = estado.contenedorComentarios.querySelectorAll('.comment-wrapper:not(.loaded)');

        comentariosNuevos.forEach((comentario, indice) => {
            // Aplicar delay escalonado para efecto cascada
            setTimeout(() => {
                comentario.classList.add('loaded');
                comentario.style.opacity = '1';
                comentario.style.transform = 'translateY(0)';
            }, indice * 70);
        });
    }

    /**
     * ✅ Cuando ya no hay mas comentarios:
     *  - Desconectamos el observer para liberar memoria
     *  - Mostramos mensaje final elegante
     */
    function finalizarScrollInfinito() {
        // Desconectar observer (IMPORTANTE para liberar memoria)
        if (estado.observer) {
            estado.observer.disconnect();
            estado.observer = null;
        }

        // Eliminar el sentinela
        if (estado.elementoSentinela) {
            estado.elementoSentinela.remove();
        }

        // Mostrar mensaje final
        const mensajeFinal = document.createElement('div');
        mensajeFinal.className = 'text-center py-4 mt-3 text-muted';
        mensajeFinal.style.animation = 'fadeIn 400ms ease';
        mensajeFinal.innerHTML = `
            <div class="d-flex align-items-center justify-content-center gap-2">
                <span>✅</span>
                <span>Has visto todos los comentarios</span>
            </div>
        `;

        estado.contenedorComentarios.appendChild(mensajeFinal);

        logDebug('🏁 No hay mas comentarios. Scroll infinito finalizado.');
    }

    /**
     * ✅ Re-inicializa TODAS las funcionalidades existentes para los nuevos comentarios
     * Boton responder, reacciones, hover effects, etc
     * NADA se rompe, todo sigue funcionando exactamente igual
     */
    function reInicializarFuncionalidadesNuevosElementos() {
        // 1. Volver a enlazar botones Responder
        document.querySelectorAll('.reply-btn:not(.initialized)').forEach(btn => {
            btn.classList.add('initialized');
            
            btn.addEventListener('click', function() {
                document.querySelectorAll('.reply-form-container').forEach(f => f.remove());
                
                const commentId = this.getAttribute('data-comment-id');
                const commentItem = this.closest('.comment-wrapper');
                
                commentItem.insertAdjacentHTML('beforeend', getReplyFormHtml(commentId));
                
                const replyForm = commentItem.querySelector('.reply-form-container form');
                setupCommentForm(replyForm);
                
                commentItem.querySelector('textarea[name="content"]').focus();
                
                commentItem.querySelector('.cancel-reply').addEventListener('click', function() {
                    this.closest('.reply-form-container').remove();
                });
            });
        });

        // 2. Aqui se pueden agregar mas inicializaciones:
        // ✅ Botones reaccion, ✅ Tooltips, ✅ Etc
    }

    function logDebug(...args) {
        if (CONFIG.DEBUG_MODE) {
            console.log('🔄 SCROLL INFINITO:', ...args);
        }
    }

    // ✅ INICIAR!
    inicializarScrollInfinito();
});

// ==============================================================
// FIN HU-005.6 - SCROLL INFINITO
// ==============================================================


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
            .then(async response => {
                // Intentar leer respuesta JSON con manejo de error
                try {
                    const data = await response.json();
                    
                    if (!response.ok) {
                        // Si el servidor envio un mensaje de error usarlo
                        if (data && data.message) {
                            throw new Error(data.message);
                        }
                        if (data && data.error) {
                            throw new Error(data.error);
                        }
                        // Si hay errores de formulario especificos
                        if (data && data.errors) {
                            const firstError = Object.values(data.errors)[0];
                            throw new Error(firstError);
                        }
                        throw new Error('Validacion fallida');
                    }
                    
                    return data;
                    
                } catch (jsonError) {
                    // Si no es JSON es error de servidor, pagina 500 o similar
                    if (response.status === 403) {
                        throw new Error('Error de seguridad CSRF. Por favor recarga la página.');
                    }
                    if (response.status === 500) {
                        throw new Error('Error interno en el servidor.');
                    }
                    throw new Error(`Error ${response.status}: Ha ocurrido un problema`);
                }
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
                
                // ✅ USAR TOAST (MISMO SISTEMA QUE HOME)
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

                // Remover completamente el formulario
                const formContainer = this.closest('.reply-form-container');
                if (formContainer) {
                    formContainer.remove();
                } else {
                    this.remove();
                }
            })
            .catch(error => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
                
                // Obtener mensaje de error real del servidor si esta disponible
                let errorMessage = 'Ha ocurrido un error al enviar el comentario';
                
                // Intentar extraer mensaje real de la respuesta
                if (error.message && error.message !== 'Validacion fallida' && error.message !== 'Error en el servidor') {
                    errorMessage = error.message;
                }
                
                // ✅ USAR TOAST (MISMO SISTEMA QUE HOME)
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
            <form method="POST" action="${window.location.pathname}comment/">
                <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
                <input type="hidden" name="parent_id" value="${commentId}">
                <input type="hidden" name="website" value="">
                
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
            const commentItem = this.closest('.comment-wrapper');
            
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