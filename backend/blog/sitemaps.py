from django.contrib.sitemaps import Sitemap
from blog.models import BlogPost
from datetime import timedelta
from django.utils import timezone


class BlogPostSitemap(Sitemap):
    changefreq = "weekly"

    def items(self):
        return BlogPost.objects.filter(is_published=True).order_by(
            "-publish_date"
        )

    def lastmod(self, obj):
        return obj.last_modified

    def priority(self, obj):
        """
        Prioridad dinamica segun antiguedad del articulo:
        - Menos de 7 dias: 0.9
        - Entre 7 y 30 dias: 0.85
        - Mayor a 30 dias: 0.8
        - Mayor a 6 meses: 0.7
        """
        ahora = timezone.now()
        edad = ahora - obj.publish_date

        if edad < timedelta(days=7):
            return 0.9
        elif edad < timedelta(days=30):
            return 0.85
        elif edad < timedelta(days=180):
            return 0.8
        else:
            return 0.7
