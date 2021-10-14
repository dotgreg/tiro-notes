export type iImageDimension = {width:number, height:number}
export const getImageDimensions = (src:string):Promise<iImageDimension>=> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({width: img.width, height: img.height})
        }
        img.onerror=() => {
            reject()
        };
        img.src = src;
    })
}