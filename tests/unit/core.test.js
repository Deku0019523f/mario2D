import test from 'node:test';
import assert from 'node:assert/strict';
import { GameLoop } from '../../src/core/GameLoop.js';
import { CameraRig, computeCameraZ } from '../../src/core/CameraRig.js';
import { createRng } from '../../src/core/rng.js';
import { resolveQualityName, resolveQuality } from '../../src/rendering/quality.js';
import { EventBus } from '../../src/core/events.js';
import { CAMERA, PHYSICS, QUALITY_PRESETS } from '../../src/data/config.js';

function loopHarness(opts = {}) {
    let steps = 0;
    const renders = [];
    let queued = null;
    const loop = new GameLoop({
        step: () => steps++,
        render: (dt) => renders.push(dt),
        raf: (cb) => ((queued = cb), 1),
        caf: () => (queued = null),
        ...opts,
    });
    return { loop, steps: () => steps, renders, queued: () => queued };
}

test('GameLoop : le nombre de pas de simulation par seconde est indépendant du framerate', () => {
    for (const fps of [30, 60, 144]) {
        const h = loopHarness();
        h.loop.start();
        let t = 0;
        for (let i = 0; i <= fps; i++) {
            h.loop.tick(t);
            t += 1000 / fps;
        }
        const expected = 1 / PHYSICS.FIXED_STEP;
        assert.ok(Math.abs(h.steps() - expected) <= 2, `${fps} fps -> ${h.steps()} pas (attendu ≈ ${expected})`);
        assert.equal(h.renders.length, fps + 1, 'un rendu par frame');
    }
});

test('GameLoop : une longue pause (onglet masqué) est plafonnée, pas de spirale de la mort', () => {
    const h = loopHarness();
    h.loop.start();
    h.loop.tick(0);
    h.loop.tick(60000); // 60 s plus tard
    assert.ok(h.steps() <= PHYSICS.MAX_FRAME_TIME / PHYSICS.FIXED_STEP + 1);
});

test('GameLoop : première frame sans rattrapage ; stop() annule la frame planifiée', () => {
    const h = loopHarness();
    h.loop.start();
    h.loop.tick(123456);
    assert.equal(h.steps(), 0);
    h.loop.stop();
    assert.equal(h.queued(), null);
    h.loop.tick(200000);
    assert.equal(h.steps(), 0, 'arrêtée : aucune simulation');
});

test('GameLoop : start() est idempotent ; un redémarrage ne rattrape pas le temps écoulé', () => {
    const h = loopHarness();
    h.loop.start();
    h.loop.start();
    h.loop.tick(0);
    h.loop.stop();
    h.loop.start();
    h.loop.tick(50000);
    assert.equal(h.steps(), 0);
});

test('CameraRig : suit le héros avec anticipation et respecte les bornes', () => {
    const cam = new CameraRig();
    for (let i = 0; i < 600; i++) cam.update(1 / 60, { x: 50, y: 0, facing: 1 });
    assert.ok(Math.abs(cam.x - (50 + CAMERA.LOOK_AHEAD)) < 0.05);
    for (let i = 0; i < 600; i++) cam.update(1 / 60, { x: -100, y: -50, facing: -1 });
    assert.ok(cam.x >= CAMERA.MIN_X - 1e-6);
    assert.ok(cam.y >= CAMERA.MIN_Y - 1e-6);
});

test('CameraRig : le suivi est indépendant du framerate (±2 %)', () => {
    const at = (fps) => {
        const c = new CameraRig();
        for (let i = 0; i < fps; i++) c.update(1 / fps, { x: 20, y: 0, facing: 1 });
        return c.x;
    };
    assert.ok(Math.abs(at(30) - at(144)) / at(144) < 0.02, `${at(30)} vs ${at(144)}`);
});

test('computeCameraZ : recul progressif en portrait, distance de référence en paysage', () => {
    assert.equal(computeCameraZ(16 / 9), CAMERA.BASE_Z);
    assert.ok(computeCameraZ(9 / 16) > computeCameraZ(1));
    assert.equal(computeCameraZ(0.1), CAMERA.BASE_Z + CAMERA.PORTRAIT_Z_EXTRA);
});

test('rng : déterministe, dans [0,1), seeds différentes -> suites différentes', () => {
    const a = createRng(42);
    const b = createRng(42);
    const c = createRng(43);
    const sa = Array.from({ length: 20 }, a);
    assert.deepEqual(sa, Array.from({ length: 20 }, b));
    assert.notDeepEqual(sa, Array.from({ length: 20 }, c));
    assert.ok(sa.every((v) => v >= 0 && v < 1));
});

test('qualité : paramètre d\'URL prioritaire, sinon heuristique mobile / PC', () => {
    assert.equal(resolveQualityName({ search: '?quality=low', userAgent: 'Windows' }), 'low');
    assert.equal(resolveQualityName({ search: '?quality=ultra' }), 'high', 'valeur inconnue ignorée');
    assert.equal(resolveQualityName({ userAgent: 'Mozilla/5.0 (Windows NT 10.0)' }), 'high');
    assert.equal(resolveQualityName({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Mobile', deviceMemory: 8, hardwareConcurrency: 8 }), 'medium');
    assert.equal(resolveQualityName({ userAgent: 'Android Mobile', deviceMemory: 2 }), 'low');
    assert.equal(resolveQualityName({ userAgent: 'Android Mobile', hardwareConcurrency: 4 }), 'low');
    assert.equal(resolveQualityName({ userAgent: 'X', maxTouchPoints: 5 }), 'medium', 'tablette détectée par le tactile');
    const q = resolveQuality({ search: '?quality=low' });
    assert.equal(q.name, 'low');
    assert.deepEqual({ ...q, name: undefined }, { ...QUALITY_PRESETS.low, name: undefined });
});

test('bus d\'événements : on / emit / off', () => {
    const bus = new EventBus();
    const got = [];
    const off = bus.on('x', (a) => got.push(a));
    bus.emit('x', 1);
    off();
    bus.emit('x', 2);
    assert.deepEqual(got, [1]);
});
