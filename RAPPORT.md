# RAPPORT.md — Mémoire du projet

_Dernière mise à jour : 2026-10-24_

## Objectif
Refactoriser « Super Mario 2.5D World » (fichier HTML unique, 2388 lignes, Three.js r128) en projet modulaire exécutable, en conservant 100 % du gameplay, en améliorant le rendu 2.5D « Paper Mario » et en garantissant PC + Android. Dépôt cible : https://github.com/Deku0019523f/mario2D

## Stack
HTML5, JavaScript ES Modules, Three.js 0.128.0, CSS (sans Tailwind), Web Audio API, Pointer Events, Gamepad API. Outils : Node ≥ 20, esbuild (build), Playwright (e2e), `node --test`.

## Architecture / fichiers
Voir `plan.md` (arborescence) et `docs/ARCHITECTURE.md`. Logique de jeu sans dépendance à Three.js/DOM ; `SceneSync` lit l'état ; bus d'événements ; boucle à pas fixe 1/240 s.

## Fonctionnalités développées
Tout le gameplay d'origine (mouvement, saut, Goomba/Koopa, blocs ?/briques, pièces, Super Champignon, score/vies/record, victoire, niveau suivant, sons, animations) ; menus ; clavier QWERTY/AZERTY ; tactile multitouch ; manette ; pause (+ auto à la perte de focus) ; paliers de qualité ; décor/textures améliorés ; tests, build, docs.

## Fonctionnalités restantes
- Test sur appareil Android réel et mesure de FPS sur mobile modeste.
- Vrai niveau 2 (actuellement le niveau suivant rejoue la disposition du niveau 1, comme l'original).
- Comparaison visuelle (captures) avec l'original ; test Firefox/Safari.
- `package-lock.json` (à générer avec `npm install` sur une machine avec accès au registre).

## Modifications importantes
Refonte complète en modules ; boucle à pas fixe ; contrôles par Pointer Events ; textures à contour papier ; touffes d'herbe instanciées ; ResourceBin avec dispose ; correction de `constnumTufts` ; pause ajoutée ; build esbuild (cible `es2020`).

## Problèmes rencontrés et solutions
- Registre npm bloqué (403) : dépendances fournies localement, esbuild au lieu de Vite.
- Divergences de flottants dans la comparaison avec l'original : pas de comparaison fixé à dt = 1/64 s (exactement représentable).
- esbuild refusait de transformer la déstructuration avec une cible navigateur `safari13/chrome80/firefox78` : cible `es2020` seule.
- Tests e2e lents en rendu logiciel : attentes sur l'état du jeu (`waitForFunction`) plutôt que des durées.
- `git push` direct refusé par le proxy : envoi via les outils MCP GitHub.
- Requêtes Google Fonts bloquées dans le bac à sable : ignorées dans le e2e, polices de repli prévues.

## Dépendances installées
`three@0.128.0` ; dev : `esbuild@^0.28.0`, `playwright@^1.56.0`.

## Commandes importantes
`npm install` · `npm run dev` · `npm run build` · `npm run preview` · `npm run check` · `npm test` · `npm run test:e2e` · `npm run verify`

## Variables d'environnement
Aucune.

## État actuel
- `npm run check` OK (80 fichiers) ; `npm test` 105/105 ; e2e 29/29 (sources et dist) ; build OK.
- Documentation et ZIP livrés ; push GitHub via MCP : tout le code, les tests et la doc sont sur `main` (empreintes vérifiées identiques au local). Non poussés : `legacy/` (fichier d'origine de 100 Ko, ignoré proprement par les tests s'il est absent) et `docs/screenshots/*.png` (binaires) — présents dans le ZIP.

## Prochaines étapes
Tester sur Android réel (`npm run dev`, adresse réseau local), générer le lockfile, ajouter un niveau 2, déploiement statique de `dist/`.
