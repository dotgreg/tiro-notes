export const makeRandomString = (length:number) => {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * 
 charactersLength)));
   }
   return result.join('');
}



export const removeSpecialChars = (raw:string):string => {
  return raw.replace(/[^\w\s]/gi, '')
}

export const removeAccents = (raw:string):string => {
  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
}

export const normalizeString = (raw:string):string => {
  return removeAccents(raw).toLowerCase()
}

