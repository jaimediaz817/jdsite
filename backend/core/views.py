from django.http import JsonResponse

# Importamos la función correcta
from .github_utils import get_all_github_repos


def github_repos_api(request):
    """Endpoint para devolver los repositorios AGRUPADOS de GitHub."""

    # NOTA: Asegúrate de que tu función se llama get_all_github_repos en el import
    # Si la llamaste get_github_repos, renómbrala a get_all_github_repos en github_utils.py

    # Llamada a la función de doble cuenta
    grouped_repos, repos_counts = get_all_github_repos()

    # Devuelve la respuesta JSON con la nueva estructura
    return JsonResponse(
        {
            "success": True,
            "projects_grouped": grouped_repos,
            "total_counts": repos_counts,
        }
    )
