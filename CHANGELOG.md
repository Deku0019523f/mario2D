# Changelog

## 2.0.0 — Refonte modulaire

### Architecture
- Découpage du fichier unique (2388 lignes) en ~80 modules ES (`src/core, player, enemies, world, objects, physics, rendering, controls, ui, audio, systems, data, styles`).
- Séparation logique / rendu : tout le gameplay est sans dépendance à Three.js ni au DOM ; `SceneSync` lit l'état en lecture seule.
- Configuration centralisée (`src/data/config.js`), niveau décrit en données (`src/data/levels.js`), textes centralisés (`src/data/texts.js`).
- Bus d'événements (`sfx`, `fx:text`, `mode`) ; aucun cycle d'imports (vérifié par `npm run check`).

### Gameplay (conservé à l'identique)
- Physique, saut (coyote time, jump buffer, saut variable), collisions, Goomba/Koopa, blocs ?/briques, pièces, Super Champignon, score, vies, record (même clé `localStorage`), victoire, niveau suivant.
- Vérifié par exécution de l'**original** en parallèle et comparaison pas à pas (`tests/integration/legacy-parity.test.js`).

### Améliorations
- **Boucle à pas fixe** (1/240 s) avec accumulateur : comportement identique à 30, 60 ou 144 Hz ; plafonnement après un onglet masqué.
- **Android** : Pointer Events + multitouch réel, glissement ◄/►, anti-boutons collés (`pointercancel`, perte de capture), `touch-action: none`, zones de sécurité (encoche), `100dvh`, orientation portrait/paysage, ResizeObserver, pixel ratio adaptatif plafonné.
- **PC** : QWERTY et AZERTY, plusieurs touches par action, manette (Gamepad API), pause (Échap/P), pause automatique à la perte de focus / onglet masqué.
- **Rendu** : contour « papier » sur les sprites, textures en double résolution, touffes d'herbe en `InstancedMesh`, caméra plus large en portrait, gestion de la perte de contexte WebGL, libération des ressources (dispose).
- **Paliers de qualité** low / medium / high (automatique ou `?quality=`).
- **Robustesse** : `localStorage` indisponible toléré, erreur de démarrage (WebGL absent) affichée lisiblement, plafond de particules.
- Ajout : bouton Pause, écran de pause, `Reprendre`.

### Corrections
- Original : variable `constnumTufts` (faute de frappe) corrigée.
- Écrasement d'ennemi traité selon le type (Goomba / Koopa) dans `enemyAI.js`.

### Outillage
- Serveur statique sans dépendance (`scripts/serve.mjs`), build esbuild (`scripts/build.mjs`), analyse statique (`scripts/check-project.mjs`).
- 105 tests unitaires/intégration + 29 vérifications e2e Playwright.

### Fichiers
- Copie de l'original conservée dans `legacy/` (ZIP) ; les tests de parité sont ignorés explicitement si ce fichier est absent.
