import os
import pathlib
from pathlib import Path

# ---------------------------------------------------------------------------
# Django test configuration
# ---------------------------------------------------------------------------
# When running the test suite directly via ``pytest`` the ``DJANGO_SETTINGS_MODULE``
# environment variable is not automatically set (unlike when using ``manage.py``).
# We configure it here to point to the project's settings module and initialise
# Django. This makes the test self‑contained and avoids the ``ImproperlyConfigured``
# error that was previously raised.
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

from django.conf import settings

from django.test import TestCase, Client
from django.urls import reverse


class DeleteResourceFileAjaxTest(TestCase):
    def setUp(self):
        self.client = Client()
        # Create a temporary file in the expected media temp folder
        self.user_id = 99999
        self.filename = "temp_test_image.png"
        self.temp_dir = (
            Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(self.user_id)
        )
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.file_path = self.temp_dir / self.filename
        self.file_path.write_bytes(b"testcontent")

        # Mock authentication as superuser (required by view)
        from django.contrib.auth import get_user_model

        User = get_user_model()
        # Use a unique username per test run to avoid duplicate‑key errors when the
        # test suite is executed multiple times against the same database.
        unique_username = f"admin_{self.user_id}"
        self.superuser = User.objects.create_superuser(
            username=unique_username,
            email=f"{unique_username}@example.com",
            password="adminpass",
        )
        self.client.force_login(self.superuser)

    def tearDown(self):
        # Clean up any leftover files
        if self.file_path.exists():
            self.file_path.unlink()
        if self.temp_dir.exists():
            try:
                self.temp_dir.rmdir()
            except OSError:
                pass

    def test_delete_existing_file(self):
        """Ensure the AJAX endpoint deletes the file and returns success."""
        url = reverse("blog:delete_resource_file")
        response = self.client.post(
            url, {"filename": self.filename, "action": "delete"}
        )
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data.get("success"))
        self.assertFalse(self.file_path.exists())

    def test_delete_nonexistent_file(self):
        """Calling the endpoint with a non‑existent file should be idempotent."""
        url = reverse("blog:delete_resource_file")
        response = self.client.post(
            url, {"filename": "does_not_exist.png", "action": "delete"}
        )
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data.get("success"))
