

cd infra\mysql
docker compose up -d
----------------


cd ..\..     # vuelve a la raíz del repo
python -m venv .venv
source .venv/Scripts/activate
python -m pip install --upgrade pip
pip install django mysqlclient python-dotenv gunicorn

django-admin startproject jdsite backend

## NOTE: ojo con estos ya que muestran error si no se instalan antes de ejecutar la migración
pip install pymysql
pip install cryptography

cd backend
python manage.py makemigrations



- ejecutar las migraciones
python manage.py migrate


python manage.py startapp inquiries
python manage.py startapp blog


pip install holidays



app_jd_site_smtp:
xlei wajq ergl dcpb

python manage.py startapp ask


python manage.py showmigrations inquiries
python manage.py migrate inquiries zero
rm inquiries/migrations/*.py


pip install black ruff isort
# Ordena imports según Black
isort .

# Formatea a estilo Black
black .

# Lint + autofix con Ruff (I = imports, E/W varios)
ruff check . --fix


python manage.py runserver 0.0.0.0:8000
python manage.py runserver 127.0.0.1:8000


python manage.py makemigrations inquiries
python manage.py migrate

-----------------------


al agregar otra app en settings.py, podré ejecutar más migraciones:
python manage.py migrate
python manage.py migrate



SASS:
-----------------------
cd "c:\Users\Usuario Windows\Documents\JDiaz-PC-DESKTOP1\proyectos_jdiaz\marca_personal__Portafolio_JD"
npm init -y
npm i -D sass

- Estando parados en backend:
[COMANDO]:
npm run sass:watch



requriements:
pip freeze > requirements.txt



/var/www/jdiaz.tipsterbyte.com/
    app/
      ├─ .env          ← aquí
      ├─ env/          ← aquí (virtualenv)
      ├─ .gitignore
      ├─ backend/
      │    ├─ manage.py
      │    ├─ TU_PROYECTO/ (settings.py, wsgi.py)
      │    └─ ...
      └─ ...


pip freeze > requirements.txt

- AWS
ENVIAR CORREOS
pip install boto3 django-ses

# GIT
git rm -r --cached backend/inquiries/__pycache__/


## .gitignore de la vps:
node_modules/
backend/jdsite/__pycache__/
backend/inquiries/__pycache__/
backend/inquiries/migrations/__pycache__/
backend/.env
env/
env/lib/
env/bin/
.env/



## EJECUTAR GUNICRON SERVIEC:
sudo journalctl -u jdiaz_gunicorn -f --no-pager
sudo journalctl -u jdiaz_gunicorn.service -f -n 100


## REINICIAR EL SERIVICIO:
sudo systemctl restart jdiaz_gunicorn.service
sudo systemctl status jdiaz_gunicorn.service --no-pager

# en el backend instalar esto:
pip install requests



Resumen rápido+9
git push (local)
git fetch --all && git reset --hard origin/main (VPS)

source env/bin/activate

--------------------------------------------------------------------------------------------
IMPORTANTE! PARA PRODUCCION:
--------------------------------------------------------------------------------------------

# 1) Ir a la raíz del proyecto en el servidor
cd /var/www/jdiaz.tipsterbyte.com/app

# 2) Activar entorno virtual
source env/bin/activate

# 3) Asegurar dependencias
pip install -r requirements.txt

# 4) Migrar por si hay cambios pendientes
cd backend
python manage.py migrate --run-syncdb
python manage.py migrate --run-syncdb  # --run-syncdb asegura tablas de terceros

# 5) Recolectar estáticos (por si algo nuevo se haya agregado)
python manage.py collectstatic --noinput --clear

# 6) Reiniciar servicio Gunicorn
sudo systemctl restart jdiaz_gunicorn.service

sudo journalctl -u jdiaz_gunicorn.service -f
journalctl -u jdiaz_gunicorn.service

# 7) Verificar que levantó
sudo systemctl status jdiaz_gunicorn.service --no-pager
--------------------------------------------------------------------------------------------

pip install -r backend/requirements.txt

python manage.py migrate
"cd backend" + ENTER
python manage.py collectstatic --noinput
sudo systemctl restart jdiaz_gunicorn.service
¡Con esto tu VPS queda al día y funcionando con los últimos cambios!


## PARA ACTUALIZAR ALGUN SCSS:
ir al package.json para ejecutar los comandos scss (watch y compilado, un nivel arriba de backend)

-----------------------

## 📝 SISTEMA DE BLOGS MARKDOWN

✅ Comandos para activar y usar:
```bash
# ✅ Siempre desde la raiz del proyecto
source .venv/Scripts/activate
cd backend

# ✅ Primera vez (solo una vez):
python manage.py makemigrations blog
python manage.py migrate blog

# ✅ Importar blogs nuevos/modificados:
python manage.py import_blogs

# ✅ Ver listado blogs:
http://localhost:8000/blog/
```

✅ **FLUJO PARA PUBLICAR UN BLOG NUEVO:**
1.  Crear carpeta en `backend/blogs_source/YYYY-MM-DD_titulo-blog/`
2.  Crear `blog.md` y escribir contenido
3.  Pegar imágenes con `Ctrl + V` directamente en VS Code
4.  `git commit + git push`
5.  ✅ El cron en producción hace el resto automaticamente

✅ **GARANTÍAS:**
- 100% idempotente, no crea duplicados
- NUNCA sobrescribe nada sin cambios
- Se puede ejecutar las veces que quieras
- Si algo falla vuelves a ejecutar y se arregla solo











# 1. Deshabilitar los symlinks conflictivos (NO se borran los archivos)
sudo rm /etc/nginx/sites-enabled/tipsterbyte.com
sudo rm /etc/nginx/sites-enabled/test.tipsterbyte.com
sudo rm /etc/nginx/sites-enabled/jdiaz.tipsterbyte.com



sudo ln -s /etc/nginx/sites-available/tipsterbyte.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/test.tipsterbyte.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/jdiaz.tipsterbyte.com /etc/nginx/sites-enabled/
sudo systemctl reload nginx


# 2. Mantenimiento: eliminar imagenes:
### Comando para PRODUCCIÓN (VPS):

Conéctate por SSH y ejecuta:

# 1. Activar entorno virtual
cd /ruta/a/jdsite
source .venv/bin/activate

# 2. Ver qué hay antes de borrar
ls -la backend/media/blog_editor_temp/

# 3. Eliminar carpetas de IDs (15, 4, etc.)
rm -rf backend/media/blog_editor_temp/15
rm -rf backend/media/blog_editor_temp/4

# 4. Verificar que quedó limpio
ls -la backend/media/blog_editor_temp/

- o en un solo comando!:
rm -rf backend/media/blog_editor_temp/15 backend/media/blog_editor_temp/4 && echo "✅ Limpieza producción completada"


# Agregar las reglas faltantes al .gitignore existente
cat >> .gitignore << 'EOF'
backend/media/blog_editor_temp/
backend/blogs_source/
EOF

# Agregar al commit existente (sin crear nuevo commit)
git add .gitignore
git commit --amend --no-edit

# Ahora sí puedes push sin problemas
git push origin main


-----------------------------------------------------------------------------
PRODUCCION
SUPERADMIN:
jdiaz
18402120






## RESOLUCIÓN COMPLETA - Flujo + Git

### 1. Flujo de validación (tu pregunta original):

__El diagnóstico `DIAG-ERROR_SAVE_BLOG.md` YA está implementado.__ El backend devuelve `is_published` y `moderation_status` al editor, y el JavaScript los usa para mostrar el badge correcto. Las imágenes EXISTING se cargan correctamente.

### 2. Git en VPS - Solución inmediata:

En la VPS ejecuta estos comandos:
# 1. Quita blogs_source del tracking (NO borra físicamente):
git rm --cached -r backend/blogs_source/

# 2. Aplica el .gitignore actualizado:
git add .gitignore
git commit -m "chore: exclude blogs_source from git tracking"

# 3. Ahora puedes hacer pull limpio:
git pull origin main

# 4. Ejecuta el fix de posts:
python manage.py fix_pending_posts

He actualizado `.gitignore`:

backend/blogs_source/
backend/blogs_source/*/
!backend/blogs_source/.gitkeep














# 1. Ver el estado actual de .gitignore para ver el conflicto
git status

# 2. Ver el contenido con conflictos
cat .gitignore

# 3. Opción más sencilla: abortar el merge y volver a empezar limpio
git merge --abort

# 4. Ahora traer cambios remotos SIN fusión automática (solo actualizar)
git fetch origin
git rebase origin/main

# 5. Si hay conflictos en .gitignore, usar la versión del servidor (remota)
git checkout --theirs .gitignore

# 6. Marcar como resuelto
git add .gitignore

# 7. Continuar rebase
git rebase --continue

# 8. Ahora sí, crear el symlink y recargar nginx
cd /var/www/jdiaz.tipsterbyte.com/app/backend
sudo ln -s static/blogs staticfiles/blogs
sudo systemctl reload nginx

# 9. Verificar
curl -I http://localhost/static/blogs/2026-07-04_primer-articulo/jd_marca_personal_d189772f.jpg


















Estás en medio de un rebase con conflictos. Sal del rebase y aplica el fix de producción con estos comandos exactos:

```bash
# 1. Abortar el rebase
git rebase --abort

# 2. Alinear con el repositorio
git fetch origin
git reset --hard origin/main
git clean -fd

# 3. Verificar que no hay conflictos
git status
# Debe decir: "Your branch is up to date with 'origin/main'."

# 4. Crear el symlink que soluciona el problema de imágenes
cd /var/www/jdiaz.tipsterbyte.com/app/backend
sudo ln -s static/blogs staticfiles/blogs

# 5. Verificar que se creó
ls -la staticfiles/ | grep blogs
# Debe mostrar: blogs -> static/blogs

# 6. Recargar nginx
sudo systemctl reload nginx

# 7. Verificar que nginx sirve la imagen
curl -I http://localhost/static/blogs/2026-07-04_primer-articulo/jd_marca_personal_d189772f.jpg
# Debe responder: HTTP/1.1 200 OK
```

Con eso:
- El repo queda limpio, sin conflictos.
- El symlink hace que nginx encuentre las imágenes en `static/blogs/`.
- El fix frontend ya está en `origin/main` y se aplicó en la VPS.

Pega la salida del paso 3 y del paso 7 para confirmar.





venga macho! corrijamos de paso algo en producion vale? resulta que comparto un link de un blog publicado y perefcto! todo en orden! pero desde l adminsitrador en produccion elimino el blog por x motivo, cuando el link lo vuelvo a abrir me sale esto:



















# Ver qué procesos corren en los puertos del backend
sudo lsof -i :8000
sudo lsof -i :8001

# Ver el status del servicio (el más común para Gunicorn)
sudo systemctl status jdiaz_gunicorn

# Ver logs de error recientes
sudo tail -n 50 /var/log/jdiaz_gunicorn/error.log 2>/dev/null
sudo tail -n 50 /var/log/nginx/error.log | grep -i upstream

# Reiniciar el backend (¡esto suele arreglar el 502!)
sudo systemctl restart jdiaz_gunicorn












# Recrear directorio run con permisos correctos
sudo mkdir -p /var/www/jdiaz.tipsterbyte.com/app/run
sudo chown -R jdiaz:jdiaz /var/www/jdiaz.tipsterbyte.com/app/run
sudo chmod 755 /var/www/jdiaz.tipsterbyte.com/app/run

# Reiniciar Gunicorn (crea el socket jdiaz.sock automáticamente)
sudo systemctl restart jdiaz_gunicorn

# Verificar
ls -la /var/www/jdiaz.tipsterbyte.com/app/run/  # Debe mostrar jdiaz.sock
curl -I http://localhost:8000/                  # Debe mostrar HTTP/1.1 200 OK



sudo chmod 777 /var/www/jdiaz.tipsterbyte.com/app/run
sudo systemctl restart jdiaz_gunicorn
ls -la /var/www/jdiaz.tipsterbyte.com/app/run/
curl -I http://localhost:8000/ 2>/dev/null | head -1
