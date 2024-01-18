import { getUserSettingsSync } from "../hooks/useUserSettings.hook"

export const getFontSize = (decal?: number):number => {
    if (!decal) decal = 0
    // ${parseInt(getUserSettingsSync().ui_layout_general_font_size) + 1}px
    const settingsVal = parseInt(getUserSettingsSync().ui_layout_general_font_size) || 10
    const size = settingsVal + decal
    return size
}