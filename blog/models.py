"""Forwarding module for the Django app's models.

This file re‑exports everything from ``backend.blog.models`` so that static
analysis tools and the ``list_posts.py`` script can import ``blog.models``
directly, even though the actual Django app lives under the ``backend``
package.
"""

from backend.blog.models import *  # noqa: F403,F401

# Export public names (exclude private/internal ones).
__all__ = [name for name in globals() if not name.startswith("_")]
