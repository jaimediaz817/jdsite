import sys

sys.path.append("blog/management/commands")
from import_blogs import Command

cmd = Command()
print(cmd._normalize_lines("Line 1\nLine 2\n\nLine 3"))
