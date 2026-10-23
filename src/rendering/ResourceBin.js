import {
    BoxGeometry,
    SphereGeometry,
    CylinderGeometry,
    ConeGeometry,
    CircleGeometry,
    PlaneGeometry,
    MeshStandardMaterial,
    MeshBasicMaterial,
} from 'three';

/**
 * Cache de géométries / matériaux avec libération groupée.
 *
 * - Les géométries et matériaux identiques sont partagés (moins de mémoire GPU et de changements d'état).
 * - `dispose()` libère tout : indispensable au changement de niveau (la version d'origine ne libérait rien).
 * - `detail` (0-1) réduit le nombre de segments des formes rondes sur appareils modestes.
 */
export class ResourceBin {
    constructor({ detail = 1 } = {}) {
        this.detail = detail;
        this.cache = new Map();
        this.owned = [];
    }

    /** Enregistre un objet à libérer plus tard (géométrie, matériau ou texture). */
    track(obj) {
        this.owned.push(obj);
        return obj;
    }

    cached(key, factory) {
        let value = this.cache.get(key);
        if (!value) {
            value = factory();
            this.cache.set(key, value);
            this.owned.push(value);
        }
        return value;
    }

    seg(n) {
        return Math.max(4, Math.round(n * this.detail));
    }

    box(w, h, d) {
        return this.cached(`box:${w}:${h}:${d}`, () => new BoxGeometry(w, h, d));
    }

    sphere(r, ws = 8, hs = 8) {
        const a = this.seg(ws);
        const b = this.seg(hs);
        return this.cached(`sphere:${r}:${a}:${b}`, () => new SphereGeometry(r, a, b));
    }

    cylinder(rTop, rBottom, h, seg = 12) {
        const s = this.seg(seg);
        return this.cached(`cyl:${rTop}:${rBottom}:${h}:${s}`, () => new CylinderGeometry(rTop, rBottom, h, s));
    }

    cone(r, h, seg = 12) {
        const s = this.seg(seg);
        return this.cached(`cone:${r}:${h}:${s}`, () => new ConeGeometry(r, h, s));
    }

    circle(r, seg = 16) {
        const s = this.seg(seg);
        return this.cached(`circle:${r}:${s}`, () => new CircleGeometry(r, s));
    }

    plane(w, h) {
        return this.cached(`plane:${w}:${h}`, () => new PlaneGeometry(w, h));
    }

    standard(params) {
        return this.cached(`std:${JSON.stringify(params)}`, () => new MeshStandardMaterial(params));
    }

    basic(params) {
        return this.cached(`basic:${JSON.stringify(params)}`, () => new MeshBasicMaterial(params));
    }

    dispose() {
        for (const item of this.owned) {
            if (item && typeof item.dispose === 'function') item.dispose();
        }
        this.owned = [];
        this.cache.clear();
    }
}
