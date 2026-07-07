# 🔴 PROCEDIMIENTO DE EMERGENCIA — VPS Producción
## Fecha: 2026-07-05

---

## ⚠️ Problema #1: Permission Denied al guardar artículos

**Error:**
```
PermissionError: [Errno 13] Permission denied: 
'/var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/test_blog/blog.md'
```

### 🔍 Diagnóstico — Ejecutar en VPS (en orden):

```bash
# 1.1 - Qué usuario ejecuta gunicorn
ps aux | grep gunicorn | grep -v grep

# 1.2 - Propietario actual de blogs_source/
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/

# 1.3 - Propietario del archivo específico que falla
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/test_blog/

# 1.4 - Propietario raíz del proyecto
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/
```

### ✅ Solución:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend

# Dar permisos al usuario de gunicorn (generalmente www-data)
sudo chown -R www-data:www-data blogs_source/
sudo chmod -R u+rwX blogs_source/

# También asegurar static/blogs/ para las imágenes
sudo chown -R www-data:www-data static/blogs/
sudo chmod -R u+rwX static/blogs/

# Asegurar media/ también
sudo chown -R www-data:www-data media/
sudo chmod -R u+rwX media/
```

---

## ⚠️ Problema #2: 413 Request Entity Too Large

**Error nginx al subir imágenes:**
```
413 Request Entity Too Large
```

### 🔍 Diagnóstico:

```bash
# 2.1 - Buscar configuración actual de client_max_body_size
sudo grep -r "client_max_body_size" /etc/nginx/

# 2.2 - Ver configuración del sitio
sudo cat /etc/nginx/sites-available/jaimediaz.dev.conf

# 2.3 - Ver logs de nginx
sudo tail -50 /var/log/nginx/error.log
```

### ✅ Solución:

Editar el archivo de configuración de nginx:
```bash
sudo nano /etc/nginx/sites-available/jaimediaz.dev.conf
```

Agregar **dentro del bloque `server { }`** (o donde ya exista):
```nginx
client_max_body_size 20M;
```

Luego:
```bash
# Verificar sintaxis
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

---

## ✅ Verificación post-fix

```bash
# Verificar que nginx sirve archivos
curl -I http://localhost/static/blogs/

# Ver logs de Django
sudo journalctl -u jdiaz_gunicorn --no-pager -n 30

# Probar subida de imagen
curl -I http://localhost/static/blogs/
























echo "=== 1. USUARIO GUNICORN ==="
ps aux | grep gunicorn | grep -v grep
salida:
ps aux | grep gunicorn | grep -v grep
=== 1. USUARIO GUNICORN ===
www-data 2025206  0.0  1.1  34276 24064 ?        Ss   Jul05   0:08 /var/www/jdiaz.tipsterbyte.com/app/env/bin/python3 /var/www/jdiaz.tipsterbyte.com/app/env/bin/gunicorn --workers 3 --bind unix:/var/www/jdiaz.tipsterbyte.com/app/run/jdiaz.sock jdsite.wsgi:application
www-data 2025207  0.0  4.0  97148 80732 ?        S    Jul05   0:10 /var/www/jdiaz.tipsterbyte.com/app/env/bin/python3 /var/www/jdiaz.tipsterbyte.com/app/env/bin/gunicorn --workers 3 --bind unix:/var/www/jdiaz.tipsterbyte.com/app/run/jdiaz.sock jdsite.wsgi:application
www-data 2025208  0.0  4.1 100184 84384 ?        S    Jul05   0:10 /var/www/jdiaz.tipsterbyte.com/app/env/bin/python3 /var/www/jdiaz.tipsterbyte.com/app/env/bin/gunicorn --workers 3 --bind unix:/var/www/jdiaz.tipsterbyte.com/app/run/jdiaz.sock jdsite.wsgi:application
www-data 2025209  0.0  3.9  95648 80104 ?        S    Jul05   0:09 /var/www/jdiaz.tipsterbyte.com/app/env/bin/python3 /var/www/jdiaz.tipsterbyte.com/app/env/bin/gunicorn --workers 3 --bind unix:/var/www/jdiaz.tipsterbyte.com/app/run/jdiaz.sock jdsite.wsgi:application


echo "=== 2. PROPIETARIO blogs_source/ ==="
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/ | head -10
salida:
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/ | head -10
=== 2. PROPIETARIO blogs_source/ ===
total 40
drwxrwxrwx 10 www-data www-data 4096 Jul  5 16:33 .
drwxrwxr-x 15 jdiaz    jdiaz    4096 Jul  5 07:13 ..
drwxrwxr-x  2 jdiaz    jdiaz    4096 Jul  5 06:02 2026-04-26_mejoras_ui_ux_blog_historico
drwxrwxr-x  2 jdiaz    jdiaz    4096 Jul  5 06:02 2026-04-26_mejoras_ui_ux_blog_historico_manualmente-05
drwxrwxr-x  2 jdiaz    jdiaz    4096 Jul  5 06:02 2026-06-05_las-mejoras-de-uiux-que-hicieron-que-la-gente-se-quedara-un-
drwxrwxr-x  2 jdiaz    jdiaz    4096 Jul  5 06:02 2026-06-06_mi-nuevo-articulo
drwxrwxr-x  2 jdiaz    jdiaz    4096 Jul  5 06:02 2026-07-03_test
drwxr-xr-x  2 www-data www-data 4096 Jul  5 04:02 2026-07-04_primer-articulo
drwxr-xr-x  2 www-data www-data 4096 Jul  5 16:33 2026-07-05_mi-otro-articulo

echo "=== 3. PROPIETARIO test_blog/ ==="
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/test_blog/
salida:
echo "=== 3. PROPIETARIO test_blog/ ==="
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/test_blog/
=== 3. PROPIETARIO test_blog/ ===
total 16548
drwxrwxr-x  2 jdiaz    jdiaz       4096 Jul  5 06:02 .
drwxrwxrwx 10 www-data www-data    4096 Jul  5 16:33 ..
-rw-rw-r--  1 jdiaz    jdiaz       5451 Jul  5 06:02 blog.md
-rw-rw-r--  1 jdiaz    jdiaz     305367 Jul  5 06:02 captura_de_pantalla_1_9dfcfc86.png
-rw-rw-r--  1 jdiaz    jdiaz       9879 Jul  5 06:02 captura_de_pantalla_2025-10-27_174411_04863797.png
-rw-rw-r--  1 jdiaz    jdiaz       9879 Jul  5 06:02 captura_de_pantalla_2025-10-27_174411_1323be1b.png
-rw-rw-r--  1 jdiaz    jdiaz       9879 Jul  5 06:02 captura_de_pantalla_2025-10-27_174411_d78778fe.png
-rw-rw-r--  1 jdiaz    jdiaz      33858 Jul  5 06:02 captura_de_pantalla_2025-11-06_154128.png
-rw-rw-r--  1 jdiaz    jdiaz     320318 Jul  5 06:02 captura_de_pantalla_2025-11-10_164914_f7459d25.png
-rw-rw-r--  1 jdiaz    jdiaz      12581 Jul  5 06:02 captura_de_pantalla_2025-11-12_155136_f84cc7b2.png
-rw-rw-r--  1 jdiaz    jdiaz    1852255 Jul  5 06:02 captura_de_pantalla_2_20aaf632.png
-rw-rw-r--  1 jdiaz    jdiaz    5826305 Jul  5 06:02 img_20260425_165015_923e34bc.jpg
-rw-rw-r--  1 jdiaz    jdiaz    9055084 Jul  5 06:02 img_20260501_181947_474178e1.jpg

echo "=== 4. PROPIETARIO RAÍZ ==="
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/ | head -10
salida:
echo "=== 4. PROPIETARIO RAÍZ ==="
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/ | head -10
=== 4. PROPIETARIO RAÍZ ===
total 384
drwxrwxr-x 15 jdiaz    jdiaz      4096 Jul  5 07:13 .
drwxrwxr-x 15 jdiaz    jdiaz      4096 Jul  5 07:22 ..
-rw-r--r--  1 jdiaz    jdiaz      2971 Jul  4 20:15 .env
-rw-rw-r--  1 jdiaz    jdiaz         5 Jul  5 07:13 .gitignore
drwxrwxr-x  3 jdiaz    jdiaz      4096 Jul  1 00:27 .venv
-rw-rw-r--  1 jdiaz    jdiaz       967 Jul  1 00:27 =0.50.0
-rw-rw-r--  1 jdiaz    jdiaz        94 Jul  1 00:27 __init__.py
-rw-rw-r--  1 jdiaz    jdiaz        81 Jul  1 00:27 append_moderation.py
drwxrwxr-x  3 jdiaz    jdiaz      4096 Nov 25  2025 ask

echo "=== 5. client_max_body_size ACTUAL ==="
sudo grep -r "client_max_body_size" /etc/nginx/
salida:
echo "=== 5. client_max_body_size ACTUAL ==="
sudo grep -r "client_max_body_size" /etc/nginx/
=== 5. client_max_body_size ACTUAL ===
[sudo] password for jdiaz:
/etc/nginx/snippets/dos-protection.conf:client_max_body_size 3m;

echo "=== 6. CONFIG NGINX ==="
sudo cat /etc/nginx/sites-available/jaimediaz.dev.conf
salidas:
#1:
sudo cat /etc/nginx/sites-available/jdiaz.tipsterbyte.com
# Redirección de jdiaz.tipsterbyte.com --> jaimediaz.dev

# HTTP: redirige SIEMPRE al nuevo dominio en HTTPS
server {
    listen 80;
    listen [::]:80;

    server_name jdiaz.tipsterbyte.com;

    # Redirección 301 permanente preservando ruta + query (?foo=bar)
    return 301 https://jaimediaz.dev$request_uri;
}

# HTTPS: también redirige al nuevo dominio
server {
    listen 443 ssl;
    listen [::]:443 ssl ipv6only=on;

    server_name jdiaz.tipsterbyte.com;

    # Reutilizamos el certificado que ya tenías emitido
    ssl_certificate     /etc/letsencrypt/live/jdiaz.tipsterbyte.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jdiaz.tipsterbyte.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Opcional: puedes seguir aplicando headers
    include snippets/security-headers.conf;

    # Redirección 301 permanente preservando ruta + query
    return 301 https://jaimediaz.dev$request_uri;
}

#2:
##
# You should look at the following URL's in order to grasp a solid understanding
# of Nginx configuration files in order to fully unleash the power of Nginx.
# https://www.nginx.com/resources/wiki/start/
# https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/
# https://wiki.debian.org/Nginx/DirectoryStructure
#
# In most cases, administrators will remove this file from sites-enabled/ and
# leave it as reference inside of sites-available where it will continue to be
# updated by the nginx packaging team.
#
# This file will automatically load configuration files provided by other
# applications, such as Drupal or Wordpress. These applications will be made
# available underneath a path with that package name, such as /drupal8.
#
# Please see /usr/share/doc/nginx-doc/examples/ for more detailed examples.
##

# Default server configuration
#
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    return 301 http://tipsterbyte.com;
    # return 301 http://www.tipsterbyte.com;
}

server {

        # SSL configuration
        #
        # listen 443 ssl default_server;
        # listen [::]:443 ssl default_server;
        #
        # Note: You should disable gzip for SSL traffic.
        # See: https://bugs.debian.org/773332
        #
        # Read up on ssl_ciphers to ensure a secure configuration.
        # See: https://bugs.debian.org/765782
        #
        # Self signed certs generated by the ssl-cert package
        # Don't use them in a production server!
        #
        # include snippets/snakeoil.conf;
        # TODO: add - DESCOMENTAR!
        include snippets/security-headers.conf;

        root /var/www/tipsterbyte.com;

        # Add index.php to the list if you are using PHP
        index index.html;
        # index.htm index.nginx-debian.html;

        server_name tipsterbyte.com;

        location / {
                # First attempt to serve request as file, then
                # as directory, then fall back to displaying a 404.
                try_files $uri $uri/ =404;
        }

        # pass PHP scripts to FastCGI server
        #
        #location ~ \.php$ {
        #       include snippets/fastcgi-php.conf;
        #
        #       # With php-fpm (or other unix sockets):
        #       fastcgi_pass unix:/run/php/php7.4-fpm.sock;
        #       # With php-cgi (or other tcp sockets):
        #       fastcgi_pass 127.0.0.1:9000;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        # TODO: add - seguridad .HTTACCESS
        location ~ /\.ht {
                deny all;
        }

        # TODO: add - seguridad para git
        location ~ /\.git {
                deny all;
        }

    listen 443 ssl; # managed by Certbot
    listen [::]:443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/tipsterbyte.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/tipsterbyte.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}


# Virtual Host configuration for example.com
#
# You can move that to a different file under sites-available/ and symlink that
# to sites-enabled/ to enable it.
#
#server {
#       listen 80;
#       listen [::]:80;
#
#       server_name example.com;
#
#       root /var/www/example.com;
#       index index.html;
#
#       location / {
#               try_files $uri $uri/ =404;
#       }
#}

server {
    server_name www.tipsterbyte.com; # managed by Certbot
    return 301 http://tipsterbyte.com;
    # return 301 http://www.tipsterbyte.com;


    listen 443 ssl; # managed by Certbot
    listen [::]:443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/tipsterbyte.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/tipsterbyte.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}

server {
    if ($host = tipsterbyte.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


        listen 80;
        listen [::]:80;

        server_name tipsterbyte.com;
    return 404; # managed by Certbot


}
server {
    if ($host = www.tipsterbyte.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80 ;
    listen [::]:80 ;
    server_name www.tipsterbyte.com;
    return 404; # managed by Certbot

echo "=== 7. LOGS ERROR NGINX (últimas 20 líneas) ==="
sudo tail -20 /var/log/nginx/error.log
salida:
=== 7. LOGS ERROR NGINX (últimas 20 líneas) ===
2026/07/06 03:40:04 [error] 2002105#2002105: *94593 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/2026-07-03_test/jd-imagen-office-v2_13afaed0.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/2026-07-03_test/jd-imagen-office-v2_13afaed0.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/"
2026/07/06 03:40:04 [error] 2002105#2002105: *94581 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/2026-07-05_mi-otro-articulo/img-20260704-wa0001_85117911.jpg" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/2026-07-05_mi-otro-articulo/img-20260704-wa0001_85117911.jpg HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/"
2026/07/06 03:40:05 [error] 2002105#2002105: *94595 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/img_20260501_181947_474178e1.jpg" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/img_20260501_181947_474178e1.jpg HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/"
2026/07/06 03:40:05 [error] 2002105#2002105: *94596 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/2026-04-26_mejoras_ui_ux_blog_historico_manualmente-05/Captura de pantalla 2025-11-06 155517_b4c67ebe.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/2026-04-26_mejoras_ui_ux_blog_historico_manualmente-05/Captura%20de%20pantalla%202025-11-06%20155517_b4c67ebe.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/"
2026/07/06 03:40:05 [error] 2002105#2002105: *94598 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/2026-04-26_mejoras_ui_ux_blog_historico/image-2.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/2026-04-26_mejoras_ui_ux_blog_historico/image-2.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/"
2026/07/06 03:40:05 [error] 2002105#2002105: *94593 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/2026-06-06_mi-nuevo-articulo/image-1.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/2026-06-06_mi-nuevo-articulo/image-1.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/"
2026/07/06 03:40:12 [error] 2002105#2002105: *94599 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/css/bs/bootstrap.min.css.map" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/css/bs/bootstrap.min.css.map HTTP/1.1", host: "jaimediaz.dev"
2026/07/06 03:40:17 [error] 2002105#2002105: *94593 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/css/bs/bootstrap.min.css.map" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/css/bs/bootstrap.min.css.map HTTP/1.1", host: "jaimediaz.dev"
2026/07/06 03:40:17 [error] 2002105#2002105: *94599 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/js/bs/bootstrap.min.js.map" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/js/bs/bootstrap.min.js.map HTTP/1.1", host: "jaimediaz.dev"
2026/07/06 03:40:18 [error] 2002105#2002105: *94596 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/captura_de_pantalla_1_9dfcfc86.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/captura_de_pantalla_1_9dfcfc86.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:40:18 [error] 2002105#2002105: *94595 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/captura_de_pantalla_2025-11-12_155136_f84cc7b2.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/captura_de_pantalla_2025-11-12_155136_f84cc7b2.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:40:18 [error] 2002105#2002105: *94593 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/captura_de_pantalla_2025-11-10_164914_f7459d25.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/captura_de_pantalla_2025-11-10_164914_f7459d25.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:40:18 [error] 2002105#2002105: *94598 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/img_20260425_165015_923e34bc.jpg" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/img_20260425_165015_923e34bc.jpg HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:40:18 [error] 2002105#2002105: *94599 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/captura_de_pantalla_2025-10-27_174411_04863797.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/captura_de_pantalla_2025-10-27_174411_04863797.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:40:18 [error] 2002105#2002105: *94581 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/img_20260501_181947_474178e1.jpg" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/img_20260501_181947_474178e1.jpg HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:40:18 [error] 2002105#2002105: *94596 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/captura_de_pantalla_2025-11-06_154128.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/captura_de_pantalla_2025-11-06_154128.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:40:18 [error] 2002105#2002105: *94595 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/captura_de_pantalla_2025-10-27_174411_d78778fe.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/captura_de_pantalla_2025-10-27_174411_d78778fe.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:40:18 [error] 2002105#2002105: *94593 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/captura_de_pantalla_2025-10-27_174411_1323be1b.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/captura_de_pantalla_2025-10-27_174411_1323be1b.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:40:18 [error] 2002105#2002105: *94598 open() "/var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/blogs/test_blog/captura_de_pantalla_2_20aaf632.png" failed (2: No such file or directory), client: 191.92.136.167, server: jaimediaz.dev, request: "GET /static/blogs/test_blog/captura_de_pantalla_2_20aaf632.png HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"
2026/07/06 03:42:33 [error] 2002105#2002105: *94632 client intended to send too large body: 5682798 bytes, client: 191.92.136.167, server: jaimediaz.dev, request: "POST /blog/api/upload-file/ HTTP/1.1", host: "jaimediaz.dev", referrer: "https://jaimediaz.dev/blog/editor/test_blog/"

echo "=== 8. LOGS DJANGO (últimas 20 líneas) ==="
sudo journalctl -u jdiaz_gunicorn --no-pager -n 20
salida:
 echo "=== 8. LOGS DJANGO (últimas 20 líneas) ==="
sudo journalctl -u jdiaz_gunicorn --no-pager -n 20
=== 8. LOGS DJANGO (últimas 20 líneas) ===
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]: Traceback (most recent call last):
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]:   File "/var/www/jdiaz.tipsterbyte.com/app/backend/blog/services.py", line 1003, in delete_resource_file
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]:     source_md_path.write_text(md_updated, encoding="utf-8")
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]:   File "/usr/lib/python3.12/pathlib.py", line 1049, in write_text
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]:     with self.open(mode='w', encoding=encoding, errors=errors, newline=newline) as f:
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]:          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]:   File "/usr/lib/python3.12/pathlib.py", line 1015, in open
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]:     return io.open(self, mode, buffering, encoding, errors, newline)
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]:            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Jul 06 03:40:54 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025207]: PermissionError: [Errno 13] Permission denied: '/var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/test_blog/blog.md'
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [INFO] [CSRF_DIAGNOSTIC] POST a /blog/api/save-blog/
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [INFO] [CSRF_DIAGNOSTIC] CSRF cookie: HKs9z3qIKXBxhVGWF8rn
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [INFO] [CSRF_DIAGNOSTIC] CSRF token form: NOT_FOUND
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [INFO] [CSRF_DIAGNOSTIC] CSRF header X-CSRFToken: HKs9z3qIKXBxhVGWF8rn
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [INFO] [CSRF_DIAGNOSTIC] Referer: https://jaimediaz.dev/blog/editor/test_blog/
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [INFO] [CSRF_DIAGNOSTIC] Origin: https://jaimediaz.dev
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [INFO] [CSRF_DIAGNOSTIC] Host: jaimediaz.dev
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [INFO] [CSRF_DIAGNOSTIC] DJANGO_ENV: production
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [INFO] [CSRF_DIAGNOSTIC] Origin trusted: True
Jul 06 03:40:55 ubuntu-s-1vcpu-2gb-sfo3-01 gunicorn[2025208]: [ERROR] Internal Server Error: /blog/api/save-blog/

echo "=== 9. SYMLINK ACTUAL ==="
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/ | grep blogs
salida:
echo "=== 9. SYMLINK ACTUAL ==="
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/staticfiles/ | grep blogs
=== 9. SYMLINK ACTUAL ===
drwxrwxr-x  9 jdiaz jdiaz 4096 Jul  5 06:46 blogs