import test from 'node:test';
import assert from 'node:assert/strict';
import { SoundEngine } from '../../src/audio/SoundEngine.js';
import { AudioManager } from '../../src/audio/AudioManager.js';
import { EventBus } from '../../src/core/events.js';
import { Settings } from '../../src/systems/Settings.js';
import { createStorage } from '../../src/systems/Storage.js';

class FakeParam {
    constructor() { this.calls = []; }
    setValueAtTime(...a) { this.calls.push(['set', ...a]); }
    exponentialRampToValueAtTime(...a) { this.calls.push(['exp', ...a]); }
}
function fakeCtxClass(log) {
    return class FakeAudioContext {
        constructor() {
            this.currentTime = 0;
            this.sampleRate = 8000;
            this.state = 'running';
            this.destination = {};
            log.contexts.push(this);
        }
        createOscillator() { log.osc++; return { type: '', frequency: new FakeParam(), connect() {}, start() {}, stop() {} }; }
        createGain() { return { gain: new FakeParam(), connect() {} }; }
        createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
        createBufferSource() { log.noise++; return { connect() {}, start() {} }; }
        createBiquadFilter() { return { frequency: {}, connect() {} }; }
        suspend() { this.state = 'suspended'; }
        resume() { this.state = 'running'; }
    };
}

test('SoundEngine : aucun contexte avant le premier geste, puis un seul contexte', () => {
    const log = { contexts: [], osc: 0, noise: 0 };
    const e = new SoundEngine({ AudioContextClass: fakeCtxClass(log) });
    assert.equal(log.contexts.length, 0);
    e.init();
    e.init();
    assert.equal(log.contexts.length, 1);
});

test('SoundEngine : chaque effet produit des oscillateurs (ou du bruit pour les briques)', () => {
    const log = { contexts: [], osc: 0, noise: 0 };
    const e = new SoundEngine({ AudioContextClass: fakeCtxClass(log) });
    const expected = { playJump: 1, playCoin: 1, playBump: 1, playMushroomSpawn: 6, playPowerUp: 12, playPowerDown: 7, playStomp: 1, playWinFanfare: 6, playGameOver: 7 };
    for (const [m, n] of Object.entries(expected)) {
        const before = log.osc;
        e[m]();
        assert.equal(log.osc - before, n, `${m} : ${n} notes`);
    }
    e.playBrickSmash();
    assert.equal(log.noise, 1);
});

test('SoundEngine : muet = aucun son et aucun contexte créé', () => {
    const log = { contexts: [], osc: 0, noise: 0 };
    const e = new SoundEngine({ muted: true, AudioContextClass: fakeCtxClass(log) });
    e.playJump();
    e.playCoin();
    assert.equal(log.osc, 0);
    assert.equal(log.contexts.length, 0);
});

test('SoundEngine : navigateur sans Web Audio — aucune exception', () => {
    const e = new SoundEngine({ AudioContextClass: class { constructor() { throw new Error('indisponible'); } } });
    const warn = console.warn;
    console.warn = () => {};
    try {
        assert.doesNotThrow(() => { e.playJump(); e.playWinFanfare(); });
    } finally {
        console.warn = warn;
    }
});

test('SoundEngine : suspend / resume du contexte', () => {
    const log = { contexts: [], osc: 0, noise: 0 };
    const e = new SoundEngine({ AudioContextClass: fakeCtxClass(log) });
    e.init();
    e.suspend();
    assert.equal(log.contexts[0].state, 'suspended');
    e.resume();
    assert.equal(log.contexts[0].state, 'running');
});

test('AudioManager : les événements sfx jouent le bon son, la pause suspend, le réglage muet persiste', () => {
    const log = { contexts: [], osc: 0, noise: 0 };
    const bus = new EventBus();
    const backend = new Map();
    const store = { getItem: (k) => backend.get(k) ?? null, setItem: (k, v) => backend.set(k, String(v)), removeItem: (k) => backend.delete(k) };
    const settings = new Settings(createStorage(store));
    const engine = new SoundEngine({ AudioContextClass: fakeCtxClass(log) });
    const am = new AudioManager({ bus, engine, settings });

    am.unlock();
    bus.emit('sfx', 'coin');
    assert.equal(log.osc, 1);
    bus.emit('sfx', 'inconnu'); // ignoré sans erreur
    assert.equal(log.osc, 1);

    bus.emit('mode', 'PAUSED');
    assert.equal(log.contexts[0].state, 'suspended');
    bus.emit('mode', 'PLAYING');
    assert.equal(log.contexts[0].state, 'running');

    assert.equal(am.toggleMute(), true);
    bus.emit('sfx', 'jump');
    assert.equal(log.osc, 1, 'muet : pas de nouveau son');
    assert.equal(new Settings(createStorage(store)).muted, true, 'réglage persistant');

    am.dispose();
    am.toggleMute();
    bus.emit('sfx', 'coin');
    assert.equal(log.osc, 1, 'plus d\'écoute après dispose');
});
