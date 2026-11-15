# Frontend / Backend Integration Guide — AgriRot

Guide for backend developers connecting the Next.js frontend to the FastAPI API.
It describes the observed state of the frontend as of 15 November 2026 and the REST contract v2.0 dated
14 November 2026. The contract remains the reference for routes and payloads; the frontend
fixtures are used for demonstration only.

References: [REST contract v2.0](../../AgroRot_Contrat_API_v2.pdf),
[frontend action plan](./PLAN_ACTION.md), [shared types](../src/lib/types.ts),
[demo data](../src/lib/mocks/index.ts).

## 1. Integration status: do not confuse it with the demo

**No business call to the API is currently made.** The application screens
use the objects in `src/lib/mocks`, static variants in
`src/lib/mocks/localized.ts`, or local React state. Comments that name
endpoints and the presence of TypeScript types describe the planned wiring, not wiring that is
already in service.

In `src/`, there is no HTTP client, no business `fetch`, no API route handler,
no `Authorization` header, no `If-Match` handling, and no API URL variable. The
`next.config.ts` does not define a rewrite either. The `/api/v1/*` rewrite and the `NEXT_PUBLIC_API_URL`
variable appear in the plan as future work.

Consequences for integration tests:

- A fixture value of `data_source_status: "live"` does not prove that NASA or FastAPI
  was called.
- The climate availability banner currently depends on `?source=...` in the URL.
- Displayed data and changes do not survive a reload and are not shared between users.
- Role controls visible in the interface do not replace server-side authorisation.

## 2. Current architecture and data flows

1. A request without a language prefix goes through `src/proxy.ts`. The proxy reads the
   `NEXT_LOCALE` cookie, otherwise the browser's `Accept-Language`, then redirects to `/fr/...` or
   `/en/...`. **It checks neither the session nor permissions.**
2. Pages under `src/app/[lang]` load their dictionary with `getI18n()` and
   `src/i18n/server.ts`. Client components receive the dictionary via
   `I18nProvider`.
3. Server pages read the mocks directly. `"use client"` components keep
   modifications in `useState`; there is currently neither remote mutation nor a
   cache/invalidation layer.
4. The registration, field and priorities forms do not send a payload. Most
   navigations to the next step are links.
5. The map locally computes an area and an approximate centre of the outline. The server
   will have to validate the geometry and return the reference values.

API v2 expects calls under `/api/v1`. The frontend must send it
`Accept-Language: fr` or `en`; today the language is carried by the URL segment and the
cookie, but no API call sends this header.

## 3. Journeys, screens and endpoints to connect

| Frontend screen | Expected data and interactions | Current state |
|---|---|---|
| `/` | No business endpoint. Link to registration and example. | Localised content and static strategies example. |
| `/inscription` | `POST /auth/register`, then `POST /farms` to create the farm. `GET /regions` can supply the country/region. | Minimal password validation, pre-filled demo values; the final submission navigates to the dashboard without creating an account or a farm. |
| `/connexion` | `POST /auth/login`; on success, establish the session and load the user/farms. | Fields not wired; the button is a link to the dashboard. |
| `/tableau-de-bord` | `GET /auth/me`, `GET /farms`, then `GET /farms/{farm_id}/parcels`. The dashboard combines the profile, KPIs, outline, completeness and the latest retained strategy. | Static `currentUser`, `farms` and parcels; indicators/alert also hard-coded. |
| `/ferme/membres` | `GET /farms/{farm_id}/members`; `POST`, `PATCH` and `DELETE /farms/{farm_id}/members/{member_id}` depending on the action; transfer via `POST /farms/{farm_id}/transfer-ownership`. | Static list. The selectors/actions and the invitation form only modify/close the interface. |
| `/parcelles/nouvelle` | `GET /regions`, farm choice, then `POST /parcels` with `farm_id`, name and GeoJSON. | Initial demo outline, search without a geocoding provider, local GPS/map drawing. The button does not save the parcel. |
| `/parcelles/{parcelId}/diagnostic` | `GET /parcels/{parcel_id}/climate`. Use the source status and the qualities/alerts from the response. | `climate` series from the fixture; `?source=fallback_cache\|fallback_local` only simulates the banners. |
| `/parcelles/{parcelId}/terrain` | `GET` then `PUT /parcels/{parcel_id}/local-inputs`; `GET` then `PUT /parcels/{parcel_id}/history`; `GET /crops?region=...` for crop choices. | Fields and NASA corrections in local state; the history is a constant. No API read or save. `?role=advisor` is a demo variant. |
| `/parcelles/{parcelId}/priorites` | `GET`/`PUT /parcels/{parcel_id}/preferences`; send the ranking and excluded crops as constraints. | Order and exclusions exist only in the component; "Calculate" navigates to the strategies. |
| `/parcelles/{parcelId}/strategies` | `POST /parcels/{parcel_id}/strategies`; pass optional scenario, substitutions and/or preferences. Response: the three strategies, `computation_id`, warnings and data source. | Fixture results; only crop substitutions are editable. A simplified simulator in `src/lib/domain/simulate.ts` modifies scores locally. The interactive climate scenario is currently neutral. |
| `/parcelles/{parcelId}/strategies/{strategyId}` | Full results come from `POST /strategies`. For a retained strategy, load `GET /parcels/{parcel_id}/strategies/saved/{saved_id}`. | Detail generated from the mocks; the query `?confiance=faible` enables a demo variant. Factor labels are currently interpreted from their text. |
| `/parcelles/{parcelId}/historique` | Combine `GET /parcels/{parcel_id}/strategies/saved` and `GET /parcels/{parcel_id}/history`; load details/notes as needed. Saving is done with `POST /strategies/save`. | Static history combined in `src/lib/mocks/history.ts`. The "retain" CTA saves nothing; the success banner is derived from the first fixture. |
| Strategy export | `GET /parcels/{parcel_id}/strategies/saved/{saved_id}/export.pdf`. | `PrintButton` only calls `window.print()` in the browser. |

### Nominal flow to implement

1. **Create the account and the farm**: registration → success of `POST /auth/register` →
   farm creation via `POST /farms`. Handle a farm creation failure separately
   so as not to push the user to blindly resubmit their registration.
2. **Load the context**: profile `GET /auth/me` → farms `GET /farms` → selected farm
   and parcels `GET /farms/{farm_id}/parcels`.
3. **Create/choose a parcel**: save the polygon via `POST /parcels`, then
   load climate, field inputs, history and preferences.
4. **Prepare the computation**: save the field inputs/history and priorities with
   the current versions; launch the computation only when the preconditions are
   met.
5. **Compare and retain**: call `POST /strategies`, keep the
   `computation_id` associated with the rendering, then call `POST /strategies/save` on the
   user's explicit action. Saving is a snapshot of the displayed results,
   not just an identifier of a strategy type.
6. **Consult and share**: refresh the history, load the notes, then request
   the PDF export through the API (browser fallback if the API returns `PDF_GENERATION_FAILED`).

## 4. Catalogue of contract v2 endpoints

Base prefix: `/api/v1`. The suffixes `{farm_id}`, `{parcel_id}`, `{member_id}`,
`{saved_id}` and `{note_id}` are opaque prefixed identifiers, not array
indices. Unless otherwise stated, requests/responses are JSON.

| Domain | Methods and paths |
|---|---|
| Authentication | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`; `GET /auth/me` |
| Public reference data | `GET /regions`, `GET /crops?region=cm_yaounde` |
| Farms | `POST /farms`; `GET /farms`, `GET /farms/{farm_id}`; `PATCH` and `DELETE /farms/{farm_id}`; `POST /farms/{farm_id}/transfer-ownership` |
| Members | `GET /farms/{farm_id}/members`; `POST /farms/{farm_id}/members`; `PATCH` and `DELETE /farms/{farm_id}/members/{member_id}` |
| Parcels | `POST /parcels`; `GET /farms/{farm_id}/parcels`; `GET`, `PATCH`, `DELETE /parcels/{parcel_id}` |
| Diagnostic | `GET /parcels/{parcel_id}/climate` |
| Field data | `GET` and `PUT /parcels/{parcel_id}/local-inputs`; `GET` and `PUT /parcels/{parcel_id}/history` |
| Preferences | `GET` and `PUT /parcels/{parcel_id}/preferences` |
| Computation | `POST /parcels/{parcel_id}/strategies` |
| Retained strategies | `POST /parcels/{parcel_id}/strategies/save`; `GET /parcels/{parcel_id}/strategies/saved`; `GET /parcels/{parcel_id}/strategies/saved/{saved_id}` |
| Notes and export | `POST /parcels/{parcel_id}/strategies/saved/{saved_id}/notes`; `DELETE /parcels/{parcel_id}/strategies/saved/{saved_id}/notes/{note_id}`; `GET /parcels/{parcel_id}/strategies/saved/{saved_id}/export.pdf` |
| Health | `GET /health` |

The contract states that all routes require a bearer access token, except
`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`,
`/auth/reset-password`, `/regions`, `/crops` and `/health`. The export is
`application/pdf`.

## 5. Important data and semantics

### Identifiers, language, dates and lists

- Contract prefixes: `usr_`, `frm_`, `mbr_`, `pcl_`, `hist_`, `cmp_`, `note_`.
- API dates/timestamps: ISO 8601 UTC. The demo frontend also contains
  dates formatted for display; do not reuse them as payloads.
- Send `Accept-Language: fr` or `en`. The UI language comes from `/fr` or `/en` and from the
  `NEXT_LOCALE` cookie.
- Paginated lists use `limit` and `cursor`; process `next_cursor` until `null`.

### Parcels and geometry

The GeoJSON is a WGS84 `Polygon` with **`[longitude, latitude]`** coordinates and a
closed ring. The map locally transmits `coordinates`, but its displayed area and centre
are only previews. According to the contract, the API validates the polygon and computes
`area_ha`, `centroid`, altitude and SRTM slope. Use the response values as the
source of truth. Name/outline updates require `If-Match`.

### Climate

`ClimateResponse` provides `data_source_status` (`live`, `fallback_cache`,
`fallback_local`), `cached_at`, `monthly_series`, vulnerable periods, missing indicators
and a glossary. Each month carries a quality (`ok`, `interpolated`,
`unavailable`) and alerts such as `dry_season`, `water_stress` or `heavy_rain`.
Missing values are `null` when `quality = unavailable`; NASA sentinel values `-999`
must never be exposed. The contract describes the NASA POWER 5-second timeout and the
fallback levels.

### Field inputs and preferences

- `local-inputs` groups the soil (`texture`, `ph`, `drainage`, `organic_matter`,
  `slope_deg`, `slope_confirmed`), water/irrigation and `nasa_overrides`. The response
  provides the confidence levels, the defaults used and `version`.
- `history` represents up to three seasons; indices run from `-3` (oldest) to `-1`
  (most recent). `PUT` replaces the list. `jachere` indicates a fallow season.
- `preferences` accepts either `ranking` or `weights`, plus `constraints`
  (`excluded_crops`, equipment, labour, crops available on the market). The server
  normalises the weights and returns the source and the version.
- The current priorities form no longer offers equipment, labour and market. It
  only provides the order and crop exclusion: do not invent the other values
  in the adapter.

### Computation and strategy

`POST /parcels/{parcel_id}/strategies` is the sole business computation endpoint: it calls
`agrorot_core`, produces `existing`, `recommended` and `alternative`, and returns a
temporary `computation_id` (24 h), the applied scenario, `warnings[]`, source and
explanations. Preferences and constraints may be omitted to use the persisted ones.
The contract accepts scenarios within the following limits: rainfall from -30
to +30 %, temperature increase from 0 to 3 °C and a horizon of 0, 5 or 10 years.

Do not use the TypeScript simulator as business truth: `src/lib/domain/simulate.ts`
is a presentation approximation and `src/lib/domain/crops.ts` a partial local
catalogue. Keep the following distinctions:

- `score`: business score out of 0–100;
- `resilience_index`: stability index between 0 and 1, **never a score out of 100**;
- `confidence.score`: confidence between 0 and 1, with level `faible` (low), `moyenne` (medium) or `élevée` (high).

When all the crops of a strategy collapse under a scenario, `non_viable`
is true and a `CROP_COLLAPSE` warning is emitted. Display the `warnings` and the
server's disclaimer.

## 6. Authentication, roles and concurrency

The current Next proxy does not protect the application routes. The plan provides for
integration through Next route handlers, `httpOnly` cookies and a single renewal after
`TOKEN_EXPIRED`; none of these mechanisms is implemented yet.

The contract describes a 60-minute access token and a 7-day refresh token (proposed
values), a `POST /auth/refresh` and then a single replay of the initial request.
The API exposes the tokens in the JSON response. Before wiring, the frontend and backend
must confirm their transport with the BFF: the browser must not receive or
persist the refresh token in `localStorage`/`sessionStorage`.

Rights defined by the contract:

| Action | owner | co_farmer | advisor |
|---|---:|---:|---:|
| Read farm, members, parcels, climate, inputs, history, preferences | Yes | Yes | Yes |
| Create/modify parcel | Yes | Yes | No |
| `PUT` inputs, history, preferences | Yes | Yes | No |
| Compute/simulate a strategy | Yes | Yes | Yes |
| Retain a strategy / add an observation note | Yes | Yes | No |
| Add a validation note | No | No | Yes |
| Manage members or the farm | Yes | No | No |

These rights must be enforced by the API on every request. The demo parameter
`?role=advisor` is not an access control.

For any versioned resource, return its `version` and then send it in
`If-Match` when modifying. A `409 VERSION_CONFLICT` must trigger a
reload of the resource and an offer to resume, without silently overwriting
another member's changes.

## 7. Error format and client-side recovery

Expected uniform format, including for validation errors:

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Cette donnée a été modifiée par une autre personne.",
    "details": { "current_version": 7, "your_version": 6 },
    "request_id": "req_..."
  }
}
```

The contract also provides the `X-Request-ID` header on responses and the same identifier
in `error.request_id`. Frontend components must treat `code` as stable,
display `message` in user-facing language and keep `request_id` for support.

| Response | Expected behaviour |
|---|---|
| `401 TOKEN_EXPIRED` | Renew once then replay once; on failure, return to login without losing the entered data. |
| `403` | Do not retry; explain the refusal. Hide/disable the action according to the role, without relying only on the UI. |
| `409 VERSION_CONFLICT` | Reload, show the current version and ask the user to redo the modification. |
| `422 VALIDATION_ERROR` | Map `details.fields` to the relevant fields and display their messages. |
| `429 TOO_MANY_REQUESTS` | Respect `Retry-After` and disable the action during that delay. |
| `503` | Offer a manual retry; for reads only, at most two retries spaced 1 s then 3 s apart. No automatic retry of writes. |
| `500` | General message, display/transmit `request_id`, no automatic retry. |
| Network unavailable | Keep the entered data, signal the disconnection and offer a retry; display the available cache in read-only mode. |

Other business codes (e.g. `INVALID_POLYGON`, `PARCEL_OVERLAP`,
`NO_SUITABLE_CROP`, `EXCLUDED_CROP`, `ENGINE_UNAVAILABLE`) and their contexts are listed
in section 3 of contract v2.

## 8. Gaps and points to resolve during wiring

1. **Transport and session**: decide the BFF contract (`httpOnly` cookies, refresh) with
   the backend, then add the server client and its safeguards. Expose no backend secret
   in a `NEXT_PUBLIC_*` variable.
2. **Dynamic routes**: `generateStaticParams()` uses only the demo parcels and
   strategies. Check the rendering strategy for real identifiers
   before enabling dynamic routes.
3. **Detail identifier**: the UI route `/strategies/{strategyId}` currently takes
   `existing|recommended|alternative`, whereas the detail of a retained strategy in the
   API is addressed with `saved_id` under `/strategies/saved/{saved_id}`. Define how to
   navigate to an unsaved computation result and to a saved snapshot;
   do not confuse `strategy_id`, `computation_id` and `saved_id`.
4. **Incomplete forms**: the registration fields do not yet have
   payload serialisation; some field inputs are uncontrolled, several
   values are constants, and local states are lost when leaving the screen.
   Build the DTOs/adapters from business values, not from translated text.
5. **Types**: `src/lib/types.ts` reflects the main response objects, but does not
   yet define the DTOs for auth, regions, local inputs, history, preferences
   and saving. Climate properties are typed as `number`, whereas the contract
   allows `null` for unavailable data. Align the types before typing the
   client and the contract tests.
6. **Strategy persistence**: "retain" must call `POST /strategies/save` with
   `computation_id`, `strategy_id` and the optional note; refresh the history on
   success. Do not display a success before the server response.
7. **Real roles**: replace the hard-coded farm selector, user and roles
   with the API responses, and enforce permissions on the server side.
8. **Notifications/reminders**: notifications and reminders are fixtures/local states.
   Contract v2 does not define a notifications or reminders API; a separate contract
   must be agreed before wiring them.
9. **Map search**: the search input is not connected to a geocoder.
   The OSM/Esri basemaps are map providers, not endpoints of the AgriRot API.
10. **Default priorities**: the initial state of `PrioritiesForm` starts with
    `water_saving`, but its "reset" action puts `income` first. Choose
    the intended reference value before persisting these preferences.

## 9. Wiring checklist

- [ ] Configure the internal API URL `/api/v1` per environment, without including a secret
      in the browser bundle.
- [ ] Implement the agreed transport/session, bearer token, single refresh and real
      protection of the application screens.
- [ ] Add the typed request/response DTOs, the language header, `X-Request-ID`,
      `If-Match`, pagination and standardised error handling.
- [ ] Replace the mocks with the server reads corresponding to each screen and
      harmonise caches/revalidations after mutation.
- [ ] Wire the forms while preserving inputs during errors and conflicts.
- [ ] Send the raw outline to the server and use the metrics computed by the API.
- [ ] Call the engine via `POST /strategies`, then explicitly save the result.
- [ ] Reconcile the detail route with the strategy and save identifiers.
- [ ] Add contract tests for payloads, null values, warnings, rights and
      errors; test at least one full flow account → farm → parcel → computation →
      save → history.
- [ ] Replace the demo query-string variants with fixtures/tests, and
      remove the static `live` messages when API data is not actually
      available.
