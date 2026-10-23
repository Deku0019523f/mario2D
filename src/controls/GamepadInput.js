/**
 * Manette (Gamepad API, mapping « standard ») : croix directionnelle ou stick gauche pour
 * se déplacer, A / X pour sauter, Start pour la pause.
 * La manette n'est lue que pendant que le jeu appelle `poll()` (une fois par frame).
 */
export class GamepadInput {
    /**
     * @param {import('./InputManager.js').InputManager} input
     * @param {{getGamepads?: () => (Gamepad|null)[]}} nav objet de type navigator
     */
    constructor(input, nav) {
        this.input = input;
        this.nav = nav;
        this.deadzone = 0.4;
        this.prev = { jump: false, start: false };
        this.connected = false;
    }

    firstPad() {
        const pads = this.nav && typeof this.nav.getGamepads === 'function' ? this.nav.getGamepads() : [];
        for (const pad of pads || []) if (pad && pad.connected) return pad;
        return null;
    }

    poll() {
        const pad = this.firstPad();
        if (!pad) {
            if (this.connected) {
                this.connected = false;
                this.input.setAction('gamepad', 'left', false);
                this.input.setAction('gamepad', 'right', false);
                this.input.setAction('gamepad', 'jump', false);
                this.prev = { jump: false, start: false };
            }
            return;
        }
        this.connected = true;

        const axis = pad.axes[0] || 0;
        const btn = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
        const left = axis < -this.deadzone || btn(14);
        const right = axis > this.deadzone || btn(15);
        const jump = btn(0) || btn(2);
        const start = btn(9);

        this.input.setAction('gamepad', 'left', left);
        this.input.setAction('gamepad', 'right', right);
        this.input.setAction('gamepad', 'jump', jump);

        if (jump && !this.prev.jump) this.input.emit('confirm'); // A valide aussi les menus
        if (start && !this.prev.start) this.input.emit('pause');
        this.prev = { jump, start };
    }
}
