import { MODE } from '../core/GameState.js';

/** Correspondance nom d'événement 'sfx' -> méthode du moteur sonore. */
const SFX_METHODS = Object.freeze({
    jump: 'playJump',
    coin: 'playCoin',
    bump: 'playBump',
    brick: 'playBrickSmash',
    mushroomSpawn: 'playMushroomSpawn',
    powerUp: 'playPowerUp',
    powerDown: 'playPowerDown',
    stomp: 'playStomp',
    win: 'playWinFanfare',
    gameOver: 'playGameOver',
});

/**
 * Relie le bus d'événements du jeu au moteur sonore et gère le réglage « son coupé ».
 */
export class AudioManager {
    /**
     * @param {object} deps
     * @param {import('../core/events.js').EventBus} deps.bus
     * @param {import('./SoundEngine.js').SoundEngine} deps.engine
     * @param {import('../systems/Settings.js').Settings} deps.settings
     */
    constructor({ bus, engine, settings }) {
        this.engine = engine;
        this.settings = settings;
        this.engine.setMuted(settings.muted);
        this.unsubscribers = [
            bus.on('sfx', (name, arg) => this.play(name, arg)),
            bus.on('mode', (mode) => {
                if (mode === MODE.PAUSED) this.engine.suspend();
                else this.engine.resume();
            }),
        ];
    }

    play(name, arg) {
        const method = SFX_METHODS[name];
        if (method) this.engine[method](arg);
    }

    /** Débloque l'audio (geste utilisateur requis par les navigateurs). */
    unlock() {
        if (!this.engine.muted) this.engine.init();
    }

    toggleMute() {
        const muted = this.engine.toggleMute();
        this.settings.muted = muted;
        if (!muted) this.engine.init();
        return muted;
    }

    dispose() {
        this.unsubscribers.forEach((off) => off());
    }
}
