import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

from blog.models import Tag

count = Tag.objects.count()
print(f"Tags count: {count}")
if count > 0:
    print("Tags:", list(Tag.objects.values_list("name", flat=True)))
else:
    print("No tags found.")
