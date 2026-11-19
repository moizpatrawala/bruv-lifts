# Bruv Lifts — handoff

Tony's phone-first gym tracker, coached by Bruv. Plain static site: no build step, no server, data on the phone only.

## Files
- `index.html` — the whole app (HTML, CSS, JS inline).
- `sw.js` — offline cache. Page is network-first (3.5 s timeout), sprites/icons cache-first. **Bump `C` (currently `bruvlifts-v3`) when sprites or icons change.**
- `manifest.webmanifest`, `icon-180.png` (iOS home screen), `icon-512.png`.
- `bruv/` — sprites resized to 240 px tall from `~/Developer/bruv/sprites` (idle, talk, jump, sad, run, chain, chill, gest) plus `flex.png` cut from `~/Developer/bruv/art/bruv_ref_poses.png` (white background removed).

## Design
Dark and modern (v2, 2026-11-18; the user rejected the first sticker look). Near-black `#09090c` floor with a faint blue glow, charcoal cards `#141419`/`#1b1b22` with 1 px hairlines, electric blue `#4c76ff` for "do this", gold `#ffc83d` only for wins (PRs, streak), green `#34d399` for done. Barlow Condensed italic uppercase for headlines and numbers, Inter for text (Google Fonts, cached by the service worker). Floating glass tab bar, a gradient "today" hero card with Bruv, and Bruv's lines in a chat bubble with a round avatar. The sticker version is gone; ask before bringing any of it back.

## Data
One localStorage key, `bruvlifts.v1`:
`{v:2, created, name, unit, rest, sound, awake, ex[], routines[], workouts[], active, last{}, trophies{}}`
- `routines[]`: `{id, name, days:[0-6 JS getDay], items:[{ex, sets, reps}]}`. One routine per weekday; days with none are rest days. Default split is the user's: Mon Chest & Triceps, Tue Back & Biceps, Wed Legs A, Thu Chest & Shoulders, Fri Legs B, Sat Arms, Sun rest. The exercises are Claude's guesses until the user sends the real ones.
- Streak = training days in a row; skipping a scheduled day breaks it, rest days don't. Days before `created` never count as missed.
- `load()` migrates v1 saves (Push/Pull/Legs, weekly goal) to v2.
- Sets can carry `t` (`w` warm-up, `d` drop, `f` failure) and `rpe`. Warm-ups (`isWork()` false) are excluded from PRs, volume, set counts and "last time".
- Exercises can carry a free-text `note` (machine settings etc.). `bw:[{at,kg}]` is the bodyweight log. `smart` = smart rest on/off.
- XP/rank is derived, never stored: +10 per working set, +50 per PR, +100 per workout; ranks Baby Chimp → Bruv Himself (`RANKS`).
- Muscle map: `MAP` gives each built-in exercise primary/secondary muscles; custom exercises fall back to their group via `GROUPMAP`.
- Weights are always stored in **kg**; `unit` only changes display (lb step = 5).
- `workouts[]` sorted by `start`. Each: `{id, name, routine, start, end, items:[{ex, target:{sets,reps}|null, sets:[{w,r,at}]}]}`.
- `active` is the in-progress workout (same shape plus `cur`, per-item draft `d:{w,r}`, `restEnd`, `restDur`), so a reload mid-workout loses nothing.
- PRs are not stored; `scan()` walks every set in order and flags the ones that beat the earlier best (heaviest weight or Epley estimated 1RM; reps or added weight for bodyweight moves). The first ever session of an exercise is the baseline, never a PR.
- Export/Import (You tab) is a JSON file through the iOS share sheet. That is the only backup; the user turned down cloud sync.

## Features
Today (hero card for today's scheduled routine, or Rest day / Job done, week strip Mon–Sun with done/missed/rest, day streak), active workout (big steppers, hold to repeat, prefill from last session, overload nudge, auto-advance, rest timer with running Bruv, PR slam screen with confetti and sound, finish summary with trophies), History (18-week heatmap, workout detail, repeat, delete), Progress (Hall of PRs, per-exercise chart: est. max / heaviest / volume, bests, weekly volume bars, 18 trophies), You (name, weekly schedule + routine editor with day picker, kg/lb, rest length, sounds, wake lock, routine editor, exercise library, backup, wipe).

## v3 features (2026-11-19)
Primate ranks + XP bar, last-week recap, front/back muscle heat map with weekly sets per muscle (10–20 sweet spot), plate calculator with drawn barbell, warm-up ramp for barbell lifts, set types + RPE, Undo toast after every set, per-exercise notes, form tips (`CUES`), exercise detail sheet (rep maxes 1–15, chart, history), bodyweight log + trend, strength levels vs bodyweight (bench/squat/deadlift/OHP), smart rest (compounds ≥2:30, isolation ≤1:15, warm-ups 45 s), 1RM + % chart, shareable 1080×1350 workout card (canvas → share sheet), "add new exercises to the routine?" on finish, live workout banner on other tabs, haptics (iOS switch trick), view transitions, count-up numbers, 20 trophies.
The code for these sits in the `/* ============ v3: the insane bits ============ */` block near the end of the script.

## Run locally
```
python3 -m http.server 8765 --directory ~/Developer/gym-tracker
```

## Deploy
Same as Guitar Gym: no gh CLI or git auth on this Mac. Use the GitHub web upload page in the browser pane. The user drags the files in and signs in themselves; Claude clicks Commit. Pages serves from `main` / root. If a Pages deploy queues or fails with "try again later", re-run all jobs on the Actions run page.
Upload: `index.html`, `sw.js`, `manifest.webmanifest`, `icon-180.png`, `icon-512.png`, and the `bruv/` folder (drag the folder itself so the path is kept). Not `HANDOFF.md` if the repo is public and you'd rather keep it private (it holds nothing sensitive either way).

## On the iPhone
Open the Pages URL in **Safari** → Share → **Add to Home Screen**. Open it from the icon after that. Its storage is separate from Safari's, so log workouts from the icon only.
