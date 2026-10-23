import { PLAYER } from '../data/config.js';

/** Vies restantes. */
export class LivesSystem {
    constructor(initial = PLAYER.STARTING_LIVES) {
        this.initial = initial;
        this.lives = initial;
    }

    reset() {
        this.lives = this.initial;
    }

    /** Retire une vie ; renvoie le nombre de vies restantes. */
    lose() {
        this.lives -= 1;
        return this.lives;
    }

    get isDead() {
        return this.lives <= 0;
    }
}
