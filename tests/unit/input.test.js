import test from 'node:test';
import assert from 'node:assert/strict';
import { InputManager } from '../../src/controls/InputManager.js';
import { Keyboard } from '../../src/controls/Keyboard.js';
import { TouchControls } from '../../src/controls/TouchControls.js';
import { GamepadInput } from '../../src/controls/GamepadInput.js';
import { createEl } from '../helpers/fake-dom.js';

function kbSetup() {
    const input = new InputManager();
    const target = createEl('window');
    const kb = new Keyboard(input, target);
    kb.attach();
    const key = (type, k, extra = {}) => target.dispatch(type, { key: k, ...extra });
    return { input, target, kb, key };
}

test('InputManager : les sources se combinent (OU logique)', () => {
    const i = new InputManager();
    i.setAction('keyboard', 'left', true);
    i.setAction('touch-dpad', 'left', true);
    i.setAction('keyboard', 'left', false);
    assert.equal(i.left, true, 'le doigt tient encore ◄');
    i.setAction('touch-dpad', 'left', false);
    assert.equal(i.left, false);
});

test('InputManager : jumpPress / jumpRelease émis une seule fois, même avec deux sources', () => {
    const i = new InputManager();
    const ev = [];
    i.on('jumpPress', () => ev.push('press'));
    i.on('jumpRelease', () => ev.push('release'));
    i.setAction('keyboard', 'jump', true);
    i.setAction('touch-jump', 'jump', true);
    i.setAction('keyboard', 'jump', false);
    assert.deepEqual(ev, ['press'], 'toujours maintenu par le tactile');
    i.setAction('touch-jump', 'jump', false);
    assert.deepEqual(ev, ['press', 'release']);
});

test('InputManager : releaseAll supprime les touches collées et notifie', () => {
    const i = new InputManager();
    const ev = [];
    i.on('reset', () => ev.push('reset'));
    i.on('jumpRelease', () => ev.push('jr'));
    i.setAction('keyboard', 'right', true);
    i.setAction('keyboard', 'jump', true);
    i.releaseAll();
    assert.equal(i.right, false);
    assert.equal(i.jumpHeld, false);
    assert.deepEqual(ev, ['reset', 'jr']);
});

test('Clavier : flèches, QWERTY et AZERTY pilotent les mêmes actions', () => {
    const { input, key } = kbSetup();
    for (const [k, prop] of [['ArrowLeft', 'left'], ['q', 'left'], ['a', 'left'], ['ArrowRight', 'right'], ['d', 'right'], [' ', 'jumpHeld'], ['z', 'jumpHeld'], ['w', 'jumpHeld'], ['ArrowUp', 'jumpHeld']]) {
        key('keydown', k);
        assert.equal(input[prop], true, `${k} enfoncée`);
        key('keyup', k);
        assert.equal(input[prop], false, `${k} relâchée`);
    }
});

test('Clavier : deux touches pour la même action — relâcher l\'une ne coupe pas l\'autre', () => {
    const { input, key } = kbSetup();
    key('keydown', 'ArrowRight');
    key('keydown', 'd');
    key('keyup', 'd');
    assert.equal(input.right, true);
    key('keyup', 'ArrowRight');
    assert.equal(input.right, false);
});

test('Clavier : Espace empêche le défilement, pause / Entrée émis sans répétition, Ctrl ignoré', () => {
    const { input, key } = kbSetup();
    let prevented = false;
    key('keydown', ' ', { preventDefault: () => (prevented = true) });
    assert.equal(prevented, true);

    const ev = [];
    input.on('pause', () => ev.push('pause'));
    input.on('confirm', () => ev.push('confirm'));
    key('keydown', 'Escape');
    key('keydown', 'Escape', { repeat: true });
    key('keydown', 'p');
    key('keydown', 'Enter');
    assert.deepEqual(ev, ['pause', 'pause', 'confirm']);

    key('keyup', ' ');
    key('keydown', 'd', { ctrlKey: true });
    assert.equal(input.right, false, 'Ctrl+D (favori) ne déplace pas le héros');
});

test('Clavier : une perte de focus (releaseAll) vide les touches mémorisées', () => {
    const { input, key, kb } = kbSetup();
    key('keydown', 'd');
    input.releaseAll();
    assert.equal(input.right, false);
    assert.equal(kb.held.right.size, 0);
});

test('Clavier : detach retire les écouteurs', () => {
    const { target, kb } = kbSetup();
    assert.equal(target.listenerCount('keydown'), 1);
    kb.detach();
    assert.equal(target.listenerCount('keydown'), 0);
});

// --------------------------------------------------------------------------- tactile

function touchSetup() {
    const input = new InputManager();
    const elements = { dpad: createEl('dpad'), btnLeft: createEl('l'), btnRight: createEl('r'), btnJump: createEl('j') };
    elements.btnLeft.getBoundingClientRect = () => ({ left: 0, right: 100 });
    elements.btnRight.getBoundingClientRect = () => ({ left: 120, right: 220 });
    let touches = 0;
    const tc = new TouchControls({ input, elements, onFirstTouch: () => touches++ });
    tc.attach();
    return { input, el: elements, tc, touches: () => touches };
}

test('Tactile : appui à gauche / à droite de la croix, relâchement', () => {
    const { input, el } = touchSetup();
    el.dpad.dispatch('pointerdown', { pointerId: 1, clientX: 30, pointerType: 'touch' });
    assert.equal(input.left, true);
    assert.equal(input.right, false);
    el.dpad.dispatch('pointerup', { pointerId: 1 });
    assert.equal(input.left, false);
    el.dpad.dispatch('pointerdown', { pointerId: 2, clientX: 200, pointerType: 'touch' });
    assert.equal(input.right, true);
});

test('Tactile : glisser le doigt de ◄ vers ► change la direction sans relâcher', () => {
    const { input, el } = touchSetup();
    el.dpad.dispatch('pointerdown', { pointerId: 1, clientX: 30, pointerType: 'touch' });
    el.dpad.dispatch('pointermove', { pointerId: 1, clientX: 200 });
    assert.equal(input.left, false);
    assert.equal(input.right, true);
});

test('Tactile : multitouch — courir ET sauter en même temps, doigts indépendants', () => {
    const { input, el, touches } = touchSetup();
    el.dpad.dispatch('pointerdown', { pointerId: 1, clientX: 200, pointerType: 'touch' });
    el.btnJump.dispatch('pointerdown', { pointerId: 2, pointerType: 'touch' });
    assert.equal(input.right, true);
    assert.equal(input.jumpHeld, true);
    assert.equal(touches(), 2);

    el.btnJump.dispatch('pointerup', { pointerId: 2 });
    assert.equal(input.jumpHeld, false);
    assert.equal(input.right, true, 'le doigt sur la croix tient toujours');
});

test('Tactile : deux doigts sur la croix — relâcher l\'un laisse l\'autre actif', () => {
    const { input, el } = touchSetup();
    el.dpad.dispatch('pointerdown', { pointerId: 1, clientX: 30, pointerType: 'touch' });
    el.dpad.dispatch('pointerdown', { pointerId: 2, clientX: 200, pointerType: 'touch' });
    assert.equal(input.left && input.right, true);
    el.dpad.dispatch('pointerup', { pointerId: 1 });
    assert.equal(input.left, false);
    assert.equal(input.right, true);
});

test('Tactile : pointercancel / lostpointercapture libèrent la touche (pas de bouton collé)', () => {
    const { input, el } = touchSetup();
    el.btnJump.dispatch('pointerdown', { pointerId: 5, pointerType: 'touch' });
    el.btnJump.dispatch('pointercancel', { pointerId: 5 });
    assert.equal(input.jumpHeld, false);
    el.dpad.dispatch('pointerdown', { pointerId: 6, clientX: 30, pointerType: 'touch' });
    el.dpad.dispatch('lostpointercapture', { pointerId: 6 });
    assert.equal(input.left, false);
});

test('Tactile : clic droit souris ignoré, clic gauche accepté, menu contextuel bloqué', () => {
    const { input, el } = touchSetup();
    el.btnJump.dispatch('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 2 });
    assert.equal(input.jumpHeld, false);
    el.btnJump.dispatch('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0 });
    assert.equal(input.jumpHeld, true);
    let blocked = false;
    el.btnJump.dispatch('contextmenu', { preventDefault: () => (blocked = true) });
    assert.equal(blocked, true);
});

test('Tactile : releaseAll (perte de focus) vide les pointeurs ; l\'état visuel suit', () => {
    const { input, el } = touchSetup();
    el.dpad.dispatch('pointerdown', { pointerId: 1, clientX: 200, pointerType: 'touch' });
    assert.equal(el.btnRight.classList.contains('active'), true);
    input.releaseAll();
    assert.equal(el.btnRight.classList.contains('active'), false);
    // un pointerup tardif ne casse rien
    el.dpad.dispatch('pointerup', { pointerId: 1 });
    assert.equal(input.right, false);
});

test('Tactile : detach retire les écouteurs de réflexion', () => {
    const { input, tc, el } = touchSetup();
    tc.detach();
    el.dpad.dispatch('pointerdown', { pointerId: 1, clientX: 30, pointerType: 'touch' });
    assert.equal(input.left, false);
});

// --------------------------------------------------------------------------- manette

const pad = (over = {}) => ({
    connected: true,
    axes: [0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    ...over,
});

test('Manette : stick, croix, A pour sauter, Start pour pause', () => {
    const input = new InputManager();
    let current = null;
    const gp = new GamepadInput(input, { getGamepads: () => [current] });
    const ev = [];
    input.on('pause', () => ev.push('pause'));
    input.on('confirm', () => ev.push('confirm'));

    gp.poll(); // pas de manette : rien
    assert.equal(input.left, false);

    current = pad({ axes: [-0.9] });
    gp.poll();
    assert.equal(input.left, true);

    current = pad({ axes: [0.2] }); // dans la zone morte
    gp.poll();
    assert.equal(input.left || input.right, false);

    const p = pad();
    p.buttons[15].pressed = true;
    p.buttons[0].pressed = true;
    p.buttons[9].pressed = true;
    current = p;
    gp.poll();
    gp.poll(); // maintenu : un seul événement
    assert.equal(input.right, true);
    assert.equal(input.jumpHeld, true);
    assert.deepEqual(ev, ['confirm', 'pause']);

    current = null; // débranchée
    gp.poll();
    assert.equal(input.right, false);
    assert.equal(input.jumpHeld, false);
});

test('Manette : navigateur sans Gamepad API', () => {
    const gp = new GamepadInput(new InputManager(), {});
    assert.doesNotThrow(() => gp.poll());
});
