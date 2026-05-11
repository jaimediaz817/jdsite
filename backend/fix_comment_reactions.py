import os

# Agregar estilos profesionales para reacciones en comentarios
additional_css = """
/* ===== REACCIONES EN COMENTARIOS ===== */
.comment-reactions {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    background: #f9fafb;
    border-radius: 20px;
    border: 1px solid #e5e7eb;
}

.comment-reactions .reaction-comment-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 4px 8px;
    min-height: 28px;
    border: none;
    border-radius: 14px;
    background: transparent;
    color: #9ca3af;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
    line-height: 1;
}

.comment-reactions .reaction-comment-btn:hover {
    background: #e5e7eb;
    color: #6b7280;
}

.comment-reactions .reaction-comment-btn:active {
    transform: scale(0.9);
}

.comment-reactions .reaction-comment-btn .icon {
    font-size: 15px;
    line-height: 1;
    color: currentColor;
}

.comment-reactions .reaction-comment-btn .count {
    font-size: 11px;
    font-weight: 600;
    color: currentColor;
}

/* Estado activo en comentarios - morado */
.comment-reactions .reaction-comment-btn.active {
    background: #f5f3ff;
    color: #7c3aed;
    border: 1px solid #c4b5fd;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(124, 58, 237, 0.15);
}

.comment-reactions .reaction-comment-btn.active:hover {
    background: #ede9fe;
}

.comment-reactions .reaction-comment-btn.active .icon {
    color: #7c3aed;
}

.comment-reactions .reaction-comment-btn.active .count {
    color: #7c3aed;
    font-weight: 700;
}
"""

target = os.path.join("blog", "static", "blog", "css", "reactions.css")
with open(target, "a", encoding="utf-8") as f:
    f.write(additional_css)
print(f"OK: agregados {len(additional_css)} bytes al final de {target}")
