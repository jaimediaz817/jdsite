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
TEXT_HEIGHT_RATIO = 0.15  # 15% del QR para texto (abajo)
FONT_SIZE_RATIO = 0.05  # 5% del QR para tamaño de fuente
TEXT_COLOR = "#1a1a1a"  # Texto negro


def generate_qr_with_logo(url, output_path, logo_path=None, text=None):
    """
    Genera un código QR con logo MTP centrado y texto descriptivo debajo.

    Args:
        url: URL de destino del QR (ej: https://jaimediaz.dev/blog/qr/calistenia-cancha/)
        output_path: Ruta completa donde guardar el PNG (ej: media/qr_codes/mi-qr.png)
        logo_path: Ruta al logo MTP (opcional, usa default si no se especifica)
        text: Texto descriptivo opcional para mostrar debajo del QR (ej: "Calistenia Cancha - Poste Norte")

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
        qr_img = _add_text(qr_img, text, text_height)

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


def _add_text(qr_img, text, text_height):
    """
    Añade texto descriptivo debajo del QR.

    Args:
        qr_img: Imagen PIL del QR (cuadrada)
        text: Texto a mostrar (nombre del QR)
        text_height: Altura del área de texto

    Returns:
        Image: Imagen con texto agregado (rectangular)
    """
    # Anchura total
    width = qr_img.size[0]
    height = qr_img.size[1] + text_height

    # Crear imagen más alta
    new_img = Image.new("RGB", (width, height), "white")

    # Pegar QR encima
    new_img.paste(qr_img, (0, 0))

    # Preparar dibujo
    draw = ImageDraw.Draw(new_img)

    # Calcular tamaño de fuente
    font_size = int(width * FONT_SIZE_RATIO)

    # Intentar usar una fuente sans-serif (de sistema)
    try:
        from PIL import ImageFont

        # Intentar con fuentes comunes
        font = None
        for font_path in [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux
            "/System/Library/Fonts/Helvetica.ttc",  # Mac
            "C:/Windows/Fonts/arial.ttf",  # Windows
            "/Library/Fonts/Arial.ttf",  # Mac alternativo
        ]:
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except Exception:
                continue
        if font is None:
            font = ImageFont.load_default()
    except Exception:
        # Fallback sin fuente
        font = None

    # Dibujar texto centrado
    text_bbox = (
        draw.textbbox((0, 0), text, font=font)
        if font
        else (0, 0, len(text) * font_size, font_size)
    )
    text_width = text_bbox[2] - text_bbox[0]
    text_x = (width - text_width) // 2
    text_y = height - text_height // 2 - (font_size // 2)

    draw.text((text_x, text_y), text, fill=TEXT_COLOR, font=font)

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
