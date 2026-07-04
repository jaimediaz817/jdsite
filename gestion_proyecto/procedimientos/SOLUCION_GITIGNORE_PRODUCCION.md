# Solución para .gitignore en Producción

## Problema (Permission denied)
```
fatal: cannot create directory at 'backend/blogs_source/2026-07-03_test': Permission denied
```

## O (conflicto de merge)
```
CONFLICT (content): Merge conflict in .gitignore
Automatic merge failed; fix conflicts and then commit the result.
```

---

## SOLUCIÓN - En tu VPS

```bash
# 1. Reemplazar .gitignore con contenido limpio
cat > .gitignore << 'EOF'
node_modules/
backend/jdsite/__pycache__/
backend/inquiries/__pycache__/
backend/inquiries/migrations/__pycache__/
backend/.env
env/
venv/
backend/db.sqlite3
backend/staticfiles/
*.pyc
__pycache__/
backend/static/blogs/

# Ignore temporary files and directories
backend/media/blog_editor_temp/
backend/blogs_source/
EOF

# 2. Commitear el .gitignore arreglado
git add .gitignore && git commit -m "Resolve gitignore conflict"

# 3. Arreglar permisos del backend
sudo chown -R jdiaz:jdiaz backend/

# 4. Hacer el pull
git pull origin main
```

---

## Verificación
```
Ignored files:
        backend/blogs_source/
        backend/media/blog_editor_temp/
```

**Los archivos existentes PERMANECEN en el servidor** - solo no serán sincronizados con Git.