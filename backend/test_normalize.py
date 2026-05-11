import sys

sys.path.append("backend")
from blog.management.commands.import_blogs import Command

cmd = Command()

# Test 1: Two consecutive lines should be joined
test1 = "Line 1\nLine 2\n\nLine 3"
print("Test 1 input:")
print(repr(test1))
print("Test 1 output:")
print(repr(cmd._normalize_lines(test1)))
print()

# Test 2: Multiple consecutive lines
test2 = "Line 1\nLine 2\nLine 3\n\nLine 4"
print("Test 2 input:")
print(repr(test2))
print("Test 2 output:")
print(repr(cmd._normalize_lines(test2)))
print()

# Test 3: With heading and paragraphs
test3 = "# Title\n\nPara 1 line 1\nPara 1 line 2\n\nPara 2"
print("Test 3 input:")
print(repr(test3))
print("Test 3 output:")
print(repr(cmd._normalize_lines(test3)))
