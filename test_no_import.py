import importlib.util
import pathlib

# Load BlogProcessor
spec = importlib.util.spec_from_file_location(
    "bp", r"backend/blog/utils/importer/blog_processor.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class Dummy:
    pass


dummy = Dummy()
# dummy stdout with write method (no output)
dummy.stdout = type("S", (), {"write": lambda self, msg: None})()
processor = mod.BlogProcessor(dummy, pathlib.Path("static"))

md = """:::no-import:::\n![blocked image](image1.jpg)\n:::final-no-import:::\n\nNormal content."""
result = processor._remove_no_import_blocks(md)
print(result)
