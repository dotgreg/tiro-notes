
export type ServerPlatform = 'win' | 'mac' | 'linux' ;
export const getPlatform = () => {
    let platform:ServerPlatform = 'linux';
    const rawPlatform = process.platform
    if (rawPlatform.startsWith('win')) platform = 'win';
    if (rawPlatform.startsWith('darwin')) platform = 'mac';
    // return platform
    return {
        os: platform,
        arch: process.arch 
    }
}

// export type iPlatform = ReturnType<typeof getPlatform> 



// export const getEnvironment = () => {
//     return {
//         os: getPlatform(),
//         arch: process.arch 
//     }
// }