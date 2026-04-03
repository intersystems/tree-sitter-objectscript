#!/usr/bin/env python3
"""Add tree-sitter test headers and trailing --- to .rtn files in localtests/sql/."""
import os
import glob

dir_path = os.path.dirname(os.path.abspath(__file__))

for filepath in sorted(glob.glob(os.path.join(dir_path, "*.rtn"))):
    basename = os.path.basename(filepath)
    # Derive test name: strip leading _ and trailing .rtn
    if basename.startswith("_"):
        testname = basename[1:]  # remove leading _
    else:
        testname = basename
    if testname.endswith(".rtn"):
        testname = testname[:-4]  # remove .rtn

    with open(filepath, "r") as f:
        content = f.read()

    # Skip if already has header
    if content.startswith("====\n"):
        print(f"SKIP (already has header): {basename}")
        continue

    # Strip trailing whitespace/newlines
    content = content.rstrip()

    # Add header and trailing ---
    new_content = f"====\n{testname}\n====\n{content}\n---\n"

    with open(filepath, "w") as f:
        f.write(new_content)

    print(f"UPDATED: {basename}")
