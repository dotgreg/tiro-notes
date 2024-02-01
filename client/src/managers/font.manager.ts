import { getUserSettingsSync } from "../hooks/useUserSettings.hook"
import { deviceType, isMobile } from "./device.manager"

export const getFontSize = (decal?: number):number => {
    if (!decal) decal = 0
    // only works on desktop 
    if (deviceType() !== "desktop") return 10 + decal
    // ${parseInt(getUserSettingsSync().ui_layout_general_font_size) + 1}px
    const settingsVal = parseInt(getUserSettingsSync().ui_layout_general_font_size) || 10
    const size = settingsVal + decal
    return size
}