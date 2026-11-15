# AgriRot — frontend

Site web d'AgriRot : le cultivateur trace sa parcelle, vérifie les données climatiques de la NASA,
ajoute ce qu'il sait de son champ et ses priorités, puis compare trois rotations de cultures expliquées.

Interface en français et en anglais, pensée pour le téléphone et pour des personnes peu habituées
au vocabulaire technique.

## Pile technique

| Rôle | Outil |
|---|---|
| Application | Next.js 16 (App Router, Turbopack, Cache Components), React 19, TypeScript |
| Styles | Tailwind CSS 4 (jetons dans `src/app/globals.css`) |
| Carte et tracé | Leaflet, react-leaflet, Leaflet.draw (imagerie Esri, OpenStreetMap) |
| Graphiques | Recharts |
| Animations | GSAP (accueil) |
| Icônes | lucide-react |

## Démarrer

Node.js 20 ou plus récent.

```bash
npm install
npm run dev          # http://localhost:3000
```

Sans autre réglage, le site tourne en **mode démo** : les écrans affichent des données d'exemple et
aucun compte n'est nécessaire.

### Avec le backend

Le backend est dans le dépôt [AgriRot_Backend](https://github.com/kaziti-zef/AgriRot_Backend)
(branche `kaziti-branch`). Une fois ses trois services lancés (voir son README) :

```bash
cp .env.example .env.local
# puis dans .env.local :
# AGROROT_API_URL=http://localhost:8000/api/v1
npm run dev
```

Il faut alors créer un compte (`/fr/inscription`) : les écrans de l'application sont réservés aux
personnes connectées.

| Variable | Rôle |
|---|---|
| `AGROROT_API_URL` | Adresse de l'API avec `/api/v1`. **Vide = mode démo.** Jamais de préfixe `NEXT_PUBLIC_`. |
| `AGROROT_REFRESH_DAYS` | Facultatif : durée du cookie de renouvellement de session (7 jours). |

## Comment le site parle au backend

Le navigateur n'appelle que le site lui-même. Un relais (`src/app/api/v1/[...path]`) transmet les
requêtes au backend et garde les jetons de connexion dans des cookies `httpOnly`. Le navigateur ne voit
donc ni les jetons ni l'adresse du backend, et il n'y a pas de CORS à régler.
`src/proxy.ts` choisit la langue, protège les écrans connectés et renouvelle la session avant l'affichage.

Écrans branchés, appels utilisés et parcours vérifié : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` puis `npm start` | Version de production |
| `npm run lint` | ESLint |
| `npm run i18n:check` | Vérifie que `fr.json` et `en.json` ont les mêmes clés et variables |

Ne pas lancer `npm run build` pendant que `npm run dev` tourne dans le même dossier.

## Déployer sur Vercel

1. Importer le dépôt dans Vercel, avec **Root Directory : `frontend`**.
2. Ajouter `AGROROT_API_URL` (adresse HTTPS du backend). Sans cette variable, le site reste en mode démo.
3. Après tout changement de variable : *Redeploy*.

Détails et options d'hébergement du backend : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## Arborescence

```
src/
├── app/
│   ├── [lang]/                 pages en /fr/… et /en/…
│   │   ├── page.tsx            accueil
│   │   ├── inscription/  connexion/
│   │   └── (app)/              écrans connectés : tableau-de-bord, ferme/membres,
│   │                           parcelles/nouvelle, parcelles/[parcelId]/{diagnostic, terrain,
│   │                           priorites, strategies, strategies/[strategyId], historique}
│   ├── api/v1/[...path]/       relais vers le backend (BFF)
│   └── globals.css             jetons de couleur, typographie
├── components/                 landing, layout, map, charts, parcel, strategy, history, farm, auth, ui
├── i18n/                       dictionnaires fr/en, getI18n() côté serveur, useI18n() côté client
├── lib/
│   ├── api/                    client, routes, types générés depuis l'OpenAPI du backend
│   ├── data/server.ts          lectures pour les pages : API, ou démo si non configurée
│   ├── domain/                 cultures, aperçu local des stratégies (mode démo)
│   └── mocks/                  données de démonstration
└── proxy.ts                    langue, accès, renouvellement de session
```

## Documentation

- [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) — branchement au backend, variables, Vercel, hébergement
- [docs/CHARTE_GRAPHIQUE.md](docs/CHARTE_GRAPHIQUE.md) — couleurs, typographie, composants
- [docs/api_contract.md](docs/api_contract.md) — contrat d'API v2
- [docs/GUIDE_INTEGRATION_BACKEND.md](docs/GUIDE_INTEGRATION_BACKEND.md) — notes d'intégration écran par écran

Après une modification de l'API, régénérer les types :
`npx openapi-typescript <dossier du backend>/docs/openapi.json -o src/lib/api/schema.gen.ts`.

## Règles du projet

- Couleurs et tailles uniquement via les jetons de la charte.
- Tout texte affiché passe par les dictionnaires (`src/i18n/dictionaries`), en français et en anglais.
- Aucun détail technique sur la page d'accueil : elle s'adresse aux cultivateurs.
- Bandeau « outil d'aide à la décision » sur tous les écrans connectés.
- La stabilité (0 à 1) ne s'affiche jamais comme une note sur 100.
- Leaflet, Recharts et GSAP uniquement dans des composants client.
