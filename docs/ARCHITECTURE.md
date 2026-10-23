# Architecture

## Principes

1. **Logique ≠ rendu.** `core/`, `player/`, `enemies/`, `world/`, `objects/`, `physics/`, `systems/` n'importent ni Three.js ni le DOM.
   Ils sont donc testables sous Node. `rendering/SceneSync` lit `game.world` / `game.player` en sens unique.
2. **Pas de cycles d'imports** (contrôlé par `npm run check`). Sens des dépendances :
   `data → systems/physics → objects/enemies/player/world → core(Game) → rendering/ui/audio/controls → core(App) → main`.
3. **Configuration centralisée** : toute constante de gameplay est dans `src/data/config.js` (gelée). Le niveau est une liste ordonnée d'`items` (`src/data/levels.js`) ; l'ordre est conservé car il détermine l'ordre des colliders, comme dans l'original.
4. **Initialisation déterministe** : `createApp()` assemble dans un ordre fixe (stockage → bus/entrées → jeu → audio → rendu → UI/contrôles → événements système → boucle). Le décor utilise un RNG à graine (mulberry32).
5. **Nettoyage** : `app.dispose()` retire tous les écouteurs, libère géométries/matériaux/textures (`ResourceBin`) et le renderer.

## Flux d'une frame

```
requestAnimationFrame ─► GameLoop.tick
   ├─ accumulateur : N × game.step(1/240)   (physique à pas fixe)
   │      Game.step(dt) selon le mode : PLAYING / WIN_ANIM / MENU
   │         updatePlayer → collisions → blocs / ennemis / pièces / champignons / particules
   └─ render(frameDt) : gamepad.poll → camera → SceneSync.update → ui.update (HUD) → renderer.render
```

## Événements (EventBus)

| Événement | Émetteur | Consommateurs |
|---|---|---|
| `sfx` (nom, arg) | gameplay | `AudioManager` → `SoundEngine` |
| `fx:text` ({x,y,text,tone}) | gameplay | `UI` → `FloatingText` (projection monde→écran par `Renderer.project`) |
| `mode` (MENU, PLAYING, PAUSED, GAMEOVER, VICTORY) | `Game` | `UI` (menus), `AudioManager` (suspend/resume) |

## Entrées

`Keyboard`, `TouchControls`, `GamepadInput` écrivent chacun dans leur « source » de `InputManager`, qui expose `left`, `right`, `jumpHeld`
(OU logique des sources) et émet `jumpPress`, `jumpRelease`, `pause`, `confirm`, `reset`. Lâcher une touche ne coupe donc pas un doigt encore posé.
`TouchControls` suit chaque `pointerId` (multitouch) ; la direction dépend de la position X du doigt, d'où le glissement ◄ ↔ ►.

## Rendu

- `Renderer` : scène, caméra, éclairage, dégradé de ciel, `ResizeObserver`, pixel ratio adaptatif plafonné par palier de qualité, perte de contexte WebGL.
- `SceneSync` : crée/met à jour/supprime les meshes selon `world.version` ; squash & stretch, ombre, clignotement d'invincibilité.
- `textures/` : sprites dessinés sur canvas (contour « papier », résolution ×2). `meshes/` : plateformes (touffes en `InstancedMesh`), tuyaux, blocs, pièces, drapeau, décor.
- Paliers (`low/medium/high`) : pixel ratio max (1 / 1,5 / 2), antialiasing, ombres et taille de la shadow map, détail des sphères.

## Physique et robustesse

- Pas fixe 1/240 s, `MAX_FRAME_TIME` 0,1 s : pas de « spirale de la mort » ni de téléportation après un onglet masqué.
- Résolution de collisions par axes (`resolveSide`, `resolveVertical`) identique à l'original.
- Perte de focus / onglet masqué : `input.releaseAll()` + pause.

## Ajouter un niveau

Créer `LEVEL_2` dans `src/data/levels.js` avec la même structure d'`items` et l'ajouter à `LEVELS`. Aucun autre fichier à modifier.
