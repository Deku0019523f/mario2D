# Super Mario 2.5D World — Édition modulaire

Jeu de plateforme HTML5 en 2.5D « Paper Mario » (Three.js r128), refactorisé depuis un fichier unique de ~2400 lignes
en projet modulaire (ES Modules). Le gameplay est **strictement conservé** (vérifié par comparaison avec le code d'origine, voir
`docs/TEST-REPORT.md`). Fonctionne sur **PC (clavier, manette)** et **Android (tactile multitouch)**.

## Démarrage rapide

Prérequis : Node.js ≥ 20 et un navigateur récent (Chrome, Firefox, Safari, Edge).

```bash
npm install          # installe three@0.128.0 (+ esbuild, playwright pour le build et les tests)
npm run dev          # serveur local -> http://localhost:5173
```

Le serveur affiche aussi l'adresse réseau local (ex. `http://192.168.1.20:5173`) : ouvrez-la depuis un téléphone Android
connecté au même Wi-Fi pour tester le tactile.

### Version de production

```bash
npm run build        # génère dist/ (JS + CSS minifiés, three.js inclus, noms hachés)
npm run preview      # sert dist/ -> http://localhost:5173
```

`dist/` est un site statique autonome : copiez-le sur n'importe quel hébergement (GitHub Pages, Netlify, Render…).
> Ne pas ouvrir `index.html` par double-clic (`file://`) : les modules ES exigent un serveur HTTP.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` / `start` | Serveur de développement (sources + importmap, sans bundler) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert `dist/` |
| `npm run check` | Analyse statique : syntaxe, imports résolus, absence de cycles, IDs HTML |
| `npm test` | Tests unitaires et d'intégration (`node --test`) — 105 tests |
| `npm run test:e2e` | Test navigateur Playwright (Chromium) ; `-- --dir dist` pour tester le build |
| `npm run verify` | check + test + build |

Pour `test:e2e`, Chromium doit être disponible pour Playwright (`npx playwright install chromium` si besoin).

## Contrôles

| Action | Clavier | Tactile | Manette |
|---|---|---|---|
| Gauche / droite | ← → · Q D · A | ◄ ► (glisser possible de l'un à l'autre) | Croix ou stick gauche |
| Sauter | Espace · ↑ · Z · W | bouton SAUT (maintenir = saut plus haut) | A / X |
| Pause | Échap · P | bouton ⏸ | Start |
| Valider un menu | Entrée | toucher le bouton | A |

Le multitouch est réel : on peut courir **et** sauter simultanément. La partie se met automatiquement en pause si la fenêtre
perd le focus ou si l'onglet est masqué.

## Paramètres d'URL

- `?quality=low|medium|high` : force le palier graphique (sinon détection automatique mobile/PC).
- `?debug` : expose `window.__mario` (jeu, entrées, rendu) pour les tests.

## Structure

Voir `plan.md` (arborescence détaillée) et `docs/ARCHITECTURE.md` (conception, flux de données, règles de modularité).

## Dépendances

- Exécution : `three@0.128.0` (importée via `importmap` en développement, embarquée par esbuild en production).
- Outils : `esbuild` (build), `playwright` (e2e). Aucune variable d'environnement requise.
- Polices : Google Fonts (Fredoka, Press Start 2P), **optionnelles** — le jeu fonctionne hors ligne avec des polices de repli.

## Limites connues

Voir `docs/TEST-REPORT.md` § Limites : pas de test sur appareil Android physique, build avec esbuild (et non Vite), un seul niveau (le « Niveau suivant » rejoue la même disposition, comme l'original).

## Licence / origine

Projet fan-made non officiel inspiré de Super Mario ; aucun asset externe (sprites dessinés par code sur canvas, sons synthétisés en Web Audio).
