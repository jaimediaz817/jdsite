
## Se mancha el historial de commits con keys sensibles y se bloquean los push:
pip install git-filter-repo

🔥 PASO 2 — Borrar COMPLETAMENTE el archivo de TODO el historial:
git filter-repo --force --invert-paths --path procedimiento_base_repo.md
👉 Esto borra el archivo del historial entero, como si nunca hubiera existido.

PASO 3 — BORRARLO también del working directory actual (opcional, pero recomendado)
rm procedimiento_base_repo.md
git add .
git commit -m "Remove sensitive md file from working directory"

🧹 PASO 4 — Verifica que ya no exista rastro
git log -- procedimiento_base_repo.md

🚀 PASO 5 — Forzar el push con la historia limpia
git push origin main --force

🛠 PASO 6 — Sincronizar sin romper nada en tu VPS
Porque al reescribir la historia, la VPS tendrá un historial diferente.
cd /var/www/jdiaz.tipsterbyte.com/app
git fetch --all
git reset --hard origin/main

NO toca tu .env
NO toca venv/
NO toca media/
NO toca tu config de gunicorn
Solo actualiza los archivos versionados


-------------------------------------------------------
## SUB ERRORS:
 git push origin main --force
fatal: 'origin' does not appear to be a git repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.

Eso significa:
👉 El remote origin está desconectado
👉 Git no sabe a qué repo apuntar

git remote add origin https://github.com/jaimediaz817/jdsite.git
git remote -v

git push -u origin main --force

git reflog
git reset --hard HEAD@{1}