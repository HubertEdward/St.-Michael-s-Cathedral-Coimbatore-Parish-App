# Parish App

A parishioner app for Android and iOS, and a web admin app for the parish office, built with Expo SDK 57.
One codebase serves many parishes: each parish has its own folder under `parishes/`, and every build is made
for one of them, with that parish's name, icon, store identifiers, colours, languages and content.
The first parish is St. Michael's Cathedral, Coimbatore.

The analysis, decisions and the full development plan are in the project document:
[St. Michael's Cathedral Parish App — Analysis & Development Plan](https://claude.ai/artifact/VBdCWYEbpVvnV1Q9wE22xW).

## Status: Phase 1 (static app + working mocks)

| Area | State |
| --- | --- |
| Parishioner app | Home with next Mass, weekly timetable, news and events, about, contact and directions, sacraments guide, prayers and today's Rosary, ministries, duty rosters, Mass-intention and certificate requests, in the languages the parish offers (Tamil and English so far) |
| Admin web app | Dashboard, timetable editor, announcements, events, Mass-intention queue with a printable priest's list, certificate requests, ministry rosters |
| Data | Demo store on each device (AsyncStorage / localStorage). The two apps do not share data until the Phase 2 backend (Supabase) |
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

Screens only call the data functions in `packages/core/src/data/api.ts`. In Phase 2 the demo store
(`packages/core/src/data/store.ts`) is replaced by the backend client; screens do not change.

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

For another parish, set `PARISH` first: `PARISH=<folder> npm run mobile`, or in PowerShell
`$env:PARISH='<folder>'; npm run mobile`.

## Build for the stores

Each parish is its own app in the stores. The parishioner app builds with EAS, with a pair of profiles per
parish in `apps/mobile/eas.json` that set `PARISH`:

```bash
cd apps/mobile
npx eas build --profile st-michaels-coimbatore-preview --platform android   # installable APK for testing
npx eas build --profile st-michaels-coimbatore-production --platform all    # store builds
```

St. Michael's bundle identifier `in.stmichaelscathedral.parish` is a proposal; confirm it before the first store
upload, because it cannot be changed afterwards.

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
