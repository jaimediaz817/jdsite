# --- VISTAS ADICIONALES (MOVIMOS HOME AQUÍ) ---
import os
from datetime import date

from core.github_utils import get_all_github_repos
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMultiAlternatives
from django.core.paginator import Paginator
from django.http import FileResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.template.loader import render_to_string
from django.views.decorators.http import require_POST

from .forms import InquiryForm
from .models import InquiryMessage, InquiryThread, Recruiter
from .utils import calculate_work_hours

# Estas variables globales se han movido aquí para mayor claridad, pero su uso
# ha sido reemplazado por el framework de `sites` de Django, que es una mejor práctica.
# Se mantienen por si se reutilizan en otros contextos.
SITE_BASE_URL = getattr(
    settings, "SITE_BASE_URL", "http://localhost:8000"
).rstrip("/")
EMAIL_SUBJECT_PREFIX = getattr(settings, "EMAIL_SUBJECT_PREFIX", "[JD] ")
DEFAULT_FROM_EMAIL = getattr(
    settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER
)
REPLY_TO_EMAIL = getattr(settings, "REPLY_TO_EMAIL", settings.EMAIL_HOST_USER)


def _abs(url_path: str) -> str:
    """
    Función de ayuda (actualmente no usada) para construir una URL absoluta
    a partir de una ruta relativa.
    """
    return f"{SITE_BASE_URL}{url_path}"


def home_view(request):
    """
    Renderiza la página de inicio (home.html).

    Calcula y pasa al contexto los años de experiencia y el total de
    horas trabajadas para mostrarlos en los contadores de la página.
    """
    start_date_career = date(2012, 1, 1)
    total_hours_worked = calculate_work_hours(start_date_career)

    today = date.today()
    experience_years = (
        today.year
        - start_date_career.year
        - (
            (today.month, today.day)
            < (start_date_career.month, start_date_career.day)
        )
    )

    grouped_repos, repos_counts = get_all_github_repos()

    context = {
        "experience_years": experience_years,
        "total_hours": f"{total_hours_worked:,}".replace(",", "."),
        "github_counts": repos_counts,
        "github_repos_grouped": grouped_repos,
    }
    return render(request, "home.html", context)


def jd_send_email_html(to, subject, template, context):
    """
    Envío HTML profesional basado en plantillas JD.
    """
    html = render_to_string(template, context)
    text = "Por favor utiliza un cliente compatible con HTML."

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to],
    )
    msg.attach_alternative(html, "text/html")
    result = msg.send()
    print(
        f"[JD][EMAIL] Enviado a {to} usando backend: {settings.EMAIL_BACKEND} (resultado: {result})"
    )

    return result


@require_POST
def api_submit_question(request):
    """
    Vista de API para gestionar el envío del formulario de contacto público.

    Recibe una petición POST desde el formulario principal.
    1. Valida los datos del formulario.
    2. Busca o crea un `Recruiter` basado en el email.
    3. Crea un nuevo `InquiryThread` y el `InquiryMessage` inicial.
    4. Envía un correo de notificación al dueño del sitio (OWNER).
    5. Envía un correo de confirmación al reclutador con un enlace de seguimiento.

    Retorna:
        JsonResponse: `ok: True` y la URL de seguimiento en caso de éxito.
                      `ok: False` y los errores en caso de fallo de validación.
    """
    print("🔵 [DEBUG] Recibiendo petición POST en api_submit_question")
    # --- OBTENER EL SITIO ACTUAL ---
    current_site = get_current_site(request)
    res_email = None
    res_exception = None
    # -------------------------------

    # --- VALIDAR FORMULARIO ---
    form = InquiryForm(request.POST)

    if form.is_valid():
        data = form.cleaned_data
        print(f"🟢 [DEBUG] Formulario válido. Datos: {data}")

        # # 1. Buscar o crear el Reclutador
        # recruiter, created = Recruiter.objects.get_or_create(
        #     email=data["email"],
        #     defaults={
        #         "name": data["name"],
        #         "company": data.get("company", ""),
        #         "phone": data.get("phone", ""),
        #     },
        # )
        # if not created and data.get("phone"):
        #     recruiter.phone = data["phone"]
        #     recruiter.save()
        #     print(
        #         f"🟡 [DEBUG] Reclutador existente actualizado con teléfono: {recruiter.phone}"
        #     )

        # --- POR ESTE BLOQUE MEJORADO ---
        recruiter, created = Recruiter.objects.update_or_create(
            email=data["email"],
            defaults={
                "name": data["name"],
                "company": data.get("company", ""),
                "phone": data.get("phone", ""),
            },
        )
        if created:
            print(f"🟢 [DEBUG] Reclutador nuevo creado: {recruiter.email}")
        else:
            print(
                f"🟡 [DEBUG] Reclutador existente actualizado: {recruiter.email}"
            )
        # --------------------------------

        # 2. Crear el Hilo (Thread)
        thread = InquiryThread.objects.create(
            recruiter=recruiter,
            meeting_date=data.get("meeting_date"),
            meeting_time=data.get("meeting_time"),
        )
        print(f"🟢 [DEBUG] Hilo creado: {thread.code}")

        # 3. Crear el Mensaje
        InquiryMessage.objects.create(
            thread=thread,
            sender=InquiryMessage.Sender.RECRUITER,
            content=data["message"],
        )

        # 4. Enviar correos (A TI Y AL RECLUTADOR)
        try:
            # --- CORREO PARA TI (OWNER) ---
            # avatar JD (como lo pide el template base)
            avatar_url = settings.JD_AVATAR_URL

            print("🔵 [DEBUG] Intentando enviar correo al OWNER...")
            # send_mail(
            #     subject=f"Nueva pregunta de {data['name']}",
            #     message=f"Mensaje: {data['message']}\nTeléfono: {data.get('phone')}\n\nResponder: {current_site.domain}/ask/admin/threads/{thread.code}/",
            #     from_email=settings.DEFAULT_FROM_EMAIL,
            #     recipient_list=[settings.OWNER_EMAIL],
            #     fail_silently=False,
            # )
            res_email = jd_send_email_html(
                to=settings.OWNER_EMAIL,
                subject=f"Nueva consulta de {recruiter.name}",
                template="emails/owner_notification.html",
                context={
                    "recruiter_name": recruiter.name,
                    "recruiter_email": recruiter.email,
                    "message": data["message"],
                    "admin_url": f"{current_site.domain}/ask/admin/threads/{thread.code}/",
                    "avatar_url": avatar_url,
                    "meeting_date": thread.meeting_date,
                    "meeting_time": thread.meeting_time,
                },
            )
            print("🟢 [DEBUG] Correo al OWNER enviado exitosamente.")

            # --- CORREO PARA EL RECLUTADOR (EL QUE FALTABA) ---
            print("🔵 [DEBUG] Intentando enviar correo al RECLUTADOR...")
            # status_url = f"{current_site.domain}/ask/t/{thread.code}/"
            # send_mail(
            #     subject="He recibido tu mensaje - Jaime Díaz",
            #     message=f"Hola {data['name']},\n\nGracias por tu mensaje. He recibido tu pregunta y te responderé tan pronto como sea posible.\n\nPuedes ver el estado y mis respuestas en el siguiente enlace:\n{status_url}\n\nSaludos,\nJaime Díaz",
            #     from_email=settings.DEFAULT_FROM_EMAIL,
            #     recipient_list=[recruiter.email],  # Usamos el email del reclutador
            #     fail_silently=False,
            # )
            res_email = jd_send_email_html(
                to=recruiter.email,
                subject="He recibido tu mensaje – Jaime Díaz",
                template="emails/recruiter_welcome.html",
                context={
                    "recruiter_name": recruiter.name,
                    "status_url": f"{current_site.domain}/ask/t/{thread.code}/",
                    "avatar_url": avatar_url,
                    "meeting_date": thread.meeting_date,
                    "meeting_time": thread.meeting_time,
                },
            )
            print("🟢 [DEBUG] Correo al RECLUTADOR enviado exitosamente.")

        except Exception as e:
            print(f"🔴 [ERROR CRÍTICO] Falló el envío de correo: {e}")
            res_exception = e

        return JsonResponse(
            {
                "ok": True,
                "success": "¡Recibido! Pronto recibirás respuesta.",
                "status_url": f"/ask/t/{thread.code}/",
                "res_email": res_email,
                "res_exception": str(res_exception),
            }
        )

    else:
        print(f"🔴 [DEBUG] Formulario inválido. Errores: {form.errors}")
        return JsonResponse({"ok": False, "errors": form.errors}, status=400)


def thread_public_view(request, code):
    """
    Muestra la página de seguimiento pública para un hilo de conversación.

    Esta vista es de solo lectura y está destinada al reclutador para que
    pueda ver el estado de su consulta y las respuestas del administrador.

    Args:
        code (str): El código único del `InquiryThread`.
    """
    thread = get_object_or_404(InquiryThread, code=code)
    return render(
        request,
        "inquiries/thread_public.html",
        {"thread": thread, "messages": thread.messages.all()},
    )


@login_required
def admin_threads(request):
    """
    Muestra la bandeja de entrada del administrador con todos los hilos.

    Requiere que el usuario esté autenticado.
    Obtiene todos los hilos de conversación, los ordena por la última
    actualización y aplica paginación.
    """
    qs = InquiryThread.objects.select_related("recruiter").order_by("-updated_at")
    threads = Paginator(qs, 12).get_page(request.GET.get("page", 1))
    return render(
        request,
        "inquiries/admin_threads.html",
        {"threads": threads},
    )


@login_required
def admin_thread_detail(request, code):
    """
    Muestra la vista de detalle (chat) de un hilo para el administrador.

    Requiere que el usuario esté autenticado.
    Si el estado del hilo es 'NEW', lo actualiza a 'READ' para indicar
    que el administrador ha visto la consulta.

    Args:
        code (str): El código único del `InquiryThread`.
    """

    thread = get_object_or_404(InquiryThread, code=code)
    if thread.status == "NEW":
        thread.status = "READ"
        thread.save(update_fields=["status"])
    return render(
        request,
        "inquiries/admin_thread_detail.html",
        {"thread": thread, "messages": thread.messages.all()},
    )


@login_required
@require_POST
def api_admin_reply(request):
    """
    Vista de API para procesar la respuesta del administrador en el chat.

    Requiere que el usuario esté autenticado.
    1. Crea un nuevo `InquiryMessage` con el contenido de la respuesta.
    2. Actualiza el estado del hilo a 'ANSWERED'.
    3. Envía un correo de notificación al reclutador con la respuesta y
       el enlace de seguimiento.

    Retorna:
        JsonResponse: `ok: True` y los datos del mensaje para actualizar
                      la interfaz de chat en tiempo real.
    """
    thread_id = request.POST.get("thread_id")
    message_text = request.POST.get("message", "").strip()

    if not thread_id or not message_text:
        return JsonResponse({"ok": False, "error": "Faltan datos"}, status=400)

    thread = get_object_or_404(
        InquiryThread.objects.select_related("recruiter"), id=thread_id
    )

    # 1. Crear tu mensaje
    msg = InquiryMessage.objects.create(
        thread=thread, sender=InquiryMessage.Sender.OWNER, content=message_text
    )

    # 2. Actualizar estado del hilo
    thread.status = InquiryThread.Status.ANSWERED
    thread.save(update_fields=["status", "updated_at"])

    # 3. ¡EL PASO QUE FALTABA! Notificar al reclutador por correo.
    try:
        print(
            f"🔵 [DEBUG] Intentando notificar respuesta al reclutador: {thread.recruiter.email}"
        )
        current_site = get_current_site(request)
        status_url = f"{current_site.domain}/ask/t/{thread.code}/"

        jd_send_email_html(
            to=thread.recruiter.email,
            subject="Nueva respuesta a tu consulta – Jaime Díaz",
            template="emails/admin_reply.html",
            context={
                "recruiter_name": thread.recruiter.name,
                "message_text": message_text,
                "status_url": status_url,
                "avatar_url": settings.JD_AVATAR_URL,  # ya definido en settings
            },
        )

        print("🟢 [DEBUG] Notificación enviada exitosamente.")
    except Exception as e:
        print(
            f"🔴 [ERROR CRÍTICO] Falló el envío de notificación de respuesta: {e}"
        )
        # Aunque el correo falle, la respuesta se guarda y se muestra en el chat.
        # El return de éxito no se ve afectado.

    # 4. Devolver respuesta al frontend para actualizar el chat en tiempo real
    return JsonResponse(
        {
            "ok": True,
            "sender": "Yo",
            "content": msg.content,
            "date": msg.created_at.strftime("%H:%M"),
        }
    )


def descargar_cv(request):
    current_site = get_current_site(request)
    site_domain = current_site.domain
    return render(request, "cv/descargando.html", {"site_domain": site_domain})


def descargar_cv_real(request):
    file_path = os.path.join(
        settings.STATIC_ROOT, "docs/Jaime_Diaz_Espaniol_2025.pdf"
    )
    return FileResponse(
        open(file_path, "rb"), as_attachment=True, filename="Jaime_Diaz_CV.pdf"
    )


def descargar_certificaciones_real(request):
    file_path = os.path.join(
        settings.STATIC_ROOT, "docs/Certificaciones_Completo_JaimeDiaz.pdf"
    )
    return FileResponse(
        open(file_path, "rb"),
        as_attachment=True,
        filename="Jaime_Diaz_Certificaciones.pdf",
    )
