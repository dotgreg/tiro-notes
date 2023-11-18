export const webIconCreate = (image:string) => {
    var link = document.createElement('link');
    link.rel = 'icon';
    link.href = image;
    link.id = 'icon-page';
    document.getElementsByTagName('head')[0].appendChild(link);
}

export const webIconDelete = ( ) => {
    var link = document.getElementById('icon-page');
    if(link) {
        link.remove();
    }
}

export const webIconUpdate = (image:string) => {
    webIconDelete();
    webIconCreate(image);
}