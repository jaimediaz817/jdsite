from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from .services import (
    get_reaction_counts,
    get_user_reactions,
    toggle_reaction,
    get_comment_reaction_counts,
    get_user_comment_reactions,
    toggle_comment_reaction,
)


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


@csrf_exempt
@require_http_methods(["POST"])
def toggle_comment_reaction_view(request, comment_id):
    """
    Alterna el estado de una reaccion en un comentario para el usuario actual.
    """
    try:
        data = json.loads(request.body)
        reaction_type = data.get("reaction_type", "").strip()

        if not reaction_type:
            return JsonResponse({"error": "reaction_type requerido"}, status=400)

        ip = get_client_ip(request)
        is_active = toggle_comment_reaction(comment_id, ip, reaction_type)

        return JsonResponse(
            {
                "success": True,
                "reaction_type": reaction_type,
                "active": is_active,
                "counts": get_comment_reaction_counts(comment_id),
            }
        )

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalido"}, status=400)


@require_http_methods(["GET"])
def get_comment_reactions(request, comment_id):
    """
    Devuelve las reacciones para un comentario y el estado del usuario actual.
    """
    ip = get_client_ip(request)

    response = {
        "counts": get_comment_reaction_counts(comment_id),
        "user_reactions": get_user_comment_reactions(comment_id, ip),
    }

    return JsonResponse(response)
