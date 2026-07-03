import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
os.chdir(os.path.dirname(__file__))
django.setup()

from core.models import UserProfile

print(f"{'Username':20s} | {'Registration Source':20s}")
print("-" * 45)
for p in UserProfile.objects.all():
    print(f"{p.user.username:20s} | {p.registration_source:20s}")
