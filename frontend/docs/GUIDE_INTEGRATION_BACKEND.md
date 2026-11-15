# Guide d'intégration frontend / backend — AgriRot

> **Mise à jour du 15 novembre 2026 : le branchement est fait.** Les écrans appellent l'API via le BFF
> `src/app/api/v1/[...path]` et `src/lib/data/server.ts` ; sans `AGROROT_API_URL`, le site reste en mode démo.
> État, variables et déploiement : [DEPLOIEMENT.md](./DEPLOIEMENT.md). Les sections ci-dessous décrivent
> l'état d'avant le branchement et restent utiles comme référence du contrat.

Guide destiné aux développeurs backend qui branchent le frontend Next.js sur l'API FastAPI.
Il décrit l'état observé du frontend au 15 novembre 2026 et le contrat REST v2.0 daté du
14 novembre 2026. Le contrat reste la référence des routes et des payloads ; les fixtures
frontend servent uniquement à la démonstration.

Références : [contrat REST v2.0](./api_contract.md),
[branchement et déploiement](./DEPLOIEMENT.md), [types partagés](../src/lib/types.ts),
[données de démonstration](../src/lib/mocks/index.ts).

## 1. État de l'intégration : à ne pas confondre avec la démo

**Aucun appel métier à l'API n'est actuellement effectué.** Les écrans d'application
utilisent les objets de `src/lib/mocks`, des variantes statiques dans
`src/lib/mocks/localized.ts` ou un état React local. Les commentaires qui nomment des
endpoints et la présence de types TypeScript décrivent le branchement prévu, pas un
branchement déjà en service.

Dans `src/`, il n'y a pas de client HTTP, de `fetch` métier, de route handler API,
d'en-tête `Authorization`, de gestion de `If-Match`, ni de variable d'URL d'API. Le
`next.config.ts` ne définit pas non plus de rewrite. Le rewrite `/api/v1/*` et la variable
`NEXT_PUBLIC_API_URL` figurent dans le plan comme travaux futurs.

Conséquences pour les tests d'intégration :

- Une valeur `data_source_status: "live"` d'une fixture n'atteste pas que NASA ou FastAPI
  a été appelé.
- Le bandeau de disponibilité climatique dépend aujourd'hui de `?source=...` dans l'URL.
- Les données et changements affichés ne survivent pas à un rechargement et ne sont pas
  partagés entre utilisateurs.
- Les contrôles de rôle visibles dans l'interface ne remplacent pas une autorisation
  serveur.

## 2. Architecture et flux de données actuels

1. Une requête sans préfixe de langue passe par `src/proxy.ts`. Le proxy lit le cookie
   `NEXT_LOCALE`, sinon `Accept-Language` du navigateur, puis redirige vers `/fr/...` ou
   `/en/...`. **Il ne vérifie ni la session ni les autorisations.**
2. Les pages sous `src/app/[lang]` chargent leur dictionnaire avec `getI18n()` et
   `src/i18n/server.ts`. Les composants client reçoivent le dictionnaire via
   `I18nProvider`.
3. Les pages serveur lisent directement les mocks. Les composants `"use client"` gardent
   les modifications dans `useState`; il n'y a actuellement ni mutation distante ni
   couche de cache/invalidations.
4. Les formulaires d'inscription, terrain et priorités n'envoient pas de payload. La
   plupart des navigations vers l'étape suivante sont des liens.
5. La carte calcule localement une aire et un centre approximatif du contour. Le serveur
   devra valider la géométrie et renvoyer les valeurs de référence.

L'API v2 attend les appels sous `/api/v1`. Le frontend doit lui transmettre
`Accept-Language: fr` ou `en`; aujourd'hui la langue est portée par le segment URL et le
cookie, mais aucun appel API ne transmet cet en-tête.

## 3. Parcours, écrans et endpoints à raccorder

| Écran frontend | Données et interactions attendues | État actuel |
|---|---|---|
| `/` | Aucun endpoint métier. Lien vers l'inscription et exemple. | Contenu localisé et exemple de stratégies statique. |
| `/inscription` | `POST /auth/register`, puis `POST /farms` pour créer la ferme. `GET /regions` peut fournir le pays/région. | Validation minimale du mot de passe, valeurs de démonstration préremplies ; la soumission finale navigue au tableau de bord sans créer de compte ni de ferme. |
| `/connexion` | `POST /auth/login`; en cas de succès, établir la session et charger l'utilisateur/fermes. | Champs non raccordés ; le bouton est un lien vers le tableau de bord. |
| `/tableau-de-bord` | `GET /auth/me`, `GET /farms`, puis `GET /farms/{farm_id}/parcels`. Le tableau réunit le profil, les KPI, le contour, l'exhaustivité et la dernière stratégie retenue. | `currentUser`, `farms` et parcelles statiques ; indicateurs/alerte également codés en dur. |
| `/ferme/membres` | `GET /farms/{farm_id}/members`; `POST`, `PATCH` et `DELETE /farms/{farm_id}/members/{member_id}` selon l'action ; transfert via `POST /farms/{farm_id}/transfer-ownership`. | Liste statique. Les sélecteurs/actions et le formulaire d'invitation ne font que modifier/fermer l'interface. |
| `/parcelles/nouvelle` | `GET /regions`, choix de ferme, puis `POST /parcels` avec `farm_id`, nom et GeoJSON. | Contour initial de démo, recherche sans fournisseur de géocodage, dessin GPS/carte local. Le bouton n'enregistre pas la parcelle. |
| `/parcelles/{parcelId}/diagnostic` | `GET /parcels/{parcel_id}/climate`. Utiliser le statut de source et les qualités/alertes de la réponse. | Séries `climate` de la fixture ; `?source=fallback_cache|fallback_local` simule seulement les bandeaux. |
| `/parcelles/{parcelId}/terrain` | `GET` puis `PUT /parcels/{parcel_id}/local-inputs`; `GET` puis `PUT /parcels/{parcel_id}/history`; `GET /crops?region=...` pour les choix de culture. | Champs et corrections NASA en état local ; l'historique est une constante. Aucune lecture ou sauvegarde API. `?role=advisor` est une variante de démonstration. |
| `/parcelles/{parcelId}/priorites` | `GET`/`PUT /parcels/{parcel_id}/preferences`; envoyer le classement et les cultures exclues comme contraintes. | L'ordre et exclusions existent seulement dans le composant ; « Calculer » navigue vers les stratégies. |
| `/parcelles/{parcelId}/strategies` | `POST /parcels/{parcel_id}/strategies`; transmettre scénario éventuel, substitutions et/ou préférences. Réponse : les trois stratégies, `computation_id`, avertissements et source de données. | Résultats de la fixture ; seules les substitutions de culture sont éditables. Un simulateur simplifié dans `src/lib/domain/simulate.ts` modifie localement les scores. Le scénario climatique interactif est actuellement neutre. |
| `/parcelles/{parcelId}/strategies/{strategyId}` | Les résultats complets viennent de `POST /strategies`. Pour une stratégie retenue, charger `GET /parcels/{parcel_id}/strategies/saved/{saved_id}`. | Détail généré depuis les mocks ; la query `?confiance=faible` active une variante de démo. Les libellés de facteurs sont actuellement interprétés à partir de leur texte. |
| `/parcelles/{parcelId}/historique` | Combiner `GET /parcels/{parcel_id}/strategies/saved` et `GET /parcels/{parcel_id}/history`; charger les détails/notes selon le besoin. La sauvegarde se fait avec `POST /strategies/save`. | Historique statique combiné dans `src/lib/mocks/history.ts`. Le CTA « retenir » ne sauvegarde rien ; le bandeau de succès est dérivé de la première fixture. |
| Export de stratégie | `GET /parcels/{parcel_id}/strategies/saved/{saved_id}/export.pdf`. | `PrintButton` appelle seulement `window.print()` dans le navigateur. |

### Flux nominal à mettre en place

1. **Créer le compte et la ferme** : inscription → succès de `POST /auth/register` →
   création de ferme par `POST /farms`. Traiter séparément l'échec de création de ferme
   pour ne pas pousser l'utilisateur à resoumettre aveuglément son inscription.
2. **Charger le contexte** : profil `GET /auth/me` → fermes `GET /farms` → ferme
   sélectionnée et parcelles `GET /farms/{farm_id}/parcels`.
3. **Créer/choisir une parcelle** : enregistrer le polygone via `POST /parcels`, puis
   charger climat, saisies terrain, historique et préférences.
4. **Préparer le calcul** : enregistrer les saisies terrain/historique et priorités avec
   les versions courantes ; lancer le calcul seulement quand les préconditions sont
   satisfaites.
5. **Comparer et retenir** : appeler `POST /strategies`, conserver le
   `computation_id` associé au rendu, puis appeler `POST /strategies/save` à l'action
   explicite de l'utilisateur. La sauvegarde est un instantané des résultats affichés,
   pas seulement un identifiant de type de stratégie.
6. **Consulter et partager** : rafraîchir l'historique, charger les notes, puis demander
   l'export PDF par l'API (repli navigateur si l'API renvoie `PDF_GENERATION_FAILED`).

## 4. Catalogue des endpoints du contrat v2

Préfixe de base : `/api/v1`. Les suffixes `{farm_id}`, `{parcel_id}`, `{member_id}`,
`{saved_id}` et `{note_id}` sont des identifiants opaques préfixés, pas des index de
tableau. Sauf indication contraire, les requêtes/réponses sont en JSON.

| Domaine | Méthodes et chemins |
|---|---|
| Authentification | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password` ; `GET /auth/me` |
| Référentiels publics | `GET /regions`, `GET /crops?region=cm_yaounde` |
| Fermes | `POST /farms`; `GET /farms`, `GET /farms/{farm_id}`; `PATCH` et `DELETE /farms/{farm_id}`; `POST /farms/{farm_id}/transfer-ownership` |
| Membres | `GET /farms/{farm_id}/members`; `POST /farms/{farm_id}/members`; `PATCH` et `DELETE /farms/{farm_id}/members/{member_id}` |
| Parcelles | `POST /parcels`; `GET /farms/{farm_id}/parcels`; `GET`, `PATCH`, `DELETE /parcels/{parcel_id}` |
| Diagnostic | `GET /parcels/{parcel_id}/climate` |
| Données de terrain | `GET` et `PUT /parcels/{parcel_id}/local-inputs`; `GET` et `PUT /parcels/{parcel_id}/history` |
| Préférences | `GET` et `PUT /parcels/{parcel_id}/preferences` |
| Calcul | `POST /parcels/{parcel_id}/strategies` |
| Stratégies retenues | `POST /parcels/{parcel_id}/strategies/save`; `GET /parcels/{parcel_id}/strategies/saved`; `GET /parcels/{parcel_id}/strategies/saved/{saved_id}` |
| Notes et export | `POST /parcels/{parcel_id}/strategies/saved/{saved_id}/notes`; `DELETE /parcels/{parcel_id}/strategies/saved/{saved_id}/notes/{note_id}`; `GET /parcels/{parcel_id}/strategies/saved/{saved_id}/export.pdf` |
| Santé | `GET /health` |

Le contrat indique que toutes les routes requièrent un bearer access token, sauf
`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`,
`/auth/reset-password`, `/regions`, `/crops` et `/health`. L'export est
`application/pdf`.

## 5. Données et sémantique importantes

### Identifiants, langue, dates et listes

- Préfixes du contrat : `usr_`, `frm_`, `mbr_`, `pcl_`, `hist_`, `cmp_`, `note_`.
- Dates/horodatages API : ISO 8601 UTC. Le frontend de démonstration contient également des
  dates formatées pour affichage ; ne pas les réutiliser comme payloads.
- Envoyer `Accept-Language: fr` ou `en`. La langue UI est issue de `/fr` ou `/en` et du
  cookie `NEXT_LOCALE`.
- Les listes paginées utilisent `limit` et `cursor`; traiter `next_cursor` jusqu'à `null`.

### Parcelles et géométrie

Le GeoJSON est un `Polygon` WGS84 avec des coordonnées **`[longitude, latitude]`** et un
anneau fermé. La carte transmet localement `coordinates`, mais son aire et son centre
affichés ne sont que des aperçus. Selon le contrat, l'API valide le polygone et calcule
`area_ha`, `centroid`, altitude et pente SRTM. Utiliser les valeurs de réponse comme
source de vérité. Les mises à jour de nom/contour requièrent `If-Match`.

### Climat

`ClimateResponse` fournit `data_source_status` (`live`, `fallback_cache`,
`fallback_local`), `cached_at`, `monthly_series`, périodes vulnérables, indicateurs
manquants et glossaire. Chaque mois comporte une qualité (`ok`, `interpolated`,
`unavailable`) et des alertes comme `dry_season`, `water_stress` ou `heavy_rain`.
Les valeurs manquantes sont `null` lorsque `quality = unavailable`; les valeurs sentinel
NASA `-999` ne doivent jamais être exposées. Le contrat décrit le délai NASA POWER de
5 secondes et les niveaux de repli.

### Entrées terrain et préférences

- `local-inputs` regroupe le sol (`texture`, `ph`, `drainage`, `organic_matter`,
  `slope_deg`, `slope_confirmed`), l'eau/irrigation et `nasa_overrides`. La réponse
  fournit les niveaux de confiance, les défauts utilisés et `version`.
- `history` représente jusqu'à trois saisons ; les indices sont `-3` (ancienne) à `-1`
  (récente). `PUT` remplace la liste. `jachere` indique une saison de repos.
- `preferences` accepte soit `ranking`, soit `weights`, plus `constraints`
  (`excluded_crops`, équipement, main-d'œuvre, cultures disponibles au marché). Le serveur
  normalise les poids et renvoie la source et la version.
- Le formulaire priorités actuel ne propose plus équipement, main-d'œuvre et marché. Il
  ne fournit que l'ordre et l'exclusion de cultures : ne pas inventer les autres valeurs
  dans l'adaptateur.

### Calcul et stratégie

`POST /parcels/{parcel_id}/strategies` est l'unique point de calcul métier : il appelle
`agrorot_core`, produit `existing`, `recommended` et `alternative`, et retourne un
`computation_id` temporaire (24 h), le scénario appliqué, `warnings[]`, source et
explications. Préférences et contraintes peuvent être omises pour utiliser celles
persistées. Le contrat accepte les scénarios dans les limites suivantes : pluie de -30
à +30 %, hausse de température de 0 à 3 °C et horizon 0, 5 ou 10 ans.

Ne pas utiliser le simulateur TypeScript comme vérité métier : `src/lib/domain/simulate.ts`
est une approximation de présentation et `src/lib/domain/crops.ts` un catalogue local
partiel. Conserver les distinctions suivantes :

- `score` : score métier sur 0–100 ;
- `resilience_index` : indice de stabilité entre 0 et 1, **jamais un score sur 100** ;
- `confidence.score` : confiance entre 0 et 1, avec niveau `faible`, `moyenne` ou `élevée`.

Quand toutes les cultures d'une stratégie s'effondrent sous un scénario, `non_viable`
est vrai et un avertissement `CROP_COLLAPSE` est émis. Afficher les `warnings` et le
disclaimer du serveur.

## 6. Authentification, rôles et concurrence

Le proxy Next actuel ne protège pas les routes de l'application. Le plan prévoit une
intégration par route handlers Next, cookies `httpOnly` et renouvellement unique après
`TOKEN_EXPIRED`; aucun de ces mécanismes n'est encore implémenté.

Le contrat décrit access token de 60 minutes et refresh token de 7 jours (valeurs de
proposition), un `POST /auth/refresh` puis une seule répétition de la requête initiale.
L'API expose les jetons dans la réponse JSON. Avant le branchement, frontend et backend
doivent confirmer leur transport avec le BFF : le navigateur ne doit pas recevoir ni
persister le refresh token dans `localStorage`/`sessionStorage`.

Droits définis par le contrat :

| Action | owner | co_farmer | advisor |
|---|---:|---:|---:|
| Lire ferme, membres, parcelles, climat, saisies, historique, préférences | Oui | Oui | Oui |
| Créer/modifier parcelle | Oui | Oui | Non |
| `PUT` saisies, historique, préférences | Oui | Oui | Non |
| Calculer/simuler une stratégie | Oui | Oui | Oui |
| Retenir une stratégie / ajouter une note d'observation | Oui | Oui | Non |
| Ajouter une note de validation | Non | Non | Oui |
| Gérer les membres ou la ferme | Oui | Non | Non |

Ces droits doivent être appliqués par l'API à chaque requête. Le paramètre de démo
`?role=advisor` ne constitue pas un contrôle d'accès.

Pour toute ressource versionnée, renvoyer son `version` puis envoyer celle-ci dans
`If-Match` lors d'une modification. Un `409 VERSION_CONFLICT` doit entraîner un
rechargement de la ressource et une proposition de reprise, sans écraser silencieusement
les changements d'un autre membre.

## 7. Format des erreurs et reprise côté client

Format uniforme attendu, y compris pour les erreurs de validation :

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

Le contrat prévoit aussi l'en-tête `X-Request-ID` sur les réponses et le même identifiant
dans `error.request_id`. Les composants frontend doivent traiter `code` comme stable,
afficher `message` en langage utilisateur et conserver `request_id` pour le support.

| Réponse | Comportement attendu |
|---|---|
| `401 TOKEN_EXPIRED` | Renouveler une fois puis rejouer une fois ; en cas d'échec, retour connexion sans perdre les saisies. |
| `403` | Ne pas réessayer ; expliquer le refus. Masquer/désactiver l'action selon le rôle, sans se fier uniquement à l'UI. |
| `409 VERSION_CONFLICT` | Recharger, montrer la version actuelle et demander de reprendre la modification. |
| `422 VALIDATION_ERROR` | Associer `details.fields` aux champs concernés et afficher leurs messages. |
| `429 TOO_MANY_REQUESTS` | Respecter `Retry-After` et désactiver l'action pendant ce délai. |
| `503` | Proposer une reprise manuelle ; pour les lectures uniquement, au plus deux réessais espacés de 1 s puis 3 s. Aucun réessai automatique d'écriture. |
| `500` | Message général, afficher/transmettre `request_id`, aucun réessai automatique. |
| Réseau indisponible | Garder les saisies, signaler la déconnexion et proposer une reprise ; afficher le cache disponible en lecture seule. |

Les autres codes métier (ex. `INVALID_POLYGON`, `PARCEL_OVERLAP`,
`NO_SUITABLE_CROP`, `EXCLUDED_CROP`, `ENGINE_UNAVAILABLE`) et leurs contextes figurent
dans la section 3 du contrat v2.

## 8. Écarts et points à résoudre lors du branchement

1. **Transport et session** : décider du contrat BFF (cookies `httpOnly`, refresh) avec
   le backend, puis ajouter le client serveur et ses garde-fous. N'exposer aucun secret
   backend dans une variable `NEXT_PUBLIC_*`.
2. **Routes dynamiques** : `generateStaticParams()` utilise uniquement les parcelles et
   stratégies de démonstration. Vérifier la stratégie de rendu pour les vrais identifiants
   avant d'activer des routes dynamiques.
3. **Identifiant du détail** : la route UI `/strategies/{strategyId}` prend actuellement
   `existing|recommended|alternative`, tandis que le détail d'une stratégie retenue dans
   l'API est adressé avec `saved_id` sous `/strategies/saved/{saved_id}`. Définir comment
   naviguer vers un résultat de calcul non sauvegardé et vers un instantané sauvegardé ;
   ne pas confondre `strategy_id`, `computation_id` et `saved_id`.
4. **Formulaires incomplets** : les champs de l'inscription n'ont pas encore de
   sérialisation en payload ; certains champs terrain sont non contrôlés, plusieurs
   valeurs sont des constantes, et les états locaux sont perdus en quittant l'écran.
   Construire les DTO/adaptateurs à partir des valeurs métier, pas du texte traduit.
5. **Types** : `src/lib/types.ts` reflète les principaux objets de réponse, mais ne définit
   pas encore les DTO d'auth, régions, entrées locales, historique, préférences et
   sauvegarde. Les propriétés climatiques sont typées en `number`, alors que le contrat
   autorise `null` pour les données indisponibles. Aligner les types avant de typer le
   client et les tests de contrat.
6. **Persistance de stratégie** : « retenir » doit appeler `POST /strategies/save` avec
   `computation_id`, `strategy_id` et la note éventuelle ; rafraîchir l'historique à la
   réussite. Ne pas afficher un succès avant la réponse serveur.
7. **Rôles réels** : remplacer le sélecteur ferme, l'utilisateur et les rôles codés en dur
   par les réponses API, et appliquer les permissions côté serveur.
8. **Notifications/rappels** : notifications et rappels sont des fixtures/états locaux.
   Le contrat v2 ne définit pas d'API de notifications ni de rappels ; il faut convenir
   d'un contrat séparé avant de les brancher.
9. **Recherche cartographique** : la saisie de recherche n'est pas connectée à un
   géocodeur. Les fonds de carte OSM/Esri sont des fournisseurs cartographiques, pas des
   endpoints de l'API AgriRot.
10. **Priorités par défaut** : l'état initial de `PrioritiesForm` commence par
    `water_saving`, mais son action « réinitialiser » remet `income` en premier. Choisir
    la valeur de référence voulue avant de persister ces préférences.

## 9. Checklist de raccordement

- [ ] Configurer l'URL interne de l'API `/api/v1` par environnement, sans inclure de secret
      dans le bundle navigateur.
- [ ] Implémenter le transport/session convenu, bearer token, refresh unique et protection
      réelle des écrans applicatifs.
- [ ] Ajouter les DTO typés requête/réponse, l'en-tête de langue, `X-Request-ID`,
      `If-Match`, la pagination et le traitement standardisé des erreurs.
- [ ] Remplacer les mocks par les lectures serveur correspondant à chaque écran et
      harmoniser les caches/révalidations après mutation.
- [ ] Brancher les formulaires en préservant les saisies lors des erreurs et des conflits.
- [ ] Envoyer le contour brut au serveur et utiliser les métriques calculées par l'API.
- [ ] Appeler le moteur via `POST /strategies`, puis sauvegarder explicitement le résultat.
- [ ] Réconcilier la route de détail avec les identifiants de stratégie et de sauvegarde.
- [ ] Ajouter des tests de contrat pour les payloads, valeurs nulles, warnings, droits et
      erreurs ; tester au moins un flux complet compte → ferme → parcelle → calcul →
      sauvegarde → historique.
- [ ] Remplacer les variantes query-string de démonstration par des fixtures/tests, et
      supprimer les messages `live` statiques quand les données API ne sont pas réellement
      disponibles.
