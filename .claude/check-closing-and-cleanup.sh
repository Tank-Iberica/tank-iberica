#!/bin/bash
# Check if STATUS.md contains CLOSING_SESSION marker and cleanup if needed

file_path="$1"

# Only proceed if file is STATUS.md
if [ "$(basename "$file_path")" = "STATUS.md" ]; then
  # Check if file contains CLOSING_SESSION marker
  if grep -q "CLOSING_SESSION" "$file_path" 2>/dev/null; then
    # Execute cleanup of dev server on port 3000
    ./.claude/cleanup-node.bat 2>/dev/null || true
  fi
fi

exit 0
