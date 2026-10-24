import test from 'node:test';
import assert from 'node:assert/strict';
import { gameWithLevel, run } from '../helpers/world-helpers.js';
import { ENEMY_TYPES, PHYSICS, SCORE } from '../../src/data/config.js';

const goomba = (x, minX = x - 4, maxX = x + 4) => ({ kind: 'enemy', enemyType: 'goomba', x, y: 0, minX, maxX });
const koopa = (x, minX = x - 4, maxX = x + 4) => ({ kind: 'enemy', enemyType: 'koopa', x, y: 0, minX, maxX });

test('un ennemi patrouille entre ses bornes et fait demi-tour', () => {
    const { game } = gameWithLevel([goomba(20, 18, 22)]);
    const en = game.world.enemies[0];
    game.player.x = 50; // loin
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 240 * 6; i++) {
        game.step(1 / 240);
        min = Math.min(min, en.x);
        max = Math.max(max, en.x);
    }
    assert.ok(min >= 18 - 1e-9 && max <= 22 + 1e-9, `bornes respectées (${min} -> ${max})`);
    assert.ok(max - min > 3.9, 'il parcourt toute la zone');
});

test('un ennemi rebondit contre un tuyau', () => {
    const { game } = gameWithLevel([
        { kind: 'pipe', x: 20, y: 0, height: 1.5 },
        goomba(24, 18, 28),
    ]);
    game.player.x = 50;
    run(game, 3);
    assert.ok(game.world.enemies[0].x > 20.6, 'ne traverse pas le tuyau');
});

test('les vitesses et tailles viennent de la configuration', () => {
    const { game } = gameWithLevel([goomba(20), koopa(30)]);
    const [g, k] = game.world.enemies;
    assert.equal(g.size, ENEMY_TYPES.goomba.size);
    assert.equal(k.size, ENEMY_TYPES.koopa.size);
    assert.equal(g.vx, -ENEMY_TYPES.goomba.speed);
});

for (const type of ['goomba', 'koopa']) {
    test(`écraser un ${type} par le dessus : +200, rebond, ennemi aplati puis retiré`, () => {
        const { game, events } = gameWithLevel([{ kind: 'enemy', enemyType: type, x: 20, y: 0, minX: 19.99, maxX: 20.01 }]);
        const en = game.world.enemies[0];
        en.x = 20;
        game.player.x = 20;
        game.player.y = en.height * 0.9; // au-dessus de la tête
        game.player.vy = -5;
        game.player.onGround = false;
        game.step(1 / 240);
        assert.equal(en.state, 'squashed');
        assert.equal(game.score.score, SCORE.STOMP);
        assert.ok(game.player.vy > 5, `rebond (${game.player.vy})`);
        assert.ok(events.includes('sfx:stomp'));
        assert.equal(game.lives.lives, 3, 'aucun dégât');

        run(game, 0.7);
        assert.equal(en.visible, false, 'retiré après l\'écrasement');
    });
}

test('contact latéral : le petit héros perd une vie et revient au départ', () => {
    const { game, events } = gameWithLevel([goomba(20, 19.99, 20.01)]);
    game.player.x = 20;
    game.player.y = 0;
    game.step(1 / 240);
    assert.equal(game.lives.lives, 2);
    assert.equal(game.player.x, 2.5);
    assert.ok(events.includes('sfx:powerDown'));
});

test('contact latéral : un Super rétrécit, rebondit et devient invincible 2,2 s', () => {
    const { game } = gameWithLevel([goomba(20, 19.99, 20.01)]);
    game.player.isSuper = true;
    game.player.scale = 1.45;
    game.player.targetScale = 1.45;
    game.player.x = 20;
    game.step(1 / 240);
    assert.equal(game.player.isSuper, false);
    assert.equal(game.lives.lives, 3, 'pas de vie perdue');
    assert.ok(game.player.vy > 0);
    assert.ok(game.player.invincibleTimer > 2);

    // Invincible : un nouveau contact ne fait rien
    game.step(1 / 240);
    assert.equal(game.lives.lives, 3);
});

test('3 contacts successifs : Game Over avec la raison affichée', () => {
    const { game, bus } = gameWithLevel([goomba(20, 19.99, 20.01)]);
    const modes = [];
    bus.on('mode', (m, info) => modes.push([m, info.reason]));
    for (let life = 0; life < 3; life++) {
        game.player.x = 20;
        game.player.y = 0;
        game.player.invincibleTimer = 0;
        game.step(1 / 240);
    }
    assert.equal(game.mode, 'GAMEOVER');
    assert.deepEqual(modes.at(-1), ['GAMEOVER', 'Vous avez été touché par un ennemi !']);
});

test('les ennemis ne blessent pas hors du mode PLAYING (menu, pause)', () => {
    const { game } = gameWithLevel([goomba(20, 19.99, 20.01)]);
    game.player.x = 20;
    game.pause();
    game.step(1 / 240);
    assert.equal(game.lives.lives, 3);
    assert.equal(game.mode, 'PAUSED');
});

test('constante de rebond après écrasement', () => {
    assert.equal(PHYSICS.STOMP_BOUNCE, 11.2);
});
