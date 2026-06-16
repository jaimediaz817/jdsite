from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Atom1Feed
from blog.models import BlogPost


class BlogRSSFeed(Feed):
    title = "Jaime Díaz - Blog"
    link = "/blog/"
    description = (
        "Artículos sobre desarrollo fullstack, integraciones y tecnología."
    )

    def items(self):
        return BlogPost.objects.filter(is_published=True).order_by(
            "-publish_date"
        )[:20]

    def item_title(self, item):
        return item.meta_title or item.title

    def item_description(self, item):
        return item.meta_description or item.description

    def item_link(self, item):
        return item.get_absolute_url()

    def item_pubdate(self, item):
        return item.publish_date

    def item_updateddate(self, item):
        return item.last_modified

    def item_author_name(self, item):
        return "Jaime Díaz"

    def item_author_link(self, item):
        return "https://www.linkedin.com/in/jdiaz817/"

    def item_categories(self, item):
        categories = []
        if item.category:
            categories.append(item.category.name)
        return categories


class BlogAtomFeed(BlogRSSFeed):
    feed_type = Atom1Feed
    subtitle = BlogRSSFeed.description
