
export type ServerPlatform = 'win' | 'mac' | 'linux' ;
export const getPlatform = ():ServerPlatform => {
    let platform:ServerPlatform = 'linux';
    // console.log(/)
    const rawPlatform = process.platform
    if (rawPlatform.startsWith('win')) platform = 'win';
    if (rawPlatform.startsWith('darwin')) platform = 'mac';
    return platform
}