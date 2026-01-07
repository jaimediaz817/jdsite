

cd infra\mysql
docker compose up -d
----------------


cd ..\..     # vuelve a la raíz del repo
python -m venv .venv
source .venv/Scripts/activate
python -m pip install --upgrade pip
pip install django mysqlclient python-dotenv gunicorn

django-admin startproject jdsite backend

pip install pymysql

cd backend
python manage.py makemigrations

pip install cryptography

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



Resumen rápido
git push (local)
git fetch --all && git reset --hard origin/main (VPS)

source env/bin/activate
pip install -r backend/requirements.txt

python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart jdiaz_gunicorn.service
¡Con esto tu VPS queda al día y funcionando con los últimos cambios!