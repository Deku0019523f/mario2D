/**
 * Harnais de non-régression : exécute le script ORIGINAL (legacy/Super Mario 2.5D World.original.html)
 * dans un contexte `vm` avec un DOM, un canvas et un Three.js simulés, puis expose son état interne.
 * Les tests comparent ainsi la nouvelle version à la version d'origine, image par image.
 *
 * Seule fonction d'origine non exécutée telle quelle : aucune. Le script est lancé sans modification,
 * on y ajoute uniquement une ligne finale qui publie ses variables internes (`__LEGACY__`).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const LEGACY_PATH = path.resolve(here, '../../legacy/Super Mario 2.5D World.original.html');

// ------------------------------------------------------------------ Doublures minimales

/** Objet « tout-terrain » : toute lecture de propriété renvoie un autre stub, toute écriture est conservée. */
function deepStub() {
    const own = new Map();
    const fn = function () {
        return proxy;
    };
    const proxy = new Proxy(fn, {
        get(_t, key) {
            if (key === Symbol.toPrimitive) return () => 0;
            if (!own.has(key)) own.set(key, deepStub());
            return own.get(key);
        },
        set(_t, key, value) {
            own.set(key, value);
            return true;
        },
        apply() {
            return proxy;
        },
        construct() {
            return proxy;
        },
    });
    return proxy;
}

class Vec {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    setScalar(s) {
        return this.set(s, s, s);
    }
    project() {
        return this;
    }
}

class Obj3D {
    constructor() {
        this.children = [];
        this.parent = null;
        this.position = new Vec();
        this.rotation = new Vec();
        this.scale = new Vec(1, 1, 1);
        this.visible = true;
    }
    add(o) {
        this.children.push(o);
        o.parent = this;
        return this;
    }
    remove(o) {
        const i = this.children.indexOf(o);
        if (i >= 0) this.children.splice(i, 1);
    }
    lookAt() {}
    updateMatrixWorld() {}
}

/** Enveloppe un objet pour que toute propriété absente renvoie un stub (ex. light.shadow.mapSize.width). */
function lenient(obj) {
    const extra = new Map();
    return new Proxy(obj, {
        get(t, key) {
            if (key in t) return t[key];
            if (typeof key === 'symbol') return undefined;
            if (!extra.has(key)) extra.set(key, deepStub());
            return extra.get(key);
        },
        set(t, key, value) {
            if (key in t || !extra.has(key)) t[key] = value;
            else extra.set(key, value);
            return true;
        },
    });
}

function makeTHREE() {
    class Mesh extends Obj3D {
        constructor(geometry, material) {
            super();
            this.geometry = geometry;
            this.material = material;
        }
    }
    const known = { Group: Obj3D, Mesh, Vector3: Vec };
    const cache = new Map();
    return new Proxy(known, {
        get(t, key) {
            if (key in t) return t[key];
            if (typeof key === 'symbol') return undefined;
            if (!cache.has(key)) {
                cache.set(key, class Generic extends Obj3D {
                    constructor(...args) {
                        super();
                        this.args = args;
                        return lenient(this);
                    }
                });
            }
            return cache.get(key);
        },
    });
}

function makeElement(id, registry) {
    const el = {
        id,
        handlers: {},
        style: {},
        children: [],
        textContent: '',
        className: '',
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        addEventListener(type, fn) {
            (this.handlers[type] ||= []).push(fn);
        },
        appendChild(c) {
            this.children.push(c);
            c.parentNode = this;
        },
        removeChild(c) {
            const i = this.children.indexOf(c);
            if (i >= 0) this.children.splice(i, 1);
        },
        getContext: () => deepStub(),
        width: 0,
        height: 0,
        parentNode: null,
    };
    registry.set(id, el);
    return el;
}

// ------------------------------------------------------------------ Chargement

/**
 * Charge le jeu d'origine. `frame()` avance d'une frame de 1/64 s en appelant la vraie
 * fonction `animate` d'origine.
 */
export function loadLegacy() {
    const html = fs.readFileSync(LEGACY_PATH, 'utf8');
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!match) throw new Error('Script inline introuvable dans le fichier original');

    const elements = new Map();
    const windowHandlers = {};
    let now = 0;
    let rafCallback = null;
    const storage = new Map();

    const document = {
        getElementById: (id) => elements.get(id) || makeElement(id, elements),
        createElement: (tag) => makeElement(`<${tag}>`, new Map()),
    };
    const win = {
        innerWidth: 1280,
        innerHeight: 720,
        devicePixelRatio: 1,
        addEventListener: (type, fn) => {
            (windowHandlers[type] ||= []).push(fn);
        },
        AudioContext: undefined,
    };

    const context = vm.createContext({
        document,
        window: win,
        THREE: makeTHREE(),
        localStorage: {
            getItem: (k) => (storage.has(k) ? storage.get(k) : null),
            setItem: (k, v) => storage.set(k, String(v)),
        },
        performance: { now: () => now },
        requestAnimationFrame: (cb) => {
            rafCallback = cb;
            return 1;
        },
        setTimeout: () => 0,
        console: { log() {}, warn() {}, error: console.error },
        Math,
        parseInt,
        String,
        Number,
        Array,
        Object,
    });

    // On publie les variables internes à la fin du script d'origine (aucune autre modification).
    const exposer = `
        globalThis.__LEGACY__ = {
            game,
            get colliders() { return colliders; },
            get interactiveBlocks() { return interactiveBlocks; },
            get coinsList() { return coinsList; },
            get mushroomsList() { return mushroomsList; },
            get enemiesList() { return enemiesList; },
            get particlesList() { return particlesList; },
            get flagpoleObj() { return flagpoleObj; },
        };`;
    vm.runInContext(match[1] + exposer, context, { filename: 'legacy-inline-script.js' });

    const api = context.__LEGACY__;
    // 15,625 ms = 1/64 s : valeur exactement représentable en binaire, donc dt identique (0.015625)
    // des deux côtés, sans erreur d'arrondi cumulée (1000/60 ms n'est pas exact).
    const frameMs = 15.625;

    return {
        api,
        game: api.game,
        elements,
        /** Avance d'une frame (appelle `animate` d'origine avec un horodatage maîtrisé). */
        frame() {
            now += frameMs;
            const cb = rafCallback;
            if (!cb) throw new Error('animate() non planifiée');
            cb(now);
        },
        click(id) {
            for (const fn of elements.get(id).handlers.click || []) fn({});
        },
        key(type, key) {
            for (const fn of windowHandlers[type] || []) fn({ key, repeat: false, preventDefault() {} });
        },
    };
}
