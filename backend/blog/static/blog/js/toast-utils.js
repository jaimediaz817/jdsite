/**
 * toast-utils.js - Utilidad global de toasts premium para el blog
 * HU-036: Sistema de notificaciones reutilizable
 * 
 * Uso:
 *   showBlogToast('mensaje', 'danger');  // Error
 *   showBlogToast('mensaje', 'warning'); // Advertencia
 * 
 * Características:
 * - Diseño premium Instagram/Facebook
 * - 8 segundos de duración
 * - Barra de progreso animada
 * - Soporte dark mode
 * - Sin dependencias externas
 */

(function() {
    'use strict';

    // Estado global del toast
    var toastContainer = null;
    var currentHideTimeout = null;
    var cssInjected = false;

    // ============================================
    // INYECCIÓN DE CSS (una sola vez)
    // ============================================
    function injectToastCSS() {
        if (cssInjected) return;

        var style = document.createElement('style');
        style.id = 'toast-utils-styles';
        style.textContent = '\
            #post-access-toast-container {\
                position: fixed;\
                top: 28px;\
                left: 50%;\
                transform: translateX(-50%);\
                z-index: 1085;\
                width: min(94vw, 420px);\
                display: flex;\
                flex-direction: column;\
                align-items: center;\
                gap: 14px;\
                pointer-events: none;\
                filter: drop-shadow(0 20px 40px rgba(0,0,0,0.25));\
            }\
\
            #post-access-toast-container .post-access-toast {\
                pointer-events: auto;\
                position: relative;\
                width: 100%;\
                background: #ffffff;\
                border-radius: 22px;\
                box-shadow: 0 24px 48px rgba(0,0,0,0.22), 0 8px 16px rgba(0,0,0,0.12);\
                overflow: hidden;\
                transform: translateY(-30px) scale(0.92);\
                opacity: 0;\
                transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1);\
                border: 1px solid rgba(0,0,0,0.04);\
            }\
\
            #post-access-toast-container .post-access-toast.show {\
                transform: translateY(0) scale(1);\
                opacity: 1;\
            }\
\
            #post-access-toast-container .toast-badge {\
                position: absolute;\
                top: 20px;\
                left: 20px;\
                width: 42px;\
                height: 42px;\
                border-radius: 50%;\
                display: flex;\
                align-items: center;\
                justify-content: center;\
                font-size: 1.2rem;\
                flex-shrink: 0;\
                box-shadow: 0 4px 12px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.25);\
                border: 2.5px solid rgba(255,255,255,0.3);\
            }\
\
            #post-access-toast-container .post-access-toast.toast-danger .toast-badge {\
                background: linear-gradient(135deg, #ff6b7a 0%, #ee5a6f 50%, #d94558 100%);\
                color: #fff;\
                text-shadow: 0 1px 3px rgba(0,0,0,0.2);\
            }\
\
            #post-access-toast-container .post-access-toast.toast-warning .toast-badge {\
                background: linear-gradient(135deg, #ffb84d 0%, #ffa033 50%, #ff8c1a 100%);\
                color: #fff;\
                text-shadow: 0 1px 3px rgba(0,0,0,0.2);\
            }\
\
            #post-access-toast-container .toast-header {\
                padding: 26px 52px 8px 70px;\
                font-weight: 700;\
                font-size: 1.05rem;\
                color: #0f172a;\
                letter-spacing: -0.02em;\
                font-family: "Montserrat", -apple-system, BlinkMacSystemFont, sans-serif;\
                line-height: 1.3;\
            }\
\
            #post-access-toast-container .toast-header.toast-warning {\
                color: #7c2d12;\
            }\
\
            #post-access-toast-container .toast-body {\
                padding: 4px 52px 22px 70px;\
                color: #475569;\
                font-size: 0.95rem;\
                line-height: 1.6;\
                font-family: "Roboto", -apple-system, BlinkMacSystemFont, sans-serif;\
            }\
\
            #post-access-toast-container .toast-body strong {\
                color: #0f172a;\
                font-weight: 700;\
            }\
\
            #post-access-toast-container .toast-close {\
                position: absolute;\
                top: 16px;\
                right: 14px;\
                background: rgba(0,0,0,0.04);\
                border: none;\
                color: #64748b;\
                width: 32px;\
                height: 32px;\
                display: flex;\
                align-items: center;\
                justify-content: center;\
                cursor: pointer;\
                font-size: 1.3rem;\
                padding: 0;\
                border-radius: 50%;\
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);\
                font-weight: 300;\
            }\
\
            #post-access-toast-container .toast-close:hover {\
                background: rgba(0,0,0,0.08);\
                color: #1e293b;\
                transform: rotate(180deg) scale(1.15);\
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);\
            }\
\
            #post-access-toast-container .toast-progress {\
                height: 5px;\
                width: 100%;\
                background: rgba(0,0,0,0.05);\
                position: absolute;\
                bottom: 0;\
                left: 0;\
                overflow: hidden;\
            }\
\
            #post-access-toast-container .toast-progress::after {\
                content: "";\
                position: absolute;\
                top: 0;\
                left: 0;\
                height: 100%;\
                width: 100%;\
                background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 25%, #818cf8 50%, #a78bfa 75%, #10b981 100%);\
                background-size: 200% 100%;\
                transform: translateX(-100%);\
                animation: toast-progress-bar 8s ease-out forwards;\
                box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);\
            }\
\
            #post-access-toast-container .post-access-toast.toast-warning .toast-progress::after {\
                background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 25%, #f97316 50%, #fb923c 75%, #fbbf24 100%);\
                background-size: 200% 100%;\
                box-shadow: 0 0 12px rgba(251, 191, 36, 0.5);\
            }\
\
            @keyframes toast-progress-bar {\
                0% {\
                    transform: translateX(-100%);\
                    background-position: 0% 0%;\
                }\
                50% {\
                    background-position: 100% 0%;\
                }\
                100% {\
                    transform: translateX(0);\
                    background-position: 0% 0%;\
                }\
            }\
\
            #post-access-toast-container .post-access-toast::before {\
                content: "";\
                position: absolute;\
                top: 0;\
                left: 0;\
                width: 4px;\
                height: 100%;\
                background: linear-gradient(180deg, rgba(59, 130, 246, 0.3), rgba(16, 185, 129, 0.3));\
            }\
\
            #post-access-toast-container .post-access-toast.toast-warning::before {\
                background: linear-gradient(180deg, rgba(251, 191, 36, 0.4), rgba(245, 158, 11, 0.4));\
            }\
\
            html[data-reading-mode="dark"] #post-access-toast-container .post-access-toast {\
                background: #1e293b;\
                border-color: rgba(255,255,255,0.08);\
            }\
            html[data-reading-mode="dark"] #post-access-toast-container .toast-header {\
                color: #f1f5f9;\
                font-weight: 600;\
            }\
            html[data-reading-mode="dark"] #post-access-toast-container .toast-body {\
                color: #cbd5e1;\
            }\
            html[data-reading-mode="dark"] #post-access-toast-container .toast-body strong {\
                color: #f8fafc;\
            }\
            html[data-reading-mode="dark"] #post-access-toast-container .toast-close {\
                background: rgba(255,255,255,0.06);\
                color: #94a3b8;\
            }\
            html[data-reading-mode="dark"] #post-access-toast-container .toast-close:hover {\
                background: rgba(255,255,255,0.12);\
                color: #f1f5f9;\
            }\
            html[data-reading-mode="dark"] #post-access-toast-container .toast-progress {\
                background: rgba(255,255,255,0.08);\
            }\
            html[data-reading-mode="dark"] #post-access-toast-container .post-access-toast::before {\
                background: linear-gradient(180deg, rgba(96, 165, 250, 0.4), rgba(52, 211, 153, 0.4));\
            }\
            html[data-reading-mode="dark"] #post-access-toast-container .post-access-toast.toast-warning::before {\
                background: linear-gradient(180deg, rgba(251, 191, 36, 0.5), rgba(245, 158, 11, 0.5));\
            }\
        ';

        document.head.appendChild(style);
        cssInjected = true;
    }

    // ============================================
    // FUNCIÓN PRINCIPAL (API global)
    // ============================================
    window.showBlogToast = function(message, type) {
        // Inyectar CSS si no existe
        injectToastCSS();

        // Crear contenedor si no existe
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'post-access-toast-container';
            document.body.appendChild(toastContainer);
        }

        // Limpiar contenido previo
        toastContainer.innerHTML = '';

        // Crear toast con diseño premium
        var iconClass = type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle';
        var toast = document.createElement('div');
        toast.className = 'post-access-toast toast-' + type;
        toast.innerHTML = 
            '<div class="toast-badge"><i class="fas ' + iconClass + '"></i></div>' +
            '<div class="toast-header">Artículo no disponible</div>' +
            '<div class="toast-body">' + message + '</div>' +
            '<button type="button" class="toast-close" aria-label="Cerrar">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>' +
            '<div class="toast-progress"></div>';

        toastContainer.appendChild(toast);

        // Trigger animación de entrada
        setTimeout(function() {
            toast.classList.add('show');
        }, 10);

        // Auto-hide después de 8 segundos
        if (currentHideTimeout) {
            clearTimeout(currentHideTimeout);
        }
        currentHideTimeout = setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 450);
        }, 8000);

        // Botón cerrar
        var closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                if (currentHideTimeout) {
                    clearTimeout(currentHideTimeout);
                }
                toast.classList.remove('show');
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 450);
            });
        }
    };

    // ============================================
    // VERIFICACIÓN DE CARGA (senta logging)
    // ============================================
    // El toast está listo para usarse
    // window.showBlogToast() está disponible globalmente

})();