# This top‑level package forwards imports to the actual Django app located in
# ``backend/blog``. It exists so that static analysis tools (e.g., Pylance) can
# resolve ``import blog.models`` when the project root is on ``sys.path``.

# Re‑export the Django app package so that ``import blog`` behaves like the
# original app.
from importlib import import_module

# Load the real app module lazily.
_real_blog = import_module("backend.blog")

# Populate the current module's namespace with the attributes of the real app.
globals().update(_real_blog.__dict__)

# Ensure ``__all__`` mirrors the real package's public interface.
__all__ = getattr(_real_blog, "__all__", [])
