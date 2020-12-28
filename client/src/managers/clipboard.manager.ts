
let alreadyListening = false
export const initClipboardListener = (events: {
    onImagePasted: (Blob:any) => void
}) => {
    const retrieveImageFromClipboardAsBlob = (pasteEvent, callback) => {
        if(pasteEvent.clipboardData == false){
            if(typeof(callback) == "function"){
                callback(undefined);
            }
        };
    
        var items = pasteEvent.clipboardData.items;
        console.log(pasteEvent, items, items.length);
        
    
        if(items == undefined){
            if(typeof(callback) == "function"){
                callback(undefined);
            }
        };
    
        for (var i = 0; i < items.length; i++) {
            // Skip content if not image
            // console.log(i,items[i].type);
            
            if (items[i].type.indexOf("image") == -1) continue;
            // Retrieve image on clipboard as blob
            var blob = items[i].getAsFile();
    
            if(typeof(callback) == "function"){
                callback(blob);
            }
        }
    }
    
    if (alreadyListening) return
    alreadyListening = true
    
    window.addEventListener("paste", function(e){
        retrieveImageFromClipboardAsBlob(e, function(imageBlob){
            if(imageBlob){
                events.onImagePasted(imageBlob)
            }
        });
    }, false);
}