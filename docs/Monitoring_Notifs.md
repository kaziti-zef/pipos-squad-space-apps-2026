# 12 — Rotation Monitoring and Notifications

> Specified in the engine documentation; not part of the MVP list in the requirements. Confirm scope with the team.

When a farmer saves a rotation, it becomes the plot's **monitored rotation**. Daily, the tool compares the last 30 days of weather and the next 10 days of forecast (Meteomatics, else Open-Meteo) with what the rotation assumes. It knows the stage (before sowing, sowing window, crop in place, between crops) and notifies all farm members (farmer, co-farmer, advisor).

| Notification | Trigger |
|--------------|---------|
| Good conditions to sow / Delay sowing | Around planned sowing date: ≥ 40 mm rain (10 days past + 7 days forecast) or < 20 mm |
| Likely water shortage | Crop in place, no irrigation: over 3 weeks, crop need clearly exceeds rain (lower threshold for drought-sensitive crops) |
| Heavy rain forecast | A forecast day ≥ 50 mm (critical at 80 mm), with slope- and crop-specific advice |
| Heat wave | ≥ 2 forecast days above what the crop tolerates |
| Abnormal season / More suitable rotation | Last-month rain < 60 % or > 160 % of normal → engine recomputes "if the season continues like this"; if score drops ≥ 10 points, propose rerunning |

- The same alert is not resent within 7 days.
- Each notification carries concrete advice (mulch, weed, clear drains, wait for 20 mm before sowing…).
- Implementation reference: `services/backend/app/domain/surveillance.py`.
