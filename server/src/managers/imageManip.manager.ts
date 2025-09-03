// import sharp from "sharp";
import Jimp from "jimp";
import { iCompressResult, iImageCompressionParams } from "../../../shared/types.shared";
import { perf } from "./performance.manager";
import { relativeToAbsolutePath } from "./path.manager";

export const compressImageJimp = async (params: iImageCompressionParams):Promise<iCompressResult> => {
    const absFilePath = relativeToAbsolutePath(params.path)
    let endPerf = perf(`🗜️  compressImage ${absFilePath}`)
    // const Jimp = require('jimp');
    console.log("[compressImage]", absFilePath, JSON.stringify(params))
    const image = await Jimp.read(absFilePath)
    const currWidth = image.getWidth()
    const currHeight = image.getHeight()
    const mime = image.getMIME()
    
    const metadataStart = await image.getBufferAsync(mime)

    const fileName = absFilePath.toLowerCase()
    const isJpeg = fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
    const isPng = fileName.endsWith(".png")

    if (params.width && !params.height) image.resize(params.width, Jimp.AUTO)
    if (params.height && !params.width) image.resize(Jimp.AUTO, params.height)
    if (params.height && params.width) image.resize(params.width, params.height)

    if (params.maxWidth && currWidth > params.maxWidth) image.resize(params.maxWidth, Jimp.AUTO)
    if (params.maxHeight && currHeight > params.maxHeight) image.resize(Jimp.AUTO, params.maxHeight)

    if (params.quality && isJpeg) image.quality(params.quality)
    if (params.quality && isPng) image.quality(params.quality)

    // getting size of output image
    const metadataEnd = await image.getBufferAsync(mime)
    // console.log("[compressImage] metadata", metadataStart.size, metadataEnd.size)
    
    image.write(absFilePath)
    endPerf()
    return {
        sizeStart: metadataStart.length,
        sizeEnd: metadataEnd.length,
        compressionRatio: metadataStart.length / metadataEnd.length
    }
}

// export const compressImage = async (params: iImageCompressionParams):Promise<iCompressResult> => {
//     let endPerf = perf(`compressImage ${params.path}`)
//     let s = sharp(params.path)
//     console.log("[compressImage]", JSON.stringify(params))
//     const metadataStart = await s.metadata()

//     const fileName = params.path.toLowerCase()
//     const isJpeg = fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
//     const isPng = fileName.endsWith(".png")

//     if (params.width && !params.height) s = s.resize(params.width)
//     if (params.height && !params.width) s = s.resize(null, params.height)
//     if (params.height && params.width) s = s.resize(params.width, params.height)

//     if (params.quality && isJpeg) s = s.jpeg({quality: params.quality})
//     if (params.quality && isPng) s = s.png({quality: params.quality, compressionLevel: 6})
//     // if (isPng) s = s.png({compressionLevel: 6}) // highest compression

//     // getting size of output image
//     const metadataEnd = await s.metadata()
//     // console.log("[compressImage] metadata", metadataStart.size, metadataEnd.size)
    
//     s.toFile(params.path)
//     endPerf()
//     return {
//         sizeStart: metadataStart.size,
//         sizeEnd: metadataEnd.size,
//         compressionRatio: metadataStart.size / metadataEnd.size
//     }
// }