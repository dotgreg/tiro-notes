import { getNoteAutoReloadMinutes } from "../noteStrings.manager"

const h = "[getNoteAutoReloadMinutes]"

test(`${h} : --reload-every-5m -> 5`, () => {
	expect(getNoteAutoReloadMinutes("my note\n--reload-every-5m\n- [ ] todo")).toEqual(5)
})

test(`${h} : no string -> null`, () => {
	expect(getNoteAutoReloadMinutes("my note with --table and --latex")).toEqual(null)
})

test(`${h} : out of range is clamped (0 -> 1, 99999 -> 1440)`, () => {
	expect(getNoteAutoReloadMinutes("--reload-every-0m")).toEqual(1)
	expect(getNoteAutoReloadMinutes("--reload-every-99999m")).toEqual(1440)
})

// the exact interval math WindowEditor uses
test(`${h} : 5m -> one setInterval tick per 300000 ms`, () => {
	jest.useFakeTimers()
	const onReload = jest.fn()
	const minutes = getNoteAutoReloadMinutes("--reload-every-5m")
	setInterval(onReload, minutes! * 60 * 1000)
	jest.advanceTimersByTime(300000)
	expect(onReload).toHaveBeenCalledTimes(1)
	jest.useRealTimers()
})
