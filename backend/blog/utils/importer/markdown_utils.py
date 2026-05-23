"""Utilities for handling markdown files used by the blog import command.

The original ``import_blogs`` command contained a handful of helper methods
related to reading a markdown file, normalising line breaks and calculating a
SHA‑256 hash of the source file.  To improve modularity we move those helpers
into this dedicated module.  The public API mirrors the previous private
methods so that the command can be updated with minimal changes.
"""

import hashlib
import re
from pathlib import Path


def calculate_file_hash(md_path: Path) -> str:
    """Return a SHA‑256 hash of the given markdown file.

    The function reads the file in binary mode to ensure a deterministic hash
    regardless of the platform's newline handling.
    """
    with md_path.open("rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def _normalize_lines(text: str) -> str:
    """Normalise simple line breaks to spaces inside paragraphs.

    This implementation is extracted verbatim from the original command.  It
    preserves structural lines such as headings, lists, blockquotes, code
    blocks and special ``:::`` blocks while joining soft‑wrapped lines.
    """
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
        )

        if is_structural or prev_is_structural:
            result.append(line)
        else:
            result.append(line + " §JOIN§")

    joined = "\n".join(result)
    # Replace the join markers with a single space
    joined = re.sub(r" §JOIN§\n", " ", joined)
    joined = re.sub(r" §JOIN§$", "", joined)
    return joined


def read_markdown_file(md_path: Path):
    """Read a markdown file and return a tuple ``(content_md, frontmatter)``.

    The logic is a direct extraction from the original ``read_markdown_file``
    method, preserving the handling of back‑slash line continuations, protection
    of special ``:::`` blocks, front‑matter parsing and removal of HTML comments.
    """
    # Load file with UTF‑8 fallback to latin‑1 (mirrors original behaviour)
    try:
        md_content = md_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        md_content = md_path.read_text(encoding="latin-1", errors="replace")

    # Remove trailing backslashes used as line continuations
    lines = md_content.split("\n")
    cleaned_lines = [re.sub(r"\\+$", "", line) for line in lines]
    md_content = "\n".join(cleaned_lines)

    # Protect special ::: blocks before normalisation
    placeholders = {}
    placeholder_counter = [0]

    def _protect(match):
        placeholder_counter[0] += 1
        key = f"__SPECIAL_BLOCK_{placeholder_counter[0]}__"
        placeholders[key] = match.group(0)
        return key

    md_content = re.sub(
        r":::[a-zA-Z0-9:_\-]+\s*\n.*?:::",
        _protect,
        md_content,
        flags=re.DOTALL,
    )

    # Normalise line breaks inside paragraphs
    md_content = _normalize_lines(md_content)

    # Restore protected blocks
    for key, original in placeholders.items():
        md_content = md_content.replace(key, original)

    frontmatter: dict = {}
    content_md = md_content

    if md_content.startswith("---"):
        parts = md_content.split("---", 2)
        if len(parts) >= 3:
            raw = parts[1].strip()
            content_md = parts[2].strip()
            for line in raw.splitlines():
                if ":" not in line:
                    continue
                k, v = line.split(":", 1)
                k = k.strip()
                v = v.strip()
                if (v.startswith('"') and v.endswith('"')) or (
                    v.startswith("'") and v.endswith("'")
                ):
                    v = v[1:-1].strip()
                frontmatter[k] = v

    # Strip HTML comments from the markdown body
    content_md = re.sub(r"<!--.*?-->", "", content_md, flags=re.DOTALL).strip()

    return content_md, frontmatter
