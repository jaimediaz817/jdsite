from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from .services import get_reaction_counts, get_user_reactions, toggle_reaction


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip.strip()


@require_http_methods(["GET"])
def get_reactions(request, blog_slug):
    """
    Devuelve las reacciones para un blog y el estado del usuario actual.
    """
    ip = get_client_ip(request)

    response = {
        "counts": get_reaction_counts(blog_slug),
        "user_reactions": get_user_reactions(blog_slug, ip),
    }

    return JsonResponse(response)


@csrf_exempt
@require_http_methods(["POST"])
def toggle_reaction_view(request, blog_slug):
    """
    Alterna el estado de una reaccion para el usuario actual.
    """
    try:
        data = json.loads(request.body)
        reaction_type = data.get("reaction_type", "").strip()

        if not reaction_type:
            return JsonResponse({"error": "reaction_type requerido"}, status=400)

        ip = get_client_ip(request)
        is_active = toggle_reaction(blog_slug, ip, reaction_type)

        return JsonResponse(
            {
                "success": True,
                "reaction_type": reaction_type,
                "active": is_active,
                "counts": get_reaction_counts(blog_slug),
            }
        )

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalido"}, status=400)
