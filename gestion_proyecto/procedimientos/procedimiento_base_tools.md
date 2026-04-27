
## favicons
https://www.favicon-generator.org/

## PROCEDIMIENTO DESPLIEGUE
cd /var/www/jdiaz.tipsterbyte.com/app

git fetch --all
git reset --hard origin/main


source env/bin/activate
pip install -r backend/requirements.txt


cd backend
python manage.py migrate


python manage.py collectstatic --noinput

sudo systemctl restart jdiaz_gunicorn.service
sudo systemctl status jdiaz_gunicorn.service --no-pager

## VERIFICAR LOGS EN TIEMPO REAL
sudo journalctl -u jdiaz_gunicorn.service -f -n 100

