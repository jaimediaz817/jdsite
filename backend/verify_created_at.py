import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
import django

django.setup()

from blog.models import BlogPost

print("Total BlogPost:", BlogPost.objects.count())
print()
for p in BlogPost.objects.all()[:10]:
    diff = ""
    if p.created_at and p.publish_date:
        delta = p.created_at - p.publish_date
        if abs(delta.total_seconds()) < 1:
            diff = "(created_at == publish_date)"
        else:
            diff = f"(diff {delta})"
    print(f"  {p.title[:50]}")
    print(f"    publish_date: {p.publish_date}")
    print(f"    created_at:   {p.created_at} {diff}")
    print()
