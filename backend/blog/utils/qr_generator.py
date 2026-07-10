"""
Utilidad para generar códigos QR con logo MTP.
HU-029: Sistema de Códigos QR para Artículos del Blog.

Genera QR con:
- Logo MTP centrado (18% del tamaño del QR)
- Fondo negro circular detrás del logo (para contraste)
- Error correction alto (H) para legibilidad
- Texto descriptivo debajo del QR (título/eslogan)
"""

import os
from django.conf import settings
from PIL import Image, ImageDraw
import qrcode
from qrcode.constants import ERROR_CORRECT_H

# Configuración del QR
LOGO_SIZE_RATIO = 0.18  # 18% del tamaño del QR (reducido para mejor legibilidad)
LOGO_BG_COLOR = "#1a1a1a"  # Fondo negro circular
LOGO_PADDING = (
    0.12  # 12% de padding around logo (reducido para mejor legibilidad)
)

# Configuración del texto descriptivo
TEXT_HEIGHT_RATIO = (
    0.26  # 26% del QR para texto (abajo: línea + título + eslogan)
)
TITLE_FONT_RATIO = 0.045  # 4.5% del QR para tamaño de fuente del título
SLOGAN_FONT_RATIO = 0.045  # 4.5% del QR para tamaño de fuente del eslogan
TEXT_COLOR = "#1a1a1a"  # Texto negro
LINE_COLOR = "#1a1a1a"  # Color de la línea divisoria
LINE_MARGIN_RATIO = 0.06  # 6% de margen lateral para la línea y el texto
TEXT_BOTTOM_GAP_RATIO = 0.025  # gap entre línea y título
SLOGAN_TOP_GAP_RATIO = 0.02  # gap entre título y eslogan


def generate_qr_with_logo(
    url, output_path, logo_path=None, text=None, slogan=None
):
    """
    Genera un código QR con logo MTP centrado y texto descriptivo debajo.

    Args:
        url: URL de destino del QR (ej: https://jaimediaz.dev/blog/qr/calistenia-cancha/)
        output_path: Ruta completa donde guardar el PNG (ej: media/qr_codes/mi-qr.png)
        logo_path: Ruta al logo MTP (opcional, usa default si no se especifica)
        text: Texto descriptivo opcional para mostrar debajo del QR (ej: "Calistenia Cancha - Poste Norte")
        slogan: Eslogan opcional para mostrar debajo del título, alineado a la izquierda

    Returns:
        str: Ruta del archivo guardado
    """
    # Usar logo por defecto si no se especifica
    if not logo_path:
        logo_path = os.path.join(
            settings.BASE_DIR,  # backend/
            "static",
            "images",
            "addons",
            "logo_mark_to_post_dark_single.png",
        )

    # Tamaño base del QR (cuadrado)
    qr_size = 1000  # pixeles (alta resolución para impresión)
    text_height = int(qr_size * TEXT_HEIGHT_RATIO)  # Altura para texto debajo

    # Crear QR base
    qr = qrcode.QRCode(
        version=1,  # Se ajusta automáticamente según la URL
        error_correction=ERROR_CORRECT_H,  # 30% de corrección de errores
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Generar imagen del QR (blanco y negro)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    # Redimensionar a tamaño final
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)

    # Añadir logo
    if os.path.exists(logo_path):
        qr_img = _add_logo(qr_img, logo_path)

    # Añadir texto debajo del QR si se proporciona
    if text:
        qr_img = _add_text(qr_img, text, text_height, slogan=slogan)

    # Guardar imagen
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    qr_img.save(output_path, "PNG", quality=95)

    return output_path


def _add_logo(qr_img, logo_path):
    """
    Añade el logo MTP al centro del QR con fondo negro circular.

    Args:
        qr_img: Imagen PIL del QR
        logo_path: Ruta al logo

    Returns:
        Image: Imagen con logo superpuesto
    """
    # Abrir logo
    logo = Image.open(logo_path)

    # Convertir a RGBA si es necesario
    if logo.mode != "RGBA":
        logo = logo.convert("RGBA")

    # Calcular tamaño del logo (25% del QR)
    logo_size = int(qr_img.size[0] * LOGO_SIZE_RATIO)

    # Redimensionar logo manteniendo aspecto
    logo.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)

    # Crear fondo negro circular
    padding = int(logo_size * LOGO_PADDING)
    circle_size = logo_size + (padding * 2)

    # Imagen circular negra
    circle_bg = Image.new("RGBA", (circle_size, circle_size), (0, 0, 0, 0))

    # Dibujar círculo negro
    draw = ImageDraw.Draw(circle_bg)
    draw.ellipse(
        [(0, 0), (circle_size, circle_size)], fill=(26, 26, 26, 255)  # #1a1a1a
    )

    # Pegar logo en el centro del círculo
    logo_pos = (padding, padding)
    circle_bg.paste(logo, logo_pos, logo)

    # Posicionar círculo con logo en el centro del QR
    qr_pos = (
        (qr_img.size[0] - circle_size) // 2,
        (qr_img.size[1] - circle_size) // 2,
    )

    # Pegar círculo con logo sobre el QR
    qr_img.paste(circle_bg, qr_pos, circle_bg)

    return qr_img


def _wrap_text(text, font, max_width):
    """
    Ajusta texto a múltiples líneas según el ancho máximo disponible.

    Args:
        text: Texto a ajustar
        font: Fuente a utilizar para medir
        max_width: Ancho máximo disponible

    Returns:
        list: Lista de líneas de texto
    """
    words = text.split()
    lines = []
    current_line = []

    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = font.getbbox(test_line)
        if bbox[2] <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]

    if current_line:
        lines.append(" ".join(current_line))

    return lines


def _add_text(qr_img, text, text_height, slogan=None):
    """
    Añade título (y opcionalmente eslogan) debajo del QR.

    Diseño:
    - Línea horizontal que divide el QR del bloque de texto.
    - Título alineado a la izquierda, fuente pequeña y sin negrita.
    - Eslogan debajo del título, también alineado a la izquierda, fuente aún menor.
    - Texto ajustado automáticamente a múltiples líneas si es necesario.

    Args:
        qr_img: Imagen PIL del QR (cuadrada)
        text: Texto a mostrar (título del QR)
        text_height: Altura mínima del área de texto
        slogan: Eslogan opcional a mostrar debajo del título

    Returns:
        Image: Imagen con texto agregado (rectangular)
    """
    from PIL import ImageFont

    width = qr_img.size[0]
    qr_bottom = qr_img.size[1]

    margin = int(width * LINE_MARGIN_RATIO)
    max_text_width = width - (2 * margin)

    title_font_size = int(width * TITLE_FONT_RATIO)

    # Cargar fuente
    title_font = None
    for font_path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:/Windows/Fonts/arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ]:
        try:
            title_font = ImageFont.truetype(font_path, title_font_size)
            break
        except Exception:
            continue
    if title_font is None:
        title_font = ImageFont.load_default()

    # Calcular líneas del título
    title_lines = _wrap_text(text, title_font, max_text_width)

    slogan_font = None
    slogan_lines = []
    slogan_font_size = 0

    if slogan:
        slogan_font_size = int(width * SLOGAN_FONT_RATIO)
        for font_path in [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "C:/Windows/Fonts/arial.ttf",
            "/Library/Fonts/Arial.ttf",
        ]:
            try:
                slogan_font = ImageFont.truetype(font_path, slogan_font_size)
                break
            except Exception:
                continue
        if slogan_font is None:
            slogan_font = ImageFont.load_default()
        slogan_lines = _wrap_text(slogan, slogan_font, max_text_width)

    # Calcular alturas necesarias
    gap = int(width * TEXT_BOTTOM_GAP_RATIO)
    line_y = qr_bottom + int(text_height * 0.02)
    title_y = line_y + gap
    title_total_h = len(title_lines) * title_font_size

    slogan_total_h = 0
    slogan_y = 0
    if slogan_lines:
        slogan_gap = int(width * SLOGAN_TOP_GAP_RATIO)
        slogan_y = title_y + title_total_h + slogan_gap
        slogan_total_h = len(slogan_lines) * slogan_font_size

    # Calcular altura final
    final_text_bottom = (
        slogan_y + slogan_total_h + gap
        if slogan_lines
        else title_y + title_total_h + gap
    )
    final_height = qr_bottom + int(text_height * 0.05) + final_text_bottom

    # Crear imagen final
    new_img = Image.new("RGB", (width, final_height), "white")
    draw = ImageDraw.Draw(new_img)

    # Pegar QR en la parte superior
    new_img.paste(qr_img, (0, 0))

    # Dibujar línea divisoria (100% ancho)
    draw.line([(0, line_y), (width, line_y)], fill=LINE_COLOR, width=2)

    # Dibujar título
    for i, line in enumerate(title_lines):
        draw.text(
            (margin, title_y + i * title_font_size),
            line,
            fill=TEXT_COLOR,
            font=title_font,
        )

    # Dibujar eslogan
    if slogan_lines:
        for i, line in enumerate(slogan_lines):
            draw.text(
                (margin, slogan_y + i * slogan_font_size),
                line,
                fill=TEXT_COLOR,
                font=slogan_font,
            )

    return new_img


def get_qr_filename(slug):
    """
    Genera el nombre de archivo para un QR.

    Args:
        slug: Slug del QR (ej: 'calistenia-cancha')

    Returns:
        str: Nombre del archivo (ej: 'calistenia-cancha.png')
    """
    return f"{slug}.png"


def get_qr_media_path(slug):
    """
    Genera la ruta relativa para guardar el QR en media/qr_codes/.

    Args:
        slug: Slug del QR

    Returns:
        str: Ruta relativa (ej: 'qr_codes/calistenia-cancha.png')
    """
    filename = get_qr_filename(slug)
    return os.path.join("qr_codes", filename)


def get_qr_full_path(slug):
    """
    Genera la ruta completa para guardar/leer el QR.

    Args:
        slug: Slug del QR

    Returns:
        str: Ruta completa en disco
    """
    relative_path = get_qr_media_path(slug)
    return os.path.join(settings.MEDIA_ROOT, relative_path)
