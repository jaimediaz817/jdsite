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

# Re‑export avatar helper functions from the sibling ``utils.py`` module.
# Import the helper functions from the sibling ``utils.py`` module located one
# level up (``backend/blog/utils.py``). Using ``..utils`` avoids looking for a
# non‑existent ``blog.utils.utils`` submodule.
# Import the sibling ``utils.py`` module (which lives alongside this package).
# Using ``import_module`` avoids the name clash between the package ``utils``
# and the module ``utils.py``.
# Import the sibling ``utils.py`` module (named ``utils``) that lives in the same
# package directory. Using a relative import ensures we load the module file
# rather than re-entering this ``__init__`` (which would cause recursion).
# The sibling ``utils.py`` file lives alongside this package directory. Because
# it shares the same import name (``blog.utils``) Python would normally resolve
# the package first, making the module inaccessible via a normal import. To
# work around this, we load the module directly from its file path using
# ``importlib.util``.
import importlib.util
import os

_module_path = os.path.join(os.path.dirname(__file__), "..", "utils.py")
_spec = importlib.util.spec_from_file_location(
    "backend.blog.utils_module", _module_path
)
_utils_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_utils_mod)  # type: ignore[attr-defined]

generate_avatar_seed = _utils_mod.generate_avatar_seed
get_avatar_color = _utils_mod.get_avatar_color
get_avatar_initials = _utils_mod.get_avatar_initials

__all__ = [
    "generate_avatar_seed",
    "get_avatar_color",
    "get_avatar_initials",
]
