#!/bin/bash

# testing => rsync -av ../projects .

# Directory to start search, should be first argument
# dir="."
dir=$1
# if dir does not exists, return error
if [ ! -d "$dir" ]; then
    echo "Directory $dir does not exist"
    exit 1
fi

# if second argument is not present, just print the files that would be modified
# if [ -z "$2" ]; then
#     echo "Running in dry-run mode, no files will be modified"
# fi

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
    # created=$(stat -c %W "$file")
    # updated=$(stat -c %Y "$file")
    # access
    accessed=$(stat -c %X "$file")
    # modify    
    modified=$(stat -c %Y "$file")
    # change
    changed=$(stat -c %Z "$file")
    # birth
    birth=$(stat -c %W "$file")

    # find the older dates of the 4
    oldestDate=$accessed
    if [ "$modified" -lt "$oldestDate" ]; then
        oldestDate=$modified
    fi
    if [ "$changed" -lt "$oldestDate" ]; then
        oldestDate=$changed
    fi
    if [ "$birth" -lt "$oldestDate" ]; then
        oldestDate=$birth
    fi

    # created and updated are the same, ie oldestDate
    created=$oldestDate
    updated=$oldestDate

    # echo 


    ((scanned++))

    # Check if file starts with the header
    if ! grep -q "=== HEADER ===" "$file"; then
        # if updated < created, set created to updated
        # if [ "$updated" -lt "$created" ]; then
        #     echo "$dir > $file has updated time before created time, ($updated < $created)"
        #     created=$updated
        # fi
        # If not, add the header
        printf "$(printf "$header" "$created" "$updated")\n$(cat "$file")" > "$file"
        echo "$dir > $file does not have header, adding it, oldestDate: $oldestDate, created: $created, updated: $updated, (accessed: $accessed, modified: $modified, changed: $changed, birth: $birth)"
        ((modified++))
        echo "Scanned $scanned files, modified $modified files"
    fi
done
