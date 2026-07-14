#!/bin/bash
# verificar-estado-permisos.sh
# Verifica qué permisos están aplicados y cuáles faltan en producción

APP_DIR="/var/www/jdiaz.tipsterbyte.com/app"
ERRORES=0

echo "=== VERIFICACIÓN DE ESTADO DE PERMISOS ==="
echo "Directorio: $APP_DIR"
echo

# Función para verificar
verificar() {
    local desc="$1"
    local cmd="$2"
    local esperado="$3"
    
    echo -n "▸ $desc ... "
    if eval "$cmd" >/dev/null 2>&1; then
        echo "✓ OK"
    else
        echo "✗ FALTA"
        ERRORES=$((ERRORES + 1))
    fi
}

echo "1) PROPIEDAD DE CARPETAS PRINCIPALES"
echo "--------------------------------------"
verificar "blogs_source es www-data:www-data" \
    "test \$(stat -c '%U:%G' $APP_DIR/backend/blogs_source) = 'www-data:www-data'" \
    "www-data:www-data"

verificar "static es www-data:www-data" \
    "test \$(stat -c '%U:%G' $APP_DIR/backend/static) = 'www-data:www-data'" \
    "www-data:www-data"

verificar "media es www-data:www-data" \
    "test \$(stat -c '%U:%G' $APP_DIR/backend/media) = 'www-data:www-data'" \
    "www-data:www-data"

verificar "staticfiles es www-data:www-data" \
    "test \$(stat -c '%U:%G' $APP_DIR/backend/staticfiles) = 'www-data:www-data'" \
    "www-data:www-data"

echo
echo "2) PERMISOS DE DIRECTORIOS (setgid 2775)"
echo "------------------------------------------"
verificar "blogs_source tiene setgid" \
    "test \$(stat -c '%a' $APP_DIR/backend/blogs_source | cut -c2) = '7'" \
    "7"

verificar "staticfiles tiene setgid" \
    "test \$(stat -c '%a' $APP_DIR/backend/staticfiles | cut -c2) = '7'" \
    "7"

echo
echo "3) SYMLINK STATICFILES/BLOGS"
echo "-----------------------------"
verificar "staticfiles/blogs existe y es symlink" \
    "test -L $APP_DIR/backend/staticfiles/blogs" \
    "symlink"

verificar "staticfiles/blogs apunta a ../static/blogs" \
    "test \$(readlink $APP_DIR/backend/staticfiles/blogs) = '../static/blogs'" \
    "../static/blogs"

echo
echo "4) ESCRITURA COMO WWW-DATA"
echo "----------------------------"
verificar "www-data puede escribir en blogs_source" \
    "sudo -u www-data touch $APP_DIR/backend/blogs_source/.perm_test 2>/dev/null && rm -f $APP_DIR/backend/blogs_source/.perm_test" \
    "escribible"

verificar "www-data puede escribir en staticfiles" \
    "sudo -u www-data touch $APP_DIR/backend/staticfiles/.perm_test 2>/dev/null && rm -f $APP_DIR/backend/staticfiles/.perm_test" \
    "escribible"

echo
echo "5) ARCHIVOS EN STATICFILES"
echo "----------------------------"
if [ -f "$APP_DIR/backend/staticfiles/procedimiento.md" ]; then
    echo "→ procedimiento.md existe (archivo de ejemplo)"
    verificar "  es owned por www-data" \
        "test \$(stat -c '%U:%G' $APP_DIR/backend/staticfiles/procedimiento.md) = 'www-data:www-data'" \
        "www-data:www-data"
else
    echo "→ procedimiento.md no existe (normal si nunca se ejecutó collectstatic)"
fi

echo
echo "=== RESUMEN ==="
if [ $ERRORES -eq 0 ]; then
    echo "✓ Todo está correcto"
    echo
    echo "Próximos pasos:"
    echo "1. Ejecutá collectstatic:"
    echo "   cd $APP_DIR/backend && sudo -u www-data env/bin/python manage.py collectstatic --noinput --clear"
    echo "2. Ejecutá import_blogs:"
    echo "   cd $APP_DIR/backend && source env/bin/activate && python manage.py import_blogs 2>&1"
else
    echo "✗ Faltan $ERRORES correcciones"
    echo
    echo "Ejecutá el script fix-prod-permissions.sh:"
    echo "   sudo bash $APP_DIR/fix-prod-permissions.sh"
fi