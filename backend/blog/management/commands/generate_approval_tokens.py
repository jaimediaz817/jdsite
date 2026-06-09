"""Management command to generate missing approval tokens for pending drafts.

This command scans ``BlogPost`` objects that are not published and have a
``moderation_status`` of ``pending``.  If a post lacks an ``approval_token`` or
``approval_token_created`` it creates a new UUID token and timestamps the
creation.  The same logic exists in ``BlogPost.save()`` for newly created
drafts, but older records may be missing these fields.  Running this command
ensures the moderation dashboard correctly lists pending drafts.

Usage:
    python manage.py generate_approval_tokens
"""

import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone

from blog.models import BlogPost


class Command(BaseCommand):
    help = "Generate missing approval tokens for pending draft posts"

    def handle(self, *args, **options):
        # Considerar todos los posts con ``moderation_status='pending'``,
        # independientemente de si están publicados o no, para que la
        # dashboard muestre los enlaces de aprobación cuando corresponda.
        pending_posts = BlogPost.objects.filter(moderation_status="pending")
        updated = 0
        for post in pending_posts:
            if not post.approval_token:
                post.approval_token = uuid.uuid4().hex
                post.approval_token_created = timezone.now()
                post.save(
                    update_fields=["approval_token", "approval_token_created"]
                )
                updated += 1
        self.stdout.write(
            self.style.SUCCESS(
                f"Generated tokens for {updated} pending draft(s)."
            )
        )
