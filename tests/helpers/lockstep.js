/**
 * Outils de comparaison « pas à pas » entre la version d'origine (exécutée via legacy-harness)
 * et la nouvelle version : mêmes entrées, même durée de frame (1/64 s), états comparés à chaque frame.
 */
import { Game } from '../../src/core/Game.js';
import { EventBus } from '../../src/core/events.js';
import { createStorage } from '../../src/systems/Storage.js';
import { loadLegacy } from './legacy-harness.js';

/** 1/64 s : exactement représentable en binaire (voir legacy-harness.js). */
export const DT = 1 / 64;
export const EPS = 1e-6;

/** Crée une nouvelle partie (avec entrées pilotables et événements enregistrés). */
export function createNewGame() {
    const bus = new EventBus();
    const input = { left: false, right: false, jumpHeld: false };
    const game = new Game({ bus, storage: createStorage(null), input });
    const events = [];
    bus.on('sfx', (name) => events.push(`sfx:${name}`));
    bus.on('mode', (mode) => events.push(`mode:${mode}`));
    game.init();
    return { game, input, bus, events };
}

/** État comparable de la nouvelle version. */
export function snapshotNew(game) {
    const p = game.player;
    const w = game.world;
    return {
        mode: game.mode,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        onGround: p.onGround,
        isSuper: p.isSuper,
        scale: p.scale,
        invincible: Math.max(0, p.invincibleTimer),
        score: game.score.score,
        coins: game.score.coins,
        lives: game.lives.lives,
        best: game.score.best,
        enemies: w.enemies.map((e) => `${e.state}@${e.x.toFixed(4)}`).join('|'),
        blocksUsed: w.blocks.map((b) => (b.destroyed ? 'D' : b.used ? 'U' : '-')).join(''),
        coinsTaken: w.coins.map((c) => (c.collected ? 1 : 0)).join(''),
        mushrooms: w.mushrooms.map((m) => `${m.collected ? 'C' : 'a'}@${m.x.toFixed(4)},${m.y.toFixed(4)}`).join('|'),
        bannerY: w.flag ? w.flag.bannerY : null,
    };
}

/** État comparable de la version d'origine. */
export function snapshotLegacy(L) {
    const g = L.game;
    const a = L.api;
    return {
        mode: g.mode,
        x: g.x,
        y: g.y,
        vx: g.vx,
        vy: g.vy,
        onGround: g.onGround,
        isSuper: g.isSuper,
        scale: g.scale,
        invincible: Math.max(0, g.invincibleTimer),
        score: g.score,
        coins: g.coins,
        lives: g.lives,
        best: g.bestScore,
        enemies: a.enemiesList.map((e) => `${e.state}@${e.x.toFixed(4)}`).join('|'),
        blocksUsed: a.interactiveBlocks.map((b) => (b.destroyed ? 'D' : b.used ? 'U' : '-')).join(''),
        coinsTaken: a.coinsList.map((c) => (c.collected ? 1 : 0)).join(''),
        mushrooms: a.mushroomsList.map((m) => `${m.collected ? 'C' : 'a'}@${m.x.toFixed(4)},${m.y.toFixed(4)}`).join('|'),
        bannerY: a.flagpoleObj ? a.flagpoleObj.banner.position.y : null,
    };
}

/** Premier écart entre deux états (ou null s'ils sont équivalents). */
export function firstDiff(a, b) {
    for (const key of Object.keys(a)) {
        const va = a[key];
        const vb = b[key];
        if (typeof va === 'number' && typeof vb === 'number') {
            if (Math.abs(va - vb) > EPS) return `${key}: nouveau=${va} original=${vb}`;
        } else if (va !== vb) {
            return `${key}: nouveau=${va} original=${vb}`;
        }
    }
    return null;
}

/**
 * Pilote les deux versions en parallèle.
 */
export function createLockstep() {
    const L = loadLegacy();
    const N = createNewGame();
    const held = { left: false, right: false, jump: false };

    const api = {
        L,
        N,
        game: N.game,
        frame: 0,

        /** Démarre une partie dans les deux versions. */
        start() {
            L.click('btn-play');
            N.game.startNewGame();
        },
        nextLevel() {
            L.click('btn-next-level');
            N.game.startNextLevel();
        },

        /** Applique l'état d'entrée voulu aux deux versions (comme le ferait un joueur au clavier). */
        setInput({ left = false, right = false, jump = false }) {
            if (left !== held.left) {
                L.key(left ? 'keydown' : 'keyup', 'q');
                N.input.left = left;
                held.left = left;
            }
            if (right !== held.right) {
                L.key(right ? 'keydown' : 'keyup', 'd');
                N.input.right = right;
                held.right = right;
            }
            if (jump !== held.jump) {
                L.key(jump ? 'keydown' : 'keyup', ' ');
                N.input.jumpHeld = jump;
                if (jump) N.game.queueJump();
                else N.game.releaseJump();
                held.jump = jump;
            }
        },

        /** Place le héros à un endroit précis dans les deux versions. */
        teleport(x, y, { vx = 0, vy = 0 } = {}) {
            Object.assign(L.game, { x, y, vx, vy });
            Object.assign(N.game.player, { x, y, vx, vy });
        },

        /** Avance d'une frame dans les deux versions et renvoie l'écart éventuel. */
        step() {
            L.frame();
            N.game.step(DT);
            api.frame += 1;
            return firstDiff(snapshotNew(N.game), snapshotLegacy(L));
        },
    };
    return api;
}

/**
 * Robot simple : court vers la droite et saute devant les obstacles, ennemis et trous.
 * Il lit l'état de la NOUVELLE version, mais ses décisions sont rejouées à l'identique
 * dans l'original : la qualité du robot n'a aucune incidence sur la validité de la comparaison.
 */
export function createBot() {
    let jumpFramesLeft = 0;
    return function decide(game) {
        const p = game.player;
        const w = game.world;
        if (jumpFramesLeft > 0) {
            jumpFramesLeft -= 1;
            return { right: true, jump: jumpFramesLeft > 0 };
        }
        if (game.mode === 'PLAYING' && p.onGround) {
            let danger = false;
            for (const e of w.enemies) {
                if (e.state === 'walk' && Math.abs(e.x - p.x) < 3.2 && e.x > p.x - 1 && Math.abs(e.y - p.y) < 2.5) danger = true;
            }
            for (const c of w.colliders) {
                if (c.active === false) continue;
                if (c.minX > p.x && c.minX - p.x < 1.8 && c.maxY > p.y + 0.1 && c.minY < p.y + 1) danger = true;
            }
            const ahead = p.x + 1.5;
            const hasGround = w.colliders.some((c) => c.active !== false && c.minX <= ahead && ahead <= c.maxX && c.maxY <= p.y + 0.1 && c.minY < p.y);
            if (!hasGround) danger = true;
            if (danger) {
                jumpFramesLeft = 30;
                return { right: true, jump: true };
            }
        }
        return { right: true, jump: false };
    };
}
