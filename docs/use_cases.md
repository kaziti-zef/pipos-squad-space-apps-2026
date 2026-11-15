# AgroRot - Use Case Specification

## Table of Contents

1. Introduction
   - 1.1 Actors and multiplicity
   - 1.2 Rights matrix
   - 1.3 List of use cases
   - 1.4 Relationships between use cases
   - 1.5 Conventions
2. Module 1: Account and farm management
   - UC1 - Create an account and a farm
   - UC13 - Log in and log out
   - UC2 - Manage farm members (multiplicity of actors)
   - UC3 - View the shared dashboard
   - UC15 - Manage the farm (rename, transfer, leave, delete)
3. Module 2: Mapping and NASA diagnosis
   - UC4 - Outline a parcel on the interactive map
   - UC14 - Edit or delete a parcel
   - UC5 - View the NASA climate and environmental diagnosis
4. Module 3: Local configuration and priorities
   - UC6 - Enter local data and correct NASA data
   - UC7 - Define priorities and operational constraints
5. Module 4: Recommendation, simulation and validation
   - UC8 - Generate and compare the 3 rotation strategies
   - UC9 - View a strategy's detailed explanation sheet
   - UC10 - Simulate a climate scenario ("What if...")
   - UC11 - Manually change a crop and recalculate
6. Module 5: Follow-up, education and export
   - UC12 - Save, annotate and export the selected strategy
   - UC16 - View the "How to read these results" help
7. Appendix A - Summary of errors by use case

---

## 1. Introduction

### 1.1 Actors and multiplicity

A farm is created by 1 main farmer (owner and manager), who can associate 0 to N co-farmers (partners, family members) and 0 to N local agricultural advisors (agronomists, technicians). The same user can have a different role from one farm to another.

| Actor | Role code | Multiplicity | Role |
|---|---|---|---|
| Main farmer | `owner` | 1 per farm | Creates and manages the farm, decides on the final plan. |
| Co-farmer | `co_farmer` | 0 to N | Edits parcels and inputs, adds observations. |
| Agricultural advisor | `advisor` | 0 to N | Views, simulates, adds a validation opinion. |
| External systems | - | - | NASA POWER (direct call); pre-aggregated IMERG, SMAP, NDVI files; SRTM; `agrorot_core` engine. |

### 1.2 Rights matrix

| Action (within a farm) | Main farmer (`owner`) | Co-farmer (`co_farmer`) | Advisor (`advisor`) |
|---|---|---|---|
| View dashboard, parcels, NASA diagnosis, strategies, history | Yes | Yes | Yes |
| Calculate, compare, simulate and modify a strategy (without saving it) - UC8 to UC11 | Yes | Yes | Yes |
| Create / edit a parcel - UC4, UC14 | Yes | Yes | No |
| Delete a parcel - UC14 | Yes | No | No |
| Local inputs, NASA corrections, crop history, priorities and constraints - UC6, UC7 | Yes | Yes | No (read-only) |
| Select a strategy - UC12 | Yes | Yes | No |
| Add a field observation - UC12 | Yes | Yes | No |
| Add a validation opinion - UC12 | No | No | Yes |
| Export the PDF sheet - UC12 | Yes | Yes | Yes |
| Manage members (add, change role, remove) - UC2 | Yes | No | No |
| Rename, delete the farm, transfer ownership - UC15 | Yes | No | No |
| Leave the farm - UC15 | No (transfer first) | Yes | Yes |

### 1.3 List of use cases

| Module | Use cases | Prio. |
|---|---|---|
| 1. Accounts and farm | UC1 Create an account and a farm; UC13 Log in and log out; UC2 Manage members; UC3 View the dashboard; UC15 Manage the farm | M (UC15: S) |
| 2. Mapping and diagnosis | UC4 Outline a parcel; UC14 Edit or delete a parcel; UC5 View the NASA diagnosis | M (UC14: S) |
| 3. Local configuration | UC6 Enter local data; UC7 Define priorities and constraints | M |
| 4. Recommendation | UC8 Generate and compare 3 strategies; UC9 Explanation sheet; UC10 Simulate a climate scenario; UC11 Change a crop and recalculate | M |
| 5. Follow-up and education | UC12 Save, annotate and export; UC16 "How to read these results" help | M |

### 1.4 Relationships between use cases

| Case | Relationship | Related case |
|---|---|---|
| UC13 | Prerequisite for all other cases (open session) | UC1 to UC16 |
| UC8 | Depends on data produced by | UC5, UC6, UC7 |
| UC9, UC10, UC11 | Extend (from a displayed result) | UC8 |
| UC12 | Depends on a strategy coming from | UC8 or UC11 |
| UC16 | Accessible from | UC5, UC9, UC12 |
| UC14 | Invalidates the diagnosis and calculations of | UC5, UC8 |

### 1.5 Conventions

- **Alternative scenarios (A)**: variants that still achieve the goal of the use case. **Exceptions (E)**: error situations; the API error code is shown in parentheses (see API Contract v2, section 3).
- **Warnings**: some cases produce no error but a non-blocking warning (the `warnings` field of the responses).
- **Rules R1 to R9**: defined in the Mathematical Model document. **Priorities**: M essential, S important, C desirable.
- **Plan B**: the `data_source_status` indicator is `live`, `fallback_cache` or `fallback_local`; an information banner is displayed in all non-`live` cases.

---

## 2. Module 1: Account and farm management

### UC1 - Create an account and a farm

| | |
|---|---|
| **Actors** | Primary: main farmer. |
| **Priority / need** | M - BF1 |
| **Preconditions** | The user accesses the web application (browser or mobile PWA) and has no active session. |

**Main scenario**

1. The user opens the registration screen and enters their full name, their identifier (email or phone number) and their password.
2. They fill in their farm details: farm name, country and region (e.g. outskirts of Yaoundé).
3. The system validates the data, creates the account and the farm in a single transaction, generates the JWT tokens and opens the dashboard.

**Alternative scenarios**

- **A1 - Existing account** - the identifier is already registered: creation blocked, explicit message, redirection to login (UC13).
- **A2 - Phone identifier** - the number is normalized to international format (e.g. +237...) before the uniqueness check.
- **A3 - Registration by invitation** - the user arrives via an invitation link (UC2-A2): the "farm" step is skipped, the inviting farm is associated with them with the proposed role; they can create their own farm later.
- **A4 - Unsupported region** - the chosen region has no crop catalog: the farm is created, and a message states that strategies will only be available once the region is added (MVP: `cm_yaounde`).

**Exceptions and errors**

- **E1 - Invalid fields** - password too short (fewer than 8 characters), empty required field, malformed identifier: the error is highlighted before the API call; server-side, `VALIDATION_ERROR` (422) with the list of fields.
- **E2 - Identifier already used (server)** - `ACCOUNT_ALREADY_EXISTS` (409) if the client-side check was bypassed.
- **E3 - Network failure** - the entered values are kept in the form; message inviting the user to retry.
- **E4 - Farm creation failure** - the transaction is rolled back: neither account nor farm exists; general error message (`INTERNAL_ERROR`, 500).
- **E5 - Too many attempts** - `TOO_MANY_REQUESTS` (429) with the waiting time displayed.

**Business rules**

- The password is stored hashed. The farm name is required (3 to 80 characters).
- The creator receives the `owner` role; a farm has only one `owner`.

**Postconditions**: the account and the farm are saved; the user is authenticated with full administration rights on their farm.

**API access**: `POST /auth/register`, `POST /farms`

---

### UC13 - Log in and log out

| | |
|---|---|
| **Actors** | Primary: all users. |
| **Priority / need** | M - BF1 |
| **Preconditions** | The user has an account and no active session (login) or has an open session (logout). |

**Main scenario**

1. The user enters their identifier and password.
2. The system verifies the credentials and returns an access token and a refresh token.
3. The application opens the dashboard (UC3).

**Alternative scenarios**

- **A1 - Silent refresh** - the access token expires during use: the application obtains a new token using the refresh token, without interrupting the user.
- **A2 - Logout** - the user logs out; the refresh token is revoked, sensitive local data is erased, return to the login screen.
- **A3 - Forgotten password** (C, out of MVP if no sending service) - the user requests a reset link by email or SMS; the single-use link is valid for 1 hour; a new password is set.
- **A4 - Return to the requested page** - after a forced re-login, the user returns to the screen they were viewing.

**Exceptions and errors**

- **E1 - Incorrect credentials** - `INVALID_CREDENTIALS` (401); deliberately generic message (does not reveal whether the identifier exists).
- **E2 - Too many attempts** - `TOO_MANY_REQUESTS` (429) after 5 failures in 15 minutes; delay indicated by the `Retry-After` header.
- **E3 - Expired or revoked refresh token** - `TOKEN_EXPIRED` or `TOKEN_INVALID` (401): return to the login screen.
- **E4 - Network failure** - message "Unable to connect, please try again"; no partial state kept.

**Business rules**

- Proposed durations: access token 60 minutes, refresh token 7 days.

**Postconditions**: session opened or closed as applicable; no business data modified.

**API access**: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`

---

### UC2 - Manage farm members (multiplicity of actors)

| | |
|---|---|
| **Actors** | Primary: main farmer. Secondary (0 to N): co-farmers, agricultural advisors. |
| **Priority / need** | M - BF1, BF9 |
| **Preconditions** | The main farmer is authenticated and owns at least one farm. |

**Main scenario**

1. The farmer opens "Farm members" and clicks "Add a member".
2. They enter the identifier of a partner or advisor and choose their role: co-farmer (editing of parcels and inputs) or agricultural advisor (viewing, simulation, validation opinion).
3. The system associates the member with the farm and grants them shared access; the member list is updated.

**Alternative scenarios**

- **A1 - Change or removal** - the main farmer can at any time change a member's role or revoke their access.
- **A2 - User not found: invitation** - no account matches: the system offers to send an invitation link; the member appears with the status "pending"; upon registration (UC1-A3), they become active. The invitation expires after 7 days.
- **A3 - Manage invitations** - the farmer can resend or cancel a pending invitation.
- **A4 - A member leaves the farm** - a co-farmer or an advisor withdraws on their own (UC15).
- **A5 - Same person on several farms** - an advisor can be a member of several farms; each one appears in their dashboard (UC3).

**Exceptions and errors**

- **E1 - Member already associated** - `MEMBER_ALREADY_EXISTS` (409).
- **E2 - Self-add** - the owner cannot add themselves: `VALIDATION_ERROR` (422).
- **E3 - Removal or demotion of the owner** - `LAST_OWNER` (409): ownership must be transferred first (UC15).
- **E4 - Invalid role** - `VALIDATION_ERROR` (422); only `co_farmer` and `advisor` can be assigned.
- **E5 - Action by a non-owner** - `FORBIDDEN_ROLE` (403).
- **E6 - Access revoked during a session** - the member's next request returns `FORBIDDEN_ROLE` or `NOT_FARM_MEMBER` (403): redirection to their dashboard with a message.
- **E7 - Invitation sending failure** - the member remains "pending"; the farmer can copy the link and share it themselves.

**Business rules**

- A user has only one membership per farm. Rights follow the matrix in section 1.2.

**Postconditions**: the member list is up to date; the associated members see the farm on their own dashboard.

**API access**: `GET/POST /farms/{id}/members`, `PATCH/DELETE /farms/{id}/members/{member_id}`

---

### UC3 - View the shared dashboard

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers, advisors. |
| **Priority / need** | M - BF1 |
| **Preconditions** | The user is logged in with a valid JWT token. |

**Main scenario**

1. The system loads all farms of which the user is owner or member.
2. For the selected farm, it displays the summary map: parcel outlines, total area, last strategy selected per parcel.

**Alternative scenarios**

- **A1 - First visit with no parcel** - a welcome guide invites the user to outline a first field (UC4); for an advisor, message "no parcel yet".
- **A2 - No farm** - owner: invitation to create a farm; advisor or co-farmer without an invitation: message "waiting for an invitation".
- **A3 - Several farms** - a farm selector is displayed; the last farm viewed is remembered.
- **A4 - Parcel with no selected strategy** - the note "no strategy selected" is displayed with a button to UC8.
- **A5 - Parcel to be completed** - an indicator flags parcels whose local inputs or history are incomplete (UC6).

**Exceptions and errors**

- **E1 - Expired session** - `TOKEN_EXPIRED` (401): automatic refresh attempt; if it fails, redirection to login without loss of the inputs in progress.
- **E2 - Farm access revoked** - `NOT_FARM_MEMBER` (403): the farm disappears from the list, information message.
- **E3 - Loading failure** - error screen with a "Retry" button; if available, the latest cached version is displayed read-only with a banner.

**Business rules**

- Parcels are displayed according to rights; no data from an unlinked farm is visible.

**Postconditions**: the user has an up-to-date overview of the farm and can select a parcel to analyze.

**API access**: `GET /farms`, `GET /farms/{id}`, `GET /farms/{id}/parcels`

---

### UC15 - Manage the farm (rename, transfer, leave, delete)

| | |
|---|---|
| **Actors** | Primary: main farmer. Secondary: co-farmers and advisors (to leave). |
| **Priority / need** | S - BF10 |
| **Preconditions** | The user is a member of the farm concerned. |

**Main scenario**

1. The main farmer opens the farm settings.
2. They rename the farm or change its region, and save.
3. The system updates the farm and displays the new name to all members.

**Alternative scenarios**

- **A1 - Transfer ownership** - the farmer chooses an active co-farmer and confirms; the co-farmer becomes `owner`, the former owner becomes a co-farmer.
- **A2 - Leave the farm** - a co-farmer or an advisor leaves the farm after confirmation; their notes remain visible with their name.
- **A3 - Delete the farm** - the owner types the farm name to confirm; the farm, its parcels, inputs, strategies and notes are permanently deleted; members are informed at their next login.
- **A4 - Region change** - already saved strategies are kept but marked "calculated with another region"; a recalculation is offered.

**Exceptions and errors**

- **E1 - Owner wanting to leave** - `LAST_OWNER` (409): transfer ownership or delete the farm.
- **E2 - Transfer to an advisor or a non-member** - `VALIDATION_ERROR` (422): only an active co-farmer can become owner.
- **E3 - Incorrect confirmation** - deletion is refused as long as the name entered does not match.
- **E4 - Insufficient rights** - `FORBIDDEN_ROLE` (403) for renaming, transferring or deleting by a non-owner.
- **E5 - Concurrent modification** - `VERSION_CONFLICT` (409): the screen is reloaded with the up-to-date values.
- **E6 - Farm not found** - `FARM_NOT_FOUND` (404).

**Business rules**

- Deletion is permanent and cannot be undone.

**Postconditions**: the farm is updated, transferred, left or deleted as applicable.

**API access**: `PATCH/DELETE /farms/{id}`, `POST /farms/{id}/transfer-ownership`, `DELETE /farms/{id}/members/me`

---

## 3. Module 2: Mapping and NASA diagnosis

### UC4 - Outline a parcel on the interactive map

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers. |
| **Priority / need** | M - BF2 |
| **Preconditions** | The user is authenticated, has editing rights and is on a farm's dashboard. |

**Main scenario**

1. The user clicks "New parcel" and centers the map using the phone's GPS or the geographic search.
2. Using the drawing tool (Leaflet.draw), they place the field's vertices, close the polygon and enter a name (e.g. "North Parcel").
3. The server validates the geometry (Shapely), computes the centroid and the area in hectares, extracts the elevation and slope (SRTM) and saves the parcel in GeoJSON format.

**Alternative scenarios**

- **A1 - Geolocation denied or unavailable** - GPS access denied, or computer without HTTPS: the map opens on the center of the configured region (Yaoundé) with a search bar.
- **A2 - Search with no result** - message "place not found"; the user can move the map by hand.
- **A3 - Outline correction before validation** - undo the last vertex, clear and start over, move a vertex; the estimated area is displayed live.
- **A4 - Overlap with an existing parcel** - visual warning while drawing; at validation the server refuses (`PARCEL_OVERLAP`) and offers to adjust the outline.
- **A5 - Parcel outside the covered zone** - the parcel is accepted (the NASA diagnosis is global) but a warning states that the crop catalog is not available for this zone.

**Exceptions and errors**

- **E1 - Invalid or empty polygon** - crossing segments, fewer than 3 distinct vertices or zero area: `INVALID_POLYGON` (400); invitation to redraw the outline.
- **E2 - Area out of bounds** - `INVALID_POLYGON` (400) if the area is less than 0.01 ha or greater than 1,000 ha (proposed bounds).
- **E3 - Missing name or name already used in the farm** - `VALIDATION_ERROR` (422) or `PARCEL_NAME_TAKEN` (409).
- **E4 - SRTM unavailable** - the parcel is saved without elevation or slope (null values) with a warning; the slope must be entered manually (UC6).
- **E5 - Network failure during saving** - the outline remains displayed; "Retry" button.
- **E6 - Insufficient rights** - `FORBIDDEN_ROLE` (403) for an advisor.

**Business rules**

- The polygon is stored in GeoJSON, coordinates longitude then latitude (WGS84). The ring must be closed.

**Postconditions**: the parcel is saved with its coordinates, area, centroid and, if available, its elevation and slope.

**API access**: `POST /parcels`

---

### UC14 - Edit or delete a parcel

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers (editing). Main farmer only (deletion). |
| **Priority / need** | S - BF10 |
| **Preconditions** | The parcel exists and the user is a member of the farm with the required right. |

**Main scenario**

1. The user opens the parcel sheet and chooses "Edit".
2. They change the name and/or redraw the outline, then confirm.
3. The server revalidates the geometry, recalculates area, centroid, elevation and slope, and invalidates the cached diagnosis.

**Alternative scenarios**

- **A1 - Rename only** - since the geometry is not modified, no NASA recalculation is launched.
- **A2 - Heavily modified outline** - if the centroid moves by more than 5 km (proposed threshold), a warning states that the diagnosis must be reviewed; local inputs are kept.
- **A3 - Delete the parcel** - the owner clicks "Delete", confirms by typing the name; the parcel, its inputs, its history and its saved strategies are deleted.
- **A4 - Cancellation** - the user closes the confirmation: nothing is modified.
- **A5 - Strategies already selected** - after the outline is modified, they remain in the history with the note "calculated on the old outline".

**Exceptions and errors**

- **E1 - Parcel not found** - `PARCEL_NOT_FOUND` (404).
- **E2 - Insufficient rights** - `FORBIDDEN_ROLE` (403): deletion by a co-farmer, or any modification by an advisor.
- **E3 - Invalid or overlapping polygon** - `INVALID_POLYGON` (400) or `PARCEL_OVERLAP` (409).
- **E4 - Concurrent modification** - `VERSION_CONFLICT` (409): the screen shows the up-to-date version and offers to redo the modification.
- **E5 - Network failure** - the changes remain in the form; retry.

**Business rules**

- Deletion is permanent. PDFs already downloaded are not affected.

**Postconditions**: the parcel is updated or deleted; the dashboard is refreshed.

**API access**: `PATCH/DELETE /parcels/{id}`

---

### UC5 - View the NASA climate and environmental diagnosis

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers, advisors. |
| **Priority / need** | M - BF3 |
| **Preconditions** | The parcel is saved with a valid centroid. |

**Main scenario**

1. The server queries NASA POWER live and reads the pre-aggregated series (GPM IMERG, SMAP, MODIS NDVI, SRTM) for the parcel's grid cell.
2. The interface displays the monthly curves compared with historical normals and highlights vulnerable periods (water stress, bare soil in the rainy season).
3. The user clicks the information bubbles to read the one-sentence definition of each term (evapotranspiration, NDVI, moisture anomaly, water balance, frost risk).

**Alternative scenarios**

- **A1 - Missing values (-999)** - the server filters the error code -999; an isolated missing month is interpolated and marked as such, without blocking the display.
- **A2 - Several missing months** - if more than 2 consecutive months are missing, they are displayed as "data unavailable", not interpolated, and confidence is lowered.
- **A3 - Pre-aggregates absent for the zone** - SMAP or NDVI unavailable: the other indicators are displayed, a banner states the missing indicator, confidence drops.
- **A4 - Historical normal unavailable** - the month's curve is displayed without comparison.
- **A5 - Coarse resolution** - a note recalls the resolutions (POWER 55 x 70 km, SMAP 9 km, NDVI 250 m): the value is a regional estimate, not a measurement on the parcel (link to UC16).

**Exceptions and errors**

- **E1 - NASA POWER slow or down (Plan B)** - with no response within 5 seconds, the server serves the cached series (`data_source_status = fallback_cache`) with the cache date and an information banner.
- **E2 - No cache available** - the regional local fallback dataset is used (`fallback_local`) with a banner "regional demonstration data, not specific to your parcel"; confidence is low.
- **E3 - No source available** - `CLIMATE_DATA_UNAVAILABLE` (503): clear message, "Retry" button.
- **E4 - Outlier value or inconsistent unit** - the value is excluded or converted (mm/day to mm/month) and flagged.
- **E5 - Parcel not found or access denied** - `PARCEL_NOT_FOUND` (404) or `NOT_FARM_MEMBER` (403).

**Business rules**

- NASA POWER timeout: 5 seconds. The help texts are the five glossary definitions.

**Postconditions**: the climate and environmental context is loaded and ready for the rotation calculation.

**API access**: `GET /parcels/{id}/climate`

---

## 4. Module 3: Local configuration and priorities

### UC6 - Enter local data and correct NASA data

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers. Advisors: read-only. |
| **Priority / need** | M - BF4 |
| **Preconditions** | The parcel's NASA diagnosis is displayed (UC5) and the user has editing rights. |

**Main scenario**

1. The user fills in the field form: soil texture (sandy, loamy, clayey), pH (if known), drainage, organic matter, slope and availability of irrigation in the dry season.
2. They enter the crop history of the last 3 seasons.
3. They check the displayed satellite values and correct any estimate that differs from their observations.

**Alternative scenarios**

- **A1 - Unknown parameter (e.g. pH)** - the system applies the regional default value and lowers the input's confidence weight from 1.0 to 0.4.
- **A2 - Field correction takes priority** - any value corrected by the user replaces the satellite estimate in the engine and goes to a confidence weight of 1.0.
- **A3 - Undo a correction** - the user restores the satellite value; the confidence weight goes back to that of the estimate.
- **A4 - Incomplete history** - fewer than 3 seasons entered: accepted; unknown seasons are marked "unknown", rule R1 is not evaluated on those seasons and confidence drops.
- **A5 - Fallow season** - the user chooses "fallow / rest" for a season with no crop.
- **A6 - Slope already provided by SRTM** - the slope is pre-filled; the user confirms or corrects it (`slope_confirmed`).
- **A7 - Partial save** - the user can save the incomplete form and finish it later; the parcel's indicator (UC3-A5) remains displayed.

**Exceptions and errors**

- **E1 - Value out of range** - e.g. pH outside 3.0 to 10.0, slope outside 0 to 90 degrees, rainfall correction outside -100% to +100%: `VALIDATION_ERROR` (422) with the field concerned.
- **E2 - Crop unknown to the catalog** - `CROP_NOT_FOUND` (422); the user chooses "other crop" and its botanical family.
- **E3 - Duplicate seasons or invalid indices** - `VALIDATION_ERROR` (422).
- **E4 - Concurrent modification by another member** - `VERSION_CONFLICT` (409): the up-to-date values are displayed.
- **E5 - Insufficient rights** - `FORBIDDEN_ROLE` (403) for an advisor.
- **E6 - Network failure** - the input is kept in the form.

**Business rules**

- Any input updates the parcel's overall confidence index; strategies already calculated become "to be recalculated".

**Postconditions**: the local agronomic profile is saved; the parcel's overall confidence index is updated.

**API access**: `GET/PUT /parcels/{id}/local-inputs`, `GET/PUT /parcels/{id}/history`, `GET /crops`

---

### UC7 - Define priorities and operational constraints

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers. Advisors: read-only. |
| **Priority / need** | M - BF4 |
| **Preconditions** | The parcel's basic information is saved. |

**Main scenario**

1. The user ranks their priorities in order of importance: water saving, income, soil health, nitrogen supply, erosion control, fodder value.
2. They indicate their equipment constraints (equipment, labor), strictly excluded crops and the outlets available on the local market.
3. The system converts the ranking into normalized weights p<sub>ij</sub> that sum to 1.

**Alternative scenarios**

- **A1 - Default priorities** - if the proposed order is not changed, balanced weighting between income, water and soil health (e.g. 0.30 each) and the remainder spread across nitrogen, erosion and fodder.
- **A2 - Ties** - two priorities judged equal receive the same weight (average of ranks).
- **A3 - Direct weight setting** - an advanced user can set the weights with sliders; they are normalized to total 1.
- **A4 - Outlets not provided** - all crops in the catalog are considered sellable; a warning lowers the confidence of the "income" section.
- **A5 - Empty equipment constraints** - no constraint is applied.
- **A6 - Reinstate an excluded crop** - the user removes the crop from the exclusion list; strategies become "to be recalculated".
- **A7 - Excluded crop present in the history** - accepted: the history describes reality; the existing strategy will display it with a warning.

**Exceptions and errors**

- **E1 - Excessive exclusion** - if almost all crops in the catalog are excluded, a warning indicates that the strict rotation rules (R1 to R9) risk being compromised.
- **E2 - Fewer than 2 crops available** - `NO_CROP_AVAILABLE` (422): saving is refused until at least 2 crops remain available.
- **E3 - Invalid weights** - negative value or zero sum: `VALIDATION_ERROR` (422); a sum other than 1 is renormalized.
- **E4 - Unknown excluded or sellable crop** - `CROP_NOT_FOUND` (422).
- **E5 - Concurrent modification** - `VERSION_CONFLICT` (409).
- **E6 - Insufficient rights** - `FORBIDDEN_ROLE` (403) for an advisor.

**Business rules**

- Conversion of a ranking into weights: rank-order centroid (ROC, proposal) method or directly entered weights.

**Postconditions**: the preferences and constraints are saved and ready for the objective function of `agrorot_core`.

**API access**: `GET/PUT /parcels/{id}/preferences`

---

## 5. Module 4: Recommendation, simulation and validation

### UC8 - Generate and compare the 3 rotation strategies

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers, advisors. |
| **Priority / need** | M - BF5 |
| **Preconditions** | The parcel has its climate data (UC5), its history (UC6) and its priorities (UC7). |

**Main scenario**

1. The user clicks "Calculate strategies". The `agrorot_core` engine discards unsuitable crops (suitability below 0.3) and explores sequences over 6 seasons according to rules R1 to R9.
2. The interface displays side by side: strategy 1 (existing), strategy 2 (recommended according to priorities), strategy 3 (alternative according to a complementary profile).
3. Each strategy displays its sequence per season, its overall score (0-100), its resilience index and its confidence level (high, medium, low).

**Alternative scenarios**

- **A1 - No existing rotation** - with no history, strategy 1 simulates a control monoculture (e.g. continuous maize) to keep a point of comparison.
- **A2 - Partial history** - the existing strategy is projected from the known seasons; the sheet mentions the missing seasons.
- **A3 - Alternative too close** - if the complementary profile yields a sequence identical to the recommended one, the engine retains the best sequence that differs in at least half of the seasons.
- **A4 - Low confidence** - a banner invites the user to complete the inputs (link to UC6).
- **A5 - Long calculation** - a progress indicator is displayed; the user can cancel.
- **A6 - Results already calculated** - if nothing has changed since the last calculation, the stored results are redisplayed; an input change marks them "to be recalculated".
- **A7 - Degraded mode** - if the diagnosis comes from the cache or the fallback dataset, the confidence level is lowered and the source is indicated.

**Exceptions and errors**

- **E1 - Unsolvable constraints** - if no sequence respects all the exclusions, the engine relaxes the secondary rules (bonuses and penalties) and flags the blocking constraint in the warnings.
- **E2 - Fewer than 2 suitable crops** - `NO_SUITABLE_CROP` (422): no viable strategy; the interface explains the causes (climate, exclusions) and offers to review UC7.
- **E3 - Region without a crop catalog** - `REGION_NOT_SUPPORTED` (404).
- **E4 - Climate diagnosis unavailable** - `CLIMATE_DATA_UNAVAILABLE` (503).
- **E5 - Engine unavailable or timeout** - `ENGINE_UNAVAILABLE` (503); the latest valid results remain displayed with a banner.
- **E6 - Missing required inputs** - `PRECONDITION_FAILED` (409): the interface directs the user to the screen to complete.
- **E7 - Rights or parcel** - `NOT_FARM_MEMBER` (403) or `PARCEL_NOT_FOUND` (404).

**Business rules**

- The three strategies are always returned with the decision-support disclaimer. The alternative contains 100% different crops from the recommended one if possible.

**Postconditions**: the three strategies are displayed and stored (calculation identifier) for exploration.

**API access**: `POST /parcels/{id}/strategies`

---

### UC9 - View a strategy's detailed explanation sheet

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers, advisors. |
| **Priority / need** | M - BF6 |
| **Preconditions** | The 3 strategies are generated (UC8). |

**Main scenario**

1. The user clicks "View details" on one of the three strategies.
2. The system displays the 5 sections: **Why** (score factors), **Evidence** (NASA and field data used), **Benefits** (nitrogen, water, income), **Information gaps** (default parameters), **Risks to check locally** (rules close to the threshold).
3. A permanent banner reminds the user that the tool supports human decision-making and does not replace local agronomic expertise.

**Alternative scenarios**

- **A1 - Low confidence** - if many data are defaults, "Information gaps" moves to the top with a button to the form (UC6).
- **A2 - No risk detected** - the section remains displayed: "no risk detected by the model, to be confirmed locally".
- **A3 - Strategy modified by hand** - the sheet flags the modified seasons (UC11) and their impact on the score.
- **A4 - Degraded data source** - the "Evidence" section indicates the source (live, cache, fallback dataset).
- **A5 - Link to help** - each technical term opens its definition; a link leads to UC16.

**Exceptions and errors**

- **E1 - Outdated or missing strategy** - the inputs have changed since the calculation: `STRATEGY_NOT_FOUND` (404); invitation to recalculate (UC8).
- **E2 - Section cannot be generated** - if a datum is missing, the section displays "information unavailable"; no text is invented.

**Business rules**

- The texts are derived solely from the scores and calculation data.

**Postconditions**: the user and their advisor understand the scientific basis and the limits of the recommendation.

**API access**: data included in the response of `POST /parcels/{id}/strategies` (`explanation` field)

---

### UC10 - Simulate a climate scenario ("What if...")

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers, advisors. |
| **Priority / need** | M - BF7 |
| **Preconditions** | The 3 strategies are displayed (UC8). |

**Main scenario**

1. The user manipulates the sliders: precipitation (-30% to +30%), temperature increase (+0 to +3 °C) or horizon (today, +5 years, +10 years).
2. The engine immediately re-evaluates the trapezoidal suitability functions under these conditions.
3. Scores, resilience indices and water stress alerts of the 3 strategies are updated.

**Alternative scenarios**

- **A1 - Reset** - "Reset climate" restores the current seasonal normals.
- **A2 - Slider combination** - rainfall, temperature and horizon can be combined.
- **A3 - Before and after comparison** - the score difference relative to the starting situation is displayed for each strategy.
- **A4 - Distant horizon** - for +5 and +10 years, a note states that this is an extrapolation scenario, not a forecast.
- **A5 - Select a scenario** - if the user selects a strategy (UC12), the simulation values are saved with it.
- **A6 - Unsaved simulation** - without any action on their part, nothing is saved; leaving the screen resets the climate.

**Exceptions and errors**

- **E1 - Crop collapse** - if the simulated increase exceeds a crop's maximum bound d, its suitability falls to 0 and a red alert flags the climate incompatibility.
- **E2 - Non-viable strategy** - if all the crops of a strategy fall to 0, it is marked "non-viable".
- **E3 - Slider value out of bounds** - blocked by the interface; `INVALID_SCENARIO` (422) on the API side.
- **E4 - Slow or failed recalculation** - the latest valid result remains displayed with an indicator; `ENGINE_UNAVAILABLE` (503) in case of outage; requests are spaced out (300 ms) to avoid congestion.

**Business rules**

- Bounds: rainfall -30% to +30%, temperature +0 to +3 °C, horizons 0, 5 or 10 years.

**Postconditions**: the user sees the compared robustness of each strategy against climate change.

**API access**: `POST /parcels/{id}/strategies` (`climate_scenario` field)

---

### UC11 - Manually change a crop and recalculate

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers, advisors (without saving). |
| **Priority / need** | M - BF7 |
| **Preconditions** | A rotation strategy is displayed. |

**Main scenario**

1. The user clicks a season's card (e.g. season 3) and chooses another crop from the regional catalog list.
2. The frontend sends the modified sequence to the API.
3. The engine reapplies rules R1 to R9, recalculates bonuses and penalties, and updates the score and the explanation sheet.

**Alternative scenarios**

- **A1 - Rule violation** - two crops of the same family in a row (e.g. tomato after tomato): the test is allowed, the penalty (-25 points) applies and the R1 alert appears in the sheet.
- **A2 - Undo the modification** - one click restores the proposal generated by the engine.
- **A3 - Several seasons modified** - the user can modify several seasons; each change is flagged.
- **A4 - Unsuitable crop** - if the chosen crop's suitability is below 0.3, it is allowed with an alert.
- **A5 - Excluded crop** - excluded crops (UC7) do not appear in the default list.
- **A6 - Modification of the existing strategy** - allowed to test a variant of the current rotation.

**Exceptions and errors**

- **E1 - Unknown crop** - `CROP_NOT_FOUND` (422).
- **E2 - Excluded crop forced** - `EXCLUDED_CROP` (422) if the call bypasses the interface.
- **E3 - Season outside horizon** - `VALIDATION_ERROR` (422).
- **E4 - Recalculation failure** - the modification is cancelled, the previous state is redisplayed; `ENGINE_UNAVAILABLE` (503).
- **E5 - Outdated results** - if the inputs have changed in the meantime, invitation to recalculate.

**Business rules**

- A manual modification is not saved until the user selects the strategy (UC12).

**Postconditions**: the personalized plan is re-evaluated live according to the engine's scientific rules.

**API access**: `POST /parcels/{id}/strategies` (`manual_overrides` field)

---

## 6. Module 5: Follow-up, education and export

### UC12 - Save, annotate and export the selected strategy

| | |
|---|---|
| **Actors** | Primary: main farmer, co-farmers (select, observation). Advisors (validation opinion, export). |
| **Priority / need** | M - BF8 |
| **Preconditions** | A strategy has been generated or customized (UC8 or UC11). |

**Main scenario**

1. The user clicks "Select this strategy" to archive it in the parcel's history with today's date.
2. They enter a field observation note (or a validation opinion for the advisor), visible to all members.
3. They click "Export as PDF" to obtain a printable sheet: rotation calendar, NASA evidence, risks to check, reminder of human expertise.

**Alternative scenarios**

- **A1 - Modified or simulated strategy** - the manual modifications and the climate scenario are saved with the strategy.
- **A2 - Select again** - a new dated entry is created; the history keeps the previous versions.
- **A3 - Advisor's opinion** - an advisor adds a validation opinion without selecting the strategy.
- **A4 - Later observation** - a member adds an observation to an already archived strategy.
- **A5 - Delete a note** - the author or the owner can delete a note.
- **A6 - View the history** - list of selected strategies, sorted by date, with author and notes.
- **A7 - Educational help** - at any time the user opens "How to read these results" (UC16).

**Exceptions and errors**

- **E1 - PDF generation failure** - `PDF_GENERATION_FAILED` (503): the interface triggers the native print dialog (`window.print()`) with A4 layout.
- **E2 - Strategy not found or outdated** - `STRATEGY_NOT_FOUND` (404): rerun the calculation.
- **E3 - Note too long** - `VALIDATION_ERROR` (422) beyond 1,000 characters.
- **E4 - Network failure on save** - the entered note is kept; retry without retyping.
- **E5 - Double saving** - the button is disabled during the request.
- **E6 - Insufficient rights** - `FORBIDDEN_ROLE` (403): advisor trying to select; co-farmer trying to add a validation opinion.

**Business rules**

- Each note shows the author, their role and the date.

**Postconditions**: the decision is recorded in the farm's shared history and available offline as a printable PDF.

**API access**: `POST /parcels/{id}/strategies/save`, `GET /strategies/saved`, `POST /strategies/saved/{id}/notes`, `GET .../export.pdf`

---

### UC16 - View the "How to read these results" help

| | |
|---|---|
| **Actors** | Primary: all users. |
| **Priority / need** | M - BF8 |
| **Preconditions** | The user is logged in. |

**Main scenario**

1. The user opens the "How to read these results" screen from the menu, the diagnosis or a sheet.
2. The screen explains the difference between satellite measurement and ground measurement, the confidence levels and the limits of the tool.

**Alternative scenarios**

- **A1 - Contextual opening** - from a help bubble, the screen opens at the relevant section.
- **A2 - Offline** - the content is embedded in the application and remains available.
- **A3 - Language** - the content follows the chosen language (French, then English).

**Exceptions and errors**

- **E1 - Content unavailable** - if the content fails to load, a minimal embedded summary is displayed.

**Business rules**

- Static content, no API call.

**Postconditions**: the user understands the scope and limits of the results.

**API access**: none (content embedded in the frontend)

---

## Appendix A - Summary of errors by use case

| Code | HTTP | Use cases concerned |
|---|---|---|
| `VALIDATION_ERROR` | 422 | UC1, UC2, UC6, UC7, UC11, UC12, UC15 |
| `ACCOUNT_ALREADY_EXISTS` | 409 | UC1 |
| `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `TOKEN_INVALID` | 401 | UC3, UC13 |
| `TOO_MANY_REQUESTS` | 429 | UC1, UC13 |
| `FORBIDDEN_ROLE`, `NOT_FARM_MEMBER` | 403 | UC2 to UC15 |
| `MEMBER_ALREADY_EXISTS`, `LAST_OWNER`, `VERSION_CONFLICT` | 409 | UC2, UC6, UC7, UC14, UC15 |
| `INVALID_POLYGON` | 400 | UC4, UC14 |
| `PARCEL_OVERLAP`, `PARCEL_NAME_TAKEN` | 409 | UC4, UC14 |
| `CROP_NOT_FOUND`, `EXCLUDED_CROP`, `NO_CROP_AVAILABLE`, `NO_SUITABLE_CROP`, `INVALID_SCENARIO` | 422 | UC6, UC7, UC8, UC10, UC11 |
| `FARM_NOT_FOUND`, `PARCEL_NOT_FOUND`, `STRATEGY_NOT_FOUND`, `REGION_NOT_SUPPORTED` | 404 | UC5, UC8, UC9, UC12, UC14, UC15 |
| `PRECONDITION_FAILED` | 409 | UC8 |
| `CLIMATE_DATA_UNAVAILABLE`, `ENGINE_UNAVAILABLE`, `PDF_GENERATION_FAILED` | 503 | UC5, UC8, UC10, UC11, UC12 |

The detail of the messages and frontend actions is given in API Contract v2, section 3.
