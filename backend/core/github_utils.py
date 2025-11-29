# core/github_utils.py

from typing import Any, Dict, List, Tuple

import requests
from django.conf import settings


# ----------------------------------------------------
# 1. Función Interna (Usa las variables correctas del loop)
# ----------------------------------------------------
def _fetch_repos_for_user(
    username: str, pat: str, owner_tag: str
) -> List[Dict[str, Any]]:
    """Obtiene y filtra los repositorios de UN usuario específico."""

    # Aquí ya no usamos settings.GITHUB_USERNAME, usamos los argumentos 'username' y 'pat'
    if not username or not pat:
        print(f"🔴 [ERROR GITHUB] Credenciales NO ENCONTRADAS para: {owner_tag}")
        return []

    API_URL = f"https://api.github.com/users/{username}/repos"

    headers = {
        "Authorization": f"token {pat}",
        "Accept": "application/vnd.github.v3+json",
    }

    params = {
        "type": "owner",
        "sort": "updated",
        "direction": "desc",
        "per_page": 100,
    }

    try:
        response = requests.get(API_URL, headers=headers, params=params)
        response.raise_for_status()
        repos = response.json()
        print(
            f"🟢 [INFO GITHUB] '{owner_tag}' recibió {len(repos)} repositorios. Filtrando..."
        )

        # 🚨 IMPRIMIR LA DATA CRUDA DEL PRIMER REPOSITORIO
        if repos:
            print(
                f"DEBUG: Primer repo: name={repos[0].get('name')}, fork={repos[0].get('fork')}, private={repos[0].get('private')}, visibility={repos[0].get('visibility')}"
            )

    except requests.exceptions.HTTPError as e:
        print(
            f"❌ [FALLO GITHUB HTTP] Usuario '{username}' falló con Código: {response.status_code}"
        )
        return []
    except requests.exceptions.RequestException as e:
        print(f"❌ [FALLO GITHUB CONEXIÓN] No se pudo conectar a GitHub: {e}")
        return []

    # Filtrado
    filtered_repos = []
    for repo in repos:
        # if not repo.get("fork") and repo.get("public"):
        filtered_repos.append(
            {
                "name": repo["name"],
                "html_url": repo["html_url"],
                "description": repo["description"] or "Sin descripción.",
                "language": repo["language"],
                "stars": repo["stargazers_count"],
                "updated_at": repo["updated_at"],
                "owner_tag": owner_tag,  # Etiqueta para el frontend
            }
        )

    print(
        f"✅ [INFO GITHUB] '{owner_tag}' devolverá {len(filtered_repos)} repositorios después de filtrar."
    )
    return filtered_repos


# ----------------------------------------------------
# 2. Función Externa (Itera sobre settings.GITHUB_ACCOUNTS)
# ----------------------------------------------------
def get_all_github_repos() -> (
    Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, int]]
):
    """
    Obtiene repositorios de todas las cuentas definidas en settings.py y agrupa resultados.
    """

    grouped_repos = {}
    repos_counts = {}

    # ESTO USA LA LISTA GITHUB_ACCOUNTS DEFINIDA EN settings.py
    for account in settings.GITHUB_ACCOUNTS:
        owner_tag = account["owner"]
        # 💡 EXTRAEMOS el nombre de usuario para usarlo como KEY
        username = account["username"]

        repos = _fetch_repos_for_user(
            username=account["username"], pat=account["pat"], owner_tag=owner_tag
        )

        # 🔑 CAMBIO CLAVE: Usamos el username como llave en lugar de owner_tag
        grouped_repos[username] = repos
        repos_counts[username] = len(repos)

    # Retorna el diccionario agrupado y el diccionario de conteos por cuenta
    return grouped_repos, repos_counts
