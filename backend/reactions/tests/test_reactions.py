from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from reactions.models import BlogReaction, CommentReaction

User = get_user_model()


class BlogReactionTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user1 = User.objects.create_user(username="user1", password="pwd")
        self.user2 = User.objects.create_user(username="user2", password="pwd")
        self.blog_slug = "test-blog"

    def test_unique_reaction_per_user(self):
        # Primer usuario reacciona
        BlogReaction.objects.create(
            blog_slug=self.blog_slug,
            user=self.user1,
            ip_address="1.1.1.1",
            reaction_type="like",
        )
        # El mismo usuario no puede reaccionar de nuevo con el mismo tipo
        with self.assertRaises(IntegrityError):
            BlogReaction.objects.create(
                blog_slug=self.blog_slug,
                user=self.user1,
                ip_address="1.1.1.1",
                reaction_type="like",
            )

    def test_different_users_independent(self):
        # Usuario 1 reacciona
        BlogReaction.objects.create(
            blog_slug=self.blog_slug,
            user=self.user1,
            ip_address="1.1.1.1",
            reaction_type="like",
        )
        # Usuario 2 puede reaccionar con el mismo tipo sin conflicto
        BlogReaction.objects.create(
            blog_slug=self.blog_slug,
            user=self.user2,
            ip_address="2.2.2.2",
            reaction_type="like",
        )
        self.assertEqual(
            BlogReaction.objects.filter(
                blog_slug=self.blog_slug, reaction_type="like"
            ).count(),
            2,
        )

    def test_anonymous_reaction_by_ip(self):
        # Reacción anónima basada en IP
        BlogReaction.objects.create(
            blog_slug=self.blog_slug, ip_address="3.3.3.3", reaction_type="like"
        )
        # Mismo IP no puede reaccionar de nuevo con el mismo tipo
        with self.assertRaises(IntegrityError):
            BlogReaction.objects.create(
                blog_slug=self.blog_slug,
                ip_address="3.3.3.3",
                reaction_type="like",
            )
        # Otro IP sí puede reaccionar
        BlogReaction.objects.create(
            blog_slug=self.blog_slug, ip_address="4.4.4.4", reaction_type="like"
        )
        self.assertEqual(
            BlogReaction.objects.filter(
                blog_slug=self.blog_slug, reaction_type="like"
            ).count(),
            2,
        )


class CommentReactionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="commenter", password="pwd")
        self.comment_id = 12345

    def test_unique_reaction_per_user_on_comment(self):
        CommentReaction.objects.create(
            comment_id=self.comment_id,
            user=self.user,
            ip_address="5.5.5.5",
            reaction_type="dislike",
        )
        with self.assertRaises(IntegrityError):
            CommentReaction.objects.create(
                comment_id=self.comment_id,
                user=self.user,
                ip_address="5.5.5.5",
                reaction_type="dislike",
            )

    def test_anonymous_comment_reaction_by_ip(self):
        CommentReaction.objects.create(
            comment_id=self.comment_id, ip_address="6.6.6.6", reaction_type="like"
        )
        with self.assertRaises(IntegrityError):
            CommentReaction.objects.create(
                comment_id=self.comment_id,
                ip_address="6.6.6.6",
                reaction_type="like",
            )
        # Otro IP puede reaccionar
        CommentReaction
