from pathlib import Path

p = Path(r"backend/blog/management/commands/import_blogs.py")
text = p.read_text(encoding="utf-8")

old = """                    if not img.get("alt"):
                        nombre_limpio = (
                            source_img.stem.replace("-", " ")
                            .replace("_", " ")
                            .title()
                        )
                        img["alt"] = nombre_limpio
                        self.stdout.write(
                            f"✅ Atributo alt generado automaticamente: {nombre_limpio}"
                        )

        return str(soup)"""

new = """                    if not img.get("alt"):
                        nombre_limpio = (
                            source_img.stem.replace("-", " ")
                            .replace("_", " ")
                            .title()
                        )
                        img["alt"] = nombre_limpio
                        self.stdout.write(
                            f"✅ Atributo alt generado automaticamente: {nombre_limpio}"
                        )

                    # Inyectar clase CSS profesional si el <img> no tiene clases
                    if not img.get("class"):
                        img["class"] = "img-fluid rounded blog-content-img"

        return str(soup)"""

if old not in text:
    raise SystemExit("OLD_BLOCK_NOT_FOUND")
text = text.replace(old, new, 1)
p.write_text(text, encoding="utf-8")
print("OK")
