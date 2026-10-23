/**
 * Contrôles tactiles basés sur les Pointer Events : multitouch réel (chaque doigt a son
 * `pointerId`), glissement entre ◄ et ► sans lever le doigt, souris acceptée.
 *
 * - La croix (◄ ►) est gérée au niveau du conteneur : la direction dépend de la position X du doigt.
 * - Le bouton SAUT est indépendant : on peut courir et sauter simultanément.
 */
export class TouchControls {
    /**
     * @param {object} deps
     * @param {import('./InputManager.js').InputManager} deps.input
     * @param {{dpad: HTMLElement, btnLeft: HTMLElement, btnRight: HTMLElement, btnJump: HTMLElement}} deps.elements
     * @param {() => void} [deps.onFirstTouch] appelé à chaque pression (déverrouillage audio)
     */
    constructor({ input, elements, onFirstTouch }) {
        this.input = input;
        this.el = elements;
        this.onFirstTouch = onFirstTouch || (() => {});
        /** pointerId -> 'left' | 'right' */
        this.dpadPointers = new Map();
        /** Ensemble des pointerId posés sur le bouton de saut. */
        this.jumpPointers = new Set();
        this.cleanups = [];
    }

    attach() {
        const { dpad, btnJump } = this.el;
        this.listen(dpad, 'pointerdown', (e) => this.onDpadDown(e));
        this.listen(dpad, 'pointermove', (e) => this.onDpadMove(e));
        this.listen(dpad, 'pointerup', (e) => this.onDpadEnd(e));
        this.listen(dpad, 'pointercancel', (e) => this.onDpadEnd(e));
        this.listen(dpad, 'lostpointercapture', (e) => this.onDpadEnd(e));

        this.listen(btnJump, 'pointerdown', (e) => this.onJumpDown(e));
        this.listen(btnJump, 'pointerup', (e) => this.onJumpEnd(e));
        this.listen(btnJump, 'pointercancel', (e) => this.onJumpEnd(e));
        this.listen(btnJump, 'lostpointercapture', (e) => this.onJumpEnd(e));

        // Pas de menu contextuel sur appui long
        for (const el of [dpad, btnJump]) this.listen(el, 'contextmenu', (e) => e.preventDefault());

        // Reflète l'état global (clavier compris) sur l'apparence des boutons
        this.cleanups.push(this.input.on('change', () => this.reflect()));
        this.cleanups.push(this.input.on('reset', () => this.clearPointers()));
    }

    detach() {
        this.cleanups.forEach((fn) => fn());
        this.cleanups = [];
    }

    listen(target, type, handler) {
        target.addEventListener(type, handler);
        this.cleanups.push(() => target.removeEventListener(type, handler));
    }

    // ---------------------------------------------------------------- Croix directionnelle

    directionAt(clientX) {
        const l = this.el.btnLeft.getBoundingClientRect();
        const r = this.el.btnRight.getBoundingClientRect();
        const middle = (l.right + r.left) / 2;
        return clientX < middle ? 'left' : 'right';
    }

    onDpadDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        this.onFirstTouch();
        try {
            this.el.dpad.setPointerCapture(e.pointerId);
        } catch {
            // Capture impossible (pointeur synthétique) : le suivi par pointermove reste fonctionnel.
        }
        this.dpadPointers.set(e.pointerId, this.directionAt(e.clientX));
        this.syncDpad();
    }

    onDpadMove(e) {
        if (!this.dpadPointers.has(e.pointerId)) return;
        const dir = this.directionAt(e.clientX);
        if (this.dpadPointers.get(e.pointerId) !== dir) {
            this.dpadPointers.set(e.pointerId, dir);
            this.syncDpad();
        }
    }

    onDpadEnd(e) {
        if (!this.dpadPointers.delete(e.pointerId)) return;
        this.syncDpad();
    }

    syncDpad() {
        const dirs = [...this.dpadPointers.values()];
        this.input.setAction('touch-dpad', 'left', dirs.includes('left'));
        this.input.setAction('touch-dpad', 'right', dirs.includes('right'));
    }

    // ---------------------------------------------------------------- Bouton de saut

    onJumpDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        this.onFirstTouch();
        try {
            this.el.btnJump.setPointerCapture(e.pointerId);
        } catch {
            // voir ci-dessus
        }
        this.jumpPointers.add(e.pointerId);
        this.input.setAction('touch-jump', 'jump', true);
    }

    onJumpEnd(e) {
        if (!this.jumpPointers.delete(e.pointerId)) return;
        if (this.jumpPointers.size === 0) this.input.setAction('touch-jump', 'jump', false);
    }

    // ---------------------------------------------------------------- Divers

    clearPointers() {
        this.dpadPointers.clear();
        this.jumpPointers.clear();
    }

    reflect() {
        this.el.btnLeft.classList.toggle('active', this.input.left);
        this.el.btnRight.classList.toggle('active', this.input.right);
        this.el.btnJump.classList.toggle('active', this.input.jumpHeld);
    }
}
