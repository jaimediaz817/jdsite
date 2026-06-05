"""
yaml_simple.py
=============
Parser YAML muy básico sin dependencias externas.

Suficiente para los frontmatters de blogs (formato plano clave: valor).
NO soporta YAML completo (anclas, referencias, multi-documento, tags
complejos, etc.) — solo lo que usa el blog: cadenas, enteros, booleanos,
listas cortas.

Uso:
    from blog.utils.yaml_simple import parse_frontmatter, build_frontmatter
    fm, body = parse_frontmatter(md_text)
    md_text = build_frontmatter(fm_dict) + body
"""

import json
import re


def _strip_inline_quotes(value):
    """Quita comillas externas (simples o dobles) y devuelve el string limpio."""
    if not isinstance(value, str):
        return value
    v = value.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
        v = v[1:-1]
    return v


def _coerce(value):
    """
    Convierte un string crudo de YAML a su tipo Python más probable.
    """
    v = value.strip()
    if v == "":
        return ""
    # booleanos
    if v.lower() in ("true", "yes", "on"):
        return True
    if v.lower() in ("false", "no", "off"):
        return False
    # null
    if v.lower() in ("null", "none", "~"):
        return None
    # int
    if re.match(r"^-?\d+$", v):
        try:
            return int(v)
        except ValueError:
            pass
    # float
    if re.match(r"^-?\d+\.\d+$", v):
        try:
            return float(v)
        except ValueError:
            pass
    return _strip_inline_quotes(v)


def _parse_list_value(value):
    """
    Parsea el valor de una línea que puede ser:
    - lista inline: [a, b, c]
    - escalar: 'algo' o 123
    """
    v = value.strip()
    if v.startswith("[") and v.endswith("]"):
        # Lista inline
        inner = v[1:-1].strip()
        if not inner:
            return []
        # Intentar primero como JSON (es válido YAML para listas simples)
        try:
            return json.loads(v)
        except Exception:
            # Fallback: split por coma
            parts = [p.strip() for p in inner.split(",") if p.strip()]
            return [_coerce(p) for p in parts]
    return _coerce(v)


def parse_frontmatter(text):
    """
    Parsea el frontmatter YAML de un .md.
    Retorna (dict, body_str).
    Si no hay frontmatter, retorna ({}, text).
    """
    if not text or not text.startswith("---"):
        return {}, text or ""
    # Buscar el segundo ---
    # split con maxsplit=2 para preservar el body aunque contenga ---
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text

    fm_raw = parts[1]
    body = parts[2]

    fm = {}
    for line in fm_raw.split("\n"):
        # Saltar líneas vacías
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        # Parsear clave: valor
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        # Las claves que inician con # son comentarios YAML
        if key.startswith("#"):
            continue
        fm[key] = _parse_list_value(value)

    return fm, body


def build_frontmatter(fm_dict):
    """
    Construye el string del frontmatter YAML desde un dict.
    Mantiene el orden de las claves y aplica formato limpio.
    """
    if not fm_dict:
        return ""

    lines = ["---"]
    for key, value in fm_dict.items():
        if value is None:
            continue
        if isinstance(value, bool):
            lines.append(f"{key}: {'true' if value else 'false'}")
        elif isinstance(value, (int, float)):
            lines.append(f"{key}: {value}")
        elif isinstance(value, list):
            # serializar como JSON inline (compatible con YAML)
            try:
                lines.append(f"{key}: {json.dumps(value, ensure_ascii=False)}")
            except Exception:
                # Fallback a lista manual
                items = ", ".join(f'"{str(i)}"' for i in value)
                lines.append(f"{key}: [{items}]")
        elif isinstance(value, str):
            if value == "":
                # No emitir líneas vacías
                continue
            # Escapar comillas dobles internas
            escaped = value.replace('"', '\\"')
            lines.append(f'{key}: "{escaped}"')
        else:
            # Otros tipos: convertir a string
            escaped = str(value).replace('"', '\\"')
            lines.append(f'{key}: "{escaped}"')

    lines.append("---")
    lines.append("")  # línea en blanco después del cierre
    return "\n".join(lines) + "\n"
