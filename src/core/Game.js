import { PHYSICS, SCORE } from '../data/config.js';
import { TEXTS } from '../data/texts.js';
import { getLevel } from '../data/levels.js';
import { MODE, MODE_EVENT } from './GameState.js';
import { CameraRig } from './CameraRig.js';
import { createRng } from './rng.js';
import { createPlayer, resetPlayer } from '../player/Player.js';
import { updatePlayer } from '../player/playerPhysics.js';
import { winWalkPose } from '../player/playerAnimation.js';
import { buildWorld } from '../world/LevelBuilder.js';
import { updateWorld } from '../world/WorldUpdater.js';
import { spawnParticles } from '../objects/Particle.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { LivesSystem } from '../systems/LivesSystem.js';

/**
 * Logique de jeu : aucune dépendance à Three.js, au DOM ni à Web Audio.
 * Elle émet des événements (sfx, fx:text, mode) que le rendu, l'interface et l'audio écoutent.
 *
 * Contrat d'entrée : `input` expose { left, right, jumpHeld } (booléens).
 */
export class Game {
    /**
     * @param {object} deps
     * @param {import('./events.js').EventBus} deps.bus
     * @param {ReturnType<typeof import('../systems/Storage.js').createStorage>} deps.storage
     * @param {{left:boolean,right:boolean,jumpHeld:boolean}} deps.input
     * @param {() => number} [deps.random] source d'aléa cosmétique (particules)
     * @param {number} [deps.levelSeed] graine du décor
     */
    constructor({ bus, storage, input, random = Math.random, levelSeed = 1337 }) {
        this.bus = bus;
        this.input = input;
        this.random = random;
        this.levelSeed = levelSeed;

        this.mode = MODE.MENU;
        this.pausedFrom = null;
        this.level = 1;
        this.time = 0;

        this.score = new ScoreSystem(storage);
        this.lives = new LivesSystem();
        this.player = createPlayer();
        this.cameraRig = new CameraRig();
        this.world = null;
        this.worldVersion = 0;
    }

    // ---------------------------------------------------------------- Services (utilisés par les modules)

    sfx(name, arg) {
        this.bus.emit('sfx', name, arg);
    }

    /** Texte flottant ; `tone` = suffixe de classe CSS (ex. 'amber-300'). Coordonnées MONDE. */
    floatText(x, y, text, tone = 'amber-300') {
        this.bus.emit('fx:text', { x, y, text, tone });
    }

    burst(x, y, color, count, opts) {
        spawnParticles(this.world, this.random, x, y, color, count, opts);
    }

    setMode(mode, info = {}) {
        this.mode = mode;
        this.bus.emit('mode', mode, info);
    }

    // ---------------------------------------------------------------- Cycle de vie d'une partie

    /** Construit (ou reconstruit) le monde du niveau `n`. */
    loadLevel(n) {
        this.level = n;
        this.world = buildWorld(getLevel(n), { rng: createRng(this.levelSeed + n), version: ++this.worldVersion });
    }

    resetPlayer(keepPowerUp = false) {
        resetPlayer(this.player, keepPowerUp);
    }

    /** Prépare l'état initial (monde animé derrière le menu d'accueil). */
    init() {
        this.loadLevel(1);
        this.resetPlayer(false);
        this.mode = MODE.MENU;
    }

    startNewGame() {
        this.score.reset();
        this.lives.reset();
        this.loadLevel(1);
        this.resetPlayer(false);
        this.setMode(MODE.PLAYING);
    }

    startNextLevel() {
        this.loadLevel(this.level + 1);
        this.resetPlayer(true); // garde le Super Champignon acquis
        this.setMode(MODE.PLAYING);
    }

    pause() {
        if (this.mode !== MODE.PLAYING) return false;
        this.pausedFrom = this.mode;
        this.setMode(MODE.PAUSED);
        return true;
    }

    resume() {
        if (this.mode !== MODE.PAUSED) return false;
        this.setMode(this.pausedFrom || MODE.PLAYING);
        this.pausedFrom = null;
        return true;
    }

    togglePause() {
        return this.mode === MODE.PAUSED ? this.resume() : this.pause();
    }

    // ---------------------------------------------------------------- Entrées

    /** Demande de saut (mémorisée brièvement : jump buffer). */
    queueJump() {
        if (this.mode === MODE.PLAYING) this.player.jumpBuffer = PHYSICS.JUMP_BUFFER_TIME;
    }

    /** Relâchement du bouton de saut : raccourcit un saut encore ascendant. */
    releaseJump() {
        const p = this.player;
        if (p.vy > PHYSICS.JUMP_CUT_MIN_VY) p.vy *= PHYSICS.JUMP_CUT_FACTOR;
    }

    // ---------------------------------------------------------------- Simulation

    /** Un pas de simulation à durée fixe. */
    step(dt) {
        switch (this.mode) {
            case MODE.PLAYING:
                this.time += dt;
                updatePlayer(this, dt);
                updateWorld(this, dt);
                break;
            case MODE.WIN_ANIM:
                this.time += dt;
                updateWorld(this, dt);
                this.updateWinAnimation(dt);
                break;
            case MODE.PAUSED:
                break;
            default: // MENU, GAMEOVER : le monde reste animé derrière le menu
                this.time += dt;
                updateWorld(this, dt);
        }
    }

    /** Caméra : suit le temps réel (fluide quelle que soit la fréquence d'écran). */
    updateCamera(frameDt) {
        this.cameraRig.update(frameDt, this.player);
    }

    startWinAnimation() {
        const flag = this.world.flag;
        const p = this.player;
        flag.triggered = true;
        this.mode = MODE.WIN_ANIM;
        p.vx = 0;
        this.score.add(SCORE.VICTORY);
        this.sfx('win');
        this.floatText(flag.x, p.y + 2, TEXTS.floating.victory, 'emerald-300');
        this.burst(flag.x, p.y + 2, 0xfacc15, 22);
        this.bus.emit('mode', MODE.WIN_ANIM, {});
    }

    /** Descente du drapeau, puis marche du héros vers le château. */
    updateWinAnimation(dt) {
        const flag = this.world.flag;
        const p = this.player;
        if (flag && flag.bannerY > flag.bottomY) {
            flag.bannerY = Math.max(flag.bottomY, flag.bannerY - 5.5 * dt);
            p.y = Math.max(0, p.y - 6 * dt);
            return;
        }
        p.facing = 1;
        p.x += 3.5 * dt;
        p.animTimer += dt * 8;
        p.pose = winWalkPose(p.animTimer);
        p.y = 0;
        p.flipScaleX = p.scale;

        if (p.x >= flag.x + 4.8) {
            this.mode = MODE.MENU;
            this.bus.emit('mode', MODE_EVENT.VICTORY, { level: this.level });
        }
    }

    // ---------------------------------------------------------------- Lecture pour l'interface

    /** Progression dans le niveau, en pourcentage entier (0-100). */
    get progressPercent() {
        return Math.max(0, Math.min(100, Math.round((this.player.x / this.world.levelLength) * 100)));
    }
}
