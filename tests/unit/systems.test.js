import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, getLocalStorage } from '../../src/systems/Storage.js';
import { ScoreSystem } from '../../src/systems/ScoreSystem.js';
import { LivesSystem } from '../../src/systems/LivesSystem.js';
import { Settings } from '../../src/systems/Settings.js';
import { STORAGE } from '../../src/data/config.js';

const memoryBackend = () => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};

test('Storage : lecture / écriture / nombre / suppression', () => {
    const s = createStorage(memoryBackend());
    assert.equal(s.get('a', 'défaut'), 'défaut');
    s.set('a', 12);
    assert.equal(s.get('a'), '12');
    assert.equal(s.getNumber('a'), 12);
    assert.equal(s.getNumber('absent', 7), 7);
    s.remove('a');
    assert.equal(s.get('a'), null);
});

test('Storage : un localStorage qui lève des exceptions ne fait jamais planter le jeu', () => {
    const hostile = {
        getItem() { throw new Error('SecurityError'); },
        setItem() { throw new Error('QuotaExceededError'); },
        removeItem() { throw new Error('x'); },
    };
    const s = createStorage(hostile);
    s.set('k', 5); // ne lève pas
    assert.equal(s.getNumber('k'), 5, 'repli sur la mémoire volatile');
});

test('Storage : absence totale de localStorage', () => {
    const s = createStorage(null);
    s.set('k', 'v');
    assert.equal(s.get('k'), 'v');
    assert.equal(getLocalStorage({ get localStorage() { throw new Error('refusé'); } }), null);
});

test('ScoreSystem : le record est enregistré et survit à une nouvelle partie / un redémarrage', () => {
    const backend = memoryBackend();
    const s1 = new ScoreSystem(createStorage(backend));
    assert.equal(s1.best, 0);
    s1.add(300);
    s1.addCoin();
    assert.equal(s1.score, 300);
    assert.equal(s1.coins, 1);
    assert.equal(s1.best, 300);
    assert.equal(backend.getItem(STORAGE.BEST_SCORE), '300');

    s1.reset();
    assert.equal(s1.score, 0);
    assert.equal(s1.coins, 0);
    assert.equal(s1.best, 300, 'le record est conservé');
    s1.add(100);
    assert.equal(s1.best, 300, 'un score plus faible ne remplace pas le record');

    const s2 = new ScoreSystem(createStorage(backend)); // « rechargement de la page »
    assert.equal(s2.best, 300);
});

test('ScoreSystem : relit un record laissé par la version d\'origine (même clé)', () => {
    const backend = memoryBackend();
    backend.setItem('super_mario_25d_best_score', '4200');
    assert.equal(new ScoreSystem(createStorage(backend)).best, 4200);
});

test('LivesSystem : 3 vies, mort à 0, remise à zéro', () => {
    const l = new LivesSystem();
    assert.equal(l.lives, 3);
    assert.equal(l.lose(), 2);
    assert.equal(l.isDead, false);
    l.lose();
    l.lose();
    assert.equal(l.isDead, true);
    l.reset();
    assert.equal(l.lives, 3);
});

test('Settings : le réglage « son coupé » est persistant et tolère un JSON corrompu', () => {
    const backend = memoryBackend();
    const s = new Settings(createStorage(backend));
    assert.equal(s.muted, false);
    s.muted = true;
    assert.equal(new Settings(createStorage(backend)).muted, true);

    backend.setItem(STORAGE.SETTINGS, '{pas du json');
    assert.equal(new Settings(createStorage(backend)).muted, false);
});
