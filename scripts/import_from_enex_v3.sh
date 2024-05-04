#!/bin/bash

dir1="./1_yarle_output"
dir2="./2_perDate_output"
# dir3="./3_prependDates_output"

rm -rf $dir1
mkdir -p $dir1
if [ "$1" == "clean" ]; then
    mkdir -p $dir2
    rm -rf $dir2    
fi

#
#
# 1 YARLE CMD
# 
#
# compress yarle_v21.json to yarle_v21.json in one line, remove linejump and spaces
cat yarle_v22.json | tr -d '\n'  > yarle_v22.gen.json
# npx -p yarle-evernote-to-md@latest yarle --configFile ./yarle_v21.gen.json
npx -p yarle-evernote-to-md@latest yarle --configFile ./yarle_v22.gen.json










#
#
# 2 PER DATE CMD
# 
#
scanned=0
find $dir1 -type f -name "*.md" ! -path "*/.history/*" | while read filePath; 
do
    ((scanned++))
    created=$(stat -f %B "$filePath")
    year=$(date -r "$created" "+%Y")
    month=$(date -r "$created" "+%m")
    # replace in note ./.resources/ by ../.resources/
    # sed -i 's/\.\/resources\//\.\.\/\.\.\/resources\//g' "$filePath"
    sed -i '' -E 's/\.\.\/resources\//\.\.\/\.\.\/resources\//g' "$filePath"
    # replace * by -
    sed -i '' -E 's/\*/-/g' "$filePath"
    # create directory if not exists
    mkdir -p "$dir2/$year/$month"

    # add header  "=== HEADER ===\\ncreated: $created\\nupdated: $created\\n=== END HEADER ===" to file on top using sed
    sed -i '' "1s/^/=== HEADER ===\\ncreated: $created\\nupdated: $created\\n=== END HEADER ===\\n\\n/" "$filePath"

    # move file
    mv "$filePath" "$dir2/$year/$month/$(basename "$filePath")"
done

# move $dir1/.resources to $dir2/.resources
cp -r $dir1/notes/resources $dir2/resources





# dir=$dir2
# #
# #
# # HEADER PASTE COPY PASTE FROM prependDatesHeaderToMd
# # 
# #

# # if dir does not exists, return error
# if [ ! -d "$dir" ]; then
#     echo "Directory $dir does not exist"
#     exit 1
# fi

# # if second argument is not present, just print the files that would be modified
# # if [ -z "$2" ]; then
# #     echo "Running in dry-run mode, no files will be modified"
# # fi

# # Header template
# header="=== HEADER ===
# created: %s
# updated: %s
# === END HEADER ==="

# # counter of modified/scanned files
# modified=0
# scanned=0
# error=0

# # Find all .md files recursively, avoir folders starting by .history and .tiro
# find $dir -type f -name "*.md" ! -path "*/.history/*" ! -path "*/.tiro/*" ! -path "*/_evernote2/*" | while read file;
# do
    
#     # Get file creation and modification time
#     # created=$(stat -c %W "$file")
#     # updated=$(stat -c %Y "$file")
#     # access on MACOS
#     accessed=$(stat -f %a "$file")
#     # accessed=$(stat -c %X "$file")
#     # modify    
#     modified=$(stat -f %m "$file")
#     # modified=$(stat -c %Y "$file")
#     # change
#     changed=$(stat -f %c "$file")
#     # changed=$(stat -c %Z "$file")
#     # birth
#     birth=$(stat -f %B "$file")
#     # birth=$(stat -c %W "$file")

#     oldestDate=$birth
#     # if birth is 0, set it to the oldest of the 3
#     if [ "$birth" -eq 0 ] && [ "$accessed" -ne 0 ]; then
#         oldestDate=$accessed
#     fi
#     if [ "$birth" -eq 0 ] && [ "$modified" -ne 0 ]; then
#         oldestDate=$modified
#     fi
#     if [ "$birth" -eq 0 ] && [ "$changed" -ne 0 ]; then
#         oldestDate=$changed
#     fi


#     # find the older dates of the 4, except if it is 0
#     if [ "$accessed" -lt "$oldestDate" ] && [ "$accessed" -ne 0 ]; then
#         oldestDate=$accessed
#     fi
#     if [ "$modified" -lt "$oldestDate" ] && [ "$modified" -ne 0 ]; then
#         oldestDate=$modified
#     fi
#     if [ "$changed" -lt "$oldestDate" ] && [ "$changed" -ne 0 ]; then
#         oldestDate=$changed
#     fi
#     if [ "$birth" -lt "$oldestDate" ] && [ "$birth" -ne 0 ]; then
#         oldestDate=$birth
#     fi
   

#     # created and updated are the same, ie oldestDate
#     created=$oldestDate
#     updated=$oldestDate

#     # add 3 zeros to the end of the date
#     created=$(($created * 1000))
#     updated=$(($updated * 1000)) 


#     ((scanned++))
#     echo "Scanning $file ($scanned)"

#     # Check if file starts with the header
#     if ! grep -q "=== HEADER ===" "$file"; then
#         # if updated < created, set created to updated
#         # if [ "$updated" -lt "$created" ]; then
#         #     echo "$dir > $file has updated time before created time, ($updated < $created)"
#         #     created=$updated
#         # fi
#         # get $file content length in chars
#         echo "$dir > $file does not have header, adding it, oldestDate: $oldestDate, created: $created, updated: $updated, (accessed: $accessed, modified: $modified, changed: $changed, birth: $birth)"
#         originalContentLength=$(wc -c < "$file")
#         # If not, add the header, MAKE SURE TO USE printf TO ESCAPE %s
#         # printf "$header\n" $created $updated | cat - "$file" > temp 
#         # echo "$fullHeader" | cat - "$file" > temp
#         fullHeader="=== HEADER ===\ncreated: $created\nupdated: $updated\n=== END HEADER ==="

#         # sed -i "1s;^;$header\n;" "$file"
#         #using  sed -i '1i\
#         # sed -i "1i\\$fullHeader" "$file"
#         # sed "1i\\$fullHeader" "$file" > "$tempFilePath"
#         # tempFilePath="$file.temp"
#         # If not, add the header, MAKE SURE TO NOT USE SED but do not alter the file content, move it to temp
#         # 
#         # printf "$fullHeader\n $(cat $file)" > "$tempFilePath"
#         printf "$header\n" $created $updated | cat - "$file" > temp 

        
        
#         # only if temp content length is greater than originalContentLength, replace the file
#         tempContentLength=$(wc -c < temp)
#         if [ "$tempContentLength" -gt "$originalContentLength" ]; then
#             mv temp "$file"
#         else
#             echo "⚠️ Error for $file : temp content length ($tempContentLength) is smaller than originalContentLength ($originalContentLength), not replacing file"
#             ((error++))
#         fi
#         #mv temp "$file"
        
#         ((modified++))
#         echo "======> Scanned $scanned files, $error errors"
#     fi
# done
