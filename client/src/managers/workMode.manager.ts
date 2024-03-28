import { each } from "lodash-es"
import { iFile } from "../../../shared/types.shared"
import { userSettingsSync } from "../hooks/useUserSettings.hook"

const h = `[WORK MODE]`

const getWorkModeSettings = () => {
    const workModeEnabled = userSettingsSync.curr.privacy_work_mode_enable
    const workModeFilters = userSettingsSync.curr.privacy_work_mode_filters
    const workModeFiltersArr = workModeFilters.split(",")
    // trim each term
    workModeFiltersArr.forEach((term, i) => {
        workModeFiltersArr[i] = term.trim().toLowerCase()
    })
    return { workModeEnabled, workModeFilters, workModeFiltersArr }
}

export const workMode_filterIFiles = (files: iFile[]): iFile[] => {
    const { workModeEnabled, workModeFilters, workModeFiltersArr } = getWorkModeSettings()
    if (!workModeEnabled) return files
    // console.log("workModeFiltersArr", workModeFiltersArr)
    // const whitelistedTerms = ["work", "meeting"]
    // filtered last notes is p.lastnote with only when note.name includes a term in the array whitelistedTerms like "work" or "meeting"
    const filteredLastNotes:iFile[] = []
    each( workModeFiltersArr, term => {
        // console.log("term", term)
        const filtered = files.filter(n => n.name.toLowerCase().includes(term) || n.path.toLowerCase().includes(term))
        filteredLastNotes.push(...filtered)
    })
    console.log(`${h} filtered ${files.length} files to ${filteredLastNotes.length} files with work mode filters ${workModeFilters}`)
    return filteredLastNotes
}

export const workMode_isStringOk = (str: string): boolean => {
    const { workModeEnabled, workModeFilters, workModeFiltersArr } = getWorkModeSettings()
    if (!workModeEnabled) return true
    let found = false
    each( workModeFiltersArr, term => {
        if (str.toLowerCase().includes(term)) found = true
    })
    return found
}