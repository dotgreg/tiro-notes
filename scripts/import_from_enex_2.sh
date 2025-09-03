#!/bin/bash

# notebookName is first argument
notebookName=$1


dirTopIn="1_in/"
dirTopIn2="1_1_in/"
dirTopOut="2_out/"
dirTopOut2Date="3_out_dates/"


# if second argument is set to "clean", remove all directories
rm -rf $dirTopIn
rm -rf $dirTopIn2
rm -rf $dirTopOut
mkdir -p $dirTopIn
mkdir -p $dirTopIn2
mkdir -p $dirTopOut
if [ "$2" == "clean" ]; then
    rm -rf $dirTopOut2Date
    mkdir -p $dirTopOut2Date
fi

# Directory to start search
dirin="1_in/$notebookName/"
mkdir -p $dirin
dirin2="1_1_in/$notebookName/"
mkdir -p $dirin2
dirout="2_out/$notebookName/"
mkdir -p $dirout
dirout2Date="3_out_dates/"
mkdir -p $dirout2Date

# if dirin is empty, import notebook
echo "Importing notebook $notebookName"
evernote2md "./0_exportEnex/${notebookName}.enex" "${dirin}" --folders ;
# if [ -z "$(ls -A $dirin)" ]; then
# fi
# npx -p yarle-evernote-to-md@latest yarle --configFile ./yarleconfig.json

# function that sanitizes a string for use as a filename, 
#replace everything that is not a letter or a number by _ !!!!!!!
# and make everything lowercase
# also replace space, . ! etc by _
sanitize() {
    echo "$1" | tr -c '[:alnum:]' '_' | tr '[:upper:]' '[:lower:]' | tr -s '_'
}


# drin structure is ${dirin}/NOTE_NAME/README.md
# create dirin2 structure ${dirin2}/NOTE_NAME.md
# find should go through all folders and subfolders
mkdir -p $dirin2
mkdir -p $dirin2/image
mkdir -p $dirin2/file
find $dirin -type f | while read file;
do
    # if $file is a README.md file, copy it to $dirin2/NOTE_NAME.md
    if [[ $file == *README.md ]]; then
        # get folder name
        folder=$(dirname "$file")
        # get folder name
        folderName=$(basename "$folder")
        # if folderName start by ., remove it
        # if [[ $folderName == .* ]]; then
        #     folderName=${folderName#.}
        # fi
        # sanitize folderName
        folderName=$(sanitize "$folderName")

        # copy file while keeping dates creation etc, make rsync silent 
        rsync -av "$file" "$dirin2/$folderName.md"

        # rsync copy faster using parallel
        # rsync -av "$file" "$dirin2/$folderName.md" &
        # rsync -av "$file" "$dirin2/$folderName.md" &
        

        #cp "$file" "$dirin2/$folderName.md"
    fi
    # if $file includes /image/ or /file/ copy it to $dirout/image/ or $dirout/file/ and prepent the folder name
    if [[ $file == *image/* ]]; then
        # get folder name
        folder=$(dirname "$file")
        # get parent of parent folder name
        noteName=$(basename $(dirname "$folder"))
        # # if folderName start by ., remove it
        # if [[ $noteName == .* ]]; then
        #     noteName=${noteName#.}
        # fi
        # sanitize folderName
        noteName=$(sanitize "$noteName")
        # copy file
        cp "$file" "$dirin2/image/$notebookName-$noteName-$(basename "$file")"
    fi
    if [[ $file == *file/* ]]; then
        # get folder name
        folder=$(dirname "$file")
        # get folder name
        noteName=$(basename $(dirname "$folder"))
        # if folderName start by ., remove it
        # if [[ $noteName == .* ]]; then
        #     noteName=${noteName#.}
        # fi
        # sanitize folderName
        noteName=$(sanitize "$noteName")
        # copy file
        cp "$file" "$dirin2/file/$notebookName-$noteName-$(basename "$file")"
    fi
done

# inside $dirin2 mds, find

# remove dirout
# rm -rf $dirout2Date

# copy dir into 2_out
rsync -av $dirin2 $dirout

# Header template
header="=== HEADER ===
created: %s
updated: %s
=== END HEADER ==="

# counter of modified/scanned files
modified=0
scanned=0

# Find all .md files recursively, avoir folders starting by .history
find $dirout -type f -name "*.md" ! -path "*/.history/*" | while read filePath; 
do
    # Get filePath creation and modification time
    # created=$(stat -c %W "$filePath")
    # updated=$(stat -c %Y "$filePath")
    # on mac
    created=$(stat -f %B "$filePath")
    updated=$(stat -f %m "$filePath")
    ((scanned++))

    noteName=$(basename "$filePath")
    #remove .md 
    noteName=${noteName%.md}

    # replace all strings `TAG ONE AND OTHER` by `TAG_ONE_AND_OTHER` Make sure to replace space by _
    sed -i '' -E 's/`([^`]+) ([^`]+)`/`\1_\2`/g' "$filePath"
    # replace all strings `TAG_1`  by #TAG_1. 
    sed -i '' -E 's/`([^`]+)`/#\1/g' "$filePath"

    
    # add in first line of the filePath the title of the notebook
    sed -i '' "1s/^/notebook:$notebookName\nnoteName:$noteName\n\n/" "$filePath"


    # Check if filePath starts with the header
    if ! grep -q "=== HEADER ===" "$filePath"; then
        # if updated < created, set created to updated
        if [ "$updated" -lt "$created" ]; then
            echo "$dir > $filePath has updated time before created time, ($updated < $created)"
            created=$updated
        fi
        # If not, add the header
        printf "$(printf "$header" "$created" "$updated")\n$(cat "$filePath")" > "$filePath"
        echo "$dir > $filePath does not have header, adding it"
        ((modified++))
        echo "Scanned $scanned files, modified $modified files"
    fi

    

    # copy file in 3_out_dates respecting following strcutre 3_out_dates/2020/01/FILENAME.md
    # get year and month from created date
    year=$(date -r "$created" "+%Y")
    month=$(date -r "$created" "+%m")
    # create directory if not exists
    mkdir -p "$dirout2Date/$year/$month"
    # copy file
    cp "$filePath" "$dirout2Date/$year/$month/$(basename "$filePath")"
    
    # if folderName start by ., remove it
    # if [[ $noteName == .* ]]; then
    #     noteName=${noteName#.}
    # fi
    # sanitize folderName
    noteName=$(sanitize "$noteName")
    # sed -i '' -E 's/(\[.*\]\()([^\)]+\))/\1..\/..\/image\/'$notebookName'-'$noteName'-\2/g' "$dirout2Date/$year/$month/$(basename "$file)"
    # sed -i 's!\(\!\[.*\]\)\(.*\)\(\(image/.*\.png\)\)!\1\2(../../image/'${notebookName}'-'${noteName}'-\3)!' "$dirout2Date/$year/$month/$(basename "$file)"

    # rename files and images links inside note like ![ScreenClip.png](image/ScreenClip.png) to ![ScreenClip.png](../../image/$notebookName-$noteName-ScreenClip.png)
    # sed -i '' -E 's/\[([^\]]+)\]\(image\/([^\)]+)\)/\!\[\2\]\(../../image\/'$notebookName'-'$noteName'-\2\)/g' "$dirout2Date/$year/$month/$(basename "$file")"

    # replace ](image/ by ](../../image/$notebookName-$noteName-
    sed -i '' -E 's/\]\(image\//\]\(..\/..\/image\/'$notebookName'-'$noteName'-/g' "$dirout2Date/$year/$month/$(basename "$filePath")"
    # replace ](file/  by ](../../file/$notebookName-$noteName-
    sed -i '' -E 's/\]\(file\//\]\(..\/..\/file\/'$notebookName'-'$noteName'-/g' "$dirout2Date/$year/$month/$(basename "$filePath")"
    # replace ](./file/  by ](../../file/$notebookName-$noteName-
    sed -i '' -E 's/\]\(\.\/file\//\]\(..\/..\/file\/'$notebookName'-'$noteName'-/g' "$dirout2Date/$year/$month/$(basename "$filePath")"
    # replace ](./image/  by ](../../image/$notebookName-$noteName-
    sed -i '' -E 's/\]\(\.\/image\//\]\(..\/..\/image\/'$notebookName'-'$noteName'-/g' "$dirout2Date/$year/$month/$(basename "$filePath")"
    
    # replace file by wooooooooop 
    # sed -i '' -E 's/file/woooooooop/g' "$dirout2Date/$year/$month/$(basename "$filePath")"
done

#copy folder image and file from 2_out to 3_out_dates into .resources
# mkdir -p $dirout2Date/.resources/$notebookName/image/
# mkdir -p $dirout2Date/.resources/$notebookName/file/
# rsync -av $dirout/image/ $dirout2Date/.resources/$notebookName/image/
# rsync -av $dirout/file/ $dirout2Date/.resources/$notebookName/file/
# mkdir -p $dirout2Date/.resources/$notebookName/image/
# mkdir -p $dirout2Date/.resources/$notebookName/file/
rsync -av $dirout/image/ $dirout2Date/image/
rsync -av $dirout/file/ $dirout2Date/file/
