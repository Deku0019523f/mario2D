import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_1, LEVELS, getLevel } from '../../src/data/levels.js';
import { buildWorld } from '../../src/world/LevelBuilder.js';
import { createRng } from '../../src/core/rng.js';

const items = (kind) => LEVEL_1.items.filter((i) => i.kind === kind);

test('niveau 1 : structure attendue (blocs, ennemis, pièces, tuyaux, plateformes)', () => {
    assert.equal(LEVEL_1.flagX, 128);
    assert.ok(items('block').length >= 10);
    assert.ok(items('enemy').length >= 8);
    assert.ok(items('coin').length >= 10);
    assert.ok(items('pipe').length >= 4);
    assert.ok(items('platform').length >= 5);
});

test('tous les items ont des coordonnées numériques finies et un type connu', () => {
    const known = new Set(['platform', 'pipe', 'block', 'coin', 'enemy']);
    for (const it of LEVEL_1.items) {
        assert.ok(known.has(it.kind), `kind inconnu : ${it.kind}`);
        for (const [k, v] of Object.entries(it)) if (typeof v === 'number') assert.ok(Number.isFinite(v), `${it.kind}.${k}`);
    }
    for (const b of items('block')) {
        assert.ok(['question', 'brick'].includes(b.blockType));
        assert.ok(['coin', 'mushroom', 'empty'].includes(b.content));
    }
    for (const e of items('enemy')) {
        assert.ok(['goomba', 'koopa'].includes(e.enemyType));
        assert.ok(e.minX < e.maxX && e.x >= e.minX && e.x <= e.maxX, 'ennemi dans sa zone de patrouille');
    }
});

test('le drapeau est atteignable : le sol est continu autour de flagX', () => {
    const w = buildWorld(LEVEL_1, { rng: createRng(1), version: 1 });
    assert.ok(w.flag.x === LEVEL_1.flagX);
    assert.ok(w.platforms.some((p) => p.x <= LEVEL_1.flagX && p.x + p.width >= LEVEL_1.flagX));
});

test('le premier bloc "?" contient bien un champignon (Super garanti)', () => {
    const first = items('block')[0];
    assert.equal(first.blockType, 'question');
    assert.equal(first.content, 'mushroom');
});

test('construction du monde : mêmes décomptes que les données, décor déterministe', () => {
    const a = buildWorld(LEVEL_1, { rng: createRng(7), version: 1 });
    const b = buildWorld(LEVEL_1, { rng: createRng(7), version: 2 });
    assert.equal(a.blocks.length, items('block').length);
    assert.equal(a.enemies.length, items('enemy').length);
    assert.equal(a.coins.length, items('coin').length);
    assert.equal(a.scenery.clouds.length, b.scenery.clouds.length);
    assert.deepEqual(a.scenery.clouds.map((c) => c.x), b.scenery.clouds.map((c) => c.x));
    assert.deepEqual(a.scenery.hills.map((h) => h.x), b.scenery.hills.map((h) => h.x));
});

test('getLevel : le niveau n>1 réutilise la disposition avec le bon numéro de monde', () => {
    assert.equal(getLevel(1), LEVELS[0]);
    const l3 = getLevel(3);
    assert.equal(l3.id, 3);
    assert.equal(l3.items, LEVEL_1.items);
});

test('les données de niveau sont gelées (immuables)', () => {
    assert.ok(Object.isFrozen(LEVEL_1));
});
