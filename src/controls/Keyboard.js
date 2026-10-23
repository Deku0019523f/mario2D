import { KEYS } from '../data/config.js';

/** Contrôles clavier (QWERTY et AZERTY). */
export class Keyboard {
    /**
     * @param {import('./InputManager.js').InputManager} input
     * @param {Window|EventTarget} target
     */
    constructor(input, target) {
        this.input = input;
        this.target = target;
        /** Touches physiquement enfoncées par action (plusieurs touches peuvent viser la même action). */
        this.held = { left: new Set(), right: new Set(), jump: new Set() };
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onReset = () => {
            for (const set of Object.values(this.held)) set.clear();
        };
    }

    attach() {
        this.target.addEventListener('keydown', this.onKeyDown);
        this.target.addEventListener('keyup', this.onKeyUp);
        this.offReset = this.input.on('reset', this.onReset);
    }

    detach() {
        this.target.removeEventListener('keydown', this.onKeyDown);
        this.target.removeEventListener('keyup', this.onKeyUp);
        if (this.offReset) this.offReset();
    }

    actionFor(key) {
        if (KEYS.LEFT.includes(key)) return 'left';
        if (KEYS.RIGHT.includes(key)) return 'right';
        if (KEYS.JUMP.includes(key)) return 'jump';
        return null;
    }

    onKeyDown(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const action = this.actionFor(e.key);
        if (action) {
            if (action === 'jump') e.preventDefault(); // évite le défilement de la page avec Espace
            this.held[action].add(e.key);
            this.input.setAction('keyboard', action, true);
            return;
        }
        if (!e.repeat) {
            if (KEYS.PAUSE.includes(e.key)) this.input.emit('pause');
            else if (KEYS.CONFIRM.includes(e.key)) this.input.emit('confirm');
        }
    }

    onKeyUp(e) {
        const action = this.actionFor(e.key);
        if (!action) return;
        if (action === 'jump') e.preventDefault();
        this.held[action].delete(e.key);
        if (this.held[action].size === 0) this.input.setAction('keyboard', action, false);
    }
}
