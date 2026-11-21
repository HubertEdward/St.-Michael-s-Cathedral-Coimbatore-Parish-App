# Parish App

A parishioner app for Android and iOS, and a web admin app for the parish office, built with Expo SDK 57.
One codebase serves many parishes: each parish has its own folder under `parishes/`, and every build is made
for one of them, with that parish's name, icon, store identifiers, colours, languages and content.
The first parish is St. Michael's Cathedral, Coimbatore.

The plan is one shared app in the stores, where each parishioner joins one parish and that parish's admin approves
them. Until the Supabase backend (milestone M4), parish profiles are bundled and each build carries one parish;
from M4 the profiles move into a `parishes` table and the app chooses the parish at run time.

The analysis, decisions and the full development plan are in the project document:
[St. Michael's Cathedral Parish App — Analysis & Development Plan](https://claude.ai/artifact/VBdCWYEbpVvnV1Q9wE22xW).

## Status: Phase 1 (static app + working mocks)

| Area | State |
| --- | --- |
| Parishioner app | Home with next Mass, weekly timetable, news and events, about, contact and directions, sacraments guide, prayers and today's Rosary, ministries, duty rosters, Mass-intention and certificate requests, in the languages the parish offers (Tamil and English so far) |
| Admin web app | Dashboard, timetable editor, announcements, events, Mass-intention queue with a printable priest's list, certificate requests, ministry rosters |
| Data | Supabase (Postgres with row-level security, Auth, one Edge Function), shared by both apps; runs locally in Docker for development |
| Parishes | St. Michael's Cathedral, Coimbatore. Its content was gathered from public listings; see [docs/CONTENT_CHECKLIST.md](docs/CONTENT_CHECKLIST.md) for what the parish office must confirm |

## Layout

```
apps/mobile      Parishioner app (Expo Router, React Native Paper, i18next)
apps/admin       Parish office web app (Expo Router web, React Native Paper)
packages/core    Shared: types, the ParishProfile type, schedule logic, validation (zod),
                 data functions and TanStack Query hooks, Material 3 theme, prayers
parishes/        One folder per parish, plus shared/ content a parish can reuse
  select.js      Picks the parish from the PARISH environment variable
```

Screens only call the data functions in `packages/core/src/data/api.ts`, which talk to the backend.

```
supabase/migrations   The database: tables, row-level security, and the server functions behind every rule
supabase/functions    pin: sets a PIN with a one-time code from the office (forgotten PIN, new office team member)
supabase/tests        Who may do what, checked by signing in as the sample people
scripts/              Loading the sample data; pointing the apps at the local backend
```

## How a parish is selected

`PARISH` names a folder in `parishes/` (default: `st-michaels-coimbatore`). It is read at build time by:

- `apps/*/app.config.js`, which takes the app name, slug, scheme, bundle identifier, icons and splash colour
  from `parishes/<PARISH>/build.json` and `parishes/<PARISH>/assets/`;
- `apps/*/metro.config.js`, which points the `@parish/profile` import at `parishes/<PARISH>/index.ts`, so only
  that parish's content is bundled. Core code reads it as `parish` from `@parish/core`.

## Run it

Requires Node 22 and npm.

```bash
npm install
npm run mobile     # Expo dev server for the parishioner app; scan the QR code with Expo Go
npm run admin      # admin web app in the browser
npm run typecheck  # all workspaces, including every parish profile
npm test           # schedule logic tests
```

## Backend

Both apps use one Supabase backend. For development it runs on this computer in Docker (Docker Desktop must be
running); nothing is sent to the internet.

```bash
npm run backend:start     # the database, sign-in and API at http://127.0.0.1:54321 (Studio: http://127.0.0.1:54323)
npm run backend:samples   # replaces the parish's data with the sample families, groups, requests and messages
npm run backend:env       # writes apps/mobile/.env.local and apps/admin/.env.local for the local backend
npm run backend:test      # checks who may do what (needs the samples)
npm run backend:reset     # rebuilds the database from supabase/migrations (then load the samples again)
npm run backend:stop
```

`backend:env` points the parishioner app at this computer's Wi-Fi address, so a phone on the same Wi-Fi can use
it; run it again if the address changes, and restart the app. Each app reads `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from its `.env.local` (not committed).

People sign in with their phone number and a PIN; no SMS is sent. Supabase Auth keeps the PIN as the password
of a login named after the number (`packages/core/src/data/login.ts`). Requests such as Mass intentions can be
sent without an account: the app signs in anonymously, and creating an account later keeps those requests.

### Songbook

The songbook has two books from bibleintamil.com: "இறை அலைகள் – வழிபாட்டுப் பாடல்கள்", compiled by Fr. S. Agilan
SDB, who allowed the parish to use its songs (email, 17 November 2026), and the site's own song collection
("பாடல் திரட்டு" in the app). Each song belongs to its composer. A song in both books is kept once, as its இறை அலைகள்
entry. All the songs travel inside the parishioner app, gzipped to about a sixth of their size, and are searched
and filtered on the phone: nothing is downloaded, so they work anywhere. Favourites and recently opened songs are
kept on the phone.

This repo is public, so the lyrics are not in it. A script copies them once from bibleintamil.com into a `Songs`
folder beside the repo (one JSON file per book), and another packs them into `apps/mobile/src/songbook/songbook.data.js`, which git ignores.
Run both before building the app on a new computer:

```bash
npm run songs:fetch       # one-time copy into ../../Songs (slow on purpose: one page every half second, kept for reuse)
npm run songs:bundle      # packs both books into the app
```

`Songs/songs-to-check.md` lists the songs whose text the site garbled, to correct from the printed book. When the
songbook moves to the central database, `npm run backend:songs` loads the same file into its `songs` table.

With the samples loaded, the office app's parish priest is 98430 30001 and the office staff member is 98430 30002;
the parishioner app's approved family is 98430 20001. All use PIN 246810. New members of the office team sign in
the first time with a setup code the parish priest gives them.

## Clickable demo

```bash
npm run demo       # builds both apps (a few minutes), then serves the demo at http://localhost:8095
```

The demo page shows the parishioner app in a phone frame beside the parish office app, with a short list of
things to try. Start the backend and load the samples first (see Backend). Both apps use the backend, so a Mass
intention requested on the phone appears in the office queue, and the office's approvals, announcements and
timetable changes appear on the phone; so does a phone on the same Wi-Fi running the APK. "Sign out of both"
signs both apps out; `npm run backend:samples` restores the sample data. `npm run demo -- --no-build` serves the
last build; `PORT` and `PARISH` work as usual.

For another parish, set `PARISH` first: `PARISH=<folder> npm run mobile`, or in PowerShell
`$env:PARISH='<folder>'; npm run mobile`.

## Build for the stores

The parishioner app builds with EAS, with a pair of profiles per parish in `apps/mobile/eas.json` that set
`PARISH`. These make the per-parish preview and pilot builds; the store release uses the shared app's name and
package id (see the plan).

```bash
cd apps/mobile
npx eas build --profile st-michaels-coimbatore-preview --platform android   # installable APK for testing
npx eas build --profile st-michaels-coimbatore-production --platform all    # store builds
```

To build a test APK on a Windows PC instead (needs JDK 17 and the Android SDK), work from a copy of the repository
at a short path without spaces or apostrophes, such as `C:\pb\parish`; the native build fails on long or unusual
paths, and a `subst` drive does not help because React Native's code generator resolves the real path:

```powershell
npm ci
cd apps\mobile
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a   # about an hour the first time
```

The APK is at `apps\mobile\android\app\build\outputs\apk\release\app-release.apk`. It is signed with the debug key,
which is fine for installing on your own phone but not for the store.

St. Michael's bundle identifier `in.stmichaelscathedral.parish` is for preview builds only. The shared app needs
its own name and package id before the first store upload, because a package id cannot be changed afterwards.

## Adding a parish

1. Copy `parishes/st-michaels-coimbatore` to `parishes/<new-id>` (lowercase, hyphens).
2. In `index.ts`, set `id` to the folder name and replace every fact: name, place, diocese, languages, time zone,
   contacts, feast, clergy, history, ministries, timetable and colours. Reuse `shared/sacraments.ts` or give the
   parish its own guidance. TypeScript checks the result against `ParishProfile` (`npm run typecheck`).
3. In `build.json`, set the app names, slugs, schemes, a new bundle identifier and the brand colour.
4. Replace the images in `assets/` (icon, adaptive icon, splash icon, favicon).
5. Add `<new-id>-preview` and `<new-id>-production` profiles to `apps/mobile/eas.json`.
6. Start with a content checklist for the parish office, like `docs/CONTENT_CHECKLIST.md`.

CI typechecks every profile and bundles both apps for every parish folder.

## Editing content

- A parish's facts, clergy, history, ministries, timetable and colours: `parishes/<id>/index.ts`
- Sacrament guidance shared by Indian Latin-rite parishes: `parishes/shared/sacraments.ts`
- Prayers (the same for every parish): `packages/core/src/content/prayers.ts`
- Sample news, events and requests: `packages/core/src/data/seed.ts`
- Interface text: `apps/mobile/src/i18n/en.ts` and `ta.ts`

Parish text is `{ en, ta }`; when Tamil is missing the app shows English. A new interface language needs its
own strings file and an entry in `Language` (`packages/core/src/localized.ts`).
