# AgriRot — Charte graphique

Source de vérité visuelle du frontend. Les valeurs sont implémentées dans `src/app/globals.css` (bloc `@theme`) : **ne jamais écrire une couleur en dur dans un composant**, utiliser les classes Tailwind générées (`bg-forest`, `text-ink-muted`…).

Référence : maquette validée « AgriRot — Maquette » (13 écrans).

---

## 1. Identité

| Élément | Valeur |
|---|---|
| Nom | **AgriRot** |
| Promesse | « Des rotations qui protègent votre sol, votre eau et vos revenus. » |
| Public | **Cultivateurs**, souvent peu familiers des outils numériques et du vocabulaire scientifique. |
| Ton | Clair, rassurant, phrases courtes, mots de tous les jours (« votre champ », « la pluie », « la chaleur », « votre terre »). |
| Accueil | **Aucun détail technique** : pas de noms de sources (POWER, SMAP, NDVI…), de résolutions, de scores chiffrés ni de codes de règles (R1, R2). |
| Écrans de l'application | Termes techniques seulement quand ils sont utiles, toujours avec une bulle (i) d'explication en une phrase. |
| Posture | L'outil **soutient** la décision, il ne la prend pas. Bandeau permanent sur tous les écrans connectés. |
| Langue | Français (défaut), anglais prévu (`Accept-Language`). |
| Logo | Pictogramme officiel : 3 flèches de rotation (vert clair `#4ADE80`, ambre `#F59E0B`, vert `#16A34A`) autour d'une jeune pousse, + « AgriRot » en Poppins 700. **≥ 44 px** : PNG détouré `public/brand/agrirot-icon.png` (`BrandIcon`). **≤ 40 px** : version simplifiée en SVG (`BrandMark`, aussi `src/app/icon.svg` pour l'onglet). Icône iOS : `src/app/apple-icon.png`. Texte blanc sur fond sombre, vert forêt sur fond clair. |

## 2. Couleurs

### Marque
| Token | Hex | Usage |
|---|---|---|
| `forest-950` | `#0E3B20` | Barre latérale, sections sombres, texte sur vert feuille |
| `forest` (900) | `#14532D` | Couleur primaire : boutons principaux, titres d'accent, sélection |
| `forest-700` | `#166534` | Liens, texte vert sur fond clair (≥ 6:1 sur beige, AA) |
| `leaf` (500) | `#22C55E` | Accent : CTA sur fond sombre, élément actif du menu, anneaux de score |
| `leaf-300` | `#86EFAC` | Accent sur fond sombre (texte, icônes) |
| `leaf-100` | `#DCFCE7` | Fonds de réussite, puces légumineuses |
| `beige` | `#F5EFE6` | Fond de page de l'application |
| `sand` | `#E9E0D0` | Bandeau d'avertissement, pied de page |
| `sand-200` | `#F1ECE3` | Boutons secondaires, puces neutres |
| `line` | `#E3DACB` | Séparateurs |
| `line-soft` | `#EFE8DC` | Séparateurs internes, pistes de jauges |
| `field` | `#DCD2C2` | Bordure des champs de formulaire |
| `white` | `#FFFFFF` | Cartes |

### Texte
| Token | Hex | Usage |
|---|---|---|
| `ink` | `#17251C` | Texte principal |
| `ink-soft` | `#3B4A40` | Texte secondaire fort |
| `ink-muted` | `#55645A` | Libellés, méta-données (≥ 4,5:1 sur blanc et beige) |

### Sémantique
| Rôle | Fond | Texte / trait |
|---|---|---|
| Succès / élevé | `#DCFCE7` | `#14532D` |
| Avertissement / moyen | `#FEF3C7` (`#FFFBEB` carte) | `#78350F` / `#92400E` / icône `#B45309` |
| Erreur / critique | `#FEE2E2` | `#7F1D1D` / `#B91C1C` |
| Information / plan B cache | `#DBEAFE` | `#1E3A8A` / `#1E40AF` |
| Lecture seule (conseiller) | `#EEF2FF` | `#1E3A8A` |

### Données (graphiques)
| Série | Couleur |
|---|---|
| Pluie (barres) | `#3B82F6` |
| Normale (ligne) | `#1E293B` (pluie), `#9CA3AF` pointillé (température) |
| Température | `#EA580C` |
| Humidité du sol + / − | `#0E7490` / `#C2410C` |
| NDVI | `#15803D` (seuils : 0,2 `#C2410C` · 0,6 `#15803D`, pointillés) |
| Bande stress hydrique | `rgba(245,158,11,.28)` |
| Bande sol nu | `rgba(146,64,14,.18)` |
| Mois sélectionné | `rgba(20,83,45,.12)` |

### Familles botaniques (pastilles des saisons)
| Famille | Pastille | Fond de carte de culture |
|---|---|---|
| Poaceae (maïs) | `#F59E0B` | `#FEF3C7` |
| Fabaceae (niébé, arachide, haricot) | `#22C55E` | `#DCFCE7` |
| Euphorbiaceae (manioc) | `#A16207` | `#EDE3D3` |
| Convolvulaceae (patate douce) | `#C2410C` | `#FDE7D7` |
| Dioscoreaceae (igname) | `#7C3AED` | `#F3E8FF` |
| Solanaceae (tomate) | `#DC2626` | `#FEE2E2` |
| Musaceae (plantain) | `#0E7490` | `#CFFAFE` |

### Priorités
| Priorité | Fond | Icône | Barre de poids |
|---|---|---|---|
| Économiser l'eau | `#DBEAFE` | `#1E40AF` | `#3B82F6` |
| Revenu | `#FEF3C7` | `#92400E` | `#F59E0B` |
| Santé du sol | `#EDE3D3` | `#5B3A12` | `#A16207` |
| Apport en azote | `#DCFCE7` | `#14532D` | `#22C55E` |
| Lutte contre l'érosion | `#FDE7D7` | `#9A3412` | `#EA580C` |
| Valeur fourragère | `#F3E8FF` | `#6B21A8` | `#A855F7` |

### Seuils de lecture
- **Score** (0–100) : ≥ 75 vert `#15803D` · 50–74 ambre `#D97706` · < 50 rouge `#B91C1C`.
- **Confiance** : ≥ 0,80 élevée · 0,60–0,79 moyenne · < 0,60 faible.
- **Stabilité** (résilience 0–1) : ≥ 0,85 très bonne · 0,70–0,84 bonne · < 0,70 faible. **Jamais affichée sur 100.**

## 3. Typographie

| Rôle | Police | Taille / graisse / interligne |
|---|---|---|
| Display (héros) | Poppins | 56 px · 700 · 1,08 · interlettrage −1,5 px |
| H1 page | Poppins | 30 px · 700 · interlettrage −0,5 px (32 px tableau de bord) |
| H2 section (accueil) | Poppins | 38 px · 700 · 1,15 · −0,8 px |
| H2 carte | Poppins | 18–19 px · 600 |
| H3 | Poppins | 16–17 px · 600 |
| KPI | Poppins | 28 px · 700 |
| Score (anneau) | Poppins | 24 px · 700 |
| Corps | Inter | 15–16 px · 400 · 1,55 |
| Corps héros | Inter | 19 px · 400 · 1,55 |
| Libellé de champ | Inter | 14 px · 600 |
| Méta / aide | Inter | 13 px · 400–500 |
| Sur-titre (eyebrow) | Inter | 13 px · 600 · MAJUSCULES · +1,5 px |
| Puce | Inter | 12 px · 600–700 |

Chargement : `next/font/google` (Poppins 500/600/700, Inter 400/500/600/700), variables `--font-poppins`, `--font-inter`.

## 4. Espacements, rayons, ombres

- Grille de base **4 px**. Paliers courants : 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 28 · 32 · 40 · 48 · 56 · 64 · 88 · 96.
- Gouttières de page : **32 px** (desktop), **16 px** (mobile).
- Largeurs max : accueil **1280 px** · application **1180 px** · stratégies **1240 px** · fiche/historique **1080 px**.
- Barre latérale : **248 px**.

| Rayon | Valeur | Usage |
|---|---|---|
| `rounded-xs` | 8 px | Pastilles de mois, petites puces carrées |
| `rounded-sm` | 10 px | Cartes de culture, étiquettes sur carte |
| `rounded-md` | 12 px | Champs, boutons-choix, encarts |
| `rounded-lg` | 14 px | Lignes de saison, sous-cartes |
| `rounded-xl` | 16 px | Encarts NASA, cartes d'historique |
| `rounded-2xl` | 20 px | Cartes standard |
| `rounded-3xl` | 22–24 px | Cartes de stratégie, photos, bottom sheet |
| `rounded-full` | — | Boutons, puces, avatars |

Ombre de carte : `0 1px 2px rgba(20,83,45,.06), 0 8px 24px rgba(20,83,45,.06)`.
Ombre flottante (carte) : `0 4px 16px rgba(0,0,0,.18)`.

## 5. Composants

| Composant | Spécification |
|---|---|
| **Bouton primaire** | Pilule, hauteur 46 px (48–54 px héros), `bg-forest text-white`, 14–16 px 600. Variante CTA : `bg-leaf text-forest-950`. |
| **Bouton secondaire** | `bg-sand-200 text-forest` ou contour `1.5px forest`. |
| **Bouton fantôme (héros)** | Contour blanc 70 %, texte blanc. |
| **Carte** | Blanc, `rounded-2xl`, ombre de carte, padding 18–24 px. |
| **Champ** | Hauteur 48 px, `rounded-md`, bordure 1,5 px `field`, focus : bordure `leaf` + halo 4 px `leaf/18 %`. Erreur : bordure `#B91C1C` + message 13 px avec icône. |
| **Bouton-choix** | 48 px, `rounded-md`, bordure `field` ; sélectionné : bordure `forest`, fond `leaf-100`, texte `forest`. |
| **Puce** | Pilule 4×10 px, 12 px 600. |
| **Bandeau** | Pleine largeur, 12 × 32 px, icône 18 px + texte 14 px, couleurs sémantiques. |
| **Anneau de score** | `conic-gradient`, diamètre 92 px (64 px héros, 74 px mobile), trou blanc 72 px. |
| **Jauge de stabilité** | 3 segments de 8 px, couleur selon le niveau. |
| **Badge de confiance** | Puce verte (élevée) ou ambre (moyenne/faible). |
| **Bulle (i)** | Rond 28 px, bordure `#C9BFAE`, « i » en serif ; ouvert : fond `forest`, infobulle `forest` texte blanc 13 px. |
| **Ligne de saison** | 40 px min, `rounded-lg`, libellé saison 12 px, pastille famille 10 px, culture 600 ; alternance `#F3EEE5` / `#FAF7F2`. Transition R1 rouge / R2 verte en 12 px au-dessus. |
| **Barre latérale** | `forest-950`, élément actif `bg-leaf text-forest-950`, items 44 px. |
| **Navigation mobile** | Barre basse blanche, 5 items 56 px. |

## 6. Iconographie

- **lucide-react**, trait 2 px, tailles 16 / 18 / 20 / 22 / 24.
- Jamais d'emoji dans l'interface.
- Icônes décoratives : `aria-hidden`. Boutons icône seuls : `aria-label`.

## 7. Photographie

- Agriculteurs et agricultrices d'Afrique centrale et de l'Ouest, dans leurs champs, lumière naturelle (`public/images/farmers/`).
- Héros : voile `linear-gradient(90deg, rgba(9,36,20,.86) 0%, rgba(9,36,20,.55) 45%, rgba(9,36,20,.05) 80%)`.
- Toujours un `alt` descriptif en français.

## 8. Mouvement (GSAP)

| Animation | Technique | Paramètres |
|---|---|---|
| Apparition du texte du hero | **CSS** (`.hero-rise`) — jamais GSAP au-dessus de la ligne de flottaison (le texte ne doit pas disparaître à l'arrivée du JavaScript sur réseau lent) | 0,8 s, `cubic-bezier(.22,1,.36,1)`, décalages 0 / 80 / 160 / 240 / 340 ms |
| Carrousel du hero | CSS + petit composant client | 1 photo toutes les **6 s**, fondu 1 s, léger zoom 1 → 1,08 sur 9 s ; rail de commandes vertical à droite (horizontal en bas sur mobile) ; cadrage propre au mobile et à l'ordinateur pour chaque photo |
| Nuages | CSS (`.sky-cloud`, composant `SkyClouds`) | **dans la section sombre « Vu du ciel » uniquement** (jamais sur les photos de personnes), 4 nuages de 95 à 150 s, opacité 5–7 %, bords fondus ; retirés si « réduire les animations » |
| Invitation à défiler | CSS (`.hero-bounce`) | 1,6 s en boucle |
| Sections de l'accueil | GSAP ScrollTrigger (`Reveal`) | `from { y: 24, opacity: 0 }`, `stagger: 0.08`, uniquement pour les sections encore sous l'écran |
| Changement d'onglet / modale | CSS | 0,2–0,3 s |

**Règles du carrousel** : bouton pause visible (WCAG 2.2.2), pause au survol ou au focus des commandes, pause quand le hero est hors écran ou l'onglet masqué, défilement arrêté par défaut si « réduire les animations » est activé, et seules la photo affichée et la suivante sont téléchargées.

Toutes les animations respectent `prefers-reduced-motion`.

## 9. Accessibilité

- Contraste texte ≥ 4,5:1 (vérifié pour `ink-muted` sur blanc et beige).
- Cibles tactiles ≥ 44 px.
- Formulaires : `<label>` systématique, erreurs reliées par `aria-describedby`.
- Couleurs jamais seules porteuses de sens (icône ou texte en plus).

## 10. Responsive

| Point de rupture | Largeur | Comportement |
|---|---|---|
| Mobile | < 768 px | Barre latérale remplacée par la navigation basse ; colonnes empilées ; stratégies en onglets |
| Tablette | 768–1279 px | Barre latérale repliable ; grilles 2 colonnes |
| Desktop | ≥ 1280 px | Mise en page de la maquette |
