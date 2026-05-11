#!/usr/bin/env python3
import os

content = r"""
/**
 * Sistema de Reacciones Blog - Minimalista Profesional
 */

/* Variables de color */
:root {
    --reaction-bg: #ffffff;
    --reaction-bg-hover: #f3f4f6;
    --reaction-text: #6b7280;
    --reaction-active: #8b5cf6;
    --reaction-active-text: #ffffff;
    --reaction-border: transparent;
    --reaction-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    --reaction-counter: #374151;
    --reaction-counter-active: #ffffff;
}

/* Contenedor de reacciones */
.blog-reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
    background: var(--reaction-bg);
    border-radius: 12px;
    border: 1px solid var(--reaction-border);
    box-shadow: var(--reaction-shadow);
    justify-content: center;
}

/* Boton de reaccion (en el articulo) */
.reaction-button {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 6px 10px;
    min-width: 44px;
    min-height: 44px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--reaction-text);
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
}
.reaction-button:hover { background: var(--reaction-bg-hover); }
.reaction-button:active { transform: scale(0.95); transition: transform 80ms ease-in; }
.reaction-button.active {
    background: var(--reaction-active);
    color: var(--reaction-active-text);
    animation: reactionPulse 280ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 6px 12px rgba(139, 92, 246, 0.3);
}
.reaction-button .icon { font-size: 20px; line-height: 1; color: var(--reaction-text); transition: color 0.2s ease; }
.reaction-button:hover .icon { color: #374151; }
.reaction-button.active .icon { color: var(--reaction-active-text); }
.reaction-button .count { font-size: 11px; font-weight: 600; margin-top: 1px; color: var(--reaction-counter); min-width: 24px; text-align: center; line-height: 1.2; }
.reaction-button.active .count { color: var(--reaction-counter-active); }

/* Foco accesible */
.reaction-button:focus,
.reaction-button:focus-visible {
    outline: 2px solid var(--reaction-active);
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.4);
}

/* Animacion de pulsacion */
@keyframes reactionPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

/* ===== BARRA FLOTANTE LATERAL IZQUIERDA ===== */
.floating-reaction-bar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px;
    background: var(--reaction-bg);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.floating-reaction-bar .reaction-button {
    width: 48px; height: 48px; padding: 4px; border: none; border-radius: 10px;
    background: transparent; color: var(--reaction-text);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    transition: all 0.2s ease; cursor: pointer; position: relative;
}
.floating-reaction-bar .reaction-button + .reaction-button { margin-top: 8px; }
.floating-reaction-bar .reaction-button .icon { font-size: 22px; line-height: 1; color: var(--reaction-text); transition: color 0.2s ease; }
.floating-reaction-bar .reaction-button:hover .icon { color: #374151; }
.floating-reaction-bar .reaction-button.active .icon { color: var(--reaction-active-text); }
.floating-reaction-bar .reaction-button .count { font-size: 10px; font-weight: 600; margin-top: 2px; color: var(--reaction-counter); min-width: 20px; text-align: center; line-height: 1; }
.floating-reaction-bar .reaction-button.active .count { color: var(--reaction-counter-active); }

.floating-reaction-bar .comment-button {
    width: 48px !important; height: 48px !important; padding: 4px !important;
    border: none !important; border-radius: 10px !important;
    background: transparent !important; color: #6b7280 !important;
    display: flex !important; flex-direction: column; align-items: center; justify-content: center;
    transition: all 0.2s ease; cursor: pointer;
    text-decoration: none !important; box-shadow: none !important; outline: none !important;
}
.floating-reaction-bar .comment-button:hover { background: #f3f4f6 !important; }
.floating-reaction-bar .comment-button .icon { font-size: 22px; line-height: 1; color: #6b7280; }
.floating-reaction-bar .comment-button:hover .icon { color: #374151; }
.floating-reaction-bar .comment-button .count { font-size: 10px; font-weight: 600; margin-top: 2px; color: #374151; min-width: 20px; text-align: center; line-height: 1; }

/* ===== BOTONES DE REACCION EN COMENTARIOS ===== */
.comment-reactions .reaction-comment-btn {
    margin-right: 6px; padding: 6px 8px; min-height: 48px; min-width: 48px;
    border: none; border-radius: 6px; background: transparent;
    color: var(--reaction-text); font-size: 12px; transition: all 0.2s ease;
}
.reaction-comment-btn:hover { background-color: var(--reaction-bg-hover); }
.reaction-comment-btn .count { padding-right: 2px; margin-right: 2px; color: var(--reaction-counter); font-weight: 600; }

/* ===== RESPONSIVE ===== */
@media (max-width: 640px) {
    .blog-reactions { gap: 6px; padding: 6px; }
    .reaction-button { padding: 5px 8px; min-height: 40px; min-width: 40px; }
}

/* ===== ESTADO DE CARGA ===== */
.reaction-button.loading { opacity: 0.7; pointer-events: none; }
"""

path = os.path.join("blog", "static", "blog", "css", "reactions.css")
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print(f"OK: escrito {len(content)} bytes en {path}")
