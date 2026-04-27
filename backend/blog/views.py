from django.shortcuts import render, get_object_or_404
from django.views.generic import ListView, DetailView
from blog.models import BlogPost


class BlogListView(ListView):
    model = BlogPost
    template_name = "blog/blog_list.html"
    context_object_name = "posts"
    paginate_by = 10
    queryset = BlogPost.objects.filter(is_published=True).order_by(
        "-publish_date"
    )


class BlogDetailView(DetailView):
    model = BlogPost
    template_name = "blog/blog_detail.html"
    context_object_name = "post"
    slug_field = "slug"
