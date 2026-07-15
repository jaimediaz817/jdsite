# FASE 2: Validacion slug duplicado en services.py
services_path = "backend/blog/services.py"
with open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

# Buscar donde se genera el slug nuevo y agregar validacion
# El codigo existente (lineas 355-369) genera slug desde custom_slug
old = """    # 3. Generar slug
    today = datetime.now().strftime("%Y-%m-%d")

    if is_edit:
        slug = existing_slug
        folder_name = target_dir.name
    else:
        custom_slug = data.get("custom_slug", "").strip()
        base_slug = (
            slugify(custom_slug or title)[:60]
            or f"articulo-{uuid.uuid4().hex[:8]}"
        )
        slug = base_slug
        counter = 1
        while list(source_dir.glob(f"*_{slug}")):
            slug = f"{base_slug}-{counter}"
            counter += 1
        folder_name = f"{today}_{slug}"
        target_dir = source_dir / folder_name
        target_dir.mkdir(parents=True, exist_ok=True)"""

new = """    # 3. Generar slug
    today = datetime.now().strftime("%Y-%m-%d")

    # Determinar el slug final a usar (custom_slug tiene prioridad)
    custom_slug = data.get("custom_slug", "").strip()
    final_slug = custom_slug or slugify(title)[:60] or f"articulo-{uuid.uuid4().hex[:8]}"

    if is_edit:
        slug = existing_slug
        folder_name = target_dir.name
    else:
        slug = final_slug
        # HU-045: Validar que el slug no exista ya en BD para evitar duplicados
        from django.db.models import Q
        if BlogPost.objects.filter(Q(slug=slug) | Q(slug__startswith=f"{today}_{slug}")).exists():
            # El slug existe - si es edicion del mismo post se permite,
            # pero para un articulo NUEVO debemos rechazarlo.
            return {
                "error": "slug_duplicado",
                "slug_existente": slug
            }

        counter = 1
        while list(source_dir.glob(f"*_{slug}")):
            slug = f"{base_slug}-{counter}"
            counter += 1
        folder_name = f"{today}_{slug}"
        target_dir = source_dir / folder_name
        target_dir.mkdir(parents=True, exist_ok=True)"""

if old in content:
    content = content.replace(old, new, 1)
    with open(services_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("FASE 2 OK: Validacion slug duplicado agregada a services.py")
else:
    if "slug_duplicado" in content:
        print("FASE 2 OK: Validacion slug duplicado ya existe en services.py")
    else:
        print("ERROR: No se encontro el patron en services.py")
