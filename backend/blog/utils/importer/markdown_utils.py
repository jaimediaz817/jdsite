"""Utilities for handling markdown files used by the blog import command."""

import hashlib
import re
from pathlib import Path


def calculate_file_hash(md_path: Path) -> str:
    """Return a SHA-256 hash of the given markdown file."""
    with md_path.open("rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def _normalize_lines(text: str) -> str:
    """Normalise simple line breaks to spaces inside paragraphs."""
    lines = text.split("\n")
    result = []
    in_code_block = False

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Detect start/end of fenced code blocks
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            result.append(line)
            continue

        if in_code_block:
            result.append(line)
            continue

        # Structural lines that must stay separate
        is_structural = (
            stripped == ""
            or stripped.startswith(("#", ">", "```"))
            or re.match(r"^[-*+]\s", stripped)
            or re.match(r"^\d+\.\s", stripped)
            or re.match(r"^\|", stripped)
            or stripped.startswith(":::")
            or stripped.startswith("__SPECIAL_BLOCK_")
            or re.match(r"^!\[.*?\]\(.*?\)", stripped)
        )

        prev_line = lines[i - 1].strip() if i > 0 else ""
        prev_is_structural = (
            prev_line == ""
            or prev_line.startswith(("#", ">", "```"))
            or re.match(r"^[-*+]\s", prev_line)
            or re.match(r"^\d+\.\s", prev_line)
            or re.match(r"^\|", prev_line)
            or prev_line.startswith(":::")
            or prev_line.startswith("__SPECIAL_BLOCK_")
            or re.match(r"^!\[.*?\]\(.*?\)", prev_line)
        )

        if is_structural or prev_is_structural:
            result.append(line)
        else:
            result.append(line + " §JOIN§")

    joined = "\n".join(result)
    joined = re.sub(r" §JOIN§\n", " ", joined)
    joined = re.sub(r" §JOIN§$", "", joined)
    return joined


def _parse_frontmatter_manual(text: str) -> tuple[dict, str]:
    """Extrae el frontmatter YAML manual y el cuerpo del markdown.

    Retorna (frontmatter_dict, body_str).
    El frontmatter se extrae ANTES de normalizar para no romper
    el separador ``---`` de cierre.
    """
    frontmatter: dict = {}
    body = text

    if text.startswith("---"):
        all_lines = text.split("\n")
        close_idx = None
        for i in range(1, len(all_lines)):
            if all_lines[i].strip() == "---":
                close_idx = i
                break

        if close_idx is not None:
            for line in all_lines[1:close_idx]:
                if ":" not in line:
                    continue
                k, v = line.split(":", 1)
                k = k.strip()
                v = v.strip()
                # Quitar comillas externas
                if (v.startswith('"') and v.endswith('"')) or (
                    v.startswith("'") and v.endswith("'")
                ):
                    v = v[1:-1].strip()
                frontmatter[k] = v
            body = "\n".join(all_lines[close_idx + 1 :]).strip()

    return frontmatter, body


def read_markdown_file(md_path: Path):
    """Read a markdown file and return (content_md, frontmatter_dict)."""
    # 1) Leer el archivo
    try:
        md_content = md_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        md_content = md_path.read_text(encoding="latin-1", errors="replace")

    # 2) Quitar backslashes de continuacion
    lines = md_content.split("\n")
    cleaned_lines = [re.sub(r"\\+$", "", line) for line in lines]
    md_content = "\n".join(cleaned_lines)

    # 3) Extraer frontmatter ANTES de normalizar, porque _normalize_lines
    #    une líneas consecutivas y rompe el segundo ``---`` de cierre.
    frontmatter, body = _parse_frontmatter_manual(md_content)

    # 4) Proteger bloques ::: antes de normalizar (solo en el body)
    placeholders = {}
    counter = [0]

    def _protect(match):
        counter[0] += 1
        key = f"__SPECIAL_BLOCK_{counter[0]}__"
        placeholders[key] = match.group(0)
        return key

    body = re.sub(
        r":::[a-zA-Z0-9:_\-]+\s*\n.*?:::",
        _protect,
        body,
        flags=re.DOTALL,
    )

    # 5) Normalizar lineas solo del body
    content_md = _normalize_lines(body)

    # 6) Restaurar bloques
    for key, original in placeholders.items():
        content_md = content_md.replace(key, original)

    # 7) Quitar comentarios HTML
    content_md = re.sub(r"<!--.*?-->", "", content_md, flags=re.DOTALL).strip()

    return content_md, frontmatter
