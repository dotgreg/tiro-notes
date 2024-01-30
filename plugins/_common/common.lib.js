//@flow 

function getOperatingSystem() {
    const platform = navigator.platform.toLowerCase();
    
    if (platform.includes('mac')) {
        return 'mac';
    } else if (platform.includes('win')) {
        return 'windows';
    } else if (platform.includes('linux')) {
        return 'linux';
    } else if (platform.includes('android')) {
        return 'android';
    } else {
        return 'other';
    }
}
