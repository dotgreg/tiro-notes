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

# Find all .md files recursively, avoir folders starting by .history and .tiro
find $dir -type f -name "*.md" ! -path "*/.history/*" ! -path "*/.tiro/*" ! -path "*/_evernote2/*" | while read file;
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

    oldestDate=$birth
    # if birth is 0, set it to the oldest of the 3
    if [ "$birth" -eq 0 ] && [ "$accessed" -ne 0 ]; then
        oldestDate=$accessed
    fi
    if [ "$birth" -eq 0 ] && [ "$modified" -ne 0 ]; then
        oldestDate=$modified
    fi
    if [ "$birth" -eq 0 ] && [ "$changed" -ne 0 ]; then
        oldestDate=$changed
    fi


    # find the older dates of the 4, except if it is 0
    if [ "$accessed" -lt "$oldestDate" ] && [ "$accessed" -ne 0 ]; then
        oldestDate=$accessed
    fi
    if [ "$modified" -lt "$oldestDate" ] && [ "$modified" -ne 0 ]; then
        oldestDate=$modified
    fi
    if [ "$changed" -lt "$oldestDate" ] && [ "$changed" -ne 0 ]; then
        oldestDate=$changed
    fi
    if [ "$birth" -lt "$oldestDate" ] && [ "$birth" -ne 0 ]; then
        oldestDate=$birth
    fi
   

    # created and updated are the same, ie oldestDate
    created=$oldestDate
    updated=$oldestDate

    # add 3 zeros to the end of the date
    created=$(($created * 1000))
    updated=$(($updated * 1000)) 


    ((scanned++))
    echo "Scanning $file ($scanned)"

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
