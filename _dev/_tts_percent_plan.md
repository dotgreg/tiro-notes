# TTS : position par pourcentage — plan

<div class="meta">
tiro-notes · plan only, nothing implemented yet · 4 files touched · ponytail ultra · ready for SUB! (voir `_dev/_tts_percent_subtasks.md`)
</div>

<div class="tldr">
L'idée : <b>le pourcentage 0..1 (5 décimales) remplace l'index absolu</b> partout où la position est mémorisée ou transmise. Ajout demandé depuis la v1 : la synchronisation <b>inverse</b> (TTS → epub) passe aussi au pourcentage, via `progress` dans le status TTS. L'ancienne voie texte (`startString`) reste en fallback fonctionnel partout.
</div>

## État actuel

```
epub reader (foliate)                        client
┌─────────────────────────────┐   api.call  ┌──────────────────────────────────────┐
│ tiro_tts()                  │  open(full  │ useTtsPopup: ttsPos = startString    │
│  fullText  (cached all-text)│  Text, {    │ App.tsx → TtsCustomPopup             │
│  pagetext (current page) ───┼─startString:│  chunking: textChunks[] (N chunks)   │
└─────────────────────────────┘  pagetext}) │  first run: extractToChunkPos(str) ⚠ │
   ↑ goToCFI(sentence search)  │  getStatus │  localStorage tts-pos-{id} = INDEX ⚠│
   │ (polling while playing)   └────────────┴──────────────────────────────────────┘
```

Trois points ⚠ :

1. **`tts-pos-${id}` stocke un index brut** (`TtsCustomPopup.component.tsx:68`). Si le chunking change (réglages, moteur, texte), l'index pointe ailleurs ; le clamp (ligne 204-206) tronque au lieu de re-ancrer.
2. **`startString` = texte de la page courante** (`epub.ctag.js:627` → `extractToChunkPos`, `tts.manager.ts:93`) : sous-chaîne normalisée sur re-chunks de page — virgules/coupures/transfos = `NOT FOUND` → départ au mauvais endroit.
3. **La sync inverse** (polling `getStatus` → `search(currentText)` → `goToCFI`, `epub.ctag.js:604-612`) repose sur la même recherche de phrase fragile, et coûte une search foliate à chaque tick.

## Précision : 5 décimales

Tous les pourcentages sont calculés et transmis arrondis à 5 décimales : `Math.round(x * 100000) / 100000` (0.12345). Points d'application : écriture localStorage, `progress` dans `iTtsStatus`, `_storage.progress` du plugin. L'affichage UI reste un entier % (5 décimales dans une label = bruit) ; la précision vit dans le stockage et les échanges.

## Task 1 — popup : mémoriser le pourcentage

**Fichier : `client/src/components/TtsCustomPopup.component.tsx`**

- Clé localStorage **nouvelle** `tts-pos-pct-${p.id}` : valeur = `round5(currChunk / (textChunks.length - 1))`, `-1` = jamais lu. Changer de clé = migration gratuite (les vieux indexes bruts sont abandonnés : c'était le bug, et on ne connaît plus leur dénominateur).
- **Écrire** : dans l'effet existant `[textChunks, currChunk, isPlaying]` (~ligne 184) — tout passe par là (auto-advance, saut, changement de moteur) :
  ```ts
  if (textChunks.length > 1) setPosPct(round5(currChunk / (textChunks.length - 1)))
  ```
- **Lire** : dans l'effet de chunking (~ligne 190), le clamp est remplacé par une chaîne de priorité :

```ts
const len = chunkedText2.length - 1
if (len > 0) {
  if (p.startPercent != null && p.startPercent > 0) setCurrChunk(Math.round(p.startPercent * len)) // départ reader
  else if (posPct >= 0)                             setCurrChunk(Math.round(posPct * len))         // reprise
  else if (currChunkRef.current > len)              setCurrChunk(len)                              // garde-fou existant
}
// recherche startString (chemin ancien, inchangé) — seulement si startPercent absent ou 0
```

~6 lignes modifiées, aucune nouvelle abstraction.

## Task 2 — API : `startPercent` (forward epub → TTS)

**`client/src/hooks/app/useTtsPopup.hook.tsx`** :

```ts
open: (content: string, opts?: { startString?: string, startPercent?: number, id?: string }) => void
```

State `ttsStartPercent: number | null` (set à l'open, reset au close), exposé par le hook ; `App.tsx` le passe en prop à `TtsCustomPopup`.

**`plugins/epub/epub.ctag.js`** — le % se calcule avec l'API foliate **déjà utilisée** :

- Listener `relocate` (ligne ~1075), qui reçoit déjà `{index, fraction}` :

```js
let n = Math.max(1, readerApi.view.getSectionFractions().length - 1)  // convention existante (ligne 982)
tiroReaderApi._storage.progress = Math.round(((e.detail.index + (e.detail.fraction || 0)) / n) * 100000) / 100000
```

- `tiro_tts()` (ligne 620) envoie **les deux** :

```js
api.call("ui.textToSpeechPopup.open",
  [fullText, { id: epubName, startPercent: tiroReaderApi._storage.progress ?? 0, startString: pagetext }],
  () => { })
```

Le popup priorise `startPercent > 0`, sinon retombe sur la recherche `startString` — **l'ancienne voie texte continue de fonctionner** (page 0 du livre, foliate pas encore relocalisé, version client antérieure, ou tout appelant feed/v1/rss qui n'envoie que `startString`).

## Task 3 — sync inverse : TTS → epub par pourcentage (nouveau)

**`iTtsStatus`** (`useTtsPopup.hook.tsx:3`) :

```ts
progress?: number   // 0..1, 5 décimales, position du chunk courant dans le livre
```

**`TtsCustomPopup`** : chaque appel `p.onUpdate({...})` (effet ~184, close ~544) ajoute :

```ts
progress: textChunks.length > 1 ? round5(currChunk / (textChunks.length - 1)) : 0
```

**`plugins/epub/epub.ctag.js`** — le polling existant (lignes 599-616) devient bifurqué :

```js
api.call("ui.textToSpeechPopup.getStatus", [], (ttsInfos) => {
  if (!ttsInfos.isPlaying) return
  // voie nouvelle : saut direct au % (aucune search foliate)
  let pct = ttsInfos.progress
  if (pct != null && pct > 0) {
    if (Math.abs(pct - (window.lastTtsJumpPct || 0)) < 0.002) return  // garde anti-spam
    window.lastTtsJumpPct = pct
    let n = readerApi.view.getSectionFractions().length - 1
    let pos = pct * n
    tiroReaderApi.goTo(Math.min(n, Math.floor(pos)), Math.min(1, pos - Math.floor(pos)), true)
    return
  }
  // voie ancienne, intacte : search de la phrase lue + goToCFI
  ... (code actuel, inchangé)
})
```

La voie ancienne reste **opérationnelle en fallback** : TTS ouvert depuis un feed (status sans `progress`), client antérieur, livre de 1 section. `goTo(idx, frac, true)` réutilise le helper existant (saute + sauvegarde de position, comme le fait déjà `goToCFI(cfi, true)`).

<div class="warn">
**Échelles différentes, assumé.** Le % du popup est *proportion de caractères* (chunks), le % foliate est *proportion de sections*. Les deux sont monotones 0..1 → le reader se place au bon endroit à quelques % près, jamais au mauvais chapitre. Une concordance exacte exigerait un mapping sections↔caractères : non fait, YAGNI (commentaire `ponytail:` à ce endroit).
</div>

<div class="warn">
Bord connu du `relocate` existant : `chapter === 0` ou `fraction === 0` → pas de mise à jour de `_storage`. Si le TTS ramène le reader au tout début, `_storage.progress` peut rester stale pour le *prochain* clic Voice (le saut luimême reste correct, il lit le status TTS). Pas corrigé — commenté.
</div>

## Task 4 — UI : boutons ±10 chunks + % livre

**Fichier : `TtsCustomPopup.component.tsx`**

- Helper réutilisant le chemin déjà débourbé (celui de l'input/range) :

```ts
const jumpChunks = (delta: number) =>
  playChunkDebounced(Math.max(0, Math.min(textChunks.length - 1, currChunkRef.current + delta)))
```

- Deux boutons texte dans la rangée existante (prev / play / next) : `« 10` et `10 »`.
- Au-dessus du champ PARTS (input `/ N`, ~ligne 577) :

```tsx
<div className="book-percent">Book : {textChunks.length > 1
  ? Math.round(100 * currChunk / (textChunks.length - 1)) : 0}%</div>
```

## Résumé des changements

| Fichier | Change | Taille |
|---|---|---|
| `client/src/hooks/app/useTtsPopup.hook.tsx` | `startPercent` dans `open`, state/reset, `progress` dans `iTtsStatus` | ~8 lignes |
| `client/src/App.tsx` | prop `startPercent` sur `TtsCustomPopup` | 1-2 lignes |
| `client/src/components/TtsCustomPopup.component.tsx` | clé `tts-pos-pct`, round5, chaîne de priorité, `progress` dans onUpdate, boutons ±10, ligne % livre | ~30 lignes |
| `plugins/epub/epub.ctag.js` | `_storage.progress` dans `relocate`, `tiro_tts` envoie les deux, polling bifurqué % / search | ~20 lignes |

## Validation (manuel, test env)

<span class="ok">Forward</span>
1. Epub, lire ~40 %, `♫ Voice` → popup démarre vers 40 % (log), pas de `NOT FOUND`.
2. Ouvrir `♫ Voice` sur la **page 1** (progress ≈ 0) → retombe sur la recherche `startString` : le départ fonctionne comme avant (ancienne voie opérationnelle).
3. Changer `tts_sentences_per_part` ou de moteur → position reste ~40 %.
4. Fermer/re-ouvrir depuis une note (sans param) → reprise au % mémorisé.

<span class="ok">Inverse</span>
5. Lecture TTS → le reader foliate suit la position au % (plus de search foliate dans la console, un `goTo` par tick au-delà du garde 0.2 %).
6. TTS depuis un article feed (status sans `progress`) → le reader suit via l'ancienne voie `search` + `goToCFI`.

<span class="ok">UI</span>
7. `« 10` / `10 »` sautent, saturent à 0 / dernier chunk ; lecture suit.
8. `Book : X%` bouge avec les sauts et pendant la lecture.

## Non-faits (YAGNI)

- <span class="no">Pas de</span> mapping exact sections↔caractères (voir warning ci-dessus).
- <span class="no">Pas de</span> wiring `startPercent`/`progress` dans le popup legacy `TtsPopup` (mode `tts_custom_engine_enabled = false`) — il garde le chemin `startString` seul ; on câble si tu l'utilises.
- <span class="no">Pas de</span> migration des vieux `tts-pos-*` : clé changée, anciens indexes abandonnés.

<div class="foot">
Sources : `TtsCustomPopup.component.tsx:68,184,190-224,544,577-630` · `tts.manager.ts:93` · `useTtsPopup.hook.tsx:3-11,24-43,57-67` · `App.tsx:340,894-908` · `epub.ctag.js:584-628,888,982,1075`
</div>
