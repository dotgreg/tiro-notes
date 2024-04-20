#!/bin/bash

# testing => rsync -av ../projects .

# Directory to start search
dir="."

# Header template
header="=== HEADER ===
created: %s
updated: %s
=== END HEADER ==="

# counter of modified/scanned files
modified=0
scanned=0

# Find all .md files recursively, avoir folders starting by .history
find $dir -type f -name "*.md" ! -path "*/.history/*" | while read file; 
do
    # Get file creation and modification time
    created=$(stat -c %W "$file")
    updated=$(stat -c %Y "$file")
    ((scanned++))

    # Check if file starts with the header
    if ! grep -q "=== HEADER ===" "$file"; then
        # if updated < created, set created to updated
        if [ "$updated" -lt "$created" ]; then
            echo "$dir > $file has updated time before created time, ($updated < $created)"
            created=$updated
        fi
        # If not, add the header
        printf "$(printf "$header" "$created" "$updated")\n$(cat "$file")" > "$file"
        echo "$dir > $file does not have header, adding it"
        ((modified++))
        echo "Scanned $scanned files, modified $modified files"
    fi
done
