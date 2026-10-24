import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSide, resolveVertical, findGroundBelow } from '../../src/physics/collision.js';

const ground = { type: 'ground', minX: 0, maxX: 20, minY: -5, maxY: 0 };
const wall = { type: 'pipe', minX: 10, maxX: 11, minY: 0, maxY: 2 };

test('atterrissage : le corps est posé sur le dessus du sol', () => {
    const body = { x: 5, y: -0.1, vy: -3, onGround: false };
    resolveVertical(body, 0.1, 0.3, 1.2, [ground], () => {}, -1.5);
    assert.equal(body.y, 0);
    assert.equal(body.vy, 0);
    assert.equal(body.onGround, true);
});

test('pas d\'atterrissage en dehors de la largeur du collider', () => {
    const body = { x: 25, y: -0.1, vy: -3, onGround: false };
    resolveVertical(body, 0.1, 0.3, 1.2, [ground], () => {}, -1.5);
    assert.equal(body.onGround, false);
    assert.ok(body.y < 0);
});

test('coup de tête : le corps est repoussé sous le bloc et le callback est appelé', () => {
    const block = { type: 'block', minX: 4, maxX: 5, minY: 2.55, maxY: 3.47, active: true };
    const body = { x: 4.5, y: 1.4, vy: 12, onGround: false };
    const bumped = [];
    resolveVertical(body, 1.3, 0.3, 1.22, [block], (c) => bumped.push(c), -1.5);
    assert.deepEqual(bumped, [block]);
    assert.ok(Math.abs(body.y - (2.55 - 1.22)) < 1e-9);
    assert.equal(body.vy, -1.5);
});

test('un collider désactivé (brique détruite) est ignoré', () => {
    const dead = { ...ground, active: false };
    const body = { x: 5, y: -0.1, vy: -3, onGround: false };
    resolveVertical(body, 0.1, 0.3, 1.2, [dead], () => {}, -1.5);
    assert.equal(body.onGround, false);
});

test('collision latérale : repoussé à gauche du mur quand il avance vers la droite', () => {
    const body = { x: 9.9, y: 0, vx: 5 };
    resolveSide(body, 0.31, 1.22, [wall]);
    assert.ok(Math.abs(body.x - (10 - 0.31)) < 1e-9);
    assert.equal(body.vx, 0);
});

test('collision latérale : repoussé à droite du mur quand il avance vers la gauche', () => {
    const body = { x: 11.1, y: 0, vx: -5 };
    resolveSide(body, 0.31, 1.22, [wall]);
    assert.ok(Math.abs(body.x - (11 + 0.31)) < 1e-9);
    assert.equal(body.vx, 0);
});

test('pas de collision latérale quand on saute au-dessus du mur', () => {
    const body = { x: 10.5, y: 2.1, vx: 5 };
    resolveSide(body, 0.31, 1.22, [wall]);
    assert.equal(body.vx, 5);
});

test('findGroundBelow : renvoie le sol le plus haut sous le point, ou null au-dessus d\'un précipice', () => {
    const island = { type: 'ground', minX: 4, maxX: 8, minY: 0.8, maxY: 1.65 };
    assert.equal(findGroundBelow(5, 3, [ground, island]), 1.65);
    assert.equal(findGroundBelow(1, 3, [ground, island]), 0);
    assert.equal(findGroundBelow(50, 3, [ground, island]), null);
});
