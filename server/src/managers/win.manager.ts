var ffi = require('ffi-napi')
type iWinApp = 'explorer' | 'notepad'

export const focusOnWinApp = (winApp: iWinApp) => {

    let appClassName: { [key in iWinApp] : string } = {
        explorer: 'CabinetWClass',
        notepad: 'notepad',
    }

    var user32 = new ffi.Library('user32', {
        'GetTopWindow': ['long', ['long']],
        'FindWindowA': ['long', ['string', 'string']],
        'SetActiveWindow': ['long', ['long']],
        'SetForegroundWindow': ['bool', ['long']],
        'BringWindowToTop': ['bool', ['long']],
        'ShowWindow': ['bool', ['long', 'int']],
        'SwitchToThisWindow': ['void', ['long', 'bool']],
        'GetForegroundWindow': ['long', []],
        'AttachThreadInput': ['bool', ['int', 'long', 'bool']],
        'GetWindowThreadProcessId': ['int', ['long', 'int']],
        'SetWindowPos': ['bool', ['long', 'long', 'int', 'int', 'int', 'int', 'uint']],
        'SetFocus': ['long', ['long']]
    });
    
    var kernel32 = new ffi.Library('Kernel32.dll', {
        'GetCurrentThreadId': ['int', []]
    });
    
    console.log(`[WINAPP] ask WIN to focus on ${winApp}`);
    
    
    var winToSetOnTop = user32.FindWindowA(appClassName[winApp], null)
    var foregroundHWnd = user32.GetForegroundWindow()
    var currentThreadId = kernel32.GetCurrentThreadId()
    var windowThreadProcessId = user32.GetWindowThreadProcessId(foregroundHWnd, null)
    var showWindow = user32.ShowWindow(winToSetOnTop, 9)
    var setWindowPos1 = user32.SetWindowPos(winToSetOnTop, -1, 0, 0, 0, 0, 3)
    var setWindowPos2 = user32.SetWindowPos(winToSetOnTop, -2, 0, 0, 0, 0, 3)
    var setForegroundWindow = user32.SetForegroundWindow(winToSetOnTop)
    var attachThreadInput = user32.AttachThreadInput(windowThreadProcessId, currentThreadId, 0)
    var setFocus = user32.SetFocus(winToSetOnTop)
    var setActiveWindow = user32.SetActiveWindow(winToSetOnTop)   
}