import re


def _is_structural(stripped_line):
    if stripped_line == "":
        return True
    if stripped_line.startswith(("#", ">", "```")):
        return True
    if re.match(r"^[-*+]\s", stripped_line):
        return True
    if re.match(r"^\d+\.\s", stripped_line):
        return True
    if re.match(r"^\|", stripped_line):
        return True
    if stripped_line.startswith(":::"):
        return True
    if stripped_line.startswith("__SPECIAL_BLOCK_"):
        return True
    return False


def _normalize_lines(text):
    # Protect special blocks
    placeholders = {}
    placeholder_counter = [0]

    def protect_special_block(match):
        placeholder_counter[0] += 1
        key = f"__SPECIAL_BLOCK_{placeholder_counter[0]}__"
        placeholders[key] = match.group(0)
        return key

    text = re.sub(
        r":::[a-zA-Z0-9:_\-]+\s*\n.*?:::",
        protect_special_block,
        text,
        flags=re.DOTALL,
    )

    lines = text.split("\n")
    result = []
    in_code_block = False
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            in_code_block = not in_code_block
            result.append(line)
            i += 1
            continue

        if in_code_block:
            result.append(line)
            i += 1
            continue

        if stripped == "":
            result.append("")
            i += 1
            continue

        if _is_structural(stripped):
            result.append(line)
            i += 1
            continue

        # Accumulate paragraph lines
        paragraph_lines = [line]
        j = i + 1
        while j < len(lines):
            next_line = lines[j]
            next_stripped = next_line.strip()
            if next_stripped == "":
                break
            if _is_structural(next_stripped):
                break
            paragraph_lines.append(next_line)
            j += 1
        paragraph = " ".join([l.rstrip() for l in paragraph_lines])
        result.append(paragraph)
        i = j

    joined = "\n".join(result)

    # Restore special blocks
    for key, original in placeholders.items():
        joined = joined.replace(key, original)

    return joined


# Test
test_text = """Line 1
Line 2

Line 3
Line 4
Line 5

## Heading

- List item 1
- List item 2
"""
print("Input:")
print(repr(test_text))
print("\nOutput:")
output = _normalize_lines(test_text)
print(repr(output))
print("\nFormatted:")
print(output)
