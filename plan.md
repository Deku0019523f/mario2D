# plan.md — Structure détaillée du projet

```
mario2D/
├── index.html                  Page unique : HUD, menus, contrôles tactiles, importmap (dev), <script type=module>
├── package.json                Scripts npm, dépendances (three 0.128.0 ; esbuild, playwright en dev)
├── README.md / CHANGELOG.md / RAPPORT.md / plan.md
├── legacy/
│   └── Super Mario 2.5D World.original.html    Original monolithique (référence de non-régression)
├── public/assets/              Copié tel quel dans dist/ (vide : aucun asset externe, tout est généré par code)
├── scripts/
│   ├── serve.mjs               Serveur statique (dev/preview), affiche les URL réseau
│   ├── build.mjs               Build esbuild -> dist/ (JS+CSS hachés, index.html réécrit)
│   ├── check-project.mjs       Analyse statique (syntaxe, imports, cycles, IDs HTML)
│   └── run-tests.mjs           Lance node --test sur tests/unit et tests/integration
├── src/
│   ├── main.js                 Point d'entrée, écran d'erreur de démarrage, ?debug
│   ├── core/                   App (assemblage), Game (état + step), GameLoop (pas fixe), CameraRig,
│   │                           GameState (modes), events (EventBus), rng (mulberry32)
│   ├── player/                 Player, playerPhysics (updatePlayer), playerStatus (Super/dégâts/vies), playerAnimation
│   ├── enemies/                Enemy, enemyAI (Goomba/Koopa, écrasement)
│   ├── world/                  World, LevelBuilder, WorldUpdater, Platform, Pipe, Goal, scenery
│   ├── objects/                Block, Coin, Mushroom, Particle
│   ├── physics/                collision (resolveSide, resolveVertical, findGroundBelow)
│   ├── rendering/              Renderer, SceneSync, quality, ResourceBin, meshes/*, textures/*
│   ├── controls/               InputManager, Keyboard, TouchControls, GamepadInput
│   ├── ui/                     Dom, Hud, Menu, UI, FloatingText, ErrorOverlay
│   ├── audio/                  SoundEngine (Web Audio), AudioManager
│   ├── systems/                Storage, ScoreSystem, LivesSystem, Settings
│   ├── data/                   config (constantes), levels (niveau), texts (français)
│   └── styles/                 main, base, hud, menu, controls, effects (.css)
├── tests/
│   ├── helpers/                legacy-harness (exécute l'original dans un vm), lockstep, fake-dom, world-helpers
│   ├── unit/                   collision, player-physics, blocks-and-items, enemies, systems, input,
│   │                           core, levels, ui, audio
│   ├── integration/            legacy-parity (comparaison pas à pas avec l'original)
│   └── e2e/smoke.mjs           Playwright : clavier, tactile multitouch, portrait/paysage, pause auto
└── docs/
    ├── ARCHITECTURE.md · TEST-REPORT.md
    └── screenshots/            Captures réelles produites par le test e2e
```
