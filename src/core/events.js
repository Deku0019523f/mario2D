/**
 * Mini bus d'événements synchrone.
 *
 * Événements émis par le jeu (voir docs/ARCHITECTURE.md) :
 *  - 'sfx'      (name, arg)            effet sonore à jouer
 *  - 'fx:text'  ({ x, y, text, tone }) texte flottant à afficher (coordonnées MONDE)
 *  - 'mode'     (mode, info)           changement d'état (MENU, PLAYING, PAUSED, GAMEOVER, VICTORY…)
 */
export class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this.listeners = new Map();
    }

    /** Abonne `fn` à `event` ; renvoie la fonction de désabonnement. */
    on(event, fn) {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(fn);
        return () => this.off(event, fn);
    }

    off(event, fn) {
        const set = this.listeners.get(event);
        if (set) set.delete(fn);
    }

    emit(event, ...args) {
        const set = this.listeners.get(event);
        if (!set) return;
        // Copie : un écouteur peut se désabonner pendant l'émission.
        for (const fn of [...set]) fn(...args);
    }

    clear() {
        this.listeners.clear();
    }
}
