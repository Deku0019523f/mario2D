import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame } from '../helpers/lockstep.js';
import { PHYSICS } from '../../src/data/config.js';

/** Partie démarrée, héros posé sur le sol de départ. */
function setup(step = 1 / 240) {
    const ctx = createNewGame();
    ctx.game.startNewGame();
    // Laisse le héros tomber sur le sol (spawn à y = 1.5)
    for (let i = 0; i < 240; i++) ctx.game.step(step);
    ctx.game.player.invincibleTimer = 0;
    return ctx;
}

function run(game, seconds, step = 1 / 240) {
    const n = Math.round(seconds / step);
    for (let i = 0; i < n; i++) game.step(step);
}

test('le héros tombe puis se pose sur le sol', () => {
    const { game } = setup();
    assert.equal(game.player.onGround, true);
    assert.equal(game.player.y, 0);
    assert.equal(game.player.vy, 0);
});

test('accélération vers la droite plafonnée à MAX_SPEED_X', () => {
    const { game, input } = setup();
    input.right = true;
    run(game, 1.5);
    assert.ok(Math.abs(game.player.vx - PHYSICS.MAX_SPEED_X) < 1e-9);
    assert.equal(game.player.facing, 1);
});

test('la friction arrête le héros quand on relâche', () => {
    const { game, input } = setup();
    input.right = true;
    run(game, 0.5);
    input.right = false;
    run(game, 1.5);
    assert.equal(game.player.vx, 0);
});

test('saut : vitesse initiale, puis retour au sol', () => {
    const { game, input, events } = setup();
    input.jumpHeld = true;
    game.queueJump();
    run(game, 0.05);
    assert.ok(game.player.vy > 5, 'le héros monte');
    assert.equal(game.player.onGround, false);
    assert.ok(events.includes('sfx:jump'));
    input.jumpHeld = false;
    run(game, 3);
    assert.equal(game.player.onGround, true);
});

test('saut maintenu plus haut qu\'un saut bref (gravité allégée + coupure au relâchement)', () => {
    const apex = (hold) => {
        const { game, input } = setup();
        input.jumpHeld = true;
        game.queueJump();
        let max = 0;
        for (let i = 0; i < 240 * 2; i++) {
            if (!hold && i === 12) {
                input.jumpHeld = false;
                game.releaseJump();
            }
            game.step(1 / 240);
            max = Math.max(max, game.player.y);
        }
        return max;
    };
    const long = apex(true);
    const short = apex(false);
    assert.ok(long > short * 1.5, `saut long ${long.toFixed(2)} vs bref ${short.toFixed(2)}`);
});

test('coyote time : le saut reste possible un court instant après avoir quitté le sol', () => {
    const { game } = setup();
    const p = game.player;
    // Simule « vient de quitter le bord » : coyoteTimer chargé, plus au sol
    p.onGround = false;
    p.coyoteTimer = PHYSICS.COYOTE_TIME;
    game.queueJump();
    game.step(1 / 240);
    assert.ok(p.vy > 5, 'le saut est déclenché grâce au coyote time');
});

test('jump buffer : un saut demandé juste avant l\'atterrissage est exécuté à l\'atterrissage', () => {
    const { game } = setup();
    const p = game.player;
    p.y = 0.3; // en l'air, juste au-dessus du sol
    p.vy = -3;
    p.onGround = false;
    p.coyoteTimer = 0;
    game.queueJump();
    run(game, 0.12);
    assert.ok(p.vy > 5 || p.y > 0.3, 'le héros a sauté dès le contact avec le sol');
});

test('le héros ne dépasse pas la limite gauche du niveau', () => {
    const { game, input } = setup();
    input.left = true;
    run(game, 3);
    assert.ok(game.player.x >= PHYSICS.LEFT_BOUND - 1e-9);
});

test('vitesse de chute plafonnée', () => {
    const { game } = setup();
    const p = game.player;
    p.y = 30;
    p.vy = 0;
    p.onGround = false;
    run(game, 1);
    assert.ok(p.vy >= PHYSICS.MAX_FALL_SPEED - 1e-9);
});

test('indépendance du framerate : un saut atteint la même hauteur à 240, 120 et 60 pas/s (±3 %)', () => {
    const apexAt = (step) => {
        const { game, input } = setup(step);
        input.jumpHeld = true;
        game.queueJump();
        let max = 0;
        const n = Math.round(1.5 / step);
        for (let i = 0; i < n; i++) {
            game.step(step);
            max = Math.max(max, game.player.y);
        }
        return max;
    };
    const a240 = apexAt(1 / 240);
    const a120 = apexAt(1 / 120);
    const a60 = apexAt(1 / 60);
    assert.ok(Math.abs(a120 - a240) / a240 < 0.03, `120 Hz : ${a120} vs ${a240}`);
    assert.ok(Math.abs(a60 - a240) / a240 < 0.03, `60 Hz : ${a60} vs ${a240}`);
});

test('indépendance du framerate : la distance parcourue en 0,8 s est la même (±1,5 %)', () => {
    const distAt = (step) => {
        const { game, input } = setup(step);
        const x0 = game.player.x;
        input.right = true;
        run(game, 0.8, step); // reste en deçà du premier Goomba (x ≈ 12 -> 21)
        return game.player.x - x0;
    };
    const d240 = distAt(1 / 240);
    const d120 = distAt(1 / 120);
    const d60 = distAt(1 / 60);
    assert.ok(Math.abs(d120 - d240) / d240 < 0.01, `120 Hz : ${d120} vs ${d240}`);
    assert.ok(Math.abs(d60 - d240) / d240 < 0.015, `60 Hz : ${d60} vs ${d240}`);
});

test('tomber dans un ravin retire une vie et replace le héros au départ', () => {
    const { game } = setup();
    game.player.x = 29.2; // fossé entre deux plateformes
    game.player.y = -3;
    game.player.vy = -10;
    game.player.onGround = false;
    const livesBefore = game.lives.lives;
    run(game, 1);
    assert.equal(game.lives.lives, livesBefore - 1);
    assert.equal(game.player.x, 2.5);
});

test('atteindre le drapeau déclenche la victoire (+2000)', () => {
    const { game, events } = setup();
    const before = game.score.score;
    game.player.x = game.world.flag.x - 0.3;
    run(game, 0.05);
    assert.equal(game.mode, 'WIN_ANIM');
    assert.equal(game.score.score - before, 2000);
    assert.ok(events.includes('sfx:win'));
});
