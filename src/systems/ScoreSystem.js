import { STORAGE } from '../data/config.js';

/** Score, pièces et meilleur score (persistant). */
export class ScoreSystem {
    /** @param {ReturnType<typeof import('./Storage.js').createStorage>} storage */
    constructor(storage) {
        this.storage = storage;
        this.score = 0;
        this.coins = 0;
        this.best = storage.getNumber(STORAGE.BEST_SCORE, 0);
    }

    /** Nouvelle partie : le meilleur score est conservé. */
    reset() {
        this.score = 0;
        this.coins = 0;
    }

    add(points) {
        this.score += points;
        if (this.score > this.best) {
            this.best = Math.floor(this.score);
            this.storage.set(STORAGE.BEST_SCORE, this.best);
        }
    }

    addCoin() {
        this.coins += 1;
    }
}
