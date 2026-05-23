"""Utility functions for database related operations used by the blog import command.

This module currently provides a function to reset the auto‑increment sequence for the
``BlogPost`` model. The implementation is identical to the original ``reset_id_sequences``
method from ``import_blogs.py`` but is now isolated to make the command more modular
and testable.
"""

from django.conf import settings
from django.db import connection


def reset_blogpost_sequence(stdout=None):
    """Reset the auto‑increment counter for the ``blog_blogpost`` table.

    The function detects the database engine (PostgreSQL or MySQL) and executes the
    appropriate SQL to set the next ``id`` value based on the current maximum. An
    optional ``stdout`` argument can be provided (e.g., ``self.stdout``) to emit a
    status message, mirroring the behaviour of the original method.
    """
    db_engine = settings.DATABASES["default"]["ENGINE"]

    with connection.cursor() as cursor:
        if "postgresql" in db_engine:
            cursor.execute("""
                SELECT setval(pg_get_serial_sequence('blog_blogpost', 'id'),
                COALESCE((SELECT MAX(id) FROM blog_blogpost), 0) + 1, false);
                """)
        elif "mysql" in db_engine:
            cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM blog_blogpost")
            next_id = cursor.fetchone()[0]
            cursor.execute(
                f"ALTER TABLE blog_blogpost AUTO_INCREMENT = {next_id}"
            )

    if stdout:
        stdout.write("✅ Secuencia de IDs reseteada correctamente")
