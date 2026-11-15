# Brancher le site sur le backend, en local et en production

Ce guide explique quelles variables régler pour que le site (Next.js) parle au backend AgriRot.
Pour le détail du déploiement Vercel, voir aussi [DEPLOIEMENT.md](./DEPLOIEMENT.md).

## Le principe en une image

```
Navigateur ──► Site Next.js (Vercel)  ──►  backend :8000  ──►  data-service :8001 (données NASA)
               /api/v1/... (BFF)            /api/v1/...    └─►  agrorot-core :8002 (moteur)
```

- Le navigateur n'appelle **jamais** le backend directement. Il appelle le site (`/api/v1/...`), et c'est le serveur
  du site (le « BFF ») qui relaie vers le backend en ajoutant le jeton de connexion.
- Le site n'a donc besoin que d'**une seule adresse** : celle du backend (`AGROROT_API_URL`).
- `data-service` et `agrorot-core` ne sont appelés que par le backend. Le site ne les connaît pas.

**Une seule variable décide de tout : `AGROROT_API_URL`.**

- Vide, le site est en **mode démo** : données d'exemple, aucun compte, aucun backend.
- Renseignée, le site passe en **mode réel** : inscription, connexion, vraies parcelles, vrais calculs.

---

## 1. En local (sur un PC)

### a) Démarrer le backend

Depuis le dépôt backend, avec Docker (le plus simple) :

```bash
cp .env.example .env        # puis ouvrir .env et vérifier les valeurs ci-dessous
docker compose up --build
```

Sans Docker, lancer les trois services, chacun dans son dossier (`services/agrorot-core`, `services/data-service`,
`services/backend`) :

```bash
uvicorn app.main:app --port 8002   # agrorot-core
uvicorn app.main:app --port 8001   # data-service
uvicorn app.main:app --port 8000   # backend
```

Vérifier que le backend répond : <http://localhost:8000/api/v1/health>.

### b) Brancher le site

Dans le dossier `frontend`, créer un fichier **`.env.local`** (il n'est pas envoyé sur GitHub) :

```bash
AGROROT_API_URL=http://localhost:8000/api/v1
```

Puis :

```bash
npm install
npm run dev
```

Ouvrir <http://localhost:3000>. En bas du menu, le voyant doit indiquer « Services NASA », et non « Mode démonstration ».

> Après toute modification de `.env.local`, **arrêter puis relancer** `npm run dev` : la variable est lue au démarrage.

### c) Tester sur un téléphone du même réseau Wi-Fi

Ouvrir `http://<adresse-IP-du-PC>:3000` sur le téléphone (exemple : `http://192.168.1.20:3000`).

- Tout fonctionne, **sauf « Ma position »** : les téléphones ne donnent leur position qu'aux sites en `https`.
  Le site l'explique à l'écran ; utiliser la recherche de lieu à la place. Une fois en ligne (Vercel est en `https`),
  la position fonctionne.
- Pour tester la position en local, lancer `npm run dev -- --experimental-https` puis ouvrir l'adresse en `https`.

---

## 2. En production

### a) Mettre le backend en ligne

Le backend doit être joignable par **une adresse publique en `https`**, par exemple `https://api.agrirot.cm`.
Le dépôt backend contient un `docker-compose.yml` prêt à l'emploi : un petit serveur (VPS) avec Docker suffit.
Railway, Render ou Fly.io conviennent aussi.

Variables du backend à régler dans son `.env` :

| Variable | Valeur en production | Pourquoi |
| --- | --- | --- |
| `APP_ENV` | `production` | Active les contrôles de sécurité au démarrage. |
| `JWT_SECRET` | une longue chaîne aléatoire | Obligatoire en production. Pour la générer : `python -c "import secrets; print(secrets.token_urlsafe(48))"`. |
| `PUBLIC_URL` | l'adresse du site, ex. `https://agrirot.vercel.app` | Sert à fabriquer les **liens d'invitation** des membres. |
| `CORS_ORIGINS` | l'adresse du site | Par précaution : le site passe par son BFF, donc le navigateur n'appelle pas le backend directement. |
| `REFRESH_TOKEN_DAYS` | `7` (par défaut) | Durée de la session. Mettre la même valeur côté site (`AGROROT_REFRESH_DAYS`). |
| `MONITORING_INTERVAL_HOURS` | `24` | Fréquence de la surveillance qui envoie les alertes (0 = désactivée). |
| `DONNEES_EN_LIGNE` | `1` | Humidité du sol, NDVI, altitude et pente lus en ligne chez la NASA si les fichiers préparés manquent. |
| `CACHE_DIR` | `/cache` (volume Docker) | Garde les données NASA déjà téléchargées entre deux redémarrages. |

Le `docker-compose.yml` règle déjà `DATA_SERVICE_URL`, `CORE_SERVICE_URL` et `DATABASE_URL`.
Il n'y a rien à changer, sauf si les services sont hébergés séparément.

### b) Brancher le site sur Vercel

Dans Vercel, aller dans **Project → Settings → Environment Variables**, puis :

| Variable | Valeur | Obligatoire |
| --- | --- | --- |
| `AGROROT_API_URL` | `https://api.agrirot.cm/api/v1` (l'adresse du backend, **avec `/api/v1`**, sans `/` final) | oui |
| `AGROROT_REFRESH_DAYS` | même valeur que `REFRESH_TOKEN_DAYS` du backend | non (7) |
| `AGROROT_API_TIMEOUT_MS` | délai maximum d'attente du backend, en ms | non (45000) |
| `NEXT_PUBLIC_GEOCODER_URL` | autre service de recherche de lieu compatible Nominatim | non |

Puis relancer un déploiement : **Deployments → … → Redeploy**. Une variable modifiée n'est prise en compte
qu'au déploiement suivant.

> Ne **jamais** préfixer `AGROROT_API_URL` par `NEXT_PUBLIC_`. L'adresse du backend doit rester côté serveur.

---

## 3. Vérifier que tout est branché

1. Ouvrir `https://<site>/api/v1/health`.
   - Une réponse JSON du backend : c'est branché.
   - `DEMO_MODE` : `AGROROT_API_URL` est vide, ou le site n'a pas été redéployé.
   - `ENGINE_UNAVAILABLE` : l'adresse est fausse, ou le backend est arrêté.
2. Créer un compte, tracer une parcelle : le diagnostic doit afficher les données NASA de la zone.

## 4. Problèmes fréquents

| Ce qu'on voit | Cause probable | Que faire |
| --- | --- | --- |
| « Mode démonstration » dans le menu | `AGROROT_API_URL` vide, ou serveur pas relancé ou redéployé | Renseigner la variable, puis relancer `npm run dev` ou redéployer. |
| « Le serveur AgriRot est injoignable » | Mauvaise adresse, backend arrêté, `http` au lieu de `https` | Tester l'adresse `…/api/v1/health` dans un navigateur. |
| « Le serveur met trop de temps à répondre » | Backend lent ou endormi (hébergement gratuit qui se met en veille) | Réessayer ; éviter les offres qui mettent le serveur en veille. |
| Retour à la connexion après chaque action | Durées de session différentes côté site et backend | Aligner `AGROROT_REFRESH_DAYS` et `REFRESH_TOKEN_DAYS`. |
| Lien d'invitation qui pointe vers `agrorot.example` | `PUBLIC_URL` non réglé dans le backend | Mettre l'adresse du site. |
| NDVI vide à la première visite d'une parcelle | Le NDVI MODIS se télécharge en arrière-plan (30 s à 2 min) | Recharger la page un peu plus tard. |
| « Ma position » refusée sur téléphone en local | Adresse en `http` | Normal en local (voir 1.c). En ligne, ça marche. |
