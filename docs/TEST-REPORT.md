# Rapport de tests

Tous les résultats ci-dessous proviennent d'exécutions réelles dans l'environnement de développement (Linux, Node 22, Chromium Playwright en rendu logiciel SwiftShader). Rien n'est extrapolé.

## 1. Analyse statique — `npm run check`

`✔ 80 fichiers JS : syntaxe OK, imports résolus, aucun cycle, IDs HTML cohérents.`

## 2. Tests unitaires et d'intégration — `npm test`

**105 tests, 105 réussis, 0 échec** (`node --test`).

| Fichier | Contenu |
|---|---|
| `integration/legacy-parity` (6) | Exécute le **code d'origine** dans un `vm` (DOM/THREE simulés) et compare pas à pas (dt = 1/64 s) : structure du niveau (colliders, blocs, pièces, ennemis, drapeau) ; partie jouée par un robot de 90 s jusqu'au drapeau (position, vitesse, score, vies, ennemis, blocs) ; bloc ? → Super Champignon → brique fracassée ; victoire + niveau suivant ; chute dans un ravin + Game Over ; dégâts (Super rétrécit / petit perd une vie / invincibilité) |
| `unit/collision` (8) | atterrissage, coup de tête, collisions latérales, colliders désactivés, `findGroundBelow` |
| `unit/player-physics` (13) | accélération/plafond de vitesse, friction, saut (court/long), coyote time, jump buffer, limite gauche, vitesse de chute max, **indépendance du framerate** (hauteur de saut ±3 %, distance ±1,5 % à 240/120/60 pas/s), ravin, drapeau |
| `unit/blocks-and-items` (10) | blocs ?/briques, champignon, Super, rebond de bloc, ennemi sur bloc, pièces, particules |
| `unit/enemies` (10) | patrouille, tuyaux, écrasement Goomba/Koopa, dégâts, invincibilité, Game Over, pause |
| `unit/systems` (7) | Storage (dont `localStorage` hostile/absent), score + record persistant (clé de l'original), vies, réglages |
| `unit/input` (18) | InputManager, clavier (AZERTY/QWERTY, multi-touches, Ctrl ignoré), tactile (multitouch, glissement, annulation, souris), manette |
| `unit/core` (10) | boucle à pas fixe (30/60/144 fps), plafonnement, caméra, RNG, paliers de qualité, bus |
| `unit/levels` (7) | cohérence des données du niveau, construction du monde, `getLevel` |
| `unit/ui` (10) | Dom, HUD, Menu, UI (jouer, pause, son, game over, victoire), textes flottants |
| `unit/audio` (6) | SoundEngine avec `AudioContext` factice, AudioManager, mute, suspend/resume |

## 3. Test navigateur — `npm run test:e2e` (Playwright / Chromium)

**29/29 vérifications réussies**, sur les sources **et** sur le build `dist/` (`-- --dir dist`) :
- PC 1280×720 : démarrage sans erreur console, canvas WebGL, clic Jouer, flèche droite, Espace (saut), touche D, pause P, jeu figé en pause, reprise, pause automatique à la perte de focus.
- Android émulé (Pixel 7 : 851×393, DPR 2,625, tactile, user-agent Android) : palier de qualité mobile choisi, contrôles tactiles visibles, tap sur Jouer, **multitouch** via CDP (► + SAUT simultanés), relâchement d'un seul doigt, rotation en portrait (canvas aux dimensions de l'écran, aucun défilement horizontal).
- Redimensionnements 800×600, 1920×1080, 360×640 : le canvas suit. Onglet masqué : pause automatique.
- Robot clavier : le héros progresse dans le niveau, aucune erreur console.

Captures réelles : `docs/screenshots/` (menu, jeu PC, pause, Android paysage et portrait) — présentes dans l'archive ZIP livrée ; elles sont régénérées par `npm run test:e2e`.

## 4. Build — `npm run build`

Réussi : `dist/assets/main-*.js` ≈ 560 Ko (three.js inclus, minifié), `style-*.css` ≈ 9 Ko, `index.html` réécrit sans importmap.

## Limites (à lire)

- **Aucun appareil Android physique** n'était disponible : le tactile est validé par émulation (événements tactiles CDP, Pointer Events). Les performances sur téléphone modeste ne sont pas mesurées ; les paliers de qualité et le pixel ratio plafonné sont conçus pour cela mais restent à confirmer sur matériel (à tester via `npm run dev` + adresse réseau local).
- Rendu navigateur testé en **logiciel (SwiftShader)** : lent (framerate faible), d'où des attentes basées sur l'état du jeu plutôt que sur des durées. Pas de mesure de FPS représentative d'un GPU réel.
- **Vite non utilisé** (installation impossible dans l'environnement : registre npm bloqué) : le build est fait avec esbuild, via un script dédié. Les dépendances npm (`three`, `esbuild`, `playwright`) étaient fournies localement dans le bac à sable ; `npm install` n'a donc pas été exécuté ici et aucun `package-lock.json` n'est fourni.
- Les polices Google Fonts n'ont pas pu être chargées dans l'environnement (réseau bloqué) ; le rendu avec polices de repli est celui testé.
- Pas de comparaison visuelle automatisée avec l'original (la non-régression porte sur la logique de jeu, pas sur les pixels).
- Safari/iOS et Firefox non testés (seul Chromium l'a été).
