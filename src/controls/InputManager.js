/**
 * Agrégateur d'entrées : clavier, tactile et manette écrivent chacun dans leur « source »,
 * le jeu lit l'état combiné. Lâcher une touche ne coupe donc pas un doigt encore posé sur ◄.
 *
 * Contrat lu par le jeu : `left`, `right`, `jumpHeld` (booléens).
 * Événements : 'jumpPress', 'jumpRelease', 'pause', 'confirm', 'change', 'reset'.
 */
export class InputManager {
    constructor() {
        /** @type {Map<string, {left:boolean,right:boolean,jump:boolean}>} */
        this.sources = new Map();
        /** @type {Record<string, Function[]>} */
        this.handlers = {};
    }

    get left() {
        return this._any('left');
    }

    get right() {
        return this._any('right');
    }

    get jumpHeld() {
        return this._any('jump');
    }

    _any(action) {
        for (const state of this.sources.values()) if (state[action]) return true;
        return false;
    }

    on(event, fn) {
        (this.handlers[event] ||= []).push(fn);
        return () => {
            this.handlers[event] = (this.handlers[event] || []).filter((f) => f !== fn);
        };
    }

    emit(event, ...args) {
        for (const fn of [...(this.handlers[event] || [])]) fn(...args);
    }

    /**
     * @param {string} source identifiant de la source ('keyboard', 'touch-dpad', 'touch-jump', 'gamepad')
     * @param {'left'|'right'|'jump'} action
     * @param {boolean} down
     */
    setAction(source, action, down) {
        let state = this.sources.get(source);
        if (!state) {
            state = { left: false, right: false, jump: false };
            this.sources.set(source, state);
        }
        if (state[action] === down) return;

        const heldBefore = this.jumpHeld;
        state[action] = down;

        if (action === 'jump') {
            if (down && !heldBefore) this.emit('jumpPress');
            else if (!down && heldBefore && !this.jumpHeld) this.emit('jumpRelease');
        }
        this.emit('change');
    }

    /** Relâche tout (perte de focus, pause) : évite les touches « collées ». */
    releaseAll() {
        const wasJumping = this.jumpHeld;
        for (const state of this.sources.values()) {
            state.left = false;
            state.right = false;
            state.jump = false;
        }
        this.emit('reset');
        if (wasJumping) this.emit('jumpRelease');
        this.emit('change');
    }
}
