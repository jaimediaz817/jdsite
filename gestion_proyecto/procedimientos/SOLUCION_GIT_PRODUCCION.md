# Solución Git para producción - blogs_source

## Problema
Demasiados archivos modificados en `backend/blogs_source/` y `backend/media/blog_editor_temp/` van a entrar en conflicto con `git pull`.

## Solución (3 opciones)

### Opción 1: Stash + Pull (RECOMENDADA)
```bash
# En la VPS:
cd /ruta/del/proyecto
git stash push -m "backup-prod-content-$(date +%Y%m%d)"
git pull origin main
# Después, si los cambios son compatibles:
git stash pop
```

### Opción 2: Añadir a .gitignore (temporal)
Agregar al `.gitignore` raíz:
```gitignore
backend/media/blog_editor_temp/
backend/blogs_source/
backend/static/blogs/
```

**ADVERTENCIA:** Si haces esto, pierdes el histórico de contenido. Solo usar si el contenido se va a manejar exclusivamente desde producción.

### Opción 3: Branch de staging
```bash
git checkout -b prod-content
git add backend/blogs_source/
git commit -m "Backup producción - $(date +%Y-%m-%d)"
git checkout main
git pull origin main
# Para sincronizar después:
git checkout prod-content
# resolver diferencias manualmente
```

## Notas
- `backend/blogs_source/` contiene el contenido editable (.md)
- `backend/media/blog_editor_temp/` contiene imágenes temporales (edición)
- `backend/static/blogs/` contiene los archivos servidos al público (generados al publicar)

## Recomendación
Usar **Opción 1 (Stash)** antes de cada pull. Es la más segura.