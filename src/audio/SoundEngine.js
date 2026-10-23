/**
 * Synthétiseur audio rétro 8-bit / 16-bit (Web Audio API).
 * Les fréquences, formes d'onde, durées et volumes sont ceux de la version d'origine ;
 * seul le code répétitif a été factorisé (`_tone`, `_arpeggio`).
 */
export class SoundEngine {
    constructor({ muted = false, AudioContextClass } = {}) {
        this.ctx = null;
        this.muted = muted;
        this.initialized = false;
        this.AudioContextClass = AudioContextClass;
    }

    /** À appeler depuis un geste utilisateur (les navigateurs mobiles l'exigent). */
    init() {
        if (this.initialized) {
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        try {
            const AudioCtx = this.AudioContextClass || globalThis.AudioContext || globalThis.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API non disponible :', e);
        }
    }

    setMuted(value) {
        this.muted = !!value;
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    /** Suspend le contexte (pause du jeu, onglet masqué). */
    suspend() {
        if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    /** Prêt à jouer ? (son actif + contexte disponible) */
    _ready() {
        if (this.muted) return false;
        this.init();
        return !!this.ctx;
    }

    /**
     * Joue une note : `steps` = [[fréquence, décalage (s), 'set' | 'exp'], ...].
     * L'enveloppe de volume descend exponentiellement de `vol` à ~0 sur `dur`.
     */
    _tone({ type, vol, dur, steps, t0 = 0, endVol = 0.001 }) {
        const ctx = this.ctx;
        const start = ctx.currentTime + t0;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        for (const [freq, offset, mode] of steps) {
            if (mode === 'exp') osc.frequency.exponentialRampToValueAtTime(freq, start + offset);
            else osc.frequency.setValueAtTime(freq, start + offset);
        }
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(endVol, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
    }

    /** Suite de notes de même durée espacées de `spacing` secondes. */
    _arpeggio(type, notes, vol, spacing, dur) {
        notes.forEach((freq, i) => {
            this._tone({ type, vol, dur, t0: i * spacing, steps: [[freq, 0, 'set']] });
        });
    }

    /** Mélodie : notes { f, t, d } (fréquence, début, durée). */
    _melody(type, notes, vol) {
        notes.forEach((n) => {
            this._tone({ type, vol, dur: n.d, t0: n.t, steps: [[n.f, 0, 'set']] });
        });
    }

    playJump(isSuper = false) {
        if (!this._ready()) return;
        const startFreq = isSuper ? 160 : 210;
        const endFreq = isSuper ? 540 : 660;
        this._tone({ type: 'square', vol: 0.14, dur: 0.21, steps: [[startFreq, 0, 'set'], [endFreq, 0.19, 'exp']] });
    }

    playCoin() {
        if (!this._ready()) return;
        // B5 (987.77 Hz) -> E6 (1318.51 Hz)
        this._tone({ type: 'sine', vol: 0.2, dur: 0.36, steps: [[987.77, 0, 'set'], [1318.51, 0.075, 'set']] });
    }

    playBump() {
        if (!this._ready()) return;
        this._tone({ type: 'triangle', vol: 0.24, dur: 0.12, steps: [[190, 0, 'set'], [75, 0.11, 'exp']] });
    }

    playBrickSmash() {
        if (!this._ready()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const bufferSize = Math.floor(ctx.sampleRate * 0.18);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
    }

    playMushroomSpawn() {
        if (!this._ready()) return;
        this._arpeggio('square', [330, 392, 659, 523, 587, 784], 0.11, 0.045, 0.06);
    }

    playPowerUp() {
        if (!this._ready()) return;
        // Arpège iconique de Super Champignon
        this._arpeggio('triangle', [330, 392, 659, 523, 587, 784, 587, 659, 784, 1046.5, 784, 1046.5], 0.2, 0.045, 0.07);
    }

    playPowerDown() {
        if (!this._ready()) return;
        this._arpeggio('sawtooth', [880, 740, 622, 523, 440, 349, 261], 0.14, 0.045, 0.06);
    }

    playStomp() {
        if (!this._ready()) return;
        this._tone({
            type: 'square',
            vol: 0.18,
            dur: 0.16,
            steps: [[420, 0, 'set'], [140, 0.06, 'exp'], [580, 0.14, 'exp']],
        });
    }

    playWinFanfare() {
        if (!this._ready()) return;
        this._melody('triangle', [
            { f: 523.25, t: 0.0, d: 0.12 },
            { f: 659.25, t: 0.13, d: 0.12 },
            { f: 783.99, t: 0.26, d: 0.12 },
            { f: 1046.5, t: 0.39, d: 0.22 },
            { f: 783.99, t: 0.63, d: 0.14 },
            { f: 1046.5, t: 0.8, d: 0.45 },
        ], 0.22);
    }

    playGameOver() {
        if (!this._ready()) return;
        this._melody('sawtooth', [
            { f: 523.25, t: 0.0, d: 0.16 },
            { f: 392.0, t: 0.2, d: 0.16 },
            { f: 329.63, t: 0.4, d: 0.22 },
            { f: 440.0, t: 0.65, d: 0.18 },
            { f: 493.88, t: 0.85, d: 0.18 },
            { f: 440.0, t: 1.05, d: 0.18 },
            { f: 392.0, t: 1.25, d: 0.4 },
        ], 0.15);
    }
}
