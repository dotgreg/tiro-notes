# TTS percentage — SUB! subtask plan

<div class="meta">
Plan de tâches pour le protocole SUB! (pi dans tmux pane pi_sub, thinking high, 1 tâche par agent, contexte frais).
Ordre strict T1 → T2 → T3 → T4 (T2/T3 touchent le même fichier ; T3 dépend de T1 pour le format du status).
Pour chaque tâche : extraire la section ci-dessous dans un fichier d'instructions, puis SUB! flow. Ne PAS lancer — le user déclenche.
</div>

**Rappel global pour chaque agent** (à coller en tête de chaque instruction) :

```
Repo: /home/u1/_dev/tiro-notes (branch courante). Ponytail mode: ultra — diff minimal,
pas d'abstraction non demandée, commentaires `ponytail:` pour les raccourcis assumés.
Le rapport complet du plan: _dev/_tts_percent_plan.md (le lire d'abord).
Ne committe rien (l'utilisateur déclenche COMMIT!). Termine par une section "VALIDATION"
dans ta réponse: ce que tu as vérifié, l'output pertinent (logs), et le statut OK/FAIL de chaque point.
```

---

## T1 — Client : API `startPercent` + popup mémorise/affiche le % (5 décimales)

**Contexte** : `TtsCustomPopup` mémorise un index de chunk brut en localStorage (`tts-pos-${id}`) — l'index devient faux quand le chunking change. On passe au pourcentage 0..1 (5 décimales). L'API TTS accepte un `startPercent` en plus de `startString`. La recherche `startString` doit continuer de fonctionner (fallback).

**Fichiers** :

1. `client/src/hooks/app/useTtsPopup.hook.tsx`
   - `iTtsStatus` (ligne ~3) : ajouter `progress?: number` (0..1, 5 décimales, position dans le livre).
   - `iTtsApi.open` (ligne ~11) : `open: (content: string, opts?: { startString?: string, startPercent?: number, id?: string }) => void`.
   - `openTtsPopup` (~ligne 27) : `setTtsStartPercent(opts?.startPercent != null && opts.startPercent > 0 ? opts.startPercent : null)` ; nouveau state `ttsStartPercent: number | null` (init null).
   - `closeTtsPopup` (~ligne 40) : reset `setTtsStartPercent(null)`.
   - retour du hook (~ligne 57-67) : exposer `ttsStartPercent`.

2. `client/src/App.tsx`
   - déstructuration ligne 340 : ajouter `ttsStartPercent`.
   - `<TtsCustomPopup .../>` (ligne ~902) : ajouter `startPercent={ttsStartPercent}`. Ne pas toucher au `<TtsPopup>` legacy (894).

3. `client/src/components/TtsCustomPopup.component.tsx`
   - props : `startPercent?: number | null`.
   - helper local : `const round5 = (x: number) => Math.round(x * 100000) / 100000`.
   - **mémorisation** : nouvelle clé `const [posPct, setPosPct] = useLocalStorage<number>(`tts-pos-pct-${p.id}`, -1)`. Dans l'effet existant `[textChunks, currChunk, isPlaying]` (~ligne 184) :
     `if (textChunks.length > 1) setPosPct(round5(currChunk / (textChunks.length - 1)))`
   - **restauration** : dans l'effet de chunking (~ligne 190), remplacer le clamp actuel (`if (currChunkRef.current > ...) setCurrChunk(...)`) par :
     ```ts
     const len = chunkedText2.length - 1
     if (len > 0) {
       if (p.startPercent != null) setCurrChunk(Math.round(p.startPercent * len))
       else if (posPct >= 0)       setCurrChunk(Math.round(posPct * len))
       else if (currChunkRef.current > len) setCurrChunk(len)
     }
     ```
     puis le bloc `startString` EXISTANT reste tel quel mais ne s'applique que si `p.startPercent == null` (garder le ref `startStringAppliedRef` et son sémantique first-run).
   - **status** : à chaque `p.onUpdate({...})` (effet ~184 et close ~544) ajouter `progress: textChunks.length > 1 ? round5(currChunk / (textChunks.length - 1)) : 0`.
   - **UI** :
     - helper : `const jumpChunks = (delta: number) => playChunkDebounced(Math.max(0, Math.min(textChunks.length - 1, currChunkRef.current + delta)))`
     - rangée de boutons (~ligne 611-628) : ajouter 2 boutons texte `« 10` (→ `jumpChunks(-10)`) et `10 »` (→ `jumpChunks(10)`) — style des boutons existants.
     - au-dessus de l'input PARTS (~ligne 577) : `<div className="book-percent">Book : {textChunks.length > 1 ? Math.round(100 * currChunk / (textChunks.length - 1)) : 0}%</div>` (style discret, 1 ligne de CSS dans le StyledDiv si besoin).

**Contraintes**
- `extractToChunkPos` (tts.manager.ts) : **inchangé**.
- Tout appelant qui n'envoie pas `startPercent` (feed.js, rss, EditorArea, urlLink) doit garder exactement le comportement actuel.
- TypeScript doit compiler (`cd client && npx tsc --noEmit`).

**Validation**
- `npx tsc --noEmit` (client) → 0 erreur.
- Manuel (test env) : ouvrir le TTS popup sur un fichier texte → `Book : 0%`, bouton `10 »` saute au chunk 10 et la ligne % monte, `« 10` revient, saturation aux bornes. Changer `tts_sentences_per_part` dans les settings puis rouvrir → position proportionnelle conservée (log de chunk).

**Done when** : tsc vert, les 4 points manuels OK, diff limité aux 3 fichiers.

---

## T2 — Plugin epub : départ TTS au % du reader (fallback sentence intact)

**Contexte** : `tiro_tts()` (`plugins/epub/epub.ctag.js:619-628`) envoie `startString: pagetext` (texte de la page) → la recherche de chunk côté client échoue souvent (virgules, transformations). On envoie dorénavant les deux : le % de position du reader (5 décimales) et le texte de page (fallback). T1 doit être faite (l'API accepte `startPercent`).

**Fichier** : `plugins/epub/epub.ctag.js`

1. Listener `relocate` (ligne ~1075) — après `tiroReaderApi._storage.currentPage = { ...e.detail }` :
   ```js
   let n = Math.max(1, readerApi.view.getSectionFractions().length - 1)
   tiroReaderApi._storage.progress = Math.round(((e.detail.index + (e.detail.fraction || 0)) / n) * 100000) / 100000
   ```
   (convention `getSectionFractions().length - 1` = index max, déjà utilisée ligne 982)
   + commentaire `ponytail:` : % sections (foliate) ≠ % caractères (chunks TTS) — monotone, suffisant ; mapping exact = upgrade path.
   + commentaire sur le bord connu : `chapter === 0`/`fraction === 0` short-circuitent ce listener → `_storage.progress` peut rester stale au tout début de livre.
2. `tiro_tts()` (ligne 620-628) :
   ```js
   window.tiro_tts = () => {
     tiroReaderApi.getAllText(fullText => {
       let pagetext = tiroReaderApi.getCurrentPageText()
       window.isTts = true
       console.log(h, "TTS fullText", fullText.length, "progress", tiroReaderApi._storage.progress)
       api.call("ui.textToSpeechPopup.open",
         [fullText, { id: epubName, startPercent: tiroReaderApi._storage.progress ?? 0, startString: pagetext }],
         () => { })
     })
   }
   ```

**Contraintes**
- Ne pas toucher au bloc de polling (lignes 584-616) — c'est T3.
- Le fallback `startString` DOIT rester envoyé : page 0 du livre (`progress` ≈ 0) ou client ancien → le popup retombe sur la recherche de phrase (T1 priorise `startPercent > 0` uniquement).

**Validation**
- Test env : epub ouvert, naviguer ~40 % → `♫ Voice` → log client `[TtsCustomPopup] 🔎/startPercent` montre le départ au chunk ≈ 40 % de `textChunks`.
- Revenir **page 1** → `♫ Voice` → le popup démarre via la recherche `startString` (log `trying finding extracts`), pas au chunk 0 vide.
- Console reader : `_storage.progress` sensible au page-turn (log une valeur par relocation pendant le test).

**Done when** : les 2 validations OK, diff limité au fichier plugin.

---

## T3 — Plugin epub : sync inverse TTS → reader par % (fallback search intact)

**Contexte** : pendant la lecture TTS, le polling (`epub.ctag.js:599-616`) cherche la phrase lue dans le livre (search foliate coûteux + fragile). Depuis T1, le status TTS porte `progress` (0..1, 5 décimales) → saut direct au % du livre.

**Fichier** : `plugins/epub/epub.ctag.js` — le bloc `setInterval` (~lignes 599-616) devient :

```js
setInterval(() => {
  if (!window.isTts) return
  api.call("ui.textToSpeechPopup.getStatus", [], (ttsInfos) => {
    if (!ttsInfos.isPlaying) return
    let pct = ttsInfos.progress
    if (pct != null && pct > 0) {
      // voie % : aucun search foliate
      if (Math.abs(pct - (window.lastTtsJumpPct || -1)) < 0.002) return  // garde anti-spam
      window.lastTtsJumpPct = pct
      let n = Math.max(1, readerApi.view.getSectionFractions().length - 1)
      let pos = pct * n
      tiroReaderApi.goTo(Math.min(n, Math.floor(pos)), Math.min(1, pos - Math.floor(pos)), true)
      return
    }
    // voie ancienne (inchangée) : search de la phrase + goToCFI — fallback feed/ancien client
    let textRead = ttsInfos.currentText
    if (window.isSearchingForTTS) return
    window.isSearchingForTTS = true
    tiroReaderApi.search(textRead, cfis => {
      window.isSearchingForTTS = false
      tiroReaderApi.goToCFI(cfis[0].cfi, true)
    }, { firstOnly: true })
  })
}, secondsIntervalCheck * 1000)
```

- `window.lastTtsJumpPct` initialisé à `-1` près de `window.isTts` (~ligne 588).

**Contraintes**
- Ne pas toucher à `tiro_tts()` (T2), ni au client.
- La voie search + `goToCFI` doit rester **caractère pour caractère** fonctionnelle (fallback).
- `goTo(idx, frac, true)` : helper existant, sauvegarde la position du book comme le fait déjà la voie `goToCFI(cfi, true)`.

**Validation**
- Test env : epub + `♫ Voice` → lecture → le reader foliate se déplace au rythme du TTS ; console : `GO TO <idx> <frac>` (un par tick au-delà du garde), **pas** de log `EPUB SEARCH ... NOT CACHED` pendant la lecture epub.
- TTS depuis un article feed (status sans `progress`) → le reader... (n'est pas ouvert) — vérifier au moins que le code ne crashe pas (log de la voie search) : ouvrir le feed TTS, lecture, console sans erreur.
- Arrêt TTS → plus aucun jump.

**Done when** : les 3 validations OK, diff limité au bloc polling + la variable.

---

## T4 — Validation intégrale (E2E) + corrections cosmétiques

**Contexte** : T1-T3 faites. Vérifier le tout de bout en bout, conformément à la checklist du rapport (`_dev/_tts_percent_plan.md` §Validation), et corriger en place tout breakage mineur trouvé (pas de refactor).

**Checklist** (toutes les cases, prouver par logs/screenshots dans la réponse) :
1. Epub ~40 % → `♫ Voice` → départ ≈ 40 %.
2. Epub page 1 → `♫ Voice` → départ via `startString` (ancienne voie).
3. Changement `tts_sentences_per_part` / moteur → position proportionnelle stable.
4. Close/reopen popup depuis note (sans param) → reprise au % localStorage (`tts-pos-pct-*` dans DevTools → Application → Local Storage, valeur 5 décimales).
5. Lecture TTS → reader suit au % ; stop → s'arrête.
6. Feed TTS → sync inverse par search (fallback) sans erreur.
7. `« 10` / `10 »` + ligne `Book : X%`.
8. `npx tsc --noEmit` (client) vert.

**Done when** : 8/8 OK (ou liste explicite de ce qui coince + pourquoi), rien de commité.

---

<div class="foot">
Exécution : pour chaque Ti — quitter pi du pane, clear, `pi --thinking high`, `tmux load-buffer -b subtask <fichier de la section Ti>` + paste + Enter, poller l'arrivée du model, `wait_done.sh`, vérifier la section VALIDATION de sa sortie, puis Ti+1.
</div>
