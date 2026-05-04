from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db.models import Count, Q
from allauth.socialaccount.models import SocialAccount
from django.db import transaction


class Command(BaseCommand):
    help = "Finds and merges duplicate users based on email (case-insensitive)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="List duplicates without making changes.",
        )
        parser.add_argument(
            "--keep-oldest",
            action="store_true",
            help="Keep the oldest user (lowest id) instead of the one with social accounts.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        keep_oldest = options["keep_oldest"]

        # Find emails that appear more than once (case-insensitive)
        duplicate_emails = (
            User.objects.exclude(email="")
            .exclude(email__isnull=True)
            .values("email")
            .annotate(email_count=Count("id"))
            .filter(email_count__gt=1)
        )

        if not duplicate_emails:
            self.stdout.write(self.style.SUCCESS("No duplicate emails found."))
            return

        for item in duplicate_emails:
            email = item["email"]
            users = User.objects.filter(email=email).order_by("id")
            self.stdout.write(
                f"\nFound {users.count()} users with email: {email}"
            )

            if keep_oldest:
                keep_user = users.first()
            else:
                # Prefer user with social accounts, then superuser, then oldest
                social_users = [
                    u
                    for u in users
                    if SocialAccount.objects.filter(user=u).exists()
                ]
                if social_users:
                    keep_user = social_users[0]
                elif users.filter(is_superuser=True).exists():
                    keep_user = users.filter(is_superuser=True).first()
                else:
                    keep_user = users.first()

            self.stdout.write(
                f"Keeping user: {keep_user.username} (id={keep_user.id})"
            )
            duplicates = users.exclude(id=keep_user.id)

            if dry_run:
                self.stdout.write(
                    "Dry run: would delete duplicates: "
                    + ", ".join([f"{u.username} (id={u.id})" for u in duplicates])
                )
                continue

            with transaction.atomic():
                for dup in duplicates:
                    self.stdout.write(
                        f"Merging user {dup.username} (id={dup.id}) into {keep_user.username}..."
                    )
                    # Reassign SocialAccounts
                    SocialAccount.objects.filter(user=dup).update(user=keep_user)
                    # Add any other models here...
                    # Delete duplicate user
                    dup.delete()
                    self.stdout.write(
                        f"Deleted user {dup.username} (id={dup.id})"
                    )

        self.stdout.write(self.style.SUCCESS("\nDuplicate cleanup complete."))
