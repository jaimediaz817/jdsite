import secrets
import string

from django.db import models
from django.utils import timezone


# 1. Definimos la función generadora FUERA de las clases
def jd_generate_code():
    n = 8
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))


class Recruiter(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=40, blank=True)
    company = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.name} ({self.company})"


class InquiryThread(models.Model):
    class Status(models.TextChoices):
        NEW = "NEW", "Nueva"
        READ = "READ", "Leída"
        ANSWERED = "ANSWERED", "Respondida"

    # 2. Usamos la función SIN paréntesis y SIN lambda
    code = models.CharField(max_length=12, default=jd_generate_code, unique=True)

    recruiter = models.ForeignKey(
        Recruiter, on_delete=models.CASCADE, related_name="threads"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)

    # --- NUEVOS CAMPOS ---
    meeting_date = models.DateField(null=True, blank=True)
    meeting_time = models.TimeField(null=True, blank=True)
    # ---------------------

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Hilo {self.code} - {self.recruiter.name}"


class InquiryMessage(models.Model):
    class Sender(models.TextChoices):
        RECRUITER = "RECRUITER", "Reclutador"
        OWNER = "OWNER", "Jaime (Dueño)"

    thread = models.ForeignKey(
        InquiryThread, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.CharField(max_length=20, choices=Sender.choices)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mensaje de {self.sender} en {self.thread.code}"
