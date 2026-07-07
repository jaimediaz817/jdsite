"""Utility package for the blog app.

This package groups together helper modules used by the ``blog`` app.  The
``importer`` subpackage contains functions for the ``import_blogs`` management
command, while ``utils.py`` provides avatar‑related utilities.  To maintain
backward compatibility, the avatar helper functions are re‑exported at the
package level so that existing imports such as ``from blog.utils import
generate_avatar_seed`` continue to work.

Example::

    from blog.utils import generate_avatar_seed, get_avatar_color, get_avatar_initials

The import in ``backend/blog/models.py`` relies on this behaviour, so we expose
the symbols via ``__all__``.
"""

import importlib.util
import os

# Load the sibling utils.py file (named 'utils') that lives alongside this package
# We use importlib to avoid confusion with the package directory
_module_path = os.path.join(os.path.dirname(__file__), "..", "utils.py")
_spec = importlib.util.spec_from_file_location(
    "blog.utils.utils_module", _module_path
)
_utils_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_utils_mod)

generate_avatar_seed = _utils_mod.generate_avatar_seed
get_avatar_color = _utils_mod.get_avatar_color
get_avatar_initials = _utils_mod.get_avatar_initials

# HU-026-B: get_owner_email está en owner_email.py para evitar loops
from .owner_email import get_owner_email

__all__ = [
    "generate_avatar_seed",
    "get_avatar_color",
    "get_avatar_initials",
    "get_owner_email",
]
