import re

# Simula el contenido que llega después de read_markdown_file (newlines normalizados a espacios)
content = "[title]:Barra lateral de reacciones [description]:La barra flotante aparece mientras lees ![alt text](image-3.png) [title]:Disposición responsive [description]:En móviles se oculta ![alt text](image-4.png)"

images_data = []


def extract_meta(match):
    raw_title = (match.group(1) or "").strip()
    raw_desc = (match.group(2) or "").strip()
    raw_img = match.group(3).strip()

    # Extraer src
    src_match = re.search(r"\((.*?)\)", raw_img)
    src = src_match.group(1) if src_match else ""

    images_data.append((src, raw_title, raw_desc))
    return raw_img  # return only the image markdown


# Patrón: opcionalmente [title]:texto [description]:texto, seguido de imagen
pattern = r"(?:\[title\]\s*:\s*(.*?))?\s*(?:\[description\]\s*:\s*(.*?))?\s*(!\[.*?\]\(.*?\))"
cleaned = re.sub(pattern, extract_meta, content, flags=re.DOTALL)

print("Cleaned:", repr(cleaned))
print("Images data:")
for src, title, desc in images_data:
    print(f"  src={src}, title={title!r}, desc={desc!r}")
