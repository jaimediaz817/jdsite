import os

css = """/** 
 * reactions.css - Estilos profesionales para barra flotante izquierda
 */

:root {
    --reaction-bg: #ffffff;
    --reaction-bg-hover: #f3f4f6;
    --reaction-text: #6b7280;
    --reaction-active-text: #7c3aed;
    --reaction-active-bg: #f5f3ff;
    --reaction-active-hover: #ede9fe;
    --reaction-counter: #374151;
    --reaction-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    --reaction-shadow-active: 0 4px 12px rgba(124, 58, 237, 0.2);
}

/* === BARRA FLOTANTE LATERAL IZQUIERDA === */
.floating-reaction-bar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px;
    background: var(--reaction-bg);
    border-radius: 16px;
    box-shadow: var(--reaction-shadow);
    border: 1px solid #e5e7eb;
    width: 56px;
    align-items: center;
}

/* Botones de reacción en barra flotante */
.floating-reaction-bar .reaction-button {
    width: 44px;
    height: 44px;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: var(--reaction-text);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
}

.floating-reaction-bar .reaction-button + .reaction-button {
    margin-top: 4px;
}

.floating-reaction-bar .reaction-button:hover {
    background: var(--reaction-bg-hover);
    color: #374151;
}

.floating-reaction-bar .reaction-button:active {
    transform: scale(0.92);
}

/* Estado activo (usuario ha reaccionado) - MAS VISIBLE */
.floating-reaction-bar .reaction-button.active {
    background: var(--reaction-active-bg);
    color: var(--reaction-active-text);
    box-shadow: var(--reaction-shadow-active);
    border: 1px solid #c4b5fd;
    font-weight: 600;
}

.floating-reaction-bar .reaction-button.active:hover {
    background: var(--reaction-active-hover);
}

.floating-reaction-bar .reaction-button .icon {
    font-size: 18px;
    line-height: 1;
    color: currentColor;
    transition: all 0.2s ease;
}

.floating-reaction-bar .reaction-button.active .icon {
    color: var(--reaction-active-text);
}

.floating-reaction-bar .reaction-button:hover .icon {
    color: #374151;
}

.floating-reaction-bar .reaction-button .count {
    font-size: 10px;
    font-weight: 600;
    margin-top: 1px;
    color: #9ca3af;
    min-width: 18px;
    text-align: center;
    line-height: 1;
}

.floating-reaction-bar .reaction-button.active .count {
    color: #7c3aed;
    font-weight: 700;
}

.floating-reaction-bar .reaction-button:hover .count {
    color: #6b7280;
}

/* Botón de comentarios - anular Bootstrap */
.floating-reaction-bar .comment-button {
    width: 44px !important;
    height: 44px !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    border-radius: 12px !important;
    background: transparent !important;
    color: var(--reaction-text) !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease;
    cursor: pointer;
    text-decoration: none !important;
    box-shadow: none !important;
    outline: none !important;
    font-size: 12px !important;
}

.floating-reaction-bar .comment-button:hover {
    background: var(--reaction-bg-hover) !important;
    color: #374151 !important;
    text-decoration: none !important;
}

.floating-reaction-bar .comment-button .icon {
    font-size: 18px;
    line-height: 1;
    color: currentColor;
}

.floating-reaction-bar .comment-button .count {
    font-size: 10px;
    font-weight: 600;
    margin-top: 1px;
    color: #9ca3af;
    min-width: 18px;
    text-align: center;
    line-height: 1;
}

.floating-reaction-bar .comment-button:hover .count {
    color: #6b7280;
}

/* Separador visual */
.floating-reaction-bar .border-top {
    width: 28px;
    border-color: #e5e7eb !important;
    opacity: 1;
}

/* === BOTONES DEL ARTICULO (inferiores) === */
.blog-reactions .reaction-button {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 8px 14px;
    min-width: 48px;
    min-height: 48px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #ffffff;
    color: var(--reaction-text);
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
    box-shadow: var(--reaction-shadow);
}

.blog-reactions .reaction-button:hover {
    background: #f9fafb;
    border-color: #d1d5db;
}

.blog-reactions .reaction-button.active {
    background: var(--reaction-active-bg);
    color: var(--reaction-active-text);
    border-color: #c4b5fd;
    box-shadow: var(--reaction-shadow-active);
    font-weight: 600;
}

.blog-reactions .reaction-button .icon {
    font-size: 22px;
    line-height: 1;
    color: currentColor;
}

.blog-reactions .reaction-button.active .icon {
    color: var(--reaction-active-text);
}

.blog-reactions .reaction-button .count {
    font-size: 11px;
    font-weight: 600;
    margin-top: 2px;
    color: #9ca3af;
    min-width: 24px;
    text-align: center;
    line-height: 1.2;
}

.blog-reactions .reaction-button.active .count {
    color: var(--reaction-active-text);
    font-weight: 700;
}

/* Animación pulsación */
@keyframes reactionPulse {
    0% { transform: scale(1); }
    40% { transform: scale(1.15); }
    60% { transform: scale(0.95); }
    100% { transform: scale(1); }
}

/* Foco accesible */
.reaction-button:focus-visible {
    outline: 2px solid #7c3aed;
    outline-offset: 2px;
}

/* Estados de carga */
.reaction-button.loading {
    opacity: 0.6;
    pointer-events: none;
}

/* Responsive */
@media (max-width: 768px) {
    .floating-reaction-bar {
        width: 48px;
        padding: 4px;
        gap: 4px;
    }
    .floating-reaction-bar .reaction-button,
    .floating-reaction-bar .comment-button {
        width: 38px !important;
        height: 38px !important;
    }
    .floating-reaction-bar .reaction-button .icon,
    .floating-reaction-bar .comment-button .icon {
        font-size: 16px;
    }
}
"""

target = os.path.join("blog", "static", "blog", "css", "reactions.css")
with open(target, "w", encoding="utf-8") as f:
    f.write(css)
print(f"OK: {len(css)} bytes escritos en {target}")
