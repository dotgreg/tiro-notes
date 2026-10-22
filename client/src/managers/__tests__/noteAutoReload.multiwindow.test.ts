import { getNoteAutoReloadMinutes } from "../noteStrings.manager"

// Autoreload with SEVERAL windows. Each WindowEditor instance runs 2 effects:
// - autoreload: setInterval(reloadContent, minutes*60*1000) (WindowEditor.component.tsx)
// - appStatus: api.watch.appStatus subscribes a PERSISTENT listener on a fixed idReq, the api
//   never unsubscribes a persistent one (client/src/hooks/api/watch.api.hook.tsx)
// React runs an effect again (cleanup + setup) only when a dep changed; a re-setup restarts the
// setInterval countdown. simulate() models exactly that, with the deps of each code version.

const h = "[autoreload multi-window]"

type tWin = { path: string, note: string, content: string } // content = typed-in editor content
type tSim = { fires: number[], subs: number }
type tDeps = (w: tWin) => unknown[]

const PERIOD = (w: tWin) => getNoteAutoReloadMinutes(w.note)! * 60 * 1000
const win = (i: number, m: number): tWin => ({ path: `/notes/${i}.md`, note: `# n\n--reload-every-${m}m\n`, content: "" })

const simulate = (p: {
	wins: tWin[]
	reloadDeps: tDeps
	appStatusDeps: tDeps
	events: [number, number?][] // [timeMs, window typed in]
}): tSim => {
	const reloadDeps = p.wins.map(w => null as unknown[] | null)
	const statusDeps = p.wins.map(w => null as unknown[] | null)
	const lastSetup = p.wins.map(() => 0)
	const fires = p.wins.map(() => 0)
	let subs = 0
	const changed = (a: unknown[] | null, b: unknown[]) => JSON.stringify(a) !== JSON.stringify(b)
	for (const [t, typed] of p.events) {
		if (typed !== undefined) p.wins[typed].content += "x" // keystroke -> content + liveContent change
		p.wins.forEach((w, i) => {
			if (changed(statusDeps[i], p.appStatusDeps(w))) { statusDeps[i] = p.appStatusDeps(w); subs += 1 }
			const d = p.reloadDeps(w)
			if (changed(reloadDeps[i], d)) { reloadDeps[i] = d; lastSetup[i] = t } // cleanup + new setInterval
			const n = Math.floor((t - lastSetup[i]) / PERIOD(w))
			fires[i] += n
			lastSetup[i] += n * PERIOD(w)
		})
	}
	return { fires, subs }
}

// window 1 gets edited every 2 min (typing / live watch update), the 2 others are left alone,
// all 3 notes are "--reload-every-5m", 30 min of fake time
const EVENTS: [number, number?][] = Array.from({ length: 15 }, (_, i) => [(i + 1) * 2 * 60 * 1000, 1] as [number, number?])
const WINS = () => [win(0, 5), win(1, 5), win(2, 5)]

test(`${h} : fixed deps -> the 3 windows all reload, 1 appStatus listener each`, () => {
	const res = simulate({
		wins: WINS(),
		reloadDeps: w => [getNoteAutoReloadMinutes(w.note), w.path], // fixed code: minutes, not the string
		appStatusDeps: w => [w.path], // fixed code: fileContent is not used by that effect
		events: EVENTS,
	})
	expect(res.fires).toEqual([5, 5, 5]) // the 3 windows reloaded
	expect(res.subs).toEqual(3)
})

test(`${h} : liveContent as dep -> the edited window never reloads (the reported bug)`, () => {
	const res = simulate({
		wins: WINS(),
		reloadDeps: w => [w.note + w.content, w.path], // old code: deps on liveContent, the full note string as typed
		appStatusDeps: w => [w.path, w.content], // old code: deps on fileContent
		events: EVENTS,
	})
	expect(res.fires).toEqual([5, 0, 5]) // only the 2 untouched windows reloaded
	expect(res.subs).toEqual(17) // 3 windows + 1 permanent listener per extra keystroke
})

test(`${h} : each window keeps its own period (5m/5m/1m in 12min)`, () => {
	const wins = [win(0, 5), win(1, 5), win(2, 1)]
	const res = simulate({
		wins,
		reloadDeps: w => [getNoteAutoReloadMinutes(w.note), w.path],
		appStatusDeps: w => [w.path],
		events: Array.from({ length: 8 }, (_, i) => [(i + 5) * 60 * 1000] as [number, number?]),
	})
	expect(res.fires).toEqual([1, 1, 7])
	expect(res.subs).toEqual(3)
})

test(`${h} : 2 notes in 1 grid cell = 1 mounted editor, no autoreload for the other`, () => {
	// DraggableGrid mobile path mounts WindowEditor for p.grid.content[0] only
	const gridContent = [{ i: 0, file: { path: "/notes/0.md" } }]
	expect(gridContent.map(c => c.i)).toEqual([0])
	expect(gridContent[1]).toBeUndefined()
})
