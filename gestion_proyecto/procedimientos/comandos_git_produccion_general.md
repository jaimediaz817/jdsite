# 1. Ir al proyecto
cd /ruta/del/proyecto

# 2. Remover del tracking SIN borrar del servidor (¡IMPORTANTE!)
git rm --cached -r backend/media/blog_editor_temp/
git rm --cached -r backend/blogs_source/

# 3. Commitear el cambio para que quede registrado
git commit -m "Exclude temp/source directories from tracking"

# 4. Verificar que ya no aparezcan como modificados
git status


-------------------------------------------------------------------------
Si ya hiciste el commit en local y hiciste push, en el VPS solo ejecuta:
# Pull primero (va a borrar los archivos del disco que están como "deleted")
git pull origin main

# Restaurar los archivos borrados (pero NO volver a trackearlos)
git checkout HEAD -- backend/media/blog_editor_temp/
git checkout HEAD -- backend/blogs_source/

# Ahora remover del tracking
git rm --cached -r backend/media/blog_editor_temp/
git rm --cached -r backend/blogs_source/

# Commitear
git commit -m "Stop tracking temp/source directories - keep local files"
