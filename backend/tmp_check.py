import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

from blog.models import BlogPost

for post in BlogPost.objects.all():
    print(f"slug: {post.slug} | title: {post.title}")
