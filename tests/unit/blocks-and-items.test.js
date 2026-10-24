import test from 'node:test';
import assert from 'node:assert/strict';
import { gameWithLevel, run } from '../helpers/world-helpers.js';
import { triggerBlockHit, updateBlocks } from '../../src/objects/Block.js';
import { spawnParticles, updateParticles } from '../../src/objects/Particle.js';
import { OBJECTS, SCORE } from '../../src/data/config.js';

const block = (x, type, content) => ({ kind: 'block', x, y: 2.55, blockType: type, content });

test('bloc "?" avec pièce : +1 pièce, +200, bloc marqué utilisé ; un 2e coup ne donne rien', () => {
    const { game, events } = gameWithLevel([block(10, 'question', 'coin')]);
    const b = game.world.blocks[0];
    triggerBlockHit(game, b);
    assert.equal(b.used, true);
    assert.equal(game.score.coins, 1);
    assert.equal(game.score.score, SCORE.BLOCK_COIN);
    assert.ok(events.includes('sfx:coin'));

    events.length = 0;
    triggerBlockHit(game, b);
    assert.equal(game.score.coins, 1, 'pas de 2e pièce');
    assert.deepEqual(events, ['sfx:bump']);
});

test('bloc "?" avec champignon : un champignon surgit, monte, puis avance', () => {
    const { game, events } = gameWithLevel([block(10, 'question', 'mushroom')]);
    triggerBlockHit(game, game.world.blocks[0]);
    assert.equal(game.world.mushrooms.length, 1);
    assert.ok(events.includes('sfx:mushroomSpawn'));
    const m = game.world.mushrooms[0];
    assert.equal(m.emerging, true);
    const x0 = m.x;
    run(game, 1);
    assert.equal(m.emerging, false);
    assert.notEqual(m.x, x0, 'le champignon se déplace');
});

test('le champignon rebondit sur un tuyau', () => {
    const { game } = gameWithLevel([
        block(10, 'question', 'mushroom'),
        { kind: 'pipe', x: 14, y: 0, height: 1.5 },
    ]);
    triggerBlockHit(game, game.world.blocks[0]);
    game.player.x = 40; // loin, pour ne pas le ramasser
    let flipped = false;
    for (let i = 0; i < 240 * 6 && !flipped; i++) {
        game.step(1 / 240);
        if (game.world.mushrooms[0].vx < 0) flipped = true;
    }
    assert.ok(flipped, 'le champignon fait demi-tour contre le tuyau');
});

test('ramasser un champignon : devient Super (+1000) ; un 2e champignon donne +1000 sans changer d\'état', () => {
    const { game, events } = gameWithLevel([block(30, 'question', 'mushroom'), block(32, 'question', 'mushroom')]);
    triggerBlockHit(game, game.world.blocks[0]);
    const m = game.world.mushrooms[0];
    m.emerging = false;
    m.x = game.player.x;
    m.y = game.player.y;
    run(game, 0.05);
    assert.equal(game.player.isSuper, true);
    assert.equal(game.player.targetScale, 1.45);
    assert.equal(game.score.score, SCORE.MUSHROOM);
    assert.ok(events.includes('sfx:powerUp'));

    triggerBlockHit(game, game.world.blocks[1]);
    const m2 = game.world.mushrooms[1];
    m2.emerging = false;
    m2.x = game.player.x;
    m2.y = game.player.y;
    run(game, 0.05);
    assert.equal(game.score.score, SCORE.MUSHROOM * 2);
    assert.equal(game.player.isSuper, true);
});

test('brique : un petit héros la fait seulement vibrer, un Super la fracasse (+50, collider désactivé)', () => {
    const { game, events } = gameWithLevel([block(10, 'brick', 'empty'), block(12, 'brick', 'empty')]);
    const [b1, b2] = game.world.blocks;

    triggerBlockHit(game, b1);
    assert.equal(b1.destroyed, false);
    assert.equal(b1.collider.active, true);
    assert.ok(events.includes('sfx:bump'));

    game.player.isSuper = true;
    triggerBlockHit(game, b2);
    assert.equal(b2.destroyed, true);
    assert.equal(b2.collider.active, false);
    assert.equal(game.score.score, SCORE.BRICK_SMASH);
    assert.ok(events.includes('sfx:brick'));
    assert.ok(game.world.particles.length > 0, 'éclats de briques');

    // Une brique détruite ne réagit plus
    const before = game.score.score;
    triggerBlockHit(game, b2);
    assert.equal(game.score.score, before);
});

test('animation de rebond : le bloc monte puis revient à sa place', () => {
    const { game } = gameWithLevel([block(10, 'brick', 'empty')]);
    const b = game.world.blocks[0];
    triggerBlockHit(game, b);
    let max = 0;
    for (let i = 0; i < 60; i++) {
        updateBlocks(game.world, 1 / 240);
        max = Math.max(max, b.offsetY);
    }
    assert.ok(max > 0.3 && max <= OBJECTS.BLOCK_BOUNCE_HEIGHT + 1e-9, `hauteur de rebond ${max}`);
    for (let i = 0; i < 100; i++) updateBlocks(game.world, 1 / 240);
    assert.equal(b.offsetY, 0);
});

test('un bloc frappé élimine un ennemi posé dessus (+200)', () => {
    const { game } = gameWithLevel([
        block(10, 'brick', 'empty'),
        { kind: 'enemy', enemyType: 'goomba', x: 10, y: 3.47, minX: 9, maxX: 11 },
    ]);
    triggerBlockHit(game, game.world.blocks[0]);
    assert.equal(game.world.enemies[0].state, 'squashed');
    assert.equal(game.score.score, SCORE.BLOCK_KO);
});

test('pièce au sol : ramassée au contact (+100, +1 pièce)', () => {
    const { game, events } = gameWithLevel([{ kind: 'coin', x: 2, y: 0.6 }]);
    run(game, 0.02);
    assert.equal(game.world.coins[0].collected, true);
    assert.equal(game.score.coins, 1);
    assert.equal(game.score.score, SCORE.COIN);
    assert.ok(events.includes('sfx:coin'));
});

test('pièce éloignée : non ramassée', () => {
    const { game } = gameWithLevel([{ kind: 'coin', x: 20, y: 0.6 }]);
    run(game, 0.1);
    assert.equal(game.world.coins[0].collected, false);
});

test('particules : durée de vie limitée et plafond MAX_PARTICLES', () => {
    const { game } = gameWithLevel();
    const w = game.world;
    spawnParticles(w, Math.random, 0, 0, 0xffffff, 10);
    assert.equal(w.particles.length, 10);
    run(game, 1);
    assert.equal(w.particles.length, 0, 'toutes expirées après ~0,55 s');

    spawnParticles(w, Math.random, 0, 0, 0xffffff, OBJECTS.MAX_PARTICLES + 50);
    assert.equal(w.particles.length, OBJECTS.MAX_PARTICLES);
    updateParticles(w, 0.1);
    assert.ok(w.particles.every((p) => p.life < 1));
});
