from blog.models import BlogPost; p=BlogPost.objects.get(slug='2026-04-26-mejoras-ui-ux-blog-historico'); print(p.content_html) 
