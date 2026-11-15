# Branchement au backend et déploiement

État au 15 novembre 2026 : le frontend appelle l'API du backend
([AgriRot_Backend](https://github.com/kaziti-zef/AgriRot_Backend), branche `kaziti-branch`).
Sans backend configuré, il bascule seul en **mode démo** (données de `src/lib/mocks`).

## 1. Architecture

```
Navigateur ──► Next.js (Vercel)                         ──► Backend FastAPI  /api/v1
               ├─ /api/v1/[...path]  BFF : relais + jetons      (+ data-service, agrorot-core)
               │   en cookies httpOnly, 1 renouvellement
               ├─ proxy.ts : langue, accès aux écrans connectés,
               │   renouvellement de session avant le rendu
               └─ Server Components : lecture (lib/data/server.ts)
```

- Le navigateur ne parle **qu'au site** (même origine). Il ne voit jamais les jetons ni l'adresse du backend :
  **pas de CORS à configurer** côté backend pour le site déployé.
- Le BFF et `src/lib/api/` viennent du `frontend-kit/` du dépôt backend (types générés depuis
  `docs/openapi.json`). Régénérer les types après un changement d'API :
  `npx openapi-typescript <backend>/docs/openapi.json -o src/lib/api/schema.gen.ts`.

### Variables d'environnement

| Variable | Rôle |
|---|---|
| `AGROROT_API_URL` | Adresse de l'API, avec `/api/v1`. **Vide = mode démo.** |
| `AGROROT_REFRESH_DAYS` | Facultatif : durée du cookie de renouvellement (7 par défaut, comme le backend). |

Voir `.env.example`. Jamais de préfixe `NEXT_PUBLIC_`.

## 2. Écrans branchés

| Écran | Appels |
|---|---|
| Inscription | `POST /auth/register` puis `POST /farms` (région `cm_yaounde`) |
| Connexion / déconnexion | `POST /auth/login`, `POST /auth/logout` ; `?next=` ramène à la page demandée |
| Menu | `GET /auth/me`, `GET /farms` ; ferme choisie mémorisée (cookie `agr_farm`) |
| Tableau de bord | `GET /farms/{id}/parcels` (carte, surfaces, complétude) |
| Nouvelle parcelle | `POST /parcels` : surface, altitude et pente calculées par le serveur |
| Diagnostic | `GET /parcels/{id}/climate` ; bandeau si `data_source_status` ≠ `live` ; indicateurs absents signalés |
| Données terrain | `GET`/`PUT /local-inputs` et `/history` (`If-Match`) ; plan souhaité → `planned_rotation` ; corrections satellites → `nasa_overrides` |
| Priorités | `GET`/`PUT /preferences` (classement + cultures exclues) |
| Stratégies | `POST /parcels/{id}/strategies` ; changer une culture relance le calcul (`manual_overrides`) |
| Détail | `GET …/strategies/computed/{computation_id}` via `?c=` (calcul gardé 24 h) |
| Retenir | `POST …/strategies/save` (la rotation passe sous surveillance) |
| Historique | `GET …/strategies/saved` + détail, `GET /history`, ajout de note, PDF `export.pdf` |
| Notifications | `GET /notifications` toutes les 2 min, `…/read`, `read-all` |
| Membres | `GET`/`POST`/`PATCH`/`DELETE /farms/{id}/members` (lien d'invitation si le compte n'existe pas) |

Un conseiller voit les données terrain en lecture seule (rôle lu sur la ferme de la parcelle).

## 3. Tester en local

```bash
# Backend (dépôt AgriRot_Backend) : 3 services
make dev-core   # :8002
make dev-data   # :8001
make dev-back   # :8000

# Frontend
cp .env.example .env.local      # puis AGROROT_API_URL=http://localhost:8000/api/v1
npm install
npm run dev
```

Parcours vérifié de bout en bout (navigateur → BFF → backend → moteur, données NASA POWER réelles) :
inscription, ferme, parcelle, diagnostic, saisies, priorités, calcul, modification d'une culture,
détail, sauvegarde, note, PDF, notification de surveillance, membres, anglais, déconnexion,
renouvellement de session avec un jeton d'accès expiré.

## 4. Déployer le frontend sur Vercel

1. Vercel > *Add New Project* > dépôt `pipos-squad-space-apps-2026`.
2. **Root Directory : `frontend`** (le code Next.js est dans ce sous-dossier). Framework : Next.js (détecté).
3. *Environment Variables* : `AGROROT_API_URL` = adresse publique **HTTPS** du backend, avec `/api/v1`.
   Tant que le backend n'est pas en ligne : ne pas la définir → mode démo.
4. Après un changement de variable : *Redeploy* (la valeur est lue au build et à l'exécution).

## 5. Héberger le backend (choix ouvert)

Exigences : 3 services (backend public, data-service et agrorot-core internes), un disque persistant
pour SQLite et le cache NASA, une adresse HTTPS joignable depuis Vercel.

- **VPS + Docker** (prévu par le backend, dossier `deploy/` : Caddy pour le HTTPS) : le plus simple et le
  moins cher pour une démo ; 2 vCPU et 2–4 Go de RAM suffisent.
- **Railway** ou **Render** : un service par dossier `services/*`, un volume pour `/data` et `/cache`,
  `DATA_SERVICE_URL` / `CORE_SERVICE_URL` vers les adresses internes.

À régler côté backend en production : `APP_ENV=production`, `JWT_SECRET` fort (32 caractères et plus),
`PUBLIC_URL` = adresse du site Vercel (liens d'invitation et de réinitialisation).
`CORS_ORIGINS` n'est utile que si un navigateur appelle le backend directement (ce n'est pas le cas ici).

## 6. Points ouverts

- Les textes d'explication du moteur (pourquoi, preuves, bénéfices) et certains noms de cultures
  arrivent en français même en anglais (limite connue du backend).
- Le backend propose des cultures absentes de la liste du frontend (soja, mucuna, riz…) : elles
  s'affichent avec le nom fourni par l'API, sans traduction ni couleur de famille dédiée.
- Les rappels de la fiche stratégie restent une maquette en mode démo ; avec le backend, la surveillance
  démarre quand on retient une stratégie, et les alertes arrivent dans la cloche.
- Le tracé Leaflet de la nouvelle parcelle n'a pas été testé en navigateur automatisé (création testée par l'API).
