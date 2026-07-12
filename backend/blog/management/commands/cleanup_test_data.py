from django.core.management.base import BaseCommand
from blog.models import Category, Tag, BlogPost
import sys


class Command(BaseCommand):
    help = "Limpia categorías y slugs de prueba del blog"

    def add_arguments(self, parser):
        parser.add_argument(
            "--list",
            action="store_true",
            help="Lista categorías y slugs actuales",
        )
        parser.add_argument(
            "--categories",
            type=str,
            help="Nombres de categorías a eliminar (separados por coma)",
        )
        parser.add_argument(
            "--slugs",
            type=str,
            help="Slugs de artículos a eliminar (separados por coma)",
        )
        parser.add_argument(
            "--category-prefix",
            type=str,
            help="Elimina categorías que empiecen con este prefijo (ej: Test_)",
        )
        parser.add_argument(
            "--slug-prefix",
            type=str,
            help="Elimina artículos cuyo slug empiece con este prefijo (ej: test_)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="No pedir confirmación",
        )

    def handle(self, *args, **options):
        if options["list"] or (
            not options["categories"]
            and not options["slugs"]
            and not options["category_prefix"]
            and not options["slug_prefix"]
        ):
            self.list_data()
            return

        posts_to_delete = []
        categories_to_delete = []

        # Eliminar por slugs
        if options["slugs"]:
            slug_list = [s.strip() for s in options["slugs"].split(",")]
            posts = BlogPost.objects.filter(slug__in=slug_list)
            posts_to_delete.extend(list(posts))
            self.stdout.write(
                f"✓ {posts.count()} artículo(s) encontrado(s) para eliminar"
            )

        # Eliminar por prefijo de slug
        if options["slug_prefix"]:
            posts = BlogPost.objects.filter(
                slug__startswith=options["slug_prefix"]
            )
            posts_to_delete.extend(list(posts))
            self.stdout.write(
                f"✓ {posts.count()} artículo(s) con prefijo '{options['slug_prefix']}' encontrado(s)"
            )

        # Eliminar categorías por nombre
        if options["categories"]:
            cat_names = [c.strip() for c in options["categories"].split(",")]
            cats = Category.objects.filter(name__in=cat_names)
            categories_to_delete.extend(list(cats))
            self.stdout.write(f"✓ {cats.count()} categoría(s) encontrada(s)")

        # Eliminar categorías por prefijo
        if options["category_prefix"]:
            cats = Category.objects.filter(
                name__startswith=options["category_prefix"]
            )
            categories_to_delete.extend(list(cats))
            self.stdout.write(
                f"✓ {cats.count()} categoría(s) con prefijo '{options['category_prefix']}' encontrada(s)"
            )

        if not posts_to_delete and not categories_to_delete:
            self.stdout.write(
                self.style.WARNING("No se encontró nada para eliminar.")
            )
            return

        # Confirmar
        if not options["force"]:
            self.stdout.write("\nSe eliminará:")
            for post in posts_to_delete:
                self.stdout.write(f"  - Artículo: {post.slug}")
            for cat in categories_to_delete:
                post_count = cat.posts.count()
                self.stdout.write(
                    f"  - Categoría: {cat.name} ({post_count} artículos)"
                )

            confirm = input("\n¿Confirmar eliminación? (y/N): ")
            if confirm.lower() != "y":
                self.stdout.write("Cancelado.")
                return

        # Eliminar artículos
        for post in posts_to_delete:
            post.tags.clear()
            post.delete()
            self.stdout.write(
                self.style.SUCCESS(f"✓ Artículo eliminado: {post.slug}")
            )

        # Eliminar categorías
        for cat in categories_to_delete:
            cat.delete()
            self.stdout.write(
                self.style.SUCCESS(f"✓ Categoría eliminada: {cat.name}")
            )

        self.stdout.write(self.style.SUCCESS(f"\n✅ Limpieza completada."))

    def list_data(self):
        self.stdout.write("\n=== CATEGORÍAS ===")
        cats = Category.objects.all().order_by("name")
        for cat in cats:
            post_count = cat.posts.count()
            self.stdout.write(
                f"  {cat.name} (slug: {cat.slug}) - {post_count} artículo(s)"
            )

        self.stdout.write("\n=== ARTÍCULOS (últimos 20) ===")
        posts = BlogPost.objects.all().order_by("-publish_date")[:20]
        for post in posts:
            self.stdout.write(f"  {post.slug} - {post.title[:50]}")

        if BlogPost.objects.count() > 20:
            self.stdout.write(f"  ... y {BlogPost.objects.count() - 20} más")
