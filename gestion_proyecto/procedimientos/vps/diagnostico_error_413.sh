#!/bin/bash
# HU-042: Diagnóstico error 413 Request Entity Too Large
# Ejecutar en la VPS para verificar configuración

echo "=== 1) Verificar client_max_body_size en nginx ==="
grep -n "client_max_body_size" /etc/nginx/sites-enabled/jaimediaz.dev.conf || echo "NO_ENCONTRADO"

echo ""
echo "=== 2) Verificar logs de acceso recientes (buscar 413) ==="
tail -n 100 /var/log/nginx/access.log | grep "413"

echo ""
echo "=== 3) Verificar logs de error de nginx ==="
tail -n 50 /var/log/nginx/error.log

echo ""
echo "=== 4) Verificar límite de Django ==="
grep -n "DATA_UPLOAD_MAX_MEMORY_SIZE" /var/www/jdiaz.tipsterbyte.com/app/backend/jdsite/settings.py || echo "NO_ENCONTRADO"

echo ""
echo "=== 5) Verificar límite en .env ==="
grep "MAX_UPLOAD_SIZE_MB" /var/www/jdiaz.tipsterbyte.com/app/backend/.env || echo "NO_ENCONTRADO"

echo ""
echo "=== 6) Estado del servicio nginx ==="
systemctl status nginx | head -n 15

echo ""
echo "=== FIN DEL DIAGNÓSTICO ==="